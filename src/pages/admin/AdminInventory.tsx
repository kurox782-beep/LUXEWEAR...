import React, { useEffect, useState } from 'react';
import { Boxes, AlertTriangle, CheckCircle, Search, Plus, Minus, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchInventory = async () => {
    try {
      const res = await authFetch('/api/admin/products');
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockUpdate = async (productId: number, delta: number) => {
    setUpdatingId(productId);
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newStock = Math.max(0, prod.stock + delta);
    try {
      const res = await authFetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: newStock
        })
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock: newStock } : p))
        );
      }
    } catch {
      alert('Failed to update inventory unit count');
    } finally {
      setUpdatingId(null);
    }
  };

  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 3);
  const outOfStockItems = products.filter(p => p.stock === 0);
  const inStockItems = products.filter(p => p.stock > 3);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Warehouse & Atelier Shelves
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Inventory Control</h1>
        </div>
        <button
          onClick={fetchInventory}
          className="p-2 border border-[#D6D3D1] hover:bg-white text-xs font-semibold uppercase flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold block">Healthy Stock</span>
            <span className="text-2xl font-bold text-emerald-700">{inStockItems.length} styles</span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold block">Low Stock (≤ 3 units)</span>
            <span className="text-2xl font-bold text-amber-700">{lowStockItems.length} styles</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white border border-[#E7E5E4] p-5 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold block">Sold Out</span>
            <span className="text-2xl font-bold text-red-700">{outOfStockItems.length} styles</span>
          </div>
          <Boxes className="w-6 h-6 text-red-600" />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#E7E5E4] p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#A1A1AA]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter inventory by garment name or SKU..."
          className="w-full text-xs text-[#18181B] bg-transparent focus:outline-hidden"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
              <th className="py-3 px-4">Garment</th>
              <th className="py-3 px-3">SKU</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Units in Stock</th>
              <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F4]">
            {filtered.map((p) => {
              const mainImg = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80';
              return (
                <tr key={p.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={mainImg} alt="" className="w-10 h-12 object-cover bg-[#F5F5F4]" />
                      <span className="font-semibold text-[#18181B]">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#71717A]">{p.sku || '-'}</td>
                  <td className="py-3 px-3 text-[#52525B]">{p.category_name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      p.stock === 0
                        ? 'bg-red-50 text-red-800'
                        : p.stock <= 3
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {p.stock === 0 ? 'Out of Stock' : p.stock <= 3 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-sm font-bold text-[#18181B]">{p.stock}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleStockUpdate(p.id, -1)}
                        disabled={p.stock <= 0 || updatingId === p.id}
                        className="p-1.5 border border-[#D6D3D1] hover:bg-[#E7E5E4] text-[#18181B] disabled:opacity-30"
                        title="Deduct 1 unit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStockUpdate(p.id, 1)}
                        disabled={updatingId === p.id}
                        className="p-1.5 border border-[#D6D3D1] hover:bg-[#E7E5E4] text-[#18181B]"
                        title="Add 1 unit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStockUpdate(p.id, 5)}
                        disabled={updatingId === p.id}
                        className="px-2 py-1 border border-[#D6D3D1] hover:bg-[#E7E5E4] text-[10px] font-bold uppercase"
                        title="Add 5 units batch"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
