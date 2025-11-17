import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';

export const useVisitorRegistration = () => {
  return useMutation({
    mutationFn: async (data: VisitorRegistrationFormData & { region_id: string }) => {
      const { data: result, error } = await supabase.functions.invoke('create-visitor', {
        body: data
      });

      // Handle edge function errors and extract user-friendly messages
      if (error) {
        // The error context often contains the actual response message
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