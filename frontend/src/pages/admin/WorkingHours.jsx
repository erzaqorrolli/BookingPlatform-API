import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wendsday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function WorkingHours() {
  const { activeCompany } = useCompany();
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const r = await api.get(`/companies/${activeCompany.id}/working-hours`);
      const existing = r.data.data || [];

      const full = DAYS.map((d) => {
        const found = existing.find((h) => parseInt(h.day_of_week) === d.value);
        return {
          day_of_week: d.value,
          label: d.label,
          open_time: found?.open_time?.slice(0, 5) || '09:00',
          close_time: found?.close_time?.slice(0, 5) || '18:00',
          is_closed: found ? parseInt(found.is_closed) : 1,
        };
      });

      setHours(full);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeCompany]);

const updateDay = (dayValue, field, value) => {
  setHours((prev) =>
    prev.map((h) => {
      if (h.day_of_week !== dayValue) return h;

      const updated = { ...h, [field]: value };

      if (!updated.is_closed) {
        const openTime = updated.open_time;
        const closeTime = updated.close_time;

        if (openTime && closeTime && closeTime <= openTime) {
          if (field === 'open_time') {
            const [h1, m1] = openTime.split(':').map(Number);
            const newCloseH = Math.min(h1 + 1, 23);
            updated.close_time = `${String(newCloseH).padStart(2, '0')}:${String(m1).padStart(2, '0')}`;
          } else if (field === 'close_time') {
            return h; 
          }
        }
      }

      return updated;
    })
  );
  setSaved(false);
};
  const toggleClosed = (dayValue) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayValue ? { ...h, is_closed: h.is_closed ? 0 : 1 } : h
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        hours.map((h) =>
          api.put(`/companies/${activeCompany.id}/working-hours/${h.day_of_week}`, {
            open_time: h.open_time.length === 5 ? h.open_time + ':00' : h.open_time,
            close_time: h.close_time.length === 5 ? h.close_time + ':00' : h.close_time,
            is_closed: h.is_closed,
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Change failed');
    } finally {
      setSaving(false);
    }
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a company</h3>
        <p className="text-sm text-slate-500">You must have an active company</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Working Hours</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany.name} ·  Configure weekly schedule
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {hours.map((day) => (
            <div key={day.day_of_week} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 sm:w-56">
                <button
                  onClick={() => toggleClosed(day.day_of_week)}
                  className={`relative w-11 h-6 rounded-full transition ${
                    day.is_closed ? 'bg-slate-300' : 'bg-emerald-500'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      day.is_closed ? 'translate-x-0' : 'translate-x-5'
                    }`}
                  />
                </button>
                <span className={`font-medium ${
                  day.is_closed ? 'text-slate-400' : 'text-slate-900'
                }`}>
                  {day.label}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-1">
                {day.is_closed ? (
                  <span className="text-sm text-slate-400 italic">Closed</span>
                ) : (
                  <>
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) => updateDay(day.day_of_week, 'open_time', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) => updateDay(day.day_of_week, 'close_time', e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                    />
                  </>
                )}
              </div>

              <div className="sm:w-24 text-right">
                {!day.is_closed && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Open
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
        <strong>Info:</strong> Weekly schedule configures when clients can book. Changes are applied immediatly
      </div>
    </div>
  );
}