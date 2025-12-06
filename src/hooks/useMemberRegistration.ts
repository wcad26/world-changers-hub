import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MemberRegistrationFormData } from '@/schemas/memberRegistrationSchema';

export interface MemberRegistrationResult {
  success: boolean;
  is_duplicate?: boolean;
  is_visitor?: boolean;
  message: string;
  member_id?: string;
  login_email?: string;
  default_password?: string;
}

export const useMemberRegistration = () => {
  return useMutation({
    mutationFn: async (data: MemberRegistrationFormData & { region_id: string }): Promise<MemberRegistrationResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://dtqyyvjosdgoqloxybnx.supabase.co/functions/v1/create-member-registration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cXl5dmpvc2Rnb3Fsb3h5Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzY2ODEsImV4cCI6MjA2NTU1MjY4MX0.FfgcNKJ06kHeVnjVoDHulSfzrNMQl6MT9w__vr46x0I'}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cXl5dmpvc2Rnb3Fsb3h5Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzY2ODEsImV4cCI6MjA2NTU1MjY4MX0.FfgcNKJ06kHeVnjVoDHulSfzrNMQl6MT9w__vr46x0I'
          },
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      // Return duplicate info as a result (not an error) so it's handled in onSuccess
      if (response.status === 409 && result.is_duplicate) {
        return {
          success: false,
          is_duplicate: true,
          is_visitor: result.is_visitor || false,
          message: result.message
        };
      }

      // Handle other errors
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Registration failed');
      }
      
      return result;
    }
  });
};
