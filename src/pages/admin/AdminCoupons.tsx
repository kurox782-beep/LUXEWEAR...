import React, { useEffect, useState } from 'react';
import { Plus, Tag, Trash2, X, Check } from 'lucide-react';
import { Coupon } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(1500);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await authFetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    setSaving(true);
    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_order_amount: Number(minOrder) || 0
        })
      });
      if (res.ok) {
        setModalOpen(false);
        setCode('');
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create coupon');
      }
    } catch {
      alert('Error creating promotional code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this coupon?')) return;
    try {
      await authFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Promotions & Campaigns
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Promotional Coupons</h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading coupons...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Benefit</th>
                <th className="py-3 px-3">Min Order</th>
                <th className="py-3 px-3">Usage Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F4]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sm bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px] font-semibold text-[#52525B]">
                    {c.discount_type}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#18181B]">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                  </td>
                  <td className="py-3 px-3 text-[#52525B]">
                    {c.min_order_amount > 0 ? `₹${c.min_order_amount.toLocaleString()}` : 'No minimum'}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#18181B]">
                    {c.usage_count} times
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-[#A1A1AA] hover:text-red-600 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-4 py-16">
          <div className="bg-[#FBFBF9] max-w-md w-full border border-[#D4D4CE] shadow-2xl p-6 sm:p-8 space-y-5 relative h-fit">
            <div className="flex justify-between items-center pb-3 border-b border-[#E7E5E4]">
              <h3 className="font-serif text-2xl text-[#18181B]">Create Promotional Code</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#71717A]" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. VIP20"
                  className="w-full bg-white border border-[#D6D3D1] px-3 py-2 uppercase font-mono text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Benefit Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="10"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value) || 0)}
                  placeholder="1500"
                  className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#D6D3D1] uppercase font-semibold text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#18181B] text-white uppercase font-semibold text-[11px] hover:bg-[#27272A]"
                >
                  {saving ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
