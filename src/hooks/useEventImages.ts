import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventImage {
  id: string;
  event_id: string;
  image_url: string;
  image_url_fr?: string | null;
  display_order: number;
  is_hero_image: boolean;
  created_at: string;
  updated_at: string;
}

export function useEventImages(eventId: string | undefined, language: 'en' | 'fr' = 'en') {
  return useQuery({
    queryKey: ['event-images', eventId, language],
    queryFn: async () => {
      if (!eventId) return [];
      
      let query = supabase
        .from('event_images')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_hero_image', true);
      
      // Filter to only show images that have content for the selected language
      if (language === 'fr') {
        query = query.not('image_url_fr', 'is', null);
      } else {
        query = query.not('image_url', 'is', null);
      }
      
      query = query.order('display_order', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map to return the correct language image
      return (data || []).map(img => ({
        ...img,
        image_url: (language === 'fr' && img.image_url_fr) ? img.image_url_fr : img.image_url
      })) as EventImage[];
    },
    enabled: !!eventId,
  });
}
