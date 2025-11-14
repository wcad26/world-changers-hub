import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';

export const useVisitorRegistration = () => {
  return useMutation({
    mutationFn: async (data: VisitorRegistrationFormData & { region_id: string }) => {
      const { data: result, error } = await supabase.functions.invoke('create-visitor', {
        body: data
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.message || 'Registration failed');
      
      return result;
    }
  });
};