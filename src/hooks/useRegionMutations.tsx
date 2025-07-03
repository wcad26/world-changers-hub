
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Region = Database['public']['Tables']['regions']['Row'];
type RegionInsert = Database['public']['Tables']['regions']['Insert'];
type RegionUpdate = Database['public']['Tables']['regions']['Update'];

export const useRegionMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRegion = useMutation({
    mutationFn: async (regionData: RegionInsert) => {
      console.log('Creating region:', regionData);
      const { data, error } = await supabase
        .from('regions')
        .insert(regionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating region:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Region created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast({
        title: "Region Created",
        description: `${data.name} has been created successfully.`
      });
    },
    onError: (error: any) => {
      console.error('Create region error:', error);
      toast({
        title: "Error Creating Region",
        description: error.message || "Failed to create region. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateRegion = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RegionUpdate }) => {
      console.log('Updating region:', id, updates);
      const { data, error } = await supabase
        .from('regions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating region:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Region updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast({
        title: "Region Updated",
        description: `${data.name} has been updated successfully.`
      });
    },
    onError: (error: any) => {
      console.error('Update region error:', error);
      toast({
        title: "Error Updating Region",
        description: error.message || "Failed to update region. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteRegion = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deactivating region:', id);
      const { data, error } = await supabase
        .from('regions')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating region:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Region deactivated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast({
        title: "Region Deactivated",
        description: `${data.name} has been deactivated.`
      });
    },
    onError: (error: any) => {
      console.error('Deactivate region error:', error);
      toast({
        title: "Error Deactivating Region",
        description: error.message || "Failed to deactivate region. Please try again.",
        variant: "destructive"
      });
    }
  });

  const reactivateRegion = useMutation({
    mutationFn: async (id: string) => {
      console.log('Reactivating region:', id);
      const { data, error } = await supabase
        .from('regions')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error reactivating region:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Region reactivated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast({
        title: "Region Reactivated",
        description: `${data.name} has been reactivated.`
      });
    },
    onError: (error: any) => {
      console.error('Reactivate region error:', error);
      toast({
        title: "Error Reactivating Region",
        description: error.message || "Failed to reactivate region. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    createRegion,
    updateRegion,
    deleteRegion,
    reactivateRegion
  };
};
