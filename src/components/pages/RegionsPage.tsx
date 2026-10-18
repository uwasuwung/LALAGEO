import React, { useState } from 'react';
import { Search, MapPin, Compass, ArrowRight, Layers, Building, Eye } from 'lucide-react';
import { LEBAK_KECAMATAN_DATA } from '../../data/administrativeRegions';
import { AdministrativeRegion } from '../../types';

interface RegionsPageProps {
  onZoomToRegion: (region: AdministrativeRegion) => void;
}

export const RegionsPage: React.FC<RegionsPageProps> = ({ onZoomToRegion }) => {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const filtered = LEBAK_KECAMATAN_DATA.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.capital?.toLowerCase().includes(search.toLowerCase()) ||
      r.code.includes(search);
    const matchZone = selectedZone === 'all' || r.zone === selectedZone;
    return matchSearch && matchZone;
  });

  const totalVillages = LEBAK_KECAMATAN_DATA.reduce((acc, curr) => acc + curr.villages_count, 0);
  const totalArea = LEBAK_KECAMATAN_DATA.reduce((acc, curr) => acc + curr.area_sqkm, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
            Hierarki Administrasi Wilayah
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            28 Kecamatan Kabupaten Lebak
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Eksplorasi referensi geospasial kode wilayah Kemendagri, ibu kota kecamatan, jumlah desa, luas wilayah, dan koordinat sentroid di Kabupaten Lebak, Banten.
          </p>
        </div>

        {/* Statistical Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">Jumlah Kecamatan</span>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">28</p>
            <p className="text-[11px] text-[#2D6A4F] mt-0.5">3 Zona Geografis</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">Total Desa / Kelurahan</span>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{totalVillages}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">340 Desa + 5 Kelurahan</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">Luas Daratan Wilayah</span>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{Math.round(totalArea).toLocaleString('id-ID')} km²</p>
            <p className="text-[11px] text-slate-500 mt-0.5">342.656 Hektar</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">Kecamatan Terluas</span>
            <p className="text-xl font-bold text-[#1B4332]">Cibeber</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">395,20 km² (TNGHS)</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kecamatan, ibu kota, atau kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 mr-2">Zona:</span>
            {['all', 'Lebak Utara', 'Lebak Tengah', 'Lebak Selatan'].map(zone => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedZone === zone
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {zone === 'all' ? 'Semua Zona' : zone}
              </button>
            ))}
          </div>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(region => (
            <div
              key={region.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-600">{region.code}</span>
                  <span className="text-[#1B4332] font-medium">{region.zone}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Kecamatan {region.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ibu Kota: <strong className="text-slate-700">{region.capital || '-'}</strong>
                </p>

                <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                  {region.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Luas Wilayah</span>
                    <p className="font-mono font-semibold text-slate-800 tabular-nums">
                      {region.area_sqkm.toFixed(2)} km²
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Jumlah Desa</span>
                    <p className="font-mono font-semibold text-slate-800 tabular-nums">
                      {region.villages_count} Desa
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  Sentroid: [{region.centroid[0].toFixed(4)}, {region.centroid[1].toFixed(4)}]
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onZoomToRegion(region)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Lihat di Peta GIS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
