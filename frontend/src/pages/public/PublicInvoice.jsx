import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import api from '../../api/client';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB');
};

const formatMoney = (value) => `€${Number(value || 0).toFixed(2)}`;

export default function PublicInvoice() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    api.get(`/public/invoices/${encodeURIComponent(token)}`)
      .then((response) => {
        if (active) setInvoice(response.data?.data || response.data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error('Unable to load public invoice:', error);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-500">
        Loading invoice…
      </main>
    );
  }

  if (notFound || !invoice) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">BookingPlatform</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {loadError ? 'Unable to load invoice' : 'Invoice unavailable'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {loadError
              ? 'There was a problem connecting to the invoice service. Please try again.'
              : 'This invoice link may be invalid or expired. Please contact the business that sent it.'}
          </p>
          {loadError && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 font-sans sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
          <p className="text-sm font-semibold tracking-wide text-slate-500">INVOICE</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Print invoice
          </button>
        </div>

        <article className="invoice-sheet overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col justify-between gap-6 border-b border-slate-200 p-6 sm:flex-row sm:p-10">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {invoice.company_name || 'Business'}
              </h1>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                {invoice.company_address && <p>{invoice.company_address}</p>}
                {invoice.company_email && <p>{invoice.company_email}</p>}
                {invoice.company_phone && <p>{invoice.company_phone}</p>}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold tracking-[0.2em] text-indigo-600">INVOICE</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-900">{invoice.reference}</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                invoice.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {invoice.status}
              </span>
            </div>
          </header>

          <section className="grid gap-8 p-6 sm:grid-cols-2 sm:p-10">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Bill to</p>
              <p className="font-semibold text-slate-900">{invoice.customer_name}</p>
              {invoice.customer_email && <p className="mt-1 text-sm text-slate-600">{invoice.customer_email}</p>}
              {invoice.customer_phone && <p className="mt-1 text-sm text-slate-600">{invoice.customer_phone}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:justify-self-end">
              <dt className="text-slate-500">Issue date</dt>
              <dd className="font-medium text-slate-900">{formatDate(invoice.issue_date)}</dd>
              <dt className="text-slate-500">Due date</dt>
              <dd className="font-medium text-slate-900">{formatDate(invoice.due_date)}</dd>
              {invoice.booking_date && (
                <>
                  <dt className="text-slate-500">Service date</dt>
                  <dd className="font-medium text-slate-900">{formatDate(invoice.booking_date)}</dd>
                </>
              )}
              {invoice.start_time && (
                <>
                  <dt className="text-slate-500">Appointment</dt>
                  <dd className="font-medium text-slate-900">{invoice.start_time.slice(0, 5)}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="px-6 pb-6 sm:px-10 sm:pb-10">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-5 text-sm sm:px-5">
                <span className="font-medium text-slate-800">{invoice.service_name || 'Booking service'}</span>
                <span className="font-semibold text-slate-900">{formatMoney(invoice.subtotal)}</span>
              </div>
            </div>

            <div className="ml-auto mt-6 w-full max-w-xs space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span>−{formatMoney(invoice.discount_amount)}</span>
                </div>
              )}
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>{formatMoney(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900">
                <span>Total due</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-8 border-t border-slate-100 pt-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{invoice.notes}</p>
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-center text-xs text-slate-500 sm:px-10">
            Thank you for your business.
          </footer>
        </article>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          .invoice-sheet { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>
    </main>
  );
}
