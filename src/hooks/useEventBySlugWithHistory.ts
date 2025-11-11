import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from './useEvents';

/**
 * Hook to fetch a single event by its slug with automatic redirect support for old slugs
 * @param slug - The slug of the event to fetch
 * @returns Query result with event data and redirect information
 */
export const useEventBySlugWithHistory = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['event', 'slug-with-history', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      // First, try to find event with current slug
      const { data: currentEvent, error: currentError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (currentEvent) {
        return { event: currentEvent as Event, isRedirect: false };
      }
      
      // If not found, check slug history for redirects
      const { data: historyEntry, error: historyError } = await supabase
        .from('event_slug_history')
        .select('event_id')
        .eq('old_slug', slug)
        .maybeSingle();
      
      if (!historyEntry) {
        throw new Error('Event not found');
      }
      
      // Fetch the actual event with the new slug
      const { data: historicalEvent, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', historyEntry.event_id)
        .single();
      
      if (eventError) throw eventError;
      
      return { 
        event: historicalEvent as Event, 
        isRedirect: true,
        oldSlug: slug,
        newSlug: historicalEvent.slug
      };
    },
    enabled: !!slug,
  });
};
