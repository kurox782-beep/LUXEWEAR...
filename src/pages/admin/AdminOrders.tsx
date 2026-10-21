import React, { useEffect, useState } from 'react';
import { Search, Eye, Filter, MessageSquare, Check, X, Clock, ExternalLink } from 'lucide-react';
import { Order } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (search) q.set('search', search);

      const res = await authFetch(`/api/admin/orders?${q.toString()}`);
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: nextStatus as any });
        }
        fetchOrders();
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statuses = ['ALL', 'WHATSAPP_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Fulfillment & Concierge
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">WhatsApp Orders</h1>
        </div>
        <p className="text-xs text-[#71717A]">{orders.length} orders retrieved from database</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7E5E4] p-4 flex flex-col sm:flex-row justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 uppercase tracking-wider font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#18181B] text-white'
                  : 'bg-[#F4F4F0] text-[#52525B] hover:bg-[#E7E5E4]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FBFBF9] border border-[#D6D3D1] text-xs text-[#18181B] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#71717A]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#71717A] space-y-2">
            <p className="font-serif text-xl text-[#18181B]">No orders found.</p>
            <p>Orders submitted by customers via WhatsApp checkout appear here immediately.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#18181B]">{o.order_number}</td>
                    <td className="py-3 px-3 text-[#71717A]">
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[#18181B]">{o.customer_name}</p>
                      <a
                        href={`https://wa.me/${o.customer_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{o.customer_phone}</span>
                      </a>
                    </td>
                    <td className="py-3 px-3 text-[#52525B]">
                      {o.items?.length || 1} pieces
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#18181B]">
                      ₹{o.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 border focus:outline-hidden ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : o.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : o.status === 'PROCESSING'
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                            : o.status === 'SHIPPED'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : o.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-900 border-red-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        <option value="WHATSAPP_PENDING">WHATSAPP_PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-[#18181B] hover:bg-[#E7E5E4] rounded-xs font-semibold text-[11px] uppercase tracking-wider inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-4 py-10">
          <div className="bg-[#FBFBF9] max-w-2xl w-full border border-[#D4D4CE] shadow-2xl p-6 sm:p-8 space-y-6 relative h-fit">
            <div className="flex justify-between items-start pb-4 border-b border-[#E7E5E4]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-semibold">
                  Order Invoice & Summary
                </span>
                <h3 className="font-mono text-2xl font-bold text-[#18181B] mt-0.5">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 border border-[#E7E5E4]">
              <div className="space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[#71717A] block">Customer</span>
                <p className="font-semibold text-sm text-[#18181B]">{selectedOrder.customer_name}</p>
                <p className="text-[#52525B]">Phone: {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && <p className="text-[#52525B]">Email: {selectedOrder.customer_email}</p>}
                <a
                  href={`https://wa.me/${selectedOrder.customer_phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedOrder.customer_name)}%2C%20LUXEWEAR%20Atelier%20calling%20regarding%20Order%20${selectedOrder.order_number}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Direct Customer WhatsApp</span>
                </a>
              </div>

              <div className="space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[#71717A] block">Delivery Address</span>
                <p className="text-[#18181B]">{selectedOrder.shipping_address}</p>
                <p className="text-[#52525B]">{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                <p className="text-[11px] text-[#A1A1AA] pt-2">
                  Created: {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Items with locked price at purchase */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B] block">
                Ordered Garments (Locked Historical Prices)
              </span>
              <div className="divide-y divide-[#E7E5E4] bg-white p-4 border border-[#E7E5E4]">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80'}
                        alt=""
                        className="w-12 h-14 object-cover bg-[#F5F5F4]"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-[#18181B]">{item.product_name}</h4>
                        <p className="text-[#71717A]">
                          Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                        </p>
                        <p className="text-[11px] text-[#A1A1AA]">
                          Unit price locked at purchase: ₹{item.price_at_purchase.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-[#18181B]">₹{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials & Status */}
            <div className="space-y-2 bg-white p-4 border border-[#E7E5E4] text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">₹{selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promotional Discount</span>
                  <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#18181B] pt-2 border-t border-[#E7E5E4]">
                <span>Total Order Value</span>
                <span>₹{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Status Changer in Modal */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B]">Update Status:</span>
              <div className="flex gap-2">
                {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
                      selectedOrder.status === st
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#F4F4F0] text-[#18181B] hover:bg-[#E7E5E4]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
