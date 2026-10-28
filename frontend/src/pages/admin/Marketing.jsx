import { useCompany } from '../../contexts/CompanyContext';
import WinbackCard from '../../components/WinbackCard';

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
        </div>
    );
}