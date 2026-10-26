import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, UserPlus, Users, TrendingUp, TrendingDown, CheckCircle, Clock, Search, Target, Trash2, MoreHorizontal, Settings2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscipleshipRelationships, useDeleteDiscipleshipRelationship, type DiscipleshipRelationshipWithMembers } from '@/hooks/useDiscipleship';
import AssignDiscipleDialog from '@/components/admin/regional/discipleship/AssignDiscipleDialog';
import ManageDiscipleshipDialog from '@/components/admin/regional/discipleship/ManageDiscipleshipDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { HeroCard, RingTile, SearchBar, RoundButton, ChipRow, Initials, StatusPill } from '@/components/admin/regional/RegionalUI';
import { EmptyState } from '@/components/member/MemberUI';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Discipleship: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: relationships, isLoading, error } = useDiscipleshipRelationships(userRegion?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<DiscipleshipRelationshipWithMembers | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscipleshipRelationshipWithMembers | null>(null);

  const deleteRelationship = useDeleteDiscipleshipRelationship();

  const handleDelete = async (id: string) => {
    try {
      await deleteRelationship.mutateAsync(id);
      toast.success('Discipleship relationship deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete relationship');
    }
  };

  // Fetch discipleship progress for success rate
  const relationshipIds = useMemo(() => relationships?.map(r => r.id) || [], [relationships]);
  const { data: progressData } = useQuery({
    queryKey: ['discipleship-progress-kpi', relationshipIds.sort().join(',')],
    queryFn: async () => {
      if (relationshipIds.length === 0) return [];
      const { data } = await supabase
        .from('discipleship_progress')
        .select('relationship_id, milestone')
        .in('relationship_id', relationshipIds);
      return data || [];
    },
    enabled: relationshipIds.length > 0,
  });

  const stats = useMemo(() => {
    const total = relationships?.length || 0;
    const active = relationships?.filter(r => r.status === 'active').length || 0;
    const completed = relationships?.filter(r => r.status === 'completed').length || 0;

    // Success rate: relationships where disciple reached 'became_member' milestone
    const successRelationships = new Set(
      progressData?.filter(p => p.milestone === 'became_member').map(p => p.relationship_id) || []
    );
    const successRate = total > 0 ? Math.round((successRelationships.size / total) * 100) : 0;

    // 30-day growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = relationships?.filter(r => 
      r.created_at && new Date(r.created_at) > thirtyDaysAgo
    ).length || 0;
    const previousTotal = total - recentCount;
    const growthRate = previousTotal > 0 ? Math.round((recentCount / previousTotal) * 100) : (recentCount > 0 ? 100 : 0);

    return { total, active, completed, successRate, growthRate, recentCount };
  }, [relationships, progressData]);

  const filteredRelationships = useMemo(() => {
    return relationships?.filter(relationship => {
      const mentorName = `${relationship.mentor?.profiles?.last_name} ${relationship.mentor?.profiles?.first_name}`.toLowerCase();
      const discipleName = `${relationship.disciple?.profiles?.last_name} ${relationship.disciple?.profiles?.first_name}`.toLowerCase();
      const searchMatch = mentorName.includes(searchTerm.toLowerCase()) || discipleName.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || relationship.status === statusFilter;
      return searchMatch && statusMatch;
    }) || [];
  }, [relationships, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const name = (p?: { last_name?: string | null; first_name?: string | null } | null) =>
    `${p?.last_name || ''} ${p?.first_name || ''}`.trim() || 'Unknown';

  const activeRate = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;
  const completedRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const countBy = (s: string) => relationships?.filter(r => (r.status || 'active') === s).length || 0;

  const rowMenu = (relationship: DiscipleshipRelationshipWithMembers) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} aria-label="Relationship actions"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setSelectedRelationship(relationship)}>
          <Settings2 className="h-4 w-4 mr-2" /> Manage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteTarget(relationship)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      {/* Hero + KPI tiles */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HeroCard eyebrow="Discipleship relationships" value={isLoading ? '…' : stats.total}
            sub={<>+{stats.recentCount} in the last 30 days · {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}% growth</>}
            ring={stats.successRate} ringLabel="Success" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <RingTile icon={Clock} label="Active" value={stats.active} ring={activeRate} ringLabel="of all" tone="var(--chart-2)"
            active={statusFilter === 'active'} onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')} />
          <RingTile icon={CheckCircle} label="Completed" value={stats.completed} ring={completedRate} ringLabel="of all" tone="var(--chart-3)"
            active={statusFilter === 'completed'} onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')} />
        </div>
      </div>

      {/* Search + actions */}
      <div className="flex items-center gap-2">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search mentors or disciples" />
        <RoundButton icon={UserPlus} label="Assign relationship" primary onClick={() => setIsAssignDialogOpen(true)} />
      </div>

      <ChipRow value={statusFilter} onChange={setStatusFilter} options={[
        { value: 'all', label: 'All', count: stats.total },
        { value: 'active', label: 'Active', count: countBy('active') },
        { value: 'completed', label: 'Completed', count: countBy('completed') },
        { value: 'transferred', label: 'Transferred', count: countBy('transferred') },
        { value: 'inactive', label: 'Inactive', count: countBy('inactive') },
      ]} />

      {isLoading || !userRegion ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : error ? (
        <EmptyState icon={Heart} title="Couldn't load relationships" hint="Please refresh and try again." />
      ) : filteredRelationships.length === 0 ? (
        <EmptyState icon={Heart}
          title={searchTerm || statusFilter !== 'all' ? 'No relationships match your filters' : 'No discipleship relationships yet'}
          hint={searchTerm || statusFilter !== 'all' ? 'Try another search or filter.' : 'Pair a mentor with a disciple to get started.'}
          action={!searchTerm && statusFilter === 'all' ? (
            <Button onClick={() => setIsAssignDialogOpen(true)} className="gap-2 rounded-full"><UserPlus className="h-4 w-4" /> Assign relationship</Button>
          ) : undefined} />
      ) : (
        <>
          {/* Mobile / tablet cards */}
          <ul className="space-y-2 lg:hidden">
            {filteredRelationships.map((r) => (
              <li key={r.id}>
                <div role="button" tabIndex={0} onClick={() => setSelectedRelationship(r)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedRelationship(r)}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]">
                  <div className="relative shrink-0">
                    <Initials first={r.disciple?.profiles?.first_name} last={r.disciple?.profiles?.last_name} />
                    <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-card">
                      <Initials size="sm" first={r.mentor?.profiles?.first_name} last={r.mentor?.profiles?.last_name} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pl-1">
                    <p className="truncate font-semibold text-foreground">{name(r.disciple?.profiles)}</p>
                    <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                      <span className="shrink-0">Mentor</span><ArrowRight className="h-3 w-3 shrink-0" /><span className="truncate">{name(r.mentor?.profiles)}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill status={r.status || 'active'} />
                      {r.start_date && <span className="text-[11px] text-muted-foreground">Since {format(new Date(r.start_date), 'dd/MM/yyyy')}</span>}
                    </div>
                  </div>
                  {rowMenu(r)}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Disciple</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelationships.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedRelationship(r)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Initials size="sm" first={r.disciple?.profiles?.first_name} last={r.disciple?.profiles?.last_name} />
                        <span className="font-medium">{name(r.disciple?.profiles)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Initials size="sm" first={r.mentor?.profiles?.first_name} last={r.mentor?.profiles?.last_name} />
                        <span>{name(r.mentor?.profiles)}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusPill status={r.status || 'active'} /></TableCell>
                    <TableCell className="text-muted-foreground">{r.start_date ? format(new Date(r.start_date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{rowMenu(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AssignDiscipleDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
      />

      <ManageDiscipleshipDialog
        relationship={selectedRelationship}
        isOpen={!!selectedRelationship}
        onOpenChange={(open) => !open && setSelectedRelationship(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this discipleship relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This will permanently remove the relationship between{' '}
                  <span className="font-medium">
                    {deleteTarget.mentor?.profiles?.last_name} {deleteTarget.mentor?.profiles?.first_name}
                  </span>{' '}
                  and{' '}
                  <span className="font-medium">
                    {deleteTarget.disciple?.profiles?.last_name} {deleteTarget.disciple?.profiles?.first_name}
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Discipleship;
