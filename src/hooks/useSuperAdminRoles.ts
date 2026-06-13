import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SuperAdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_reserved: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSuperAdminRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateSuperAdminRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export const useSuperAdminRoles = () => {
  return useQuery({
    queryKey: ['super-admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_roles')
        .select('*')
        .order('is_reserved', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SuperAdminRole[];
    },
  });
};

export const useSuperAdminRoleUsage = () => {
  return useQuery({
    queryKey: ['super-admin-role-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_user_roles')
        .select('super_admin_role_id')
        .eq('is_active', true);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as any[]) {
        map[row.super_admin_role_id] = (map[row.super_admin_role_id] ?? 0) + 1;
      }
      return map;
    },
  });
};

export const useCreateSuperAdminRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: CreateSuperAdminRoleData) => {
      const { data: row, error } = await supabase
        .from('super_admin_roles')
        .insert({
          name: data.name,
          description: data.description ?? null,
          permissions: data.permissions as any,
          created_by: user?.id ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-roles'] });
      toast({ title: 'Super admin role created' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not create role', description: e.message, variant: 'destructive' }),
  });
};

export const useUpdateSuperAdminRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSuperAdminRoleData }) => {
      const { data, error } = await supabase
        .from('super_admin_roles')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-roles'] });
      qc.invalidateQueries({ queryKey: ['super-admin-permissions'] });
      toast({ title: 'Role updated' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not update role', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteSuperAdminRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      // Block deletion if anyone holds the role
      const { data: holders, error: checkErr } = await supabase
        .from('super_admin_user_roles')
        .select('id')
        .eq('super_admin_role_id', id)
        .eq('is_active', true)
        .limit(1);
      if (checkErr) throw checkErr;
      if (holders && holders.length > 0) {
        throw new Error('Cannot delete a role that is currently assigned. Revoke it first.');
      }
      const { error } = await supabase.from('super_admin_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-roles'] });
      toast({ title: 'Role deleted' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not delete role', description: e.message, variant: 'destructive' }),
  });
};
