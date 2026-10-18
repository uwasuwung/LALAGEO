import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Download,
  Search,
  Check,
  X,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { store } from '../../services/store';
import { Dataset, VerificationStatus } from '../../types';

export const DatasetManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>(() => store.getDatasets());
  const [search, setSearch] = useState('');
  const [selectedForReview, setSelectedForReview] = useState<Dataset | null>(null);
  const [reviewStatus, setReviewStatus] = useState<VerificationStatus>('terverifikasi');
  const [reviewNotes, setReviewNotes] = useState('');

  // Edit metadata modal
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);

  React.useEffect(() => {
    const update = () => setDatasets(store.getDatasets());
    return store.subscribe(update);
  }, []);

  const filtered = datasets.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.source_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReview = (dataset: Dataset) => {
    setSelectedForReview(dataset);
    setReviewStatus(dataset.status === 'terverifikasi' ? 'terverifikasi' : 'terverifikasi');
    setReviewNotes(dataset.verification_notes || '');
  };

  const handleSaveReview = () => {
    if (!selectedForReview) return;
    store.setVerificationStatus(selectedForReview.id, reviewStatus, reviewNotes);
    setSelectedForReview(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDataset) return;
    store.updateDataset(editingDataset.id, editingDataset);
    setEditingDataset(null);
  };

  const handleDelete = (dataset: Dataset) => {
    if (window.confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus dataset "${dataset.title}" beserta seluruh fitur spasialnya?`)) {
      store.deleteDataset(dataset.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Manajemen & Verifikasi Dataset Geospasial
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur verifikasi: Draft → Menunggu Verifikasi → Terverifikasi → Dipublikasikan.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari dataset..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332]"
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
        <table className="w-full text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Judul Dataset & Kategori</th>
              <th className="px-4 py-3 font-semibold">Sumber & Tahun</th>
              <th className="px-4 py-3 font-semibold">Status Verifikasi</th>
              <th className="px-4 py-3 font-semibold">Publikasi</th>
              <th className="px-4 py-3 font-semibold">Unduh</th>
              <th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(dataset => {
              const isVerified = dataset.status === 'terverifikasi';
              return (
                <tr key={dataset.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-bold text-slate-900 leading-snug line-clamp-1">{dataset.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{dataset.category} · {dataset.feature_count} objek</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800 font-medium">{dataset.source_name}</p>
                    <p className="text-[11px] font-mono text-slate-500">{dataset.year}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenReview(dataset)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : dataset.status === 'menunggu_verifikasi'
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span className="capitalize">{dataset.status.replace(/_/g, ' ')}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => store.togglePublication(dataset.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        dataset.published
                          ? 'text-[#1B4332] bg-[#EBF7EE] hover:bg-[#D8F3DC]'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                      }`}
                      title={dataset.published ? 'Dipublikasikan (Klik untuk sembunyikan)' : 'Draft (Klik untuk publikasi)'}
                    >
                      {dataset.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-600 font-medium">
                      {dataset.download_allowed ? 'Terbuka' : 'Terbatas'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingDataset(dataset)}
                        title="Edit Metadata"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dataset)}
                        title="Hapus Dataset"
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review & Verification Modal */}
      {selectedForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1B4332]" />
                <h4 className="text-sm font-bold text-slate-900">Penetapan Status Verifikasi</h4>
              </div>
              <button onClick={() => setSelectedForReview(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <p className="font-semibold text-slate-800 text-sm leading-snug">{selectedForReview.title}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Sumber: {selectedForReview.source_name}</p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Keputusan Verifikator</label>
              <select
                value={reviewStatus}
                onChange={e => setReviewStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
              >
                <option value="terverifikasi">Terverifikasi (Sah & Siap Publikasi)</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi (Perlu Cek Lapangan / Dokumen)</option>
                <option value="ditolak">Ditolak (Data Tidak Memenuhi Standar Integritas Spasial)</option>
                <option value="draft">Draft (Pengeditan Internal)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Catatan Verifikasi / Berita Acara</label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan teknis hasil validasi topologi, toponimi, atau musyawarah desa..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedForReview(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-1.5 font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg"
              >
                Simpan Keputusan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Edit Metadata Dataset</h4>
              <button onClick={() => setEditingDataset(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">Judul Dataset</label>
                <input
                  type="text"
                  value={editingDataset.title}
                  onChange={e => setEditingDataset({ ...editingDataset, title: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editingDataset.description}
                  onChange={e => setEditingDataset({ ...editingDataset, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Wali Data</label>
                  <input
                    type="text"
                    value={editingDataset.custodian}
                    onChange={e => setEditingDataset({ ...editingDataset, custodian: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tahun Data</label>
                  <input
                    type="number"
                    value={editingDataset.year}
                    onChange={e => setEditingDataset({ ...editingDataset, year: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDataset(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
