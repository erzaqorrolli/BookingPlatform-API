import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    platform_name: 'BookingPlatform',
    company_name: 'BookWise',
    support_email: '',
    timezone: 'Europe/Berlin',
    language: 'en',
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    setLoading(true);
    api.get('/settings')
      .then((r) => {
        const data = r.data.data || r.data;
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, reload: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);