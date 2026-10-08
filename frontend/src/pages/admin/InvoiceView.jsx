import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function InvoiceView() {
  const { id } = useParams();
  const { activeCompany } = useCompany();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany || !id) return;
    api.get(`/companies/${activeCompany.id}/invoices/${id}`)
      .then((r) => setInvoice(r.data.data || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeCompany, id]);

 const handlePrint = () => {
  const printArea = document.querySelector('.invoice-print-area');
  if (!printArea) {
    console.error('Print area not found');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow pop-ups for this site to print.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice.reference || ''}</title>
        <meta charset="UTF-8" />
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            background: white;
            color: #0f172a;
          }
          @media print {
            @page { size: A4; margin: 15mm; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
};

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Invoice not found</h3>
        <Link to="/admin/invoices" className="text-sm text-indigo-600 hover:underline">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  const issueDate = invoice.issue_date
    ? new Date(invoice.issue_date).toLocaleDateString('en-GB')
    : '—';
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-GB')
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/admin/invoices"
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to invoices
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>
<div className="invoice-print-area bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {invoice.company_name || 'Company'}
            </h1>
            <div className="text-sm text-slate-600 space-y-0.5">
              {invoice.company_address && <p>{invoice.company_address}</p>}
              {invoice.company_email && <p>{invoice.company_email}</p>}
              {invoice.company_phone && <p>{invoice.company_phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-indigo-600 mb-1">INVOICE</h2>
            <p className="text-lg font-mono font-semibold text-slate-900">{invoice.reference}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Bill To
            </p>
            <p className="text-base font-semibold text-slate-900">{invoice.customer_name}</p>
            {invoice.customer_email && <p className="text-sm text-slate-600">{invoice.customer_email}</p>}
            {invoice.customer_phone && <p className="text-sm text-slate-600">{invoice.customer_phone}</p>}
          </div>
          <div className="text-right">
            <div className="inline-block text-left">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-slate-500">Issue Date:</span>
                <span className="font-semibold text-slate-900">{issueDate}</span>
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold text-slate-900">{dueDate}</span>
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-900 capitalize">{invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead className="border-b-2 border-slate-900">
            <tr>
              <th className="text-left py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
              <th className="text-right py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-3 text-sm text-slate-900">{invoice.service_name}</td>
              <td className="py-3 text-sm text-slate-900 text-right">
                €{parseFloat(invoice.subtotal).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium text-slate-900">€{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Discount:</span>
                <span className="font-medium text-red-600">-€{parseFloat(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax:</span>
                <span className="font-medium text-slate-900">€{parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2 border-slate-900">
              <span className="text-base font-bold text-slate-900">Total:</span>
              <span className="text-base font-bold text-slate-900">€{parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="pt-6 border-t border-slate-200">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Notes</p>
            <p className="text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          Thank you for your business!
        </div>
      </div>

  
      <style>{`
  @media print {

    body * {
      visibility: hidden;
    }

    .invoice-print-area,
    .invoice-print-area * {
      visibility: visible;
    }

    .invoice-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px !important;
      margin: 0 !important;
    }

    .print\\:hidden {
      display: none !important;
    }

    body {
      background: white !important;
    }

  
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hiq hijet dhe borderat */
    .invoice-print-area {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
  }
`}</style>
    </div>
  );
}