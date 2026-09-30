import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/companies')
      .then((r) => setCompanies(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('activeCompanyId');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg">BookWise</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="text-slate-700 hover:text-indigo-600 font-medium">Home</Link>
            <Link to="/about" className="text-slate-700 hover:text-indigo-600 font-medium">About us</Link>
            <Link to="/contact" className="text-slate-700 hover:text-indigo-600 font-medium">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/admin"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-700 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  Login
                </Link>
                <Link
                  to="/register-business"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                  My business
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/90">The biggest platform for bookings in Kosovo</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Book services <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              online & free
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Choose company, service, and time – in just 30 seconds.
            No complications.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <a
              href="#companies"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-slate-100 transition shadow-lg"
            >
              Start booking
            </a>
            <Link
              to="/register-business"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition"
            >
              Register your business
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              100% Free
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              No register
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Fast confirmation
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: companies.length || '0', label: 'Partner companies' },
              { value: '24/7', label: 'Online booking' },
              { value: '30s', label: 'Average time' },
              { value: '100%', label: 'Free' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="companies" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            Our companies
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-3">
            Choose a company and book
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Verified businesses that recieve online bookings 24/7;
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No company</h3>
            <p className="text-sm text-slate-500 mb-6">
              Register your business and start to recieve bookings
            </p>
            <Link
              to="/register-business"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition"
            >
              Free register
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c) => (
              <Link
                key={c.id}
                to={`/book/${c.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-5">
                  {c.cover_url ? (
                    <img
                      src={c.cover_url}
                      alt={c.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-lg shadow-indigo-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg shadow-indigo-500/20">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 pt-1">
                    <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-indigo-600 transition">
                      {c.name}
                    </h3>
                    {c.address && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{c.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Click to book
                  </span>
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition">
                    <svg className="w-4 h-4 text-indigo-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              How it works
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Book in 3 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: '1',
                title: 'Choose company',
                desc: 'Choose the company you want',
                color: 'from-indigo-500 to-purple-600',
              },
              {
                n: '2',
                title: 'Choose serivce and time',
                desc: 'Choose service and time you want, regarding to your needs',
                color: 'from-purple-500 to-pink-600',
              },
              {
                n: '3',
                title: 'Confirm reservation',
                desc: 'Fill your information and accept a confirmation email in seconds',
                color: 'from-pink-500 to-rose-600',
              },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg`}>
                  {step.n}
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            Why BookWise
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            Your benefits
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              title: 'Fast',
              desc: 'Reserve your booking in seconds.',
              color: 'from-amber-500 to-orange-600',
            },
            {
              icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
              title: 'Safe',
              desc: '100% confidentialicy.',
              color: 'from-emerald-500 to-teal-600',
            },
            {
              icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
              title: 'Email notifications',
              desc: 'Confirmations and verifications in your email.',
              color: 'from-blue-500 to-indigo-600',
            },
            {
              icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
              title: 'Avalibility 24/7',
              desc: 'Book any time, any day.',
              color: 'from-purple-500 to-pink-600',
            },
            {
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              title: 'For every business',
              desc: 'Hair salon, restaurants, clinics – every business.',
              color: 'from-rose-500 to-red-600',
            },
            {
              icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
              title: 'Verified',
              desc: 'Only verified companies',
              color: 'from-cyan-500 to-blue-600',
            },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-300 transition">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl shadow-indigo-500/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Have a business? Start to recieve bookings today!
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Register for free and manage your bookings in a modern platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register-business"
              className="px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-slate-100 transition shadow-lg"
            >
              Register for free
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-white text-lg">BookWise</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Modern platform to book serivces for small and average businesses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Pages</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Business</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register-business" className="hover:text-white transition">Register</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-xs">
            © 2026 BookWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}