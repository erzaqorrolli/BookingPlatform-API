import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] lg:grid lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
      <div className="mesh-gradient relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-teal-200/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-300 text-[#10213b] shadow-lg shadow-teal-950/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a4 4 0 018 0v2m-9 0h10a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2zm3 5h4m-2-2v4" /></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Bookwise</span>
          </div>
          <div className="mt-24 max-w-lg">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Operations, beautifully simple</p>
            <h2 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em]">Your time is valuable. Make every booking count.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">One calm workspace for scheduling, customer relationships, and the day-to-day rhythm of your business.</p>
          </div>
        </div>
        <div className="relative z-10 mt-16 flex items-center gap-3 text-sm text-slate-300">
          <div className="flex -space-x-2"><span className="h-8 w-8 rounded-full border-2 border-[#132541] bg-amber-200" /><span className="h-8 w-8 rounded-full border-2 border-[#132541] bg-teal-200" /><span className="h-8 w-8 rounded-full border-2 border-[#132541] bg-rose-200" /></div>
          <span>Trusted by teams that value their time</span>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-[430px] fade-in-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10213b] text-teal-300"><span className="text-lg font-bold">B</span></div>
            <span className="font-bold text-[#10213b]">Bookwise</span>
          </div>
          <div className="mb-8">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              <span aria-hidden="true">←</span>
              Back to home
            </Link>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#172033]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#71809a]">{subtitle}</p>
          </div>
          <div className="surface p-6 sm:p-8">{children}</div>
          <p className="mt-6 text-center text-xs text-[#91a0b7]">Secure workspace · Built for modern teams</p>
        </div>
      </div>
    </div>
  );
}
