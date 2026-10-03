import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Target, BookOpen, TrendingUp } from 'lucide-react';
import { useMemberDiscipleshipRelationships, useMemberDiscipleshipStats } from '@/hooks/useDiscipleship';
import { useAuth } from '@/hooks/useAuth';
import { AddProgressDialog } from '@/components/member/discipleship/AddProgressDialog';
import { ScheduleMeetingDialog } from '@/components/member/discipleship/ScheduleMeetingDialog';
import { ProgressSummaryDialog } from '@/components/member/discipleship/ProgressSummaryDialog';
import { StatTile, EmptyState, pillTabsList, pillTabsTrigger } from '@/components/member/MemberUI';
import { format } from 'date-fns';
export default function MemberDiscipleship() {
  const {
    memberId
  } = useAuth();
  const {
    data: relationships,
    isLoading: isLoadingRelationships
  } = useMemberDiscipleshipRelationships(memberId || undefined);
  const {
    data: stats,
    isLoading: isLoadingStats
  } = useMemberDiscipleshipStats(memberId || undefined);
  const isLoading = isLoadingRelationships || isLoadingStats;
  if (isLoading) {
    return <>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </>;
  }

  // Default stats if none exist
  const displayStats = stats || {
    total_disciples: 0,
    active_disciples: 0,
    completed_disciples: 0,
    success_rate: 0
  };
  const name = (p: any) => `${p?.profiles?.last_name || ''} ${p?.profiles?.first_name || ''}`.trim();
  const ini = (p: any) => `${(p?.profiles?.last_name || '').charAt(0)}${(p?.profiles?.first_name || '').charAt(0)}`.toUpperCase() || '?';
  const RelCard = ({ r, mentor }: { r: any; mentor: boolean }) => {
    const person = mentor ? r.disciple : r.mentor;
    return <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground">{ini(person)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{name(person) || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{mentor ? 'Disciple' : 'Mentor'} · since {r.start_date ? format(new Date(r.start_date), 'dd/MM/yyyy') : 'N/A'}</p>
          </div>
          <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="capitalize">{r.status}</Badge>
        </div>
        {r.notes && <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{r.notes}</p>}
        <div className="flex flex-wrap gap-2">
          {mentor ? <>
              <AddProgressDialog relationshipId={r.id} discipleName={name(person)}><Button size="sm">+ Progress</Button></AddProgressDialog>
              <ScheduleMeetingDialog discipleName={name(person)}><Button size="sm" variant="outline"><Calendar className="mr-1 h-4 w-4" />Schedule</Button></ScheduleMeetingDialog>
              <ProgressSummaryDialog relationshipId={r.id} discipleName={name(person)}><Button size="sm" variant="outline"><TrendingUp className="mr-1 h-4 w-4" />Summary</Button></ProgressSummaryDialog>
            </> : <>
              <ProgressSummaryDialog relationshipId={r.id} discipleName="My"><Button size="sm"><TrendingUp className="mr-1 h-4 w-4" />My progress</Button></ProgressSummaryDialog>
              <ScheduleMeetingDialog discipleName={name(person)}><Button size="sm" variant="outline"><Calendar className="mr-1 h-4 w-4" />Schedule meeting</Button></ScheduleMeetingDialog>
            </>}
        </div>
      </article>;
  };
  return <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Disciples" value={displayStats.total_disciples} icon={Users} tone="var(--chart-1)" />
        <StatTile label="Active" value={displayStats.active_disciples} icon={Target} tone="var(--chart-5)" />
        <StatTile label="Completed" value={displayStats.completed_disciples} icon={Calendar} tone="var(--chart-6)" />
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Success rate</p>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground">{Math.round(displayStats.success_rate)}%</p>
          <Progress value={displayStats.success_rate} className="mt-2 h-2" />
        </div>
      </div>

      <Tabs defaultValue="mentoring" className="space-y-4">
        <TabsList className={pillTabsList}>
          <TabsTrigger value="mentoring" className={pillTabsTrigger}>I'm mentoring ({relationships?.asMentor?.length || 0})</TabsTrigger>
          <TabsTrigger value="being-mentored" className={pillTabsTrigger}>My mentor ({relationships?.asDisciple?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="mentoring">
          {!relationships?.asMentor?.length ? <EmptyState icon={Users} title="No disciples yet" hint="You haven't been assigned anyone to mentor yet." /> : <div className="grid gap-4 md:grid-cols-2">
              {relationships.asMentor.map((r: any) => <RelCard key={r.id} r={r} mentor />)}
            </div>}
        </TabsContent>
        <TabsContent value="being-mentored">
          {!relationships?.asDisciple?.length ? <EmptyState icon={BookOpen} title="No mentor assigned" hint="Speak with your branch leadership to be paired with a mentor." /> : <div className="grid gap-4 md:grid-cols-2">
              {relationships.asDisciple.map((r: any) => <RelCard key={r.id} r={r} mentor={false} />)}
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
}
