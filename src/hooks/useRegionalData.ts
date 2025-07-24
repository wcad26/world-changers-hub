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
        .select(`
          *,
          leader:profiles!dcgs_leader_id_fkey(*),
          member_count:dcg_members(count)
        `)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching regional DCGs:', error);
        throw error;
      }

      // Transform the data to get member count as number
      const transformedData = data?.map(dcg => ({
        ...dcg,
        member_count: dcg.member_count?.[0]?.count || 0
      })) || [];

      return transformedData as unknown as RegionalDCG[];
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