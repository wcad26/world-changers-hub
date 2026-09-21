import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Whether the signed-in user is allowed to READ / MANAGE the access list of a region.
 *
 * Mirrors the database rules exactly:
 *  - an active regional role in that region whose permissions include '*' or 'access_management'
 *  - OR the legacy regional_admin label for that region
 *  - OR a super admin
 *
 * Used so the Access page can tell "nobody has access yet" apart from
 * "you are not allowed to see this list" — the two used to look identical.
 */
export const useCanManageRegionalAccess = (regionId?: string) => {
  const { user, userRegion } = useAuth();
  const targetRegionId = regionId || userRegion?.id;

  return useQuery({
    queryKey: ['can-manage-regional-access', user?.id, targetRegionId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !targetRegionId) return false;

      const [byRole, bySuper, byLegacy] = await Promise.all([
        (supabase.rpc as any)('can_manage_regional_access', {
          _user_id: user.id,
          _region_id: targetRegionId,
        }),
        (supabase.rpc as any)('is_super_admin_user', { _user_id: user.id }),
        supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.id)
          .eq('region_id', targetRegionId)
          .eq('role', 'regional_admin')
          .eq('is_active', true)
          .limit(1),
      ]);

      return (
        byRole?.data === true ||
        bySuper?.data === true ||
        ((byLegacy as any)?.data?.length ?? 0) > 0
      );
    },
    enabled: !!(user?.id && targetRegionId),
  });
};
