import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpecialtyIcon } from '@/constants/icons';
import { Grid, ChevronLeft, ChevronRight } from 'lucide-react';

// Top 11 statistically most common specialties
const TOP_SPECIALTIES = [
  'General Medicine',
  'Dentistry',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'ENT',
];

// View All Card Component
const ViewAllCard = React.memo(() => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/search')}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 shadow-sm hover:shadow-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-all duration-100 ease-out w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 snap-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="w-14 h-14 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors duration-100 ease-out">
        <Grid className="w-7 h-7 text-primary transition-transform duration-100 ease-out will-change-transform group-hover:scale-110" />
      </div>
      <span className="text-[13px] font-bold text-primary text-center leading-tight">
        View All<br />Specialties
      </span>
    </button>
  );
});

ViewAllCard.displayName = 'ViewAllCard';

// Specialty color mapping for distinctive visual identity
const SPECIALTY_COLORS: Record<string, { bg: string; icon: string; hover: string }> = {
  'General Medicine': { bg: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20', icon: 'text-blue-600 dark:text-blue-400', hover: 'group-hover:from-blue-200 group-hover:to-blue-100 dark:group-hover:from-blue-800/40 dark:group-hover:to-blue-700/30' },
  'Dentistry': { bg: 'bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20', icon: 'text-cyan-600 dark:text-cyan-400', hover: 'group-hover:from-cyan-200 group-hover:to-cyan-100 dark:group-hover:from-cyan-800/40 dark:group-hover:to-cyan-700/30' },
  'Cardiology': { bg: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20', icon: 'text-red-600 dark:text-red-400', hover: 'group-hover:from-red-200 group-hover:to-red-100 dark:group-hover:from-red-800/40 dark:group-hover:to-red-700/30' },
  'Dermatology': { bg: 'bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/20', icon: 'text-pink-600 dark:text-pink-400', hover: 'group-hover:from-pink-200 group-hover:to-pink-100 dark:group-hover:from-pink-800/40 dark:group-hover:to-pink-700/30' },
  'Pediatrics': { bg: 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20', icon: 'text-purple-600 dark:text-purple-400', hover: 'group-hover:from-purple-200 group-hover:to-purple-100 dark:group-hover:from-purple-800/40 dark:group-hover:to-purple-700/30' },
  'Orthopedics': { bg: 'bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20', icon: 'text-orange-600 dark:text-orange-400', hover: 'group-hover:from-orange-200 group-hover:to-orange-100 dark:group-hover:from-orange-800/40 dark:group-hover:to-orange-700/30' },
  'Gynecology': { bg: 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20', icon: 'text-rose-600 dark:text-rose-400', hover: 'group-hover:from-rose-200 group-hover:to-rose-100 dark:group-hover:from-rose-800/40 dark:group-hover:to-rose-700/30' },
  'Neurology': { bg: 'bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/20', icon: 'text-indigo-600 dark:text-indigo-400', hover: 'group-hover:from-indigo-200 group-hover:to-indigo-100 dark:group-hover:from-indigo-800/40 dark:group-hover:to-indigo-700/30' },
  'Psychiatry': { bg: 'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20', icon: 'text-violet-600 dark:text-violet-400', hover: 'group-hover:from-violet-200 group-hover:to-violet-100 dark:group-hover:from-violet-800/40 dark:group-hover:to-violet-700/30' },
  'ENT': { bg: 'bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20', icon: 'text-teal-600 dark:text-teal-400', hover: 'group-hover:from-teal-200 group-hover:to-teal-100 dark:group-hover:from-teal-800/40 dark:group-hover:to-teal-700/30' },
};

const getSpecialtyColors = (specialty: string) => {
  return SPECIALTY_COLORS[specialty] || { 
    bg: 'bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20', 
    icon: 'text-primary', 
    hover: 'group-hover:from-primary/30 group-hover:to-primary/20 dark:group-hover:from-primary/40 dark:group-hover:to-primary/30' 
  };
};

// Memoized Specialty Card to prevent unnecessary re-renders
const SpecialtyCard = React.memo(({ specialty }: { specialty: string }) => {
  const navigate = useNavigate();
  const Icon = getSpecialtyIcon(specialty);
  const colors = getSpecialtyColors(specialty);

  const handleClick = () => {
    navigate(`/search?specialty=${encodeURIComponent(specialty)}`);
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      aria-label={`Browse ${specialty} clinics`}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg dark:shadow-none hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 ease-out w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 snap-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hover:-translate-y-1"
    >
      <div className={`w-14 h-14 rounded-full ${colors.bg} ${colors.hover} flex items-center justify-center mb-3 transition-all duration-200 ease-out shadow-sm`}>
        <Icon className={`w-7 h-7 ${colors.icon} transition-transform duration-200 ease-out will-change-transform group-hover:scale-110`} strokeWidth={2.5} />
      </div>
      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
        {specialty}
      </span>
    </button>
  );
});

SpecialtyCard.displayName = 'SpecialtyCard';

// Skeleton loader for CLS mitigation
const SpecialtySkeleton = () => (
  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700/50 w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 mb-3" />
    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
  </div>
);

export function BrowseBySpecialty() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate network delay to show loading skeletons (as per requirements)
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Ensure scroll starts from the beginning on mount/reload
  useEffect(() => {
    if (scrollContainerRef.current && !isLoading) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [isLoading]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      handleScroll();
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading]);

  return (
    <section id="specialties" className="py-12 bg-white dark:bg-background" aria-label="Browse by Specialty">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Browse Clinics by Specialty
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">
            Find experienced doctors across all medical specialties.
          </p>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-[45%] -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 md:p-2 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-[45%] -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 md:p-2 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth touch-pan-x custom-scrollbar"
            role="list"
          >
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => <SpecialtySkeleton key={i} />)
              : TOP_SPECIALTIES.map((spec) => (
                  <div role="listitem" key={spec} className="flex-shrink-0 lg:flex-shrink">
                    <SpecialtyCard specialty={spec} />
                  </div>
                ))}
            <div role="listitem" className="flex-shrink-0 lg:flex-shrink">
              <ViewAllCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
