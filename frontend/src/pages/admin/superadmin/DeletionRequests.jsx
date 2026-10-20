import { useState, useEffect } from 'react';
import api from '../../../api/client';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

export default function DeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/deletion-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDelete = async (companyId, companyName, notificationId) => {
    const confirm = await Swal.fire({
      title: 'Fshi Kompaninë?',
      html: `A jeni i sigurt që dëshironi të fshini kompaninë <b>"${companyName}"</b>?<br/><span class="text-sm text-red-600 font-bold">Ky veprim është i përhershëm!</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Po, fshije!',
      cancelButtonText: 'Anulo',
    });

    if (!confirm.isConfirmed) return;

    try {
      // 1. Fshijmë kompaninë
      await api.delete(`/superadmin/companies/${companyId}`);
      
      // 2. Shënojmë njoftimin si të lexuar (ose e fshijmë fare)
      await api.post(`/me/notifications/${notificationId}/read`);
      
      Swal.fire('U fshi!', 'Kompania u fshi me sukses.', 'success');
      loadRequests();
    } catch (err) {
      Swal.fire('Gabim', err.response?.data?.error || 'Fshirja dështoi', 'error');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Duke ngarkuar kërkesat...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Deletion Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kërkesat nga pronarët e kompanive për t'i fshirë ato.
          </p>
        </div>
        <button 
          onClick={loadRequests}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Nuk ka kërkesa</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Të gjitha kërkesat janë trajtuar.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Kompania</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Kërkesa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Veprimet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((req) => (
                <tr key={req.notification_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                    {req.company_name || 'Kompani e fshirë'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {req.message}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {new Date(req.created_at).toLocaleDateString('sq-AL')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(req.company_id, req.company_name, req.notification_id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      Approve & Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}