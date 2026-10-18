import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  FileCode,
  Compass
} from 'lucide-react';
import { store } from '../../services/store';
import { Dataset, DatasetCategory, VerificationStatus } from '../../types';
import { featuresToGeoJSON, featuresToKML, featuresToCSV } from '../../services/gisUtils';

interface CatalogPageProps {
  onOpenMapWithDataset: (datasetId: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onOpenMapWithDataset }) => {
  const [datasets, setDatasets] = useState<Dataset[]>(() => store.getDatasets());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Subscribe to store updates
  React.useEffect(() => {
    const update = () => setDatasets(store.getDatasets());
    return store.subscribe(update);
  }, []);

  const categories: DatasetCategory[] = [
    'Batas Administrasi',
    'Transportasi & Jalan',
    'Hidrologi & Sungai',
    'Fasilitas Umum & Sosial',
    'Pertanian & Perkebunan',
    'Kawasan Adat & Budaya',
    'Aset & Infrastruktur Desa'
  ];

  const filteredDatasets = datasets.filter(d => {
    const matchQuery =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.custodian.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchSource =
      selectedSource === 'all' ||
      (selectedSource === 'big' && d.is_official_big) ||
      (selectedSource === 'pejuang' && d.is_pejuang_lebak);
    const matchStatus = selectedStatus === 'all' || d.status === selectedStatus;

    return matchQuery && matchCategory && matchSource && matchStatus;
  });

  const handleDownload = (dataset: Dataset, format: 'geojson' | 'kml' | 'csv') => {
    const features = store.getFeaturesByDatasetId(dataset.id);
    let content = '';
    let mimeType = 'text/plain';
    let ext = format;

    if (format === 'geojson') {
      content = JSON.stringify(featuresToGeoJSON(features, dataset.title), null, 2);
      mimeType = 'application/geo+json';
    } else if (format === 'kml') {
      content = featuresToKML(features, dataset.title);
      mimeType = 'application/vnd.google-earth.kml+xml';
    } else if (format === 'csv') {
      content = featuresToCSV(features);
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.slug || 'dataset'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
            Repositori Data Geospasial
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Katalog Data Geospasial Kabupaten Lebak
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Akses metadata komprehensif, standar SNI/ISO 19115, riwayat verifikasi, serta pengunduhan data vektor terbuka resmi BIG dan hasil pemetaan desa Sang Pejuang Lebak.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama dataset, deskripsi, atau wali data..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332] bg-white text-slate-700"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332] bg-white text-slate-700"
              >
                <option value="all">Semua Sumber</option>
                <option value="big">Resmi BIG (Ina-Geoportal)</option>
                <option value="pejuang">Sang Pejuang Lebak (Desa)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredDatasets.length}</strong> dari{' '}
              {datasets.length} dataset
            </span>

            {/* Status pills as functional buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Status:</span>
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedStatus === 'all' ? 'bg-[#1B4332] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedStatus('terverifikasi')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedStatus === 'terverifikasi' ? 'bg-[#1B4332] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Terverifikasi
              </button>
              <button
                onClick={() => setSelectedStatus('menunggu_verifikasi')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedStatus === 'menunggu_verifikasi' ? 'bg-[#1B4332] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Menunggu
              </button>
            </div>
          </div>
        </div>

        {/* Dataset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map(dataset => {
            const isVerified = dataset.status === 'terverifikasi';
            return (
              <div
                key={dataset.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Top metadata row without pills */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                    <span className="font-medium text-[#1B4332]">{dataset.category}</span>
                    <span className="font-mono tabular-nums">{dataset.year}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {dataset.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                    {dataset.description}
                  </p>

                  {/* Metadata key-values */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <p className="flex items-center justify-between">
                      <span>Sumber Data:</span>
                      <strong className="text-slate-700 font-medium">{dataset.source_name}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Sistem Koordinat:</span>
                      <strong className="text-slate-700 font-mono text-[11px]">WGS 84 / UTM 48S</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Jumlah Fitur:</span>
                      <strong className="text-slate-700 font-mono tabular-nums">{dataset.feature_count} objek</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Status Verifikasi:</span>
                      <span className={`font-semibold capitalize ${isVerified ? 'text-[#2D6A4F]' : 'text-amber-700'}`}>
                        {dataset.status.replace(/_/g, ' ')}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedDataset(dataset)}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Detail Metadata</span>
                  </button>

                  <button
                    onClick={() => onOpenMapWithDataset(dataset.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Buka di Peta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDatasets.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada dataset yang sesuai</p>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci atau bersihkan filter pencarian.</p>
          </div>
        )}
      </div>

      {/* Detail Metadata Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
                  {selectedDataset.category} · {selectedDataset.year}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedDataset.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali Data: {selectedDataset.custodian}
                </p>
              </div>
              <button
                onClick={() => setSelectedDataset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-600 leading-relaxed">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Deskripsi Singkat</h4>
                <p>{selectedDataset.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Metodologi & Pengambilan Data</h4>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-sans">
                  {selectedDataset.methodology}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sistem Referensi Koordinat</span>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedDataset.coordinate_system}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Skala / Resolusi</span>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedDataset.scale || '1:10.000 - 1:25.000'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Lisensi & Ketentuan Penggunaan</h4>
                <p>{selectedDataset.license}</p>
              </div>

              {selectedDataset.verification_notes && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-[#1B4332] uppercase font-semibold">Catatan Verifikator Spasial</span>
                  <p className="text-[#14261C] mt-0.5">{selectedDataset.verification_notes}</p>
                  {selectedDataset.verified_by && (
                    <p className="text-[10px] text-[#2D6A4F] mt-1 font-mono">
                      Diverifikasi oleh: {selectedDataset.verified_by} ({new Date(selectedDataset.verified_at || '').toLocaleDateString('id-ID')})
                    </p>
                  )}
                </div>
              )}

              {/* Download options */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm mb-2">Unduh Data Spasial</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownload(selectedDataset, 'geojson')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>GeoJSON (.geojson)</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDataset, 'kml')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>KML (.kml)</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDataset, 'csv')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Titik (.csv)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDataset(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const id = selectedDataset.id;
                  setSelectedDataset(null);
                  onOpenMapWithDataset(id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Buka di Peta GIS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
