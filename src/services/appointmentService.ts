import { supabase } from '@/integrations/supabase/client';
import type { Appointment } from '@/types';

export interface AppointmentWithClinic extends Appointment {
  clinics: {
    name: string;
    address: string;
    city: string;
  };
}

/**
 * Fetch user's appointments with clinic data.
 */
export async function getUserAppointments(userId: string): Promise<AppointmentWithClinic[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clinics(name, address, city)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('time', { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data as AppointmentWithClinic[]) || [];
}

/**
 * Fetch appointments for a clinic on a specific date.
 */
export async function getClinicAppointments(clinicId: string, date: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .order('time');
  if (error) throw error;
  return (data as Appointment[]) || [];
}

/**
 * Fetch upcoming appointments for a clinic.
 */
export async function getClinicUpcomingAppointments(clinicId: string, fromDate: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .gte('date', fromDate)
    .order('date')
    .order('time')
    .limit(50);
  if (error) throw error;
  return (data as Appointment[]) || [];
}

/**
 * Cancel an appointment and free its time slot atomically.
 * Uses the `cancel_appointment` SECURITY DEFINER function in Supabase.
 */
export async function cancelAppointment(appointmentId: string) {
  const { error } = await (supabase.rpc as any)('cancel_appointment', {
    _appointment_id: appointmentId,
  });
  if (error) throw error;
}

/**
 * Update appointment status (by clinic) — confirm or reject.
 * Uses the `update_appointment_status` SECURITY DEFINER function in Supabase.
 * On rejection (cancelled), the slot is freed atomically within the same transaction.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'confirmed' | 'cancelled'
) {
  const { error } = await (supabase.rpc as any)('update_appointment_status', {
    _appointment_id: appointmentId,
    _new_status: status,
  });
  if (error) throw error;
}

/**
 * Book an appointment atomically using the DB function.
 * Supports doctor selection and multi-service bookings.
 */
export async function bookAppointment(params: {
  clinicId: string;
  slotId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  notes?: string | null;
  doctorId?: string | null;
  totalFee?: number;
  serviceIds?: string[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('book_appointment', {
    _clinic_id: params.clinicId,
    _slot_id: params.slotId,
    _patient_name: params.patientName,
    _patient_phone: params.patientPhone,
    _date: params.date,
    _time: params.time,
    _notes: params.notes || null,
    _doctor_id: params.doctorId || null,
    _total_fee: params.totalFee || 0,
  });

  if (error) throw error;

  const appointmentId = data as string;

  // Insert booking_services for multi-service support
  if (params.serviceIds && params.serviceIds.length > 0 && appointmentId) {
    try {
      const serviceRows = params.serviceIds.map(serviceId => ({
        appointment_id: appointmentId,
        service_id: serviceId,
        fee: 0,
      }));
      await (supabase.from as any)('booking_services').insert(serviceRows);
    } catch {
      console.warn('Could not link services to booking');
    }
  }

  return appointmentId;
}
