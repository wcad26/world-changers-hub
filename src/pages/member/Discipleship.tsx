import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, BookOpen, TrendingUp, Plus, Trophy, ChevronRight } from 'lucide-react';
import { useMemberDiscipleshipRelationships, useMemberDiscipleshipStats } from '@/hooks/useDiscipleship';
import { useAuth } from '@/hooks/useAuth';
import { AddProgressDialog } from '@/components/member/discipleship/AddProgressDialog';
import { ScheduleMeetingDialog } from '@/components/member/discipleship/ScheduleMeetingDialog';
import { ProgressSummaryDialog } from '@/components/member/discipleship/ProgressSummaryDialog';
import { EmptyState } from '@/components/member/MemberUI';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function Ring({ value, label, tone }: { value: number; label: string; tone: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--muted)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={tone} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(v / 100) * 97.4} 97.4`} className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">
        <span className="text-sm font-bold leading-none text-foreground">{Math.round(v)}%</span>
        <span className="sr-only">{label}</span>
      </span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, ringValue, ringLabel, tone }: { icon: any; label: string; value: number; ringValue: number; ringLabel: string; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }} />
      <div className="relative flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}><Icon className="h-4 w-4" /></span>
          <p className="mt-3 font-heading text-3xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring value={ringValue} label={ringLabel} tone={tone} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{ringLabel}</span>
        </div>
      </div>
    </div>
  );
}

type Tab = 'mentoring' | 'mentor';

export default function MemberDiscipleship() {
  const { memberId } = useAuth();
  const { data: relationships, isLoading: l1 } = useMemberDiscipleshipRelationships(memberId || undefined);
  const { data: stats, isLoading: l2 } = useMemberDiscipleshipStats(memberId || undefined);
  const [tab, setTab] = useState<Tab>('mentoring');

  if (l1 || l2) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const s = stats || { total_disciples: 0, active_disciples: 0, completed_disciples: 0, success_rate: 0 };
  const activePct = s.total_disciples ? (s.active_disciples / s.total_disciples) * 100 : 0;
  const mentoring = relationships?.asMentor || [];
  const mentors = relationships?.asDisciple || [];
  const list = tab === 'mentoring' ? mentoring : mentors;

  const name = (p: any) => `${p?.profiles?.last_name || ''} ${p?.profiles?.first_name || ''}`.trim();
  const ini = (p: any) => `${(p?.profiles?.last_name || '').charAt(0)}${(p?.profiles?.first_name || '').charAt(0)}`.toUpperCase() || '?';

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard icon={Users} label="Disciples" value={s.total_disciples} ringValue={activePct} ringLabel={`${s.active_disciples} active`} tone="var(--chart-1)" />
        <KpiCard icon={Trophy} label="Completed" value={s.completed_disciples} ringValue={s.success_rate} ringLabel="Success" tone="var(--chart-6)" />
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/50 p-1 sm:inline-grid sm:w-auto">
        {([['mentoring', "I'm mentoring", mentoring.length], ['mentor', 'My mentor', mentors.length]] as const).map(([v, label, n]) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            className={cn('flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              tab === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {label}
            <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px]', tab === v ? 'bg-primary-foreground/20' : 'bg-background')}>{n}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        tab === 'mentoring'
          ? <EmptyState icon={Users} title="No disciples yet" hint="You haven't been assigned anyone to mentor yet." />
          : <EmptyState icon={BookOpen} title="No mentor assigned" hint="Speak with your branch leadership to be paired with a mentor." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:border-0 md:bg-transparent">
          {list.map((r: any, i: number) => {
            const isMentor = tab === 'mentoring';
            const person = isMentor ? r.disciple : r.mentor;
            const nm = name(person) || 'Unknown';
            const active = r.status === 'active';
            return (
              <article key={r.id} className={cn('p-4 md:rounded-2xl md:border md:border-border md:bg-card', i > 0 && 'border-t border-border md:border-t')}>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground">{ini(person)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{nm}</p>
                    <p className="truncate text-xs text-muted-foreground">{isMentor ? 'Disciple' : 'Mentor'} · since {r.start_date ? format(new Date(r.start_date), 'dd/MM/yyyy') : 'N/A'}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>{r.status}</span>
                </div>
                {r.notes && <p className="mt-3 line-clamp-2 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{r.notes}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {isMentor ? (
                    <>
                      <AddProgressDialog relationshipId={r.id} discipleName={nm}><Button size="sm" className="w-full rounded-xl"><Plus className="h-4 w-4" />Progress</Button></AddProgressDialog>
                      <ScheduleMeetingDialog discipleName={nm}><Button size="sm" variant="outline" className="w-full rounded-xl"><Calendar className="h-4 w-4" />Meet</Button></ScheduleMeetingDialog>
                      <ProgressSummaryDialog relationshipId={r.id} discipleName={nm}><Button size="sm" variant="outline" className="w-full rounded-xl"><TrendingUp className="h-4 w-4" />Summary</Button></ProgressSummaryDialog>
                    </>
                  ) : (
                    <>
                      <ProgressSummaryDialog relationshipId={r.id} discipleName="My"><Button size="sm" className="col-span-2 w-full rounded-xl"><TrendingUp className="h-4 w-4" />My progress<ChevronRight className="h-4 w-4" /></Button></ProgressSummaryDialog>
                      <ScheduleMeetingDialog discipleName={nm}><Button size="sm" variant="outline" className="w-full rounded-xl"><Calendar className="h-4 w-4" />Meet</Button></ScheduleMeetingDialog>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
