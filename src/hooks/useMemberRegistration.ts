import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MemberRegistrationFormData } from '@/schemas/memberRegistrationSchema';

export const useMemberRegistration = () => {
  return useMutation({
    mutationFn: async (data: MemberRegistrationFormData & { region_id: string }) => {
      const { data: result, error } = await supabase.functions.invoke('create-member-registration', {
        body: data
      });

      // Handle edge function errors and extract user-friendly messages
      if (error) {
        const errorMessage = error.context?.message || error.message || 'Registration failed';
        throw new Error(errorMessage);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }
      
      return result;
    }
  });
};
