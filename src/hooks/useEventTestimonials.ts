import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventTestimonial {
  id: string;
  event_id: string;
  name: string;
  name_fr?: string;
  role: string;
  role_fr?: string;
  content: string;
  content_fr?: string;
  rating: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useEventTestimonials(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-testimonials', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_testimonials')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EventTestimonial[];
    },
    enabled: !!eventId,
  });
}
