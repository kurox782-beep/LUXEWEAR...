import React from 'react';
import { ArrowRight, ShieldCheck, Feather, Scissors, Compass } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-[#18181B] text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80"
            alt="LUXEWEAR Atelier Tailoring"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4 py-16">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-stone-300">
            The Atelier Manifesto
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl uppercase tracking-tight">
            Considered Clothes for a Thoughtful Life.
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto font-light leading-relaxed">
            Founded with a singular conviction: luxury should not rely on loud logos, but on the invisible discipline of perfect drape, exceptional fibers, and architectural simplicity.
          </p>
        </div>
      </section>

      {/* Main Philosophy */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71717A]">
              01 / Architectural Silhouette
            </span>
            <h2 className="font-serif text-3xl text-[#18181B]">
              Pattern-Making Grounded in Proportion.
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              Every LUXEWEAR garment begins with 3D physical modeling on bespoke dress forms. We examine the way a shoulder seam falls, how reverse pleats open when walking, and where the hem catches over shoes.
            </p>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              We cut our pieces slightly relaxed through the torso, allowing natural movement without sacrificing sharp, intentional contours.
            </p>
          </div>
          <div className="aspect-4/5 overflow-hidden bg-[#F5F5F4] border border-[#E7E5E4]">
            <img
              src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80"
              alt="Atelier Cutting Table"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-4/5 overflow-hidden bg-[#F5F5F4] border border-[#E7E5E4] order-last md:order-first">
            <img
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80"
              alt="Grade-A Cashmere Weave"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71717A]">
              02 / Fiber Sourcing
            </span>
            <h2 className="font-serif text-3xl text-[#18181B]">
              Only Uncompromised Natural Textiles.
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              Synthetic microfibers and polyester blends have no place in the LUXEWEAR wardrobe. We source 100% long-staple Supima cotton from certified farms, 2-ply Grade-A cashmere from Inner Mongolia, and double-faced virgin wool from ethical Australian mills.
            </p>
            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
              These fabrics breathe naturally, age gracefully, and develop character with every gentle laundering.
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp Concierge Ethos */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#F4F4F0] p-8 sm:p-12 border border-[#E7E5E4]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#18181B]">Direct Human Conversation</h3>
          <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
            Unlike mass e-commerce platforms that force customers through endless automated funnels, LUXEWEAR pairs every customer directly with our senior atelier staff on WhatsApp (+91 8319090220). Sizing advice, custom hem requests, and courier updates happen in one personal thread.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/shop')}
              className="px-8 py-3.5 bg-[#18181B] text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#27272A] transition-colors"
            >
              Shop The Current Collection
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
