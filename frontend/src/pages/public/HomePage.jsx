import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/companies')
      .then((r) => setCompanies(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => logout();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-indigo-500/30">
      
      {/* NAVBAR */}
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
            <Link to="/about" className="hover:text-white transition">About</Link>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/admin" className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="min-h-11 px-1 text-xs text-white/60 transition hover:text-white sm:px-0 sm:text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="min-h-11 px-1 flex items-center text-xs text-white/60 transition hover:text-white sm:px-0 sm:text-sm">
                  Login
                </Link>
                <Link to="/register-business" className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 border-t border-white/5 px-4 py-2 text-sm text-white/60 md:hidden">
          <Link to="/" className="min-h-10 flex items-center hover:text-white">Home</Link>
          <Link to="/about" className="min-h-10 flex items-center hover:text-white">About</Link>
          <Link to="/contact" className="min-h-10 flex items-center hover:text-white">Contact</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
            The biggest booking platform in Kosovo
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tighter leading-[0.95] sm:text-6xl md:mb-8 md:text-8xl">
            Book anything. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Anytime.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-12 leading-relaxed">
            The simplest way to book services online. No calls, no waiting — just pick a time and go.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#companies" className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Start booking
            </a>
            <Link to="/register-business" className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition backdrop-blur-sm">
              For businesses
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-16 text-xs text-white/40 uppercase tracking-wider">
            <span>100% Free</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>No registration</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Instant confirmation</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 divide-x divide-white/5 sm:px-6 md:grid-cols-4">
          {[
            { value: companies.length || '0', label: 'Companies' },
            { value: '24/7', label: 'Available' },
            { value: '30s', label: 'To book' },
            { value: '100%', label: 'Free' },
          ].map((stat, i) => (
            <div key={i} className="py-7 text-center sm:py-10">
              <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{stat.value}</div>
              <div className="text-xs text-white/40 mt-2 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPANIES */}
      <section id="companies" className="max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mb-10 sm:mb-14">
          <h2 className="text-3xl font-bold tracking-tighter mb-3 md:text-5xl">Companies</h2>
          <p className="text-white/40 text-lg">Verified businesses taking bookings online.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <h3 className="font-semibold text-lg mb-2">No companies yet</h3>
            <p className="text-white/40 mb-6 text-sm">Be the first to register your business.</p>
            <Link to="/register-business" className="inline-block px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition">
              Register business
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <Link
                key={c.id}
                to={`/book/${c.slug}`}
                className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {c.cover_url ? (
                    <img src={c.cover_url} alt={c.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate group-hover:text-indigo-300 transition">{c.name}</h3>
                    {c.address && (
                      <p className="text-xs text-white/40 truncate mt-0.5">{c.address}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-3">How it works</h2>
            <p className="text-white/40 text-lg">Three steps. That's it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { n: '01', title: 'Pick a company', desc: 'Browse verified businesses near you.' },
              { n: '02', title: 'Choose a time', desc: 'Select the service and time slot.' },
              { n: '03', title: 'Confirm', desc: 'Get instant confirmation via email.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-white/5 mb-4 tracking-tighter">{step.n}</div>
                <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mb-14">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-3">Why {settings.platform_name}</h2>
          <p className="text-white/40 text-lg">Built for speed, simplicity, and scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {[
            { title: 'Fast by default', desc: 'Book in under 30 seconds — no account needed.' },
            { title: 'Always secure', desc: 'Your data is encrypted end-to-end.' },
            { title: 'Email confirmations', desc: 'Instant confirmation and reminders in your inbox.' },
            { title: 'Available 24/7', desc: 'Book any time, any day, from any device.' },
            { title: 'For every business', desc: 'Salons, clinics, restaurants — all supported.' },
            { title: 'Verified partners', desc: 'Every company is manually verified.' },
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-white mb-1">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-28">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Ready to <span className="text-indigo-400">start?</span>
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto">
            Join hundreds of businesses already using {settings.platform_name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register-business" className="px-7 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Register business
            </Link>
            <Link to="/contact" className="px-7 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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