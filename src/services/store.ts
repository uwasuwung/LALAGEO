import {
  Dataset,
  SpatialFeature,
  LayerSetting,
  User,
  WmsService,
  ImportJob,
  AuditLog,
  VerificationStatus,
  DatasetCategory
} from '../types';
import { SEED_DATASETS, INITIAL_WMS_SERVICES } from '../data/seedDatasets';
import { SEED_SPATIAL_FEATURES } from '../data/seedSpatialData';
import { LEBAK_KECAMATAN_DATA, DATA_SOURCES } from '../data/administrativeRegions';

const STORAGE_KEYS = {
  DATASETS: 'georuhay_datasets_v1',
  FEATURES: 'georuhay_features_v1',
  LAYERS: 'georuhay_layers_v1',
  USER: 'georuhay_current_user_v1',
  WMS: 'georuhay_wms_services_v1',
  AUDIT: 'georuhay_audit_logs_v1',
  IMPORT_JOBS: 'georuhay_import_jobs_v1'
};

// Default Admin user
export const DEFAULT_ADMIN_USER: User = {
  id: 'usr-admin-01',
  name: 'Kang Hendra Wijaya, S.T.',
  email: 'admin.georuhay@lebakkab.go.id',
  role: 'admin',
  organization: 'Tim Pengelola Geospasial Kabupaten Lebak & Sang Pejuang Lebak',
  created_at: '2024-01-01T00:00:00Z'
};

export const MOCK_USERS: User[] = [
  DEFAULT_ADMIN_USER,
  {
    id: 'usr-verif-01',
    name: 'Ir. Siti Rahmawati, M.Sc.',
    email: 'verifikator@big.go.id',
    role: 'verifikator',
    organization: 'Analis Geospasial PPIG - Badan Informasi Geospasial (BIG)',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'usr-survey-01',
    name: 'Asep Saepudin (Surveyor Baduy)',
    email: 'surveyor.desa@pejuanglebak.id',
    role: 'surveyor',
    organization: 'Relawan Pemetaan Partisipatif Desa Sang Pejuang Lebak',
    created_at: '2024-02-01T00:00:00Z'
  }
];

class GeoruhayStore {
  private datasets: Dataset[] = [];
  private features: SpatialFeature[] = [];
  private layers: LayerSetting[] = [];
  private currentUser: User | null = null;
  private wmsServices: WmsService[] = [];
  private auditLogs: AuditLog[] = [];
  private importJobs: ImportJob[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load datasets
    try {
      const storedDatasets = localStorage.getItem(STORAGE_KEYS.DATASETS);
      if (storedDatasets) {
        this.datasets = JSON.parse(storedDatasets);
      } else {
        this.datasets = [...SEED_DATASETS];
        this.saveDatasets();
      }
    } catch {
      this.datasets = [...SEED_DATASETS];
    }

    // Load features
    try {
      const storedFeatures = localStorage.getItem(STORAGE_KEYS.FEATURES);
      if (storedFeatures) {
        this.features = JSON.parse(storedFeatures);
      } else {
        this.features = [...SEED_SPATIAL_FEATURES];
        this.saveFeatures();
      }
    } catch {
      this.features = [...SEED_SPATIAL_FEATURES];
    }

    // Load WMS
    try {
      const storedWms = localStorage.getItem(STORAGE_KEYS.WMS);
      if (storedWms) {
        this.wmsServices = JSON.parse(storedWms);
      } else {
        this.wmsServices = [...INITIAL_WMS_SERVICES];
        this.saveWms();
      }
    } catch {
      this.wmsServices = [...INITIAL_WMS_SERVICES];
    }

    // Load user (default logged in as admin for review / administration)
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      } else {
        this.currentUser = DEFAULT_ADMIN_USER;
        this.saveUser();
      }
    } catch {
      this.currentUser = DEFAULT_ADMIN_USER;
    }

    // Load audit logs
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      } else {
        this.auditLogs = [
          {
            id: 'log-01',
            timestamp: '2024-05-10T14:20:00Z',
            user_name: 'Kang Hendra Wijaya, S.T.',
            user_role: 'admin',
            action: 'VERIFIKASI_DATASET',
            target: 'Batas Wilayah Administrasi Kabupaten Lebak 1:50.000',
            details: 'Status verifikasi disahkan sebagai data resmi BIG.'
          },
          {
            id: 'log-02',
            timestamp: '2024-08-12T11:00:00Z',
            user_name: 'Ir. Siti Rahmawati, M.Sc.',
            user_role: 'verifikator',
            action: 'PUBLIKASI_DATASET',
            target: 'Batas Wilayah Adat Kanekes (Baduy) & Zonasi Hutan Lindung Desa',
            details: 'Hasil survei Sang Pejuang Lebak disetujui dipublikasikan di geoportal.'
          }
        ];
        this.saveAudit();
      }
    } catch {
      this.auditLogs = [];
    }

    // Initialize layers
    this.initializeLayers();
  }

  private initializeLayers() {
    const palette = [
      '#1B4332', '#2D6A4F', '#0284C7', '#D97706', '#E11D48', '#7C3AED', '#059669', '#B45309'
    ];

    this.layers = this.datasets.map((ds, index) => ({
      id: `layer-${ds.id}`,
      dataset_id: ds.id,
      title: ds.title,
      visible: ds.published, // Visible by default if published
      opacity: ds.category === 'Batas Administrasi' ? 0.35 : 0.85,
      color: palette[index % palette.length],
      fillColor: palette[index % palette.length],
      weight: ds.category === 'Transportasi & Jalan' ? 3 : 2,
      zIndex: 10 + index
    }));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private saveDatasets() {
    localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(this.datasets));
  }

  private saveFeatures() {
    localStorage.setItem(STORAGE_KEYS.FEATURES, JSON.stringify(this.features));
  }

  private saveWms() {
    localStorage.setItem(STORAGE_KEYS.WMS, JSON.stringify(this.wmsServices));
  }

  private saveUser() {
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  private saveAudit() {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
  }

  // Getters
  public getDatasets(): Dataset[] {
    return [...this.datasets];
  }

  public getDatasetById(id: string): Dataset | undefined {
    return this.datasets.find(d => d.id === id);
  }

  public getFeatures(): SpatialFeature[] {
    return [...this.features];
  }

  public getFeaturesByDatasetId(datasetId: string): SpatialFeature[] {
    return this.features.filter(f => f.dataset_id === datasetId);
  }

  public getLayers(): LayerSetting[] {
    return [...this.layers];
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getWmsServices(): WmsService[] {
    return [...this.wmsServices];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getAdministrativeRegions() {
    return LEBAK_KECAMATAN_DATA;
  }

  public getDataSources() {
    return DATA_SOURCES;
  }

  // Layer manipulations
  public updateLayerSetting(layerId: string, updates: Partial<LayerSetting>) {
    this.layers = this.layers.map(l => (l.id === layerId ? { ...l, ...updates } : l));
    this.notify();
  }

  public toggleLayerVisibility(layerId: string) {
    this.layers = this.layers.map(l => (l.id === layerId ? { ...l, visible: !l.visible } : l));
    this.notify();
  }

  public setLayerOpacity(layerId: string, opacity: number) {
    this.layers = this.layers.map(l => (l.id === layerId ? { ...l, opacity } : l));
    this.notify();
  }

  // Dataset CRUD & Verification Workflow
  public addDataset(newDataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>, features?: SpatialFeature[]): Dataset {
    const id = `ds-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const dataset: Dataset = {
      ...newDataset,
      id,
      created_at: timestamp,
      updated_at: timestamp
    };

    this.datasets.unshift(dataset);
    this.saveDatasets();

    if (features && features.length > 0) {
      const assigned = features.map((f, idx) => ({
        ...f,
        id: f.id || `feat-${id}-${idx}`,
        dataset_id: id
      }));
      this.features.push(...assigned);
      this.saveFeatures();
    }

    // Add to layers
    this.layers.push({
      id: `layer-${dataset.id}`,
      dataset_id: dataset.id,
      title: dataset.title,
      visible: dataset.published,
      opacity: 0.8,
      color: '#1B4332',
      weight: 2,
      zIndex: this.layers.length + 10
    });

    this.logAction(
      'TAMBAH_DATASET',
      dataset.title,
      `Dataset baru berhasil ditambahkan dengan ${features?.length || 0} fitur spasial.`
    );

    this.notify();
    return dataset;
  }

  public updateDataset(id: string, updates: Partial<Dataset>): boolean {
    const idx = this.datasets.findIndex(d => d.id === id);
    if (idx === -1) return false;

    this.datasets[idx] = {
      ...this.datasets[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveDatasets();

    this.logAction(
      'UPDATE_METADATA',
      this.datasets[idx].title,
      `Metadata diperbarui: ${Object.keys(updates).join(', ')}`
    );

    this.notify();
    return true;
  }

  public deleteDataset(id: string): boolean {
    const target = this.datasets.find(d => d.id === id);
    if (!target) return false;

    this.datasets = this.datasets.filter(d => d.id !== id);
    this.features = this.features.filter(f => f.dataset_id !== id);
    this.layers = this.layers.filter(l => l.dataset_id !== id);

    this.saveDatasets();
    this.saveFeatures();

    this.logAction('HAPUS_DATASET', target.title, 'Dataset dan seluruh fitur spasial terkait telah dihapus.');
    this.notify();
    return true;
  }

  public setVerificationStatus(id: string, status: VerificationStatus, notes: string = ''): boolean {
    const target = this.datasets.find(d => d.id === id);
    if (!target) return false;

    const user = this.currentUser?.name || 'Verifikator';
    const timestamp = new Date().toISOString();

    target.status = status;
    target.verification_notes = notes;
    target.verified_by = user;
    target.verified_at = timestamp;

    if (status === 'terverifikasi') {
      target.published = true;
    } else if (status === 'ditolak') {
      target.published = false;
    }

    this.saveDatasets();
    this.logAction(
      'VERIFIKASI_DATASET',
      target.title,
      `Status diubah menjadi: ${status.toUpperCase()} oleh ${user}. Catatan: ${notes || '-'}`
    );

    this.notify();
    return true;
  }

  public togglePublication(id: string): boolean {
    const target = this.datasets.find(d => d.id === id);
    if (!target) return false;

    target.published = !target.published;
    target.updated_at = new Date().toISOString();
    this.saveDatasets();

    // sync layer visibility
    const layer = this.layers.find(l => l.dataset_id === id);
    if (layer) layer.visible = target.published;

    this.logAction(
      'UBAH_PUBLIKASI',
      target.title,
      `Publikasi diubah menjadi: ${target.published ? 'DIPUBLIKASIKAN' : 'DRAFT / PRIVAT'}`
    );

    this.notify();
    return true;
  }

  // WMS Services CRUD
  public addWmsService(service: Omit<WmsService, 'id'>) {
    const newService: WmsService = {
      ...service,
      id: `wms-${Date.now()}`
    };
    this.wmsServices.push(newService);
    this.saveWms();
    this.logAction('TAMBAH_LAYANAN_WMS', newService.name, `URL: ${newService.url}`);
    this.notify();
  }

  public deleteWmsService(id: string) {
    this.wmsServices = this.wmsServices.filter(w => w.id !== id);
    this.saveWms();
    this.notify();
  }

  public testWmsService(id: string): Promise<boolean> {
    const item = this.wmsServices.find(w => w.id === id);
    if (!item) return Promise.resolve(false);

    item.last_tested = new Date().toISOString();
    item.connection_status = 'online';
    this.saveWms();
    this.notify();
    return Promise.resolve(true);
  }

  // Auth & Roles
  public login(role: 'admin' | 'verifikator' | 'surveyor' = 'admin') {
    const found = MOCK_USERS.find(u => u.role === role) || DEFAULT_ADMIN_USER;
    this.currentUser = found;
    this.saveUser();
    this.logAction('LOGIN_USER', found.name, `Login sebagai ${found.role.toUpperCase()}`);
    this.notify();
  }

  public logout() {
    if (this.currentUser) {
      this.logAction('LOGOUT_USER', this.currentUser.name, 'Pengguna keluar sistem.');
    }
    this.currentUser = null;
    this.saveUser();
    this.notify();
  }

  private logAction(action: string, target: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user_name: this.currentUser?.name || 'Sistem Otomatis',
      user_role: this.currentUser?.role || 'system',
      action,
      target,
      details
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.saveAudit();
  }

  // Reset to original seed data
  public resetToDefault() {
    this.datasets = [...SEED_DATASETS];
    this.features = [...SEED_SPATIAL_FEATURES];
    this.wmsServices = [...INITIAL_WMS_SERVICES];
    this.currentUser = DEFAULT_ADMIN_USER;
    this.saveDatasets();
    this.saveFeatures();
    this.saveWms();
    this.saveUser();
    this.initializeLayers();
    this.logAction('RESET_SISTEM', 'Database Lokal', 'Database dikembalikan ke data awal terverifikasi.');
    this.notify();
  }
}

export const store = new GeoruhayStore();
