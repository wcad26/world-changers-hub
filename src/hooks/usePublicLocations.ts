import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Location = Database['public']['Tables']['locations']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

export interface PublicLocation extends Location {
  region?: Region;
}

export const usePublicLocations = () => {
  return useQuery({
    queryKey: ['public-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          region:regions(*)
        `)
        .eq('status', 'Active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching public locations:', error);
        throw error;
      }

      return data as PublicLocation[];
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