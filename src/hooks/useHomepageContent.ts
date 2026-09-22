import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HomepageContentData } from './useGlobalContent';
import { homepageContentQueryOptions } from '@/lib/public-site.functions';

export const useHomepageContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery(homepageContentQueryOptions());

  const updateMutation = useMutation({
    mutationFn: async (content: HomepageContentData) => {
      const { data, error } = await supabase
        .from('global_content')
        .upsert({
          page_type: 'homepage',
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
      queryClient.invalidateQueries({ queryKey: ['global-content', 'homepage'] });
      toast({
        title: "Success",
        description: "Homepage content updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Error updating homepage content:', error);
      toast({
        title: "Error",
        description: "Failed to update homepage content. Please try again.",
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