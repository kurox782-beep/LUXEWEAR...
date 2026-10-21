import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  onNavigate: (route: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discount,
    total,
    couponCode,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setApplying(true);
    setCouponError('');
    const res = await applyCoupon(inputCoupon.trim());
    setApplying(false);
    if (!res.success) {
      setCouponError(res.error || 'Invalid code');
    } else {
      setInputCoupon('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    onNavigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#18181B]/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FBFBF9] shadow-2xl flex flex-col border-l border-[#E7E5E4] animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-[#E7E5E4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-wider uppercase text-[#18181B] font-semibold">Atelier Bag</span>
              <span className="text-xs px-2 py-0.5 bg-[#E7E5E4] text-[#18181B] font-medium rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#71717A] hover:text-[#18181B] transition-colors"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Note */}
          <div className="bg-[#F4F4F0] px-6 py-2.5 text-[11px] text-[#52525B] flex items-center justify-between border-b border-[#E7E5E4]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Complimentary insured express delivery in India
            </span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#E7E5E4]">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <p className="font-serif text-2xl text-[#18181B]">Your bag is empty.</p>
                <p className="text-xs text-[#71717A] max-w-xs mx-auto">
                  Pieces selected from our collections will appear here for review and direct WhatsApp ordering.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('/shop');
                  }}
                  className="mt-4 px-6 py-3 bg-[#18181B] text-white text-xs tracking-[0.15em] uppercase font-semibold hover:bg-[#27272A] transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-5 flex gap-4 first:pt-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80'}
                    alt={item.name}
                    className="w-20 h-24 object-cover bg-[#F5F5F4] shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium text-[#18181B] line-clamp-1">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#A1A1AA] hover:text-[#DC2626] transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px] text-[#71717A]">
                        <span className="bg-[#EFEFEA] px-2 py-0.5 font-medium text-[#27272A]">Size: {item.size}</span>
                        <span className="bg-[#EFEFEA] px-2 py-0.5 font-medium text-[#27272A]">Color: {item.color}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#D6D3D1] bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-[#71717A] hover:text-[#18181B] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-[#18181B]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className={`p-1 text-[#71717A] hover:text-[#18181B] transition-colors ${item.quantity >= item.maxStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#18181B]">₹{(item.price * item.quantity).toLocaleString()}</p>
                        {item.originalPrice > item.price && (
                          <p className="text-[11px] text-[#A1A1AA] line-through">₹{(item.originalPrice * item.quantity).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Calculations and Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-[#F4F4F0] border-t border-[#E7E5E4] space-y-4">
              {/* Coupon input */}
              <div className="space-y-1.5">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Code applied: <strong>{couponCode}</strong></span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="Promotional code (e.g. LUXE10)"
                      className="flex-1 bg-white border border-[#D6D3D1] px-3 py-2 text-xs uppercase placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#18181B]"
                    />
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#27272A] disabled:opacity-50"
                    >
                      {applying ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#52525B] pt-2 border-t border-[#E7E5E4]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#18181B]">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promotional Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Express Shipping</span>
                  <span className="text-emerald-700 font-medium">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#18181B] pt-2 border-t border-[#E7E5E4]">
                  <span>Total Amount</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-[#18181B] text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#27272A] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Proceed to WhatsApp Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
