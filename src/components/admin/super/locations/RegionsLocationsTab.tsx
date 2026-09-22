import React, { useMemo } from 'react';
import { useNavigate } from '@/lib/router-compat';
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
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
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

  // Members + Children per region.
  // Regular visitor = visitor (non-child) with >=1 present attendance on a regional non-special event.
  const { data: memberStats, isLoading: loadingMemberStats } = useQuery({
    queryKey: ['locations', 'member-stats-by-region-v2'],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('members')
        .select('id, region_id, member_type, profiles(date_of_birth)')
        .neq('status', 'inactive');
      if (error) throw error;

      const memberRows = (members || []) as Array<{
        id: string;
        region_id: string | null;
        member_type: string | null;
        profiles?: { date_of_birth?: string | null } | null;
      }>;

      const { data: specialEvents, error: specialErr } = await supabase
        .from('events')
        .select('id')
        .eq('is_special', true);
      if (specialErr) throw specialErr;
      const specialIds = new Set((specialEvents || []).map(e => e.id));

      // Regional (non-DCG) attendance events whose source event is not special
      const { data: attEvents, error: attErr } = await supabase
        .from('attendance_events')
        .select('id, source_event_id, dcg_id');
      if (attErr) throw attErr;
      const regionalNonSpecialEventIds = (attEvents || [])
        .filter(e => !e.dcg_id && (!e.source_event_id || !specialIds.has(e.source_event_id)))
        .map(e => e.id);

      // Members present at any regional non-special event
      const regularAttendees = new Set<string>();
      const CHUNK = 200;
      for (let i = 0; i < regionalNonSpecialEventIds.length; i += CHUNK) {
        const chunk = regionalNonSpecialEventIds.slice(i, i + CHUNK);
        const { data: records, error: recErr } = await supabase
          .from('attendance_records')
          .select('member_id')
          .in('event_id', chunk)
          .eq('is_present', true);
        if (recErr) throw recErr;
        (records || []).forEach(r => regularAttendees.add(r.member_id));
      }

      const relationships = await fetchMemberRelationshipsForMembers(memberRows.map(m => m.id));
      const childrenSet = buildChildrenSet(memberRows, relationships);

      const membersByRegion: Record<string, number> = {};
      const childrenByRegion: Record<string, number> = {};

      memberRows.forEach(m => {
        if (!m.region_id) return;
        if (childrenSet.has(m.id)) {
          childrenByRegion[m.region_id] = (childrenByRegion[m.region_id] || 0) + 1;
          return;
        }
        if (m.member_type === 'member') {
          membersByRegion[m.region_id] = (membersByRegion[m.region_id] || 0) + 1;
        } else if (m.member_type === 'visitor' && regularAttendees.has(m.id)) {
          membersByRegion[m.region_id] = (membersByRegion[m.region_id] || 0) + 1;
        }
      });

      return { membersByRegion, childrenByRegion };
    },
  });

  // Active DCG attendants per region (unique members present at any DCG event in last 28 days)
  const { data: dcgMembersByRegion, isLoading: loadingDcgMembers } = useQuery({
    queryKey: ['locations', 'dcg-active-attendants-by-region'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data: events, error: evErr } = await supabase
        .from('attendance_events')
        .select('id, region_id')
        .not('dcg_id', 'is', null)
        .gte('event_date', sinceStr);
      if (evErr) throw evErr;

      const eventRegion = new Map<string, string>();
      (events || []).forEach(e => {
        if (e.region_id) eventRegion.set(e.id, e.region_id);
      });
      const eventIds = Array.from(eventRegion.keys());
      if (eventIds.length === 0) return {} as Record<string, number>;

      // Chunk in() for safety
      const CHUNK = 200;
      const uniquePerRegion = new Map<string, Set<string>>();
      for (let i = 0; i < eventIds.length; i += CHUNK) {
        const chunk = eventIds.slice(i, i + CHUNK);
        const { data: records, error: recErr } = await supabase
          .from('attendance_records')
          .select('event_id, member_id')
          .in('event_id', chunk)
          .eq('is_present', true);
        if (recErr) throw recErr;
        (records || []).forEach(r => {
          const region = eventRegion.get(r.event_id);
          if (!region) return;
          if (!uniquePerRegion.has(region)) uniquePerRegion.set(region, new Set());
          uniquePerRegion.get(region)!.add(r.member_id);
        });
      }

      const out: Record<string, number> = {};
      uniquePerRegion.forEach((set, region) => { out[region] = set.size; });
      return out;
    },
  });

  const membersByRegion = memberStats?.membersByRegion;
  const childrenByRegion = memberStats?.childrenByRegion;

  const sortedRegions = useMemo(() => {
    return [...(regions || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [regions]);

  const totalRegions = regions?.length || 0;
  const totalMembers = Object.values(membersByRegion || {}).reduce((a, b) => a + b, 0);
  const totalDcgsAcrossRegions = Object.values(dcgsByRegion || {}).reduce((a, b) => a + b, 0);
  const totalDcgMembers = Object.values(dcgMembersByRegion || {}).reduce((a, b) => a + b, 0);

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
        <GlassKPICard icon={<Users className="h-5 w-5" />} label="Total Members" value={totalMembers} isLoading={isLoading || loadingMemberStats} />
        <GlassKPICard icon={<Home className="h-5 w-5" />} label="Total DCGs" value={totalDcgsAcrossRegions} isLoading={isLoading || !dcgsByRegion} />
        <GlassKPICard icon={<UserCheck className="h-5 w-5" />} label="Total DCG Members" value={totalDcgMembers} isLoading={loadingDcgMembers} />
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
                  <TableHead>President</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>DCGs</TableHead>
                  <TableHead>DCG Members</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <GlassTableSkeleton columns={8} rows={4} />
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
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {membersByRegion?.[r.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>{dcgsByRegion?.[r.id] || 0}</TableCell>
                      <TableCell>{dcgMembersByRegion?.[r.id] || 0}</TableCell>
                      <TableCell>{childrenByRegion?.[r.id] || 0}</TableCell>
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
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
