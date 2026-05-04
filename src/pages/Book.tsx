import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput, validatePhoneNumber } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { useBookAppointment } from '@/hooks/queries/useAppointments';
import { toast } from 'sonner';
import { format, parseISO, addDays, isToday as isTodayFn } from 'date-fns';
import {
  ArrowLeft, ArrowRight, Calendar, Clock, User, Phone, Mail,
  Loader2, IndianRupee, Stethoscope, Building2, Check, Edit2, CheckCircle2, Download, CheckCircle,
} from 'lucide-react';
import { z } from 'zod';
import { sortAlphaBy } from '@/lib/sortUtils';
import type { Doctor } from '@/types';
import { generateGoogleCalendarUrl, downloadICSFile, calculateDuration, formatDuration } from '@/lib/calendarUtils';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useSessionStorage } from '@/hooks/useSessionStorage';

/* ───────────── validation schemas ───────────── */
const patientSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().refine(validatePhoneNumber, 'Enter a valid phone number'),
  patientEmail: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  age: z.string().optional().refine((val) => !val || (parseInt(val) >= 0 && parseInt(val) <= 999), 'Age must be between 0 and 999'),
  gender: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/* ───────────── types ───────────── */
interface Service {
  id: string;
  service_name: string;
  fee: number;
}

type Step = 1 | 2;

const STEP_LABELS = ['Patient Details', 'Confirmation'] as const;

/* ═══════════════════════════════════════════════ */
export default function Book() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  /* ── data fetching ── */
  const { data: clinicData, isLoading } = useClinicProfile(clinicId);
  const clinic = clinicData?.clinic;
  const doctors = (clinicData?.doctors ?? []) as Doctor[];
  const services = clinicData?.services ?? [];

  const sortedDoctors = useMemo(() => sortAlphaBy(doctors, 'name'), [doctors]);
  const sortedServices = useMemo(() => sortAlphaBy(services, 'service_name') as Service[], [services]);

  /* ── step state ── */
  const [step, setStep] = useState<Step>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRefId, setBookingRefId] = useState('');

  /* ── step 1 selections ── */
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(searchParams.get('doctor') || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '');

  const { data: slots = [], refetch: refetchSlots } = useAllSlots(selectedDoctorId, selectedDate);
  const bookMutation = useBookAppointment();

  /* Skip Step 1 if coming from Clinic Profile with selections */
  useEffect(() => {
    const hasDoctor = searchParams.get('doctor');
    const hasDate = searchParams.get('date');
    const hasTime = searchParams.get('time');
    
    if (hasDoctor && hasDate && hasTime) {
      // All required params present, skip to patient details
      setStep(1); // Step 1 is now Patient Details
    }
  }, [searchParams]);

  /* default to first doctor if none selected and doctors are loaded */
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]);

  /* ── step 2 form ── */
  const [formData, setFormData, clearFormData] = useSessionStorage(`booking-form-${clinicId}`, {
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    age: '',
    gender: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldValidity, setFieldValidity] = useState<Record<string, boolean>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  /* prefill from profile */
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        patientName: prev.patientName || profile.name || '',
        patientPhone: prev.patientPhone || profile.phone || '',
      }));
    }
  }, [profile]);

  /* ── derived data ── */
  const selectedDoctor = sortedDoctors.find(d => d.id === selectedDoctorId);
  const selectedServices = sortedServices.filter(s => selectedServiceIds.includes(s.id));
  const baseFee = selectedDoctor && (selectedDoctor.fee ?? 0) > 0 ? selectedDoctor.fee! : (clinic?.fees ?? 0);
  const totalFee = baseFee + selectedServices.reduce((sum, s) => sum + s.fee, 0);
  
  // Calculate appointment duration
  const selectedSlot = slots.find(s => s.start_time === selectedTime);
  const appointmentDuration = selectedSlot ? calculateDuration(selectedSlot.start_time, selectedSlot.end_time) : 30;
  const durationDisplay = formatDuration(appointmentDuration);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return slots;
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return slots.filter(slot => slot.start_time > currentTimeStr);
  }, [slots, selectedDate]);



  /* ── handlers ── */
  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouchedFields({ ...touchedFields, [name]: true });
    
    // Real-time validation
    try {
      const fieldSchema = (patientSchema as any).shape[name];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors({ ...errors, [name]: '' });
        setFieldValidity({ ...fieldValidity, [name]: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ ...errors, [name]: error.errors[0]?.message || 'Invalid value' });
        setFieldValidity({ ...fieldValidity, [name]: false });
      }
    }
  };

  const canProceedStep1 = selectedTime && selectedDoctorId;

  const goToStep2 = () => {
    if (!canProceedStep1) {
      toast.error('Please select a date and time slot');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitBooking = () => {
    try {
      patientSchema.parse(formData);
      setErrors({});
      handleConfirm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form before confirming.');
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
      serviceIds: selectedServiceIds,
    }, {
      onSuccess: (appointmentId) => {
        setBookingRefId(appointmentId?.slice(0, 8).toUpperCase() || 'CONFIRMED');
        setIsSuccess(true);
        clearFormData(); // Clear session storage after successful booking
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        if (error.message.includes('no longer available')) {
          toast.error('This slot was just booked by someone else. Please choose another.');
          refetchSlots();
          setStep(1);
        } else {
          toast.error('Failed to book appointment. Please try again.');
        }
      },
    });
  };

  /* ── loading / not found ── */
  if (isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!clinic) {
    return (
      <Layout><div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Clinic not found</h2>
        <Button asChild><Link to="/search"><ArrowLeft className="h-4 w-4 mr-2" />Back to Search</Link></Button>
      </div></Layout>
    );
  }

  /* ── success screen ── */
  if (isSuccess) {
    // Prepare calendar event data
    const appointmentDate = parseISO(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(appointmentDate);
    startTime.setHours(hours, minutes, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + appointmentDuration);

    const calendarEvent = {
      title: `Appointment at ${clinic.name}`,
      description: `Doctor: ${selectedDoctor?.name || 'N/A'}\\nReference ID: ${bookingRefId}\\nTotal Fee: ₹${totalFee}\\n\\nNotes: ${formData.notes || 'None'}`,
      location: `${clinic.address}, ${clinic.city}`,
      startTime,
      endTime,
    };

    const handleAddToGoogleCalendar = () => {
      const url = generateGoogleCalendarUrl(calendarEvent);
      window.open(url, '_blank');
    };

    const handleDownloadICS = () => {
      downloadICSFile(calendarEvent, `appointment-${bookingRefId}.ics`);
    };

    return (
      <Layout>
        <div className="container py-20 max-w-lg mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-2">Your appointment has been successfully booked.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent mb-6">
            <span className="text-sm text-muted-foreground">Reference ID:</span>
            <span className="font-bold text-primary tracking-wider">{bookingRefId}</span>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Clinic</span><span className="font-medium">{clinic.name}</span></div>
            {selectedDoctor && <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium">{selectedDoctor.name}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(parseISO(selectedDate), 'MMM d, yyyy')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime.slice(0, 5)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{durationDisplay}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">₹{totalFee}</span></div>
          </div>
          
          {/* Calendar Integration Button */}
          <Button 
            onClick={handleAddToGoogleCalendar}
            variant="outline"
            className="w-full mb-6"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add to Google Calendar
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/user')}>My Appointments</Button>
            <Button className="flex-1" onClick={() => navigate('/', { replace: true })}>Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════ */
  return (
    <Layout>
      {/* Header */}
      <div className="gradient-hero py-4 md:py-6 border-b border-slate-100 dark:border-slate-800">
        <div className="container px-4">
          <Link 
            to={`/clinic/${clinicId}`} 
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-slate-800/60 hover:bg-slate-800/80 dark:bg-slate-700/60 dark:hover:bg-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold transition-all mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Link>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Book Appointment</h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1 font-medium">{clinic.name}</p>
        </div>
      </div>

      <div className="container pb-8 md:pb-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10">
          {/* ── Main content ── */}
          <div className="lg:col-span-7">
            {/* ═══ STEP 1: PATIENT INFO + SERVICES ═══ */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Enter patient details for this appointment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="patientName" className="text-sm font-medium text-foreground mb-2 block">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <Input 
                            id="patientName"
                            name="patientName" 
                            placeholder="Enter your name" 
                            value={formData.patientName} 
                            onChange={handleChange} 
                            className={`pl-11 ${touchedFields.patientName && fieldValidity.patientName ? 'border-green-500' : ''}`}
                            aria-required="true"
                            aria-invalid={errors.patientName && touchedFields.patientName ? 'true' : 'false'}
                            aria-describedby={errors.patientName && touchedFields.patientName ? 'patientName-error' : undefined}
                          />
                          {touchedFields.patientName && fieldValidity.patientName && (
                            <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" aria-label="Valid input" />
                          )}
                        </div>
                        {errors.patientName && touchedFields.patientName && <p id="patientName-error" className="text-sm text-destructive mt-1" role="alert">{errors.patientName}</p>}
                      </div>
                      <div>
                        <label htmlFor="patientPhone" className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
                        <div className="relative">
                          <PhoneInput
                            id="patientPhone"
                            value={formData.patientPhone}
                            onChange={(value) => {
                              setFormData({ ...formData, patientPhone: value });
                              setTouchedFields({ ...touchedFields, patientPhone: true });
                              // Validate phone
                              if (validatePhoneNumber(value)) {
                                setErrors({ ...errors, patientPhone: '' });
                                setFieldValidity({ ...fieldValidity, patientPhone: true });
                              } else {
                                setErrors({ ...errors, patientPhone: 'Enter a valid phone number' });
                                setFieldValidity({ ...fieldValidity, patientPhone: false });
                              }
                            }}
                            error={errors.patientPhone}
                            aria-required="true"
                            aria-invalid={errors.patientPhone ? 'true' : 'false'}
                            aria-describedby={errors.patientPhone ? 'patientPhone-error' : undefined}
                          />
                          {touchedFields.patientPhone && fieldValidity.patientPhone && (
                            <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" aria-label="Valid input" />
                          )}
                        </div>
                        {errors.patientPhone && <p id="patientPhone-error" className="text-sm text-destructive mt-1" role="alert">{errors.patientPhone}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="patientEmail" className="text-sm font-medium text-foreground mb-2 block">Email (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input 
                          id="patientEmail"
                          name="patientEmail" 
                          type="email"
                          placeholder="your@email.com" 
                          value={formData.patientEmail} 
                          onChange={handleChange} 
                          className={`pl-11 ${touchedFields.patientEmail && fieldValidity.patientEmail ? 'border-green-500' : ''}`}
                          aria-invalid={errors.patientEmail && touchedFields.patientEmail ? 'true' : 'false'}
                          aria-describedby={errors.patientEmail && touchedFields.patientEmail ? 'patientEmail-error' : undefined}
                        />
                        {touchedFields.patientEmail && fieldValidity.patientEmail && formData.patientEmail && (
                          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" aria-label="Valid input" />
                        )}
                      </div>
                      {errors.patientEmail && touchedFields.patientEmail && <p id="patientEmail-error" className="text-sm text-destructive mt-1" role="alert">{errors.patientEmail}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="age" className="text-sm font-medium text-foreground mb-2 block">Age (Optional)</label>
                        <Input 
                          id="age"
                          name="age" 
                          type="number" 
                          placeholder="Enter age" 
                          value={formData.age} 
                          onChange={handleChange}
                          maxLength={3}
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.value.length > 3) {
                              target.value = target.value.slice(0, 3);
                            }
                          }}
                          aria-invalid={errors.age && touchedFields.age ? 'true' : 'false'}
                          aria-describedby={errors.age && touchedFields.age ? 'age-error' : undefined}
                        />
                        {errors.age && touchedFields.age && <p id="age-error" className="text-sm text-destructive mt-1" role="alert">{errors.age}</p>}
                      </div>
                      <div>
                        <label htmlFor="gender" className="text-sm font-medium text-foreground mb-2 block">Gender (Optional)</label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => {
                            setFormData({ ...formData, gender: value });
                            setErrors({ ...errors, gender: '' });
                          }}
                        >
                          <SelectTrigger id="gender" className="w-full" aria-label="Select gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="notes" className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                      <Textarea 
                        id="notes"
                        name="notes" 
                        placeholder="Any specific concerns or symptoms..." 
                        value={formData.notes} 
                        onChange={handleChange} 
                        rows={3}
                        aria-label="Additional notes or concerns"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Extra Services Section - Now in Patient Details */}
                {sortedServices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Extra Services <span className="text-sm font-normal text-muted-foreground">(optional)</span></CardTitle>
                      <CardDescription>Add extra services to your appointment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2" role="group" aria-label="Extra services selection">
                        {sortedServices.map((service) => (
                          <label
                            key={service.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                              selectedServiceIds.includes(service.id) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedServiceIds.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                              aria-label={`${service.service_name} for ₹${service.fee}`}
                            />
                            <span className="flex-1 font-medium text-sm">{service.service_name}</span>
                            <span className="font-semibold text-primary text-sm" aria-label={`Price: ${service.fee} rupees`}>₹{service.fee}</span>
                          </label>
                        ))}
                      </div>
                      {selectedServices.length > 0 && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border" role="status" aria-live="polite">
                          <span className="text-sm text-muted-foreground">{selectedServices.length} service(s) selected</span>
                          <span className="font-bold text-primary">Total: ₹{selectedServices.reduce((s, svc) => s + svc.fee, 0)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Button
                  size="lg"
                  className="w-full shadow-lg shadow-primary/20"
                  disabled={
                    bookMutation.isPending || 
                    !formData.patientName.trim() || 
                    !formData.patientPhone.trim() ||
                    formData.patientPhone.replace(/\D/g, '').length < 7
                  }
                  onClick={submitBooking}
                  aria-label={bookMutation.isPending ? 'Booking in progress' : 'Confirm booking'}
                  aria-busy={bookMutation.isPending}
                >
                  {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Check className="h-4 w-4 mr-2" aria-hidden="true" />}
                  Confirm Booking
                </Button>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-5">
            <Card variant="elevated" className="lg:sticky lg:top-24 border-slate-200 dark:border-slate-800 shadow-lg lg:shadow-xl dark:shadow-none overflow-hidden rounded-2xl lg:rounded-[24px]">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg md:text-[20px] font-black text-slate-800 dark:text-white tracking-tight">Booking Summary</CardTitle>
              </div>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                
                {/* Appointment Info with Edit Icon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 dark:text-white text-sm md:text-[15px]">Appointment Details</p>
                    {step === 2 && (
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-7 md:h-8 px-2 md:px-3 rounded-lg text-primary hover:bg-primary/10 font-bold text-xs md:text-[13px]">
                        <Edit2 className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" /> Edit
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100 dark:border-slate-700 space-y-2.5 md:space-y-3">
                    {selectedDoctor && (
                      <div className="flex items-center gap-2.5 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <Stethoscope className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Doctor</p>
                          <p className="text-xs md:text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{selectedDoctor.name}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`grid grid-cols-2 gap-2.5 md:gap-3 ${selectedDoctor ? 'pt-2.5 md:pt-3 border-t border-slate-200 dark:border-slate-700/50' : ''}`}>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Date</p>
                          <p className="text-xs md:text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">{format(parseISO(selectedDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Time</p>
                          <p className="text-xs md:text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">{selectedTime ? selectedTime.slice(0, 5) : '—'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Duration Display */}
                    {selectedTime && (
                      <div className="pt-2.5 md:pt-3 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 md:gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 md:p-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Duration</p>
                            <p className="text-xs md:text-[14px] font-bold text-purple-700 dark:text-purple-300">{durationDisplay}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

                {/* Fees Breakdown */}
                <div className="space-y-3 md:space-y-4">
                  <p className="font-bold text-slate-800 dark:text-white text-sm md:text-[15px]">Fees Breakdown</p>
                  
                  <div className="space-y-2 md:space-y-2.5">
                    <div className="flex justify-between items-center text-xs md:text-[14px] p-2.5 md:p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Consultation Fee</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{baseFee}</span>
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] md:text-[12px] font-semibold text-slate-500 uppercase tracking-wider mt-2">Extra Services</p>
                        {selectedServices.map(s => (
                          <div key={s.id} className="flex justify-between items-center text-xs md:text-[14px] p-2.5 md:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate mr-2">{s.service_name}</span>
                            <span className="font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">₹{s.fee}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                    <span className="font-black text-slate-800 dark:text-white text-sm md:text-[15px]">Total Amount</span>
                    <span className="text-lg md:text-[22px] font-black text-primary">₹{totalFee}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-xl border-2 border-slate-100 dark:border-slate-800 p-3 md:p-4">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <IndianRupee className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-xs md:text-[14px]">Pay at Clinic</p>
                      <p className="text-[11px] md:text-[12px] font-medium text-slate-500">No advance payment required</p>
                    </div>
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-[4px] md:border-[5px] border-primary flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
