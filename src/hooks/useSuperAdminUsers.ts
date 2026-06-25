import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SuperAdminUserRow {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: Array<{
    assignmentId: string;
    roleId: string;
    name: string;
    isReserved: boolean;
    assignedAt: string;
  }>;
  isPrincipal: boolean;
}

/**
 * Returns every user holding the global `super_admin` app role, with any
 * super_admin_role assignments overlaid.
 */
export const useSuperAdminUsers = () => {
  return useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async (): Promise<SuperAdminUserRow[]> => {
      const { data: appRoles, error: appErr } = await supabase
        .from('user_roles')
        .select('user_id, is_active, status')
        .eq('role', 'super_admin');
      if (appErr) throw appErr;

      const userIds = Array.from(
        new Set(
          (appRoles ?? [])
            .filter((r: any) => (r.is_active ?? true) && (r.status ?? 'active') === 'active')
            .map((r: any) => r.user_id),
        ),
      );
      if (userIds.length === 0) return [];

      const [profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, first_name, last_name').in('id', userIds),
        supabase
          .from('super_admin_user_roles')
          .select(`
            id,
            user_id,
            super_admin_role_id,
            assigned_at,
            is_active,
            super_admin_roles:super_admin_role_id ( id, name, is_reserved, is_active )
          `)
          .in('user_id', userIds)
          .eq('is_active', true),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      const profileMap = new Map<string, any>((profilesRes.data ?? []).map((p: any) => [p.id, p]));

      const rows: SuperAdminUserRow[] = userIds.map((uid) => {
        const profile = profileMap.get(uid) ?? {};
        const userAssigns = (assignmentsRes.data ?? []).filter((a: any) => a.user_id === uid);
        const roles = userAssigns
          .filter((a: any) => a.super_admin_roles && a.super_admin_roles.is_active !== false)
          .map((a: any) => ({
            assignmentId: a.id,
            roleId: a.super_admin_role_id,
            name: a.super_admin_roles?.name ?? 'Unknown',
            isReserved: !!a.super_admin_roles?.is_reserved,
            assignedAt: a.assigned_at,
          }));
        return {
          user_id: uid,
          email: profile.email ?? '',
          first_name: profile.first_name ?? null,
          last_name: profile.last_name ?? null,
          roles,
          isPrincipal: roles.some((r) => r.isReserved),
        };
      });

      return rows.sort((a, b) => (a.last_name ?? '').localeCompare(b.last_name ?? ''));
    },
  });
};

export const useAssignSuperAdminRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      // First make sure user has the super_admin app role (insert if missing)
      const { data: existing, error: checkErr } = await supabase
        .from('user_roles')
        .select('id, is_active, status')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .maybeSingle();
      if (checkErr) throw checkErr;

      const tryInsertRole = async () =>
        supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'super_admin' as any,
            is_active: true,
            status: 'active' as any,
            assigned_by: user?.id,
          } as any);

      if (!existing) {
        let { error: insErr } = await tryInsertRole();
        if (insErr && (insErr as any).code === '23503') {
          // Profile has no auth.users row — provision one transparently.
          const { error: provErr } = await supabase.functions.invoke('provision-auth-user', {
            body: { profile_id: userId },
          });
          if (provErr) throw new Error(`Could not create sign-in account: ${provErr.message}`);
          ({ error: insErr } = await tryInsertRole());
        }
        if (insErr) throw insErr;
      } else if (!existing.is_active || existing.status !== 'active') {
        const { error: upErr } = await supabase
          .from('user_roles')
          .update({ is_active: true, status: 'active' as any })
          .eq('id', existing.id);
        if (upErr) throw upErr;
      }


      // Then upsert the super_admin_user_roles assignment
      const { data: priorAssign } = await supabase
        .from('super_admin_user_roles')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('super_admin_role_id', roleId)
        .maybeSingle();

      if (priorAssign) {
        if (!priorAssign.is_active) {
          const { error } = await supabase
            .from('super_admin_user_roles')
            .update({ is_active: true, assigned_by: user?.id, assigned_at: new Date().toISOString() })
            .eq('id', priorAssign.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('super_admin_user_roles')
          .insert({
            user_id: userId,
            super_admin_role_id: roleId,
            assigned_by: user?.id ?? null,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-users'] });
      qc.invalidateQueries({ queryKey: ['super-admin-permissions'] });
      qc.invalidateQueries({ queryKey: ['super-admin-role-usage'] });
      toast({ title: 'Super admin role assigned' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not assign role', description: e.message, variant: 'destructive' }),
  });
};

export const useRevokeSuperAdminRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('super_admin_user_roles')
        .update({ is_active: false })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-users'] });
      qc.invalidateQueries({ queryKey: ['super-admin-permissions'] });
      qc.invalidateQueries({ queryKey: ['super-admin-role-usage'] });
      toast({ title: 'Role revoked' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not revoke role', description: e.message, variant: 'destructive' }),
  });
};

export const useRevokeSuperAdminEntirely = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Deactivate all super_admin_user_roles
      const { error: e1 } = await supabase
        .from('super_admin_user_roles')
        .update({ is_active: false })
        .eq('user_id', userId);
      if (e1) throw e1;
      // Deactivate the super_admin app role
      const { error: e2 } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', 'super_admin');
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-users'] });
      qc.invalidateQueries({ queryKey: ['super-admin-permissions'] });
      qc.invalidateQueries({ queryKey: ['super-admin-role-usage'] });
      toast({ title: 'Super admin access revoked' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not revoke', description: e.message, variant: 'destructive' }),
  });
};
