import { useQuery } from '@tanstack/react-query';
import { getAvailableSlots, getAllSlots } from '@/services/slotService';

/** Fetch available slots for a doctor on a date. */
export function useAvailableSlots(doctorId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date, 'available'],
    queryFn: () => getAvailableSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
    refetchInterval: 10000,
  });
}

/** Fetch all slots (including unavailable) for a doctor on a date. */
export function useAllSlots(doctorId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date, 'all'],
    queryFn: () => getAllSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
    refetchInterval: 10000,
  });

}
