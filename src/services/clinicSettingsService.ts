import { supabase } from '@/integrations/supabase/client';

export interface ClinicProfileUpdate {
  name: string;
  address: string;
  city: string;
  phone: string | null;
  fees: number;
  description: string | null;
  specializations: string[] | null;
  images: string[] | null;
}

/**
 * Update clinic profile fields.
 * Only the owner (via RLS) can perform this update.
 */
export async function updateClinicProfile(
  clinicId: string,
  data: ClinicProfileUpdate
): Promise<void> {
  const { error } = await supabase
    .from('clinics')
    .update({
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      phone: data.phone?.trim() || null,
      fees: data.fees,
      description: data.description?.trim() || null,
      specializations: data.specializations,
      images: data.images,
    })
    .eq('id', clinicId);

  if (error) throw error;
}

/**
 * Change the current user's password via Supabase Auth.
 */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
