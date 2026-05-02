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

      // Get member counts separately for each DCG (excluding children)
      const dcgIds = data?.map(dcg => dcg.id) || [];
      let memberCounts: { [key: string]: number } = {};
      
      if (dcgIds.length > 0) {
        const { data: memberData } = await supabase
          .from('dcg_members')
          .select('dcg_id, member_id, members:member_id(id, profiles:profile_id(date_of_birth))')
          .in('dcg_id', dcgIds)
          .eq('is_active', true);

        const underlyingIds = Array.from(new Set((memberData || []).map((m: any) => m.member_id).filter(Boolean)));
        let relationships: Array<{ member_id: string; related_member_id: string }> = [];
        if (underlyingIds.length > 0) {
          const { data: relData } = await supabase
            .from('member_relationships' as any)
            .select('member_id, related_member_id')
            .or(`member_id.in.(${underlyingIds.join(',')}),related_member_id.in.(${underlyingIds.join(',')})`);
          relationships = (relData as any[]) || [];
        }
        const { buildChildrenSet } = await import('@/utils/childUtils');
        const childrenSet = buildChildrenSet(
          (memberData || []).map((dm: any) => ({
            id: dm.member_id,
            profiles: { date_of_birth: dm.members?.profiles?.date_of_birth ?? null },
          })),
          relationships
        );

        memberCounts = (memberData || []).reduce((acc: any, member: any) => {
          if (childrenSet.has(member.member_id)) return acc;
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

// Hook to get all events for a region (both regional and DCG events)
export const useAllRegionalEvents = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['all-regional-events', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          region:regions(*),
          dcg:dcgs(name)
        `)
        .eq('region_id', regionId)
        .eq('is_public', true)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime')
        .limit(20);

      if (error) {
        console.error('Error fetching all regional events:', error);
        throw error;
      }

      return data;
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