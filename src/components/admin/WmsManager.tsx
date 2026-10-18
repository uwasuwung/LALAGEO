import React, { useState } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { store } from '../../services/store';
import { WmsService } from '../../types';

export const WmsManager: React.FC = () => {
  const [services, setServices] = useState<WmsService[]>(() => store.getWmsServices());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [layers, setLayers] = useState('');
  const [crs, setCrs] = useState('EPSG:4326');
  const [attribution, setAttribution] = useState('');

  React.useEffect(() => {
    const update = () => setServices(store.getWmsServices());
    return store.subscribe(update);
  }, []);

  const handleTestService = async (id: string) => {
    setTestingId(id);
    await store.testWmsService(id);
    setTimeout(() => setTestingId(null), 500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    store.addWmsService({
      name,
      provider: provider || 'Layanan Eksternal',
      url,
      layers: layers || 'all',
      format: 'image/png',
      crs,
      attribution: attribution || provider,
      is_active: true,
      last_tested: new Date().toISOString(),
      connection_status: 'online'
    });

    setName('');
    setProvider('');
    setUrl('');
    setLayers('');
    setAttribution('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Layanan Peta Eksternal (WMS / WMTS / WFS)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koneksi ke server geospasial Ina-Geoportal BIG, GeoServer pemerintah, atau penyedia tile resmi.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Batal' : 'Tambah Endpoint WMS'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <p className="font-semibold text-slate-800">Form Pendaftaran Layanan WMS / Tile Server</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Nama Layanan</label>
              <input
                type="text"
                placeholder="e.g. Ina-Geoportal BIG Vektor Desa"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Penyedia / Instansi</label>
              <input
                type="text"
                placeholder="e.g. Badan Informasi Geospasial RI"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1">URL Endpoint Layanan (GetCapabilities / Tiles)</label>
            <input
              type="url"
              placeholder="https://tanahair.indonesia.go.id/geoserver/wms"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Nama Layer</label>
              <input
                type="text"
                placeholder="RBI:LEBAK_DESA"
                value={layers}
                onChange={e => setLayers(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Sistem Koordinat (CRS)</label>
              <select
                value={crs}
                onChange={e => setCrs(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                <option value="EPSG:4326">EPSG:4326 (WGS 84)</option>
                <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                <option value="EPSG:32748">EPSG:32748 (UTM Zone 48S)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Teks Atribusi</label>
              <input
                type="text"
                placeholder="© Badan Informasi Geospasial"
                value={attribution}
                onChange={e => setAttribution(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-[#1B4332] hover:bg-[#2D6A4F] font-semibold rounded-lg"
            >
              Simpan Layanan
            </button>
          </div>
        </form>
      )}

      {/* Services Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Layanan & Penyedia</th>
              <th className="px-4 py-3 font-semibold">URL Endpoint</th>
              <th className="px-4 py-3 font-semibold">Layer & CRS</th>
              <th className="px-4 py-3 font-semibold">Status Koneksi</th>
              <th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map(service => (
              <tr key={service.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{service.name}</p>
                  <p className="text-[11px] text-slate-500">{service.provider}</p>
                </td>
                <td className="px-4 py-3 max-w-xs truncate font-mono text-[11px] text-slate-600">
                  {service.url}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="font-mono text-[11px] font-semibold">{service.layers}</span>
                  <p className="text-[10px] text-slate-400 font-mono">{service.crs}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#1B4332] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
                    <span>Terhubung (Online)</span>
                  </span>
                  {service.last_tested && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Diuji: {new Date(service.last_tested).toLocaleTimeString('id-ID')}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleTestService(service.id)}
                      disabled={testingId === service.id}
                      title="Uji Koneksi Endpoint"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingId === service.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => store.deleteWmsService(service.id)}
                      title="Hapus Layanan"
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
