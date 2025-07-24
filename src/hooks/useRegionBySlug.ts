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
      
      // Try to find region by various name formats
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .or(possibleNames.map(name => `name.ilike.%${name}%`).join(','))
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching region by slug:', error);
        throw error;
      }
      
      return data as Region | null;
    },
    enabled: !!slug
  });
};