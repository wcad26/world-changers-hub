import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PresidentCandidate {
  id: string;
  member_id: string;
  profile_id: string;
  region_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  region_name: string | null;
  region_code: string | null;
}

export const useEligiblePresidentCandidates = () => {
  return useQuery({
    queryKey: ['president-candidates'],
    queryFn: async (): Promise<PresidentCandidate[]> => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          member_id,
          profile_id,
          region_id,
          status,
          profiles!inner(id, first_name, last_name, email),
          regions(name, code)
        `)
        .eq('status', 'active')
        .not('profile_id', 'is', null)
        .limit(2000);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        member_id: m.member_id,
        profile_id: m.profile_id,
        region_id: m.region_id,
        first_name: m.profiles?.first_name || '',
        last_name: m.profiles?.last_name || '',
        email: m.profiles?.email || null,
        region_name: m.regions?.name || null,
        region_code: m.regions?.code || null,
      })).sort((a, b) =>
        (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name)
      );
    },
  });
};
