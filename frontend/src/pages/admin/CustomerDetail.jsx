import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const BOOKING_STATUS = {
  pending:   { label: 'Waiting',   color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  no_show:   { label: 'Absent',    color: 'bg-slate-100 text-slate-700' },
};

const INVOICE_STATUS = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-700' },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Paid',      color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function CustomerDetail() {
  const { id } = useParams();
  const { activeCompany } = useCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany || !id) return;
    setLoading(true);
    api.get(`/companies/${activeCompany.id}/customers/${id}`)
      .then((r) => setData(r.data.data || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeCompany, id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Client not found</h3>
        <Link to="/admin/customers" className="text-sm text-indigo-600 hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const { customer, bookings, invoices, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/customers"
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {customer.name}
            {Number(customer.is_vip) === 1 && (
              <span className="inline-flex items-center" title={`VIP · ${customer.total_bookings} bookings`}>
                <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">Client details and history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total_bookings}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total_invoices}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-green-600">€{stats.total_spent.toFixed(2)}</p>
        </div>
      </div>

      {/* Info + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Email</p>
              <p className="text-slate-900">{customer.email}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Phone</p>
              <p className="text-slate-900">{customer.phone || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Registered</p>
              <p className="text-slate-900">
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-GB') : '—'}
              </p>
            </div>
            {Number(customer.is_vip) === 1 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-semibold rounded-full">
                  👑 VIP Client
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Bookings</h2>
          </div>
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No bookings yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Ref</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Service</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.slice(0, 10).map((b) => {
                    const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-indigo-600">
                          {b.reference || `#${b.id}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{b.service_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {new Date(b.booking_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          €{parseFloat(b.total_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
          <span className="text-sm text-slate-500">{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No invoices yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Issue Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.draft;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-mono font-semibold text-indigo-600">
                      {inv.reference}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {new Date(inv.issue_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">
                      €{parseFloat(inv.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/invoices/${inv.id}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        View
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}