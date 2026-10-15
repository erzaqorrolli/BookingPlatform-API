import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function InvoiceForm({ invoice, onClose, onSaved }) {
  const { activeCompany } = useCompany();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_id: invoice?.customer_id || '',
    issue_date: invoice?.issue_date || new Date().toISOString().split('T')[0],
    due_date:
      invoice?.due_date ||
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    discount_amount: invoice?.discount_amount || 0,
    tax_amount: invoice?.tax_amount || 0,
    notes: invoice?.notes || '',
    items:
      invoice?.items?.length > 0
        ? invoice.items
        : [{ description: '', quantity: 1, price: 0 }],
  });

  useEffect(() => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }

    api
      .get(`/companies/${activeCompany.id}/customers`)
      .then((r) => setCustomers(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeCompany]);

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const subtotal = form.items.reduce(
    (sum, item) =>
      sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
    0
  );

  const total =
    subtotal -
    (parseFloat(form.discount_amount) || 0) +
    (parseFloat(form.tax_amount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id) {
      Swal.fire('Error', 'Please select a customer', 'error');
      return;
    }

    if (form.items.some((i) => !i.description?.trim())) {
      Swal.fire('Error', 'All items must have a description', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = invoice
        ? `/companies/${activeCompany.id}/invoices/${invoice.id}`
        : `/companies/${activeCompany.id}/invoices`;
      const method = invoice ? 'put' : 'post';

      await api[method](url, {
        customer_id: parseInt(form.customer_id),
        issue_date: form.issue_date,
        due_date: form.due_date,
        discount_amount: parseFloat(form.discount_amount) || 0,
        tax_amount: parseFloat(form.tax_amount) || 0,
        notes: form.notes,
        items: form.items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          price: parseFloat(i.price) || 0,
        })),
      });

      Swal.fire({
        icon: 'success',
        title: invoice ? 'Invoice updated!' : 'Invoice created!',
        timer: 1500,
        showConfirmButton: false,
      });

      onSaved();
      onClose();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              {invoice ? 'Edit Invoice' : 'New Invoice'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Customer & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Customer *
              </label>
              <select
                value={form.customer_id}
                onChange={(e) =>
                  setForm({ ...form, customer_id: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Issue Date
              </label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) =>
                  setForm({ ...form, issue_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, 'description', e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', e.target.value)
                    }
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(index, 'price', e.target.value)
                    }
                    className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <div className="w-24 px-3 py-2 text-sm font-medium text-slate-700 text-right">
                    €
                    {(
                      (parseFloat(item.quantity) || 0) *
                      (parseFloat(item.price) || 0)
                    ).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length === 1}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Discount (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discount_amount}
                onChange={(e) =>
                  setForm({ ...form, discount_amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tax (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.tax_amount}
                onChange={(e) =>
                  setForm({ ...form, tax_amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Totals */}
          <div className="bg-slate-50 p-4 rounded-lg mb-5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Discount:</span>
              <span className="font-medium text-red-600">
                -€{(parseFloat(form.discount_amount) || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Tax:</span>
              <span className="font-medium">
                +€{(parseFloat(form.tax_amount) || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-300">
              <span>Total:</span>
              <span className="text-indigo-600">€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : invoice ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}