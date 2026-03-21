import { supabase } from '@/integrations/supabase/client';
import type { TimeSlot } from '@/types';

/**
 * Common logic to assign fallback values if backend doesn't provide them.
 */
function mapRpcToTimeSlot(doctorId: string, date: string, rawSlot: any): TimeSlot {
  return {
    id: rawSlot.id || `${date}-${rawSlot.start_time}`,
    clinic_id: '', // Deprecated in the new doctor-level routing
    doctor_id: doctorId,
    date: date,
    start_time: rawSlot.start_time,
    end_time: rawSlot.end_time,
    is_available: rawSlot.is_available,
  };
}

/**
 * Fetch available slots for a doctor on a specific date using PostgreSQL RPC matching.
 */
export async function getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  const { data, error } = await supabase.rpc('get_doctor_slots', {
    p_doctor_id: doctorId,
    p_date: date,
  });

  if (error) {
    console.error('getAvailableSlots Error:', error);
    return [];
  }

  return (data || [])
    .map(slot => mapRpcToTimeSlot(doctorId, date, slot))
    .filter(slot => slot.is_available);
}

/**
 * Fetch all slots (available and unavailable) using PostgreSQL RPC matching.
 */
export async function getAllSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  const { data, error } = await supabase.rpc('get_doctor_slots', {
    p_doctor_id: doctorId,
    p_date: date,
  });

  if (error) {
    console.error('getAllSlots Error:', error);
    return [];
  }

  return (data || []).map(slot => mapRpcToTimeSlot(doctorId, date, slot));
}
