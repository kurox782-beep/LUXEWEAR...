import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, ArrowRight, Star, ShieldCheck, Ruler, Truck, RefreshCw, Check, Sparkles } from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/product/ProductCard';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (route: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [productData, setProductData] = useState<{
    product: Product & {
      ratingStats: {
        totalReviews: number;
        averageRating: string;
        distribution: Record<number, number>;
      };
      reviews: Review[];
      related: any[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Cross-selling: You May Also Like state
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Product not found in atelier catalog.');
        return res.json();
      })
      .then((data) => {
        setProductData(data);
        const p = data.product;
        if (p.variants && p.variants.length > 0) {
          setSelectedSize(p.variants[0].size);
          setSelectedColor(p.variants[0].color);
        }
        if (p.related && p.related.length > 0) {
          setRelatedProducts(p.related);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch cross-sell products from the exact same category
  useEffect(() => {
    if (!productData?.product) return;
    const current = productData.product;

    if (current.category_slug || current.category_id) {
      setRelatedLoading(true);
      const catQuery = current.category_slug ? `category=${encodeURIComponent(current.category_slug)}` : '';
      fetch(`/api/products?${catQuery}&limit=8`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.items)) {
            const filtered = data.items.filter((item: Product) => item.id !== current.id && item.slug !== current.slug);
            if (filtered.length > 0) {
              setRelatedProducts(filtered.slice(0, 4));
            }
          }
        })
        .catch(err => console.error('Failed to fetch related category products:', err))
        .finally(() => setRelatedLoading(false));
    }
  }, [productData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-3/4 bg-[#E7E5E4]" />
        <div className="space-y-6">
          <div className="h-6 w-32 bg-[#E7E5E4]" />
          <div className="h-10 w-3/4 bg-[#E7E5E4]" />
          <div className="h-8 w-40 bg-[#E7E5E4]" />
          <div className="h-24 w-full bg-[#E7E5E4]" />
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#18181B]">Piece Unavailable</h2>
        <p className="text-xs text-[#71717A]">{error || 'This garment could not be found.'}</p>
        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-3 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold"
        >
          Return to Atelier Collection
        </button>
      </div>
    );
  }

  const { product } = productData;
  const inWishlist = isInWishlist(product.id);

  // Variant resolution
  const selectedVariant = product.variants?.find((v) => v.size === selectedSize && v.color === selectedColor);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const hasDiscount = product.sale_price !== null && product.sale_price > 0 && product.sale_price < product.price;
  const activePrice = hasDiscount ? product.sale_price! : product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;

  const images = product.images || [];
  const currentMainImage = images[selectedImageIndex]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85';

  const sizes = Array.from(new Set(product.variants?.map((v) => v.size) || []));
  const colors = Array.from(new Set(product.variants?.map((v) => v.color) || []));

  const handleAddToCart = () => {
    const res = addToCart(product, selectedSize || 'Standard', selectedColor || 'Standard', quantity);
    if (res.success) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  const handleBuyNow = () => {
    const res = addToCart(product, selectedSize || 'Standard', selectedColor || 'Standard', quantity);
    if (res.success) {
      onNavigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccessMessage('');

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName,
          email: reviewEmail,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMessage(data.message || 'Your review has been submitted for atelier moderation.');
        setReviewName('');
        setReviewEmail('');
        setReviewComment('');
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch {
      setReviewError('Network error while submitting review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20">
      {/* Schema.org Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            image: images.map((i) => i.image_url),
            description: product.description,
            sku: product.sku,
            brand: {
              '@type': 'Brand',
              name: 'LUXEWEAR'
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: activePrice,
              availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              seller: {
                '@type': 'Organization',
                name: 'LUXEWEAR Atelier'
              }
            },
            aggregateRating:
              product.ratingStats.totalReviews > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.ratingStats.averageRating,
                    reviewCount: product.ratingStats.totalReviews
                  }
                : undefined
          })
        }}
      />

      {/* Top Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 md:w-20">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 md:w-20 md:h-24 bg-[#F5F5F4] overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx ? 'border-[#18181B]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Photo */}
          <div className="flex-1 bg-[#F5F5F4] aspect-3/4 overflow-hidden relative border border-[#E7E5E4]">
            <img
              src={currentMainImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-[#18181B] text-white text-xs uppercase tracking-wider font-semibold px-3 py-1 shadow-xs">
                -{discountPercent}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-[#18181B] hover:text-red-600 transition-colors"
              aria-label="Toggle wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current text-red-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Details & Purchase Form (5 cols) */}
        <div className="lg:col-span-5 space-y-8 lg:pl-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block mb-1">
              {product.category_name || 'Atelier Garment'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B] leading-tight font-normal">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            {product.ratingStats.totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(Number(product.ratingStats.averageRating)) ? 'fill-current' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#71717A] font-medium">
                  {product.ratingStats.averageRating} ({product.ratingStats.totalReviews} atelier reviews)
                </span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-6 border-b border-[#E7E5E4]">
            <span className="text-2xl sm:text-3xl font-semibold text-[#18181B]">₹{activePrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-base text-[#A1A1AA] line-through">₹{product.price.toLocaleString()}</span>
            )}
            <span className="text-xs text-[#52525B] ml-2">Inclusive of all duties & taxes</span>
          </div>

          {/* Stock Availability Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOutOfStock ? 'bg-red-600' : currentStock <= 3 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
              {isOutOfStock ? 'Out of Stock' : currentStock <= 3 ? `Only ${currentStock} left in atelier stock` : 'In Stock & Ready for Dispatch'}
            </span>
          </div>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#18181B]">Color:</span>
                <span className="text-[#71717A] font-medium">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedColor === col
                        ? 'border-[#18181B] bg-[#18181B] text-white'
                        : 'border-[#D6D3D1] bg-white text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#18181B]">Select Size:</span>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium underline"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-2 text-xs font-semibold border transition-all text-center ${
                      selectedSize === s
                        ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs'
                        : 'border-[#D6D3D1] bg-white text-[#18181B] hover:border-[#18181B]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#18181B]">Quantity:</span>
            <div className="flex items-center border border-[#D6D3D1] bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-sm text-[#71717A] hover:text-[#18181B]"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-[#18181B]">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="px-3 py-1 text-sm text-[#71717A] hover:text-[#18181B]"
                disabled={quantity >= currentStock}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-4 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#27272A] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
            >
              {addedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{isOutOfStock ? 'Sold Out' : addedNotice ? 'Added to Atelier Bag' : 'Add to Atelier Bag'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-4 bg-transparent border border-[#18181B] text-[#18181B] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#F4F4F0] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Instant WhatsApp Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Description & Accordion Info */}
          <div className="space-y-4 pt-6 border-t border-[#E7E5E4] text-xs text-[#52525B]">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[#18181B] mb-2">Description</h4>
              <p className="leading-relaxed">{product.description}</p>
            </div>

            {product.materials && (
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-[#18181B] mb-1">Materials & Composition</h4>
                <p className="leading-relaxed text-[#71717A]">{product.materials}</p>
              </div>
            )}

            {product.care_instructions && (
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-[#18181B] mb-1">Atelier Garment Care</h4>
                <p className="leading-relaxed text-[#71717A]">{product.care_instructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="pt-16 border-t border-[#E7E5E4] space-y-12">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold">
              Verified Atelier Feedback
            </span>
            <h2 className="font-serif text-3xl text-[#18181B] mt-1 font-normal">Client Reviews</h2>
          </div>
          <div className="text-right">
            <span className="text-3xl font-serif font-bold text-[#18181B]">{product.ratingStats.averageRating}</span>
            <span className="text-xs text-[#71717A] block">out of 5 stars based on {product.ratingStats.totalReviews} reviews</span>
          </div>
        </div>

        {/* Reviews Grid & Submission Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Approved Reviews List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {product.reviews.length === 0 ? (
              <div className="py-12 px-6 bg-[#F4F4F0] text-center space-y-2">
                <p className="font-serif text-lg text-[#18181B]">No verified client reviews yet.</p>
                <p className="text-xs text-[#71717A]">
                  Be the first to share your thoughts on this garment after receiving your WhatsApp order.
                </p>
              </div>
            ) : (
              product.reviews.map((rev) => (
                <div key={rev.id} className="p-6 bg-white border border-[#E7E5E4] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-[#18181B]">{rev.user_name}</h4>
                      <p className="text-[11px] text-[#A1A1AA]">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#52525B] leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Write a Review Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#FBFBF9] border border-[#E7E5E4] p-6 sm:p-8 space-y-4">
            <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Write an Atelier Review</h3>
            <p className="text-xs text-[#71717A]">
              Submitted reviews undergo verification by the atelier team before appearing publicly.
            </p>

            {reviewSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                {reviewSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Email Address (Private)
                  </label>
                  <input
                    type="email"
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    placeholder="For order verification"
                    className="w-full bg-white border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-stone-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
                    Your Review Commentary *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the fabric weight, drape, fit, and craftsmanship..."
                    className="w-full bg-white border border-[#D6D3D1] p-3 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
                  />
                </div>

                {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-3 bg-[#18181B] text-white text-xs uppercase tracking-[0.15em] font-semibold hover:bg-[#27272A] transition-colors disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Cross-selling: You May Also Like Section */}
      {(relatedProducts.length > 0 || relatedLoading) && (
        <section className="pt-16 border-t border-[#E7E5E4] space-y-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-3 pb-4 border-b border-[#E7E5E4]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
                Complete The Look • Curated Ensemble
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#18181B] mt-1 font-normal">
                You May Also Like
              </h2>
              {product.category_name && (
                <p className="text-xs text-[#71717A] mt-1">
                  Complimentary designs tailored from our {product.category_name} atelier archive.
                </p>
              )}
            </div>
            {product.category_slug && (
              <button
                onClick={() => onNavigate('/shop', `category=${product.category_slug}`)}
                className="text-xs uppercase tracking-[0.15em] font-semibold text-[#18181B] hover:text-[#71717A] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Explore Full {product.category_name || 'Category'} Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {relatedLoading && relatedProducts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-3/4 bg-[#E7E5E4]" />
                  <div className="h-4 bg-[#E7E5E4] w-2/3" />
                  <div className="h-4 bg-[#E7E5E4] w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: Product) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onNavigate={(route) => {
                    onNavigate(route);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] max-w-xl w-full p-6 sm:p-8 border border-[#E7E5E4] shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-[#E7E5E4]">
              <h3 className="font-serif text-xl uppercase tracking-wider text-[#18181B]">Atelier Size Guide</h3>
              <button onClick={() => setSizeGuideOpen(false)} className="text-[#18181B] p-1">
                ✕
              </button>
            </div>
            <div className="mt-4 overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D6D3D1] text-[#71717A] uppercase tracking-wider">
                    <th className="py-2">Size</th>
                    <th className="py-2">Chest (Inches)</th>
                    <th className="py-2">Waist (Inches)</th>
                    <th className="py-2">Shoulder (Inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4] text-[#18181B]">
                  <tr><td className="py-2 font-semibold">S</td><td>36 - 38</td><td>30 - 32</td><td>17.5</td></tr>
                  <tr><td className="py-2 font-semibold">M</td><td>39 - 41</td><td>32 - 34</td><td>18.2</td></tr>
                  <tr><td className="py-2 font-semibold">L</td><td>42 - 44</td><td>34 - 36</td><td>19.0</td></tr>
                  <tr><td className="py-2 font-semibold">XL</td><td>45 - 47</td><td>36 - 38</td><td>19.8</td></tr>
                </tbody>
              </table>
              <p className="mt-4 text-[#71717A] leading-relaxed">
                Need customized tailoring measurements? Contact our master cutter directly on WhatsApp: <strong>+91 8319090220</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
