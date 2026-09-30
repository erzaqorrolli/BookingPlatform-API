import { useParams, Link } from 'react-router-dom';

export default function BookingSuccess() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Booking accepted!
        </h1>
        <p className="text-slate-500 mb-6">
          Booking number: <strong className="text-slate-900">#{id}</strong>
        </p>
        <p className="text-sm text-slate-500 mb-8">
          You will be informed through email for your booking.
        </p>

        <Link
          to="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          Back in Home Page
        </Link>
      </div>
    </div>
  );
}