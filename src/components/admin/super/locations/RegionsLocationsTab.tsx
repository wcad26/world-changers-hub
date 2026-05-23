import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Users, Home, Plus, UserCheck } from 'lucide-react';
import { useAllRegions } from '@/hooks/useAllRegions';
import { GlassSection, GlassSectionHeader, GlassKPICard, GlassTableSkeleton } from '@/components/ui/GlassSection';
import CreateRegionGlassDialog from '@/components/admin/super/regions/CreateRegionGlassDialog';

const RegionsLocationsTab: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const { data: regions, isLoading } = useAllRegions({ includeInactive: true });

  const { data: dcgsByRegion } = useQuery({
    queryKey: ['locations', 'dcg-count-by-region'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dcgs').select('region_id');
      if (error) throw error;
      return (data || []).reduce((acc, d) => {
        if (d.region_id) acc[d.region_id] = (acc[d.region_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  const { data: membersByRegion } = useQuery({
    queryKey: ['locations', 'member-count-by-region'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('region_id').neq('status', 'inactive');
      if (error) throw error;
      return (data || []).reduce((acc, m) => {
        if (m.region_id) acc[m.region_id] = (acc[m.region_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  const { data: totalDcgMembers, isLoading: loadingDcgMembers } = useQuery({
    queryKey: ['locations', 'total-dcg-members'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('dcg_members')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
  });

  const sortedRegions = useMemo(() => {
    return [...(regions || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [regions]);

  const totalRegions = regions?.length || 0;
  const totalMembers = Object.values(membersByRegion || {}).reduce((a, b) => a + b, 0);
  const totalDcgsAcrossRegions = Object.values(dcgsByRegion || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassKPICard icon={<Globe className="h-5 w-5" />} label="Total Regions" value={totalRegions} isLoading={isLoading} />
        <GlassKPICard icon={<Users className="h-5 w-5" />} label="Total Members" value={totalMembers} isLoading={isLoading || !membersByRegion} />
        <GlassKPICard icon={<Home className="h-5 w-5" />} label="Total DCGs" value={totalDcgsAcrossRegions} isLoading={isLoading || !dcgsByRegion} />
        <GlassKPICard icon={<UserCheck className="h-5 w-5" />} label="Total DCG Members" value={totalDcgMembers ?? 0} isLoading={loadingDcgMembers} />
      </div>

      <GlassSection>
        <GlassSectionHeader
          icon={<Globe className="h-5 w-5" />}
          title="Regions Directory"
          description="All WCA regional centers across the organization"
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Region
            </Button>
          }
        />

        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Regional President</TableHead>
                  <TableHead>DCGs</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <GlassTableSkeleton columns={6} rows={4} />
                ) : sortedRegions.length > 0 ? (
                  sortedRegions.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="outline">{r.code}</Badge></TableCell>
                      <TableCell>{r.regional_president || 'N/A'}</TableCell>
                      <TableCell>{dcgsByRegion?.[r.id] || 0}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {membersByRegion?.[r.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? 'default' : 'secondary'}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No regions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </GlassSection>

      <CreateRegionGlassDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default RegionsLocationsTab;
