import React, { useState } from 'react';
import { Shield, Key, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { store, MOCK_USERS } from '../../services/store';

export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'verifikator' | 'surveyor'>('admin');
  const [email, setEmail] = useState('admin.georuhay@lebakkab.go.id');
  const [password, setPassword] = useState('lebakruhay2026');
  const [error, setError] = useState('');

  const handleRoleSelect = (role: 'admin' | 'verifikator' | 'surveyor') => {
    setSelectedRole(role);
    const target = MOCK_USERS.find(u => u.role === role);
    if (target) {
      setEmail(target.email);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Harap masukkan kata sandi.');
      return;
    }

    store.login(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Masuk Sistem GEORuhay
              </h3>
              <p className="text-xs text-slate-500">
                Autentikasi Pengelola & Verifikator Geospasial
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        {/* Role Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Pilih Profil Akun Akses:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRole === 'admin'
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-bold leading-tight">Superadmin</p>
              <p className="text-[10px] opacity-80 mt-0.5">Pemkab / Tim</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('verifikator')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRole === 'verifikator'
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-bold leading-tight">Verifikator</p>
              <p className="text-[10px] opacity-80 mt-0.5">Analis BIG</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('surveyor')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRole === 'surveyor'
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-bold leading-tight">Surveyor</p>
              <p className="text-[10px] opacity-80 mt-0.5">Pejuang Desa</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Email Pengguna</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332] bg-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B4332] bg-white"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Masuk Sekarang</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Sistem autentikasi terhubung ke basis data terenkripsi dan kebijakan hak akses berbasis peran (RBAC).
        </p>
      </div>
    </div>
  );
};
