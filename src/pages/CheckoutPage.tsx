import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, MessageSquare, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CheckoutPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, discount, total, couponCode, clearCart } = useCart();
  const { user } = useAuth();

  // Form Fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#18181B]">Your Atelier Bag is Empty</h2>
        <p className="text-xs text-[#71717A]">
          Please select clothing pieces before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Phone validation (digits check)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit phone number for WhatsApp order updates.');
      return;
    }

    if (!pincode.trim() || pincode.trim().length < 5) {
      setError('Please provide a valid delivery postal code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Submit to backend API which validates prices from database, decrements inventory, and records order
      const payload = {
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
        shippingAddress: address,
        city,
        state,
        pincode,
        couponCode: couponCode || null,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        }))
      };

      const res = await fetch('/api/checkout/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize WhatsApp order.');
      }

      // Order created in database!
      // Clear client cart
      clearCart();

      // Open WhatsApp in new tab / window
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }

      // Route to Order Confirmation page with order number
      onNavigate(`/orders/${data.orderNumber}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/shop')}
        className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B] uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Customer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E7E5E4] p-6 sm:p-10 shadow-xs">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block mb-1">
              Step 1 of 2
            </span>
            <h1 className="font-serif text-3xl text-[#18181B]">Delivery & Client Details</h1>
            <p className="text-xs text-[#71717A] mt-1">
              Your order will be registered in our database, followed by direct WhatsApp dispatch coordination.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                Email Address (Optional, for digital invoice)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                Full Street Delivery Address *
              </label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, suite, building, street address"
                className="w-full bg-[#FBFBF9] border border-[#D6D3D1] p-3 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1.5">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400001"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>
            </div>

            {/* WhatsApp protocol note */}
            <div className="p-4 bg-[#F4F4F0] border border-[#E7E5E4] flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-[#52525B] leading-relaxed">
                <strong className="text-[#18181B] block font-semibold mb-0.5">
                  WhatsApp Store Protocol:
                </strong>
                Clicking the button below securely registers your order in the LUXEWEAR database and generates your unique Order Number. A WhatsApp chat with store concierge <strong>+91 8319090220</strong> will open with your pre-filled order summary.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{loading ? 'Creating Order in Database...' : 'Continue on WhatsApp →'}</span>
            </button>
          </form>
        </div>

        {/* Order Summary (5 cols) */}
        <div className="lg:col-span-5 bg-[#FBFBF9] border border-[#E7E5E4] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
            <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Order Summary</h3>
            <span className="text-xs text-[#71717A]">{items.length} items</span>
          </div>

          {/* Items preview */}
          <div className="divide-y divide-[#E7E5E4] max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 text-xs">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                  alt={item.name}
                  className="w-14 h-16 object-cover bg-[#F5F5F4] shrink-0"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-[#18181B] line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-[#71717A]">
                    {item.size} · {item.color} · Qty: {item.quantity}
                  </p>
                  <p className="font-semibold text-[#18181B] mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="space-y-2 pt-4 border-t border-[#E7E5E4] text-xs text-[#52525B]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#18181B]">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount ({couponCode})</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Insured Courier Dispatch</span>
              <span className="text-emerald-700 font-semibold">COMPLIMENTARY</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-[#18181B] pt-4 border-t border-[#E7E5E4]">
              <span>Total Payable</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[11px] text-[#71717A]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Guaranteed authentic atelier items with complimentary return exchange</span>
          </div>
        </div>
      </div>
    </div>
  );
};
