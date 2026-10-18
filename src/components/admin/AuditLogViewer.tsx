import React from 'react';
import { History, Shield, Clock } from 'lucide-react';
import { store } from '../../services/store';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = React.useState(() => store.getAuditLogs());

  React.useEffect(() => {
    const update = () => setLogs(store.getAuditLogs());
    return store.subscribe(update);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Catatan Audit Aktivitas Sistem
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log jejak digital setiap aksi penambahan data, verifikasi, pembaruan metadata, dan ekspor.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Log: {logs.length}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Waktu (WIB)</th>
              <th className="px-4 py-2.5 font-semibold">Pengguna & Peran</th>
              <th className="px-4 py-2.5 font-semibold">Tindakan</th>
              <th className="px-4 py-2.5 font-semibold">Target Objek</th>
              <th className="px-4 py-2.5 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-slate-800">{log.user_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{log.user_role}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-[11px] font-semibold text-[#1B4332] bg-[#EBF7EE] px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-700 max-w-xs truncate">
                  {log.target}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-[11px] max-w-sm truncate">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
