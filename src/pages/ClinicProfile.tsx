import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { MapPin, Phone, Star, IndianRupee, Loader2, ArrowLeft, Calendar, Stethoscope, Video, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Doctor } from '@/types';
import { format, addDays, isToday as isTodayFn, parseISO } from 'date-fns';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';

interface Service {
  id: string;
  service_name: string;
  fee: number;
}

export default function ClinicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const { data: profileData, isLoading } = useClinicProfile(id);
  const clinic = profileData?.clinic ?? null;
  const doctors = (profileData?.doctors ?? []) as Doctor[];

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const { data: allSlots = [] } = useAllSlots(selectedDoctorId, selectedDate);
  const services = profileData?.services ?? [];

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { 
       value: format(date, 'yyyy-MM-dd'), 
       dayName: format(date, 'EEE'), 
       dayNum: format(date, 'd'),
       month: format(date, 'MMM'),
       isToday: i === 0 
    };
  });

  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return allSlots;

    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return allSlots.filter(slot => slot.start_time > currentTimeStr);
  }, [allSlots, selectedDate]);

  const handleBooking = () => {
    const targetUrl = `/book/${clinic?.id}?doctor=${selectedDoctorId}&date=${selectedDate}${selectedSlot ? `&time=${selectedSlot}` : ''}`;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(targetUrl);
    }
  };

  if (isLoading) {
    return (
       <Layout>
         <div className="flex items-center justify-center min-h-[80vh] bg-[#fafafa]">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
         </div>
       </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
         <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#fafafa]">
            <h2 className="text-2xl font-black text-slate-800 mb-4">Clinic not found</h2>
            <Link to="/search" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90">
              Back to Directory
            </Link>
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#fafafa] font-sans">
        
        {/* Massive Edge-to-Edge Hero Banner */}
        <div className="w-full h-[350px] md:h-[450px] relative bg-slate-200">
          {clinic.images && clinic.images.length > 0 ? (
            <img src={clinic.images[0]} alt={clinic.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-slate-200 flex items-center justify-center">
              <span className="text-8xl font-black text-white/40">{clinic.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Top Gradient Overlay for Text Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          
          <div className="absolute top-6 left-6 md:left-12 z-10">
            <Link to="/search" className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all">
              <ArrowLeft className="h-4 w-4" /> Directory
            </Link>
          </div>

          <div className="absolute bottom-10 left-6 md:left-12 right-6 z-10">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1400px] mx-auto">
               <div>
                 <div className="flex items-center gap-3 mb-3">
                   {clinic.rating && clinic.rating > 0 && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-primary rounded-lg text-white font-black text-[13px] shadow-lg shadow-primary/50/20">
                       <Star className="h-3.5 w-3.5 fill-white" />
                       {Number(clinic.rating).toFixed(1)}
                     </div>
                   )}
                   <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white font-bold text-[12px] uppercase tracking-widest border border-white/20">
                     Verified Clinic
                   </span>
                 </div>
                 <h1 className="text-[36px] md:text-[54px] font-black text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                   {clinic.name}
                 </h1>
                 <div className="flex items-center gap-2 text-white/90 font-medium text-[16px] drop-shadow-md">
                   <MapPin className="h-4 w-4" />
                   {clinic.address}, {clinic.city}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* 2-Column Main Content */}
        <div className="container max-w-[1400px] py-10">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Column (Details) */}
            <div className="flex-1 min-w-0 space-y-12">
              
              {/* Internal Nav */}
              <div className="flex items-center gap-8 border-b border-slate-200 pb-4 overflow-x-auto no-scrollbar">
                <a href="#overview" className="text-primary font-black text-[15px] border-b-2 border-primary pb-4 -mb-[18px] whitespace-nowrap">Overview</a>
                <a href="#services" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Services</a>
                <a href="#doctors" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Doctors</a>
                <a href="#reviews" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Reviews</a>
              </div>

              {/* About */}
              <div id="overview" className="space-y-4">
                 <h2 className="text-[26px] font-black text-slate-900">About the Sanctuary</h2>
                 <p className="text-[16px] text-slate-600 font-medium leading-relaxed">
                   {clinic.description || `Welcome to ${clinic.name}. We are dedicated to providing the highest standard of personalized medical care. Our state-of-the-art facility is equipped with modern diagnostic and therapeutic technology to ensure you receive accurate and effective treatments.`}
                 </p>
              </div>

              {/* Virtual Care Support Card */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-[24px] p-8 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.05)] transition-shadow">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/50/30 shrink-0">
                       <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[19px] font-extrabold text-slate-900">24/7 Virtual Care Support</h3>
                      <p className="text-[14px] font-medium text-slate-900/70 mt-1 max-w-[300px]">
                        Connect with our medical staff instantly from the comfort of your home.
                      </p>
                    </div>
                 </div>
                 <button className="bg-white text-primary px-6 py-3.5 rounded-xl font-bold text-[14px] shrink-0 border border-primary/10 hover:bg-slate-50 transition-colors shadow-sm w-full md:w-auto">
                    Start Virtual Visit
                 </button>
              </div>

              {/* Specialties */}
              {clinic.specializations && clinic.specializations.length > 0 && (
                <div className="space-y-5">
                  <h3 className="text-[20px] font-black text-slate-900">Specialties</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {clinic.specializations.map((spec) => (
                      <span key={spec} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[14.5px] font-bold text-slate-700 shadow-sm hover:border-primary hover:text-primary transition-colors cursor-default">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors Array */}
              {doctors.length > 0 && (
                <div id="doctors" className="space-y-6">
                  <h2 className="text-[26px] font-black text-slate-900 flex items-center gap-3">
                    Our Doctors <span className="bg-slate-100 text-slate-500 text-[12px] px-3 py-1 rounded-full">{doctors.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="bg-white border border-slate-200 rounded-[24px] p-5 flex flex-col hover:shadow-lg transition-shadow group">
                         <div className="flex items-center gap-4 mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-inner">
                              <span className="text-[24px] font-black text-white">{doctor.name.charAt(0)}</span>
                            </div>
                            <div>
                               <h4 className="font-black text-[18px] text-slate-900 group-hover:text-primary transition-colors">{doctor.name}</h4>
                               <p className="text-[14px] font-bold text-slate-500">{doctor.specialization}</p>
                               {doctor.experience_years && (
                                 <p className="text-[12px] font-bold text-primary uppercase tracking-widest mt-1">
                                   {doctor.experience_years} YRS EXP
                                 </p>
                               )}
                            </div>
                         </div>
                         <div className="flex items-center gap-2 mt-auto">
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-[13px] border border-slate-200 transition-colors">
                                  Full Profile
                                </button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px] rounded-[24px] border-slate-100 p-0 overflow-hidden">
                                 <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-lg shadow-primary/50/20 mb-4">
                                       <span className="text-[36px] font-black text-primary">{doctor.name.charAt(0)}</span>
                                    </div>
                                    <DialogTitle className="text-[24px] font-black text-slate-900">{doctor.name}</DialogTitle>
                                    <DialogDescription className="text-[15px] font-bold text-slate-500 mt-1">{doctor.specialization}</DialogDescription>
                                 </div>
                                 <div className="p-6 bg-white space-y-4">
                                    {doctor.experience_years && (
                                       <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                          <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                                          <span className="text-[15px] font-extrabold text-slate-900">{doctor.experience_years} Years</span>
                                       </div>
                                    )}
                                    <div className="py-2">
                                       <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">About Doctor</span>
                                       <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                                         Dr. {doctor.name} is a highly experienced {doctor.specialization} specialist committed to providing exceptional care. 
                                         They have dedicated their career to advancing medical treatments and ensuring optimal patient outcomes.
                                       </p>
                                    </div>
                                    <button 
                                       onClick={() => {
                                         setSelectedDoctorId(doctor.id);
                                         document.querySelector('[data-state="open"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                         window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
                                       }}
                                       className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl text-[14px] transition-colors shadow-md mt-4"
                                    >
                                       Book Appointment with Dr. {doctor.name}
                                    </button>
                                 </div>
                              </DialogContent>
                            </Dialog>
                            <button 
                              onClick={() => {
                                setSelectedDoctorId(doctor.id);
                                window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' }); // Rough scroll to booking
                              }}
                              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-[13px] transition-colors shadow-sm shadow-primary/50/20"
                            >
                              Quick Book
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services List */}
              {services.length > 0 && (
                <div id="services" className="space-y-6">
                  <h2 className="text-[26px] font-black text-slate-900">Services & Pricing</h2>
                  <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
                    {services.map((svc: Service, i) => (
                      <div key={svc.id} className={`flex items-center justify-between p-5 ${i !== services.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
                        <div className="flex items-center gap-3">
                           <CheckCircle2 className="w-5 h-5 text-primary" />
                           <span className="font-bold text-[15px] text-slate-700">{svc.service_name}</span>
                        </div>
                        <span className="font-black text-[18px] text-primary">₹{svc.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div id="reviews" className="pt-8">
                 <h2 className="text-[26px] font-black text-slate-900 mb-6">Patient Feedback</h2>
                 <ClinicReviews clinicId={clinic.id} />
              </div>

            </div>

            {/* Right Column (Floating Reservation Widget) */}
            <div className="w-full lg:w-[420px] shrink-0 space-y-6">
               <div className="sticky top-24">
                  
                  {/* Map Location Card */}
                  <div className="bg-white rounded-[24px] border border-slate-200 p-2 mb-6 hidden lg:block">
                     <div className="aspect-[21/9] bg-slate-100 rounded-[16px] overflow-hidden relative mb-2">
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <MapPin className="w-8 h-8 text-primary fill-white drop-shadow-lg" />
                        </div>
                     </div>
                     <div className="px-4 pb-3 pt-2">
                       <h4 className="font-black text-slate-900 text-[15px] mb-1">Clinic Location</h4>
                       <p className="text-[13px] text-slate-500 font-medium mb-3">{clinic.address}</p>
                       <button className="w-full text-primary bg-primary/10 hover:bg-primary/20 font-bold text-[13px] py-2.5 rounded-xl transition-colors">
                         Get Directions
                       </button>
                     </div>
                  </div>

                  {/* Booking Engine Wrapper */}
                  <div className="bg-white rounded-[32px] border border-slate-100/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="p-7">
                       <h3 className="text-[22px] font-black text-slate-900 mb-1">Book an Appointment</h3>
                       <p className="text-[14px] text-slate-500 font-medium mb-8">Select your preferred date and time.</p>

                       {/* Doctor Selector */}
                       <div className="mb-8">
                          <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Specialist</label>
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <button className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-primary transition-colors rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 outline-none cursor-pointer">
                                  <span>
                                    {doctors.length === 0 ? 'No doctors available' : 
                                      (doctors.find(d => d.id === selectedDoctorId) 
                                        ? `Dr. ${doctors.find(d => d.id === selectedDoctorId)?.name} (${doctors.find(d => d.id === selectedDoctorId)?.specialization})`
                                        : 'Select a Specialist')}
                                  </span>
                                  <ChevronDown className="w-5 h-5 text-slate-400" />
                               </button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent className="w-[320px] sm:w-[360px] rounded-2xl shadow-xl border-slate-100 p-2 max-h-[300px] overflow-y-auto" align="start">
                                {doctors.length === 0 && <div className="p-4 text-center text-sm font-medium text-slate-500">No doctors available</div>}
                                {doctors.map(d => (
                                   <DropdownMenuItem 
                                      key={d.id} 
                                      onClick={() => {
                                         setSelectedDoctorId(d.id);
                                         setSelectedSlot(''); 
                                      }} 
                                      className={`font-bold py-3 px-4 cursor-pointer rounded-xl mb-1 ${selectedDoctorId === d.id ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}
                                   >
                                      Dr. {d.name} <span className="text-slate-400 ml-1 font-medium">({d.specialization})</span>
                                   </DropdownMenuItem>
                                ))}
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </div>

                       {/* Date Bubbles */}
                       <div className="mb-8">
                           <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Date</label>
                           <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 -mx-2 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
                               {dateOptions.map(option => {
                                  const isSelected = selectedDate === option.value;
                                  return (
                                     <button
                                        key={option.value}
                                        onClick={() => {
                                           setSelectedDate(option.value);
                                           setSelectedSlot(''); // Reset slot on date change
                                        }}
                                        className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[88px] rounded-[20px] transition-all border ${
                                           isSelected 
                                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/50/30 scale-105' 
                                              : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:bg-primary/5'
                                        }`}
                                     >
                                        <span className={`text-[12px] font-bold uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                          {option.dayName}
                                        </span>
                                        <span className="text-[22px] font-black leading-none">{option.dayNum}</span>
                                        <span className={`text-[11px] font-black uppercase mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                          {option.month}
                                        </span>
                                     </button>
                                  );
                               })}
                           </div>
                       </div>

                       {/* Time Slots */}
                       <div className="mb-8">
                          <div className="flex items-center justify-between mb-3">
                             <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Available Times</label>
                          </div>
                          {filteredSlots.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
                              {filteredSlots.slice(0, 6).map((slot) => {
                                const isSelected = selectedSlot === slot.start_time;
                                return (
                                  <button
                                    key={slot.id}
                                    disabled={!slot.is_available}
                                    onClick={() => setSelectedSlot(slot.start_time)}
                                    className={`py-3.5 rounded-xl text-[14px] font-bold border transition-all ${
                                      !slot.is_available 
                                         ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed hidden' // Hide booked slots, or show disabled
                                         : isSelected
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                                    }`}
                                  >
                                    {slot.start_time.slice(0, 5)} {parseInt(slot.start_time) >= 12 ? 'PM' : 'AM'}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                             <div className="bg-slate-50 rounded-2xl py-8 text-center border border-slate-100 flex flex-col items-center">
                               <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                               <span className="text-[14px] font-bold text-slate-500">No time slots available</span>
                             </div>
                          )}
                       </div>

                       <div className="space-y-3">
                          <button 
                             onClick={handleBooking}
                             className={`w-full py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 ${
                               selectedSlot 
                                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/50/25 active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                             }`}
                             disabled={!selectedSlot}
                          >
                             {selectedSlot ? 'Confirm Appointment' : 'Select a Time Slot'}
                          </button>
                          
                          {/* Optional "See all slots" button mimicking the UI  */}
                          {filteredSlots.length > 6 && (
                            <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-2xl text-[14px] transition-all active:scale-95">
                               View All Slots
                            </button>
                          )}
                       </div>

                    </div>
                    {/* Bottom strip */}
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                       <span className="text-[12px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
                         <Star className="w-3.5 h-3.5 fill-primary text-primary" /> Top-rated doctors on WellSathi
                       </span>
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
