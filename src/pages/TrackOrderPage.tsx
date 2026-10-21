import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, Truck, Check, AlertCircle, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import { Order } from '../types';

export const TrackOrderPage: React.FC = () => {
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const cleanRef = orderQuery.trim().toUpperCase();
      const res = await fetch(`/api/orders/${cleanRef}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(data.error || 'Order reference not found.');
      }
    } catch {
      setError('Failed to reach atelier servers.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'WHATSAPP_PENDING', label: 'Order Registered' },
    { key: 'CONFIRMED', label: 'Confirmed by Atelier' },
    { key: 'PROCESSING', label: 'Bespoke Packaging' },
    { key: 'SHIPPED', label: 'Dispatched via Courier' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'WHATSAPP_PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  // Direct WhatsApp message URLs
  const getDirectWhatsAppUrl = (ref?: string) => {
    const orderRef = ref || orderQuery.trim().toUpperCase();
    let msg = '';
    if (order) {
      msg = `*LUXEWEAR ORDER TRACKING INQUIRY*\n\n` +
        `Order Number: *${order.order_number}*\n` +
        `Customer: ${order.customer_name}\n` +
        `Phone: ${order.customer_phone}\n` +
        `Current Status: ${order.status}\n\n` +
        `Hello LUXEWEAR Atelier, please provide the latest dispatch and tracking update for my order.`;
    } else if (orderRef) {
      msg = `Hello LUXEWEAR Atelier, I would like to get a tracking update for my order: *${orderRef}*. Please share the current dispatch status.`;
    } else {
      msg = `Hello LUXEWEAR Atelier, I would like to track my order status. Please assist me.`;
    }
    return `https://wa.me/918319090220?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
          Client Concierge & Logistics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B]">Track Your Atelier Order</h1>
        <p className="text-xs text-[#71717A] max-w-md mx-auto">
          Enter your order number (e.g. <strong>LW1024</strong>) to view the fulfillment timeline or send a direct message on WhatsApp for instant assistance.
        </p>
      </div>

      {/* Direct WhatsApp Quick Banner */}
      <div className="bg-emerald-950 text-white p-6 sm:p-7 border border-emerald-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-emerald-900 border border-emerald-700/60 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-900/80 text-emerald-300 text-[10px] uppercase tracking-widest font-semibold mb-1">
              <span>Direct WhatsApp Concierge</span>
            </div>
            <h3 className="font-serif text-xl text-white font-normal">Direct Message to Track Order</h3>
            <p className="text-xs text-emerald-200/90 max-w-lg mt-0.5 leading-relaxed">
              Message our concierge desk directly on WhatsApp at <strong>+91 8319090220</strong>. Provide your order reference or phone number for an immediate dispatch update.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
          <a
            href={getDirectWhatsAppUrl(orderQuery)}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs uppercase tracking-[0.16em] font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 fill-stone-950" />
            <span>{orderQuery.trim() ? `Direct Message for ${orderQuery.trim().toUpperCase()}` : 'Direct Message to Track Order'}</span>
          </a>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleTrack} className="bg-white border border-[#E7E5E4] p-3 shadow-xs space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Enter Order Reference (e.g. LW1024)"
              className="w-full bg-[#FBFBF9] border border-[#E7E5E4] pl-9 pr-3 py-2.5 text-xs uppercase tracking-wider text-[#18181B] focus:outline-hidden focus:border-[#18181B] placeholder-[#A1A1AA]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold uppercase tracking-[0.15em] transition-colors disabled:opacity-50 shrink-0"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>

        {orderQuery.trim() && (
          <div className="flex justify-end pt-1">
            <a
              href={getDirectWhatsAppUrl(orderQuery)}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct WhatsApp message for {orderQuery.trim().toUpperCase()} →</span>
            </a>
          </div>
        )}
      </form>

      {/* Result Display */}
      {searched && (
        <>
          {error && (
            <div className="p-6 bg-white border border-red-200 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-red-700">{error}</p>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Don't have your reference? Message our WhatsApp desk with your name or phone number to retrieve your order.
              </p>
              <div>
                <a
                  href={`https://wa.me/918319090220?text=${encodeURIComponent(`Hello LUXEWEAR Atelier, I placed an order but need help tracking it. Please look up my details.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask WhatsApp Concierge to Find My Order</span>
                </a>
              </div>
            </div>
          )}

          {order && (
            <div className="bg-white border border-[#E7E5E4] p-6 sm:p-8 space-y-8 shadow-xs">
              {/* Order Reference & Date */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E7E5E4]">
                <div>
                  <span className="text-[11px] text-[#71717A] uppercase tracking-wider block">Order Reference</span>
                  <h2 className="font-mono text-2xl font-bold text-[#18181B]">{order.order_number}</h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-[#71717A] uppercase tracking-wider block">Order Date</span>
                  <span className="text-xs font-medium text-[#18181B]">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Direct Message Action Card inside the order */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Direct WhatsApp Order Support
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Send a pre-filled WhatsApp message to our logistics desk for instant updates on <strong>{order.order_number}</strong>.
                  </p>
                </div>
                <a
                  href={getDirectWhatsAppUrl(order.order_number)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message on WhatsApp</span>
                </a>
              </div>

              {/* Status Timeline */}
              {order.status === 'CANCELLED' ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  This order has been marked as CANCELLED by the atelier team.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B]">
                      Fulfillment Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    {steps.map((step, idx) => {
                      const isComplete = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div
                          key={step.key}
                          className={`p-3 border text-xs transition-colors ${
                            isCurrent
                              ? 'border-[#18181B] bg-[#18181B] text-white font-semibold'
                              : isComplete
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-[#E7E5E4] bg-[#FBFBF9] text-[#A1A1AA]'
                          }`}
                        >
                          <div className="w-5 h-5 mx-auto mb-1.5 flex items-center justify-center">
                            {isComplete && !isCurrent ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-[10px] font-mono">{idx + 1}</span>
                            )}
                          </div>
                          <span className="text-[11px] tracking-tight block leading-tight">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery destination */}
              <div className="bg-[#FBFBF9] p-4 border border-[#E7E5E4] text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[#71717A] block mb-1">
                  Recipient & Destination
                </span>
                <p className="font-medium text-[#18181B]">{order.customer_name} ({order.customer_phone})</p>
                <p className="text-[#52525B]">{order.shipping_address}, {order.city}, {order.state} - {order.pincode}</p>
              </div>

              {/* Items in order */}
              <div className="space-y-4 pt-4 border-t border-[#E7E5E4]">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B] block">
                  Items in this Order ({order.items?.length || 0})
                </span>
                <div className="divide-y divide-[#E7E5E4]">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                          alt={item.product_name}
                          className="w-12 h-14 object-cover bg-[#F5F5F4]"
                        />
                        <div>
                          <p className="font-medium text-[#18181B]">{item.product_name}</p>
                          <p className="text-[#71717A]">
                            Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-[#18181B]">₹{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E7E5E4] flex justify-between text-sm font-semibold text-[#18181B]">
                  <span>Total Amount</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Bottom WhatsApp Contact Button */}
              <div className="pt-4 border-t border-[#E7E5E4] flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-[#71717A]">Direct Line: +91 8319090220</span>
                <a
                  href={getDirectWhatsAppUrl(order.order_number)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Direct Message to Track {order.order_number}</span>
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
