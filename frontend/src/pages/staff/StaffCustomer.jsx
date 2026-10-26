import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { Search, User } from 'lucide-react';

export default function StaffCustomers() {
  const { activeCompany } = useCompany(); // <-- Kllapat ()
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeCompany) return;

    const fetchCustomers = async () => {
      try {
        // <-- Backticks në vend të thonjëzave
        const res = await api.get(`/companies/${activeCompany.id}/customers`);
        setCustomers(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [activeCompany]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center">Loading clients...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCompany.name} · {customers.length} clients
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{c.email}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{c.phone || '—'}</td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="3" className="px-5 py-8 text-center text-slate-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}