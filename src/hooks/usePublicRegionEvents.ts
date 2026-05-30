import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  name: string;
  name_fr?: string;
  description?: string;
  description_fr?: string;
  start_datetime: string;
  end_datetime?: string;
  location_name?: string;
  location_name_fr?: string;
  address?: string;
  address_fr?: string;
  image_url?: string;
  is_public: boolean;
  is_featured: boolean;
  status: string;
  category?: string;
  region_id?: string;
  dcg_id?: string;
  created_at: string;
  updated_at: string;
}

export const usePublicRegionEvents = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['publicRegionEvents', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      // Include events up to end of today so today's events appear even if not yet started
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('region_id', regionId)
        .eq('is_public', true)
        .is('dcg_id', null)
        .lte('start_datetime', endOfToday.toISOString())
        .order('start_datetime', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!regionId,
  });
};
