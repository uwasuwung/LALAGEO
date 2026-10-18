import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Upload,
  Globe,
  Users,
  History,
  Database,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { store } from '../../services/store';
import { DatasetManagement } from '../admin/DatasetManagement';
import { DataImporter } from '../admin/DataImporter';
import { WmsManager } from '../admin/WmsManager';
import { UserManagement } from '../admin/UserManagement';
import { AuditLogViewer } from '../admin/AuditLogViewer';
import { PostgisMigrationModal } from '../admin/PostgisMigrationModal';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'datasets' | 'import' | 'wms' | 'users' | 'audit'>('overview');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [, setTick] = useState(0);

  React.useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const currentUser = store.getCurrentUser();
  const datasets = store.getDatasets();
  const features = store.getFeatures();
  const wms = store.getWmsServices();
  const logs = store.getAuditLogs();

  const totalDatasets = datasets.length;
  const verifiedCount = datasets.filter(d => d.status === 'terverifikasi').length;
  const pendingCount = datasets.filter(d => d.status === 'menunggu_verifikasi').length;
  const publishedCount = datasets.filter(d => d.published).length;
  const demoCount = datasets.filter(d => d.is_demo).length;

  const handleResetSystem = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mengatur ulang database ke data bibit awal? Seluruh perubahan impor pengujian akan dikembalikan ke kondisi baku.')) {
      store.resetToDefault();
    }
  };

  const navItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'datasets', label: 'Manajemen Dataset', icon: Layers, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'import', label: 'Impor Data Spasial', icon: Upload },
    { id: 'wms', label: 'Layanan WMS / Tile', icon: Globe },
    { id: 'users', label: 'Pengguna & Peran', icon: Users },
    { id: 'audit', label: 'Catatan Audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider">
                Panel Kontrol Administrator
              </span>
              <span className="text-[10px] uppercase font-mono font-bold bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded">
                Peran: {currentUser?.role || 'Admin'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Pusat Pengelolaan Geospasial Kabupaten Lebak
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Login sebagai <strong>{currentUser?.name}</strong> ({currentUser?.organization})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-[#1B4332]" />
              <span>Skema PostGIS</span>
            </button>

            <button
              onClick={handleResetSystem}
              title="Kembalikan database ke kondisi awal"
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Uji</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Anti-slop clean segmented buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1B4332]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 text-[10px] font-mono font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Total Dataset Aktif</span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {totalDatasets}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {publishedCount} terpublikasi untuk umum
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Menunggu Verifikasi</span>
                <p className="text-2xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
                  {pendingCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Perlu ditinjau verifikator spasial
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Dataset Terverifikasi</span>
                <p className="text-2xl font-bold font-mono text-[#2D6A4F] mt-1 tabular-nums">
                  {verifiedCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Resmi BIG & Partisipatif Desa
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Total Fitur Geometri</span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {features.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Poligon, Garis, dan Titik POI
                </p>
              </div>
            </div>

            {/* Quick action grid & system health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Status Layanan Geospasial */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Konektivitas Layanan Geospasial
                  </h3>
                  <button
                    onClick={() => setActiveTab('wms')}
                    className="text-xs text-[#1B4332] font-semibold hover:underline"
                  >
                    Kelola
                  </button>
                </div>

                <div className="space-y-3">
                  {wms.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-500">{item.provider}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#2D6A4F] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
                        <span>Online</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Aktivitas Terkini */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Aktivitas Administrator Terbaru
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs text-[#1B4332] font-semibold hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {logs.slice(0, 3).map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-semibold text-[#1B4332]">{log.action}</span>
                        <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{log.target}</p>
                      <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Datasets */}
        {activeTab === 'datasets' && <DatasetManagement />}

        {/* Tab 3: Importer */}
        {activeTab === 'import' && (
          <DataImporter onSuccess={() => setActiveTab('datasets')} />
        )}

        {/* Tab 4: WMS Services */}
        {activeTab === 'wms' && <WmsManager />}

        {/* Tab 5: Users */}
        {activeTab === 'users' && <UserManagement />}

        {/* Tab 6: Audit */}
        {activeTab === 'audit' && <AuditLogViewer />}
      </div>

      {/* SQL Migration Modal */}
      {showSqlModal && <PostgisMigrationModal onClose={() => setShowSqlModal(false)} />}
    </div>
  );
};
