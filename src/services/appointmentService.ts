import { supabase } from '@/integrations/supabase/client';
import type { Appointment } from '@/types';

export interface AppointmentWithClinic extends Appointment {
  clinics: {
    name: string;
    address: string;
    city: string;
  };
  // 'doctors' is already inherited from the base Appointment type (id, name, specialization)
}


/**
 * Fetch user's appointments with clinic and doctor data.
 */
export async function getUserAppointments(userId: string): Promise<AppointmentWithClinic[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clinics(name, address, city), doctors(name, specialization)')
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
  const { data, error } = await (supabase as any)
    .from('appointments')
    .select(`
      *,
      doctors ( id, name, specialization ),
      booking_services (
        fee,
        clinic_services ( service_name )
      )
    `)
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
  const { data, error } = await (supabase as any)
    .from('appointments')
    .select(`
      *,
      doctors ( id, name, specialization ),
      booking_services (
        fee,
        clinic_services ( service_name )
      )
    `)
    .eq('clinic_id', clinicId)
    .gte('date', fromDate)
    .order('date')
    .order('time')
    .limit(50);
  if (error) throw error;
  return (data as Appointment[]) || [];
}

/**
 * Cancel an appointment atomically.
 */
export async function cancelAppointment(appointmentId: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);
  if (error) throw error;
}

/**
 * Update appointment status — confirm or reject.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'confirmed' | 'cancelled'
) {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);
  if (error) throw error;
}

/**
 * Book an appointment directly.
 * Collisions are preventing by DB unique index.
 */
export async function bookAppointment(params: {
  clinicId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  notes?: string | null;
  doctorId: string; // Doctor is now required
  totalFee?: number;
  serviceIds?: string[];
  autoApprove?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc('book_appointment', {
    _clinic_id: params.clinicId,
    _slot_id: '00000000-0000-0000-0000-000000000000', // backward compatible dummy id
    _patient_name: params.patientName,
    _patient_phone: params.patientPhone,
    _date: params.date,
    _time: params.time,
    _notes: params.notes || null,
    _doctor_id: params.doctorId,
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
      await (supabase as any).from('booking_services').insert(serviceRows);     
    } catch {
      console.warn('Could not link services to booking');
    }
  }

  if (params.autoApprove) {
    await updateAppointmentStatus(appointmentId, 'confirmed');
  }

  return appointmentId;
}
