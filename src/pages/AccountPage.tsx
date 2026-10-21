import React, { useState, useEffect } from 'react';
import { User, Package, LogOut, ArrowRight, ShieldCheck, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { authFetch } from '../lib/api';

interface AccountPageProps {
  onNavigate: (route: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, login, register, logout, isAdmin } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Customer orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setOrdersLoading(true);
      authFetch('/api/customer/orders')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(err => console.error(err))
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
      const res = await register(name, email, password);
      if (!res.success) setError(res.error || 'Registration failed');
    } else {
      const res = await login(email, password);
      if (!res.success) setError(res.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white border border-[#E7E5E4] p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
              LUXEWEAR Client Access
            </span>
            <h1 className="font-serif text-3xl text-[#18181B]">
              {isRegistering ? 'Create Client Account' : 'Atelier Sign In'}
            </h1>
            <p className="text-xs text-[#71717A]">
              {isRegistering
                ? 'Register to manage orders and saved atelier addresses.'
                : 'Sign in to review your previous WhatsApp orders.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vikram Malhotra"
                  className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#27272A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#E7E5E4] text-xs">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-[#52525B] hover:text-[#18181B] underline font-medium"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New to LUXEWEAR? Create an account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Account Profile Header */}
      <div className="bg-white border border-[#E7E5E4] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block mb-1">
            Client Profile
          </span>
          <h1 className="font-serif text-3xl text-[#18181B]">{user.name}</h1>
          <p className="text-xs text-[#71717A] mt-0.5">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onNavigate('/admin')}
              className="px-4 py-2 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A] flex items-center gap-1.5"
            >
              <span>Atelier Admin Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => logout()}
            className="px-4 py-2 border border-[#D6D3D1] text-[#18181B] text-xs uppercase tracking-wider font-semibold hover:bg-[#F4F4F0] flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Orders History */}
      <div className="space-y-6">
        <div className="flex justify-between items-end pb-4 border-b border-[#E7E5E4]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
              Fulfillment History
            </span>
            <h2 className="font-serif text-2xl text-[#18181B]">My WhatsApp Orders</h2>
          </div>
          <span className="text-xs text-[#71717A]">{orders.length} registered orders</span>
        </div>

        {ordersLoading ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] p-12 text-center space-y-3">
            <Package className="w-8 h-8 text-[#A1A1AA] mx-auto" />
            <p className="font-serif text-xl text-[#18181B]">No orders found for this email.</p>
            <p className="text-xs text-[#71717A]">
              When placing orders with your email, they will automatically appear here with status tracking.
            </p>
            <button
              onClick={() => onNavigate('/shop')}
              className="mt-3 px-6 py-2.5 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white border border-[#E7E5E4] p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#E7E5E4]">
                  <div>
                    <span className="font-mono text-base font-bold text-[#18181B]">{o.order_number}</span>
                    <span className="text-xs text-[#71717A] ml-3">
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 ${
                      o.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : o.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {o.status}
                    </span>

                    <a
                      href={`https://wa.me/918319090220?text=${encodeURIComponent(
                        `*LUXEWEAR ORDER TRACKING INQUIRY*\n\nOrder Number: *${o.order_number}*\nCustomer: ${o.customer_name}\nCurrent Status: ${o.status}\n\nHello LUXEWEAR Atelier, please provide the latest dispatch and tracking update for this order.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] uppercase tracking-wider font-semibold transition-colors shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Direct Message to Track</span>
                    </a>

                    <button
                      onClick={() => onNavigate(`/orders/${o.order_number}`)}
                      className="text-xs font-semibold uppercase tracking-wider text-[#18181B] hover:underline"
                    >
                      View Receipt →
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-[#F5F5F4]">
                  {o.items?.map((it) => (
                    <div key={it.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                          alt={it.product_name}
                          className="w-10 h-12 object-cover bg-[#F5F5F4]"
                        />
                        <div>
                          <p className="font-medium text-[#18181B]">{it.product_name}</p>
                          <p className="text-[11px] text-[#71717A]">{it.size} · {it.color} · Qty: {it.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium text-[#18181B]">₹{it.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-semibold border-t border-[#F5F5F4]">
                  <span>Total Amount</span>
                  <span className="text-sm">₹{o.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
