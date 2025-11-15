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
      
      // Calculate cutoff date (2 days ago) to show recent past events
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('region_id', regionId)
        .eq('is_public', true)
        .gte('start_datetime', cutoffDate)
        .order('start_datetime', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!regionId,
  });
};
