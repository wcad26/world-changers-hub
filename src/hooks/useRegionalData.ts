import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Location = Database['public']['Tables']['locations']['Row'];
type DCG = Database['public']['Tables']['dcgs']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface RegionalLocation extends Location {
  region?: Database['public']['Tables']['regions']['Row'];
}

export interface RegionalDCG extends DCG {
  leader?: Profile;
  member_count?: number;
}

export interface RegionalEvent extends Event {
  region?: Database['public']['Tables']['regions']['Row'];
}

export const useRegionalLocations = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['regional-locations', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('region_id', regionId)
        .eq('status', 'Active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching regional locations:', error);
        throw error;
      }

      return data as RegionalLocation[];
    },
    enabled: !!regionId,
  });
};

export const useRegionalDCGs = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['regional-dcgs', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('dcgs')
        .select('*')
        .eq('region_id', regionId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching regional DCGs:', error);
        throw error;
      }

      // Get leader information separately for DCGs that have leaders
      const leaderIds = data?.filter(dcg => dcg.leader_id).map(dcg => dcg.leader_id) || [];
      let leaders: { [key: string]: Profile } = {};
      
      if (leaderIds.length > 0) {
        const { data: leaderData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', leaderIds);
        
        leaders = (leaderData || []).reduce((acc, leader) => {
          acc[leader.id] = leader;
          return acc;
        }, {} as { [key: string]: Profile });
      }

      // Get member counts separately for each DCG
      const dcgIds = data?.map(dcg => dcg.id) || [];
      let memberCounts: { [key: string]: number } = {};
      
      if (dcgIds.length > 0) {
        const { data: memberData } = await supabase
          .from('dcg_members')
          .select('dcg_id')
          .in('dcg_id', dcgIds)
          .eq('is_active', true);
        
        memberCounts = (memberData || []).reduce((acc, member) => {
          acc[member.dcg_id] = (acc[member.dcg_id] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
      }

      // Transform the data to include leader and member counts
      const transformedData = data?.map(dcg => ({
        ...dcg,
        leader: dcg.leader_id ? leaders[dcg.leader_id] : undefined,
        member_count: memberCounts[dcg.id] || 0
      })) || [];

      return transformedData as RegionalDCG[];
    },
    enabled: !!regionId,
  });
};

export const useRegionalEvents = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['regional-events', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('region_id', regionId)
        .eq('is_public', true)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime')
        .limit(10);

      if (error) {
        console.error('Error fetching regional events:', error);
        throw error;
      }

      return data as RegionalEvent[];
    },
    enabled: !!regionId,
  });
};