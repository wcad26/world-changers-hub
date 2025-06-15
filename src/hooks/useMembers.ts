
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
export type MemberWithProfile = Database['public']['Tables']['members']['Row'] & {
  profiles: Profile | null;
};

export const useMembers = (regionId?: string) => {
  return useQuery({
    queryKey: ['members', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('members')
        .select('*, profiles(*)')
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MemberWithProfile[];
    },
    enabled: !!regionId,
  });
};
