import { useState, useEffect } from 'react';
import api from '../../api/client';
import { CreditCard, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  
  // --- PAGINIM ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ----------------

  useEffect(() => {
    api.get('/superadmin/payments')
      .then((r) => setPayments(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Kthehu në faqen 1 kur ndryshon filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMethod, filterMonth, filterWeek]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  const getMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  const filteredPayments = payments.filter((p) => {
    if (filterMethod !== 'all' && p.payment_method !== filterMethod) return false;
    if (filterMonth && getMonthKey(p.created_at) !== filterMonth) return false;
    if (filterWeek && getWeekKey(p.created_at) !== filterWeek) return false;
    return true;
  });

  // --- LLOGARITJET E PAGINIMIT ---
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  // -------------------------------

  const totalCash = filteredPayments
    .filter((p) => p.payment_method === 'cash')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalCard = filteredPayments
    .filter((p) => p.payment_method === 'card')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalAll = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Payments</h1>
      <p className="text-slate-500 mb-6">All payments from all companies and clients</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total (filtered)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">€{totalAll.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <Banknote className="w-4 h-4" />
            <p className="text-sm font-medium">Cash</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">€{totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <CreditCard className="w-4 h-4" />
            <p className="text-sm font-medium">Card</p>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-1">€{totalCard.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMethod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterMethod === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMethod('cash')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            <Banknote className="w-4 h-4" /> Cash
          </button>
          <button
            onClick={() => setFilterMethod('card')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Card
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 ml-1 font-medium">Month</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-700"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 ml-1 font-medium">Week</label>
          <input
            type="week"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-700"
          />
        </div>

        {(filterMethod !== 'all' || filterMonth || filterWeek) && (
          <button
            onClick={() => {
              setFilterMethod('all');
              setFilterMonth('');
              setFilterWeek('');
            }}
            className="px-4 py-2 h-[38px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition flex items-center"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reference</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Method</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                  No payments found for the selected filters
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-mono text-indigo-600">{p.reference}</td>
                  <td className="px-5 py-4 text-sm font-medium">{p.company_name}</td>
                  <td className="px-5 py-4 text-sm">
                    <div>{p.customer_name}</div>
                    <div className="text-xs text-slate-500">{p.customer_email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium">€{parseFloat(p.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm">
                    {p.payment_method === 'card' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                        <CreditCard className="w-3 h-3" /> Card
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                        <Banknote className="w-3 h-3" /> Cash
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('sq-AL')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINIMI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredPayments.length)}</span> of{' '}
              <span className="font-medium">{filteredPayments.length}</span> payments
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}