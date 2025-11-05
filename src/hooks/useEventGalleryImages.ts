import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventGalleryImage {
  id: string;
  event_id: string;
  image_url: string;
  display_order: number;
  is_hero_image: boolean;
  created_at: string;
  updated_at: string;
}

export function useEventGalleryImages(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-gallery-images', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_hero_image', false)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as EventGalleryImage[];
    },
    enabled: !!eventId,
  });
}
