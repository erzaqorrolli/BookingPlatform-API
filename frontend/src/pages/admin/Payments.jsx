import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('all'); 

  useEffect(() => {
    api.get('/superadmin/payments')
      .then((r) => setPayments(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  const filteredPayments = payments.filter((p) => {
    if (filterMethod === 'all') return true;
    return p.payment_method === filterMethod;
  });

  const totalCash = payments
    .filter((p) => p.payment_method === 'cash')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalCard = payments
    .filter((p) => p.payment_method === 'card')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Payments</h1>
      <p className="text-slate-500 mb-6">All payments from all companies and clients</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total All</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            €{payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-emerald-600 font-medium">💵 Cash</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">€{totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-indigo-600 font-medium">💳 Card</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">€{totalCard.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterMethod('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterMethod === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterMethod('cash')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterMethod === 'cash'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          💵 Cash
        </button>
        <button
          onClick={() => setFilterMethod('card')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterMethod === 'card'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          💳 Card
        </button>
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
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                        💳 Card
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                        💵 Cash
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
      </div>
    </div>
  );
}