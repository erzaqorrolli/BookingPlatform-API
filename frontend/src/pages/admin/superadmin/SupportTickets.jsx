import { useState, useEffect } from 'react';
import api from '../../../api/client';

export default function SupportTickets() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = () => {
        api.get('/support-tickets')
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
                is_admin_reply: 1
            });
            setReplyMessage('');
            openTicket(selectedTicket); 
        } catch (err) {
            alert('Failed to send reply');
        }
    };

    const changeStatus = async (status) => {
        try {
            await api.put(`/support-tickets/${selectedTicket.id}/status`, { status });
            openTicket(selectedTicket);
            loadTickets();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading tickets...</div>;

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="font-bold text-slate-900">Support Tickets</h2>
                    <p className="text-xs text-slate-500 mt-1">{tickets.length} tickets</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {tickets.length === 0 && <div className="p-4 text-sm text-slate-500 text-center">No tickets yet.</div>}
                    {tickets.map(t => (
                        <div
                            key={t.id}
                            onClick={() => openTicket(t)}
                            className={`p-4 border-b border-slate-100 cursor-pointer transition ${
                                selectedTicket?.id === t.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-white'
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
                            <div className="text-xs text-slate-500">{t.company_name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-50">
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900">{selectedTicket.subject}</h3>
                                <p className="text-xs text-slate-500">From: {selectedTicket.company_name} ({selectedTicket.user_name})</p>
                            </div>
                            <select
                                value={selectedTicket.status}
                                onChange={(e) => changeStatus(e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1 focus:border-indigo-500 outline-none"
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-xs font-semibold text-slate-500 mb-1">
                                    {selectedTicket.user_name} · {new Date(selectedTicket.created_at).toLocaleString()}
                                </div>
                                <p className="text-sm text-slate-800">{selectedTicket.message}</p>
                            </div>

                            {replies.map(r => (
                                <div key={r.id} className={`p-4 rounded-xl shadow-sm border ${
                                    r.is_admin_reply ? 'bg-indigo-50 border-indigo-100 ml-8' : 'bg-white border-slate-200 mr-8'
                                }`}>
                                    <div className="text-xs font-semibold text-slate-500 mb-1">
                                        {r.is_admin_reply ? 'Super Admin' : r.user_name} · {new Date(r.created_at).toLocaleString()}
                                    </div>
                                    <p className="text-sm text-slate-800">{r.message}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                                />
                                <button
                                    onClick={sendReply}
                                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Choose a ticket to show
                    </div>
                )}
            </div>
        </div>
    );
}