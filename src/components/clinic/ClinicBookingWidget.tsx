import { Calendar, ChevronDown, Star, MapPin, Phone } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Doctor, Clinic, TimeSlot } from '@/types';
import { ClinicMap } from './ClinicMap';
import { calculateDuration, formatDuration } from '@/lib/calendarUtils';

interface DateOption {
  value: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}

interface Props {
  clinic: Clinic;
  doctors: Doctor[];
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlot: string;
  dateOptions: DateOption[];
  filteredSlots: TimeSlot[];
  onDoctorChange: (doctorId: string) => void;
  onDateChange: (date: string) => void;
  onSlotChange: (time: string) => void;
  onBooking: () => void;
  hasNoSlotsForDay?: boolean;
}

export function ClinicBookingWidget({
  clinic, doctors, selectedDoctorId, selectedDate, selectedSlot,
  dateOptions, filteredSlots,
  onDoctorChange, onDateChange, onSlotChange, onBooking, hasNoSlotsForDay
}: Props) {
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="w-full lg:w-[380px] shrink-0 space-y-4">
      <div className="lg:sticky lg:top-20">

        {/* ── Booking Engine ── */}
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-5">
            <div className="mb-5">
              <h3 className="text-[20px] md:text-[22px] font-black text-slate-900 mb-1 tracking-tight">Book Appointment</h3>
              <p className="text-[13px] text-slate-500 font-medium">Choose your doctor, date and time</p>
            </div>

            {/* Doctor Selector */}
            <div className="mb-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Service</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-primary/50 transition-colors rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none cursor-pointer">
                    <span className="truncate">
                      {doctors.length === 0
                        ? 'No doctors available'
                        : selectedDoctor
                        ? `Dr. ${selectedDoctor.name} (${selectedDoctor.specialization})`
                        : 'Select a Specialist'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl shadow-xl border-slate-100 p-1.5 max-h-[260px] overflow-y-auto custom-scrollbar"
                  align="start"
                >
                  {doctors.length === 0 && (
                    <div className="p-3 text-center text-sm font-medium text-slate-500">No doctors available</div>
                  )}
                  {doctors.map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      onClick={() => {
                        onDoctorChange(d.id);
                        onSlotChange('');
                      }}
                      className={`font-bold py-2.5 px-3 cursor-pointer rounded-lg mb-0.5 text-[13px] ${
                        selectedDoctorId === d.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-600 focus:bg-primary/5 focus:text-primary'
                      }`}
                    >
                      Dr. {d.name}{' '}
                      <span className="text-slate-400 ml-1 font-medium">({d.specialization})</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Selector */}
            <div className="mb-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preferred Date</label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar pt-[14px]">
                {dateOptions.slice(0, 7).map((option) => {
                  const isSelected = selectedDate === option.value;
                  // Calculate availability for the selected date
                  const availableCount = isSelected ? filteredSlots.filter(s => s.is_available).length : null;
                  
                  return (
                    <div key={option.value} className="flex flex-col items-center shrink-0 relative">
                      {/* Availability text above the card - absolute positioned */}
                      <div className={`absolute -top-[14px] left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                        availableCount !== null
                          ? availableCount === 0 
                            ? 'text-red-600 bg-red-50' 
                            : 'text-emerald-600 bg-emerald-50'
                          : 'invisible'
                      }`}>
                        {availableCount !== null && (
                          availableCount === 0 ? 'No slots' : `${availableCount} left`
                        )}
                      </div>
                      <button
                        onClick={() => {
                          onDateChange(option.value);
                          onSlotChange('');
                        }}
                        className={`flex flex-col items-center justify-center w-[56px] h-[66px] rounded-[14px] transition-all border-2 ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-primary/40'
                        }`}
                        style={{ minWidth: '56px', minHeight: '44px' }}
                      >
                        <span className={`text-[9px] font-extrabold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {option.dayName}
                        </span>
                        <span className="text-[18px] font-black leading-tight">{option.dayNum}</span>
                        <span className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                          {option.month}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="mb-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Available Slots</label>
              {filteredSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-0.5">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.start_time;
                    if (!slot.is_available) return null;
                    const duration = calculateDuration(slot.start_time, slot.end_time);
                    const durationText = formatDuration(duration);
                    
                    return (
                      <button
                        key={slot.start_time}
                        onClick={() => onSlotChange(slot.start_time)}
                        className={`py-2 px-2 min-h-[44px] rounded-xl text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        <span className="text-[12px]">
                          {slot.start_time.slice(0, 5)}{' '}
                          {parseInt(slot.start_time) >= 12 ? 'PM' : 'AM'}
                        </span>
                        <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {durationText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl py-6 text-center border border-slate-100">
                  <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <span className="text-[12px] font-bold text-slate-400">
                    {hasNoSlotsForDay ? 'Doctor not available today' : 'No slots available'}
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={onBooking}
              disabled={!selectedSlot}
              className={`w-full py-3.5 rounded-xl font-black text-[14px] transition-all flex items-center justify-center gap-2 ${
                selectedSlot
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {selectedSlot ? 'Continue' : 'Select a Time Slot'}
            </button>
          </div>

          {/* Bottom strip */}
          <div className="bg-slate-50 px-5 py-2.5 text-center border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-primary text-primary" /> Top-rated doctors on WellSathi
            </span>
          </div>
        </div>

        {/* ── Location Card ── Desktop only */}
        <div className="bg-white rounded-[20px] border border-slate-200/80 overflow-hidden mt-4 hidden lg:block">
          {/* Map */}
          <div className="aspect-[2/1] bg-slate-100 overflow-hidden">
            <ClinicMap clinics={[clinic]} />
          </div>

          {/* Location Info */}
          <div className="px-5 py-4 space-y-2.5">
            <h4 className="font-black text-slate-900 text-[15px]">Clinic Location</h4>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[13px] text-slate-600 font-medium leading-snug">
                {clinic.address}, {clinic.city}
              </p>
            </div>

            {clinic.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={`tel:${clinic.phone}`}
                  className="text-[13px] text-slate-600 font-bold hover:text-primary transition-colors"
                >
                  {clinic.phone}
                </a>
              </div>
            )}

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}, ${clinic.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-primary bg-primary/8 hover:bg-primary/15 font-bold text-[12px] py-2.5 rounded-xl transition-colors w-full mt-1"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
