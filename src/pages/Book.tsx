import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { useBookAppointment } from '@/hooks/queries/useAppointments';
import { toast } from 'sonner';
import { format, parseISO, addDays, isToday as isTodayFn } from 'date-fns';
import {
  ArrowLeft, Calendar, Clock, User, Phone, Mail,
  Loader2, Building2, Check, Edit2, CheckCircle2, Shield,
  Stethoscope, FileText, Lock,
} from 'lucide-react';
import { z } from 'zod';
import { sortAlphaBy } from '@/lib/sortUtils';
import type { Doctor } from '@/types';

/* ───────────── validation schema ───────────── */
const patientSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().regex(/^\+?[\d\s\-]{10,15}$/, 'Enter a valid phone number'),
  patientEmail: z.string().trim().email('Enter a valid email').or(z.literal('')),
  notes: z.string().max(500).optional(),
});

interface Service {
  id: string;
  service_name: string;
  fee: number;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: 'Clinic', sublabel: 'Choose Specialist' },
  { num: 2, label: 'Patient', sublabel: 'Patient Info' },
  { num: 3, label: 'Payment', sublabel: 'Confirm Booking' },
] as const;

/* ═══════════════════════════════════════════════ */
export default function Book() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const { data: clinicData, isLoading } = useClinicProfile(clinicId);
  const clinic = clinicData?.clinic;
  const doctors = (clinicData?.doctors ?? []) as Doctor[];
  const services = clinicData?.services ?? [];

  const sortedDoctors = useMemo(() => sortAlphaBy(doctors, 'name'), [doctors]);
  const sortedServices = useMemo(() => sortAlphaBy(services, 'service_name') as Service[], [services]);

  const [step, setStep] = useState<Step>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRefId, setBookingRefId] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(searchParams.get('doctor') || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '');

  const { data: slots = [], refetch: refetchSlots } = useAllSlots(selectedDoctorId, selectedDate);
  const bookMutation = useBookAppointment();

  const [formData, setFormData] = useState({ patientName: '', patientPhone: '', patientEmail: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        patientName: prev.patientName || profile.name || '',
        patientPhone: prev.patientPhone || profile.phone || '',
      }));
    }
  }, [profile]);

  const selectedDoctor = sortedDoctors.find(d => d.id === selectedDoctorId);
  const selectedService = sortedServices.find(s => s.id === selectedServiceId);
  const baseFee = selectedDoctor && (selectedDoctor.fee ?? 0) > 0 ? selectedDoctor.fee! : (clinic?.fees ?? 0);
  const totalFee = baseFee + (selectedService?.fee ?? 0);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd'),
      month: format(date, 'MMM'),
      isToday: i === 0,
    };
  });

  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return slots;
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return slots.filter(slot => slot.start_time > currentTimeStr);
  }, [slots, selectedDate]);

  useEffect(() => {
    if (sortedDoctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(sortedDoctors[0].id);
    }
  }, [sortedDoctors, selectedDoctorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const canProceedStep1 = selectedTime && selectedDoctorId;

  const goToStep2 = () => {
    if (!canProceedStep1) { toast.error('Please select a time slot'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep3 = () => {
    try {
      patientSchema.parse(formData);
      setErrors({});
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
        setErrors(fieldErrors);
      }
    }
  };

  const handleConfirm = () => {
    if (!clinicId || !selectedTime || !selectedDoctorId) return;
    bookMutation.mutate({
      clinicId,
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      date: selectedDate,
      time: selectedTime,
      notes: formData.notes || null,
      doctorId: selectedDoctorId,
      totalFee,
      serviceIds: selectedServiceId ? [selectedServiceId] : [],
      autoApprove: profile?.role === 'clinic',
    }, {
      onSuccess: (appointmentId) => {
        setBookingRefId(appointmentId?.slice(0, 8).toUpperCase() || 'CONFIRMED');
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        if (error.message.includes('no longer available')) {
          toast.error('Slot just booked by someone else. Please choose another.');
          refetchSlots();
          setStep(1);
        } else {
          toast.error('Failed to book appointment. Please try again.');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh] bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Clinic not found</h2>
          <Link to="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Link>
        </div>
      </Layout>
    );
  }

  /* ── Success Screen ── */
  if (isSuccess) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-10 max-w-md w-full text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-[28px] font-black text-slate-900 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-500 font-medium mb-6">Your appointment has been successfully booked.</p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-3">
              <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Reference</span><span className="font-black text-primary tracking-wider">{bookingRefId}</span></div>
              <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Clinic</span><span className="font-bold text-slate-700">{clinic.name}</span></div>
              {selectedDoctor && <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Doctor</span><span className="font-bold text-slate-700">{selectedDoctor.name}</span></div>}
              <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Date & Time</span><span className="font-bold text-slate-700">{format(parseISO(selectedDate), 'MMM d')} • {selectedTime.slice(0, 5)}</span></div>
              <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Total</span><span className="font-black text-primary text-[16px]">₹{totalFee}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/dashboard/user')} className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">My Appointments</button>
              <button onClick={() => navigate('/')} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md">Home</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Booking Summary sidebar data ── */
  const summaryRows = [
    { icon: Building2, label: 'CLINIC', value: clinic.name },
    ...(selectedDoctor ? [{ icon: Stethoscope, label: 'SPECIALIST', value: selectedDoctor.name }] : []),
    ...(selectedDate && selectedTime ? [{ icon: Calendar, label: 'DATE & TIME', value: `${format(parseISO(selectedDate), 'EEE, d MMM')} • ${selectedTime.slice(0, 5)}` }] : []),
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Step Progress Bar */}
        <div className="bg-white border-b border-slate-100 shadow-sm">
          <div className="container max-w-[1100px] py-5">
            <div className="flex items-center justify-between relative">
              {/* connector line */}
              <div className="absolute top-[18px] left-[10%] right-[10%] h-px bg-slate-200 z-0" />
              <div
                className="absolute top-[18px] left-[10%] h-[2px] bg-primary z-0 transition-all duration-500"
                style={{ width: step === 1 ? '0%' : step === 2 ? '40%' : '80%' }}
              />
              {STEPS.map((s) => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center z-10">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[15px] transition-all duration-300 border-2 ${isDone ? 'bg-primary border-primary text-white' : isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-white border-slate-200 text-slate-400'}`}>
                      {isDone ? <Check className="h-4 w-4" /> : s.num}
                    </div>
                    <span className={`text-[11px] font-extrabold uppercase tracking-widest mt-2 ${isActive ? 'text-primary' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</span>
                    <span className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{s.sublabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container max-w-[1100px] py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ─── MAIN CONTENT ─── */}
            <div className="flex-1 min-w-0">

              {/* ═══ STEP 1: APPOINTMENT SELECTION ═══ */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <Link to={`/clinic/${clinicId}`} className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-primary transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Back to Clinic
                    </Link>
                  </div>

                  {/* Doctor Selection */}
                  {sortedDoctors.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[20px] font-black text-slate-900">Available Specialists</h2>
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Filter ≡</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sortedDoctors.map(doctor => {
                          const isSelected = selectedDoctorId === doctor.id;
                          return (
                            <button
                              key={doctor.id}
                              onClick={() => { setSelectedDoctorId(doctor.id); setSelectedTime(''); }}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-100 hover:border-primary/40 bg-slate-50 hover:bg-white'}`}
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isSelected ? 'bg-primary' : 'bg-slate-200 group-hover:bg-primary/20'} transition-colors`}>
                                <span className={`text-[20px] font-black ${isSelected ? 'text-white' : 'text-slate-500'}`}>{doctor.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-extrabold text-[15px] truncate ${isSelected ? 'text-primary' : 'text-slate-900'}`}>{doctor.name}</p>
                                <p className="text-[13px] font-medium text-slate-500">{doctor.specialization}</p>
                                {(doctor.fee ?? 0) > 0 && <p className="text-[12px] font-black text-primary mt-1">₹{doctor.fee}</p>}
                              </div>
                              <div className={`shrink-0 min-w-[56px] px-2 h-8 rounded-lg flex items-center justify-center text-[12px] font-black border transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {isSelected ? '✓ Selected' : 'Select'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Service Selection */}
                  {sortedServices.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                      <h2 className="text-[20px] font-black text-slate-900 mb-5">Select Service</h2>
                      <div className="space-y-3">
                        {sortedServices.map(service => {
                          const isSelected = selectedServiceId === service.id;
                          return (
                            <button
                              key={service.id}
                              onClick={() => setSelectedServiceId(prev => prev === service.id ? '' : service.id)}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30 bg-slate-50'}`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-extrabold text-[15px] text-slate-900">{service.service_name}</p>
                                <p className="text-[12px] text-slate-400 font-medium mt-0.5">45 min • Quick review</p>
                              </div>
                              <span className="font-black text-[16px] text-primary shrink-0">₹{service.fee}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <h2 className="text-[20px] font-black text-slate-900 mb-5">Availability</h2>

                    {/* Date Bubbles */}
                    <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar mb-6">
                      {dateOptions.map(opt => {
                        const isSelected = selectedDate === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setSelectedDate(opt.value); setSelectedTime(''); }}
                            className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[82px] rounded-[20px] transition-all border-2 ${isSelected ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-primary/30 hover:bg-white'}`}
                          >
                            <span className={`text-[11px] font-extrabold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{opt.dayName}</span>
                            <span className="text-[22px] font-black leading-tight">{opt.dayNum}</span>
                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{opt.month}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Slots */}
                    {filteredSlots.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Available Slots</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                          {filteredSlots.map(slot => {
                            const isSelected = selectedTime === slot.start_time;
                            return (
                              <button
                                key={slot.id}
                                disabled={!slot.is_available}
                                onClick={() => { if (slot.is_available) setSelectedTime(slot.start_time); }}
                                className={`py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all ${!slot.is_available ? 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed' : isSelected ? 'bg-primary border-primary text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-primary/5'}`}
                              >
                                {slot.start_time.slice(0, 5)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl py-8 text-center border border-slate-100">
                        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] text-slate-400 font-bold">No slots available for this date</p>
                      </div>
                    )}
                  </div>

                  <button onClick={goToStep2} disabled={!canProceedStep1} className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 text-white font-black text-[16px] py-4 rounded-2xl transition-all shadow-xl shadow-primary/20">
                    Continue →
                  </button>
                </div>
              )}

              {/* ═══ STEP 2: PATIENT INFORMATION ═══ */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-[26px] font-black text-slate-900">Patient Information</h2>
                  <p className="text-slate-500 font-medium -mt-3">Please provide the details of the person attending the appointment.</p>

                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          name="patientName"
                          placeholder="Jonathan Doe"
                          value={formData.patientName}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium text-slate-800 outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      {errors.patientName && <p className="text-[12px] text-red-500 mt-1 font-bold">{errors.patientName}</p>}
                    </div>

                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            name="patientPhone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.patientPhone}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium text-slate-800 outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        {errors.patientPhone && <p className="text-[12px] text-red-500 mt-1 font-bold">{errors.patientPhone}</p>}
                      </div>
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            name="patientEmail"
                            placeholder="clinic@example.com"
                            value={formData.patientEmail}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium text-slate-800 outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Additional Notes <span className="text-slate-400 font-medium">(Optional)</span></label>
                      <textarea
                        name="notes"
                        rows={4}
                        placeholder="Any symptoms or specific requests for the clinic..."
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium text-slate-800 outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>

                    {/* Privacy notice */}
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/15 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                        Your information is handled securely and only shared with the selected clinic to facilitate your medical booking. <span className="text-primary font-bold cursor-pointer">Read our Privacy Policy.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors">
                      ← Back to Selection
                    </button>
                    <button onClick={goToStep3} className="flex-1 bg-primary hover:bg-primary/90 text-white font-black text-[15px] py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all">
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: CONFIRM / PAYMENT ═══ */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Consultation Summary */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <h2 className="text-[20px] font-black text-slate-900 mb-5">Consultation Summary</h2>
                    {selectedDoctor && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                          <span className="text-[22px] font-black text-white">{selectedDoctor.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-extrabold text-[16px] text-slate-900">{selectedDoctor.name}</h4>
                          <p className="text-[13px] font-medium text-slate-500">{selectedDoctor.specialization}</p>
                        </div>
                        {(selectedDoctor.experience_years ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full text-[12px] font-black text-amber-600">
                            ★ {selectedDoctor.experience_years}yrs
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[14px] font-medium text-slate-600 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-bold text-slate-800">{format(parseISO(selectedDate), 'EEE, d MMM')} • {selectedTime.slice(0, 5)}</span>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-[20px] font-black text-slate-900">Patient Details</h2>
                      <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-[14px]">
                      <div>
                        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Full Name</p>
                        <p className="font-bold text-slate-800">{formData.patientName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Age & Gender</p>
                        <p className="font-bold text-slate-800">—</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Contact</p>
                        <p className="font-bold text-slate-800">{formData.patientPhone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Email</p>
                        <p className="font-bold text-slate-800">{formData.patientEmail || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <h2 className="text-[20px] font-black text-slate-900 mb-5">Bill Details</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[14px]">
                        <span className="font-medium text-slate-500">Consultation Fee</span>
                        <span className="font-bold text-slate-800">₹{baseFee}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="font-medium text-slate-500">Service Fee</span>
                        <span className="font-bold text-slate-800">₹{selectedService?.fee ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="font-medium text-slate-500">Clinic Charges</span>
                        <span className="font-bold text-slate-800">₹0.00</span>
                      </div>
                      <div className="border-t border-slate-100 pt-3 flex justify-between text-[18px]">
                        <span className="font-extrabold text-slate-900">Total Payable</span>
                        <span className="font-black text-primary">₹{totalFee}.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Payment Method */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                    <h2 className="text-[20px] font-black text-slate-900 mb-5">Select Payment Method</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-[14px] text-slate-900">Pay at Clinic</p>
                          <p className="text-[12px] font-medium text-slate-400">Pay after your consultation</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 cursor-pointer opacity-60">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-[14px] text-slate-700">Online Payment</p>
                          <p className="text-[12px] font-medium text-slate-400">Secure fast checkout</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      </div>
                    </div>
                  </div>

                  {/* Security note */}
                  <div className="flex items-start gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/15">
                    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                      <strong className="text-slate-800">Secure & Confidential</strong> — Your medical history and personal details are encrypted and only accessible to your selected practitioner.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors">
                      ← Back
                    </button>
                    <button
                      disabled={bookMutation.isPending}
                      onClick={handleConfirm}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-70 text-white font-black text-[15px] py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      {bookMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── BOOKING SUMMARY SIDEBAR ─── */}
            <div className="w-full lg:w-[300px] shrink-0">
              <div className="sticky top-24">
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-primary/5 px-6 py-5 border-b border-primary/10">
                    <h3 className="text-[16px] font-black text-slate-900">Booking Summary</h3>
                  </div>
                  <div className="p-6 space-y-4">

                    {/* Clinic */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Clinic</p>
                        <p className="text-[13px] font-bold text-slate-800">{clinic.name}</p>
                        {clinic.city && <p className="text-[11px] text-slate-400 font-medium">{clinic.city}</p>}
                      </div>
                    </div>

                    {/* Doctor */}
                    {selectedDoctor && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Specialist</p>
                          <p className="text-[13px] font-bold text-slate-800">{selectedDoctor.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{selectedDoctor.specialization}</p>
                        </div>
                      </div>
                    )}

                    {/* Date & Time */}
                    {selectedDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                          <p className="text-[13px] font-bold text-slate-800">{format(parseISO(selectedDate), 'EEE, d MMM yyyy')}</p>
                          <p className="text-[11px] text-primary font-extrabold">{selectedTime ? selectedTime.slice(0, 5) : 'No slot selected'}</p>
                        </div>
                      </div>
                    )}

                    {/* Patient info (step 2+) */}
                    {step >= 2 && formData.patientName && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Patient</p>
                          <p className="text-[13px] font-bold text-slate-800">{formData.patientName}</p>
                          {formData.patientPhone && <p className="text-[11px] text-slate-400 font-medium">{formData.patientPhone}</p>}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500 font-medium">Consultation</span>
                        <span className="font-bold text-slate-700">₹{baseFee}</span>
                      </div>
                      {selectedService && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-slate-500 font-medium">{selectedService.service_name}</span>
                          <span className="font-bold text-slate-700">₹{selectedService.fee}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[13px] font-bold text-slate-500">Total Fee</span>
                        <span className="text-[22px] font-black text-primary">₹{totalFee}.00</span>
                      </div>
                    </div>

                    {step === 1 && (
                      <button onClick={goToStep2} disabled={!canProceedStep1} className="w-full bg-primary disabled:opacity-50 hover:bg-primary/90 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 text-[14px]">
                        Confirm Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
