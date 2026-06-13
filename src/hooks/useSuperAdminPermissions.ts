import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUPER_PERMISSION_CATALOG } from '@/config/superAdminPermissions';

const ALL_KEYS = SUPER_PERMISSION_CATALOG.map((p) => p.key);

export interface SuperPermissionsResult {
  permissions: Set<string>;
  isPrincipal: boolean;
  isReady: boolean;
  has: (perm: string) => boolean;
}

/**
 * Loads the effective super-admin permission set for the current user.
 *
 * - Principal Super Admins (reserved role) implicitly hold every permission.
 * - Other super admins get the union of permissions across their active
 *   super_admin_user_roles → super_admin_roles.
 * - Users who are not super admins return an empty set.
 */
export const useSuperAdminPermissions = (): SuperPermissionsResult => {
  const { user, isSuperAdmin } = useAuth();
  const userId = user?.id;
  const isSuper = isSuperAdmin();

  const { data, isFetched } = useQuery({
    queryKey: ['super-admin-permissions', userId],
    queryFn: async () => {
      if (!userId) return { permissions: [] as string[], isPrincipal: false };

      const { data: rows, error } = await supabase
        .from('super_admin_user_roles')
        .select(`
          is_active,
          super_admin_roles:super_admin_role_id (
            id,
            name,
            permissions,
            is_reserved,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('[useSuperAdminPermissions] error', error);
        return { permissions: [] as string[], isPrincipal: false };
      }

      let isPrincipal = false;
      const merged = new Set<string>();
      for (const row of rows ?? []) {
        const role: any = (row as any).super_admin_roles;
        if (!role || role.is_active === false) continue;
        if (role.is_reserved) {
          isPrincipal = true;
          continue;
        }
        const perms = Array.isArray(role.permissions) ? role.permissions : [];
        for (const p of perms) {
          if (typeof p === 'string') merged.add(p);
        }
      }

      return { permissions: Array.from(merged), isPrincipal };
    },
    enabled: !!userId && isSuper,
    staleTime: 60_000,
  });

  const isPrincipal = !!data?.isPrincipal;
  const permissions = new Set<string>(data?.permissions ?? []);

  const has = (perm: string) => {
    if (!isSuper) return false;
    if (isPrincipal) return true;
    return permissions.has(perm);
  };

  return {
    permissions: isPrincipal ? new Set(ALL_KEYS) : permissions,
    isPrincipal,
    isReady: !isSuper || isFetched,
    has,
  };
};
