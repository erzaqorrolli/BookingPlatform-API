import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function MyTickets() {
    const { activeCompany } = useCompany();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyMessage, setReplyMessage] = useState('');
    
    // Gjendja për modalin e ri
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!activeCompany) return;
        loadTickets();
    }, [activeCompany]);

    const loadTickets = () => {
        api.get(`/support-tickets?company_id=${activeCompany.id}`)
            .then(res => setTickets(res.data.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const openTicket = (ticket) => {
        setSelectedTicket(ticket);
        api.get(`/support-tickets/${ticket.id}`)
            .then(res => {
                const data = res.data.data || res.data;
                setSelectedTicket(data.ticket);
                setReplies(data.replies || []);
            })
            .catch(err => console.error(err));
    };

    const sendReply = async () => {
        if (!replyMessage.trim()) return;
        try {
            await api.post(`/support-tickets/${selectedTicket.id}/reply`, {
                message: replyMessage,
                is_admin_reply: 0 // Kompania nuk është admin
            });
            setReplyMessage('');
            openTicket(selectedTicket);
        } catch (err) {
            alert('Failed to send reply');
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/support-tickets', {
                company_id: activeCompany.id,
                ...form
            });
            setIsModalOpen(false);
            setForm({ subject: '', message: '', priority: 'normal' });
            loadTickets();
        } catch (err) {
            alert('Failed to create ticket: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
                    <p className="text-sm text-slate-500 mt-1">View your tickets and platform replies.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    + New Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-900">Your Tickets</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {tickets.length === 0 && <div className="p-4 text-sm text-slate-500">No tickets yet.</div>}
                        {tickets.map(t => (
                            <div
                                key={t.id}
                                onClick={() => openTicket(t)}
                                className={`p-4 cursor-pointer transition ${
                                    selectedTicket?.id === t.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-slate-900 text-sm truncate pr-2">{t.subject}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                        t.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{t.status}</span>
                                </div>
                                <div className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col min-h-[500px]">
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h2 className="font-semibold text-slate-900">{selectedTicket.subject}</h2>
                                <p className="text-xs text-slate-500 mt-1">Status: {selectedTicket.status} · Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                                {/* Mesazhi origjinal i klientit - DJATHTAS */}
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] p-4 rounded-xl shadow-sm bg-indigo-600 text-white rounded-br-sm">
                                        <div className="text-[10px] font-semibold text-indigo-200 mb-1">
                                            You · {new Date(selectedTicket.created_at).toLocaleString()}
                                        </div>
                                        <p className="text-sm">{selectedTicket.message}</p>
                                    </div>
                                </div>

                                {/* Përgjigjet */}
                                {replies.map(r => {
                                    const isAdmin = Number(r.is_admin_reply) === 1;
                                    return (
                                        <div key={r.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                                                isAdmin 
                                                    ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm' 
                                                    : 'bg-indigo-600 text-white rounded-br-sm'
                                            }`}>
                                                <div className={`text-[10px] font-semibold mb-1 ${
                                                    isAdmin ? 'text-slate-500' : 'text-indigo-200'
                                                }`}>
                                                    {isAdmin ? 'Platform Support' : 'You'} · {new Date(r.created_at).toLocaleString()}
                                                </div>
                                                <p className="text-sm">{r.message}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                                    />
                                    <button onClick={sendReply} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                             Choose a ticket to view
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Open New Ticket</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input required type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Problem Description</label>
                                <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {submitting ? 'Saving...' : 'Open Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}