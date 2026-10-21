import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const inWishlist = isInWishlist(product.id);

  const [isHovered, setIsHovered] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(product.variants?.[0]?.size || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(product.variants?.[0]?.color || 'Standard');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Images
  const mainImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const secondaryImage = product.images?.[1]?.image_url || mainImage;

  const hasDiscount = product.sale_price !== null && product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = hasDiscount ? product.sale_price! : product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;

  // Extract unique sizes & colors
  const sizes = Array.from(new Set(product.variants?.map(v => v.size) || []));
  const colors = Array.from(new Set(product.variants?.map(v => v.color) || []));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sizes.length > 1 || colors.length > 1) {
      setQuickAddOpen(!quickAddOpen);
    } else {
      confirmAdd();
    }
  };

  const confirmAdd = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = addToCart(product, selectedSize, selectedColor, 1);
    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
      setQuickAddOpen(false);
    }
  };

  return (
    <div
      onClick={() => onNavigate(`/product/${product.slug}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setQuickAddOpen(false);
      }}
      className="group cursor-pointer flex flex-col justify-between relative bg-white border border-[#F0EFEB] hover:border-[#D6D3D1] transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 overflow-hidden bg-[#F5F5F4]">
        {/* Main Image */}
        <img
          src={mainImage}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            isHovered && secondaryImage !== mainImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {/* Secondary Hover Image */}
        {secondaryImage !== mainImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            className={`w-full h-full object-cover absolute inset-0 transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100 pointer-events-none'
            }`}
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {hasDiscount && (
            <span className="bg-[#18181B] text-white text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 shadow-xs">
              -{discountPercent}% OFF
            </span>
          )}
          {product.is_new_arrival === 1 && !hasDiscount && (
            <span className="bg-[#FBFBF9] text-[#18181B] border border-[#D4D4CE] text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5">
              New Arrival
            </span>
          )}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="bg-[#FEF2F2] text-[#991B1B] text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 border border-[#F87171]">
              Only {product.stock} Left
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-[#27272A] text-white text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs transition-colors z-10 ${
            inWishlist ? 'text-red-600' : 'text-[#71717A] hover:text-[#18181B]'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-600' : ''}`} />
        </button>

        {/* Quick Add Overlay on hover for desktop */}
        <div
          className={`absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-xs border-t border-[#E7E5E4] p-3 transition-transform duration-300 z-20 ${
            quickAddOpen || (isHovered && product.stock > 0)
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {quickAddOpen ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#18181B]">Select Variant</span>
                <button
                  onClick={() => setQuickAddOpen(false)}
                  className="text-[10px] text-[#71717A] hover:underline"
                >
                  Close
                </button>
              </div>

              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`text-[10px] px-2 py-1 font-semibold transition-colors ${
                        selectedSize === s
                          ? 'bg-[#18181B] text-white'
                          : 'bg-[#F4F4F0] text-[#18181B] hover:bg-[#E7E5E4]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={confirmAdd}
                className="w-full py-1.5 bg-[#18181B] text-white text-[11px] tracking-wider uppercase font-semibold hover:bg-[#27272A] transition-colors flex items-center justify-center gap-1.5"
              >
                {addedAnimation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{addedAnimation ? 'Added to Bag' : 'Add to Bag'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={product.stock <= 0}
              className="w-full py-2 bg-[#18181B] text-white text-[11px] tracking-[0.15em] uppercase font-semibold hover:bg-[#27272A] transition-colors flex items-center justify-center gap-1.5"
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{product.stock <= 0 ? 'Out of Stock' : 'Quick Add'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#71717A] mb-1 font-medium">
            {product.category_name || 'Atelier Collection'}
          </p>
          <h3 className="text-sm font-medium text-[#18181B] group-hover:text-[#52525B] transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-[#18181B]">₹{currentPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-xs text-[#A1A1AA] line-through">₹{product.price.toLocaleString()}</span>
            )}
          </div>

          {sizes.length > 0 && (
            <div className="text-[10px] text-[#71717A] font-medium tracking-wider">
              {sizes.slice(0, 3).join(' · ')}
              {sizes.length > 3 ? ' +' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
