import {useState,useEffect} from 'react';
import {useParams,Link} from 'react-router-dom';
import api from '../../api/client';
import {Printer} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export default function StaffInvoiceView(){
    const {id}=useParams();
    const {activeCompany}=useCompany();
    const [invoice,setInvoice]=useState(null);
    const[loading,setLoading]=useState(true);

    useEffect(() => {
        if(!activeCompany || !id)return;
        const fetchInvoice = async () =>{
            try{
              const res = await api.get(`/companies/${activeCompany.id}/invoices/${id}`);
                setInvoice(res.data.data);
            }catch(err){
                console.error(err);
            }finally{
                setLoading(false);
            }
        };
        fetchInvoice();
    },[activeCompany,id]);

    if (loading) return <div className="p-12 text-center">Loading invoice...</div>;
  if (!invoice) return <div className="p-12 text-center">Invoice not found.</div>;
  
  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center no-print">
          <Link to="/staff/invoices" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to invoices
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print-invoice sm:p-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 sm:mb-8 sm:flex-row sm:pb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{activeCompany.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{activeCompany.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-indigo-600 uppercase tracking-wider">Invoice</h2>
            <p className="text-sm font-mono mt-1 text-slate-700">{invoice.reference}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-slate-900">{invoice.customer_name}</p>
            <p className="text-sm text-slate-600">{invoice.customer_email}</p>
            {invoice.customer_phone && <p className="text-sm text-slate-600">{invoice.customer_phone}</p>}
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-sm text-slate-500">Issue Date: <span className="font-medium text-slate-900">{new Date(invoice.issue_date).toLocaleDateString('en-GB')}</span></p>
            <p className="text-sm text-slate-500">Due Date: <span className="font-medium text-slate-900">{new Date(invoice.due_date).toLocaleDateString('en-GB')}</span></p>
            <p className="text-sm text-slate-500">Status: <span className="font-medium text-slate-900 capitalize">{invoice.status}</span></p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-2 text-xs font-bold text-slate-900 uppercase">Description</th>
              <th className="text-right py-2 text-xs font-bold text-slate-900 uppercase">Total</th>
                 

            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items && invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 text-sm text-slate-700">{item.description}</td>
                <td className="py-3 text-sm text-slate-900 text-right">€{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span>€{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>-€{parseFloat(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax:</span>
                <span>+€{parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-200 pt-2 mt-2">
              <span>Total:</span>
              <span>€{parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mt-12 pt-4 border-t border-slate-100">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}