import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventSpeaker {
  id: string;
  event_id: string;
  name: string;
  title: string;
  bio?: string;
  photo_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useEventSpeakers = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['eventSpeakers', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EventSpeaker[];
    },
    enabled: !!eventId,
  });
};
