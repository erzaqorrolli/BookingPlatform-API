import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

export default function Schedule() {
  const { activeCompany } = useCompany();
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [schedule, setSchedule] = useState([]);
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [form, setForm] = useState({ user_id: '', shift_id: '', status: 'scheduled', notes: '' });
  const [saving, setSaving] = useState(false);

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekDays[6]);

  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [scheduleRes, membersRes, shiftsRes] = await Promise.all([
        api.get(`/companies/${activeCompany.id}/schedule`, {
          params: { start: weekStartStr, end: weekEndStr },
        }),
        api.get(`/companies/${activeCompany.id}/members`),
        api.get(`/companies/${activeCompany.id}/shifts`),
      ]);
      setSchedule(scheduleRes.data.data || []);
      setMembers(membersRes.data.data || []);
      setShifts(shiftsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(load, 0);
    return () => window.clearTimeout(initialLoad);
    // load is intentionally invoked asynchronously for this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany, weekStartStr]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const getEntry = (userId, dateStr) => {
    return schedule.find(
      (s) => parseInt(s.user_id) === userId && s.date === dateStr
    );
  };

  const openCell = (userId, date, existing = null) => {
    setSelectedCell({ userId, date, existing });
    setForm({
      user_id: userId,
      shift_id: existing?.shift_id || shifts[0]?.id || '',
      status: existing?.status || 'scheduled',
      notes: existing?.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shift_id) return;

    setSaving(true);
    try {
      await api.post(`/companies/${activeCompany.id}/schedule`, {
        user_id: form.user_id,
        shift_id: parseInt(form.shift_id),
        date: selectedCell.date,
        status: form.status,
        notes: form.notes,
      });
      await load();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCell?.existing) return;
    if (!confirm('Fshij turnin?')) return;

    try {
      await api.delete(`/companies/${activeCompany.id}/schedule/${selectedCell.existing.id}`);
      await load();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Deletion failed');
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'border-l-4 border-emerald-500';
      case 'completed': return 'border-l-4 border-blue-500';
      case 'vacation':  return 'border-l-4 border-amber-500';
      case 'sick':      return 'border-l-4 border-red-500';
      case 'absent':    return 'border-l-4 border-slate-400';
      default:          return '';
    }
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a company</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff working hours</h1>
          <p className="text-sm text-slate-500 mt-1">
            {weekDays[0].toLocaleDateString('sq-AL')} — {weekDays[6].toLocaleDateString('sq-AL')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition">
            Sot
          </button>
          <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-emerald-500 bg-white" />
          <span className="text-slate-600">Assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-blue-500 bg-white" />
          <span className="text-slate-600">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-amber-500 bg-white" />
          <span className="text-slate-600">Closed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-red-500 bg-white" />
          <span className="text-slate-600">Sick</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No members</h3>
          <p className="text-sm text-slate-500">
            Invite team members before assigning work shift
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">
                    Member
                  </th>
                  {weekDays.map((d, i) => {
                    const isToday = formatDate(d) === formatDate(new Date());
                    return (
                      <th
                        key={i}
                        className={`text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider ${
                          isToday ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
                        }`}
                      >
                        <div>{DAY_SHORT[d.getDay()]}</div>
                        <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-indigo-700' : 'text-slate-900'}`}>
                          {d.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{m.name}</div>
                          <div className="text-xs text-slate-400 capitalize">{m.role}</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((d, i) => {
                      const dateStr = formatDate(d);
                      const entry = getEntry(m.id, dateStr);
                      return (
                        <td key={i} className="px-1 py-2 text-center align-top">
                          {entry ? (
                            <button
                              onClick={() => openCell(m.id, dateStr, entry)}
                              className={`w-full px-2 py-2 rounded-lg text-xs font-medium hover:shadow-md transition text-left ${statusColor(entry.status)}`}
                              style={{
                                backgroundColor: entry.shift_color + '15',
                                color: entry.shift_color,
                              }}
                            >
                              <div className="font-semibold truncate">{entry.shift_name}</div>
                              <div className="text-[10px] opacity-75 font-mono">
                                {entry.shift_start.slice(0, 5)}
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCell(m.id, dateStr)}
                              className="w-full h-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-300 hover:border-indigo-400 hover:text-indigo-500 transition text-xl"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {selectedCell?.existing ? 'Change shift' : 'Choose shift'}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {members.find((m) => m.id === selectedCell?.userId)?.name} ·{' '}
              {new Date(selectedCell?.date).toLocaleDateString('sq-AL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Shift *
                </label>
                <select
                  value={form.shift_id}
                  onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose shift...</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="scheduled">Assigned</option>
                  <option value="completed">Done</option>
                  <option value="vacation">Closed</option>
                  <option value="sick">Sick</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {selectedCell?.existing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
                >
                  {saving ? 'Loading...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}