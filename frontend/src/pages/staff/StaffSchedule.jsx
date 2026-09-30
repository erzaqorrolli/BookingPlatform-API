import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

export default function StaffSchedule() {
  const { activeCompany } = useCompany();
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekDays[6]);

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const r = await api.get(`/companies/${activeCompany.id}/schedule/me`, {
        params: { start: weekStartStr, end: weekEndStr },
      });
      setSchedule(r.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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

  const getShift = (dateStr) => {
    return schedule.find((s) => s.date === dateStr);
  };

  const statusBadge = (status) => {
    const map = {
      scheduled: { label: 'Fixed', class: 'bg-emerald-100 text-emerald-700' },
      completed: { label: 'Done', class: 'bg-blue-100 text-blue-700' },
      vacation:  { label: 'Free day', class: 'bg-amber-100 text-amber-700' },
      sick:      { label: 'Sick', class: 'bg-red-100 text-red-700' },
      absent:    { label: 'Absent', class: 'bg-slate-100 text-slate-700' },
    };
    return map[status] || { label: status, class: 'bg-slate-100 text-slate-700' };
  };

  const totalHours = schedule.reduce((sum, s) => {
    if (s.status !== 'scheduled' && s.status !== 'completed') return sum;
    const [sh, sm] = s.shift_start.split(':').map(Number);
    const [eh, em] = s.shift_end.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);

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
          <h1 className="text-2xl font-bold text-slate-900">My schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            {weekDays[0].toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' })} —{' '}
            {weekDays[6].toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition">
            This week
          </button>
          <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">This week's shift</p>
          <p className="text-3xl font-bold text-slate-900">{schedule.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total working hours</p>
          <p className="text-3xl font-bold text-orange-600">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 mb-1">Working day</p>
          <p className="text-3xl font-bold text-emerald-600">
            {schedule.filter((s) => s.status === 'scheduled' || s.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Week view */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((d, i) => {
            const dateStr = formatDate(d);
            const shift = getShift(dateStr);
            const isToday = dateStr === formatDate(new Date());
            const badge = shift ? statusBadge(shift.status) : null;

            return (
              <div
                key={i}
                className={`bg-white rounded-xl border-2 p-4 transition ${
                  isToday ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${
                      isToday ? 'text-orange-600' : 'text-slate-400'
                    }`}>
                      {DAY_SHORT[d.getDay()]}
                    </div>
                    <div className={`text-2xl font-bold ${
                      isToday ? 'text-orange-600' : 'text-slate-900'
                    }`}>
                      {d.getDate()}
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                      SOT
                    </span>
                  )}
                </div>

                {shift ? (
                  <div>
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{ color: shift.shift_color }}
                    >
                      {shift.shift_name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {shift.shift_start.slice(0, 5)} - {shift.shift_end.slice(0, 5)}
                    </div>
                    {badge && (
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 ${badge.class}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">
                    Free day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs bg-white rounded-xl border border-slate-200 p-4">
        <span className="text-slate-500 font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-100 rounded-full" />
          <span className="text-slate-600">Fixed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-100 rounded-full" />
          <span className="text-slate-600">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-100 rounded-full" />
          <span className="text-slate-600">Free day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 rounded-full" />
          <span className="text-slate-600">Sick</span>
        </div>
      </div>
    </div>
  );
}