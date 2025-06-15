
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Region = Database['public']['Tables']['regions']['Row'];

export const useRegions = () => {
  return useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Region[];
    }
  });
};

export const useRegion = (regionId: string | undefined) => {
  return useQuery({
    queryKey: ['region', regionId],
    queryFn: async () => {
      if (!regionId) return null;
      
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('id', regionId)
        .single();

      if (error) throw error;
      return data as Region;
    },
    enabled: !!regionId
  });
};
