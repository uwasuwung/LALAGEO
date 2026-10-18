import React, { useState } from 'react';
import { Users, Shield, UserPlus, CheckCircle2 } from 'lucide-react';
import { store, MOCK_USERS } from '../../services/store';
import { User, Role } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const currentUser = store.getCurrentUser();

  const handleRoleSwitch = (role: 'admin' | 'verifikator' | 'surveyor') => {
    store.login(role);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Manajemen Pengguna & Hak Akses Berbasis Peran (RBAC)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Menerapkan prinsip hak akses minimum (Least Privilege): Superadmin, Verifikator Spasial, Surveyor Desa, dan Publik.
          </p>
        </div>
      </div>

      {/* Role Switcher for Testing/Demonstration */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700">Simulasi Masuk sebagai Pengguna Lain:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {MOCK_USERS.map(u => {
            const isCurrent = currentUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => handleRoleSwitch(u.role as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{u.name} ({u.role.toUpperCase()})</span>
                {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Pengguna</th>
              <th className="px-4 py-3 font-semibold">Email & Kontak</th>
              <th className="px-4 py-3 font-semibold">Instansi / Organisasi</th>
              <th className="px-4 py-3 font-semibold">Peran & Otoritas</th>
              <th className="px-4 py-3 font-semibold">Status Akun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {u.name}
                  {currentUser?.id === u.id && (
                    <span className="ml-2 text-[10px] text-[#1B4332] font-semibold bg-[#D8F3DC] px-1.5 py-0.5 rounded">
                      Anda
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.organization}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] uppercase font-bold text-[#1B4332]">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-[#2D6A4F] font-semibold">Aktif</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
