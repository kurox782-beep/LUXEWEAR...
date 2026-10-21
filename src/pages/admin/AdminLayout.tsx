import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  MessageSquare,
  Users,
  BarChart3,
  Tag,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onNavigateHome,
  children
}) => {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    onTabChange(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col lg:flex-row text-[#18181B]">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#18181B] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="font-serif text-base tracking-[0.2em] uppercase font-bold">LUXEWEAR ADMIN</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 text-stone-300 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 w-64 bg-[#18181B] text-[#D4D4D8] flex flex-col justify-between z-50 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-[#27272A] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-serif text-lg font-bold tracking-[0.25em] uppercase text-white block">
                  LUXEWEAR
                </span>
              </div>
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest block mt-0.5">
                Atelier Administration
              </span>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wide uppercase transition-all rounded-xs ${
                    isActive
                      ? 'bg-white text-[#18181B] font-semibold shadow-xs'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#18181B]' : 'text-[#71717A]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#27272A] space-y-3">
          <div className="px-3 py-2 bg-[#27272A]/70 text-[11px] rounded-xs space-y-0.5">
            <p className="text-white font-medium truncate">{user?.name || 'Director'}</p>
            <p className="text-[#A1A1AA] text-[10px] truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 font-mono uppercase">
              Admin Privilege
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onNavigateHome}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-[#27272A] text-stone-300 text-[11px] uppercase tracking-wider font-semibold hover:text-white hover:bg-[#3F3F46] transition-colors"
              title="Return to Customer Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center justify-center p-2 bg-[#27272A] text-stone-300 hover:text-red-400 hover:bg-[#3F3F46] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
