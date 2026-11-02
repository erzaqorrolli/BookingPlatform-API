import { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import WinbackCard from '../../components/WinbackCard';
import api from '../../api/client';

export default function Marketing() {
    const { activeCompany } = useCompany();
    const companyId = activeCompany?.id;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your marketing campaigns and bring clients back.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Active Campaigns</p>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">1</h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Emails Sent (Total)</p>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">0</h2>
                </div>
            </div>

            <div className="w-full">
                {companyId ? (
                    <WinbackCard companyId={companyId} />
                ) : (
                    <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
                        Loading company...
                    </div>
                )}
            </div>

            {companyId && <TagEmailCampaign companyId={companyId} />}
        </div>
    );
}

function TagEmailCampaign({ companyId }) {
    const [tag, setTag] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSendClick = () => {
        if (!tag || !subject || !body) {
            alert('Please fill in all fields!');
            return;
        }
        setShowConfirmModal(true); 
    };

    const confirmSend = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post(`/companies/${companyId}/send-email-by-tag`, {
                tag, subject, body
            });
            setResult(res.data.data || res.data);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send emails');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Send email by Tag</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Send an email only to customers who have a specific tag (e.g., VIP, Influencer).
                </p>

                <div className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Tag (e.g., VIP)" 
                        value={tag} 
                        onChange={e => setTag(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input 
                        type="text" 
                        placeholder="Subject" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <textarea 
                        placeholder="Body" 
                        value={body} 
                        onChange={e => setBody(e.target.value)} 
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button 
                        onClick={handleSendClick} 
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Sending...' : 'Send Email'}
                    </button>
                </div>

                {result && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                        ✅ Sent <b>{result.sent}</b> emails out of <b>{result.total}</b> customers with tag "{tag}".
                    </div>
                )}
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-4">
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                            Confirm Send
                        </h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                            Are you sure you want to send an email to all customers with the tag <strong className="text-slate-900 dark:text-white">"{tag}"</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmSend}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}