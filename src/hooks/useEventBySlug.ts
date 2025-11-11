import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from './useEvents';

/**
 * Hook to fetch a single event by its slug
 * @param slug - The slug of the event to fetch
 * @returns Query result with event data
 */
export const useEventBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['event', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    enabled: !!slug,
  });
};
