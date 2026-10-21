import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';

// Admin Pages
import { AdminPortal } from './pages/admin/AdminPortal';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [queryParams, setQueryParams] = useState<string>(() => {
    return window.location.search ? window.location.search.substring(1) : '';
  });

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setQueryParams(window.location.search ? window.location.search.substring(1) : '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, param?: string) => {
    let targetPath = path;
    let query = param;
    if (path.includes('?')) {
      const parts = path.split('?');
      targetPath = parts[0];
      query = parts[1];
    }

    let fullUrl = targetPath;
    if (query) {
      fullUrl += `?${query}`;
      setQueryParams(query);
    } else {
      setQueryParams('');
    }

    try {
      window.history.pushState({}, '', fullUrl);
    } catch {
      // fallback in sandbox if restricted
    }
    setCurrentPath(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {isAdminRoute ? (
            <AdminPortal onNavigateHome={() => navigate('/')} />
          ) : (
            <div className="min-h-screen flex flex-col justify-between bg-[#FBFBF9] text-[#18181B] selection:bg-[#18181B] selection:text-white">
              {/* Top Navigation */}
              <Navbar onNavigate={navigate} currentRoute={currentPath} />

              {/* Cart Drawer */}
              <CartDrawer onNavigate={navigate} />

              {/* Main Routed Page Content */}
              <main className="flex-1">
                {currentPath === '/' && <HomePage onNavigate={navigate} />}

                {currentPath === '/shop' && (
                  <ShopPage onNavigate={navigate} initialParams={queryParams} />
                )}

                {currentPath.startsWith('/product/') && (
                  <ProductDetailPage
                    slug={currentPath.replace('/product/', '')}
                    onNavigate={navigate}
                  />
                )}

                {currentPath === '/checkout' && <CheckoutPage onNavigate={navigate} />}

                {currentPath.startsWith('/orders/') && (
                  <OrderConfirmationPage
                    orderNumber={currentPath.replace('/orders/', '')}
                    onNavigate={navigate}
                  />
                )}

                {currentPath === '/orders' && <TrackOrderPage />}

                {currentPath === '/wishlist' && <WishlistPage onNavigate={navigate} />}

                {currentPath === '/about' && <AboutPage onNavigate={navigate} />}

                {currentPath === '/account' && <AccountPage onNavigate={navigate} />}
              </main>

              {/* Footer */}
              <Footer onNavigate={navigate} />
            </div>
          )}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
