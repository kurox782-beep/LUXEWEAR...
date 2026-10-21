import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Shield, Compass, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log visit analytics
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'VISIT' })
    }).catch(() => {});

    // Fetch collections
    Promise.all([
      fetch('/api/products?new_arrival=true&limit=4').then(r => r.json()),
      fetch('/api/products?best_seller=true&limit=4').then(r => r.json()),
      fetch('/api/products?featured=true&limit=4').then(r => r.json()),
      fetch('/api/products?sale=true&limit=4').then(r => r.json())
    ])
      .then(([newRes, bestRes, featRes, saleRes]) => {
        setNewArrivals(newRes.items || []);
        setBestSellers(bestRes.items || []);
        setFeaturedProducts(featRes.items || []);
        setSaleProducts(saleRes.items || []);
      })
      .catch(err => console.error('Failed to load homepage products:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[#F4F4F0] overflow-hidden">
        {/* Background Editorial Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
            alt="LUXEWEAR Editorial Fashion"
            className="w-full h-full object-cover object-[center_30%] filter brightness-90"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full text-white">
          <div className="max-w-2xl space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 flex items-center gap-2">
              <span className="w-8 h-px bg-white/60"></span>
              Atelier Autumn / Winter 2026
            </span>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[1.05] tracking-tight uppercase">
              QUIETLY<br />
              <span className="italic font-normal">REMARKABLE.</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 font-light leading-relaxed max-w-lg">
              Premium everyday clothing designed with clean lines, considered fabrics and a timeless point of view. Crafted in strictly limited atelier batches.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onNavigate('/shop', 'new_arrival=true')}
                className="px-8 py-4 bg-white text-[#18181B] text-xs font-semibold tracking-[0.2em] uppercase hover:bg-stone-100 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span>Shop New Arrivals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('/shop')}
                className="px-8 py-4 bg-transparent border border-white text-white text-xs font-semibold tracking-[0.2em] uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore Collection</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ATELIER PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-y border-[#E7E5E4] py-12">
          <div className="space-y-2">
            <p className="font-serif text-xl text-[#18181B]">01 / Precision Tailoring</p>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Every seam, collar height, and pleat is engineered with architectural geometry to drape cleanly on any silhouette.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-serif text-xl text-[#18181B]">02 / Uncompromised Natural Fibers</p>
            <p className="text-xs text-[#71717A] leading-relaxed">
              We weave strictly with Grade-A Mongolian cashmere, French linen, and 280 GSM Supima cotton that improves with wash and wear.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-serif text-xl text-[#18181B]">03 / Direct WhatsApp Concierge</p>
            <p className="text-xs text-[#71717A] leading-relaxed">
              No generic automated bots. Place orders directly via WhatsApp with our senior atelier staff for bespoke sizing advice.
            </p>
          </div>
        </div>
      </section>

      {/* 3. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-[#E7E5E4]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#71717A] font-semibold">Latest Releases</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-1 font-normal">New Arrivals</h2>
          </div>
          <button
            onClick={() => onNavigate('/shop', 'new_arrival=true')}
            className="text-xs tracking-[0.15em] uppercase font-semibold text-[#18181B] hover:text-[#71717A] flex items-center gap-1 mt-3 sm:mt-0 transition-colors"
          >
            <span>View All ({newArrivals.length}+)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="aspect-3/4 bg-[#E7E5E4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* 4. EDITORIAL LOOKBOOK FEATURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F4F4F0] p-6 sm:p-12 lg:p-16">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
              The Architecture of Comfort
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#18181B] leading-tight">
              Considered Layers for Cooler Climates.
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              Our tailoring studio focuses on unconstructed virgin wool overcoats paired with architectural silhouettes. Designed to move naturally without the rigid stiffness of traditional formalwear.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/shop', 'category=tailoring-outerwear')}
                className="px-6 py-3.5 bg-[#18181B] text-white text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#27272A] transition-colors inline-flex items-center gap-2"
              >
                <span>Shop Outerwear & Tailoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85"
              alt="Atelier Tailored Coat"
              className="w-full h-80 sm:h-96 object-cover bg-white"
            />
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=85"
              alt="Atelier Wool Silhouette"
              className="w-full h-80 sm:h-96 object-cover bg-white mt-8"
            />
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-[#E7E5E4]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#71717A] font-semibold">Client Favorites</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-1 font-normal">Best Sellers</h2>
          </div>
          <button
            onClick={() => onNavigate('/shop', 'sort=best_seller')}
            className="text-xs tracking-[0.15em] uppercase font-semibold text-[#18181B] hover:text-[#71717A] flex items-center gap-1 mt-3 sm:mt-0 transition-colors"
          >
            <span>View All Best Sellers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6. SALE / ATELIER ARCHIVE (IF DISCOUNTED ITEMS) */}
      {saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-[#E7E5E4]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#991B1B] font-semibold">Private Archive</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-1 font-normal">Seasonal Privileges</h2>
            </div>
            <button
              onClick={() => onNavigate('/shop', 'sale=true')}
              className="text-xs tracking-[0.15em] uppercase font-semibold text-[#991B1B] hover:underline flex items-center gap-1 mt-3 sm:mt-0 transition-colors"
            >
              <span>Explore Archive Sale →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {saleProducts.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* 7. WHATSAPP CONCIERGE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#18181B] text-white p-8 sm:p-14 text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold block">
            Direct WhatsApp Experience
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal max-w-xl mx-auto">
            Order seamlessly on WhatsApp without account creation.
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
            Select your pieces, verify sizes with our senior stylists, and confirm your order directly at <strong className="text-white">+91 8319090220</strong>.
          </p>
          <div className="pt-4">
            <a
              href="https://wa.me/918319090220?text=Hello%20LUXEWEAR%2C%20I%20would%20like%20to%20inquire%20about%20your%20atelier%20collection."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs tracking-[0.2em] uppercase font-semibold transition-colors"
            >
              <span>Open WhatsApp Concierge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
