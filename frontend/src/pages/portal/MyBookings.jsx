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
          <p className="text-sm text-slate-500 mb-1">Upcoming</p>
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
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No bookings</h3>
          <p className="text-sm text-slate-500">
            {filter === 'upcoming' ? 'Reserve your first booking' : 'Try another filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reference ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date & Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => {
                const review = hasReview(b.id);
                const canCancel = ['pending', 'confirmed'].includes(b.status);

                return (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-indigo-600">
                        {b.reference}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">{b.service_name}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <div>{new Date(b.booking_date).toLocaleDateString('en-GB')}</div>
                      <div className="text-xs text-slate-500">{b.start_time?.slice(0, 5)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                      {review && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          ★ {review.rating}.0
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        €{parseFloat(b.total_price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                        {b.status === 'completed' && !review && (
                          <button
                            onClick={() => openReview(b)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition whitespace-nowrap"
                          >
                            Review
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

      {/* Modal për review */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Leave a review</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${star <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                placeholder="Tell us about your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Submit review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}