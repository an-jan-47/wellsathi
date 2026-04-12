import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateClinicProfile,
  changePassword,
  type ClinicProfileUpdate,
} from '@/services/clinicSettingsService';
import { toast } from 'sonner';

export function useUpdateClinicProfile(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClinicProfileUpdate) =>
      updateClinicProfile(clinicId, data),
    onSuccess: () => {
      toast.success('Clinic profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clinics', 'byOwner'] });
      queryClient.invalidateQueries({ queryKey: ['clinics', clinicId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update clinic profile');
    },
  });
}

/**
 * Mutation to change the current user's password.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => changePassword(newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}
