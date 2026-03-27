import { Calendar, Clock, CalendarDays, Wallet } from 'lucide-react';

interface ClinicOverviewStatsProps {
  todaysCount: number;
  pendingCount: number;
  upcomingCount: number;
  fees: number | string;
}

export function ClinicOverviewStats({
  todaysCount,
  pendingCount,
  upcomingCount,
  fees
}: ClinicOverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 w-full">
      {/* KPI Card 1 - Today */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3.5 bg-[#e5fcf8] text-[#00bda6] rounded-xl">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#00bda6] bg-[#e5fcf8] px-2.5 py-1 rounded-md tracking-wider">+0%</span>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-1.5 line-clamp-1">Today's Appointments</p>
        <h3 className="text-[32px] sm:text-4xl font-black text-slate-900 leading-none">{todaysCount}</h3>
      </div>

      {/* KPI Card 2 - Pending */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3.5 bg-[#fff8e9] text-[#fbbf24] rounded-xl">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#fbbf24] bg-[#fff8e9] px-2.5 py-1 rounded-md tracking-wider uppercase">Pending</span>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-1.5 line-clamp-1">Pending Approval</p>
        <h3 className="text-[32px] sm:text-4xl font-black text-slate-900 leading-none">{pendingCount}</h3>
      </div>

      {/* KPI Card 3 - Upcoming */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3.5 bg-[#f0f6ff] text-[#3b82f6] rounded-xl">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#3b82f6] bg-[#f0f6ff] px-2.5 py-1 rounded-md tracking-wider uppercase">Scheduled</span>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-1.5 line-clamp-1">Upcoming Total</p>
        <h3 className="text-[32px] sm:text-4xl font-black text-slate-900 leading-none">{upcomingCount}</h3>
      </div>

      {/* KPI Card 4 - Fee */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3.5 bg-[#ebfef5] text-[#10b981] rounded-xl">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#10b981] bg-[#ebfef5] px-2.5 py-1 rounded-md tracking-wider uppercase">Fixed</span>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-1.5 line-clamp-1">Consultation Fee</p>
        <h3 className="text-[32px] sm:text-4xl font-black text-slate-900 leading-none tracking-tight">₹{fees}</h3>
      </div>
    </div>
  );
}
