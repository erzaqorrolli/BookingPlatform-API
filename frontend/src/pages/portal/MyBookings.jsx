import { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';

const STATUS_LABELS = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'Absent',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-slate-100 text-slate-700',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const isUpcomingBooking = (b) => {
    const statusOk = b.status === 'pending' || b.status === 'confirmed';
    const dateOk = !b.booking_date || toLocalDate(b.booking_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    return statusOk && dateOk;
  };

  const load = async () => {
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        api.get('/me/bookings'),
        api.get('/me/reviews'),
      ]);
      setBookings(bookingsRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (booking) => {
    const { value: reason } = await Swal.fire({
      title: 'Cancel booking?',
      html: `Are you sure you want to cancel <b>${booking.reference}</b>?`,
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Please tell us why you want to cancel...',
      showCancelButton: true,
      confirmButtonText: 'Cancel booking',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Keep it',
      inputValidator: (value) => {
        if (!value || value.trim().length < 3) {
          return 'Please write a reason (at least 3 characters)';
        }
      },
    });

    if (!reason) return;

    try {
      await api.post(`/me/bookings/${booking.id}/cancel`, { reason });
      await load();

      Swal.fire({
        icon: 'success',
        title: 'Cancelled',
        text: 'Your booking has been cancelled.',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot cancel',
        text: err.response?.data?.error || 'Action failed',
      });
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return isUpcomingBooking(b);
    }
    if (filter === 'past') {
      return b.status === 'completed';
    }
    if (filter === 'cancelled') {
      return b.status === 'cancelled' || b.status === 'no_show';
    }
    return true;
  });

  const hasReview = (bookingId) => {
    return reviews.find((r) => r.booking_id === bookingId);
  };

  const openReview = (booking) => {
    setReviewModal(booking);
    setRating(5);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewModal) return;

    setSubmitting(true);
    try {
      await api.post('/me/reviews', {
        booking_id: reviewModal.id,
        rating,
        comment,
      });
      setReviewModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingCount = bookings.filter((b) => isUpcomingBooking(b)).length;
  const pastCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled' || b.status === 'no_show').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and manage all your bookings
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Upcompings</p>
          <p className="text-3xl font-bold text-emerald-600">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Done</p>
          <p className="text-3xl font-bold text-blue-600">{pastCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Cancelled</p>
          <p className="text-3xl font-bold text-red-500">{cancelledCount}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {[
          { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
          { key: 'past', label: `Done (${pastCount})` },
          { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              filter === f.key
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No bookings
          </h3>
          <p className="text-sm text-slate-500">
            {filter === 'upcoming'
              ? 'Reserve your first booking'
              : 'Try another filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const review = hasReview(b.id);
            const canCancel = ['pending', 'confirmed'].includes(b.status);

            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{b.service_name}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>

                      {review && (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          ⭐ {review.rating}.0
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3">
                      <div>
                        <span className="text-slate-400">Company</span>
                        <p className="font-medium text-slate-900">{b.company_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Date</span>
                        <p className="font-medium text-slate-900">
                          {new Date(b.booking_date).toLocaleDateString('sq-AL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Time</span>
                        <p className="font-medium text-slate-900">
                          {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>

                    {b.status === 'cancelled' && b.cancellation_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                        <strong>Reason:</strong> {b.cancellation_reason}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-slate-900">
                      €{parseFloat(b.total_price).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">#{b.id}</div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b)}
                        className="mt-3 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-xs transition block w-full"
                      >
                        Cancel booking
                      </button>
                    )}

                    {b.status === 'completed' && !review && (
                      <button
                        onClick={() => openReview(b)}
                        className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 font-medium text-xs transition shadow-sm"
                      >
                        ⭐ Review
                      </button>
                    )}

                    {review && (
                      <div className="mt-3 text-xs text-emerald-600 font-medium">
                        ✓ Review done
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Review
                </h3>
                <p className="text-sm text-slate-500">
                  {reviewModal.service_name} · {reviewModal.company_name}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      star <= rating ? 'text-amber-500 scale-110' : 'text-slate-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {rating === 5 ? 'Excellent!' :
                 rating === 4 ? 'Very good' :
                 rating === 3 ? 'Good' :
                 rating === 2 ? 'Bad' :
                 'Very bad'}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share your excperience..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 font-medium text-sm disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Publish review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}