import React, { useState } from 'react';
import { Database, Download, Copy, Check, Shield } from 'lucide-react';

export const POSTGIS_SQL_SCHEMA = `-- ==============================================================================
-- GEORuhay — SISTEM INFORMASI GEOSPASIAL KABUPATEN LEBAK, PROVINSI BANTEN
-- PostgreSQL & PostGIS Database Schema & Supabase RLS Migration
-- Target SRID: EPSG:4326 (WGS 84 Geografis) & EPSG:32748 (UTM Zone 48S Proyeksi)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('superadmin', 'verifikator', 'surveyor', 'public');
CREATE TYPE verification_status AS ENUM ('draft', 'menunggu_verifikasi', 'terverifikasi', 'ditolak');
CREATE TYPE data_source_type AS ENUM ('resmi_big', 'pejuang_lebak', 'instansi_pemda', 'akademisi');
CREATE TYPE spatial_format AS ENUM ('GeoJSON', 'Shapefile', 'KML', 'CSV');

-- 3. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    organization TEXT NOT NULL DEFAULT 'Komunitas Pejuang Lebak',
    role user_role NOT NULL DEFAULT 'public',
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ADMINISTRATIVE REGIONS (Kabupaten, 28 Kecamatan, 345 Desa/Kelurahan)
CREATE TABLE IF NOT EXISTS public.administrative_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(16) UNIQUE NOT NULL, -- Kode Wilayah Kemendagri (e.g. 36.02.01)
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('kabupaten', 'kecamatan', 'desa', 'kelurahan')),
    parent_code VARCHAR(16) REFERENCES public.administrative_regions(code),
    capital VARCHAR(100),
    zone VARCHAR(50), -- Lebak Utara, Lebak Tengah, Lebak Selatan
    area_sqkm NUMERIC(10, 2),
    villages_count INT DEFAULT 0,
    centroid GEOMETRY(Point, 4326),
    boundary GEOMETRY(MultiPolygon, 4326),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_regions_geom ON public.administrative_regions USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_admin_regions_code ON public.administrative_regions(code);

-- 5. DATA SOURCES (BIG, Sang Pejuang Lebak, Bappeda)
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    category data_source_type NOT NULL,
    description TEXT,
    license TEXT NOT NULL,
    website_url TEXT,
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    contact_person TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DATASET CATEGORIES
CREATE TABLE IF NOT EXISTS public.dataset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DATASETS (Metadata Katalog SNI / ISO 19115)
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.dataset_categories(id),
    source_id UUID REFERENCES public.data_sources(id),
    is_official_big BOOLEAN NOT NULL DEFAULT FALSE,
    is_pejuang_lebak BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    year INT NOT NULL,
    format spatial_format NOT NULL DEFAULT 'GeoJSON',
    coordinate_system VARCHAR(100) NOT NULL DEFAULT 'WGS 84 (EPSG:4326)',
    scale VARCHAR(50),
    status verification_status NOT NULL DEFAULT 'draft',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    download_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    feature_count INT NOT NULL DEFAULT 0,
    bbox GEOMETRY(Polygon, 4326),
    methodology TEXT NOT NULL,
    custodian TEXT NOT NULL,
    license TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_published ON public.datasets(published);

-- 8. SPATIAL FEATURES (Penyimpanan Fitur Vektor Terpusat dengan PostGIS)
CREATE TABLE IF NOT EXISTS public.spatial_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    geom_type VARCHAR(50) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Spatial GiST Index for high-performance spatial queries
CREATE INDEX IF NOT EXISTS idx_spatial_features_geom ON public.spatial_features USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_spatial_features_dataset_id ON public.spatial_features(dataset_id);
CREATE INDEX IF NOT EXISTS idx_spatial_features_props ON public.spatial_features USING GIN(properties);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_regions ENABLE ROW LEVEL SECURITY;

-- Public can read published datasets
CREATE POLICY "Public read published datasets"
    ON public.datasets FOR SELECT
    USING (published = true);

-- Authenticated Verifiers and Admins can read all and update status
CREATE POLICY "Staff manage all datasets"
    ON public.datasets FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can read features of published datasets
CREATE POLICY "Public read features of published datasets"
    ON public.spatial_features FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets d
            WHERE d.id = spatial_features.dataset_id AND d.published = true
        )
    );

-- Everyone can read administrative regions
CREATE POLICY "Public read administrative regions"
    ON public.administrative_regions FOR SELECT
    USING (true);

-- 11. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dataset_timestamp
BEFORE UPDATE ON public.datasets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();
`;

export const PostgisMigrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGIS_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([POSTGIS_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'georuhay_postgis_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#1B4332]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Skema Database PostGIS & Supabase RLS
              </h3>
              <p className="text-xs text-slate-500">
                Migrasi SQL produksi dengan indeks spasial GiST, tabel relasional, dan kebijakan keamanan.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-900 text-slate-200 font-mono text-xs">
          <pre className="whitespace-pre-wrap">{POSTGIS_SQL_SCHEMA}</pre>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-[#2D6A4F]" />
            <span>Siap dijalankan di PostgreSQL 15+ / Supabase PostGIS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin SQL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .SQL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
