import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { publicLocationsQueryOptions } from '@/lib/public-site.functions';

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
  return useQuery(publicLocationsQueryOptions());
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