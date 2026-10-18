import React from 'react';
import { ShieldCheck, Compass, Heart, BookOpen, Layers, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div>
          <span className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
            Tentang Platform
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            GEORuhay: Menyatukan Data, Memetakan Lebak
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Sistem Informasi Geospasial mandiri untuk Kabupaten Lebak, Provinsi Banten yang mengolaborasikan data resmi negara dengan kedaulatan data desa.
          </p>
        </div>

        {/* Filosofi Ruhay */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1B4332]">
            <Heart className="w-5 h-5 text-[#52B788]" />
            <h2 className="text-xl font-bold text-slate-900">Filosofi Nama "GEORuhay"</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Kata <strong>"Ruhay"</strong> berakar dari perbendaharaan bahasa Sunda yang melambangkan <em>bara api yang menyala terang, hangat, dan tak padam</em>. Dalam konteks sistem ini, GEORuhay menjadi simbol semangat yang terus berkobar dari masyarakat, surveyor desa, dan penggiat geospasial untuk memperjuangkan pemetaan yang adil, presisi, dan bermanfaat langsung bagi kesejahteraan warga Kabupaten Lebak.
          </p>
        </div>

        {/* 2 Pilar Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              BIG
            </div>
            <h3 className="text-lg font-bold text-slate-900">Peran Badan Informasi Geospasial (BIG)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              BIG menyediakan referensi geospasial dasar nasional melalui Ina-Geoportal, peta Rupabumi Indonesia (RBI) skala 1:25.000 / 1:50.000, batas administrasi resmi, dan sistem referensi koordinat WGS 84 / UTM 48S. Seluruh data resmi dipertahankan integritas atributnya tanpa modifikasi sembarangan.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#EBF7EE] text-[#1B4332] flex items-center justify-center font-bold">
              SPL
            </div>
            <h3 className="text-lg font-bold text-slate-900">Peran Sang Pejuang Lebak</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sang Pejuang Lebak merupakan gerakan pemetaan partisipatif berbasis komunitas desa di Kabupaten Lebak. Gerakan ini mendokumentasikan batas adat Kanekes (Baduy), jalan usaha tani (JUT), jembatan gantung desa, dan fasilitas umum yang kerap belum terjangkau dalam pemetaan makro skala nasional.
            </p>
          </div>
        </div>

        {/* 10 Aturan Integritas Data */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1B4332]">
            <ShieldCheck className="w-5 h-5 text-[#2D6A4F]" />
            <h2 className="text-xl font-bold text-slate-900">10 Prinsip Integritas Data GEORuhay</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pt-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Tidak membuat data geospasial fiktif dan menyatakannya sebagai data resmi.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Tidak mengarang batas wilayah, koordinat, atau statistik wilayah Lebak.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Data yang belum tersedia ditampilkan secara jujur sebagai belum tersedia.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Data pengujian atau simulasi wajib diberi label eksplisit <strong>[DATA DEMO]</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Batas administrasi resmi tidak digabungkan secara acak tanpa verifikasi sumber.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Pemisahan tegas: Data Resmi, Data Survei Desa, dan Data Menunggu Verifikasi.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Setiap dataset memiliki identitas sumber, tahun, penanggung jawab, dan lisensi.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Mekanisme impor data lokal mandiri jika layanan eksternal terkendala koneksi.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Kepatuhan terhadap lisensi data terbuka dan perlindungan hak cipta spasial.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>Perhitungan geodesik akurat berbasis Turf.js dan proyeksi UTM Zone 48S.</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Kelembagaan */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Catatan Batasan Hukum & Kelembagaan:</strong>
            <p className="mt-0.5">
              Platform GEORuhay dibangun sebagai sistem informasi geospasial terintegrasi independen untuk keterbukaan data dan kemajuan Kabupaten Lebak. GEORuhay mengintegrasikan data terbuka resmi BIG serta pemetaan Sang Pejuang Lebak, namun tidak mengklaim diri sebagai perwakilan resmi sepihak Pemerintah Kabupaten Lebak tanpa otorisasi formal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
