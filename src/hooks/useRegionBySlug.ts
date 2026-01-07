import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/utils/slugUtils';
import type { Region } from './useRegions';

export const useRegionBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['region-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      // Fetch all active regions
      const { data: regions, error } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Find region by matching the generated slug from the region name
      const normalizedSlug = slug.toLowerCase();
      const matchedRegion = regions?.find(
        (region) => generateSlug(region.name) === normalizedSlug
      );
      
      if (!matchedRegion) {
        throw new Error(`Region not found for slug: ${slug}`);
      }
      
      return matchedRegion as Region;
    },
    enabled: !!slug
  });
};