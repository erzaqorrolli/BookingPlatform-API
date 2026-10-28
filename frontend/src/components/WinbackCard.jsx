import { useState, useEffect } from 'react';
import api from '../api/client'; 

export default function WinbackCard({ companyId }) {
    const [loading, setLoading] = useState(false); 
    const [dormant, setDormant] = useState([]);
    const [result, setResult] = useState(null);
    const [showList, setShowList] = useState(false); 

    useEffect(() => {
        if (companyId) {
            fetchDormantClients();
        }
    }, [companyId]);

    const fetchDormantClients = async () => {
        try {
            const res = await api.get(`/companies/${companyId}/winback/preview`);
            setDormant(res.data.data || res.data);
        } catch (err) {
            alert('Error while getting clients');
        }
    };

    const handlePreviewClick = () => {
        setShowList(!showList); 
    };

    const handleSend = async () => {
        if (!window.confirm('Are you sure that you want to send email to sleeping clients?')) {
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/companies/${companyId}/winback/send`);
            setResult(res.data.data || res.data);
            setDormant([]); 
            setShowList(false); 
        } catch (err) {
            alert('Error while sending');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Clients comeback</h3>
                    <p className="text-sm text-gray-500">Send email with discounts to clients who had no appointments last 30 days.</p>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <button onClick={handlePreviewClick} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    {showList ? 'Hide list' : `See list (${dormant.length})`}
                </button>
                <button 
                    onClick={handleSend} 
                    disabled={loading || dormant.length === 0} 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                    {loading ? 'Sending...' : 'Send emails'}
                </button>
            </div>

            {showList && dormant.length > 0 && (
                <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg">
                    {dormant.map(c => (
                        <div key={c.id} className="p-2 border-b text-sm flex justify-between">
                            <span>{c.name}</span>
                            <span className="text-gray-400">{c.email}</span>
                        </div>
                    ))}
                </div>
            )}

            {result && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    Sent <b>{result.sent}</b> email from <b>{result.total}</b> sleeping clients.
                </div>
            )}
        </div>
    );
}