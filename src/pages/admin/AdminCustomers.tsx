import React, { useEffect, useState } from 'react';
import { Users, Phone, MapPin, ShoppingBag, MessageSquare } from 'lucide-react';
import { authFetch } from '../../lib/api';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/customers')
      .then(res => res.json())
      .then(data => setCustomers(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalSpend = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const returningCount = customers.filter(c => c.order_count > 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Client Directory
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Customer Profiles & LTV</h1>
        </div>
        <p className="text-xs text-[#71717A]">{customers.length} unique client records</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Total Client Base</span>
          <p className="text-2xl font-bold text-[#18181B] mt-2">{customers.length} clients</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Returning Clients (2+ Orders)</span>
          <p className="text-2xl font-bold text-emerald-800 mt-2">{returningCount} clients</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Cumulative Client Value</span>
          <p className="text-2xl font-bold text-[#18181B] mt-2">₹{totalSpend.toLocaleString()}</p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading client records...</div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#71717A] space-y-2">
            <p className="font-serif text-xl text-[#18181B]">No client accounts yet.</p>
            <p>Customers who place WhatsApp orders will populate this private directory.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-3">WhatsApp Phone</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Orders</th>
                <th className="py-3 px-3">Total Spend</th>
                <th className="py-3 px-4 text-right">Concierge Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F4]">
              {customers.map((c, idx) => (
                <tr key={idx} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3 px-4 font-semibold text-sm text-[#18181B]">{c.customer_name}</td>
                  <td className="py-3 px-3 font-mono text-[#52525B]">{c.customer_phone}</td>
                  <td className="py-3 px-3 text-[#52525B]">
                    {c.city ? `${c.city}, ${c.state}` : 'India'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-stone-100 px-2 py-0.5 font-semibold text-[#18181B] rounded-xs">
                      {c.order_count} orders
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#18181B]">
                    ₹{(c.total_spent || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`https://wa.me/${c.customer_phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.customer_name)}%2C%20LUXEWEAR%20Atelier%20calling.`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </a>
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
