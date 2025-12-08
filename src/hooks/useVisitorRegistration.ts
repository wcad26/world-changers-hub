import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';

export interface VisitorRegistrationResult {
  success: boolean;
  isDuplicate?: boolean;
  visitor_id?: string;
  member_type?: 'visitor' | 'member';
  message?: string;
}

export const useVisitorRegistration = () => {
  return useMutation({
    mutationFn: async (data: VisitorRegistrationFormData & { region_id: string }): Promise<VisitorRegistrationResult> => {
      const { data: result, error } = await supabase.functions.invoke('create-visitor', {
        body: data
      });

      // Handle edge function errors
      if (error) {
        const errorMessage = error.context?.message || error.message || 'Registration failed';
        throw new Error(errorMessage);
      }
      
      // Handle duplicate registration - now returns HTTP 200 with is_duplicate flag
      if (result.is_duplicate) {
        return {
          success: false,
          isDuplicate: true,
          visitor_id: result.visitor_id,
          member_type: result.member_type || (result.is_visitor ? 'visitor' : 'member'),
          message: result.message
        };
      }
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'Registration failed');
      }
      
      return {
        success: true,
        visitor_id: result.visitor_id,
        message: result.message
      };
    }
  });
};