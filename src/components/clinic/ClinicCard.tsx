import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle2, Clock } from 'lucide-react';
import type { Clinic } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getSpecialtyIcon } from '@/constants/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicCardProps {
  clinic: Clinic;
  layout?: 'horizontal' | 'vertical';
}

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

/* ─── Next Available Slot with Open/Closed callback ─── */
function NextAvailableSlot({ 
  clinicId, 
  onStatusChange 
}: { 
  clinicId: string; 
  onStatusChange?: (hasSlotToday: boolean) => void;
}) {
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchNextSlot() {
      try {
        const { data: doctors } = await supabase
          .from('doctors')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1);

        if (!doctors?.length) return;

        const firstDoctorId = doctors[0].id;
        const now = new Date();
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        // Check today, tomorrow, and day after tomorrow (3 days total)
        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() + dayOffset);
          const dateStr = checkDate.toISOString().split('T')[0];

          const { data: slots, error } = await supabase.rpc('get_doctor_slots', {
            p_doctor_id: firstDoctorId,
            p_date: dateStr,
          });

          if (!error && slots?.length) {
            // For today, check if slot is in the future
            const availableSlot = (slots as any[]).find((s) => 
              s.is_available && (dayOffset > 0 || s.start_time > currentTimeStr)
            );
            
            if (availableSlot && !cancelled) {
              let displayText = '';
              if (dayOffset === 0) {
                displayText = `Today, ${formatTime(availableSlot.start_time)}`;
                onStatusChange?.(true);
              } else if (dayOffset === 1) {
                displayText = `Tomorrow, ${formatTime(availableSlot.start_time)}`;
                onStatusChange?.(false);
              } else {
                const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'short' });
                displayText = `${dayName}, ${formatTime(availableSlot.start_time)}`;
                onStatusChange?.(false);
              }
              setNextSlot(displayText);
              return;
            }
          }
        }

        // No slots found in next 3 days
        if (!cancelled) {
          setNextSlot(null);
          onStatusChange?.(false);
        }
      } catch (err) {
        console.error('Failed to fetch slot', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNextSlot();
    return () => { cancelled = true; };
  }, [clinicId, onStatusChange]);

  if (loading) {
    return (
      <span className="text-slate-300 animate-pulse bg-slate-100 dark:bg-slate-700 rounded w-20 h-4 inline-block" />
    );
  }
  if (!nextSlot) {
    return (
      <span className="text-slate-400 dark:text-slate-500 text-[12px] font-medium">
        No slots soon
      </span>
    );
  }

  return (
    <span className="text-slate-800 dark:text-slate-100 text-[12px] font-bold">{nextSlot}</span>
  );
}

/* ─── Badge Components ─── */
function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const cls =
    size === 'xs'
      ? 'gap-1 px-1.5 py-0.5 text-[9px]'
      : 'gap-1.5 px-2 py-0.5 text-[10px]';
  return (
    <div
      className={`flex items-center rounded-md bg-[#2563eb] border border-[#1d4ed8] ${cls} shadow-sm`}
    >
      <CheckCircle2
        className={
          size === 'xs'
            ? 'w-2.5 h-2.5 text-white'
            : 'w-3 h-3 text-white'
        }
      />
      <span className="font-bold text-white uppercase tracking-wider leading-none">
        Verified
      </span>
    </div>
  );
}

function TopRatedBadge({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const cls =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px]'
      : 'px-2 py-0.5 text-[10px]';
  return (
    <div
      className={`rounded-md bg-amber-50 border border-amber-100/60 ${cls}`}
    >
      <span className="font-bold text-amber-700 uppercase tracking-wider leading-none">
        Top Rated
      </span>
    </div>
  );
}

/* ─── Open Status Pill ─── */
function OpenStatusPill({ isOpen }: { isOpen: boolean | null }) {
  if (isOpen === null) return null; // Still loading, don't show
  
  if (isOpen) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">
          Open
        </span>
      </div>
    );
  }

  return null; // Don't show "closed" — only assert open when we have proof
}

export function ClinicCard({ clinic, layout = 'horizontal' }: ClinicCardProps) {
  const isVertical = layout === 'vertical';
  const reviewCount = clinic.review_count ?? 0;
  // Only show TopRated if enough reviews to be credible
  const isTopRated = (clinic.rating ?? 0) > 4 && reviewCount >= 10;
  const hasRating = (clinic.rating ?? 0) > 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState<boolean | null>(null);

  const handleSlotStatus = useCallback((hasSlotToday: boolean) => {
    setIsOpenNow(hasSlotToday);
  }, []);

  return (
    <Link
      to={`/clinic/${clinic.id}`}
      className={`bg-white dark:bg-card focus-visible:outline-none focus:ring-4 ring-primary/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100/80 dark:border-border p-3 sm:p-4 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08)] hover:border-slate-200/80 dark:hover:border-slate-700 transition-all duration-300 group block ${isVertical ? 'h-full flex flex-col' : ''}`}
    >
      <div
        className={`flex gap-3.5 sm:gap-5 ${
          isVertical
            ? 'flex-col flex-1'
            : 'flex-col sm:flex-row'
        }`}
      >
        {/* ─── Image ─── */}
        <div
          className={`relative shrink-0 rounded-[16px] overflow-hidden bg-slate-100 dark:bg-slate-800 ${
            isVertical
              ? 'w-full aspect-[16/10]'
              : 'w-full sm:w-[260px] h-[180px] sm:h-auto sm:min-h-[200px]'
          }`}
        >
          {!imageLoaded && !imageError && clinic.images && clinic.images.length > 0 && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          {clinic.images && clinic.images.length > 0 && !imageError ? (
            <img
              src={clinic.images[0]}
              alt={clinic.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/10 to-slate-100 dark:to-slate-800 flex items-center justify-center">
              <span className="text-4xl font-black text-primary/30">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Open Status Pill — top-left on image */}
          <OpenStatusPill isOpen={isOpenNow} />

          {/* Rating Badge + Review Count — top-right on image */}
          {hasRating && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md shadow-sm flex items-center gap-1 px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[13px] font-black text-slate-800 leading-none">
                {Number(clinic.rating).toFixed(1)}
              </span>
              {reviewCount > 0 && (
                <span className="text-[11px] font-semibold text-slate-400 leading-none">
                  ({reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Mobile badges — below open pill */}
          <div className={`absolute ${isOpenNow ? 'top-10' : 'top-3'} left-3 flex sm:hidden items-center gap-1.5`} style={isOpenNow ? { top: '2.75rem' } : {}}>
            <VerifiedBadge size="xs" />
            {isTopRated && <TopRatedBadge size="xs" />}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Top section */}
          <div>
            {/* Title row + Desktop badges */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-black text-[18px] sm:text-[20px] text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {clinic.name}
              </h3>
              {/* Desktop badges — parallel to clinic name */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 mt-0.5">
                <VerifiedBadge />
                {isTopRated && <TopRatedBadge />}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              <span className="text-[12px] sm:text-[13px] font-medium line-clamp-1">
                {clinic.address}, {clinic.city}
              </span>
            </div>

            {/* Specialties */}
            {clinic.specializations && clinic.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {clinic.specializations.slice(0, 3).map((spec) => {
                  const Icon = getSpecialtyIcon(spec);
                  return (
                    <span
                      key={spec}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      <Icon className="w-3 h-3 text-primary opacity-80" />
                      {spec}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom bar: Price + Slot + CTA */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100/80 dark:border-slate-800 mt-auto">
            {/* Left: fee + slot */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Fee */}
              {(clinic.fees ?? 0) > 0 && (
                <div className="shrink-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                    From
                  </p>
                  <p className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white leading-none">
                    ₹{clinic.fees}
                  </p>
                </div>
              )}

              {/* Divider */}
              {(clinic.fees ?? 0) > 0 && (
                <div className="w-px h-7 bg-slate-100 dark:bg-slate-800 shrink-0" />
              )}

              {/* Next slot */}
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Next Slot
                </p>
                <NextAvailableSlot clinicId={clinic.id} onStatusChange={handleSlotStatus} />
              </div>
            </div>

            {/* CTA */}
            <span className="shrink-0 bg-primary hover:bg-primary/90 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center active:scale-95 transition-all duration-200 whitespace-nowrap">
              View Slots
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
