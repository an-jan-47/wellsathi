import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import type { DoctorSchedule } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ClinicSlots({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Fetch Doctors
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['clinic-doctors', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Automatically select first doctor
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Fetch Schedules for selected doctor
  const { data: schedules = [], isLoading: loadingSchedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['doctor-schedules', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return [];
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', selectedDoctorId);
      if (error) throw error;
      return data as DoctorSchedule[];
    },
    enabled: !!selectedDoctorId,
  });

  // Local state to manage form
  const [formState, setFormState] = useState<Record<number, Partial<DoctorSchedule>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const newFormState: Record<number, Partial<DoctorSchedule>> = {};
    DAYS_OF_WEEK.forEach(day => {
      const existing = schedules.find(s => s.day_of_week === day.value);
      newFormState[day.value] = {
        is_working_day: existing?.is_working_day ?? false,
        start_time: existing?.start_time ? existing.start_time.slice(0, 5) : '09:00',
        end_time: existing?.end_time ? existing.end_time.slice(0, 5) : '17:00',
        slot_duration: existing?.slot_duration ?? 15,
      };
    });
    setFormState(newFormState);
  }, [schedules]);

  const updateDay = (day: number, field: keyof DoctorSchedule, value: string | number | boolean) => {
    setFormState(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!selectedDoctorId) return;
    setIsSaving(true);
    
    const payload = DAYS_OF_WEEK.map(day => {
      const d = formState[day.value];
      return {
        doctor_id: selectedDoctorId,
        clinic_id: clinicId,
        day_of_week: day.value,
        is_working_day: d.is_working_day,
        start_time: d.start_time,
        end_time: d.end_time,
        slot_duration: d.slot_duration,
      };
    });

    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .upsert(payload, { onConflict: 'doctor_id,day_of_week' });
      
      if (error) throw error;
      toast.success('Schedule saved successfully');
      refetchSchedules();
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    } catch (err: any) {
      toast.error('Failed to save schedule: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingDoctors) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  if (doctors.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Please add doctors first to manage their schedules.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Doctor Schedule</CardTitle>
              <CardDescription>Manage working days, hours, and slot duration</CardDescription>
            </div>
            <div className="w-full sm:w-[250px]">
              <Select value={selectedDoctorId || ''} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingSchedules ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : (
            <div className="space-y-6">
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-3">Day</div>
                <div className="col-span-2 text-center">Working?</div>
                <div className="col-span-3">Start Time</div>
                <div className="col-span-3">End Time</div>
                <div className="col-span-1 text-center">Mins</div>
              </div>

              <div className="space-y-4 md:space-y-2">
                {DAYS_OF_WEEK.map(day => {
                  const state = formState[day.value] || {};
                  const isWorking = state.is_working_day;
                  return (
                    <div key={day.value} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 md:p-2 rounded-lg border md:border-transparent transition-all ${isWorking ? 'bg-card' : 'bg-muted/30 opacity-75'}`}>
                      <div className="md:col-span-3 font-semibold flex justify-between items-center">
                        <span>{day.label}</span>
                        <div className="md:hidden">
                          <input 
                            type="checkbox"
                            className="w-5 h-5 rounded cursor-pointer accent-primary"
                            checked={isWorking}
                            onChange={(e) => updateDay(day.value, 'is_working_day', e.target.checked)}
                          />
                        </div>
                      </div>
                      <div className="hidden md:flex md:col-span-2 justify-center items-center">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded cursor-pointer accent-primary"
                          checked={isWorking}
                          onChange={(e) => updateDay(day.value, 'is_working_day', e.target.checked)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <div className="md:hidden text-xs text-muted-foreground mb-1">Start Time</div>
                        <Input 
                          type="time" 
                          value={state.start_time || ''} 
                          onChange={(e) => updateDay(day.value, 'start_time', e.target.value)}
                          disabled={!isWorking}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <div className="md:hidden text-xs text-muted-foreground mb-1">End Time</div>
                        <Input 
                          type="time" 
                          value={state.end_time || ''} 
                          onChange={(e) => updateDay(day.value, 'end_time', e.target.value)}
                          disabled={!isWorking}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <div className="md:hidden text-xs text-muted-foreground mb-1">Min/Slot</div>
                        <Input 
                          type="number" 
                          min={5}
                          step={5}
                          max={120}
                          value={state.slot_duration || ''} 
                          onChange={(e) => updateDay(day.value, 'slot_duration', Number(e.target.value))}
                          disabled={!isWorking}
                          className="text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-6 border-t flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Schedule
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
