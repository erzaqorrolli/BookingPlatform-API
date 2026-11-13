import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function AuthLayout({ children, title, subtitle }) {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex font-sans selection:bg-indigo-500/30">
      
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d0d14] border-r border-white/5 flex-col justify-between p-16">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">{settings.platform_name}</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            The future of booking
          </p>
          <h2 className="text-4xl font-bold tracking-tighter leading-tight mb-6">
            Manage your business, <br />
            <span className="text-white/40">effortlessly.</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed mb-10">
            One workspace for bookings, clients, staff, and payments. Built for modern businesses that move fast.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
            <div>
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Free to use</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] lg:hidden" />

        <div className="relative w-full max-w-md">
          
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">{settings.platform_name}</span>
          </div>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-white/40 hover:text-white transition mb-6">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <p className="text-sm text-white/50">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-8">
            {children}
          </div>

          <p className="mt-8 text-center text-xs text-white/30">
            Secured with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
}