import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useSettings } from '../../contexts/SettingsContext';

export default function Contact() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error while sending:', error);
      alert('Message was not sent. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Link to="/contact" className="text-white font-medium">Contact</Link>
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
          <Link to="/about" className="min-h-10 flex items-center hover:text-white">About</Link>
          <Link to="/contact" className="min-h-10 flex items-center text-white">Contact</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-16 lg:pt-32">
          <h1 className="mb-6 text-4xl font-bold tracking-tighter leading-[0.95] sm:text-5xl md:text-7xl">
            Get in <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">touch</span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Questions? Send us a message and we will answer within 24 hours.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Let's have a chat</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Fill out the form or contact us through the platforms below.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.05] hover:border-white/10 transition">
              <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Email</div>
                <a href={`mailto:${settings.support_email || 'info@bookwise.com'}`} className="text-sm font-medium text-white hover:text-indigo-400 transition">
                  {settings.support_email || 'info@bookwise.com'}
                </a>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.05] hover:border-white/10 transition">
              <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Phone</div>
                <a href="tel:+38344123456" className="text-sm font-medium text-white hover:text-emerald-400 transition">
                  +383 44 000 000
                </a>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.05] hover:border-white/10 transition">
              <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Office Address</div>
                <div className="text-sm font-medium text-white">Rr. Nëna Terezë 45, Prishtinë</div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.05] hover:border-white/10 transition">
              <div className="w-11 h-11 bg-pink-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Schedule</div>
                <div className="text-sm text-white/60">
                  <div>Mon - Fri: 09:00 - 18:00</div>
                  <div>Sat: 09:00 - 14:00</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Thank you</h2>
                <p className="text-white/50 max-w-sm mb-6 text-sm">
                  Your message was sent successfully. We'll answer back within 24 hours.
                </p>
                <button 
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6 md:p-8">
                <div>
                  <h3 className="text-lg font-bold tracking-tight mb-1">Send a message</h3>
                  <p className="text-sm text-white/40">Fill out the fields *</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Bob Brown"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="name@company.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none resize-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition disabled:opacity-60 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-bold tracking-tight mt-3">Common questions</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Is the platform free?', a: 'Yes, the platform is entirely free. No commission, no monthly costs. You can register and start receiving bookings immediately.' },
              { q: 'How can I register my business?', a: 'Click "Get started" in the top right, fill out the register form, verify your email, and create your first company.' },
              { q: 'Can I manage more than 1 company?', a: 'Yes. One account can manage multiple companies at the same time.' },
              { q: 'How do I receive notifications for my bookings?', a: 'For every booking, you and your client receive email notifications.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.05] transition">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-medium text-white pr-4">{faq.q}</span>
                  <svg className="w-5 h-5 text-white/40 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-white/50 leading-relaxed">{faq.a}</div>
              </details>
            ))}
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