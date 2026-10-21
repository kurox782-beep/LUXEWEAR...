import React, { useEffect, useState } from 'react';
import { Save, Check, MessageSquare, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { authFetch } from '../../lib/api';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    whatsapp_number: '918319090220',
    store_name: 'LUXEWEAR',
    currency_symbol: '₹',
    currency_code: 'INR',
    contact_email: 'atelier@luxewear.com',
    shipping_note: 'Complimentary express dispatch across India on all atelier orders.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Database diagnostics state
  const [dbDiag, setDbDiag] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState('');

  const fetchDiagnostics = async () => {
    setDbLoading(true);
    try {
      const res = await authFetch('/api/admin/database/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDbDiag(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    authFetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    fetchDiagnostics();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch {
      alert('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReseed = async (force: boolean) => {
    if (!confirm(force ? 'Restore initial luxury sample collection and reset catalog?' : 'Reseed sample records if missing?')) return;
    setReseedLoading(true);
    setDbMessage('');
    try {
      const res = await authFetch('/api/admin/database/reseed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok) {
        setDbMessage(data.message || 'Database restored.');
        fetchDiagnostics();
      } else {
        alert(data.error || 'Failed to reseed database');
      }
    } catch {
      alert('Network error while reseeding database');
    } finally {
      setReseedLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#71717A]">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="pb-6 border-b border-[#E7E5E4]">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
          Storefront Configuration
        </span>
        <h1 className="font-serif text-3xl text-[#18181B]">Atelier & WhatsApp Settings</h1>
        <p className="text-xs text-[#71717A] mt-1">
          Configure central WhatsApp routing, currency units, customer care dispatch notes, and database health.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Atelier settings saved and updated across all WhatsApp checkout routes.</span>
        </div>
      )}

      {/* Database Health & Maintenance */}
      <div className="bg-white border border-[#E7E5E4] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h3 className="font-serif text-lg text-[#18181B] font-normal">SQLite Database Status & Diagnostics</h3>
          </div>
          <button
            onClick={fetchDiagnostics}
            disabled={dbLoading}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>
        </div>

        {dbMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {dbMessage}
          </div>
        )}

        {dbDiag?.counts && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Products</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.products}</strong>
            </div>
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Categories</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.categories}</strong>
            </div>
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Orders</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.orders}</strong>
            </div>
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Reviews</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.reviews}</strong>
            </div>
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Users</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.users}</strong>
            </div>
            <div className="bg-[#FBFBF9] p-3 border border-[#E7E5E4]">
              <span className="text-[#71717A] block text-[10px] uppercase">Coupons</span>
              <strong className="text-base text-[#18181B]">{dbDiag.counts.coupons}</strong>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleReseed(false)}
            disabled={reseedLoading}
            className="px-4 py-2 border border-[#18181B] text-[#18181B] hover:bg-[#18181B] hover:text-white text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {reseedLoading ? 'Verifying...' : 'Verify & Seed Missing Catalog'}
          </button>
          <button
            type="button"
            onClick={() => handleReseed(true)}
            disabled={reseedLoading}
            className="px-4 py-2 border border-stone-300 text-stone-600 hover:border-red-600 hover:text-red-700 text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Restore Default Sample Catalog
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E7E5E4] p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        {/* Central WhatsApp Number */}
        <div className="space-y-2 p-4 bg-[#FBFBF9] border border-[#E7E5E4]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <label className="uppercase tracking-wider font-bold text-[#18181B]">
              Central Store WhatsApp Number *
            </label>
          </div>
          <p className="text-[#71717A] text-[11px]">
            Must include India country code (e.g. <code>918319090220</code>). All checkout submissions route directly to this WhatsApp number.
          </p>
          <input
            type="text"
            required
            value={settings.whatsapp_number || ''}
            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value.replace(/[^0-9]/g, '') })}
            className="w-full bg-white border border-[#D6D3D1] px-3.5 py-2 font-mono text-sm text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
          />
        </div>

        {/* Store Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Brand & Store Name
            </label>
            <input
              type="text"
              value={settings.store_name || ''}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Atelier Director Email
            </label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Currency Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={settings.currency_symbol || ''}
              onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
              className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
              Currency Code
            </label>
            <input
              type="text"
              value={settings.currency_code || ''}
              onChange={(e) => setSettings({ ...settings, currency_code: e.target.value })}
              className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        {/* Shipping Notice */}
        <div>
          <label className="block uppercase tracking-wider font-semibold text-[#18181B] mb-1">
            Complimentary Shipping Notice (Header & Drawer)
          </label>
          <input
            type="text"
            value={settings.shipping_note || ''}
            onChange={(e) => setSettings({ ...settings, shipping_note: e.target.value })}
            className="w-full bg-[#FBFBF9] border border-[#D6D3D1] px-3 py-2 text-xs text-[#18181B]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </form>
    </div>
  );
};
