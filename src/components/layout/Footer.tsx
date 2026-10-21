import React, { useState } from 'react';
import { ArrowRight, MessageSquare, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#18181B] text-[#E4E4E7] pt-20 pb-12 border-t border-[#27272A]">
      {/* Brand Value Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 border-b border-[#27272A]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#27272A] rounded-xs text-[#E4E4E7] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-1">Express Dispatch</h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Complimentary insured courier delivery across India for all bespoke orders.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#27272A] rounded-xs text-[#E4E4E7] shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-1">Direct WhatsApp Concierge</h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Personalized sizing recommendations, fabric inquiries, and order coordination at +91 8319090220.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#27272A] rounded-xs text-[#E4E4E7] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-1">Uncompromising Fabrics</h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Grade-A cashmere, long-staple Supima cotton, and double-faced Australian virgin wool.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <span className="font-serif text-2xl font-bold tracking-[0.25em] uppercase text-white block">
            LUXEWEAR
          </span>
          <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-sm">
            Modern luxury essentials defined by architectural lines, considered drapery, and timeless fabrication. Every piece is crafted in limited batches to ensure exceptional longevity.
          </p>
          <div className="pt-2 text-xs text-[#D4D4D8]">
            <p className="font-medium text-white">Atelier & Studio:</p>
            <p className="text-[#A1A1AA]">Mumbai & New Delhi, India</p>
            <p className="text-[#A1A1AA] mt-1">Direct WhatsApp: <a href="https://wa.me/918319090220" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">+91 8319090220</a></p>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-4">Collections</h4>
          <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
            <li>
              <button onClick={() => onNavigate('/shop', 'new_arrival=true')} className="hover:text-white transition-colors">
                New Arrivals
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/shop', 'category=tailoring-outerwear')} className="hover:text-white transition-colors">
                Tailoring & Outerwear
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/shop', 'category=knitwear-cashmere')} className="hover:text-white transition-colors">
                Cashmere & Knitwear
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/shop', 'category=shirts-tops')} className="hover:text-white transition-colors">
                Shirts & Essentials
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/shop', 'category=accessories')} className="hover:text-white transition-colors">
                Leather Accessories
              </button>
            </li>
          </ul>
        </div>

        {/* Client Services */}
        <div>
          <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-4">Client Services</h4>
          <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
            <li>
              <button onClick={() => onNavigate('/orders')} className="hover:text-white transition-colors">
                Track Order
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">
                Fabric Philosophy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">
                Size & Fitting Guide
              </button>
            </li>
            <li>
              <a href="https://wa.me/918319090220?text=Hi%20LUXEWEAR%2C%20I%20have%20an%20inquiry%20about%20your%20collection" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                WhatsApp Concierge
              </a>
            </li>
            <li>
              <button onClick={() => onNavigate('/account')} className="hover:text-white transition-colors">
                Account Sign In
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/admin')} className="text-[#71717A] hover:text-[#A1A1AA] transition-colors">
                Atelier Admin
              </button>
            </li>
          </ul>
        </div>

        {/* Gazette / Newsletter */}
        <div>
          <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-4">The Atelier Gazette</h4>
          <p className="text-xs text-[#A1A1AA] mb-4 leading-relaxed">
            Subscribe for private collection previews, seasonal editorials, and invitation-only archive releases.
          </p>
          {subscribed ? (
            <p className="text-xs text-emerald-400 font-medium">Thank you. You have been added to our private mailing registry.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-[#27272A] border border-[#3F3F46] px-3 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-hidden focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-white text-[#18181B] hover:bg-[#E4E4E7] transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71717A] border-t border-[#27272A]">
        <p>© {new Date().getFullYear()} LUXEWEAR Atelier India Ltd. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <button onClick={() => onNavigate('/admin')} className="hover:text-white">Admin Access</button>
        </div>
      </div>
    </footer>
  );
};
