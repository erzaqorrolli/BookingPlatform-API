import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export default function About() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="truncate font-bold text-sm tracking-tight sm:text-base">{settings.platform_name}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/about" className="text-white font-medium">About</Link>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/login" className="min-h-11 px-1 flex items-center text-xs text-white/60 transition hover:text-white sm:px-0 sm:text-sm">Login</Link>
            <Link to="/register-business" className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
              Get started
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 border-t border-white/5 px-4 py-2 text-sm text-white/60 md:hidden">
          <Link to="/" className="min-h-10 flex items-center hover:text-white">Home</Link>
          <Link to="/about" className="min-h-10 flex items-center text-white">About</Link>
          <Link to="/contact" className="min-h-10 flex items-center hover:text-white">Contact</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
          <h1 className="mb-6 text-4xl font-bold tracking-tighter leading-[0.95] sm:text-5xl md:text-7xl">
            About <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">{settings.platform_name}</span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            A modern platform for managing online bookings – simple, fast, and free.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Our story</span>
            <h2 className="mt-4 mb-6 text-3xl font-bold tracking-tighter leading-tight sm:mb-8 sm:text-4xl md:text-5xl">
              From a small idea, <br />
              <span className="text-white/40">to a great platform.</span>
            </h2>

            <div className="space-y-5 text-base text-white/60 leading-relaxed sm:text-lg">
              <p>
                {settings.platform_name} starts with a simple idea: <strong className="text-white">to help small and average businesses</strong> receive bookings fast and clear with low cost.
              </p>
              <p>
                Many businesses in Kosovo and the region—barbershops, salons, restaurants, clinics—lose customers because they cannot manage bookings efficiently. Our platform solves this problem with a simple yet powerful system.
              </p>
              <p>
                Today, {settings.platform_name} offers a complete solution for any business looking to grow: management of companies, services, staff, and bookings—all in one place.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl transform scale-105" />
            <div className="relative grid grid-cols-2 gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:gap-8 sm:p-8 md:p-10">
              <div>
                <div className="text-4xl font-bold text-white mb-2 tracking-tight">100%</div>
                <div className="text-sm text-indigo-400 font-medium mb-1">Free forever</div>
                <div className="text-xs text-white/40">No hidden fees, no commissions.</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2 tracking-tight">24/7</div>
                <div className="text-sm text-purple-400 font-medium mb-1">Available</div>
                <div className="text-xs text-white/40">Book anytime, from anywhere.</div>
              </div>
              <div className="col-span-2 pt-8 border-t border-white/5">
                <div className="text-4xl font-bold text-white mb-2 tracking-tight">30s</div>
                <div className="text-sm text-fuchsia-400 font-medium mb-1">To book a service</div>
                <div className="text-xs text-white/40">The fastest booking experience on the market.</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 text-center sm:mb-14">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Our values</span>
            <h2 className="text-3xl font-bold tracking-tight mt-3">What makes us special</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Fast', desc: 'Book in seconds. No stress, no calls, just one click.' },
              { title: 'Safe', desc: 'Your data is protected and secure.' },
              { title: 'Free', desc: 'No upfront costs. No commission. Grow at no cost.' },
              { title: 'For people', desc: 'Made for small businesses and everyday workers.' },
            ].map((v, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/10 transition-all">
                <h3 className="font-semibold text-lg text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">In digits</h2>
          <p className="text-white/40 mt-2">A platform that grows everyday</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
          {[
            { value: '80+', label: 'Active companies' },
            { value: '5,000+', label: 'Bookings' },
            { value: '500+', label: 'Happy clients' },
            { value: '24/7', label: 'Support' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center sm:p-6">
              <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</div>
              <div className="text-xs text-white/40 mt-2 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Ready to <span className="text-indigo-400">start?</span>
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            Join hundreds of businesses that have simplified their bookings with {settings.platform_name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register-business" className="px-7 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Start for free
            </Link>
            <Link to="/contact" className="px-7 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-base">{settings.platform_name}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/40">
              <Link to="/" className="hover:text-white transition">Home</Link>
              <Link to="/about" className="hover:text-white transition">About</Link>
              <Link to="/contact" className="hover:text-white transition">Contact</Link>
              <Link to="/login" className="hover:text-white transition">Login</Link>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-xs text-white/30">
            © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}