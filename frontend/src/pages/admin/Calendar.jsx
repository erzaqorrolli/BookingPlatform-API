import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enGB } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { useEffect } from 'react';

const locales = {
  'en-GB': enGB,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function Calendar() {
  const { activeCompany } = useCompany();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!activeCompany) return;

    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

    api
      .get(`/companies/${activeCompany.id}/calendar-events`, {
        params: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
      })
      .then((r) => {
        const raw = r.data.data || [];
        const mapped = raw.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          resource: e,
          backgroundColor: e.backgroundColor,
        }));
        setEvents(mapped);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeCompany, currentDate]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleSelectSlot = ({ start }) => {
    const dateStr = start.toISOString().split('T')[0];
    navigate(`/admin/bookings?date=${dateStr}`);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor || '#4f46e5',
        borderColor: event.backgroundColor || '#4f46e5',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '0.75rem',
        padding: '2px 6px',
      },
    };
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Choose a company
        </h3>
        <p className="text-sm text-slate-500">
          You must have an active company
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany.name} · Visual overview of bookings
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <span className="text-slate-600">Waiting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
            <span className="text-slate-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#3b82f6' }} />
            <span className="text-slate-600">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#d97706' }} />
            <span className="text-slate-600">Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <span className="text-slate-600">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 calendar-wrapper">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            views={['month', 'week', 'day']}
            defaultView="month"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
            eventPropGetter={eventStyleGetter}
            culture="en-GB"
            messages={{
              today: 'Today',
              previous: 'Back',
              next: 'Next',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Time',
              event: 'Event',
              noEventsInRange: 'No bookings in this period',
              showMore: (total) => `+${total} more`,
            }}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: selectedEvent.backgroundColor }}
                />
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedEvent.resource.reference}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {selectedEvent.resource.extendedProps?.needs_assistance === 1 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  ⚠️ Priority Client
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  This client needs special assistance.
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium text-slate-900">
                  {selectedEvent.resource.extendedProps?.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900 break-all text-right ml-4">
                  {selectedEvent.resource.extendedProps?.customer_email}
                </span>
              </div>
              {selectedEvent.resource.extendedProps?.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">
                    {selectedEvent.resource.extendedProps.customer_phone}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-900">
                  {selectedEvent.resource.extendedProps?.service_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {selectedEvent.start.toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-medium text-slate-900">
                  {selectedEvent.start.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {selectedEvent.end && (
                    <>
                      {' - '}
                      {selectedEvent.end.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-indigo-600">
                  €{Number(selectedEvent.resource.extendedProps?.total_price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-900 capitalize">
                  {selectedEvent.resource.extendedProps?.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/admin/bookings')}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Go to Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}