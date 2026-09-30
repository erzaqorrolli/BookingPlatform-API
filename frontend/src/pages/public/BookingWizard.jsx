import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function BookingWizard() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);


  const [service, setService] = useState(null);


  const [date, setDate] = useState('');


  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotReason, setSlotReason] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateBlockedReason, setDateBlockedReason] = useState('');

const [form, setForm] = useState({ 
  name: '', 
  email: '', 
  phone: '', 
  notes: '', 
  discount_code: '',
  needs_assistance: false,
  assistance_notes: '',
});  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isValidBookingDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return false;

    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const maxAllowedDate = new Date(2026, 11, 31);

    return selectedDate >= startOfToday && selectedDate <= maxAllowedDate;
  };

  useEffect(() => {
    api.get(`/public/companies/${slug}`)
      .then((r) => setCompany(r.data.data))
      .catch(() => setError('Company not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!service || !isValidBookingDate(date) || !company?.id) {
      setDateBlockedReason('');
      setSlotReason('');
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    setLoadingSlots(true);
    setSlots([]);
    setSlotReason('');
    setSelectedSlot(null);
    setDateBlockedReason('');

    api.get('/public/availability', {
      params: { company_id: company.id, service_id: service.id, date },
    })
      .then((r) => {
        const nextReason = r.data.data.reason || '';
        setSlots(r.data.data.slots || []);
        setSlotReason(nextReason);
        setDateBlockedReason(nextReason);

        if (['closed', 'holiday', 'past_date', 'no_hours_configured', 'invalid_hours'].includes(nextReason)) {
          setError('This date is not available for booking.');
        } else {
          setError('');
        }
      })
      .catch(() => setError('Can not read schedule'))
      .finally(() => setLoadingSlots(false));
  }, [service, date, company?.id]);

  const handleSubmit = async () => {
    setError('');
    if (!isValidBookingDate(date)) {
      setError('Please choose a valid date');
      return;
    }

    setSubmitting(true);
    try {
      const r = await api.post('/public/bookings', {
        company_id: company.id,
        service_id: service.id,
        booking_date: date,
        start_time: selectedSlot.start,
        name: form.name,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        discount_code: form.discount_code,
        needs_assistance: form.needs_assistance ? 1 : 0,
        assistance_notes: form.assistance_notes || '',
      });

      navigate(`/booking-success/${r.data.data.booking.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2"> Company not found</h1>
          <Link to="/" className="text-indigo-600 hover:underline">← Back in Home Page</Link>
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'Service' },
    { n: 2, label: 'Date' },
    { n: 3, label: 'Time' },
    { n: 4, label: 'Information' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
            ← Back
          </Link>
          <div className="text-sm text-slate-500">Online Booking</div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                    step > s.n ? 'bg-indigo-600 text-white' :
                    step === s.n ? 'bg-indigo-600 text-white' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    step >= s.n ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${
                    step > s.n ? 'bg-indigo-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {company.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
              {company.address && (
                <p className="text-sm text-slate-500">{company.address}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Choose service
              </h2>
              {company.services.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  This company has no services
                </div>
              ) : (
                <div className="space-y-3">
                  {company.services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setService(s);
                        setStep(2);
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition ${
                        service?.id === s.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          {s.description && (
                            <div className="text-sm text-slate-500 mt-0.5">{s.description}</div>
                          )}
                          <div className="text-xs text-slate-400 mt-1">
                            {s.duration_minutes} minutes
                          </div>
                        </div>
                        <div className="text-lg font-bold text-indigo-600 ml-4">
                          €{parseFloat(s.price).toFixed(2)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && service && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Choose date
              </h2>
              <input
                type="date"
                value={date}
                min={formatDateForInput(new Date())}
                max={formatDateForInput(new Date(2026, 11, 31))}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  if (nextDate && !isValidBookingDate(nextDate)) {
                    setError('Bookings are only available from today through 31 December 2026.');
                    setDate('');
                    setDateBlockedReason('');
                    return;
                  }

                  setError('');
                  setDateBlockedReason('');
                  setDate(/^\d{4}-\d{2}-\d{2}$/.test(nextDate) ? nextDate : '');
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              {dateBlockedReason && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  {dateBlockedReason === 'closed' ? 'This date is closed for bookings.' :
                   dateBlockedReason === 'holiday' ? 'This date is a holiday.' :
                   dateBlockedReason === 'past_date' ? 'This date has already passed.' :
                   dateBlockedReason === 'no_hours_configured' ? 'Working hours are not configured for this date.' :
                   dateBlockedReason === 'invalid_hours' ? 'The working hours for this date are invalid.' :
                   'This date is not available for booking.'}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (isValidBookingDate(date) && !dateBlockedReason) setStep(3);
                  }}
                  disabled={!isValidBookingDate(date) || !!dateBlockedReason || loadingSlots}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  {loadingSlots ? 'Checking...' : 'Go'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && service && date && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Choose schedule
              </h2>

              {loadingSlots ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-2">
                    {slotReason === 'closed' ? 'Company is closed in this day' :
                     slotReason === 'holiday' ? 'Holiday' :
                     slotReason === 'past_date' ? 'This date has already passed' :
                     slotReason === 'no_hours_configured' ? 'Working hours are not configured for this day' :
                     slotReason === 'invalid_hours' ? 'Working hours are invalid for this day' :
                     slotReason === 'fully_booked' ? 'Fully booked' :
                     'No available time slots'}
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Choose another date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      onClick={() => setSelectedSlot(s)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                        selectedSlot?.start === s.start
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      {s.start.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedSlot}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  Go
                </button>
              </div>
            </div>
          )}

          {step === 4 && selectedSlot && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Your information
              </h2>

              <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-900">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">
                    {new Date(date).toLocaleDateString('sq-AL')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium text-slate-900">
                    {selectedSlot.start.slice(0, 5)} - {selectedSlot.end.slice(0, 5)}
                  </span>
                </div>
                {selectedSlot.happy_hour && (
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500">Happy Hour ({selectedSlot.happy_hour.discount_percent}% off)</span>
                    <span className="font-medium text-emerald-600">
                      -€{(parseFloat(service.price) * selectedSlot.happy_hour.discount_percent / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                  <span className="text-slate-500">Price</span>
                  <span className="font-bold text-indigo-600">
                    €{(parseFloat(service.price) * (1 - (selectedSlot.happy_hour?.discount_percent || 0) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
               <div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">
    Notes (optional)
  </label>
  <textarea
    value={form.notes}
    onChange={(e) => setForm({ ...form, notes: e.target.value })}
    rows={2}
    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
  />
</div>

<div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
  <input
    type="checkbox"
    id="needs_assistance"
    checked={form.needs_assistance}
    onChange={(e) => setForm({ ...form, needs_assistance: e.target.checked, assistance_notes: e.target.checked ? form.assistance_notes : '' })}
    className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
  />
  <label htmlFor="needs_assistance" className="text-sm text-slate-700 cursor-pointer flex-1">
    <span className="font-medium flex items-center gap-1.5">
      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      I need assistance
    </span>
    <p className="text-xs text-slate-500 mt-0.5">
      If you need speacial help, or need assistance please note here. Your booking will be treated with high priority!
    </p>
  </label>
</div>

{form.needs_assistance && (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      What kind of help you need? (optional)
    </label>
    <textarea
      value={form.assistance_notes}
      onChange={(e) => setForm({ ...form, assistance_notes: e.target.value })}
      rows={2}
      placeholder="I need an assistant..."
      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
    />
  </div>
)}
                {company.has_active_discount_codes && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Discount code (optional)
                    </label>
                    <input
                      type="text"
                      value={form.discount_code}
                      onChange={(e) => setForm({ ...form, discount_code: e.target.value.toUpperCase() })}
                      placeholder="DISCOUNTCODE"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.name || !form.email}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  {submitting ? 'Sending...' : 'Confirm booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}