export type Role = 'admin' | 'verifikator' | 'surveyor' | 'public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: string;
  avatar_url?: string;
  created_at: string;
}

export type DatasetCategory =
  | 'Batas Administrasi'
  | 'Transportasi & Jalan'
  | 'Hidrologi & Sungai'
  | 'Fasilitas Umum & Sosial'
  | 'Pertanian & Perkebunan'
  | 'Kawasan Adat & Budaya'
  | 'Aset & Infrastruktur Desa'
  | 'Kebencanaan & Lingkungan';

export type VerificationStatus = 'draft' | 'menunggu_verifikasi' | 'terverifikasi' | 'ditolak';

export type SpatialGeometryType = 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';

export interface DataSource {
  id: string;
  name: string;
  short_name: string;
  category: 'resmi_big' | 'pejuang_lebak' | 'instansi_pemda' | 'akademisi';
  description: string;
  license: string;
  url?: string;
  is_official: boolean;
  contact_person?: string;
}

export interface AdministrativeRegion {
  id: string;
  code: string; // Kode Kemendagri, e.g. 36.02.01
  name: string;
  type: 'kecamatan' | 'desa';
  parent_code?: string;
  capital?: string; // Ibu kota kecamatan
  zone: 'Lebak Utara' | 'Lebak Tengah' | 'Lebak Selatan';
  area_sqkm: number;
  villages_count: number;
  centroid: [number, number]; // [lat, lng]
  bounds?: [[number, number], [number, number]];
  description: string;
}

export interface SpatialFeature {
  id: string;
  dataset_id: string;
  type: SpatialGeometryType;
  geometry: {
    type: SpatialGeometryType;
    coordinates: any;
  };
  properties: {
    name: string;
    category?: string;
    kecamatan?: string;
    desa?: string;
    status_kondisi?: string;
    surveyor?: string;
    survey_date?: string;
    verified?: boolean;
    photo_url?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: DatasetCategory;
  source_id: string;
  source_name: string;
  is_official_big: boolean;
  is_pejuang_lebak: boolean;
  is_demo: boolean;
  year: number;
  format: 'GeoJSON' | 'Shapefile' | 'KML' | 'CSV';
  coordinate_system: string; // e.g. WGS 84 (EPSG:4326) / UTM Zone 48S
  scale?: string; // e.g. 1:25.000
  status: VerificationStatus;
  published: boolean;
  download_allowed: boolean;
  feature_count: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  methodology: string;
  custodian: string;
  license: string;
  created_at: string;
  updated_at: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

export interface LayerSetting {
  id: string;
  dataset_id: string;
  title: string;
  visible: boolean;
  opacity: number;
  color: string;
  fillColor?: string;
  weight: number;
  zIndex: number;
}

export interface WmsService {
  id: string;
  name: string;
  provider: string;
  url: string;
  layers: string;
  format: string;
  crs: string;
  attribution: string;
  is_active: boolean;
  last_tested?: string;
  connection_status?: 'online' | 'unreachable' | 'untested';
}

export interface ImportJob {
  id: string;
  filename: string;
  file_format: string;
  file_size_kb: number;
  uploaded_at: string;
  uploaded_by: string;
  target_dataset_name: string;
  total_features: number;
  valid_features: number;
  invalid_features: number;
  status: 'preview' | 'completed' | 'failed';
  errors: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  action: string;
  target: string;
  details: string;
}
