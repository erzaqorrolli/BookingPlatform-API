import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function Payroll() {
  const { activeCompany } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const r = await api.get(`/companies/${activeCompany.id}/payroll`);
      setEmployees(r.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeCompany]);

  const handleRateChange = (userId, value) => {
    setEditing((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSave = async (userId) => {
    const value = editing[userId];
    if (value === undefined || value === '') return;

    try {
      await api.post(`/companies/${activeCompany.id}/payroll`, {
        user_id: userId,
        hourly_rate: parseFloat(value),
      });
      await load();
      setEditing((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: 'Hourly rate updated.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || 'Failed to save',
      });
    }
  };

  const handleMarkPaid = async (userId, name, amount) => {
    const result = await Swal.fire({
      title: 'Mark as paid?',
      html: `Mark <b>€${amount}</b> as paid to <b>${name}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mark as paid',
      confirmButtonColor: '#059669',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(`/companies/${activeCompany.id}/payroll/${userId}/mark-paid`);
      await load();
      Swal.fire({
        icon: 'success',
        title: 'Paid!',
        text: 'Payroll marked as paid.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || 'Failed',
      });
    }
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a company</h3>
      </div>
    );
  }

  const totalUnpaid = employees.reduce((s, e) => s + parseFloat(e.unpaid_total || 0), 0);
  const totalPaid = employees.reduce((s, e) => s + parseFloat(e.paid_total || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set hourly rates and manage payments for your team
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Unpaid total</p>
          <p className="text-2xl font-bold text-amber-600">€{totalUnpaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Paid total</p>
          <p className="text-2xl font-bold text-emerald-600">€{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Team members</p>
          <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Hourly rate</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Hours</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Unpaid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Paid</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => {
                const isEditing = editing[e.id] !== undefined;
                const rate = isEditing ? editing[e.id] : (e.hourly_rate ?? '');
                const unpaid = parseFloat(e.unpaid_total || 0);

                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {e.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                          <div className="text-xs text-slate-500">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rate}
                          onChange={(ev) => handleRateChange(e.id, ev.target.value)}
                          placeholder="0.00"
                          className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                        />
                        <span className="text-xs text-slate-500">€/h</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {parseFloat(e.unpaid_hours || 0).toFixed(2)}h
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-amber-600">
                      €{unpaid.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      €{parseFloat(e.paid_total || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing && (
                          <button
                            onClick={() => handleSave(e.id)}
                            className="text-xs font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        )}
                        {unpaid > 0 && (
                          <button
                            onClick={() => handleMarkPaid(e.id, e.name, unpaid.toFixed(2))}
                            className="text-xs font-medium px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}