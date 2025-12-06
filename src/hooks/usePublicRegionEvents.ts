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
      
      // Calculate date range: from 1 month ago to now (past events only)
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('region_id', regionId)
        .eq('is_public', true)
        .gte('start_datetime', oneMonthAgo.toISOString())
        .lte('start_datetime', now.toISOString())
        .order('start_datetime', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!regionId,
  });
};
