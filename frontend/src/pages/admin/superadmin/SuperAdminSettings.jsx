import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../../../api/client';
import { useSettings } from '../../../contexts/SettingsContext';
import { 
  Globe, 
  Mail, 
  CreditCard, 
  Shield, 
  Bell, 
  Save 
} from 'lucide-react';

export default function SuperAdminSettings() {
  const { settings: globalSettings, reload } = useSettings();
  const [settings, setSettings] = useState(globalSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(globalSettings);
    setLoading(false);
  }, [globalSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ 
      ...settings, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/superadmin/settings', settings);
      await reload(); 
      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Your platform settings have been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage the global configuration of your platform.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                name="platform_name"
                value={settings.platform_name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                name="support_email"
                value={settings.support_email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Timezone
              </label>
              <select
                name="timezone"
                value={settings.timezone || 'Europe/Berlin'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              >
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Pristina">Europe/Pristina (CET)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Default Language
              </label>
              <select
                name="language"
                value={settings.language || 'en'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              >
                <option value="en">English</option>
                <option value="sq">Shqip</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Email Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SMTP Host
              </label>
              <input
                type="text"
                name="smtp_host"
                value={settings.smtp_host || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SMTP Port
              </label>
              <input
                type="text"
                name="smtp_port"
                value={settings.smtp_port || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SMTP Username
              </label>
              <input
                type="text"
                name="smtp_user"
                value={settings.smtp_user || ''}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                From Name
              </label>
              <input
                type="text"
                name="smtp_from_name"
                value={settings.smtp_from_name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payments</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stripe Public Key
              </label>
              <input
                type="text"
                name="stripe_public_key"
                value={settings.stripe_public_key || ''}
                onChange={handleChange}
                placeholder="pk_test_..."
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                name="default_currency"
                value={settings.default_currency || 'EUR'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Fee (%)
              </label>
              <input
                type="number"
                name="platform_fee_percent"
                value={settings.platform_fee_percent || '0'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="require_email_verification"
                checked={!!settings.require_email_verification}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Require Email Verification</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Users must verify their email before accessing the platform.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allow_impersonation"
                checked={!!settings.allow_impersonation}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Allow Impersonation</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Super admins can log in as a company to troubleshoot issues.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_new_company"
                checked={!!settings.notify_new_company}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">New Company Registration</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive an email when a new company registers.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_new_booking"
                checked={!!settings.notify_new_booking}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">New Booking Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive an email when a new booking is made on the platform.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}