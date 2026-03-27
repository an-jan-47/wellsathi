import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type { Clinic } from '@/types';

interface ClinicCardProps {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.03)] border border-slate-100/60 p-4 hover:shadow-[0_12px_40px_-5px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row gap-5">
        
        {/* Left Side: Image */}
        <div className="relative w-full sm:w-[260px] h-[180px] shrink-0 rounded-2xl overflow-hidden bg-slate-100">
          {clinic.images && clinic.images.length > 0 ? (
            <img
              src={clinic.images[0]}
              alt={clinic.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-slate-100 flex items-center justify-center">
              <span className="text-4xl font-black text-primary/30">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Top Rated</span>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col justify-between py-1">
          
          <div>
            {/* Title & Rating */}
            <div className="flex items-start justify-between gap-4 mb-1">
              <Link to={`/clinic/${clinic.id}`} className="focus-visible:outline-none">
                <h3 className="font-black text-[20px] text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {clinic.name}
                </h3>
              </Link>
              {clinic.rating && clinic.rating > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                  <Star className="h-3.5 w-3.5 fill-primary" />
                  <span className="text-[13px] font-black">{Number(clinic.rating).toFixed(1)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-400 shrink-0">
                  <span className="text-[13px] font-black">New</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-slate-500 mb-3">
              <MapPin className="h-4 w-4 shrink-0 stroke-[2.5]" />
              <span className="text-[13.5px] font-medium line-clamp-1">{clinic.address}, {clinic.city}</span>
            </div>

            {/* Specialties */}
            {clinic.specializations && clinic.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {clinic.specializations.slice(0, 3).map((spec) => (
                  <span key={spec} className="px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[12px] font-bold text-slate-600">
                    {spec}
                  </span>
                ))}
                {clinic.specializations.length > 3 && (
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[12px] font-bold text-slate-600">
                    +{clinic.specializations.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
            <div className="text-[13.5px] font-medium text-slate-500">
              Next available: <span className="text-primary font-bold">Today, 2:30 PM</span>
            </div>
            <Link 
              to={`/clinic/${clinic.id}`} 
              className="bg-primary hover:bg-primary/90 text-white font-bold text-[14px] px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
            >
              Book Visit
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
