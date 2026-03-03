import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, Loader2, Copy, Coffee, Check, CalendarPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, addDays } from 'date-fns';
import type { TimeSlot } from '@/types';

interface Props {
  clinicId: string;
  slots: TimeSlot[];
  selectedDate: string;
  onUpdate: () => void;
}

export function ClinicSlots({ clinicId, slots, selectedDate, onUpdate }: Props) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(true); // default to bulk
  const [form, setForm] = useState({ startTime: '09:00', endTime: '09:30' });
  const [bulkForm, setBulkForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    duration: 30,
    breakStart: '',
    breakEnd: '',
  });

  // Also-create-for-dates: integrated into the Add Slots dialog
  const [alsoCreateForDates, setAlsoCreateForDates] = useState<string[]>([]);

  // Standalone copy dialog dates
  const [copyDates, setCopyDates] = useState<string[]>([]);

  // Generate next 7 dates starting from today, excluding the currently selected date
  const futureDateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: i === 0 ? 'Today' : format(date, 'EEE, MMM d') };
  }).filter(d => d.value !== selectedDate);

  const toggleDate = (dateValue: string, list: string[], setter: (v: string[]) => void) => {
    setter(
      list.includes(dateValue)
        ? list.filter(d => d !== dateValue)
        : [...list, dateValue]
    );
  };

  const selectAllDates = (list: string[], setter: (v: string[]) => void) => {
    if (list.length === futureDateOptions.length) {
      setter([]);
    } else {
      setter(futureDateOptions.map(d => d.value));
    }
  };

  /* ── Create single slot ── */
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

      // Create for selected date + any extra dates
      const datesToCreate = [selectedDate, ...alsoCreateForDates];
      const slotsToInsert = datesToCreate.map(date => ({
        clinic_id: clinicId,
        date,
        start_time: form.startTime,
        end_time: form.endTime,
        is_available: true,
      }));

      const { error } = await supabase.from('time_slots').insert(slotsToInsert);
      if (error) throw error;

      const extra = alsoCreateForDates.length;
      toast.success(extra > 0 ? `Slot created for ${datesToCreate.length} date(s)` : 'Slot created');
      setDialogOpen(false);
      setAlsoCreateForDates([]);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      onUpdate();
    } catch {
      toast.error('Failed to create slot');
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Bulk generate slots ── */
  const createBulkSlots = async () => {
    if (bulkForm.startTime >= bulkForm.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    if (bulkForm.breakStart && bulkForm.breakEnd && bulkForm.breakStart >= bulkForm.breakEnd) {
      toast.error('Break end time must be after break start time');
      return;
    }
    setIsCreating(true);
    try {
      // Generate slot templates (times only)
      const slotTemplates: { start: string; end: string }[] = [];
      let current = bulkForm.startTime;

      while (current < bulkForm.endTime) {
        const [h, m] = current.split(':').map(Number);
        const totalMin = h * 60 + m + bulkForm.duration;
        const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
        const endM = (totalMin % 60).toString().padStart(2, '0');
        const end = `${endH}:${endM}`;

        if (end > bulkForm.endTime) break;

        const isInBreak = bulkForm.breakStart && bulkForm.breakEnd &&
          ((current >= bulkForm.breakStart && current < bulkForm.breakEnd) ||
           (end > bulkForm.breakStart && end <= bulkForm.breakEnd));

        if (!isInBreak) {
          const overlap = slots.some(s =>
            (current >= s.start_time && current < s.end_time) ||
            (end > s.start_time && end <= s.end_time)
          );
          if (!overlap) {
            slotTemplates.push({ start: current, end });
          }
        }
        current = end;
      }

      if (slotTemplates.length === 0) {
        toast.error('No valid slots to create (all overlap or fall in break time)');
        return;
      }

      // Create for selected date + any extra dates
      const datesToCreate = [selectedDate, ...alsoCreateForDates];
      const slotsToCreate = datesToCreate.flatMap(date =>
        slotTemplates.map(t => ({
          clinic_id: clinicId,
          date,
          start_time: t.start,
          end_time: t.end,
          is_available: true,
        }))
      );

      const { error } = await supabase.from('time_slots').insert(slotsToCreate);
      if (error) throw error;

      const dateCount = datesToCreate.length;
      toast.success(
        dateCount > 1
          ? `${slotTemplates.length} slots created for ${dateCount} dates`
          : `${slotTemplates.length} slots created`
      );
      setDialogOpen(false);
      setAlsoCreateForDates([]);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      onUpdate();
    } catch {
      toast.error('Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Copy existing slots to other dates ── */
  const copySlotsToDate = async () => {
    if (copyDates.length === 0) {
      toast.error('Select at least one date');
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
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      onUpdate();
    } catch {
      toast.error('Failed to copy slots. Some dates may already have slots.');
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Delete slot ── */
  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slotId);
      if (error) throw error;
      toast.success('Slot deleted');
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      onUpdate();
    } catch {
      toast.error('Failed to delete slot');
    }
  };

  /* ── Delete all available slots for the day ── */
  const deleteAllSlots = async () => {
    const availableSlots = slots.filter(s => s.is_available);
    if (availableSlots.length === 0) {
      toast.error('No available slots to delete');
      return;
    }
    setIsCreating(true);
    try {
      const ids = availableSlots.map(s => s.id);
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .in('id', ids);
      if (error) throw error;
      toast.success(`Deleted ${availableSlots.length} slot(s)`);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      onUpdate();
    } catch {
      toast.error('Failed to delete slots');
    } finally {
      setIsCreating(false);
    }
  };

  const available = slots.filter(s => s.is_available);
  const booked = slots.filter(s => !s.is_available);

  /* ── Date picker chips (reusable) ── */
  const DateChips = ({
    selected,
    onToggle,
    onSelectAll,
  }: {
    selected: string[];
    onToggle: (v: string) => void;
    onSelectAll: () => void;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">Select dates</p>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-primary hover:underline"
        >
          {selected.length === futureDateOptions.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {futureDateOptions.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                isSelected
                  ? 'gradient-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

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

        <div className="flex gap-2 flex-wrap">
          {/* Delete All Slots */}
          {available.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all available slots?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete {available.length} available slot(s) for {format(new Date(selectedDate), 'MMM d, yyyy')}. Booked slots ({booked.length}) will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllSlots} className="bg-destructive text-destructive-foreground">
                    Yes, Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Copy Existing Slots Dialog */}
          {slots.length > 0 && (
            <Dialog open={copyDialogOpen} onOpenChange={(open) => { setCopyDialogOpen(open); if (!open) setCopyDates([]); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Dates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copy Today's Slots</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Copy all {slots.length} slot(s) from <strong>{format(new Date(selectedDate), 'EEE, MMM d')}</strong> to other dates:
                </p>
                <DateChips
                  selected={copyDates}
                  onToggle={(v) => toggleDate(v, copyDates, setCopyDates)}
                  onSelectAll={() => selectAllDates(copyDates, setCopyDates)}
                />
                <Button className="w-full mt-2" onClick={copySlotsToDate} disabled={isCreating || copyDates.length === 0}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy to {copyDates.length} Date{copyDates.length !== 1 ? 's' : ''}
                </Button>
              </DialogContent>
            </Dialog>
          )}

          {/* Add Slots Dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setAlsoCreateForDates([]); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Slots
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Time Slots</DialogTitle>
              </DialogHeader>

              {/* Mode Toggle */}
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
                /* ── Single Slot ── */
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

                  {/* Also create for other dates */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Also create for other dates <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
                    </div>
                    <DateChips
                      selected={alsoCreateForDates}
                      onToggle={(v) => toggleDate(v, alsoCreateForDates, setAlsoCreateForDates)}
                      onSelectAll={() => selectAllDates(alsoCreateForDates, setAlsoCreateForDates)}
                    />
                  </div>

                  <Button className="w-full" onClick={createSlot} disabled={isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Slot{alsoCreateForDates.length > 0 ? ` for ${1 + alsoCreateForDates.length} Dates` : ''}
                  </Button>
                </div>
              ) : (
                /* ── Bulk Generate ── */
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
                      <label className="text-sm font-medium">Break Time <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Break Start</label>
                        <Input
                          type="time"
                          value={bulkForm.breakStart}
                          onChange={(e) => setBulkForm({ ...bulkForm, breakStart: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Break End</label>
                        <Input
                          type="time"
                          value={bulkForm.breakEnd}
                          onChange={(e) => setBulkForm({ ...bulkForm, breakEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Also create for other dates */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Also create for other dates <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
                    </div>
                    <DateChips
                      selected={alsoCreateForDates}
                      onToggle={(v) => toggleDate(v, alsoCreateForDates, setAlsoCreateForDates)}
                      onSelectAll={() => selectAllDates(alsoCreateForDates, setAlsoCreateForDates)}
                    />
                  </div>

                  <Button className="w-full" onClick={createBulkSlots} disabled={isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Generate Slots{alsoCreateForDates.length > 0 ? ` for ${1 + alsoCreateForDates.length} Dates` : ''}
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
