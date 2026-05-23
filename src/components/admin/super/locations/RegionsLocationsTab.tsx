import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Globe, Users, Home, Plus, UserCheck,
  MoreHorizontal, Eye, Pencil, Trash2, RotateCcw,
} from 'lucide-react';
import { useAllRegions, type Region } from '@/hooks/useAllRegions';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { GlassSection, GlassSectionHeader, GlassKPICard, GlassTableSkeleton } from '@/components/ui/GlassSection';
import CreateRegionGlassDialog from '@/components/admin/super/regions/CreateRegionGlassDialog';
import EditRegionDialog from '@/components/admin/super/regions/EditRegionDialog';
import { cn } from '@/lib/utils';

const RegionsLocationsTab: React.FC = () => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedRegion, setSelectedRegion] = React.useState<Region | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'deactivate' | 'reactivate'>('deactivate');

  const { data: regions, isLoading } = useAllRegions({ includeInactive: true });
  const { deleteRegion, reactivateRegion } = useRegionMutations();

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

  const goToReport = (r: Region) => navigate(`/admin/super/regions/${r.id}/report`);

  const openEdit = (r: Region) => {
    setSelectedRegion(r);
    setEditOpen(true);
  };

  const askConfirm = (r: Region, action: 'deactivate' | 'reactivate') => {
    setSelectedRegion(r);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const runConfirm = () => {
    if (!selectedRegion) return;
    if (confirmAction === 'deactivate') {
      deleteRegion.mutate(selectedRegion.id);
    } else {
      reactivateRegion.mutate(selectedRegion.id);
    }
    setConfirmOpen(false);
  };

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
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <GlassTableSkeleton columns={6} rows={4} />
                ) : sortedRegions.length > 0 ? (
                  sortedRegions.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => goToReport(r)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              r.is_active ? 'bg-green-500' : 'bg-muted-foreground/40',
                            )}
                            title={r.is_active ? 'Active' : 'Inactive'}
                          />
                          <span className="hover:text-primary transition-colors">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.code}</Badge></TableCell>
                      <TableCell>{r.regional_president || 'N/A'}</TableCell>
                      <TableCell>{dcgsByRegion?.[r.id] || 0}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {membersByRegion?.[r.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => goToReport(r)}>
                              <Eye className="h-4 w-4 mr-2" /> View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {r.is_active ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => askConfirm(r, 'deactivate')}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => askConfirm(r, 'reactivate')}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      <EditRegionDialog open={editOpen} onOpenChange={setEditOpen} region={selectedRegion} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'deactivate' ? 'Deactivate region?' : 'Reactivate region?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'deactivate'
                ? `${selectedRegion?.name} will be marked inactive. You can reactivate it later.`
                : `${selectedRegion?.name} will be marked active again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirm}
              className={confirmAction === 'deactivate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RegionsLocationsTab;
