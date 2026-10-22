import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, HandCoins, Wallet, CalendarClock, Target, ChevronRight, Sparkles, Flame } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { format, differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '@/utils/currencyUtils';
import { EmptyState, Segmented } from '@/components/member/MemberUI';
import { MemberGiveSheet } from '@/components/member/MemberGiveSheet';
import { cn } from '@/lib/utils';

// Units: campaign goal/raised and donation amounts are stored in minor units (x100);
// pledge amounts are stored in major units.
type Campaign = { id: string; name: string; description: string | null; image_url: string | null; goal: number; raised: number; currency_code: string; end_date: string | null; region_id: string | null };

function campaignStats(c: Campaign) {
  const goal = Number(c.goal || 0) / 100;
  const raised = Number(c.raised || 0) / 100;
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const days = c.end_date ? differenceInCalendarDays(new Date(c.end_date), new Date()) : null;
  const label = pct >= 100 ? 'Goal reached' : days === null ? 'Ongoing' : days > 0 ? `${days} days left` : 'Last day';
  return { goal, raised, pct, days, label };
}

function Ring({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-primary-foreground/25" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} className="text-primary-foreground" />
    </svg>
  );
}

export default function MemberFundraising() {
  const { userRegion, memberRecord } = useAuth();
  const memberId = memberRecord?.id;
  const [tab, setTab] = useState<'campaigns' | 'history'>('campaigns');
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [giveTo, setGiveTo] = useState<Campaign | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['member-campaigns', userRegion?.id],
    queryFn: async () => {
      let q = supabase.from('fundraising_campaigns').select('*').eq('status', 'active').order('start_date', { ascending: false });
      q = userRegion?.id ? q.or(`region_id.eq.${userRegion.id},region_id.is.null`) : q.is('region_id', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Campaign[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ['member-giving', memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const [p, d] = await Promise.all([
        supabase.from('fundraising_pledges').select('id, amount, currency_code, status, created_at, campaign_id, fundraising_campaigns(name)').eq('member_id', memberId!).order('created_at', { ascending: false }),
        supabase.from('fundraising_donations').select('id, amount, currency_code, status, donation_date, campaign_id, fundraising_campaigns(name)').eq('member_id', memberId!).order('donation_date', { ascending: false }),
      ]);
      return { pledges: (p.data || []) as any[], donations: (d.data || []) as any[] };
    },
  });

  const pledges = (mine?.pledges || []).filter((p) => p.status !== 'cancelled');
  const donations = (mine?.donations || []).filter((d) => d.status !== 'failed');
  const completed = donations.filter((d) => (d.status ?? 'completed') === 'completed');
  const cur = campaigns?.[0]?.currency_code || pledges[0]?.currency_code || 'XAF';
  const pledgedTotal = pledges.reduce((s, p) => s + Number(p.amount || 0), 0);
  const givenTotal = completed.reduce((s, d) => s + Number(d.amount || 0) / 100, 0);
  const fulfilled = pledgedTotal > 0 ? Math.min(100, Math.round((givenTotal / pledgedTotal) * 100)) : 0;
  const featured = campaigns?.[0];
  const rest = campaigns?.slice(1) ?? [];

  const history = useMemo(() => [
    ...pledges.map((p) => ({ ...p, kind: 'Pledge', when: p.created_at, value: Number(p.amount) })),
    ...donations.map((d) => ({ ...d, kind: 'Gift', when: d.donation_date, value: Number(d.amount) / 100 })),
  ].sort((a, b) => +new Date(b.when) - +new Date(a.when)), [pledges, donations]);

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Summary */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-80">My campaign giving</p>
            <p className="mt-1 truncate font-heading text-2xl font-bold sm:text-3xl">{formatCurrency(givenTotal, cur)}</p>
            <p className="mt-1 text-xs opacity-80">{completed.length} gift(s) · {formatCurrency(pledgedTotal, cur)} pledged</p>
          </div>
          <div className="relative grid shrink-0 place-items-center">
            <Ring pct={fulfilled} />
            <span className="absolute text-xs font-bold">{fulfilled}%</span>
          </div>
        </div>
        <p className="relative mt-3 text-[11px] opacity-80">Pledges fulfilled</p>
      </section>

      <Segmented<'campaigns' | 'history'> value={tab} onChange={setTab} options={[
        { value: 'campaigns', label: `Campaigns${campaigns?.length ? ` (${campaigns.length})` : ''}` },
        { value: 'history', label: 'My giving' },
      ]} />

      {tab === 'campaigns' && (
        isLoading ? (
          <div className="space-y-3"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : !featured ? (
          <EmptyState icon={Heart} title="No active campaigns" hint="New campaigns will appear here." />
        ) : (
          <div className="space-y-5">
            {/* Featured campaign */}
            {(() => { const s = campaignStats(featured); return (
              <article className="overflow-hidden rounded-2xl border border-border bg-card">
                <button type="button" onClick={() => setDetail(featured)} className="relative block h-44 w-full bg-gradient-to-br from-primary to-secondary text-left sm:h-56">
                  {featured.image_url && <img src={featured.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground"><Flame className="h-3 w-3 text-primary" />Featured</span>
                  <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground">{s.label}</span>
                  <h2 className="absolute bottom-3 left-4 right-4 line-clamp-2 font-heading text-xl font-bold text-background">{featured.name}</h2>
                </button>
                <div className="space-y-4 p-4">
                  {featured.description && <p className="line-clamp-2 text-sm text-muted-foreground">{featured.description}</p>}
                  <div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${s.pct}%` }} /></div>
                    <div className="mt-2 flex items-end justify-between gap-2 text-xs">
                      <span><b className="font-heading text-base text-foreground">{formatCurrency(s.raised, featured.currency_code)}</b><span className="text-muted-foreground"> raised</span></span>
                      <span className="text-muted-foreground">{Math.round(s.pct)}% of {formatCurrency(s.goal, featured.currency_code)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Button onClick={() => setGiveTo(featured)} className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-regal"><Heart className="mr-2 h-4 w-4" />Give now</Button>
                    <Button asChild variant="outline" className="h-12 rounded-full px-5"><Link to={`/fundraising/${featured.id}/pledge`}><HandCoins className="mr-2 h-4 w-4" />Pledge</Link></Button>
                  </div>
                </div>
              </article>
            ); })()}

            {rest.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">More campaigns</p>
                <ul className="grid gap-3 md:grid-cols-2">
                  {rest.map((c) => { const s = campaignStats(c); return (
                    <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <button type="button" onClick={() => setDetail(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary">
                          {c.image_url ? <img src={c.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Target className="absolute inset-0 m-auto h-6 w-6 text-primary-foreground/80" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{c.name}</span>
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} /></span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">{Math.round(s.pct)}% · {s.label}</span>
                        </span>
                      </button>
                      <Button size="sm" onClick={() => setGiveTo(c)} className="shrink-0 rounded-full">Give</Button>
                    </li>
                  ); })}
                </ul>
              </div>
            )}
          </div>
        )
      )}

      {tab === 'history' && (
        !history.length ? (
          <EmptyState icon={HandCoins} title="No pledges or gifts yet" hint="Support a campaign to see it here." action={<Button size="sm" onClick={() => setTab('campaigns')}>Browse campaigns</Button>} />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((x) => (
              <li key={x.kind + x.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', x.kind === 'Gift' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary')}>
                  {x.kind === 'Gift' ? <Wallet className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{x.fundraising_campaigns?.name || 'Campaign'}</p>
                  <p className="text-xs text-muted-foreground">{x.kind} · {format(new Date(x.when), 'dd/MM/yyyy')}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(x.value, x.currency_code)}</p>
                  <p className={cn('text-[11px] capitalize', x.status === 'pending' ? 'text-warning' : 'text-muted-foreground')}>{x.status || 'completed'}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Campaign details */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-card p-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-lg">
          {detail && (() => { const s = campaignStats(detail); return (<>
            <div className="relative h-48 bg-gradient-to-br from-primary to-secondary">
              {detail.image_url && <img src={detail.image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="space-y-4 px-5 pt-4">
              <SheetHeader className="text-left">
                <SheetTitle className="font-heading text-xl">{detail.name}</SheetTitle>
                <SheetDescription className="whitespace-pre-line">{detail.description || 'Thank you for supporting this campaign.'}</SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">Raised</p><p className="truncate text-sm font-bold">{formatCurrency(s.raised, detail.currency_code)}</p></div>
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">Goal</p><p className="truncate text-sm font-bold">{formatCurrency(s.goal, detail.currency_code)}</p></div>
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">Progress</p><p className="text-sm font-bold">{Math.round(s.pct)}%</p></div>
              </div>
              {detail.end_date && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-4 w-4" />Ends {format(new Date(detail.end_date), 'dd/MM/yyyy')} · {s.label}</p>}
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Button onClick={() => { setGiveTo(detail); setDetail(null); }} className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground"><Sparkles className="mr-2 h-4 w-4" />Give now</Button>
                <Button asChild variant="outline" className="h-12 rounded-full"><Link to={`/fundraising/${detail.id}/pledge`}>Pledge<ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
            </div>
          </>); })()}
        </SheetContent>
      </Sheet>

      <MemberGiveSheet open={!!giveTo} onOpenChange={(o) => !o && setGiveTo(null)} currency={giveTo?.currency_code || cur}
        campaign={giveTo ? { id: giveTo.id, name: giveTo.name, regionId: giveTo.region_id } : null} />
    </div>
  );
}
