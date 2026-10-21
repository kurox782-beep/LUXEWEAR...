import React, { useEffect, useState } from 'react';
import { Filter, X, ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface ShopPageProps {
  onNavigate: (route: string, param?: string) => void;
  initialParams?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, initialParams = '' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlySale, setOnlySale] = useState<boolean>(false);
  const [onlyNew, setOnlyNew] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('featured');
  const [page, setPage] = useState<number>(1);

  // Parse initial query params if present
  useEffect(() => {
    if (initialParams) {
      const sp = new URLSearchParams(initialParams);
      if (sp.has('category')) setSelectedCategory(sp.get('category') || '');
      if (sp.has('new_arrival')) setOnlyNew(sp.get('new_arrival') === 'true');
      if (sp.has('sale')) setOnlySale(sp.get('sale') === 'true');
      if (sp.has('search')) setSearch(sp.get('search') || '');
      if (sp.has('sort')) setSort(sp.get('sort') || 'featured');
    }
  }, [initialParams]);

  // Load Categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch Products whenever filters, sort or page change
  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();

    if (selectedCategory) query.set('category', selectedCategory);
    if (minPrice) query.set('min_price', minPrice);
    if (maxPrice) query.set('max_price', maxPrice);
    if (selectedSize) query.set('size', selectedSize);
    if (selectedColor) query.set('color', selectedColor);
    if (onlyInStock) query.set('in_stock', 'true');
    if (onlySale) query.set('sale', 'true');
    if (onlyNew) query.set('new_arrival', 'true');
    if (search) query.set('search', search);
    if (sort) query.set('sort', sort);
    query.set('page', String(page));
    query.set('limit', '16');

    fetch(`/api/products?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.items || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, minPrice, maxPrice, selectedSize, selectedColor, onlyInStock, onlySale, onlyNew, search, sort, page]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('');
    setSelectedColor('');
    setOnlyInStock(false);
    setOnlySale(false);
    setOnlyNew(false);
    setSearch('');
    setSort('featured');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCategory || minPrice || maxPrice || selectedSize || selectedColor || onlyInStock || onlySale || onlyNew || search
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-8 border-b border-[#E7E5E4] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
            LUXEWEAR Ready-to-Wear
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#18181B] mt-1">The Atelier Collection</h1>
        </div>
        <p className="text-xs text-[#71717A] tracking-wider uppercase font-medium">
          Showing {products.length} of {total} pieces
        </p>
      </div>

      {/* Filter and Sorting Controls Bar */}
      <div className="py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E5E4]">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 border border-[#D6D3D1] text-xs font-semibold uppercase tracking-wider text-[#18181B] hover:bg-[#F4F4F0]"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters {hasActiveFilters && '(Active)'}</span>
        </button>

        {/* Category Pills (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); }}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium transition-colors ${
              !selectedCategory ? 'bg-[#18181B] text-white' : 'bg-[#F4F4F0] text-[#52525B] hover:bg-[#E7E5E4]'
            }`}
          >
            All Pieces
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCategory(c.slug); setPage(1); }}
              className={`px-3 py-1.5 uppercase tracking-wider font-medium transition-colors ${
                selectedCategory === c.slug ? 'bg-[#18181B] text-white' : 'bg-[#F4F4F0] text-[#52525B] hover:bg-[#E7E5E4]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold hidden sm:inline">Sort:</span>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-white border border-[#D6D3D1] px-3 py-1.5 text-xs text-[#18181B] font-medium tracking-wide focus:outline-hidden focus:border-[#18181B]"
          >
            <option value="featured">Featured Atelier</option>
            <option value="newest">Newest Releases</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="best_seller">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-8 pr-6 border-r border-[#E7E5E4]">
          {/* Active Filter Clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">Filters Active</span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#991B1B] hover:underline uppercase font-medium tracking-wider"
              >
                Reset All
              </button>
            </div>
          )}

          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181B]">Quick View</h4>
            <div className="space-y-2 text-xs text-[#52525B]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyNew}
                  onChange={(e) => { setOnlyNew(e.target.checked); setPage(1); }}
                  className="rounded-xs border-[#D6D3D1] text-[#18181B] focus:ring-0"
                />
                <span>New Arrivals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(e) => { setOnlySale(e.target.checked); setPage(1); }}
                  className="rounded-xs border-[#D6D3D1] text-[#18181B] focus:ring-0"
                />
                <span className="text-[#991B1B] font-medium">Archive Sale Pieces</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => { setOnlyInStock(e.target.checked); setPage(1); }}
                  className="rounded-xs border-[#D6D3D1] text-[#18181B] focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181B]">Price Range (₹)</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="w-1/2 bg-white border border-[#D6D3D1] px-2.5 py-1.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
              <span className="text-[#71717A] text-xs">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="w-1/2 bg-white border border-[#D6D3D1] px-2.5 py-1.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>
          </div>

          {/* Sizes Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181B]">Size</h4>
            <div className="flex flex-wrap gap-1.5">
              {['S', 'M', 'L', 'XL', '30', '32', '34', '36', 'One Size'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedSize(selectedSize === s ? '' : s); setPage(1); }}
                  className={`text-xs px-2.5 py-1 font-medium border transition-colors ${
                    selectedSize === s
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-white text-[#27272A] border-[#D6D3D1] hover:border-[#18181B]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181B]">Color Palette</h4>
            <div className="flex flex-wrap gap-1.5">
              {['Charcoal', 'Camel', 'Chalk', 'Onyx', 'Slate', 'Alabaster', 'Beige', 'Espresso'].map((col) => (
                <button
                  key={col}
                  onClick={() => { setSelectedColor(selectedColor === col ? '' : col); setPage(1); }}
                  className={`text-xs px-2.5 py-1 font-medium border transition-colors ${
                    selectedColor === col
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-white text-[#27272A] border-[#D6D3D1] hover:border-[#18181B]'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-3/4 bg-[#E7E5E4] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center space-y-4 bg-white border border-[#E7E5E4] p-8">
              <p className="font-serif text-2xl text-[#18181B]">No pieces match your criteria.</p>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Try widening your price range or clearing filters to explore our full atelier catalog.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-6 py-2.5 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#27272A]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2 pt-8 border-t border-[#E7E5E4]">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 text-xs font-semibold transition-colors ${
                    page === num
                      ? 'bg-[#18181B] text-white'
                      : 'bg-white border border-[#D6D3D1] text-[#18181B] hover:bg-[#F4F4F0]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#FBFBF9] shadow-xl p-6 flex flex-col justify-between z-50 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
                <span className="font-serif text-lg uppercase tracking-wider text-[#18181B]">Filter Collection</span>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-[#18181B]" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] mb-2">Category</h4>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => { setSelectedCategory(''); setMobileFilterOpen(false); }}
                    className={`block w-full text-left py-1 ${!selectedCategory ? 'font-bold text-black' : 'text-[#52525B]'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCategory(c.slug); setMobileFilterOpen(false); }}
                      className={`block w-full text-left py-1 ${selectedCategory === c.slug ? 'font-bold text-black' : 'text-[#52525B]'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick checks */}
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={(e) => setOnlyNew(e.target.checked)}
                  />
                  <span>New Arrivals</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                  />
                  <span className="text-red-700">On Sale</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E7E5E4] space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Apply Filters
              </button>
              <button
                onClick={() => { clearAllFilters(); setMobileFilterOpen(false); }}
                className="w-full py-2 bg-transparent text-[#71717A] text-xs font-semibold uppercase tracking-wider hover:underline"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
