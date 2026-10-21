import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, User, Menu, X, ArrowRight, Shield, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNav = (route: string, param?: string) => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    onNavigate(route, param);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#18181B] text-[#E4E4E7] text-[11px] tracking-[0.16em] uppercase py-2 px-4 text-center font-medium flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>Complimentary Express Dispatch Across India</span>
        <span className="hidden sm:inline text-stone-600">•</span>
        <button
          onClick={() => handleNav('/orders')}
          className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 transition-colors flex items-center gap-1"
        >
          <span>Direct Message to Track Order</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FBFBF9]/90 backdrop-blur-md shadow-xs border-b border-[#E7E5E4]'
            : 'bg-[#FBFBF9] border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#18181B] hover:text-[#52525B] transition-colors focus:outline-hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Left Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-[13px] tracking-[0.15em] uppercase font-medium">
            <button
              onClick={() => handleNav('/shop')}
              className={`hover:text-[#71717A] transition-colors ${currentRoute === '/shop' ? 'text-black font-semibold border-b border-black pb-0.5' : 'text-[#27272A]'}`}
            >
              Shop All
            </button>
            <button
              onClick={() => handleNav('/shop', 'new_arrival=true')}
              className="hover:text-[#71717A] text-[#27272A] transition-colors"
            >
              New Arrivals
            </button>
            <button
              onClick={() => handleNav('/shop', 'category=tailoring-outerwear')}
              className="hover:text-[#71717A] text-[#27272A] transition-colors"
            >
              Outerwear
            </button>
            <button
              onClick={() => handleNav('/shop', 'category=knitwear-cashmere')}
              className="hover:text-[#71717A] text-[#27272A] transition-colors"
            >
              Knitwear
            </button>
            <button
              onClick={() => handleNav('/shop', 'category=shirts-tops')}
              className="hover:text-[#71717A] text-[#27272A] transition-colors"
            >
              Shirts & Tops
            </button>
            <button
              onClick={() => handleNav('/shop', 'sale=true')}
              className="hover:text-[#991B1B] text-[#991B1B] transition-colors font-semibold"
            >
              Sale
            </button>
            <button
              onClick={() => handleNav('/about')}
              className={`hover:text-[#71717A] transition-colors ${currentRoute === '/about' ? 'text-black font-semibold border-b border-black pb-0.5' : 'text-[#52525B]'}`}
            >
              Atelier
            </button>
          </nav>

          {/* Brand Logo (Center) */}
          <div className="flex-1 lg:flex-none text-center">
            <button
              onClick={() => handleNav('/')}
              className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.3em] uppercase text-[#18181B] hover:opacity-85 transition-opacity"
            >
              LUXEWEAR
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4 text-[#18181B]">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:text-[#71717A] transition-colors"
              aria-label="Search clothing"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Track Order Direct Icon */}
            <button
              onClick={() => handleNav('/orders')}
              className={`p-2 transition-colors relative hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${
                currentRoute === '/orders' ? 'text-emerald-700' : 'text-[#18181B] hover:text-[#71717A]'
              }`}
              title="Track Order on WhatsApp"
            >
              <Truck className="w-4 h-4 text-emerald-700" />
              <span className="text-[11px] hidden md:inline">Track</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => handleNav('/wishlist')}
              className="p-2 hover:text-[#71717A] transition-colors relative"
              aria-label="View wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#18181B] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Account / Admin */}
            <button
              onClick={() => handleNav(user ? '/account' : '/account')}
              className="p-2 hover:text-[#71717A] transition-colors relative"
              aria-label="Account"
              title={user ? (isAdmin ? 'Admin Portal' : user.name) : 'Sign In'}
            >
              <User className="w-5 h-5" />
              {isAdmin && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-600 rounded-full"></span>
              )}
            </button>

            {/* Admin Badge Shortcut if logged in as Admin */}
            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs tracking-wider uppercase bg-[#18181B] text-white hover:bg-[#27272A] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Cart Bag */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:text-[#71717A] transition-colors relative flex items-center gap-1.5"
              aria-label="Open bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="bg-[#18181B] text-white text-[10px] tracking-tight font-semibold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#18181B]/60 backdrop-blur-xs flex flex-col justify-start items-center p-4 pt-20 animate-fade-in">
          <div className="bg-[#FBFBF9] w-full max-w-2xl border border-[#E7E5E4] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
              <span className="font-serif text-lg tracking-wider uppercase text-[#18181B]">Search the Atelier</span>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:text-[#71717A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cashmere, virgin wool coat, silk shirts..."
                autoFocus
                className="w-full bg-white border border-[#D6D3D1] px-4 py-3 text-base text-[#18181B] placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#18181B] transition-colors"
              />
              {searchLoading && (
                <div className="absolute right-3 top-3.5 text-xs text-[#71717A] animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {/* Results */}
            <div className="mt-6 max-h-80 overflow-y-auto divide-y divide-[#F5F5F4]">
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleNav(`/product/${product.slug}`)}
                    className="py-3 flex items-center gap-4 cursor-pointer hover:bg-white px-2 transition-colors"
                  >
                    <img
                      src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'}
                      alt={product.name}
                      className="w-12 h-14 object-cover bg-[#F5F5F4]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#18181B]">{product.name}</p>
                      <p className="text-xs text-[#71717A] uppercase tracking-wider">{product.category_name}</p>
                    </div>
                    <div className="text-sm font-semibold text-[#18181B]">
                      ₹{((product.sale_price || product.price)).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : searchQuery.trim() && !searchLoading ? (
                <p className="text-center py-6 text-sm text-[#71717A]">No pieces found matching "{searchQuery}".</p>
              ) : (
                <div className="py-4">
                  <p className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2 font-semibold">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {['Virgin Wool Coat', 'Brushed Cashmere', 'Supima Cotton Tee', 'Silk Camp Collar', 'Accessories'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="text-xs px-3 py-1.5 bg-[#F4F4F0] hover:bg-[#E7E5E4] text-[#27272A] transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#E7E5E4] text-center">
                <button
                  onClick={() => handleNav('/shop', `search=${encodeURIComponent(searchQuery)}`)}
                  className="text-xs tracking-[0.15em] uppercase font-semibold text-[#18181B] hover:underline"
                >
                  View all results ({searchResults.length}+) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Slide-Out Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-[#18181B]/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#FBFBF9] shadow-xl p-6 flex flex-col justify-between z-50">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E7E5E4]">
                <span className="font-serif text-xl font-bold tracking-[0.25em] uppercase text-[#18181B]">LUXEWEAR</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#18181B]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-4 text-sm tracking-[0.15em] uppercase font-medium text-[#18181B]">
                <button
                  onClick={() => handleNav('/shop')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Shop Collection
                </button>
                <button
                  onClick={() => handleNav('/shop', 'new_arrival=true')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  New Arrivals
                </button>
                <button
                  onClick={() => handleNav('/shop', 'category=tailoring-outerwear')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Tailoring & Outerwear
                </button>
                <button
                  onClick={() => handleNav('/shop', 'category=knitwear-cashmere')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Cashmere & Knitwear
                </button>
                <button
                  onClick={() => handleNav('/shop', 'category=shirts-tops')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Shirts & Tops
                </button>
                <button
                  onClick={() => handleNav('/shop', 'category=accessories')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Atelier Accessories
                </button>
                <button
                  onClick={() => handleNav('/shop', 'sale=true')}
                  className="block w-full text-left py-2 text-[#991B1B] font-semibold border-b border-[#F4F4F0]"
                >
                  Atelier Archive Sale
                </button>
                <button
                  onClick={() => handleNav('/about')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Brand & Atelier Story
                </button>
                <button
                  onClick={() => handleNav('/orders')}
                  className="block w-full text-left py-2 hover:text-[#71717A] border-b border-[#F4F4F0]"
                >
                  Track WhatsApp Order
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E7E5E4] space-y-3">
              <button
                onClick={() => handleNav('/account')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#18181B] text-white text-xs tracking-[0.15em] uppercase font-semibold hover:bg-[#27272A]"
              >
                <User className="w-4 h-4" />
                <span>{user ? 'My Atelier Account' : 'Sign In / Register'}</span>
              </button>

              <button
                onClick={() => handleNav('/admin')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F4F4F0] text-[#18181B] text-xs tracking-[0.15em] uppercase font-semibold border border-[#D4D4CE] hover:bg-[#E7E5E4]"
              >
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Atelier Admin Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
