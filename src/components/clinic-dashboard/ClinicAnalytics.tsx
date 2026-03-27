import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Users, Calendar, IndianRupee, Star, Activity, PieChart as PieIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

interface Props {
  clinicId: string;
  clinicFees: number;
  clinicRating: number | null;
}

interface DayData {
  date: string;
  label: string;
  count: number;
}

export function ClinicAnalytics({ clinicId, clinicFees, clinicRating }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [clinicId]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all appointments for this clinic
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('date, status')
        .eq('clinic_id', clinicId);
      if (error) throw error;

      const all = appointments || [];
      setTotalAppointments(all.length);
      setConfirmedCount(all.filter(a => a.status === 'confirmed').length);
      setCancelledCount(all.filter(a => a.status === 'cancelled').length);
      setPendingCount(all.filter(a => a.status === 'pending').length);

      // Last 14 days trend
      const days: DayData[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, 'yyyy-MM-dd');
        days.push({
          date: dateStr,
          label: format(d, 'MMM d'),
          count: all.filter(a => a.date === dateStr).length,
        });
      }
      setDailyData(days);

      // Review count
      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);
      setReviewCount(count || 0);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>;
  }

  const estimatedRevenue = confirmedCount * clinicFees;

  const statusData = [
    { name: 'Confirmed', value: confirmedCount, color: '#006b5f' }, // primary brand green
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },   // amber
    { name: 'Cancelled', value: cancelledCount, color: '#f43f5e' }, // rose/destructive
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 pl-1">
        <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Clinic Analytics</h2>
        <p className="text-slate-500 mt-2 font-medium text-[15px]">Monitor clinic performance, appointment trends, and revenue estimates.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Calendar className="h-6 w-6 text-slate-900" />} 
          label="Total Appointments" 
          value={totalAppointments} 
          bgClass="bg-[#f0fbf9]" 
          borderClass="border-[#006b5f]/10" 
        />
        <StatCard 
          icon={<IndianRupee className="h-6 w-6 text-primary" />} 
          label="Est. Revenue" 
          value={`₹${estimatedRevenue.toLocaleString()}`} 
          bgClass="bg-[#ebfcf9]" 
          borderClass="border-primary/20" 
        />
        <StatCard 
          icon={<Star className="h-6 w-6 text-amber-500 fill-amber-500" />} 
          label="Avg Rating" 
          value={clinicRating ? Number(clinicRating).toFixed(1) : 'N/A'} 
          bgClass="bg-[#fffbeb]" 
          borderClass="border-amber-500/20" 
        />
        <StatCard 
          icon={<Users className="h-6 w-6 text-blue-500" />} 
          label="Total Reviews" 
          value={reviewCount} 
          bgClass="bg-[#eff6ff]" 
          borderClass="border-blue-500/20" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#f8fbfa] flex items-center justify-center border border-slate-50">
               <Activity className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Daily Appointments</h3>
              <p className="text-[13px] text-slate-500 font-medium">Trends over the last 14 days</p>
            </div>
          </div>
          
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6}/>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 20px' }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 600, color: '#006b5f' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#006b5f" 
                  radius={[6, 6, 0, 0]} 
                  name="Appointments"
                  barSize={32}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#f8fbfa] flex items-center justify-center border border-slate-50">
               <PieIcon className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Status Breakdown</h3>
              <p className="text-[13px] text-slate-500 font-medium">All-time completion rates</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {statusData.length > 0 ? (
              <>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={statusData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" cy="50%" 
                        outerRadius={90} 
                        innerRadius={65} // Donut style
                        paddingAngle={4}
                        stroke="none"
                        animationDuration={1500}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="w-full mt-6 space-y-3 px-2">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                         <span className="text-[14px] font-bold text-slate-700">{d.name}</span>
                      </div>
                      <span className="text-[15px] font-black text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-50 space-y-3">
                 <PieIcon className="w-12 h-12 text-slate-300" strokeWidth={1} />
                 <p className="text-[14px] font-bold text-slate-400">No appointment data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgClass, borderClass }: { icon: React.ReactNode; label: string; value: string | number; bgClass: string; borderClass: string }) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border ${borderClass} ${bgClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{label}</h4>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[28px] font-black text-slate-900 leading-none">{value}</span>
      </div>
    </div>
  );
}
