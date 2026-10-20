import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, Calendar } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const ICONS = {
  company: <Building2 className="w-4 h-4 text-indigo-500" />,
  user: <Users className="w-4 h-4 text-blue-500" />,
  booking: <Calendar className="w-4 h-4 text-emerald-500" />,
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const isSuperAdmin = user?.roles?.includes('superadmin') || user?.role === 'superadmin';

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        let url = '';
        
        if (isSuperAdmin) {
          url = `/superadmin/search?q=${encodeURIComponent(query)}`;
        } else if (activeCompany) {
      url = `/me/search?q=${encodeURIComponent(query)}&company_id=${activeCompany.id}`;        } else {
          setLoading(false);
          return;
        }

        const res = await api.get(url);
        setResults(res.data.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isSuperAdmin, activeCompany]);

  const handleNavigate = (link) => {
    navigate(link);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-64" ref={wrapperRef}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-80 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No results found</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigate(r.link)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3 transition"
                >
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {ICONS[r.type] || <Search className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}