import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

const ALL_PERMISSIONS = [
  { key: 'staff_can_send_emails', label: 'Dërgo Email-e klientëve', description: 'Mund të përgjigjesh dhe të dërgosh mesazhe nga Chat-i.' },
  { key: 'staff_can_manage_bookings', label: 'Menaxho Booking-et', description: 'Mund të shohësh dhe të ndryshosh statusin e booking-eve.' },
  { key: 'staff_can_view_bookings', label: 'Shiko Booking-et', description: 'Mund të shohësh listën e booking-eve.' },
  { key: 'staff_can_manage_customers', label: 'Menaxho Klientët', description: 'Mund të shtosh dhe të ndryshosh klientë.' },
  { key: 'staff_can_manage_invoices', label: 'Menaxho Faturat', description: 'Mund të krijosh dhe të shohësh fatura.' },
];

export default function MyRole() {
  const { activeCompany } = useCompany();
  const [roleDetails, setRoleDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany) return;

    const fetchRole = async () => {
      try {
        const res = await api.get(`/companies/${activeCompany.id}/my-role-details`);
        setRoleDetails(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [activeCompany]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Duke ngarkuar rolin...</div>;
  }

  if (!activeCompany || !roleDetails) {
    return <div className="p-12 text-center text-slate-500">Nuk u gjet asnjë informacion.</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roli Im</h1>
        <p className="text-sm text-slate-500 mt-1">
          Shiko rolin dhe lejet që të ka caktuar pronari.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Roli Aktual</p>
          <h2 className="text-2xl font-bold text-slate-900">{roleDetails.role_name}</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Lejet e tua</h2>
        
        {roleDetails.is_admin ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
            Ju jeni <strong>Admin</strong> dhe keni akses të plotë në të gjitha funksionet e platformës.
          </div>
        ) : (
          <div className="space-y-3">
            {ALL_PERMISSIONS.map(perm => {
              const hasPermission = roleDetails.permissions.includes(perm.key);
              return (
                <div key={perm.key} className={`flex items-start gap-3 p-4 rounded-lg border ${hasPermission ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="mt-0.5">
                    {hasPermission ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${hasPermission ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {perm.label}
                    </p>
                    <p className={`text-sm ${hasPermission ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {perm.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}