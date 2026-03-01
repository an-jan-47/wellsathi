import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { useBookAppointment } from '@/hooks/queries/useAppointments';
import { toast } from 'sonner';
import { format, parseISO, addDays, isToday as isTodayFn } from 'date-fns';
import { ArrowLeft, Calendar, Clock, User, Phone, MapPin, Loader2, IndianRupee, Stethoscope, CreditCard, Building2 } from 'lucide-react';
import { z } from 'zod';

const bookingSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().min(10, 'Please enter a valid phone number').max(15),
  notes: z.string().max(500).optional(),
});

export default function Book() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const { data: clinicData, isLoading } = useClinicProfile(clinicId);
  const clinic = clinicData?.clinic;
  const services = clinicData?.services ?? [];

  // Sort services alphabetically
  const sortedServices = useMemo(
    () => [...services].sort((a, b) => (a.service_name ?? '').localeCompare(b.service_name ?? '')),
    [services]
  );

  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const { data: slots = [], refetch: refetchSlots } = useAllSlots(clinicId, selectedDate);
  const bookMutation = useBookAppointment();

  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const selectedService = sortedServices.find(s => s.id === selectedServiceId);

  const [formData, setFormData] = useState({
    patientName: profile?.name || '',
    patientPhone: profile?.phone || '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form with profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        patientName: prev.patientName || profile.name || '',
        patientPhone: prev.patientPhone || profile.phone || '',
      }));
    }
  }, [profile]);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  // Filter out past slots for same-day bookings
  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return slots;

    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return slots.filter(slot => slot.start_time > currentTimeStr);
  }, [slots, selectedDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime || !clinicId) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      const validated = bookingSchema.parse(formData);

      bookMutation.mutate({
        clinicId,
        slotId: selectedSlotId,
        patientName: validated.patientName,
        patientPhone: validated.patientPhone,
        date: selectedDate,
        time: selectedTime,
        notes: validated.notes || null,
      }, {
        onSuccess: () => {
          toast.success('Appointment booked successfully!');
          // Redirect to home, replacing history so user can't navigate back
          navigate('/', { replace: true });
        },
        onError: (error) => {
          if (error.message.includes('no longer available')) {
            toast.error('This slot was just booked by someone else. Please choose another.');
            refetchSlots();
          } else {
            toast.error('Failed to book appointment. Please try again.');
          }
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

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

  // Dynamic price: use service fee if selected, otherwise clinic default
  const displayFee = selectedService?.fee ?? clinic.fees;

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <Link to={`/clinic/${clinicId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />Back to Clinic
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground mt-2">{clinic.name}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>Fill in your details to confirm the booking.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Service Selection */}
                  {sortedServices.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Select Service</label>
                      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a service (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{service.service_name}</span>
                                <span className="text-muted-foreground text-xs">₹{service.fee}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedService && (
                        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground bg-accent/50 rounded-lg px-3 py-2">
                          <Stethoscope className="h-4 w-4 text-primary flex-shrink-0" />
                          <span><strong>{selectedService.service_name}</strong> — ₹{selectedService.fee}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Date</label>
                    <div className="flex flex-wrap gap-2">
                      {dateOptions.map((option) => (
                        <button key={option.value} type="button"
                          onClick={() => { setSelectedDate(option.value); setSelectedTime(''); setSelectedSlotId(''); }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDate === option.value ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}>
                          {option.isToday ? 'Today' : option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Time</label>
                    {filteredSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {filteredSlots.map((slot) => (
                          <button key={slot.id} type="button"
                            disabled={!slot.is_available}
                            onClick={() => { if (slot.is_available) { setSelectedTime(slot.start_time); setSelectedSlotId(slot.id); } }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              !slot.is_available
                                ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed line-through'
                                : selectedTime === slot.start_time
                                  ? 'gradient-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}>
                            {slot.start_time.slice(0, 5)}
                            {!slot.is_available && <span className="block text-[10px] opacity-60">Booked</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center bg-muted/50 rounded-lg">No slots available for this date</p>
                    )}
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="patientName" placeholder="Enter your name" value={formData.patientName} onChange={handleChange} className="pl-11" />
                      </div>
                      {errors.patientName && <p className="text-sm text-destructive mt-1">{errors.patientName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="patientPhone" placeholder="Enter phone number" value={formData.patientPhone} onChange={handleChange} className="pl-11" />
                      </div>
                      {errors.patientPhone && <p className="text-sm text-destructive mt-1">{errors.patientPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                    <Textarea name="notes" placeholder="Any specific concerns..." value={formData.notes} onChange={handleChange} rows={3} />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={bookMutation.isPending || !selectedTime}>
                    {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card variant="elevated" className="sticky top-20">
              <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">{clinic.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{clinic.name}</p>
                    <p className="text-sm text-muted-foreground">{clinic.city}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  {selectedService && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium text-sm">{selectedService.service_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(parseISO(selectedDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime ? selectedTime.slice(0, 5) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-bold text-primary">₹{displayFee}</span>
                  </div>
                </div>

                {/* Payment Method Card */}
                <div className="border-t border-border pt-4">
                  <label className="text-sm font-medium text-foreground mb-3 block">Payment Method</label>
                  <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-4 cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">Pay at Clinic</p>
                        <p className="text-xs text-muted-foreground">Pay directly when you visit</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
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
