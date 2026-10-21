import React from 'react';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface WishlistPageProps {
  onNavigate: (route: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#18181B]">Your Atelier Wishlist is Empty</h2>
        <p className="text-xs text-[#71717A] max-w-sm mx-auto">
          Save your favorite garments here while considering fabrics and tailored silhouettes.
        </p>
        <button
          onClick={() => onNavigate('/shop')}
          className="mt-2 px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A]"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E7E5E4] flex justify-between items-end">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
            Saved Atelier Pieces
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-1">My Wishlist</h1>
        </div>
        <span className="text-xs text-[#71717A] font-medium">{wishlist.length} saved</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const img = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';
          const price = product.sale_price || product.price;

          return (
            <div key={product.id} className="bg-white border border-[#E7E5E4] flex flex-col justify-between">
              <div
                onClick={() => onNavigate(`/product/${product.slug}`)}
                className="cursor-pointer relative aspect-3/4 overflow-hidden bg-[#F5F5F4]"
              >
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-xs text-[#71717A] hover:text-red-600 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#71717A]">{product.category_name}</p>
                  <h3
                    onClick={() => onNavigate(`/product/${product.slug}`)}
                    className="text-sm font-medium text-[#18181B] hover:text-[#52525B] cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h3>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#E7E5E4]">
                  <span className="text-sm font-semibold text-[#18181B]">₹{price.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      addToCart(product, product.variants?.[0]?.size || 'Standard', product.variants?.[0]?.color || 'Standard');
                    }}
                    className="px-3 py-1.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
