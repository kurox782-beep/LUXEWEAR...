import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, ArrowRight, Package, Clock, ShieldCheck, Truck } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationPageProps {
  orderNumber: string;
  onNavigate: (route: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderNumber, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#71717A]">Retrieving order receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#18181B]">Order Reference Not Found</h2>
        <p className="text-xs text-[#71717A]">Could not find an order with identifier {orderNumber}.</p>
        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Generate WhatsApp order message URL
  const itemsText = order.items
    ?.map(
      (it) =>
        `*${it.product_name}*\nSize: ${it.size} | Color: ${it.color}\nQty: ${it.quantity} × ₹${it.price_at_purchase.toLocaleString()}\nSubtotal: ₹${it.subtotal.toLocaleString()}`
    )
    .join('\n\n') || '';

  const waMessage =
    `*LUXEWEAR NEW ORDER*\n\n` +
    `*Order Number:* ${order.order_number}\n\n` +
    `*Customer Details:*\n` +
    `Name: ${order.customer_name}\n` +
    `Phone: ${order.customer_phone}\n` +
    `\n*Delivery Address:*\n` +
    `${order.shipping_address}\n` +
    `${order.city}, ${order.state} - ${order.pincode}\n\n` +
    `*Items Ordered:*\n` +
    `${itemsText}\n\n` +
    `-------------------------\n` +
    `Subtotal: ₹${order.subtotal.toLocaleString()}\n` +
    (order.discount > 0 ? `Discount: -₹${order.discount.toLocaleString()}\n` : '') +
    `*Total Amount: ₹${order.total.toLocaleString()}*\n` +
    `-------------------------\n\n` +
    `_Order recorded in LUXEWEAR Atelier system. Please reply to confirm dispatch._`;

  const retryWhatsAppUrl = `https://wa.me/918319090220?text=${encodeURIComponent(waMessage)}`;

  // Direct tracking inquiry message URL
  const trackOrderWhatsAppMsg =
    `*LUXEWEAR ORDER TRACKING INQUIRY*\n\n` +
    `Order Number: *${order.order_number}*\n` +
    `Customer: ${order.customer_name}\n` +
    `Phone: ${order.customer_phone}\n` +
    `Status: ${order.status}\n\n` +
    `Hello LUXEWEAR Atelier, I would like to get a tracking and courier dispatch update for this order.`;

  const directTrackWhatsAppUrl = `https://wa.me/918319090220?text=${encodeURIComponent(trackOrderWhatsAppMsg)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-4 bg-white border border-[#E7E5E4] p-8 sm:p-12 shadow-xs">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
          Order Recorded in Database
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B]">
          Thank you, {order.customer_name}.
        </h1>
        <p className="text-sm font-semibold tracking-wider text-[#18181B]">
          Order Reference: <span className="bg-[#F4F4F0] px-3 py-1 font-mono text-base font-bold">{order.order_number}</span>
        </p>

        {/* Current status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: <strong>{order.status}</strong></span>
        </div>

        <p className="text-xs text-[#71717A] max-w-md mx-auto leading-relaxed pt-2">
          Your order has been safely created in the LUXEWEAR atelier backend. You can send the pre-filled summary on WhatsApp or directly message us anytime to track fulfillment.
        </p>

        {/* Dual Actions: Send Order / Direct Message to Track */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={retryWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs uppercase tracking-[0.15em] font-semibold transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-200" />
            <span>Open WhatsApp with Order</span>
          </a>

          <a
            href={directTrackWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#18181B] hover:bg-[#27272A] text-white text-xs uppercase tracking-[0.15em] font-semibold transition-all shadow-sm"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Direct Message to Track Order</span>
          </a>
        </div>
      </div>

      {/* Order Details Breakdown */}
      <div className="bg-[#FBFBF9] border border-[#E7E5E4] p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-[#E7E5E4]">
          <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Order Details</h3>
          <span className="text-xs text-[#71717A]">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Shipping summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[#71717A] block mb-1">Delivery Destination</span>
            <p className="text-[#18181B] font-medium">{order.customer_name}</p>
            <p className="text-[#52525B]">{order.shipping_address}</p>
            <p className="text-[#52525B]">{order.city}, {order.state} - {order.pincode}</p>
            <p className="text-[#52525B] mt-1">Phone: {order.customer_phone}</p>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wider text-[#71717A] block mb-1">Dispatch Method</span>
            <p className="text-[#18181B] font-medium">Complimentary Insured Express</p>
            <p className="text-[#52525B] mt-1">Store WhatsApp: <strong className="text-emerald-800">+91 8319090220</strong></p>
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-[#E7E5E4] pt-4 border-t border-[#E7E5E4]">
          {order.items?.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 text-xs">
              <img
                src={item.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                alt={item.product_name}
                className="w-16 h-20 object-cover bg-[#F5F5F4] shrink-0"
              />
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-[#18181B] text-sm">{item.product_name}</h4>
                  <p className="text-[#71717A] mt-0.5">
                    Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] mt-1">
                    Price at purchase: ₹{item.price_at_purchase.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-sm text-[#18181B]">₹{item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Calculation */}
        <div className="space-y-2 pt-4 border-t border-[#E7E5E4] text-xs text-[#52525B]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[#18181B]">₹{order.subtotal.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Promotional Discount</span>
              <span>-₹{order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Express Courier</span>
            <span className="text-emerald-700 font-semibold">COMPLIMENTARY</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-[#18181B] pt-4 border-t border-[#E7E5E4]">
            <span>Total Amount</span>
            <span>₹{order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
        <button
          onClick={() => onNavigate('/orders')}
          className="text-xs uppercase tracking-wider font-semibold text-[#18181B] hover:underline"
        >
          Track on Website Timeline →
        </button>

        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#27272A]"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
