import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
            <Link to="/" className="text-slate-700 hover:text-indigo-600 font-medium">Home </Link>
            <Link to="/about" className="text-indigo-600 font-medium">About Us</Link>
            <Link to="/contact" className="text-slate-700 hover:text-indigo-600 font-medium">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              My business
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About BookWise
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            A modern platform for managing online bookings – simple,
            fast, and free.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            Our story
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            From a small idea, to a great platform!
          </h2>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
          <p>
            BookWise starts with a simple idea: <strong>to help small and average busnesses</strong> to recieve bookings fast and clear
            with low cost
          </p>
          <p>
            Many businesses in Kosovo and the region—barbershops, 
            salons, restaurants, clinics—lose customers because they cannot manage bookings efficiently.
             Our platform solves this problem with a simple yet powerful system.
          </p>
          <p>
            Today, BookingPlatform offers a complete solution for any business looking
             to grow: management of companies, services, staff, and bookings—all
             in one place.
          </p>
        </div>
      </section>

      {/* Vlerat */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              Our values
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              What makes us special
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Fast</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Book in seconds. No stress, no calls, just one click.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Safe</h3>
              <p className="text-sm text-slate-500 leading-relaxed">

                Your data protected.              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
              No upfront costs. No commission. Grow your business at no cost.              </p>
            </div>

            <div className="text-center p-6 rounded-xl hover:bg-slate-50 transition">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">For people</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Made for small businesses. For people who work everyday!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistika */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 md:p-14 text-white">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">In digits</h2>
            <p className="text-white/80">A platform that grows everyday</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-1">80+</div>
              <div className="text-sm text-white/70">Active companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-1">5,000+</div>
              <div className="text-sm text-white/70">Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-1">500+</div>
              <div className="text-sm text-white/70">Happy clients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-1">24/7</div>
              <div className="text-sm text-white/70">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Ready to start?
        </h2>
        <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
          Join hundreds of businesses that have simplified their bookings with BookingPlatform.        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Start for free
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
          >
            Contact us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          © 2026 BookWise. All rights reserved.
        </div>
      </footer>
    </div>
  );
}