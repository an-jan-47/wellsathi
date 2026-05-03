import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

/**
 * Contained hero banner — NOT full-width.
 * Sits inside the 2-column grid alongside the booking widget.
 */
export function ClinicHeroBanner({ clinic }: Props) {
  const hasRating = (clinic.rating ?? 0) > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = clinic.images || [];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-slate-200 group">
      {/* Image Carousel */}
      {images.length > 0 ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div 
            className="flex w-full h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${clinic.name} - photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full h-full flex-shrink-0 object-cover"
              />
            ))}
          </div>

          {/* Carousel Controls */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prevSlide} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextSlide} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-[88px] md:bottom-24 right-5 z-20 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-slate-300 flex items-center justify-center">
          <span className="text-8xl font-black text-white/25">{clinic.name.charAt(0)}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          to="/search"
          className="flex items-center gap-1.5 text-white/90 hover:text-white bg-black/25 hover:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      {/* Bottom content overlay */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-5 md:p-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/90 backdrop-blur-sm rounded-md">
            <CheckCircle2 className="h-3 w-3 text-white" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Verified Clinic</span>
          </div>
          {hasRating && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-black text-white">{Number(clinic.rating).toFixed(1)} Rating</span>
            </div>
          )}
        </div>

        {/* Clinic Name */}
        <h1 className="text-[24px] md:text-[32px] lg:text-[36px] font-black text-white tracking-tight leading-[1.1] mb-1 drop-shadow-lg">
          {clinic.name}
        </h1>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/80 font-medium text-[13px]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{clinic.address}, {clinic.city}</span>
        </div>
      </div>
    </div>
  );
}
