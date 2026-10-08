import {useState, useEffect} from 'react';
import api from '../../api/client';
import {useCompany} from '../../context/CompanyContext';


export default function StaffHolidays(){
const {activeCompany} = useCompany();
const [holidays, setHoliday]=useState([]);
const[loading, setLoading]= useState(true);
const[error,setError]=useState('');

useEffect(()=>{
    if(!activeCompany?.id) return;

    const loadHolidays = async () =>{
        setLoading(true);

        try{
            const r =await api.get('/me/holidays',{
                params: {company_id: activeCompany.id},
            });

            setHoliday(r.data.data || [] );
        }catch(err){
            console.error(err);
            setError(err.response?.data?.error || 'Failed to load holidays');

        }finally{
            setLoading(false);
        }
    };

    loadHolidays();
}, [activeCompany?.id]);

if(loading){
    return (
         <div className="p-12 text-center text-slate-500">
        Loading holidays...
      </div>
    );
}

if(error){
    return ( <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>);
}

if(!holidays.length){
      return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upcoming Holidays</h1>
          <p className="text-sm text-slate-500 mt-1">
            Public holidays for {activeCompany?.name}
          </p>
        </div>
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">🏖️</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No upcoming holidays
          </h3>
          <p className="text-sm text-slate-500">
            There are no holidays scheduled for the near future
          </p>
        </div>
      </div>
    );
}

return (

     <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upcoming Holidays</h1>
        <p className="text-sm text-slate-500 mt-1">
          {holidays.length} {holidays.length === 1 ? 'holiday' : 'holidays'} coming up for {activeCompany?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((h) => (
          <HolidayCard key={h.id} holiday={h} />
        ))}
      </div>
    </div>
  );


}

function HolidayCard({holiday}){
    const daysLeft = holiday.days_left;

    let colorClasses,badgeText,icon;
    if (daysLeft === 0) {
    colorClasses = 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50';
    badgeText = 'Today!';
    icon = '🎉';
  } else if (daysLeft === 1) {
    colorClasses = 'border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50';
    badgeText = 'Tomorrow';
    icon = '🎊';
  } else if (daysLeft <= 3) {
    colorClasses = 'border-orange-200 bg-gradient-to-br from-orange-50 to-white';
    badgeText = `${daysLeft} days left`;
    icon = '🎈';
  } else if (daysLeft <= 14) {
    colorClasses = 'border-amber-200 bg-gradient-to-br from-amber-50 to-white';
    badgeText = `${daysLeft} days left`;
    icon = '📅';
  } else if (daysLeft <= 30) {
    colorClasses = 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white';
    badgeText = `${daysLeft} days left`;
    icon = '🌴';
  } else {
    colorClasses = 'border-slate-200 bg-white';
    badgeText = `${daysLeft} days left`;
    icon = '🏖️';
  }

  const formattedDate = new Date(holiday.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`rounded-xl border-2 p-5 ${colorClasses} transition hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900">
            {holiday.name}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {formattedDate}
          </p>
          {holiday.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
              {holiday.description}
            </p>
          )}
          <div className="mt-3">
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                daysLeft === 0
                  ? 'bg-red-600 text-white animate-pulse'
                  : daysLeft <= 3
                  ? 'bg-orange-500 text-white'
                  : daysLeft <= 14
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {badgeText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

}