import React from 'react';
import {
  MapPin,
  Layers,
  Database,
  ShieldCheck,
  ArrowRight,
  Compass,
  FileCheck2,
  TreePine,
  Building2,
  Droplet,
  ExternalLink
} from 'lucide-react';
import { store } from '../../services/store';
import { Dataset } from '../../types';

interface HomePageProps {
  onNavigate: (tab: string, datasetId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const datasets = store.getDatasets();
  const regions = store.getAdministrativeRegions();
  const features = store.getFeatures();

  // Metrics computed from real store
  const totalDatasets = datasets.length;
  const verifiedDatasets = datasets.filter(d => d.status === 'terverifikasi').length;
  const officialBigCount = datasets.filter(d => d.is_official_big).length;
  const pejuangLebakCount = datasets.filter(d => d.is_pejuang_lebak).length;
  const totalKecamatan = regions.length;

  const categories = [
    { name: 'Batas Administrasi', icon: Compass, count: datasets.filter(d => d.category === 'Batas Administrasi').length },
    { name: 'Transportasi & Jalan', icon: MapPin, count: datasets.filter(d => d.category === 'Transportasi & Jalan').length },
    { name: 'Hidrologi & Sungai', icon: Droplet, count: datasets.filter(d => d.category === 'Hidrologi & Sungai').length },
    { name: 'Fasilitas Umum & Sosial', icon: Building2, count: datasets.filter(d => d.category === 'Fasilitas Umum & Sosial').length },
    { name: 'Pertanian & Perkebunan', icon: TreePine, count: datasets.filter(d => d.category === 'Pertanian & Perkebunan').length },
    { name: 'Kawasan Adat & Budaya', icon: ShieldCheck, count: datasets.filter(d => d.category === 'Kawasan Adat & Budaya').length },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Section */}
      <section className="relative bg-[#1B4332] text-white overflow-hidden">
        {/* Background Image with Measured Contrast Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_lebak_landscape_1792302294955.jpg"
            alt="Bentang Alam Pegunungan dan Persawahan Kabupaten Lebak Banten"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14261C] via-[#14261C]/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#74C69D] bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-md border border-white/15">
              <span>Kabupaten Lebak · Provinsi Banten</span>
              <span aria-hidden="true">·</span>
              <span>Ina-Geoportal & Pejuang Lebak</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
              Jelajahi Lebak Melalui Data Geospasial
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
              Platform geospasial terintegrasi yang menyatukan data resmi Badan Informasi Geospasial (BIG) dan pemetaan partisipatif desa oleh Sang Pejuang Lebak. "Menyatukan Data, Memetakan Lebak."
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('map')}
                className="px-6 py-3 text-sm font-semibold text-[#14261C] bg-[#52B788] hover:bg-[#74C69D] rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>Buka Peta Interaktif</span>
              </button>

              <button
                onClick={() => onNavigate('catalog')}
                className="px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Database className="w-4 h-4" />
                <span>Telusuri Katalog Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Quantitative Metrics Row (Strictly from real database) */}
        <div className="relative z-10 border-t border-white/15 bg-[#14261C]/75 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                  {totalDatasets}
                </p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Dataset Geospasial</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-[#52B788] tabular-nums">
                  {totalKecamatan}
                </p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Kecamatan Terdata</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                  {features.length}
                </p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Fitur Spasial Aktif</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-[#74C69D] tabular-nums">
                  {verifiedDatasets}
                </p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Dataset Terverifikasi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Pillar Pillars: BIG & Sang Pejuang Lebak */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
            Integritas & Kolaborasi Data
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Dua Pilar Sumber Data GEORuhay
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Setiap layer memiliki identitas sumber, tahun data, penanggung jawab, dan status verifikasi yang transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Pillar 1: BIG */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded inline-flex mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Data Resmi Nasional</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Badan Informasi Geospasial (BIG)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Penyedia rujukan tunggal data geospasial dasar Indonesia melalui Ina-Geoportal. Meliputi batas administrasi kabupaten/kecamatan, garis pantai, hidrologi Sungai Ciujung, jaring kontrol geodesi, serta toponimi rupabumi resmi.
              </p>
              <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <p>· Skala rujukan: 1:25.000 & 1:50.000</p>
                <p>· Sistem referensi: WGS 84 (EPSG:4326) / Proyeksi UTM Zone 48S</p>
                <p>· Dataset terhubung: {officialBigCount} dataset resmi</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Ina-Geoportal BIG</span>
              <button
                onClick={() => onNavigate('catalog')}
                className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
              >
                <span>Lihat Data BIG</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2: Sang Pejuang Lebak */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1B4332] bg-[#D8F3DC] px-2.5 py-1 rounded inline-flex mb-4">
                <MapPin className="w-3.5 h-3.5" />
                <span>Pemetaan Partisipatif Desa</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Sang Pejuang Lebak
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Gerakan relawan dan masyarakat desa yang memetakan aset desa dari akar rumput: wilayah adat Kanekes (Baduy), jalan usaha tani (JUT), jembatan gantung desa, saluran irigasi sawah rakyat, dan fasilitas publik lokal.
              </p>
              <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <p>· Survei lapangan partisipatif dengan GPS Geodetik & aplikasi terbuka</p>
                <p>· Berita acara musyawarah adat & persetujuan desa</p>
                <p>· Dataset terhubung: {pejuangLebakCount} dataset komunitas</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Pemetaan Desa Mandiri</span>
              <button
                onClick={() => onNavigate('catalog')}
                className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
              >
                <span>Lihat Data Desa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase: Baduy Heritage & Field Survey */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
                Kearifan Geospasial Lokal
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Memetakan Batas Adat Baduy & Ruang Hidup Masyarakat Lebak
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Di pedalaman Leuwidamar, masyarakat adat Kanekes menjaga hutan titipan dan tata ruang tradisi yang telah bertahan berabad-abad. Melalui pemetaan partisipatif Sang Pejuang Lebak, batas wilayah adat seluas 5.101 hektar didokumentasikan dengan penuh penghormatan terhadap norma hukum adat.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('map', 'ds-pejuang-01')}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lihat Peta Wilayah Adat Kanekes di GIS</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img
                  src="/src/assets/images/baduy_cultural_heritage_1792302296753.jpg"
                  alt="Permukiman Adat Kanekes Baduy Kabupaten Lebak"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3 bg-white">
                  <p className="text-xs font-semibold text-slate-800">Wilayah Adat Kanekes</p>
                  <p className="text-[11px] text-slate-500">Kecamatan Leuwidamar</p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img
                  src="/src/assets/images/gis_field_survey_lebak_1792302295569.jpg"
                  alt="Surveyor Lapangan Sang Pejuang Lebak"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3 bg-white">
                  <p className="text-xs font-semibold text-slate-800">Survei Lapangan RTK</p>
                  <p className="text-[11px] text-slate-500">Pemetaan Partisipatif Desa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kategori Data Geospasial
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Klasifikasi layer tematik yang tersedia untuk analisis dan visualisasi
            </p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
          >
            <span>Semua Dataset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate('catalog')}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#1B4332] hover:shadow-xs transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EBF7EE] text-[#1B4332] group-hover:bg-[#1B4332] group-hover:text-white transition-colors flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-[#1B4332]">
                  {cat.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1 tabular-nums">
                  {cat.count} dataset
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Datasets from Real Store */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          Dataset Geospasial Terbaru
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {datasets.slice(0, 3).map(dataset => (
            <div
              key={dataset.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>{dataset.category}</span>
                  <span className="font-mono">{dataset.year}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {dataset.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                  {dataset.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-[#2D6A4F] font-medium">
                  {dataset.source_name}
                </span>
                <button
                  onClick={() => onNavigate('map', dataset.id)}
                  className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
                >
                  <span>Buka Peta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
