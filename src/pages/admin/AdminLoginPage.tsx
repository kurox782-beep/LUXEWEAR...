import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (route: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.role !== 'admin') {
          setError('Access Denied: Your account does not possess Atelier Director (admin) permissions.');
        } else {
          onNavigate('/admin');
        }
      } else {
        setError(res.error || 'Invalid administrator credentials.');
      }
    } catch {
      setError('Connection failure to atelier auth server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-16 bg-[#F4F4F0]">
      <div className="w-full max-w-md bg-[#FBFBF9] border border-[#D4D4CE] p-8 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#18181B] text-amber-400 rounded-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#71717A]">
            Atelier Management Portal
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#18181B] uppercase tracking-wider">
            LUXEWEAR Admin
          </h1>
          <p className="text-xs text-[#71717A]">
            Restricted access for catalog directors, inventory controllers, and order coordinators.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@luxewear.com"
                className="w-full bg-white border border-[#D6D3D1] pl-9 pr-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#D6D3D1] pl-9 pr-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#18181B] text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#27272A] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#E7E5E4] text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
