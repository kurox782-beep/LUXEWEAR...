import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Eye, ShoppingCart, ShoppingBag, DollarSign, Award, ArrowDown } from 'lucide-react';
import { authFetch } from '../../lib/api';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/analytics')
      .then(res => res.json())
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#71717A]">Calculating database analytics...</div>;
  }

  if (!data) {
    return <div className="p-8 bg-red-50 text-red-700 text-xs">Failed to load database analytics.</div>;
  }

  const { funnel, summary, dailyRevenue, topViewed, bestSelling } = data;

  // Calculate funnel conversion rates
  const getRate = (num: number, base: number) => {
    if (!base || base === 0) return '0%';
    return `${Math.min(100, Math.round((num / base) * 100))}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#E7E5E4] flex justify-between items-end">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Atelier Intelligence
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Sales & Conversion Analytics</h1>
        </div>
        <p className="text-xs text-[#71717A]">Computed live from event logs and order receipts</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Total Atelier Gross</span>
          <p className="text-3xl font-serif font-bold text-[#18181B] mt-2">₹{summary.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Across all confirmed WhatsApp orders</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Average Order Value (AOV)</span>
          <p className="text-3xl font-serif font-bold text-[#18181B] mt-2">₹{summary.averageOrderValue.toLocaleString()}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Net average value per customer transaction</p>
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Total Orders</span>
          <p className="text-3xl font-serif font-bold text-[#18181B] mt-2">{summary.totalOrders}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Fulfillment lifecycle records</p>
        </div>
      </div>

      {/* Real Conversion Funnel */}
      <div className="bg-white border border-[#E7E5E4] p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Customer Conversion Funnel</h3>
          <p className="text-xs text-[#71717A]">
            Direct drop-off analysis from unique session visitors down to final WhatsApp order creation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Step 1: Visitors */}
          <div className="p-4 bg-[#FBFBF9] border border-[#E7E5E4] text-center space-y-1">
            <Users className="w-5 h-5 text-[#71717A] mx-auto mb-1" />
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] block font-semibold">1. Storefront Visits</span>
            <span className="text-2xl font-bold text-[#18181B]">{funnel.visitors}</span>
            <span className="text-[10px] text-[#A1A1AA] block">100% Base Traffic</span>
          </div>

          {/* Step 2: Views */}
          <div className="p-4 bg-[#FBFBF9] border border-[#E7E5E4] text-center space-y-1">
            <Eye className="w-5 h-5 text-[#71717A] mx-auto mb-1" />
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] block font-semibold">2. Product Views</span>
            <span className="text-2xl font-bold text-[#18181B]">{funnel.productViews}</span>
            <span className="text-[10px] text-emerald-700 block font-semibold">
              {getRate(funnel.productViews, funnel.visitors)} of visitors
            </span>
          </div>

          {/* Step 3: Add to Bag */}
          <div className="p-4 bg-[#FBFBF9] border border-[#E7E5E4] text-center space-y-1">
            <ShoppingCart className="w-5 h-5 text-[#71717A] mx-auto mb-1" />
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] block font-semibold">3. Added to Bag</span>
            <span className="text-2xl font-bold text-[#18181B]">{funnel.addToCarts}</span>
            <span className="text-[10px] text-emerald-700 block font-semibold">
              {getRate(funnel.addToCarts, funnel.productViews)} of views
            </span>
          </div>

          {/* Step 4: Checkout */}
          <div className="p-4 bg-[#FBFBF9] border border-[#E7E5E4] text-center space-y-1">
            <TrendingUp className="w-5 h-5 text-[#71717A] mx-auto mb-1" />
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] block font-semibold">4. Checkout Started</span>
            <span className="text-2xl font-bold text-[#18181B]">{funnel.checkoutStarts}</span>
            <span className="text-[10px] text-emerald-700 block font-semibold">
              {getRate(funnel.checkoutStarts, funnel.addToCarts)} of bag
            </span>
          </div>

          {/* Step 5: WhatsApp Orders */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-center space-y-1 text-emerald-950">
            <ShoppingBag className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
            <span className="text-[11px] uppercase tracking-wider font-semibold block text-emerald-800">5. WhatsApp Orders</span>
            <span className="text-2xl font-bold text-emerald-900">{funnel.orders}</span>
            <span className="text-[10px] text-emerald-700 block font-semibold">
              {getRate(funnel.orders, funnel.checkoutStarts)} completion
            </span>
          </div>
        </div>
      </div>

      {/* Top Viewed and Best Selling Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Viewed */}
        <div className="bg-white border border-[#E7E5E4] p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Most Viewed Garments</h3>
          {topViewed.length === 0 ? (
            <p className="text-xs text-[#71717A]">No view activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#F5F5F4]">
              {topViewed.map((p: any, idx: number) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#A1A1AA] font-bold">#{idx + 1}</span>
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-10 h-12 object-cover bg-[#F5F5F4]"
                    />
                    <div>
                      <p className="font-semibold text-[#18181B]">{p.name}</p>
                      <p className="text-[11px] text-[#71717A]">₹{p.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-[#18181B]">{p.views_count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Selling */}
        <div className="bg-white border border-[#E7E5E4] p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Best Selling Pieces (By Units)</h3>
          {bestSelling.length === 0 ? (
            <p className="text-xs text-[#71717A]">No sales records yet. Completed orders will rank here.</p>
          ) : (
            <div className="divide-y divide-[#F5F5F4]">
              {bestSelling.map((b: any, idx: number) => (
                <div key={b.product_id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-800 font-bold">#{idx + 1}</span>
                    <img
                      src={b.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-10 h-12 object-cover bg-[#F5F5F4]"
                    />
                    <div>
                      <p className="font-semibold text-[#18181B]">{b.product_name}</p>
                      <p className="text-[11px] text-[#71717A]">Generated: ₹{Number(b.total_generated).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#18181B]">{b.units_sold} units sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
