import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface RegionalRole {
  id: string;
  region_id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRegionalRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRegionalRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export const useRegionalRoles = (regionId?: string) => {
  const { userRegion } = useAuth();
  const targetRegionId = regionId || userRegion?.id;

  return useQuery({
    queryKey: ['regional-roles', targetRegionId],
    queryFn: async () => {
      if (!targetRegionId) throw new Error('No region ID available');

      const { data, error } = await supabase
        .from('regional_roles')
        .select('*')
        .eq('region_id', targetRegionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RegionalRole[];
    },
    enabled: !!targetRegionId,
  });
};

export const useCreateRegionalRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userRegion, user } = useAuth();

  return useMutation({
    mutationFn: async (roleData: CreateRegionalRoleData) => {
      if (!userRegion?.id) throw new Error('No region available');

      const { data, error } = await supabase
        .from('regional_roles')
        .insert({
          region_id: userRegion.id,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-roles'] });
      toast({
        title: "Role created",
        description: "Regional role has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRegionalRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRegionalRoleData }) => {
      const { data, error } = await supabase
        .from('regional_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-roles'] });
      toast({
        title: "Role updated",
        description: "Regional role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRegionalRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('regional_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-roles'] });
      toast({
        title: "Role deactivated",
        description: "Regional role has been deactivated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deactivating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};