import {useState} from 'react';
import api from '../api/client';

export default function ManualBookingModal({companyId,services,onClose,onSuccess}){
    const [form,setForm]=useState({

        name: '',
        email:'',
        phone:'',
        service_id:'',
        booking_date:'',
        start_time:'',
        notes:''
    });

    const [loading,setLoading]=useState(false);
    const[error,setError]=useState('');

    const handleSubmit=async(e)=>
    {
        e.preventDefault();
        setLoading(true);
        setError('');


        try{
await api.post(`/companies/${companyId}/bookings/manual`, form);            onSuccess();
            onClose();
        }catch(err){
            setError(err.response?.data?.error || 'Failed to create booking');

        }finally{
            setLoading(false);
        }
    };

    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add Manual Booking</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                
                {error && <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Client Name *</label>
                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Service *</label>
                        <select required value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select service</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} - €{s.price}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date *</label>
                            <input required type="date" value={form.booking_date} onChange={e => setForm({...form, booking_date: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Time *</label>
                            <input required type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" rows="2" />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}