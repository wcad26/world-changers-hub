import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Region } from './useRegions';

export const useRegionBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['region-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      // Convert slug to region code format
      let code: string;
      switch (slug.toLowerCase()) {
        case 'wca-douala':
          code = 'WCAD';
          break;
        case 'wca-eu':
          code = 'WCAEU';
          break;
        case 'wca-usa':
          code = 'WCAUSA';
          break;
        case 'wca-yaounde':
          code = 'WCAYDE';
          break;
        default:
          throw new Error(`Unknown region slug: ${slug}`);
      }
      
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Region;
    },
    enabled: !!slug
  });
};