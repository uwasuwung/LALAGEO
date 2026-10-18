import { SpatialFeature } from '../types';

export const SEED_SPATIAL_FEATURES: SpatialFeature[] = [
  // 1. Poligon Batas Wilayah Kabupaten Lebak (Resmi BIG RBI Referensi WGS 84)
  {
    id: 'feat-poly-lebak-border',
    dataset_id: 'ds-big-01',
    type: 'Polygon',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [106.15, -6.28],
          [106.28, -6.29],
          [106.42, -6.32],
          [106.46, -6.40],
          [106.44, -6.52],
          [106.46, -6.65],
          [106.48, -6.82],
          [106.42, -6.95],
          [106.32, -6.98],
          [106.18, -6.92],
          [106.05, -6.88],
          [105.92, -6.84],
          [105.90, -6.74],
          [105.98, -6.65],
          [106.02, -6.50],
          [106.10, -6.40],
          [106.12, -6.32],
          [106.15, -6.28]
        ]
      ]
    },
    properties: {
      name: 'Batas Wilayah Administrasi Kabupaten Lebak',
      category: 'Batas Administrasi',
      source: 'Badan Informasi Geospasial (BIG)',
      scale: '1:50.000',
      luas_hektar: 342656,
      ibukota: 'Rangkasbitung',
      status_verifikasi: 'Resmi Terverifikasi BIG',
      keterangan: 'Batas administrasi resmi sesuai Peraturan Pemerintah dan basis peta dasar RBI BIG.'
    }
  },

  // 2. Poligon Wilayah Adat Kanekes / Baduy (Sang Pejuang Lebak & BRWA)
  {
    id: 'feat-poly-baduy',
    dataset_id: 'ds-pejuang-01',
    type: 'Polygon',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [106.195, -6.520],
          [106.245, -6.518],
          [106.265, -6.545],
          [106.255, -6.585],
          [106.215, -6.605],
          [106.185, -6.575],
          [106.195, -6.520]
        ]
      ]
    },
    properties: {
      name: 'Kawasan Wilayah Adat Urang Kanekes (Baduy)',
      category: 'Kawasan Adat & Budaya',
      kecamatan: 'Leuwidamar',
      desa: 'Kanekes',
      source: 'Sang Pejuang Lebak bersama Lembaga Adat Kanekes',
      luas_hektar: 5101.8,
      status_verifikasi: 'Terverifikasi Komunitas Adat & Pemkab Lebak',
      keterangan: 'Mencakup 3 kampung Baduy Dalam (Cibeo, Cikartawana, Cikeusik) dan 65 perkampungan Baduy Luar dengan zonasi Hutan Larangan, Hutan Tutupan, dan Hutan Garapan.'
    }
  },

  // 3. Poligon Kawasan Bendungan Karian (Infrastruktur Air Nasional BIG / PUPR)
  {
    id: 'feat-poly-karian',
    dataset_id: 'ds-big-02',
    type: 'Polygon',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [106.315, -6.435],
          [106.345, -6.428],
          [106.365, -6.448],
          [106.350, -6.472],
          [106.320, -6.465],
          [106.315, -6.435]
        ]
      ]
    },
    properties: {
      name: 'Genangan Waduk Bendungan Karian',
      category: 'Hidrologi & Sungai',
      kecamatan: 'Sajira, Cimarga & Muncang',
      source: 'Kementerian PUPR / Verifikasi BIG',
      luas_genangan_ha: 1773,
      kapasitas_juta_m3: 314.7,
      status_verifikasi: 'Terverifikasi Resmi',
      keterangan: 'Waduk multifungsi penyuplai air baku 14,6 m3/detik untuk Banten, Tangerang Raya, dan DKI Jakarta serta pengendali banjir Ciujung.'
    }
  },

  // 4. Jaringan Sungai Ciujung (Aliran Utama BIG)
  {
    id: 'feat-line-ciujung',
    dataset_id: 'ds-big-02',
    type: 'LineString',
    geometry: {
      type: 'LineString',
      coordinates: [
        [106.425, -6.650], // Hulu Halimun
        [106.385, -6.580],
        [106.350, -6.510],
        [106.335, -6.450], // Waduk Karian
        [106.290, -6.410],
        [106.248, -6.360], // Melintasi Rangkasbitung
        [106.220, -6.320],
        [106.185, -6.280]  // Menuju hilir Serang
      ]
    },
    properties: {
      name: 'Sungai Ciujung (Batang Utama)',
      category: 'Hidrologi & Sungai',
      panjang_km: 142.5,
      ordo_sungai: 'Ordo 1 - Wilayah Sungai Ciujung-Cidanau-Cidurian',
      source: 'Pusat Pemetaan Rupabumi dan Toponim BIG',
      status_verifikasi: 'Terverifikasi Resmi'
    }
  },

  // 5. Jaringan Sungai Ciberang (Hulu Rafting & Konservasi)
  {
    id: 'feat-line-ciberang',
    dataset_id: 'ds-pejuang-02',
    type: 'LineString',
    geometry: {
      type: 'LineString',
      coordinates: [
        [106.410, -6.620],
        [106.375, -6.565],
        [106.340, -6.520],
        [106.335, -6.450]
      ]
    },
    properties: {
      name: 'Sungai Ciberang (Jalur Konservasi & Rafting)',
      category: 'Hidrologi & Sungai',
      kecamatan: 'Lebakgedong & Cipanas',
      panjang_km: 38.2,
      source: 'Sang Pejuang Lebak (Pemetaan Sumber Daya Alam Desa)',
      status_verifikasi: 'Terverifikasi Komunitas'
    }
  },

  // 6. Jalan Tol Serang - Panimbang Seksi 1 (Rangkasbitung)
  {
    id: 'feat-line-tol-serpan',
    dataset_id: 'ds-big-03',
    type: 'LineString',
    geometry: {
      type: 'LineString',
      coordinates: [
        [106.180, -6.280],
        [106.195, -6.310],
        [106.215, -6.345], // Gerbang Tol Rangkasbitung
        [106.205, -6.380],
        [106.180, -6.440],
        [106.160, -6.510]  // Lanjutan Seksi 2 Cileles
      ]
    },
    properties: {
      name: 'Jalan Tol Serang - Panimbang (Seksi 1 Rangkasbitung)',
      category: 'Transportasi & Jalan',
      tipe: 'Jalan Bebas Hambatan (Toll Road)',
      panjang_km: 26.5,
      source: 'Kementerian PUPR / BIG RBI',
      status_verifikasi: 'Terverifikasi Resmi'
    }
  },

  // 7. Jalan Usaha Tani (JUT) Desa Bojongjengkol Banjarsari (Data Sang Pejuang Lebak)
  {
    id: 'feat-line-jut-bojong',
    dataset_id: 'ds-pejuang-03',
    type: 'LineString',
    geometry: {
      type: 'LineString',
      coordinates: [
        [106.015, -6.680],
        [106.022, -6.685],
        [106.029, -6.691],
        [106.038, -6.695]
      ]
    },
    properties: {
      name: 'Jalan Usaha Tani (JUT) Sukatani - Bojongjengkol',
      category: 'Transportasi & Jalan',
      kecamatan: 'Banjarsari',
      desa: 'Bojongjengkol',
      panjang_km: 3.4,
      lebar_m: 2.5,
      kondisi: 'Rabat Beton Swadaya & APBD',
      source: 'Sang Pejuang Lebak (Survei Lapangan RTK-GPS)',
      surveyor: 'Kang Asep Suhendar & Tim Relawan Desa',
      status_verifikasi: 'Terverifikasi Surveyor Desa'
    }
  },

  // 8. Titik-Titik Fasilitas Publik & Penting Kabupaten Lebak (Resmi & Partisipatif)
  {
    id: 'feat-poi-rsud-adjidarmo',
    dataset_id: 'ds-big-04',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.2525, -6.3548]
    },
    properties: {
      name: 'RSUD Dr. Adjidarmo Rangkasbitung',
      category: 'Fasilitas Umum & Sosial',
      sub_category: 'Fasilitas Kesehatan',
      tipe: 'Rumah Sakit Umum Daerah Kelas B Rujukan Wilayah',
      kecamatan: 'Rangkasbitung',
      alamat: 'Jl. Iko Jatmiko No. 1, Rangkasbitung',
      source: 'Dinas Kesehatan Kab. Lebak / BIG',
      status_verifikasi: 'Terverifikasi Resmi'
    }
  },
  {
    id: 'feat-poi-rsud-malingping',
    dataset_id: 'ds-big-04',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [105.9965, -6.8142]
    },
    properties: {
      name: 'RSUD Malingping',
      category: 'Fasilitas Umum & Sosial',
      sub_category: 'Fasilitas Kesehatan',
      tipe: 'Rumah Sakit Rujukan Lebak Selatan Kelas C',
      kecamatan: 'Malingping',
      alamat: 'Jl. Beyeh - Simpang No. 1, Malingping',
      source: 'Dinas Kesehatan Banten / BIG',
      status_verifikasi: 'Terverifikasi Resmi'
    }
  },
  {
    id: 'feat-poi-museum-multatuli',
    dataset_id: 'ds-pejuang-04',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.2505, -6.3582]
    },
    properties: {
      name: 'Museum Multatuli & Alun-Alun Rangkasbitung',
      category: 'Kawasan Adat & Budaya',
      sub_category: 'Cagar Budaya & Sejarah',
      tipe: 'Museum Sejarah Antikolonialisme & Sastra',
      kecamatan: 'Rangkasbitung',
      alamat: 'Jl. Alun-Alun Timur No. 2, Rangkasbitung',
      source: 'Sang Pejuang Lebak & Komunitas Literasi Budaya',
      status_verifikasi: 'Terverifikasi'
    }
  },
  {
    id: 'feat-poi-stasiun-rangkas',
    dataset_id: 'ds-big-03',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.2428, -6.3615]
    },
    properties: {
      name: 'Stasiun Kereta Api Rangkasbitung',
      category: 'Transportasi & Jalan',
      sub_category: 'Simpul Transportasi Kereta',
      tipe: 'Stasiun Besar Tipe A (Terminus Commuter Line Jabodetabek & KA Lokal Merak)',
      kecamatan: 'Rangkasbitung',
      source: 'PT KAI & Badan Informasi Geospasial',
      status_verifikasi: 'Terverifikasi Resmi'
    }
  },
  {
    id: 'feat-poi-ciboleger',
    dataset_id: 'ds-pejuang-01',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.2085, -6.5254]
    },
    properties: {
      name: 'Terminal Gerbang Wisata Ciboleger (Pintu Masuk Baduy)',
      category: 'Kawasan Adat & Budaya',
      sub_category: 'Pusat Informasi & Adat',
      tipe: 'Pos Pusat Registrasi Masuk Wilayah Adat Kanekes',
      kecamatan: 'Leuwidamar',
      desa: 'Kanekes',
      source: 'Sang Pejuang Lebak (Posko Pemetaan Partisipatif Desa)',
      surveyor: 'Relawan Sang Pejuang Lebak',
      status_verifikasi: 'Terverifikasi Komunitas'
    }
  },
  {
    id: 'feat-poi-cibeo-baduy-dalam',
    dataset_id: 'ds-pejuang-01',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.2241, -6.5582]
    },
    properties: {
      name: 'Kampung Adat Cibeo (Baduy Dalam)',
      category: 'Kawasan Adat & Budaya',
      sub_category: 'Permukiman Adat Tertutup',
      tipe: 'Wilayah Adat Inti Tangtu Telu (Hanya untuk WNI sesuai Hukum Adat Kanekes)',
      kecamatan: 'Leuwidamar',
      desa: 'Kanekes',
      source: 'Sang Pejuang Lebak (Dokumentasi Musyawarah Desa & Koordinat Centroid Kampung)',
      status_verifikasi: 'Terverifikasi Komunitas Adat'
    }
  },
  {
    id: 'feat-poi-teh-cikuya',
    dataset_id: 'ds-pejuang-05',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.3385, -6.8741]
    },
    properties: {
      name: 'Perkebunan Teh Cikuya & Pabrik Pengolahan Desa Hegarmanah',
      category: 'Pertanian & Perkebunan',
      sub_category: 'Agrowisata & Perkebunan Teh Unggulan Juara Dunia',
      kecamatan: 'Cibeber',
      desa: 'Hegarmanah',
      ketinggian_mdpl: 950,
      luas_hektar: 30,
      source: 'Sang Pejuang Lebak (Pendataan Aset Desa & Potensi Ekonomi)',
      status_verifikasi: 'Terverifikasi'
    }
  },
  {
    id: 'feat-poi-citorek-awan',
    dataset_id: 'ds-pejuang-05',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.3912, -6.6184]
    },
    properties: {
      name: 'Gunung Luhur - Citorek ("Negeri di Atas Awan")',
      category: 'Fasilitas Umum & Sosial',
      sub_category: 'Wisata Alam & Konservasi',
      kecamatan: 'Lebakgedong',
      desa: 'Citorek Kidul',
      ketinggian_mdpl: 987,
      source: 'Sang Pejuang Lebak & Kelompok Sadar Wisata Desa',
      status_verifikasi: 'Terverifikasi'
    }
  },
  {
    id: 'feat-poi-pantai-sawarna',
    dataset_id: 'ds-pejuang-05',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.3054, -6.9852]
    },
    properties: {
      name: 'Pantai Tanjung Layar & Sawarna (Geopark Bayah Dome)',
      category: 'Fasilitas Umum & Sosial',
      sub_category: 'Warisan Geologi & Pesisir',
      kecamatan: 'Bayah',
      desa: 'Sawarna',
      source: 'Sang Pejuang Lebak & Pemdes Sawarna',
      status_verifikasi: 'Terverifikasi'
    }
  },
  {
    id: 'feat-poi-jembatan-sajira',
    dataset_id: 'ds-pejuang-03',
    type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [106.3285, -6.4421]
    },
    properties: {
      name: 'Jembatan Gantung Desa Sajira Mekar (Akses Pertanian & Sekolah)',
      category: 'Aset & Infrastruktur Desa',
      sub_category: 'Jembatan Gantung Desa',
      panjang_m: 65,
      kondisi: 'Baik (Direhabilitasi Swadaya Komunitas Relawan)',
      kecamatan: 'Sajira',
      desa: 'Sajira Mekar',
      source: 'Sang Pejuang Lebak (Inventarisasi Akses Rawan Bencana)',
      status_verifikasi: 'Terverifikasi Komunitas'
    }
  },
  // Data Uji Bertanda [DATA DEMO]
  {
    id: 'feat-demo-saluran-irigasi',
    dataset_id: 'ds-demo-01',
    type: 'LineString',
    geometry: {
      type: 'LineString',
      coordinates: [
        [106.185, -6.395],
        [106.192, -6.402],
        [106.198, -6.415]
      ]
    },
    properties: {
      name: '[DATA DEMO] Rencana Saluran Tersier Irigasi Cikulur',
      category: 'Hidrologi & Sungai',
      kecamatan: 'Cikulur',
      panjang_km: 2.1,
      debit_rencana: '0.45 m3/s',
      source: 'Simulasi Sistem [DATA DEMO - BUKAN DATA RESMI]',
      status_verifikasi: 'menunggu_verifikasi',
      keterangan: 'Data ini adalah contoh simulasi pengujian modul impor spasial GEORuhay.'
    }
  }
];
