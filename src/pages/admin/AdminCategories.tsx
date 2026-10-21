import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Category } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await authFetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCat(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || '');
    setOrder(c.display_order);
    setIsActive(c.is_active === 1);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      description,
      display_order: order,
      is_active: isActive ? 1 : 0
    };

    try {
      const url = editingCat ? `/api/admin/categories/${editingCat.id}` : '/api/admin/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalOpen(false);
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save category');
      }
    } catch {
      alert('Network error while saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Cannot delete category with assigned garments');
      } else {
        fetchCategories();
      }
    } catch {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Atelier Taxonomy
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Product Categories</h1>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading categories...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Slug</th>
                <th className="py-3 px-3">Garments Count</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F4]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#71717A]">#{c.display_order}</td>
                  <td className="py-3 px-3 font-semibold text-sm text-[#18181B]">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-[#71717A]">{c.slug}</td>
                  <td className="py-3 px-3 font-medium text-[#18181B]">{c.product_count || 0} pieces</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.is_active === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-[#71717A]'
                    }`}>
                      {c.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-[#52525B] hover:text-[#18181B]"
                        title="Edit category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-[#A1A1AA] hover:text-red-600"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-4 py-16">
          <div className="bg-[#FBFBF9] max-w-md w-full border border-[#D4D4CE] shadow-2xl p-6 sm:p-8 space-y-5 relative h-fit">
            <div className="flex justify-between items-center pb-3 border-b border-[#E7E5E4]">
              <h3 className="font-serif text-2xl text-[#18181B]">
                {editingCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#71717A]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heavy Knitwear"
                  className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. heavy-knitwear"
                  className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief editorial collection note"
                  className="w-full bg-white border border-[#D6D3D1] p-3 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded-xs"
                    />
                    <span className="font-semibold uppercase tracking-wider">Active</span>
                  </label>
                </div>
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
