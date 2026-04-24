import { supabase } from '@/integrations/supabase/client';
import type { Clinic } from '@/types';
import type { SortOption } from '@/constants';

export interface SearchFilters {
  location?: string;
  specialty?: string;
  maxFees?: string;
  minRating?: string;
  sortBy?: SortOption;
  query?: string;
  page?: number;
}

/**
 * Search for approved clinics with filtering and sorting.
 */
export async function searchClinics(filters: SearchFilters): Promise<Clinic[]> {
  const page = filters.page || 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  let queryBuilder = supabase
    .from('clinics')
    .select('id, name, city, address, fees, rating, images, specializations, phone, is_approved', { count: 'exact' })
    .eq('is_approved', true)
    .range(from, to);

  if (filters.query) {
    // Lookup by clinic name OR city match
    queryBuilder = queryBuilder.or(`name.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
  }

  if (filters.location) {
    queryBuilder = queryBuilder.ilike('city', `%${filters.location}%`);
  }

  if (filters.specialty) {
    queryBuilder = queryBuilder.contains('specializations', [filters.specialty]);
  }

  if (filters.maxFees) {
    queryBuilder = queryBuilder.lte('fees', parseInt(filters.maxFees));
  }

  if (filters.minRating) {
    queryBuilder = queryBuilder.gte('rating', parseFloat(filters.minRating));
  }

  const sortBy = filters.sortBy || 'rating';
  switch (sortBy) {
    case 'fees_low':
      queryBuilder = queryBuilder.order('fees', { ascending: true });
      break;
    case 'fees_high':
      queryBuilder = queryBuilder.order('fees', { ascending: false });
      break;
    case 'name':
      queryBuilder = queryBuilder.order('name', { ascending: true });
      break;
    case 'rating':
    default:
      queryBuilder = queryBuilder.order('rating', { ascending: false, nullsFirst: false });
      break;
  }

  let { data, error } = await queryBuilder;
  if (error) throw error;
  
  // Fuzzy search fallback if strict ilike returns nothing
  if (data?.length === 0 && filters.query) {
    let fallbackBuilder = supabase
      .from('clinics')
      .select('id, name, city, address, fees, rating, images, specializations, phone, is_approved')
      .eq('is_approved', true);
    
    if (filters.location) fallbackBuilder = fallbackBuilder.ilike('city', `%${filters.location}%`);
    if (filters.specialty) fallbackBuilder = fallbackBuilder.contains('specializations', [filters.specialty]);
    if (filters.maxFees) fallbackBuilder = fallbackBuilder.lte('fees', parseInt(filters.maxFees));
    if (filters.minRating) fallbackBuilder = fallbackBuilder.gte('rating', parseFloat(filters.minRating));
    
    const { data: fallbackData, error: fallbackError } = await fallbackBuilder;
    if (!fallbackError && fallbackData) {
      const queryTerms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
      const matched = fallbackData.filter((c: any) => {
        const searchSpace = `${c.name} ${c.city} ${c.address}`.toLowerCase();
        return queryTerms.every(term => searchSpace.includes(term));
      });
      
      // Basic local sorting based on sortBy
      if (sortBy === 'fees_low') matched.sort((a, b) => (a.fees || 0) - (b.fees || 0));
      else if (sortBy === 'fees_high') matched.sort((a, b) => (b.fees || 0) - (a.fees || 0));
      else if (sortBy === 'name') matched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      else matched.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      data = matched.slice(from, to + 1) as any;
    }
  }

  return (data as Clinic[]) || [];
}

/**
 * Fetch a single clinic by ID.
 */
export async function getClinicById(clinicId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .maybeSingle();
  if (error) throw error;
  return data as Clinic | null;
}

/**
 * Fetch clinic owned by a specific user.
 */
export async function getClinicByOwner(ownerId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as Clinic) : null;
}

/**
 * Fetch clinic with doctors and services (for profile page).
 */
export async function getClinicProfile(clinicId: string) {
  const [clinicRes, doctorsRes, servicesRes] = await Promise.all([
    supabase.from('clinics').select('*').eq('id', clinicId).maybeSingle(),
    supabase.from('doctors').select('*').eq('clinic_id', clinicId),
    supabase.from('clinic_services').select('*').eq('clinic_id', clinicId).order('service_name'),
  ]);

  if (clinicRes.error) throw clinicRes.error;

  return {
    clinic: clinicRes.data as Clinic | null,
    doctors: doctorsRes.data || [],
    services: servicesRes.data || [],
  };
}

/**
 * Update clinic approval status (admin only).
 */
export async function updateClinicApproval(clinicId: string, isApproved: boolean) {
  const { error } = await supabase
    .from('clinics')
    .update({ is_approved: isApproved })
    .eq('id', clinicId);
  if (error) throw error;
}

/**
 * Fetch all clinics for admin dashboard.
 */
export async function getAllClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Clinic[]) || [];
}

/**
 * Fetch unique cities containing active clinics for search autocomplete.
 */
export async function getUniqueCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('city')
    .eq('is_approved', true);
    
  if (error) throw error;
  
  const cities = data.map((c) => c.city?.trim()).filter(Boolean);
  const uniqueCities = Array.from(
    new Map(cities.map((c) => [c.toLowerCase(), c])).values()
  );
  return uniqueCities.sort((a, b) => a.localeCompare(b));
}

/**
 * Fetch popular top-rated clinics.
 */
export async function getPopularClinics(limit = 4): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('is_approved', true)
    .not('rating', 'is', null)
    .order('rating', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return (data as Clinic[]) || [];
}
