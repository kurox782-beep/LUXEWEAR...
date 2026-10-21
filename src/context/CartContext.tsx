import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string; discount?: number }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'luxewear_cart_v1';
const COUPON_STORAGE_KEY = 'luxewear_coupon_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (couponCode) {
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [couponCode]);

  // Recalculate coupon discount whenever items or couponCode change
  useEffect(() => {
    const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!couponCode || currentSubtotal === 0) {
      setDiscountAmount(0);
      return;
    }

    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal: currentSubtotal })
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setDiscountAmount(data.discount_amount);
        } else {
          setCouponCode('');
          setDiscountAmount(0);
        }
      })
      .catch(() => {
        setDiscountAmount(0);
      });
  }, [items, couponCode]);

  const addToCart = (product: Product, size: string, color: string, quantity = 1): { success: boolean; message?: string } => {
    const selectedVariant = product.variants?.find(v => v.size === size && v.color === color);
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

    if (availableStock <= 0) {
      return { success: false, message: 'This variant is currently out of stock.' };
    }

    const itemId = `${product.id}-${size}-${color}`;
    const existing = items.find(i => i.id === itemId);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (requestedTotal > availableStock) {
      return {
        success: false,
        message: `Only ${availableStock} units available in stock for ${size} / ${color}.`
      };
    }

    const price = product.sale_price !== null && product.sale_price > 0 ? product.sale_price : product.price;
    const mainImg = product.images?.find(img => img.is_main)?.image_url || product.images?.[0]?.image_url || '';

    setItems(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: requestedTotal, maxStock: availableStock };
        return next;
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: mainImg,
          price,
          originalPrice: product.price,
          size,
          color,
          quantity,
          maxStock: availableStock
        }
      ];
    });

    // Track analytics event
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'ADD_TO_CART',
        product_id: product.id,
        metadata: { size, color, quantity, price }
      })
    }).catch(() => {});

    setIsCartOpen(true);
    return { success: true };
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const validQty = Math.min(quantity, item.maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setDiscountAmount(0);
  };

  const applyCoupon = async (code: string) => {
    const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: currentSubtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponCode(data.code);
        setDiscountAmount(data.discount_amount);
        return { success: true, discount: data.discount_amount };
      }
      return { success: false, error: data.error || 'Invalid promotional code' };
    } catch {
      return { success: false, error: 'Could not validate code at this time.' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.min(discountAmount, subtotal);
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        discount,
        total,
        couponCode,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
