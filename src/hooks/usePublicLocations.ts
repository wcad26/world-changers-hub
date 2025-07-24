import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Location = Database['public']['Tables']['locations']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type DCG = Database['public']['Tables']['dcgs']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface PublicLocation extends Location {
  region?: Region;
  dcg?: DCG & {
    leader?: Profile;
    member_count?: number;
  };
}

export const usePublicLocations = () => {
  return useQuery({
    queryKey: ['public-locations'],
    queryFn: async () => {
      // First get locations with regions
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('status', 'Active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (locationsError) {
        console.error('Error fetching public locations:', locationsError);
        throw locationsError;
      }

      // Get DCG information for DCG locations with enhanced data
      const dcgLocationNames = locations
        ?.filter(loc => loc.type === 'DCG Location')
        .map(loc => loc.name.replace(' - DCG Location', ''));

      let dcgData: any[] = [];
      if (dcgLocationNames && dcgLocationNames.length > 0) {
        const { data: dcgs, error: dcgError } = await supabase
          .from('dcgs')
          .select(`
            id,
            name,
            description,
            contact_phone,
            meeting_day,
            meeting_time,
            region_id,
            leader:profiles!dcgs_leader_id_fkey(*)
          `)
          .in('name', dcgLocationNames);

        if (!dcgError && dcgs) {
          // Get member counts for each DCG
          const dcgIds = dcgs.map(dcg => dcg.id);
          const { data: memberCounts } = await supabase
            .from('dcg_members')
            .select('dcg_id')
            .in('dcg_id', dcgIds)
            .eq('is_active', true);

          // Map member counts to DCGs
          dcgData = dcgs.map(dcg => ({
            ...dcg,
            member_count: memberCounts?.filter(m => m.dcg_id === dcg.id).length || 0
          }));
        } else {
          console.error('Error fetching DCG data:', dcgError);
        }
      }

      // Map DCG data to locations
      const enrichedLocations = locations?.map(location => {
        if (location.type === 'DCG Location') {
          const dcgName = location.name.replace(' - DCG Location', '');
          const dcg = dcgData.find(d => d.name === dcgName && d.region_id === location.region_id);
          return { ...location, dcg };
        }
        return location;
      });

      return enrichedLocations as PublicLocation[];
    },
  });
};

export const usePublicLocationsByType = (type?: string) => {
  return useQuery({
    queryKey: ['public-locations', type],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('status', 'Active');

      if (type && type !== 'all') {
        query = query.eq('type', type === 'center' ? 'WCA Center' : 'DCG Location');
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching public locations by type:', error);
        throw error;
      }

      return data as PublicLocation[];
    },
  });
};

export const usePublicLocationsByRegion = (regionName?: string) => {
  return useQuery({
    queryKey: ['public-locations-by-region', regionName],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('status', 'Active');

      if (regionName && regionName !== 'all') {
        query = query.eq('regions.name', regionName);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching public locations by region:', error);
        throw error;
      }

      return data as PublicLocation[];
    },
  });
};