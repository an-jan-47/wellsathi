import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, Loader2, Copy, Coffee } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { format, addDays } from 'date-fns';
import type { TimeSlot } from '@/types';

interface Props {
  clinicId: string;
  slots: TimeSlot[];
  selectedDate: string;
  onUpdate: () => void;
}

export function ClinicSlots({ clinicId, slots, selectedDate, onUpdate }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [form, setForm] = useState({ startTime: '09:00', endTime: '09:30' });
  const [bulkForm, setBulkForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    duration: 30,
    breakStart: '',
    breakEnd: '',
  });
  const [copyDates, setCopyDates] = useState<string[]>([]);

  const createSlot = async () => {
    if (!form.startTime || !form.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    setIsCreating(true);
    try {
      const overlap = slots.some(s =>
        (form.startTime >= s.start_time && form.startTime < s.end_time) ||
        (form.endTime > s.start_time && form.endTime <= s.end_time)
      );
      if (overlap) {
        toast.error('This slot overlaps with an existing slot');
        return;
      }

      const { error } = await supabase.from('time_slots').insert({
        clinic_id: clinicId,
        date: selectedDate,
        start_time: form.startTime,
        end_time: form.endTime,
        is_available: true,
      });
      if (error) throw error;
      toast.success('Slot created');
      setDialogOpen(false);
      onUpdate();
    } catch {
      toast.error('Failed to create slot');
    } finally {
      setIsCreating(false);
    }
  };

  const createBulkSlots = async () => {
    if (bulkForm.startTime >= bulkForm.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    // Validate break times if provided
    if (bulkForm.breakStart && bulkForm.breakEnd && bulkForm.breakStart >= bulkForm.breakEnd) {
      toast.error('Break end time must be after break start time');
      return;
    }
    setIsCreating(true);
    try {
      const slotsToCreate: { clinic_id: string; date: string; start_time: string; end_time: string; is_available: boolean }[] = [];
      let current = bulkForm.startTime;

      while (current < bulkForm.endTime) {
        const [h, m] = current.split(':').map(Number);
        const totalMin = h * 60 + m + bulkForm.duration;
        const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
        const endM = (totalMin % 60).toString().padStart(2, '0');
        const end = `${endH}:${endM}`;

        if (end > bulkForm.endTime) break;

        // Skip slots during break time
        const isInBreak = bulkForm.breakStart && bulkForm.breakEnd &&
          ((current >= bulkForm.breakStart && current < bulkForm.breakEnd) ||
           (end > bulkForm.breakStart && end <= bulkForm.breakEnd));

        if (!isInBreak) {
          const overlap = slots.some(s =>
            (current >= s.start_time && current < s.end_time) ||
            (end > s.start_time && end <= s.end_time)
          );
          if (!overlap) {
            slotsToCreate.push({
              clinic_id: clinicId,
              date: selectedDate,
              start_time: current,
              end_time: end,
              is_available: true,
            });
          }
        }
        current = end;
      }

      if (slotsToCreate.length === 0) {
        toast.error('No valid slots to create (all overlap or fall in break time)');
        return;
      }

      const { error } = await supabase.from('time_slots').insert(slotsToCreate);
      if (error) throw error;
      toast.success(`${slotsToCreate.length} slots created`);
      setDialogOpen(false);
      onUpdate();
    } catch {
      toast.error('Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  const copySlotsToDate = async () => {
    if (copyDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }
    if (slots.length === 0) {
      toast.error('No slots to copy from current date');
      return;
    }
    setIsCreating(true);
    try {
      const slotsToCreate = copyDates.flatMap(date =>
        slots.map(slot => ({
          clinic_id: clinicId,
          date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true,
        }))
      );

      const { error } = await supabase.from('time_slots').insert(slotsToCreate);
      if (error) throw error;
      toast.success(`Copied ${slots.length} slots to ${copyDates.length} date(s)`);
      setCopyDialogOpen(false);
      setCopyDates([]);
      onUpdate();
    } catch {
      toast.error('Failed to copy slots. Some dates may already have slots.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slotId);
      if (error) throw error;
      toast.success('Slot deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete slot');
    }
  };

  const available = slots.filter(s => s.is_available);
  const booked = slots.filter(s => !s.is_available);

  // Generate next 7 dates for copy feature (excluding current date)
  const copyDateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(selectedDate), i + 1);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d') };
  });

  const toggleCopyDate = (dateValue: string) => {
    setCopyDates(prev =>
      prev.includes(dateValue)
        ? prev.filter(d => d !== dateValue)
        : [...prev, dateValue]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {available.length} available</span>
            {' · '}
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {booked.length} booked</span>
          </p>
        </div>

        <div className="flex gap-2">
          {/* Copy Slots Dialog */}
          {slots.length > 0 && (
            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Dates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copy Slots to Other Dates</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy {slots.length} slot(s) from {format(new Date(selectedDate), 'MMM d')} to:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {copyDateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCopyDate(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        copyDates.includes(opt.value)
                          ? 'gradient-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={copySlotsToDate} disabled={isCreating || copyDates.length === 0}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : `Copy to ${copyDates.length} Date(s)`}
                </Button>
              </DialogContent>
            </Dialog>
          )}

          {/* Add Slots Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Slots
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Time Slots</DialogTitle>
              </DialogHeader>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={!bulkMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBulkMode(false)}
                >
                  Single Slot
                </Button>
                <Button
                  variant={bulkMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBulkMode(true)}
                >
                  Bulk Generate
                </Button>
              </div>

              {!bulkMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start</label>
                      <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End</label>
                      <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={createSlot} disabled={isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Slot'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Hour</label>
                      <Input type="time" value={bulkForm.startTime} onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Hour</label>
                      <Input type="time" value={bulkForm.endTime} onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Slot Duration (minutes)</label>
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      value={bulkForm.duration}
                      onChange={(e) => setBulkForm({ ...bulkForm, duration: parseInt(e.target.value) || 30 })}
                    />
                  </div>

                  {/* Break Time */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Break Time (Optional)</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Break Start</label>
                        <Input
                          type="time"
                          value={bulkForm.breakStart}
                          onChange={(e) => setBulkForm({ ...bulkForm, breakStart: e.target.value })}
                          placeholder="e.g. 13:00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Break End</label>
                        <Input
                          type="time"
                          value={bulkForm.breakEnd}
                          onChange={(e) => setBulkForm({ ...bulkForm, breakEnd: e.target.value })}
                          placeholder="e.g. 14:00"
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={createBulkSlots} disabled={isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Slots'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {slots.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No slots for this date</p>
            <p className="text-sm mt-1">Add slots so patients can book appointments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot) => (
            <Card
              key={slot.id}
              className={`transition-all ${
                !slot.is_available
                  ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20 hover:shadow-md'
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {slot.start_time.slice(0, 5)}
                  </span>
                  {slot.is_available ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSlot(slot.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  ) : (
                    <Badge variant="confirmed" className="text-[10px] px-1.5 py-0">Booked</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{slot.end_time.slice(0, 5)}</span>
                  <span className={`w-2 h-2 rounded-full ${slot.is_available ? 'bg-green-500' : 'bg-blue-500'}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
