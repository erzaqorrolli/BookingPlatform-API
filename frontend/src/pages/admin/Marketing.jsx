import { useState, useEffect } from 'react';
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

           

            {companyId && <CampaignWizard companyId={companyId} />}
        </div>
    );
}

function CampaignWizard({ companyId }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeDiscounts, setActiveDiscounts] = useState([]);
    const [showNewCodeForm, setShowNewCodeForm] = useState(false);

    const [campaignData, setCampaignData] = useState({
        type: '',
        coupon: '',
        template: 'custom',
        customMessage: '',
        subject: '',
    });

    const [newCodeData, setNewCodeData] = useState({
        code: '',
        amount: 10,
        usage_limit: 100,
        valid_from: '',
        valid_until: '',
    });

    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const res = await api.get(`/companies/${companyId}/discounts`);
                const discounts = res.data.data || res.data || [];
                setActiveDiscounts(discounts);
            } catch (err) {
                console.error("Failed to fetch discounts", err);
            }
        };
        if (companyId) fetchDiscounts();
    }, [companyId]);

    const campaignTypes = [
        { id: 'new_clients', title: 'New Clients', desc: 'Target clients who recently signed up.' },
        { id: 'existing_clients', title: 'Existing Clients', desc: 'Send offers to your loyal customers.' },
        { id: 'comeback', title: 'Clients Comeback', desc: 'Win back clients who haven\'t visited in a while.' },
    ];

    const templates = [
        { id: 'custom', label: 'Custom Template', desc: 'Write your own message.' },
        { id: 'mothers_day', label: "Mother's Day Offer", desc: 'Special discount for Mother\'s Day.' },
        { id: 'christmas', label: "Christmas Sale", desc: 'Festive offers for the holiday season.' },
        { id: 'black_friday', label: "Black Friday", desc: 'Biggest discounts of the year.' },
        { id: 'valentines', label: "Valentine's Day", desc: 'Special offers for you and your loved one.' },
        { id: 'easter', label: "Easter Sale", desc: 'Celebrate Easter with exclusive discounts.' },
    ];

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const handleSendClick = () => {
        if (campaignData.template === 'custom' && (!campaignData.subject || !campaignData.customMessage)) {
            alert('Please fill in subject and message for custom template!');
            return;
        }
        setShowConfirmModal(true);
    };

    const getFilteredDiscounts = () => {
        if (!campaignData.template || campaignData.template === 'custom') {
            return activeDiscounts;
        }

        const keywords = {
            christmas: ['christmas', 'xmas', 'holiday', 'noel', 'festive'],
            black_friday: ['black', 'friday', 'bf'],
            valentines: ['valentine', 'love', 'heart'],
            easter: ['easter', 'spring', 'egg'],
            mothers_day: ['mother', 'mom', 'mum'],
        };

        const templateKeywords = keywords[campaignData.template] || [];
        
        return activeDiscounts.filter(discount => 
            templateKeywords.some(keyword => 
                discount.code.toLowerCase().includes(keyword)
            )
        );
    };

    const generateNewCode = () => {
        const prefix = campaignData.template !== 'custom' 
            ? campaignData.template.substring(0, 3).toUpperCase() 
            : 'OFF';
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${random}`;
    };

    const generateEmailContent = () => {
        const codeToUse = campaignData.coupon;
        
        const couponText = codeToUse 
            ? `<div style="text-align: center; margin: 30px 0;">
                 <p style="font-size: 16px; color: #4b5563; margin-bottom: 10px;">Use this exclusive code at checkout:</p>
                 <span style="background-color: #f3f4f6; border: 2px dashed #6366f1; color: #4338ca; padding: 12px 24px; font-size: 20px; font-weight: bold; border-radius: 8px; letter-spacing: 1px; display: inline-block;">
                   ${codeToUse}
                 </span>
               </div>` 
            : '';

        const baseStyle = `font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #374151; line-height: 1.6;`;
        const containerStyle = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;
        const contentStyle = `padding: 40px 30px; text-align: center;`;
        const buttonStyle = `display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; margin-top: 30px; font-size: 16px;`;

        let title = '';
        let message = '';
        let headerColor = '#4f46e5';

        switch (campaignData.template) {
            case 'mothers_day':
                title = "Happy Mother's Day! 🌸";
                message = "Treat yourself or your loved ones to something special. We have prepared exclusive offers just for you.";
                headerColor = '#ec4899';
                break;
            case 'christmas':
                title = "🎄 Christmas Sale - Special Offers Inside!";
                message = "Celebrate the season with our exclusive holiday offers. Make this Christmas unforgettable!";
                headerColor = '#16a34a';
                break;
            case 'black_friday':
                title = "🖤 Black Friday Deals Are Here!";
                message = "Our biggest discounts of the year are live. Don't miss out on these incredible deals!";
                headerColor = '#111827';
                break;
            case 'valentines':
                title = "❤️ Valentine's Day Special Offer";
                message = "Share the love with a special treat for you and your partner. Exclusive offers await!";
                headerColor = '#e11d48';
                break;
            case 'easter':
                title = "🐣 Easter Sale - Hop into Savings!";
                message = "Celebrate with family and enjoy our special Easter discounts. Spring into savings!";
                headerColor = '#eab308';
                break;
            default:
                title = campaignData.subject;
                message = `<p style="white-space: pre-wrap;">${campaignData.customMessage}</p>`;
                break;
        }

        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="${baseStyle}">
                <div style="${containerStyle}">
                    <div style="background: ${headerColor}; padding: 40px 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: white;">${title}</h1>
                    </div>
                    <div style="${contentStyle}">
                        <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">${message}</p>
                        ${couponText}
                        <a href="http://localhost:5173" style="${buttonStyle}">Book Now</a>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} BookZen. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return { subject: title, body: htmlBody };
    };

    const confirmSend = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setResult(null);
        try {
            const emailContent = generateEmailContent();

            const res = await api.post(`/companies/send-email-by-type`, {
                company_id: companyId,
                type: campaignData.type,
                template: campaignData.template,
                coupon: campaignData.coupon,
                subject: emailContent.subject,
                body: emailContent.body,
                discount_amount: newCodeData.amount,
                usage_limit: newCodeData.usage_limit,
                valid_from: newCodeData.valid_from,
                valid_until: newCodeData.valid_until
            });
            
            setResult(res.data.data || res.data);
            
            setStep(1);
            setShowNewCodeForm(false);
            setNewCodeData({ code: '', amount: 10, usage_limit: 100, valid_from: '', valid_until: '' });
            setCampaignData({ type: '', coupon: '', template: 'custom', customMessage: '', subject: '' });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send emails');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Start a Campaign</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Follow the steps to create and send your email campaign.
                </p>

                <div className="flex items-center justify-between mb-6">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`flex-1 h-2 rounded-full mx-1 ${s <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Select Campaign Type</h4>
                        {campaignTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => { setCampaignData({ ...campaignData, type: type.id }); handleNext(); }}
                                className={`w-full p-4 text-left rounded-lg border-2 transition ${campaignData.type === type.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                                <h5 className="font-semibold text-slate-900 dark:text-white">{type.title}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{type.desc}</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Select a Template</h4>
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => { setCampaignData({ ...campaignData, template: template.id, coupon: '' }); setShowNewCodeForm(false); handleNext(); }}
                                className={`w-full p-4 text-left rounded-lg border-2 transition ${campaignData.template === template.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                                <h5 className="font-semibold text-slate-900 dark:text-white">{template.label}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{template.desc}</p>
                            </button>
                        ))}
                        <button onClick={handleBack} className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            ← Back
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Select a Discount Code</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Choose an existing code for <strong>{campaignData.template}</strong>, or generate a new one.
                            </p>
                            
                            {getFilteredDiscounts().length > 0 ? (
                                <div className="space-y-3">
                                    {getFilteredDiscounts().map((discount) => (
                                        <button
                                            key={discount.id || discount.code}
                                            onClick={() => { setCampaignData({ ...campaignData, coupon: discount.code }); handleNext(); }}
                                            className={`w-full p-4 text-left rounded-lg border-2 transition ${campaignData.coupon === discount.code ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <h5 className="font-mono font-bold text-slate-900 dark:text-white">{discount.code}</h5>
                                                <span className="text-sm font-semibold text-indigo-600">{discount.amount}% Off</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {discount.start_date} - {discount.end_date}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    No matching codes found for this template.
                                </div>
                            )}
                        </div>

                        {!showNewCodeForm ? (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Or generate a new code</h4>
                                <button 
                                    onClick={() => {
                                        const newCode = generateNewCode();
                                        setNewCodeData(prev => ({ ...prev, code: newCode }));
                                        setShowNewCodeForm(true);
                                    }} 
                                    className="w-full p-4 text-center rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 transition"
                                >
                                    ✨ Generate New Code Automatically
                                </button>
                            </div>
                        ) : (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Configure New Code</h4>
                                
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center mb-4">
                                    <span className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">{newCodeData.code}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Discount (%)</label>
                                        <input 
                                            type="number" 
                                            value={newCodeData.amount} 
                                            onChange={e => setNewCodeData({ ...newCodeData, amount: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            min="1" max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Usage Limit</label>
                                        <input 
                                            type="number" 
                                            value={newCodeData.usage_limit} 
                                            onChange={e => setNewCodeData({ ...newCodeData, usage_limit: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valid From</label>
                                        <input 
                                            type="date" 
                                            value={newCodeData.valid_from} 
                                            onChange={e => setNewCodeData({ ...newCodeData, valid_from: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valid Until</label>
                                        <input 
                                            type="date" 
                                            value={newCodeData.valid_until} 
                                            onChange={e => setNewCodeData({ ...newCodeData, valid_until: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowNewCodeForm(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setCampaignData({ ...campaignData, coupon: newCodeData.code });
                                            handleNext();
                                        }}
                                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                                    >
                                        Use This Code
                                    </button>
                                </div>
                            </div>
                        )}

                        <button onClick={() => { setCampaignData({ ...campaignData, coupon: '' }); setShowNewCodeForm(false); handleNext(); }} className="w-full p-4 text-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-300 mt-2">
                            Skip and send without a code
                        </button>

                        <button onClick={handleBack} className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            ← Back
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Review & Send</h4>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Type:</strong> {campaignData.type}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Template:</strong> {campaignData.template}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Discount Code:</strong> {campaignData.coupon || 'None'}</p>
                            {campaignData.coupon && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    <strong>Details:</strong> {newCodeData.amount}% Off, {newCodeData.usage_limit} uses, {newCodeData.valid_from} to {newCodeData.valid_until}
                                </p>
                            )}
                        </div>

                        {campaignData.template === 'custom' && (
                            <>
                                <input 
                                    type="text" 
                                    placeholder="Email Subject" 
                                    value={campaignData.subject} 
                                    onChange={e => setCampaignData({ ...campaignData, subject: e.target.value })} 
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <textarea 
                                    placeholder="Email Body" 
                                    value={campaignData.customMessage} 
                                    onChange={e => setCampaignData({ ...campaignData, customMessage: e.target.value })} 
                                    rows={5}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleBack} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                                Back
                            </button>
                            <button 
                                onClick={handleSendClick} 
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {loading ? 'Sending...' : 'Send Campaign'}
                            </button>
                        </div>
                    </div>
                )}

                {result && (
                    <div className={`mt-4 p-3 rounded-lg text-sm border ${
                        result.failed > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    }`}>
                        Campaign finished: <b>{result.sent}</b> emails sent, <b>{result.failed || 0}</b> failed, out of <b>{result.total}</b> eligible clients.
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
                            Are you sure you want to send this campaign to <strong className="text-slate-900 dark:text-white">{campaignData.type}</strong>?
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
// new clients are those who had their first appointment in last 30 days