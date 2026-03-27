import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Grid } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (specialty) params.set('specialty', specialty);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Subtle radial background matching the design */}
      <div className="absolute inset-0 top-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-white to-white pointer-events-none"></div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-black uppercase tracking-widest mb-10 animate-fade-in hover:scale-105 transition-transform cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Trusted by 10,000+ patients
          </div>

          {/* Main Headline */}
          <h1 className="text-[46px] md:text-[64px] font-black tracking-tight text-slate-900 leading-[1.1] mb-6 animate-in slide-in-from-bottom-4 duration-700 ease-out">
            Your Health, <span className="text-primary">Our Priority</span>
          </h1>

          <p className="text-[17px] text-slate-500 font-medium max-w-xl mx-auto mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-150 fill-mode-both">
            Find and book appointments with the best clinics near you. 
            <br className="hidden sm:block" />Quick, easy, and hassle-free.
          </p>

          {/* Search Box */}
          <form 
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-center max-w-[700px] mx-auto bg-white rounded-full p-2 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-100 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both relative z-20 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] transition-shadow"
          >
            <div className="relative flex-1 w-full md:border-r border-slate-100 flex items-center pr-4">
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                 <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                placeholder="Enter your city..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none h-full py-4"
              />
            </div>
            <div className="relative flex-1 w-full flex items-center pr-4 border-t border-slate-100 md:border-t-0">
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                 <Grid className="h-5 w-5 text-slate-400" />
              </div>
              <input
                placeholder="Specialty (optional)"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none h-full py-4"
              />
            </div>
            <button type="submit" className="w-full md:w-auto mt-2 md:mt-0 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] rounded-full px-8 py-4 flex items-center justify-center gap-2 transition-colors active:scale-95">
              <Search className="h-4 w-4 stroke-[3]" />
              Search
            </button>
          </form>

          {/* Popular Links */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3 animate-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
            <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">Popular:</span>
            {['General Medicine', 'Dentist', 'Pediatrics', 'Cardiology'].map((spec, index) => (
              <button
                key={spec}
                onClick={() => navigate(`/search?specialty=${encodeURIComponent(spec)}`)}
                className="flex items-center gap-3"
              >
                <span className="text-[13px] font-bold text-slate-600 hover:text-primary transition-colors">
                  {spec}
                </span>
                {index < 3 && <span className="text-slate-300">•</span>}
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
