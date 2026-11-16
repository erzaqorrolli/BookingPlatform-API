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

            {companyId && <CampaignWizard companyId={companyId} />}
        </div>
    );
}

function CampaignWizard({ companyId }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [campaignData, setCampaignData] = useState({
        type: '',
        coupon: '',
        template: 'custom',
        customMessage: '',
        subject: '',
    });

    const campaignTypes = [
        { id: 'new_clients', title: 'New Clients', desc: 'Target clients who recently signed up.' },
        { id: 'existing_clients', title: 'Existing Clients', desc: 'Send offers to your loyal customers.' },
        { id: 'comeback', title: 'Clients Comeback', desc: 'Win back clients who haven\'t visited in a while.' },
    ];

    const coupons = [
        { id: '10_percent', label: '10% Off' },
        { id: '20_percent', label: '20% Off' },
        { id: 'free_service', label: 'Free Service' },
        { id: 'none', label: 'No Coupon' },
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

    const generateEmailContent = () => {
        const couponText = campaignData.coupon !== 'none' ? `<p>Use code: <strong>${campaignData.coupon}</strong></p>` : '';
        
        switch (campaignData.template) {
            case 'mothers_day':
                return {
                    subject: "Happy Mother's Day! Special Offer Inside 🌸",
                    body: `<h1>Happy Mother's Day!</h1><p>Treat yourself or your loved ones to something special.</p>${couponText}`
                };
            case 'christmas':
                return {
                    subject: "🎄 Christmas Sale - Special Offers Inside!",
                    body: `<h1>Merry Christmas!</h1><p>Celebrate the season with our exclusive holiday offers.</p>${couponText}`
                };
            case 'black_friday':
                return {
                    subject: "🖤 Black Friday Deals Are Here!",
                    body: `<h1>Black Friday Sale!</h1><p>Our biggest discounts of the year are live. Don't miss out!</p>${couponText}`
                };
            case 'valentines':
                return {
                    subject: "❤️ Valentine's Day Special Offer",
                    body: `<h1>Happy Valentine's Day!</h1><p>Share the love with a special treat for you and your partner.</p>${couponText}`
                };
            case 'easter':
                return {
                    subject: "🐣 Easter Sale - Hop into Savings!",
                    body: `<h1>Happy Easter!</h1><p>Celebrate with family and enjoy our special Easter discounts.</p>${couponText}`
                };
            default: // custom
                return {
                    subject: campaignData.subject,
                    body: campaignData.customMessage
                };
        }
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
                subject: emailContent.subject,
                body: emailContent.body
            });
            
            setResult(res.data.data || res.data);
            
            setStep(1);
            setCampaignData({ type: '', coupon: '', template: 'custom', customMessage: '', subject: '' });
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to send emails';
            alert(errorMsg);
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
                                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                                    campaignData.type === type.id 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
                            >
                                <h5 className="font-semibold text-slate-900 dark:text-white">{type.title}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{type.desc}</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Select an Offer (Coupon)</h4>
                        {coupons.map((coupon) => (
                            <button
                                key={coupon.id}
                                onClick={() => { setCampaignData({ ...campaignData, coupon: coupon.id }); handleNext(); }}
                                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                                    campaignData.coupon === coupon.id 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
                            >
                                {coupon.label}
                            </button>
                        ))}
                        <button onClick={handleBack} className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            ← Back
                        </button>
                    </div>
                )}

                {/* STEP 3: Template */}
                {step === 3 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Select a Template</h4>
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => { setCampaignData({ ...campaignData, template: template.id }); handleNext(); }}
                                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                                    campaignData.template === template.id 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
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

                {/* STEP 4: Review & Send */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Review & Send</h4>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Type:</strong> {campaignData.type}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Coupon:</strong> {campaignData.coupon || 'None'}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Template:</strong> {campaignData.template}</p>
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
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        ✅ Campaign sent! <b>{result.sent}</b> emails delivered out of <b>{result.total}</b> customers.
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
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