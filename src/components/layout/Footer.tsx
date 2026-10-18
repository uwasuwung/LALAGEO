import React from 'react';
import { MapPin, ExternalLink, ShieldCheck, Database } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#14261C] text-slate-300 border-t border-[#233C2F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#52B788] text-[#14261C] flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">GEORuhay</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem Informasi Geospasial Kabupaten Lebak, Provinsi Banten. "Menyatukan Data, Memetakan Lebak."
            </p>
            <div className="text-[11px] text-[#74C69D] flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standar Akurasi & Integritas Spasial Terverifikasi</span>
            </div>
          </div>

          {/* Col 2: Sumber Data */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Sumber Data Utama</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://tanahair.indonesia.go.id"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Badan Informasi Geospasial (BIG)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="text-slate-300">Sang Pejuang Lebak (Pemetaan Desa)</span>
              </li>
              <li>
                <span className="text-slate-400">Dinas PUPR & Bappeda Kab. Lebak</span>
              </li>
              <li>
                <span className="text-slate-400">Lembaga Adat Urang Kanekes</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigasi Modul */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Navigasi Modul</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('map')} className="hover:text-white transition-colors">
                  Peta Interaktif GIS
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  Katalog Dataset Geospasial
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('regions')} className="hover:text-white transition-colors">
                  Eksplorasi 28 Wilayah Kecamatan
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  Metodologi & Filosofi Ruhay
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Kebijakan & Lisensi */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Ketentuan & Hak Cipta</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Data resmi disajikan sesuai lisensi terbuka pemerintah. Data survei partisipatif desa dilindungi lisensi CC BY-SA 4.0. Data berlabel [DATA DEMO] khusus untuk pengujian sistem.
            </p>
            <p className="text-[11px] text-slate-500 mt-3 font-mono">
              Sistem Koordinat: WGS 84 / UTM 48S
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#233C2F] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} GEORuhay — Inisiatif Kolaborasi Geospasial Kabupaten Lebak.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400">Kebijakan Privasi</span>
            <span>·</span>
            <span className="hover:text-slate-400">Syarat Penggunaan Data</span>
            <span>·</span>
            <span className="text-[#52B788]">Versi 1.2 Terverifikasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
