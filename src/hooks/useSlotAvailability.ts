import { useMemo } from 'react';
import { format, parseISO, isToday as isTodayFn } from 'date-fns';
import type { TimeSlot } from '@/types';

interface DateAvailability {
  date: string;
  availableCount: number;
  totalCount: number;
}

export function useSlotAvailability(
  allSlots: TimeSlot[],
  dates: string[],
  selectedDoctorId: string
): Map<string, DateAvailability> {
  return useMemo(() => {
    const availabilityMap = new Map<string, DateAvailability>();

    dates.forEach((date) => {
      // Filter slots for this specific date
      const dateSlotsAll = allSlots;

      // Filter out past slots if it's today
      const isToday = isTodayFn(parseISO(date));
      let dateSlots = dateSlotsAll;

      if (isToday) {
        const currentTimeStr = format(new Date(), 'HH:mm:ss');
        dateSlots = dateSlotsAll.filter((slot) => slot.start_time > currentTimeStr);
      }

      const availableCount = dateSlots.filter((slot) => slot.is_available).length;
      const totalCount = dateSlots.length;

      availabilityMap.set(date, {
        date,
        availableCount,
        totalCount,
      });
    });

    return availabilityMap;
  }, [allSlots, dates, selectedDoctorId]);
}

/**
 * Format availability count for display
 */
export function formatAvailability(count: number): string {
  if (count === 0) return 'No slots';
  if (count === 1) return '1 slot';
  return `${count} slots`;
}
