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
                                <div className="flex gap-1 items-center">
                                    {/* Badge për prioritetin */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                        t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                        t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        t.priority === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{t.priority}</span>
                                    
                                    {/* Badge për statusin */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                        t.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{t.status}</span>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900">{selectedTicket.subject}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                        selectedTicket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                        selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        selectedTicket.priority === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{selectedTicket.priority}</span>
                                </div>
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
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-xl shadow-sm bg-white border border-slate-200 text-slate-800 rounded-bl-sm">
                                    <div className="text-[10px] font-semibold text-slate-500 mb-1">
                                        {selectedTicket.user_name} ({selectedTicket.company_name}) · {new Date(selectedTicket.created_at).toLocaleString()}
                                    </div>
                                    <p className="text-sm">{selectedTicket.message}</p>
                                </div>
                            </div>

                            {replies.map(r => {
                                const isAdmin = Number(r.is_admin_reply) === 1;
                                return (
                                    <div key={r.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                                            isAdmin 
                                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                        }`}>
                                            <div className={`text-[10px] font-semibold mb-1 ${
                                                isAdmin ? 'text-indigo-200' : 'text-slate-500'
                                            }`}>
                                                {isAdmin ? 'You (Super Admin)' : `${r.user_name}`} · {new Date(r.created_at).toLocaleString()}
                                            </div>
                                            <p className="text-sm">{r.message}</p>
                                        </div>
                                    </div>
                                );
                            })}
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