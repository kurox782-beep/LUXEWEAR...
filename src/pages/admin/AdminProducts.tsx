import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Product, Category } from '../../types';
import { authFetch } from '../../lib/api';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Images list: array of { url: string, is_main: boolean }
  const [images, setImages] = useState<Array<{ url: string; is_main: boolean }>>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Variants list: array of { size: string, color: string, stock: number }
  const [variants, setVariants] = useState<Array<{ size: string; color: string; stock: number }>>([
    { size: 'S', color: 'Charcoal Camel', stock: 5 },
    { size: 'M', color: 'Charcoal Camel', stock: 5 },
    { size: 'L', color: 'Charcoal Camel', stock: 5 }
  ]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newVariantStock, setNewVariantStock] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        authFetch('/api/admin/products'),
        authFetch('/api/admin/categories')
      ]);
      const prods = await prodRes.json();
      const cats = await catRes.json();
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setMaterials('100% Long-Staple Combed Natural Fiber');
    setCareInstructions('Specialist dry clean or delicate wash cold.');
    setPrice(4999);
    setSalePrice('');
    setSku(`LW-${Math.floor(1000 + Math.random() * 9000)}`);
    setStock(15);
    setIsFeatured(false);
    setIsNewArrival(true);
    setIsBestSeller(false);
    setIsActive(true);
    setImages([
      { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80', is_main: true }
    ]);
    setVariants([
      { size: 'S', color: 'Bone Chalk', stock: 5 },
      { size: 'M', color: 'Bone Chalk', stock: 5 },
      { size: 'L', color: 'Bone Chalk', stock: 5 }
    ]);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.category_id || '');
    setDescription(p.description);
    setMaterials(p.materials || '');
    setCareInstructions(p.care_instructions || '');
    setPrice(p.price);
    setSalePrice(p.sale_price || '');
    setSku(p.sku || '');
    setStock(p.stock);
    setIsFeatured(p.is_featured === 1);
    setIsNewArrival(p.is_new_arrival === 1);
    setIsBestSeller(p.is_best_seller === 1);
    setIsActive(p.is_active === 1);

    const formattedImgs = (p.images || []).map((img, idx) => ({
      url: img.image_url,
      is_main: Boolean(img.is_main) || idx === 0
    }));
    setImages(formattedImgs.length > 0 ? formattedImgs : [
      { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80', is_main: true }
    ]);

    setVariants((p.variants || []).map(v => ({
      size: v.size,
      color: v.color,
      stock: v.stock
    })));

    setFormError('');
    setModalOpen(true);
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.files) {
        const newImages = data.files.map((f: any, idx: number) => ({
          url: f.url,
          is_main: images.length === 0 && idx === 0
        }));
        setImages(prev => [...prev, ...newImages]);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Network error while uploading image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages(prev => [
      ...prev,
      { url: imageUrlInput.trim(), is_main: prev.length === 0 }
    ]);
    setImageUrlInput('');
  };

  const setAsMainImage = (index: number) => {
    setImages(prev =>
      prev.map((img, idx) => ({
        ...img,
        is_main: idx === index
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length > 0 && !next.some(img => img.is_main)) {
        next[0].is_main = true;
      }
      return next;
    });
  };

  const handleAddVariant = () => {
    if (!newSize.trim() || !newColor.trim()) return;
    setVariants(prev => [
      ...prev,
      { size: newSize.trim(), color: newColor.trim(), stock: Number(newVariantStock) || 0 }
    ]);
    setNewSize('');
    setNewColor('');
    setNewVariantStock(5);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || !description) {
      setFormError('Please fill in required fields: Name, Price, and Description.');
      return;
    }

    if (images.length === 0) {
      setFormError('Please add at least one product photo.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      category_id: categoryId || null,
      description,
      materials,
      care_instructions: careInstructions,
      price: Number(price),
      sale_price: salePrice !== '' ? Number(salePrice) : null,
      sku,
      stock: Number(stock) || 0,
      is_featured: isFeatured ? 1 : 0,
      is_new_arrival: isNewArrival ? 1 : 0,
      is_best_seller: isBestSeller ? 1 : 0,
      is_active: isActive ? 1 : 0,
      images: images.map(img => ({ image_url: img.url, is_main: img.is_main ? 1 : 0 })),
      variants
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await authFetch(`/api/admin/products/${p.id}/toggle`, { method: 'POST' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to deactivate or remove "${p.name}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message || 'Product removed');
      fetchProducts();
    } catch {
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Catalog Management
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">Garments & Products</h1>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#E7E5E4] p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#A1A1AA]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by garment title, SKU, or category..."
          className="w-full text-xs text-[#18181B] placeholder-[#A1A1AA] bg-transparent focus:outline-hidden"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E7E5E4] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A] space-y-2">
            <p className="font-serif text-lg text-[#18181B]">No products found.</p>
            <p>Add a new garment or adjust your search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-[#71717A] uppercase tracking-wider bg-[#FBFBF9]">
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Badges</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {filteredProducts.map((p) => {
                  const mainImg = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80';
                  return (
                    <tr key={p.id} className="hover:bg-[#FBFBF9] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={mainImg}
                            alt=""
                            className="w-12 h-14 object-cover bg-[#F5F5F4] border border-[#E7E5E4]"
                          />
                          <div>
                            <p className="font-semibold text-sm text-[#18181B]">{p.name}</p>
                            <p className="text-[11px] text-[#71717A] font-mono">{p.sku || `ID: ${p.id}`}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#52525B] font-medium">
                        {p.category_name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#18181B]">₹{p.price.toLocaleString()}</p>
                        {p.sale_price && (
                          <p className="text-[11px] text-red-700 font-semibold">Sale: ₹{p.sale_price.toLocaleString()}</p>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`font-semibold ${p.stock <= 3 ? 'text-red-700' : 'text-[#18181B]'}`}>
                          {p.stock} units
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.is_featured === 1 && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 font-medium">Featured</span>
                          )}
                          {p.is_new_arrival === 1 && (
                            <span className="text-[10px] bg-stone-100 text-[#18181B] px-1.5 py-0.5 font-medium">New</span>
                          )}
                          {p.is_best_seller === 1 && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 font-medium">Best Seller</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 flex items-center gap-1 transition-colors ${
                            p.is_active === 1
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-[#71717A] border border-[#D4D4CE]'
                          }`}
                        >
                          {p.is_active === 1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{p.is_active === 1 ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-[#52525B] hover:text-[#18181B] transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-[#A1A1AA] hover:text-red-600 transition-colors"
                            title="Deactivate / Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-4 py-10">
          <div className="bg-[#FBFBF9] max-w-3xl w-full border border-[#D4D4CE] shadow-2xl p-6 sm:p-8 space-y-6 relative h-fit">
            <div className="flex justify-between items-center pb-4 border-b border-[#E7E5E4]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-semibold">
                  {editingProduct ? 'Update Atelier Record' : 'New Catalog Addition'}
                </span>
                <h3 className="font-serif text-2xl text-[#18181B]">
                  {editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Garment'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Double-Breasted Wool Atelier Coat"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, Sale Price, SKU, Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Regular Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Optional discount"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="LW-COAT-001"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Inventory Units *
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the cut, drapery, and construction..."
                  className="w-full bg-white border border-[#D6D3D1] p-3 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              {/* Materials & Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Materials & Composition
                  </label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="e.g. 100% Virgin Wool, Horn Buttons"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Care Instructions
                  </label>
                  <input
                    type="text"
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    placeholder="Specialist dry clean only."
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>
              </div>

              {/* IMAGE SYSTEM SECTION */}
              <div className="space-y-3 p-4 bg-white border border-[#E7E5E4]">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B]">
                    Garment Photography ({images.length} images)
                  </span>
                  <span className="text-[11px] text-[#71717A]">First or checked image is Main Cover</span>
                </div>

                {/* Upload Button & URL adder */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Photos'}</span>
                  </button>

                  <div className="flex gap-2 flex-1">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste direct image URL (Unsplash, CDN...)"
                      className="flex-1 bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-1.5 text-xs text-[#18181B] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 bg-[#F4F4F0] border border-[#D6D3D1] text-xs font-semibold uppercase hover:bg-[#E7E5E4]"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Current Images Preview & Main Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-3/4 bg-[#F5F5F4] border-2 group overflow-hidden ${
                        img.is_main ? 'border-[#18181B]' : 'border-[#E7E5E4]'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.is_main && (
                        <span className="absolute top-1 left-1 bg-[#18181B] text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!img.is_main && (
                          <button
                            type="button"
                            onClick={() => setAsMainImage(idx)}
                            className="p-1 bg-white text-[#18181B] text-[10px] uppercase font-bold px-2 py-1 shadow-xs"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VARIANTS (SIZES & COLORS) SECTION */}
              <div className="space-y-3 p-4 bg-white border border-[#E7E5E4]">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B] block">
                  Sizes & Colors Inventory
                </span>

                <div className="flex flex-wrap gap-2 text-xs">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-[#F4F4F0] border border-[#D6D3D1] flex items-center gap-2"
                    >
                      <span className="font-semibold text-[#18181B]">{v.size}</span>
                      <span className="text-[#71717A]">({v.color})</span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.2">{v.stock} pcs</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-stone-400 hover:text-red-600 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Size (e.g. XL)"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="bg-[#FBFBF9] border border-[#D6D3D1] px-2 py-1.5 text-xs text-[#18181B]"
                  />
                  <input
                    type="text"
                    placeholder="Color (e.g. Onyx)"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="bg-[#FBFBF9] border border-[#D6D3D1] px-2 py-1.5 text-xs text-[#18181B]"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(Number(e.target.value) || 0)}
                    className="bg-[#FBFBF9] border border-[#D6D3D1] px-2 py-1.5 text-xs text-[#18181B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold px-3 py-1.5 hover:bg-[#27272A]"
                  >
                    + Add Variant
                  </button>
                </div>
              </div>

              {/* Flags & Toggles */}
              <div className="flex flex-wrap gap-6 text-xs text-[#18181B] pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded-xs border-[#D6D3D1]"
                  />
                  <span>Mark as Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded-xs border-[#D6D3D1]"
                  />
                  <span>New Arrival Flag</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded-xs border-[#D6D3D1]"
                  />
                  <span>Best Seller Flag</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded-xs border-[#D6D3D1]"
                  />
                  <span>Publish / Active on Storefront</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-transparent border border-[#D6D3D1] text-xs uppercase tracking-wider font-semibold hover:bg-[#F4F4F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Garment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
