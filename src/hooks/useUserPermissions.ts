import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserRegionalRole {
  id: string;
  user_id: string;
  region_id: string;
  regional_role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
  regional_roles: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  };
}

export interface AssignRoleData {
  userId: string;
  roleId: string;
  requiresApproval?: boolean;
}

export const useUserPermissions = (userId?: string, regionId?: string) => {
  const { user, userRegion } = useAuth();
  const targetUserId = userId || user?.id;
  const targetRegionId = regionId || userRegion?.id;

  return useQuery({
    queryKey: ['user-permissions', targetUserId, targetRegionId],
    queryFn: async () => {
      if (!targetUserId || !targetRegionId) return [];

      const { data, error } = await supabase.rpc('has_regional_permission', {
        _user_id: targetUserId,
        _region_id: targetRegionId,
        _permission: 'dashboard_view' // Test permission to check if user has any access
      });

      if (error) throw error;
      return data;
    },
    enabled: !!(targetUserId && targetRegionId),
  });
};

export const useUserRegionalRoles = (userId?: string, regionId?: string) => {
  const { user, userRegion } = useAuth();
  const targetUserId = userId || user?.id;
  const targetRegionId = regionId || userRegion?.id;

  return useQuery({
    queryKey: ['user-regional-roles', targetUserId, targetRegionId],
    queryFn: async () => {
      if (!targetUserId || !targetRegionId) return [];

      const { data, error } = await supabase
        .from('regional_user_roles')
        .select(`
          *,
          regional_roles (
            id,
            name,
            description,
            permissions
          )
        `)
        .eq('user_id', targetUserId)
        .eq('region_id', targetRegionId)
        .eq('is_active', true);

      if (error) throw error;
      return data as UserRegionalRole[];
    },
    enabled: !!(targetUserId && targetRegionId),
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userRegion, user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, roleId, requiresApproval = false }: AssignRoleData) => {
      if (!userRegion?.id) throw new Error('No region available');

      if (requiresApproval) {
        // Check if user already has a pending regional_admin request
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'regional_admin')
          .eq('region_id', userRegion.id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingRole) {
          // Update existing role to pending with requested regional role
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({
              status: 'pending',
              is_active: false,
              requested_regional_role_id: roleId,
            })
            .eq('id', existingRole.id);

          if (updateError) throw updateError;
        } else {
          // Create new pending role request
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'regional_admin',
              region_id: userRegion.id,
              status: 'pending',
              is_active: false,
              requested_regional_role_id: roleId,
            });

          if (insertError) throw insertError;
        }

        return { requiresApproval: true };
      } else {
        // Direct assignment (for already approved admins)
        const { data, error } = await supabase
          .from('regional_user_roles')
          .insert({
            user_id: userId,
            region_id: userRegion.id,
            regional_role_id: roleId,
            assigned_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['user-regional-roles'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      if (data?.requiresApproval) {
        toast({
          title: "Role request submitted",
          description: "The role assignment request has been submitted for Super Admin approval.",
        });
      } else {
        toast({
          title: "Role assigned",
          description: "User role has been assigned successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error assigning role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabase
        .from('regional_user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-regional-roles'] });
      toast({
        title: "Role removed",
        description: "User role has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to check if current user has specific permission
export const useHasPermission = (permission: string) => {
  const { user, userRegion } = useAuth();

  return useQuery({
    queryKey: ['has-permission', user?.id, userRegion?.id, permission],
    queryFn: async () => {
      if (!user?.id || !userRegion?.id) return false;

      const { data, error } = await supabase.rpc('has_regional_permission', {
        _user_id: user.id,
        _region_id: userRegion.id,
        _permission: permission
      });

      if (error) return false;
      return data as boolean;
    },
    enabled: !!(user?.id && userRegion?.id),
  });
};

// Hook to check if a user already has a regional_admin role (approved)
export const useIsApprovedAdmin = (userId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['is-approved-admin', userId, regionId],
    queryFn: async () => {
      if (!userId || !regionId) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('region_id', regionId)
        .eq('role', 'regional_admin')
        .eq('status', 'active')
        .eq('is_active', true)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!(userId && regionId),
  });
};