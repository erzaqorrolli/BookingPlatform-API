import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { createStripeCheckout } from '../../api/payments';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BookingWizard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();

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
  const [isSleeping, setIsSleeping] = useState(false);

  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '' });
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    notes: '', 
    discount_code: '',
    needs_assistance: false,
    assistance_notes: '',
  });  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const registeredClientEmail = user?.role === 'customer' ? user.email : '';
  const bookingName = (form.name || user?.name || '').trim();

  // --- PAGINIM PËR SHËRBIMET ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // -----------------------------

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
    if (form.email && form.email.includes('@') && company?.id) {
      api.get(`/public/check-sleeping?company_id=${company.id}&email=${form.email}`)
         .then(res => {
             setIsSleeping(res.data.data.is_sleeping);
         })
         .catch(() => setIsSleeping(false));
    } else {
      setIsSleeping(false);
    }
  }, [form.email, company?.id]);

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
    setWaitlistJoined(false); 

    api.get('/public/availability', {
      params: { company_id: company.id, service_id: service.id, date },
    })
      .then((r) => {
        const nextReason = r.data.data.reason || '';
        setSlots(r.data.data.slots || []);
        setSlotReason(nextReason);
        setDateBlockedReason(nextReason);

        if (['closed', 'holiday', 'past_date', 'no_hours_configured', 'invalid_hours'].includes(nextReason)) {
          setError(''); 
        } else {
          setError('');
        }
      })
      .catch(() => setError('Can not read schedule'))
      .finally(() => setLoadingSlots(false));
  }, [service, date, company?.id]);

  const processBooking = async (method) => {
    setError('');
    const bookingEmail = registeredClientEmail || form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingEmail)) {
      setError('Please enter a valid email address');
      return;
    }

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
        name: bookingName,
        email: bookingEmail,
        phone: form.phone,
        notes: form.notes,
        discount_code: form.discount_code,
        needs_assistance: form.needs_assistance ? 1 : 0,
        assistance_notes: form.assistance_notes || '',
        payment_method: method, 
      });

      const responseData = r.data?.data || r.data;
      const booking = responseData?.booking;

      if (!booking || !booking.id) {
        console.error("Përgjigja e backend-it:", r.data);
        throw new Error("Rezervimi u krijua, por ID nuk u kthye nga serveri.");
      }

      const bookingId = booking.id;

      if (method === 'cash') {
        navigate(`/booking-success/${bookingId}`);
        return;
      }

      if (method === 'card') {
        const paymentData = await createStripeCheckout(bookingId);
        if (paymentData.checkout_url) {
          window.location.href = paymentData.checkout_url;
        } else {
          throw new Error("Payment URL was not returned");
        }
      }

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Booking failed');
      setSubmitting(false); 
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistForm.name || !waitlistForm.email) {
      setError('Please fill in your name and email for the waitlist.');
      return;
    }
    setWaitlistLoading(true);
    setError('');
    try {
      await api.post('/public/waitlist', {
        company_id: company.id,
        service_id: service.id,
        booking_date: date,
        name: waitlistForm.name,
        email: waitlistForm.email,
        phone: waitlistForm.phone,
      });
      setWaitlistJoined(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Company not found</h1>
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition">← Back to Home</Link>
        </div>
      </div>
    );
  }

  // --- LLOGARITJET E PAGINIMIT PËR SHËRBIMET ---
  const totalPages = Math.ceil(company.services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = company.services.slice(startIndex, startIndex + itemsPerPage);
  const shouldShowPagination = company.services.length > itemsPerPage;
  // --------------------------------------------

  const steps = [
    { n: 1, label: 'Service' },
    { n: 2, label: 'Date' },
    { n: 3, label: 'Time' },
    { n: 4, label: 'Information' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-indigo-500/30">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
            ← Back
          </Link>
          <div className="text-sm text-white/40">Online Booking</div>
        </div>
      </nav>

      {/* STEPS */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                    step > s.n ? 'bg-indigo-500 text-white' :
                    step === s.n ? 'bg-white text-black' :
                    'bg-white/5 text-white/30'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    step >= s.n ? 'text-white' : 'text-white/30'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${
                    step > s.n ? 'bg-indigo-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          
          {/* Company Header - PËRDOR logo_url */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-indigo-500/20 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
                {company.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
              {company.address && (
                <p className="text-sm text-white/40">{company.address}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* HAPI 1: Zgjedhja e Shërbimit */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Choose service</h2>
              {company.services.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  This company has no services
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setService(s);
                          setStep(2);
                        }}
                        className={`w-full text-left p-5 rounded-2xl border transition-all ${
                          service?.id === s.id
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{s.name}</div>
                            {s.description && (
                              <div className="text-sm text-white/40 mt-1">{s.description}</div>
                            )}
                            <div className="text-xs text-white/30 mt-2 uppercase tracking-wider">
                              {s.duration_minutes} minutes
                            </div>
                          </div>
                          <div className="text-xl font-bold text-white ml-4">
                            €{parseFloat(s.price).toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* PAGINIMI PËR SHËRBIMET */}
                  {shouldShowPagination && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                      <div className="text-sm text-white/40">
                        Showing <span className="font-medium text-white">{startIndex + 1}</span> to{' '}
                        <span className="font-medium text-white">{Math.min(startIndex + itemsPerPage, company.services.length)}</span> of{' '}
                        <span className="font-medium text-white">{company.services.length}</span> services
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-white/60 px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HAPI 2: Zgjedhja e Datës */}
          {step === 2 && service && (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Choose date</h2>
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:bg-white/10 outline-none transition"
              />
              
              {dateBlockedReason && (
                <div className="mt-4 p-4 border-l-4 border-amber-500 bg-amber-500/10 rounded-r-xl">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">
                        {dateBlockedReason === 'fully_booked' ? 'Fully Booked' : 'Date Unavailable'}
                      </p>
                      <p className="text-sm text-amber-200/70 mt-1">
                        {dateBlockedReason === 'closed' ? 'The company is closed on this date.' :
                         dateBlockedReason === 'holiday' ? 'This date is a holiday. Please select another day.' :
                         dateBlockedReason === 'past_date' ? 'This date has already passed.' :
                         dateBlockedReason === 'no_hours_configured' ? 'Working hours are not set for this date.' :
                         dateBlockedReason === 'invalid_hours' ? 'Invalid working hours for this date.' :
                         dateBlockedReason === 'fully_booked' ? 'No slots available. You can join the waitlist below.' :
                         'This date is not available.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 border border-white/10 text-white/60 rounded-xl hover:bg-white/5 text-sm font-medium transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (isValidBookingDate(date) && !dateBlockedReason) setStep(3);
                  }}
                  disabled={!isValidBookingDate(date) || !!dateBlockedReason || loadingSlots}
                  className="flex-1 px-5 py-3 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-50 text-sm font-semibold transition shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  {loadingSlots ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* HAPI 3: Zgjedhja e Orarit */}
          {step === 3 && service && date && (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Choose time</h2>

              {loadingSlots ? (
                <div className="text-center py-8 text-white/40">Loading...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/50 mb-4">
                    {slotReason === 'closed' ? 'Company is closed on this day' :
                     slotReason === 'holiday' ? 'Holiday' :
                     slotReason === 'past_date' ? 'This date has already passed' :
                     slotReason === 'no_hours_configured' ? 'Working hours are not configured for this day' :
                     slotReason === 'invalid_hours' ? 'Working hours are invalid for this day' :
                     slotReason === 'fully_booked' ? 'Fully booked' :
                     'No available time slots'}
                  </p>

                  {slotReason === 'fully_booked' && !waitlistJoined && (
                    <div className="mt-6 bg-indigo-500/10 p-6 rounded-2xl text-left max-w-md mx-auto border border-indigo-500/20">
                      <h4 className="font-bold text-indigo-300 mb-1">Join Waitlist</h4>
                      <p className="text-sm text-indigo-200/60 mb-5">Get notified automatically if a slot opens up for this date.</p>
                      
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Your Name *" 
                          value={waitlistForm.name} 
                          onChange={e => setWaitlistForm({...waitlistForm, name: e.target.value})} 
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 outline-none transition" 
                        />
                        <input 
                          type="email" 
                          placeholder="Your Email *" 
                          value={waitlistForm.email} 
                          onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})} 
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 outline-none transition" 
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone (optional)" 
                          value={waitlistForm.phone} 
                          onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})} 
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 outline-none transition" 
                        />
                        <button 
                          onClick={handleJoinWaitlist}
                          disabled={waitlistLoading}
                          className="w-full bg-indigo-500 text-white py-3 rounded-xl font-medium hover:bg-indigo-400 disabled:opacity-50 transition"
                        >
                          {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {waitlistJoined && (
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl max-w-md mx-auto">
                      <p className="font-bold">✓ You're on the list!</p>
                      <p className="text-sm mt-1 text-emerald-200/60">We will email you as soon as a slot becomes available.</p>
                    </div>
                  )}

                  {!waitlistJoined && slotReason !== 'fully_booked' && (
                    <button
                      onClick={() => setStep(2)}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition mt-4"
                    >
                      Choose another date
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      onClick={() => setSelectedSlot(s)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                        selectedSlot?.start === s.start
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {s.start.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3 border border-white/10 text-white/60 rounded-xl hover:bg-white/5 text-sm font-medium transition"
                >
                  ← Back
                </button>
                {!waitlistJoined && (
                  <button
                    onClick={() => setStep(4)}
                    disabled={!selectedSlot}
                    className="flex-1 px-5 py-3 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-50 text-sm font-semibold transition shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && selectedSlot && (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Your information</h2>

              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Service</span>
                  <span className="font-medium text-white">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Date</span>
                  <span className="font-medium text-white">
                    {new Date(date).toLocaleDateString('sq-AL')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Time</span>
                  <span className="font-medium text-white">
                    {selectedSlot.start.slice(0, 5)} - {selectedSlot.end.slice(0, 5)}
                  </span>
                </div>
                {selectedSlot.happy_hour && (
                  <div className="flex justify-between text-sm pt-3 border-t border-white/5">
                    <span className="text-white/40">Happy Hour ({selectedSlot.happy_hour.discount_percent}% off)</span>
                    <span className="font-medium text-emerald-400">
                      -€{(parseFloat(service.price) * selectedSlot.happy_hour.discount_percent / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-3 border-t border-white/5">
                  <span className="text-white/40">Price</span>
                  <span className="font-bold text-white text-lg">
                    €{(parseFloat(service.price) * (1 - (selectedSlot.happy_hour?.discount_percent || 0) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={form.name || user?.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                {!registeredClientEmail && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                    />
                    <p className="text-xs text-white/40 mt-2">
                      We’ll send your booking confirmation to this address.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="needs_assistance"
                    checked={form.needs_assistance}
                    onChange={(e) => setForm({ ...form, needs_assistance: e.target.checked, assistance_notes: e.target.checked ? form.assistance_notes : '' })}
                    className="mt-0.5 w-4 h-4 text-amber-500 bg-white/5 border-white/20 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="needs_assistance" className="text-sm text-white/70 cursor-pointer flex-1">
                    <span className="font-medium flex items-center gap-1.5 text-white">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      I need assistance
                    </span>
                    <p className="text-xs text-white/40 mt-1">
                      Your booking will be treated with high priority.
                    </p>
                  </label>
                </div>

                {form.needs_assistance && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                      What kind of help you need?
                    </label>
                    <textarea
                      value={form.assistance_notes}
                      onChange={(e) => setForm({ ...form, assistance_notes: e.target.value })}
                      rows={2}
                      placeholder="I need an assistant..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition resize-none"
                    />
                  </div>
                )}

                {company.has_active_discount_codes && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                      Discount code (optional)
                    </label>
                    <input
                      type="text"
                      value={form.discount_code}
                      onChange={(e) => setForm({ ...form, discount_code: e.target.value.toUpperCase() })}
                      placeholder={isSleeping ? 'Enter the code sent to you by email' : 'Enter discount code'}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 font-mono focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-3.5 border border-white/10 text-white/60 rounded-xl hover:bg-white/5 text-sm font-medium transition"
                  >
                    ← Back
                  </button>

                  <button
                    onClick={() => processBooking('cash')}
                    disabled={submitting || !bookingName}
                    className="flex-1 px-5 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 disabled:opacity-50 text-sm font-semibold transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {submitting ? 'Processing...' : 'Pay with Cash'}
                  </button>

                  <button
                    onClick={() => processBooking('card')}
                    disabled={submitting || !bookingName}
                    className="flex-1 px-5 py-3.5 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-50 text-sm font-semibold transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {submitting ? 'Processing...' : 'Pay with Card'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}