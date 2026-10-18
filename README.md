# GEORuhay — Sistem Informasi Geospasial Kabupaten Lebak

> **Tagline:** *"Menyatukan Data, Memetakan Lebak."*  
> **Wilayah:** Kabupaten Lebak, Provinsi Banten, Indonesia.

GEORuhay adalah platform Sistem Informasi Geospasial (GIS) terintegrasi yang menyatukan dua kelompok sumber data utama:
1. **Data Resmi Badan Informasi Geospasial (BIG):** Batas administrasi kabupaten/kecamatan, Peta Rupabumi Indonesia (RBI) skala 1:25.000 / 1:50.000, hidrologi Sungai Ciujung, jaring kontrol geodesi, dan toponimi resmi.
2. **Data Pemetaan Partisipatif Desa oleh Sang Pejuang Lebak:** Batas wilayah adat Urang Kanekes (Baduy), jalan usaha tani (JUT), jembatan gantung desa, saluran irigasi sawah rakyat, fasilitas umum, dan aset ekonomi perdesaan.

---

## Fitur Utama

- **Peta Interaktif GIS (Leaflet + Turf.js):**
  - Ganti peta dasar (*Basemap Switcher*): OpenStreetMap, CartoDB Positron, CartoDB Dark, Esri Citra Satelit, dan OpenTopoMap.
  - Manajemen Layer Dinamis: Tampilkan/sembunyikan, pengaturan transparansi (0–100%), urutan layer, dan fokus ke cakupan layer (*Zoom to Layer*).
  - Identifikasi Objek (*Feature Inspector*): Klik fitur apa pun pada peta untuk membuka atribut lengkap, sumber data, dan status verifikasi.
  - Alat Ukur Geodesik: Perhitungan jarak garis (meter/km) dan luas poligon (hektar/m²) berbasis geodesik Turf.js yang memperhitungkan kelengkungan bumi.
  - Pembacaan Koordinat Real-time: Koordinat kursor dalam format Lintang/Bujur Derajat Desimal (DD) dan proyeksi UTM Zone 48S (*Easting/Northing*).
  - Pencarian Lokasi Cepat: Cari nama lokasi, 28 kecamatan Lebak, atau masukkan koordinat langsung (contoh: `-6.357, 106.248`).
  - Simbologi & Legenda interaktif.

- **Peta Topografi 3 Dimensi (Three.js WebGL):**
  - **Relief Topografi Digital (DEM):** Pemodelan elevasi 3D Kabupaten Lebak dari dataran pantai selatan (Bayah & Malingping ~0–50m), perbukitan tengah Leuwidamar & Baduy (~200–500m), hingga pegunungan tinggi Taman Nasional Gunung Halimun Salak & Cibeber (~1.000–1.800m).
  - **Eksagerasi Vertikal (0.5x – 4.0x):** Slider dinamis untuk mengatur keterjalan relief bumi secara visual.
  - **Pencahayaan & Sudut Matahari:** Kontrol sudut datang cahaya matahari (10° – 85°) untuk mensimulasikan bayangan relief pagi, siang, dan sore hari.
  - **Penanda Objek 3D & Raycasting Interaktif:** Tiang cahaya vertikal dan bola menyala pada titik fasilitas publik, RSUD, Bendungan Karian, dan Balai Adat Baduy dengan klik untuk menampilkan atribut data.
  - **Jalur Vektor 3D:** Aliran Sungai Ciujung dan batas garis putus-putus wilayah adat Kanekes (Baduy) melayang mengikuti kontur elevasi tanah.
  - **Preset Sudut Kamera:** Isometrik, Fokus Kawasan Baduy, Puncak Halimun Salak, Pesisir Bayah, dan Tampilan Atas (Tegak).
  - **Beralih Mulus 2D & 3D:** Tombol sakelar terpadu untuk berganti antara peta kartografi 2D Leaflet dan pemodelan medan 3D Three.js.

- **Katalog Data Geospasial:**
  - Penelusuran dan filter berbasis kategori, kelompok sumber (BIG vs Pejuang Lebak), tahun, format, dan status verifikasi.
  - Detail metadata standar SNI / ISO 19115 (wali data, metodologi, sistem referensi koordinat, lisensi).
  - Unduh data langsung dalam format GeoJSON, KML, dan CSV.
  - Tombol aksi *"Buka di Peta"* langsung memfokuskan layer ke kanvas GIS.

- **Eksplorasi 28 Kecamatan Kabupaten Lebak:**
  - Data administratif otentik 28 kecamatan: kode Kemendagri, ibu kota kecamatan, luas wilayah, jumlah desa, zona wilayah (Lebak Utara, Lebak Tengah, Lebak Selatan), dan titik sentroid.

- **Panel Administrator:**
  - Dasbor metrik dari database nyata (dataset aktif, antrean verifikasi, fitur spasial, riwayat audit).
  - Alur Verifikasi Data: *Draft → Menunggu Verifikasi → Terverifikasi → Dipublikasikan*.
  - Modul Impor Data Spasial: Mendukung berkas GeoJSON, KML, CSV (otomatis deteksi kolom koordinat), dan paket Shapefile ZIP. Dilengkapi validasi geometri, deteksi batas wilayah Lebak/Banten, pratinjau tabel sebelum simpan, dan laporan kesalahan yang dapat diunduh.
  - Konfigurasi Layanan Peta Eksternal WMS / WMTS (termasuk pengujian koneksi Ina-Geoportal BIG).
  - Manajemen Pengguna & Hak Akses Berbasis Peran (*Role-Based Access Control* - RBAC): Superadmin, Verifikator, Surveyor Desa, dan Publik.
  - Generator Skema Database PostGIS & Supabase RLS lengkap (`georuhay_postgis_schema.sql`).

---

## 10 Prinsip Integritas Data

1. Tidak membuat data geospasial fiktif dan menyatakannya sebagai data resmi.
2. Tidak mengarang batas wilayah, koordinat, atau statistik wilayah Lebak.
3. Data yang belum tersedia ditampilkan secara jujur sebagai belum tersedia.
4. Data pengujian atau simulasi wajib diberi label eksplisit **[DATA DEMO]**.
5. Batas administrasi resmi tidak digabungkan secara acak tanpa verifikasi sumber.
6. Pemisahan tegas: Data Resmi, Data Survei Desa, dan Data Menunggu Verifikasi.
7. Setiap dataset memiliki identitas sumber, tahun, penanggung jawab, dan lisensi.
8. Mekanisme impor data lokal mandiri jika layanan eksternal terkendala koneksi.
9. Kepatuhan terhadap lisensi data terbuka dan perlindungan hak cipta spasial.
10. Perhitungan geodesik akurat berbasis Turf.js dan proyeksi UTM Zone 48S.

---

## Akun Pengguna Awal (Bootstrap & Pengujian)

Aplikasi telah dilengkapi profil akun simulasi untuk pengujian peran:
- **Superadmin:** `admin.georuhay@lebakkab.go.id` (Kata sandi: `lebakruhay2026`)
- **Verifikator Spasial (BIG):** `verifikator@big.go.id`
- **Surveyor Desa (Sang Pejuang Lebak):** `surveyor.desa@pejuanglebak.id`

---

## Panduan Instalasi & Menjalankan Lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan lokal
npm run dev

# 3. Bangun versi produksi
npm run build
```

---

## Panduan Migrasi Database Produksi (PostgreSQL + PostGIS / Supabase)

1. Buka antarmuka SQL Editor pada project PostgreSQL / Supabase Anda.
2. Buka menu **Panel Kontrol Administrator > Skema PostGIS** di dalam aplikasi GEORuhay, atau unduh berkas `georuhay_postgis_schema.sql`.
3. Jalankan skrip SQL tersebut. Skrip mencakup:
   - Ekstensi `postgis` dan `uuid-ossp`.
   - Tabel relasional: `profiles`, `administrative_regions`, `data_sources`, `dataset_categories`, `datasets`, `spatial_features`, dan `audit_logs`.
   - Indeks spasial `GIST(geom)` dan indeks toponimi.
   - Aturan keamanan baris (*Row Level Security* - RLS).
   - Trigger otomatis `updated_at`.
