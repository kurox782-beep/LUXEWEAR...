import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminOrders } from './AdminOrders';
import { AdminInventory } from './AdminInventory';
import { AdminReviews } from './AdminReviews';
import { AdminCustomers } from './AdminCustomers';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminCoupons } from './AdminCoupons';
import { AdminAuditLogPage } from './AdminAuditLog';
import { AdminSettings } from './AdminSettings';

interface AdminPortalProps {
  onNavigateHome: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigateHome }) => {
  const { user, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Security gate: If not authenticated as admin, show login page
  if (!user || !isAdmin) {
    return <AdminLoginPage onNavigate={(r) => { if (r === '/') onNavigateHome(); }} />;
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onNavigateHome={onNavigateHome}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboard
          onSelectTab={setCurrentTab}
          onViewOrder={(_ref) => setCurrentTab('orders')}
        />
      )}
      {currentTab === 'products' && <AdminProducts />}
      {currentTab === 'categories' && <AdminCategories />}
      {currentTab === 'orders' && <AdminOrders />}
      {currentTab === 'inventory' && <AdminInventory />}
      {currentTab === 'reviews' && <AdminReviews />}
      {currentTab === 'customers' && <AdminCustomers />}
      {currentTab === 'analytics' && <AdminAnalytics />}
      {currentTab === 'coupons' && <AdminCoupons />}
      {currentTab === 'audit' && <AdminAuditLogPage />}
      {currentTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};
