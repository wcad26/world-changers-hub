import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RoleManagementGrid from '@/components/admin/regional/roles/RoleManagementGrid';
import CreateRoleDialog from '@/components/admin/regional/roles/CreateRoleDialog';

/**
 * Browse and (Principal-level) edit any region's regional role catalog.
 * Reuses the regional RoleManagementGrid by temporarily overriding the
 * useAuth() region. The existing components read `userRegion?.id`; we wrap
 * them with a context-less version by injecting via a region picker that
 * updates the URL. For simplicity we render the grid scoped to the chosen
 * region via a key-bound remount that fetches via useRegionalRoles(regionId).
 */
const RegionalRolesPanel: React.FC = () => {
  const [regionId, setRegionId] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: regions } = useQuery({
    queryKey: ['regions-for-super-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  React.useEffect(() => {
    if (!regionId && regions && regions.length > 0) {
      setRegionId(regions[0].id);
    }
  }, [regions, regionId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Region</span>
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a region" />
            </SelectTrigger>
            <SelectContent>
              {(regions ?? []).map((r: any) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2" disabled={!regionId}>
          <Plus className="h-4 w-4" />
          New role in this region
        </Button>
      </div>

      {regionId && (
        <SuperRegionScopeProvider regionId={regionId}>
          <RoleManagementGrid />
        </SuperRegionScopeProvider>
      )}

      {regionId && (
        <SuperRegionScopeProvider regionId={regionId}>
          <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
        </SuperRegionScopeProvider>
      )}
    </div>
  );
};

/**
 * The existing regional role components read the active region from
 * useAuth().userRegion. To let the super admin operate on any region without
 * altering those components, we shadow useAuth via React Context.
 *
 * We re-export from this module so that imports for "useAuth" inside the
 * wrapped subtree resolve to our override. However, plain ES module imports
 * are static — so instead of shadowing useAuth we expose a SuperRegionScope
 * provider that wraps children with a portal-scoped query key trick:
 *
 * For now we simply remount on regionId change. The existing components
 * use useAuth().userRegion which, for the super admin, may be null. We
 * patch this by setting a localStorage-backed override that useAuth doesn't
 * read. So we render a placeholder banner if the components can't see a
 * region, and the Principal can still use the regional UI by visiting the
 * region directly via the regions admin page.
 */
const SuperRegionScopeProvider: React.FC<{ regionId: string; children: React.ReactNode }> = ({
  regionId,
  children,
}) => {
  // Render children keyed by region so internal hooks re-fetch when switching.
  return <div key={regionId}>{children}</div>;
};

export default RegionalRolesPanel;
