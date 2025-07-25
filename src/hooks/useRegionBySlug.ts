import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Region = Database['public']['Tables']['regions']['Row'];

// Function to convert URL slug back to region name
const slugToRegionName = (slug: string): string[] => {
  // Handle different possible URL formats
  const cleanSlug = slug.toLowerCase();
  
  // Convert slug back to potential region names
  const possibleNames = [
    cleanSlug.replace(/-/g, ' ').toUpperCase(),
    cleanSlug.replace(/^wca-/, '').replace(/-/g, ' ').toUpperCase(),
    `WCA ${cleanSlug.replace(/^wca-/, '').replace(/-/g, ' ').toUpperCase()}`,
    cleanSlug.replace(/-/g, ' ')
  ];
  
  return possibleNames;
};

export const useRegionBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['region-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const possibleNames = slugToRegionName(slug);
      console.log('Searching for region with slug:', slug, 'Possible names:', possibleNames);
      
      // Try to find region by various name formats
      // First try exact match with the most likely candidate
      let { data, error } = await supabase
        .from('regions')
        .select('*')
        .ilike('name', possibleNames[0])
        .eq('is_active', true)
        .maybeSingle();

      // If no exact match, try partial matches
      if (!data && !error) {
        ({ data, error } = await supabase
          .from('regions')
          .select('*')
          .or(possibleNames.map(name => `name.ilike.%${name}%`).join(','))
          .eq('is_active', true)
          .limit(1)
          .maybeSingle());
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching region by slug:', error);
        throw error;
      }
      
      return data as Region | null;
    },
    enabled: !!slug
  });
};