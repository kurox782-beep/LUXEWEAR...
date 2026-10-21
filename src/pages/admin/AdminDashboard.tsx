import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Eye,
  ShoppingCart,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { AdminStats } from '../../types';
import { authFetch } from '../../lib/api';

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
  onViewOrder: (orderNumber: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectTab, onViewOrder }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized or failed to load stats');
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#E7E5E4]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#E7E5E4]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 text-red-700 text-xs">
        Failed to load database statistics. {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Real-Time Atelier Metrics
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-0.5">Atelier Overview</h1>
        </div>
        <p className="text-xs text-[#71717A]">All figures calculated directly from SQL records</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Total Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-semibold text-[#18181B]">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-[#71717A] mt-0.5">From {stats.totalOrders} recorded orders</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Orders Registered</span>
            <div className="p-2 bg-stone-100 text-[#18181B] rounded-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-semibold text-[#18181B]">{stats.totalOrders}</p>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-[11px] text-[#18181B] hover:underline font-medium mt-0.5 flex items-center gap-1"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Active Catalog</span>
            <div className="p-2 bg-stone-100 text-[#18181B] rounded-xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-semibold text-[#18181B]">{stats.totalProducts} pieces</p>
            <button
              onClick={() => onSelectTab('products')}
              className="text-[11px] text-[#18181B] hover:underline font-medium mt-0.5 flex items-center gap-1"
            >
              <span>Manage catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Pending Reviews</span>
            <div className={`p-2 rounded-xs ${stats.pendingReviews > 0 ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-[#71717A]'}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-semibold text-[#18181B]">{stats.pendingReviews}</p>
            <button
              onClick={() => onSelectTab('reviews')}
              className="text-[11px] text-[#18181B] hover:underline font-medium mt-0.5 flex items-center gap-1"
            >
              <span>Moderate queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Engagement & Funnel Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-medium block">Product Views</span>
            <span className="text-xl font-semibold text-[#18181B]">{stats.productViews}</span>
          </div>
          <Eye className="w-5 h-5 text-[#71717A]" />
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-medium block">Add-to-Cart Actions</span>
            <span className="text-xl font-semibold text-[#18181B]">{stats.addToCartEvents}</span>
          </div>
          <ShoppingCart className="w-5 h-5 text-[#71717A]" />
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-medium block">Checkout Initializations</span>
            <span className="text-xl font-semibold text-[#18181B]">{stats.checkoutEvents}</span>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs space-y-4 p-6">
        <div className="flex justify-between items-center pb-4 border-b border-[#E7E5E4]">
          <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Recent WhatsApp Orders</h3>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs uppercase tracking-wider font-semibold text-[#18181B] hover:underline"
          >
            View All Orders →
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A]">
            No customer orders recorded in database yet. Place a test order from the storefront.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#18181B]">{o.order_number}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-[#18181B]">{o.customer_name}</p>
                      <p className="text-[11px] text-[#71717A]">{o.customer_phone}</p>
                    </td>
                    <td className="py-3 px-3 text-[#52525B]">{(o as any).item_count || 1} items</td>
                    <td className="py-3 px-3 font-semibold text-[#18181B]">₹{o.total.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : o.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-800'
                          : o.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectTab('orders')}
                        className="text-xs text-[#18181B] hover:underline font-semibold uppercase tracking-wider"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
