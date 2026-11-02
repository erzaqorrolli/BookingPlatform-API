import { useState } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function SupportForm() {
    const { activeCompany } = useCompany();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeCompany) return;
        setLoading(true);
        try {
            await api.post('/support-tickets', {
                company_id: activeCompany.id,
                subject,
                message,
                priority
            });
            setSuccess(true);
            setSubject('');
            setMessage('');
        } catch (err) {
            alert('Failed to create ticket: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Support / Help</h1>
            <p className="text-sm text-slate-500 mb-6">Open a ticket to contact the platform.</p>

            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                    ✅ Ticket created successfully! Our team will contact you soon.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Problem Description</label>
                    <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Sending...' : 'Open Ticket'}
                </button>
            </form>
        </div>
    );
}