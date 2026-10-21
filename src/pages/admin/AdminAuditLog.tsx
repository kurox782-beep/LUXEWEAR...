import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { AdminAuditLog } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await authFetch('/api/admin/audit-logs');
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Security & Accountability
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Admin Audit Log</h1>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 border border-[#D6D3D1] hover:bg-white text-xs font-semibold uppercase flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#71717A] space-y-2">
            <p className="font-serif text-xl text-[#18181B]">No audit events logged yet.</p>
            <p>Admin actions (creating/editing products, updating stock, changing order statuses) will record here automatically.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Target ID</th>
                <th className="py-3 px-4">Modification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F4]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3 px-4 text-[#71717A] font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#18181B]">{log.admin_email}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] uppercase font-bold bg-stone-100 text-[#18181B] px-2 py-0.5 border border-[#D4D4CE]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px] text-[#52525B] font-medium">{log.entity_type}</td>
                  <td className="py-3 px-3 font-mono text-[#71717A]">#{log.entity_id || '-'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#52525B] max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
