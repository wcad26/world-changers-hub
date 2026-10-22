import { useMemo, useState } from 'react';
import { Calendar, Users, Flame, Heart, CheckCircle2, XCircle, TrendingUp, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemberDetailedAttendance } from '@/hooks/useAttendance';
import { Segmented, EmptyState } from '@/components/member/MemberUI';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Period = '1m' | '3m' | '6m' | '1y';
type TypeFilter = 'all' | 'regional' | 'dcg' | 'prayer';
const MONTHS: Record<Period, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

function Ring({ value, size = 88 }: { value: number; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(value / 100) * 97.4} 97.4`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-heading text-lg font-bold">{value}%</span>
    </div>
  );
}

export default function MemberAttendance() {
  const { memberRecord, userRegion } = useAuth();
  const [period, setPeriod] = useState<Period>('3m');
  const [type, setType] = useState<TypeFilter>('all');

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - MONTHS[period]);
    return { from, to };
  }, [period]);

  const { data, isLoading } = useMemberDetailedAttendance(memberRecord?.id, userRegion?.id, range);
  const rate = data?.overall.rate || 0;
  const dots = isLoading ? '…' : null;

  const groups = [
    { key: 'regional' as const, label: 'Services', icon: Calendar, tone: 'var(--chart-6)', v: data?.regional },
    { key: 'dcg' as const, label: 'DCG', icon: Users, tone: 'var(--chart-5)', v: data?.dcg },
    { key: 'prayer' as const, label: 'Prayer', icon: Heart, tone: 'var(--chart-7)', v: data?.prayerMeeting },
  ];

  const events = (data?.recentEvents ?? []).filter((e) => type === 'all' || e.type === type);
  const trend = data?.monthlyTrend ?? [];

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      <Segmented<Period> full value={period} onChange={setPeriod} options={[
        { value: '1m', label: '1M' }, { value: '3m', label: '3M' }, { value: '6m', label: '6M' }, { value: '1y', label: '1Y' }]} />

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          {isLoading ? <div className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full border-4 border-primary-foreground/20 font-heading text-lg">…</div> : <Ring value={rate} />}
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-80">Overall attendance</p>
            <p className="font-heading text-2xl font-bold leading-tight">{dots ?? data?.overall.attended ?? 0}<span className="text-base font-medium opacity-80"> of {dots ?? data?.overall.total ?? 0}</span></p>
            <p className="mt-1 flex items-center gap-1 text-xs opacity-85"><Flame className="h-3.5 w-3.5" />{dots ?? data?.streak ?? 0} in a row</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {groups.map((g) => {
          const pct = g.v?.total ? Math.round((g.v.attended / g.v.total) * 100) : 0;
          return (
            <button key={g.key} type="button" onClick={() => setType(type === g.key ? 'all' : g.key)}
              className={cn('min-w-0 rounded-2xl border bg-card p-3 text-left transition-colors sm:p-4', type === g.key ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-muted/50')}>
              <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${g.tone} 15%, transparent)`, color: g.tone }}><g.icon className="h-4 w-4" /></span>
              <p className="mt-2 truncate text-[11px] font-medium text-muted-foreground">{g.label}</p>
              <p className="font-heading text-lg font-bold text-foreground">{dots ?? `${g.v?.attended ?? 0}/${g.v?.total ?? 0}`}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.tone }} /></div>
            </button>
          );
        })}
      </div>

      {trend.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><TrendingUp className="h-4 w-4 text-primary" />Monthly rhythm</p>
          <div className="flex h-28 items-end gap-2">
            {trend.map((m) => (
              <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground">{m.rate}%</span>
                <div className="flex h-20 w-full items-end rounded-md bg-muted/60">
                  <div className="w-full rounded-md bg-primary" style={{ height: `${Math.max(m.rate, 3)}%` }} />
                </div>
                <span className="truncate text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-base font-semibold text-foreground">History</p>
          {type !== 'all' && <button type="button" onClick={() => setType('all')} className="text-xs font-semibold text-primary">Show all</button>}
        </div>
        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No meetings in this period" hint="Try a longer period above." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {events.map((e) => {
              const d = new Date(e.date);
              return (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-center text-primary">
                    <span className="font-heading text-base font-bold leading-none">{format(d, 'dd')}</span>
                    <span className="text-[10px] leading-none">{format(d, 'MM/yy')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{format(d, 'dd/MM/yyyy')} · {e.type === 'regional' ? 'Service' : e.type === 'dcg' ? 'DCG' : 'Prayer'}</p>
                  </div>
                  {e.attended
                    ? <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Present</span>
                    : <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive"><XCircle className="h-3.5 w-3.5" />Absent</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
