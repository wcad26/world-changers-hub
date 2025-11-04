import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventFAQ {
  id: string;
  event_id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useEventFAQs(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-faqs', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_faqs')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EventFAQ[];
    },
    enabled: !!eventId,
  });
}
