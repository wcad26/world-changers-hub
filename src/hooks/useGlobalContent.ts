import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GlobalContentData {
  hero: {
    slides: Array<{
      id: string;
      image: string;
      title: string;
      subtitle: string;
      description: string;
    }>;
    mission_points: string[];
  };
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  milestones: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  team: Array<{
    name: string;
    role: string;
    image: string;
    bio: string;
  }>;
  cta: {
    title: string;
    description: string;
  };
}

export interface HomepageContentData {
  hero: {
    slides: Array<{
      id: string;
      image: string;
      title: string;
      subtitle: string;
      description: string;
      primaryButton: { text: string; link: string };
      secondaryButton: { text: string; link: string };
    }>;
    tagline: string;
  };
  mission: {
    title: string;
    description: string;
    missions: Array<{
      icon: string;
      title: string;
      description: string;
      points: string[];
    }>;
  };
  features: {
    title: string;
    description: string;
    features: Array<{
      icon: string;
      title: string;
      description: string;
      link: string;
    }>;
  };
  events: {
    title: string;
    description: string;
    events: Array<{
      id: string;
      title: string;
      date: string;
      location: string;
      image: string;
    }>;
  };
  testimonials: {
    title: string;
    description: string;
    testimonials: Array<{
      id: string;
      quote: string;
      author: string;
      role: string;
    }>;
  };
  newsletter: {
    title: string;
    description: string;
    placeholder: string;
    buttonText: string;
    disclaimer: string;
  };
}

export const useGlobalContent = (pageType: string = 'about_us') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['global-content', pageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_content')
        .select('*')
        .eq('page_type', pageType)
        .maybeSingle();

      if (error) {
        console.error('Error fetching global content:', error);
        throw error;
      }

      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (content: GlobalContentData) => {
      const { data, error } = await supabase
        .from('global_content')
        .upsert({
          page_type: pageType,
          content: content as any,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'page_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-content', pageType] });
      toast({
        title: "Success",
        description: "Content updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Error updating global content:', error);
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    ...query,
    updateContent: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};