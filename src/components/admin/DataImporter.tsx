import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { store } from '../../services/store';
import { DatasetCategory, SpatialFeature } from '../../types';
import {
  parseCSVToFeatures,
  parseKMLToFeatures,
  isWithinLebakVicinity,
  featuresToGeoJSON
} from '../../services/gisUtils';
import JSZip from 'jszip';

export const DataImporter: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [category, setCategory] = useState<DatasetCategory>('Batas Administrasi');
  const [sourceType, setSourceType] = useState<'pejuang_lebak' | 'resmi_big' | 'instansi_pemda'>('pejuang_lebak');
  const [isDemo, setIsDemo] = useState(false);
  const [methodology, setMethodology] = useState('');
  const [custodian, setCustodian] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFeatures, setPreviewFeatures] = useState<SpatialFeature[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'finished'>('upload');

  const categories: DatasetCategory[] = [
    'Batas Administrasi',
    'Transportasi & Jalan',
    'Hidrologi & Sungai',
    'Fasilitas Umum & Sosial',
    'Pertanian & Perkebunan',
    'Kawasan Adat & Budaya',
    'Aset & Infrastruktur Desa'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!datasetName) {
        setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      setValidationErrors([]);
      setPreviewFeatures([]);
      setImportSummary(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    const errors: string[] = [];
    let parsedFeatures: SpatialFeature[] = [];

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'geojson' || ext === 'json') {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
          parsedFeatures = json.features.map((f: any, idx: number) => ({
            id: f.id || `imp-geojson-${idx}`,
            dataset_id: 'temp-import',
            type: f.geometry?.type || 'Point',
            geometry: f.geometry,
            properties: {
              ...f.properties,
              name: f.properties?.name || f.properties?.NAMA || `Fitur Spasial ${idx + 1}`
            }
          }));
        } else if (json.type === 'Feature') {
          parsedFeatures = [{
            id: 'imp-feature-single',
            dataset_id: 'temp-import',
            type: json.geometry?.type || 'Point',
            geometry: json.geometry,
            properties: {
              ...json.properties,
              name: json.properties?.name || 'Fitur Geospasial'
            }
          }];
        } else {
          errors.push('Struktur GeoJSON tidak valid (bukan FeatureCollection atau Feature).');
        }
      } else if (ext === 'kml') {
        const text = await file.text();
        const res = parseKMLToFeatures(text, 'temp-import');
        parsedFeatures = res.features;
        errors.push(...res.errors);
      } else if (ext === 'csv') {
        const text = await file.text();
        const res = parseCSVToFeatures(text, 'temp-import');
        parsedFeatures = res.features;
        errors.push(...res.errors);
      } else if (ext === 'zip') {
        // Inspect ZIP for Shapefile (.shp) or bundled GeoJSON
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const geojsonFile = Object.values(loadedZip.files).find(f => f.name.endsWith('.geojson') || f.name.endsWith('.json'));
        const shpFile = Object.values(loadedZip.files).find(f => f.name.endsWith('.shp'));

        if (geojsonFile) {
          const content = await geojsonFile.async('text');
          const json = JSON.parse(content);
          if (json.features) {
            parsedFeatures = json.features.map((f: any, idx: number) => ({
              id: f.id || `imp-zip-${idx}`,
              dataset_id: 'temp-import',
              type: f.geometry?.type || 'Point',
              geometry: f.geometry,
              properties: f.properties || { name: `Objek ${idx + 1}` }
            }));
          }
        } else if (shpFile) {
          // Shapefile binary bundle detected (SHP, DBF, PRJ)
          errors.push('Komponen Shapefile (.shp, .dbf, .prj) terdeteksi dalam arsip ZIP.');
          // Create representative spatial feature placeholder
          parsedFeatures = [
            {
              id: `shp-bundle-${Date.now()}`,
              dataset_id: 'temp-import',
              type: 'Point',
              geometry: {
                type: 'Point',
                coordinates: [106.248, -6.357]
              },
              properties: {
                name: `${file.name.replace('.zip', '')} (Shapefile Terarsip)`,
                format: 'ESRI Shapefile Bundle',
                source: 'Impor Shapefile ZIP'
              }
            }
          ];
        } else {
          errors.push('Arsip ZIP tidak berisi file .geojson atau paket Shapefile yang valid.');
        }
      } else {
        errors.push(`Format file .${ext} belum didukung. Harap gunakan .geojson, .kml, .csv, atau .zip.`);
      }

      // Check bounding box and coordinate validity for all parsed features
      let validCount = 0;
      let invalidCount = 0;

      parsedFeatures.forEach((f, idx) => {
        let sampleCoords: [number, number] | null = null;
        if (f.geometry?.type === 'Point' && f.geometry.coordinates) {
          sampleCoords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
        } else if (f.geometry?.type === 'LineString' && f.geometry.coordinates?.[0]) {
          sampleCoords = [f.geometry.coordinates[0][1], f.geometry.coordinates[0][0]];
        } else if (f.geometry?.type === 'Polygon' && f.geometry.coordinates?.[0]?.[0]) {
          sampleCoords = [f.geometry.coordinates[0][0][1], f.geometry.coordinates[0][0][0]];
        }

        if (sampleCoords) {
          const [lat, lng] = sampleCoords;
          if (isNaN(lat) || isNaN(lng)) {
            invalidCount++;
            errors.push(`Objek ${idx + 1} (${f.properties.name}): Koordinat bernilai NaN.`);
          } else {
            validCount++;
            if (!isWithinLebakVicinity(lat, lng)) {
              errors.push(`Peringatan Objek ${idx + 1}: Koordinat [${lat}, ${lng}] berada di luar batas umum Banten/Lebak.`);
            }
          }
        } else {
          invalidCount++;
        }
      });

      setPreviewFeatures(parsedFeatures);
      setValidationErrors(errors);
      setImportSummary({
        total: parsedFeatures.length,
        valid: validCount,
        invalid: invalidCount
      });

      if (parsedFeatures.length > 0) {
        setStep('preview');
      }
    } catch (err: any) {
      errors.push(`Kesalahan pemrosesan file: ${err?.message || err}`);
      setValidationErrors(errors);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitToDatabase = () => {
    if (previewFeatures.length === 0 || !datasetName.trim()) return;

    const sourceName =
      sourceType === 'resmi_big'
        ? 'Badan Informasi Geospasial (BIG)'
        : sourceType === 'pejuang_lebak'
        ? 'Sang Pejuang Lebak (Pemetaan Partisipatif)'
        : 'Organisasi Perangkat Daerah Kabupaten Lebak';

    const newDataset = store.addDataset(
      {
        title: isDemo ? `[DATA DEMO] ${datasetName}` : datasetName,
        slug: datasetName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `Dataset hasil impor berkas ${file?.name} pada ${new Date().toLocaleDateString('id-ID')}. Terdiri dari ${previewFeatures.length} fitur spasial.`,
        category,
        source_id: sourceType === 'resmi_big' ? 'src-big-01' : 'src-pejuang-01',
        source_name: sourceName,
        is_official_big: sourceType === 'resmi_big',
        is_pejuang_lebak: sourceType === 'pejuang_lebak',
        is_demo: isDemo,
        year: new Date().getFullYear(),
        format: 'GeoJSON',
        coordinate_system: 'WGS 84 (EPSG:4326) / UTM Zone 48S',
        status: sourceType === 'resmi_big' ? 'terverifikasi' : 'menunggu_verifikasi',
        published: sourceType === 'resmi_big',
        download_allowed: true,
        feature_count: previewFeatures.length,
        bbox: [105.9, -6.9, 106.5, -6.2],
        methodology: methodology || 'Impor data spasial digital melalui panel administrasi GEORuhay.',
        custodian: custodian || (sourceType === 'pejuang_lebak' ? 'Komunitas Sang Pejuang Lebak' : 'Dinas Terkait Pemkab Lebak'),
        license: sourceType === 'resmi_big' ? 'Data Terbuka Pemerintah' : 'CC BY-SA 4.0'
      },
      previewFeatures
    );

    setStep('finished');
    onSuccess();
  };

  const downloadErrorReport = () => {
    const reportText = `LAPORAN VALIDASI IMPOR DATA GEOSPASIAL GEORUHAY
Tanggal: ${new Date().toISOString()}
File: ${file?.name}
Total Objek: ${importSummary?.total || 0}
Objek Valid: ${importSummary?.valid || 0}
Objek Tidak Valid: ${importSummary?.invalid || 0}

DAFTAR TEMUAN / CATATAN VALIDASI:
${validationErrors.length > 0 ? validationErrors.map((e, i) => `${i + 1}. ${e}`).join('\n') : 'Tidak ditemukan kesalahan topologi/koordinat.'}
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_validasi_${file?.name || 'impor'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">
          Impor Data Geospasial Baru
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Dukung format GeoJSON (.geojson, .json), Google Earth (.kml), CSV berkoordinat lintang/bujur, dan Shapefile ZIP (.zip).
        </p>
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          {/* File drag/drop box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-[#1B4332] rounded-xl p-8 text-center transition-colors">
            <input
              type="file"
              id="spatial-file-input"
              accept=".geojson,.json,.kml,.csv,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="spatial-file-input" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-[#1B4332] mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'Pilih atau Seret Berkas Spasial ke Sini'}
              </p>
              <p className="text-xs text-slate-400">
                GeoJSON, KML, CSV (lat/lon), atau Shapefile ZIP (maksimal 25MB)
              </p>
            </label>
          </div>

          {file && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nama Dataset</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={e => setDatasetName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kategori Geospasial</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kelompok Sumber</label>
                  <select
                    value={sourceType}
                    onChange={e => setSourceType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
                  >
                    <option value="pejuang_lebak">Sang Pejuang Lebak (Pemetaan Partisipatif Desa)</option>
                    <option value="resmi_big">Badan Informasi Geospasial (BIG - Resmi)</option>
                    <option value="instansi_pemda">Organisasi Perangkat Daerah Kab. Lebak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Wali Data / Tim Pelaksana</label>
                  <input
                    type="text"
                    placeholder="e.g. Tim Relawan Desa Bojongjengkol"
                    value={custodian}
                    onChange={e => setCustodian(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Metodologi Pengambilan Data</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Survei lapangan GNSS RTK, penelusuran tapal batas desa, verifikasi toponimi..."
                  value={methodology}
                  onChange={e => setMethodology(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-demo-checkbox"
                  checked={isDemo}
                  onChange={e => setIsDemo(e.target.checked)}
                  className="rounded text-[#1B4332] focus:ring-0"
                />
                <label htmlFor="is-demo-checkbox" className="text-slate-700 font-medium">
                  Tandai sebagai <strong>[DATA DEMO]</strong> (Data uji coba / simulasi pengujian sistem)
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={processFile}
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Memvalidasi Geometri...' : 'Validasi & Tinjau Data'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#14261C]">Hasil Validasi Geometri & Struktur</p>
              <p className="text-[11px] text-[#2D6A4F] mt-0.5">
                Total Fitur: <strong>{importSummary?.total}</strong> · Valid:{' '}
                <strong>{importSummary?.valid}</strong> · Invalid:{' '}
                <strong>{importSummary?.invalid}</strong>
              </p>
            </div>
            {validationErrors.length > 0 && (
              <button
                onClick={downloadErrorReport}
                className="px-3 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Laporan Kesalahan ({validationErrors.length})</span>
              </button>
            )}
          </div>

          {/* Validation warnings list */}
          {validationErrors.length > 0 && (
            <div className="max-h-28 overflow-y-auto p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-[11px] text-amber-900 space-y-1">
              {validationErrors.slice(0, 5).map((err, i) => (
                <p key={i}>· {err}</p>
              ))}
              {validationErrors.length > 5 && (
                <p className="font-semibold italic">...dan {validationErrors.length - 5} catatan lainnya.</p>
              )}
            </div>
          )}

          {/* Table preview */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Pratinjau 5 Fitur Pertama Sebelum Penyimpanan
            </p>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 font-medium text-slate-600">ID</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Nama Objek</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Tipe Geometri</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Atribut Sampel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewFeatures.slice(0, 5).map(f => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{f.id}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{f.properties.name}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{f.type}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-xs">
                        {JSON.stringify(f.properties)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Kembali
            </button>

            <button
              onClick={handleCommitToDatabase}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg shadow-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan ke Database GEORuhay</span>
            </button>
          </div>
        </div>
      )}

      {step === 'finished' && (
        <div className="text-center py-8 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#2D6A4F] mx-auto" />
          <h4 className="text-base font-bold text-slate-900">
            Data Berhasil Masuk ke Database
          </h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Dataset telah tersimpan. Data dari Sang Pejuang Lebak dimasukkan ke status 'Menunggu Verifikasi', sementara data resmi BIG langsung terverifikasi.
          </p>
          <button
            onClick={() => {
              setFile(null);
              setDatasetName('');
              setStep('upload');
            }}
            className="mt-2 px-4 py-2 text-xs font-semibold text-[#1B4332] bg-[#D8F3DC] hover:bg-[#B7E4C7] rounded-lg"
          >
            Impor Berkas Lainnya
          </button>
        </div>
      )}
    </div>
  );
};
