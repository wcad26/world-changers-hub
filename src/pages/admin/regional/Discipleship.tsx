import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, UserPlus, Users, TrendingUp, TrendingDown, CheckCircle, Clock, Search, Target, Trash2, MoreHorizontal, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscipleshipRelationships, useDeleteDiscipleshipRelationship, type DiscipleshipRelationshipWithMembers } from '@/hooks/useDiscipleship';
import AssignDiscipleDialog from '@/components/admin/regional/discipleship/AssignDiscipleDialog';
import ManageDiscipleshipDialog from '@/components/admin/regional/discipleship/ManageDiscipleshipDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { GlassSection, GlassSectionHeader } from '@/components/ui/GlassSection';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Discipleship: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: relationships, isLoading, error } = useDiscipleshipRelationships(userRegion?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<DiscipleshipRelationshipWithMembers | null>(null);

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

  const kpiCards = [
    {
      label: 'Total Relationships',
      value: stats.total,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: Clock,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
      growth: stats.growthRate,
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
      subtitle: 'Reached membership milestone',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-md hover:border-border/60"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 w-20 bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-2 mt-1">
                  {kpi.growth !== undefined && (
                    <span className={`flex items-center text-xs font-medium ${kpi.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {kpi.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {kpi.growth >= 0 ? '+' : ''}{kpi.growth}% (30d)
                    </span>
                  )}
                  {kpi.subtitle && (
                    <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <GlassSection>
        <GlassSectionHeader
          icon={<Heart className="h-5 w-5" />}
          title="Discipleship Relationships"
          description="Manage mentor-disciple relationships and track progress"
          action={
            <Button onClick={() => setIsAssignDialogOpen(true)} className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" />
              Assign Relationship
            </Button>
          }
        />

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors or disciples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/60"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-background/60">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Mentor</TableHead>
                <TableHead>Disciple</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !userRegion ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="animate-pulse rounded-lg bg-muted h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-destructive">Error loading relationships</TableCell>
                </TableRow>
              ) : filteredRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No relationships match your filters'
                      : 'No discipleship relationships found. Create your first one!'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredRelationships.map((relationship) => (
                  <TableRow key={relationship.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {relationship.mentor?.profiles?.last_name} {relationship.mentor?.profiles?.first_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {relationship.mentor?.member_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {relationship.disciple?.profiles?.last_name} {relationship.disciple?.profiles?.first_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {relationship.disciple?.member_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(relationship.status || 'active')}>
                        {relationship.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {relationship.start_date
                        ? new Date(relationship.start_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {relationship.notes ? (
                        <p className="text-sm truncate" title={relationship.notes}>
                          {relationship.notes}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRelationship(relationship);
                          }}
                        >
                          Manage
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deleteRelationship.isPending}
                              aria-label="Delete relationship"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this discipleship relationship?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the relationship between{' '}
                                <span className="font-medium">
                                  {relationship.mentor?.profiles?.last_name} {relationship.mentor?.profiles?.first_name}
                                </span>{' '}
                                and{' '}
                                <span className="font-medium">
                                  {relationship.disciple?.profiles?.last_name} {relationship.disciple?.profiles?.first_name}
                                </span>
                                . This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(relationship.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassSection>

      <AssignDiscipleDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
      />

      <ManageDiscipleshipDialog
        relationship={selectedRelationship}
        isOpen={!!selectedRelationship}
        onOpenChange={(open) => !open && setSelectedRelationship(null)}
      />
    </div>
  );
};

export default Discipleship;
