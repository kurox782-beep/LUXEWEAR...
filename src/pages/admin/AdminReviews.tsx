import React, { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, Filter } from 'lucide-react';
import { Review } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReviews = async () => {
    try {
      const q = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await authFetch(`/api/admin/reviews${q}`);
      const data = await res.json();
      setReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await authFetch(`/api/admin/reviews/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch {
      alert('Failed to update review status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this review from the atelier database?')) return;
    try {
      const res = await authFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReviews();
      }
    } catch {
      alert('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Quality Assurance & Moderation
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Client Feedback & Reviews</h1>
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#18181B] text-white'
                  : 'bg-white border border-[#D6D3D1] text-[#52525B] hover:bg-[#F4F4F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#71717A]">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#71717A] space-y-2">
            <p className="font-serif text-xl text-[#18181B]">No reviews matching filter.</p>
            <p>New reviews submitted by customers on garment pages will queue here for approval.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-[#18181B]">{r.user_name}</span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider ${
                      r.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : r.status === 'REJECTED'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#52525B] leading-relaxed max-w-2xl">"{r.comment}"</p>

                  <div className="flex items-center gap-4 text-[11px] text-[#71717A]">
                    <span>Garment: <strong className="text-[#18181B]">{r.product_name}</strong></span>
                    <span>•</span>
                    <span>Date: {new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {r.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-[#18181B] text-xs uppercase tracking-wider font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-[#A1A1AA] hover:text-red-600 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
