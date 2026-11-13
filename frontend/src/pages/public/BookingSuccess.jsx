import { useParams, Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export default function BookingSuccess() {
  const { id } = useParams();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30 sm:p-6">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-[#0a0a0f] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 text-center shadow-2xl shadow-black/50 sm:p-10">
          
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Booking accepted!
          </h1>
          
          <p className="text-white/50 mb-2">
            Booking number:
          </p>
          <p className="mb-6 break-all font-mono text-lg font-semibold text-emerald-400">
            #{id}
          </p>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-8">
            <p className="text-sm text-white/60">
              You will be informed through email for your booking.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-white text-black rounded-xl hover:bg-white/90 font-semibold text-sm transition shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home Page
          </Link>

          <p className="mt-6 text-xs text-white/30">
            © {new Date().getFullYear()} {settings?.company_name || 'BookWise'}
          </p>
        </div>
      </div>
    </div>
  );
}