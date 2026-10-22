import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, HandCoins, Target, ChevronRight, Flame, Globe } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '@/utils/currencyUtils';
import { EmptyState, Segmented } from '@/components/member/MemberUI';
import { MemberGiveSheet } from '@/components/member/MemberGiveSheet';
import { cn } from '@/lib/utils';

// Units: campaign goal/raised and donation amounts are stored in minor units (x100);
// pledge amounts are stored in major units.
export type Campaign = { id: string; name: string; description: string | null; image_url: string | null; goal: number; raised: number; currency_code: string; end_date: string | null; region_id: string | null; region_name: string | null };

export function campaignStats(c: Campaign) {
  const goal = Number(c.goal || 0) / 100;
  const raised = Number(c.raised || 0) / 100;
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const days = c.end_date ? differenceInCalendarDays(new Date(c.end_date), new Date()) : null;
  const label = pct >= 100 ? 'Goal reached' : days === null ? 'Ongoing' : days > 0 ? `${days} days left` : 'Last day';
  return { goal, raised, pct, days, label };
}

export function Ring({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-primary-foreground/25" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} className="text-primary-foreground" />
    </svg>
  );
}

export default function MemberFundraising() {
  const { memberRecord } = useAuth();
  const memberId = memberRecord?.id;
  const [tab, setTab] = useState<'pledges' | 'campaigns'>('pledges');
  const [regionFilter, setRegionFilter] = useState('all');
  const [giveTo, setGiveTo] = useState<Campaign | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['member-campaigns-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select('*, regions(name)')
        .eq('status', 'active')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({ ...c, region_name: c.regions?.name ?? null })) as Campaign[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ['member-giving', memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const [p, d] = await Promise.all([
        supabase.from('fundraising_pledges').select('id, amount, currency_code, status, created_at, campaign_id, fundraising_campaigns(name, image_url)').eq('member_id', memberId!).order('created_at', { ascending: false }),
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

  // Campaigns the member has pledged on, with their own totals.
  const myPledges = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string | null; currency: string; pledged: number; given: number }>();
    for (const p of pledges) {
      const e = map.get(p.campaign_id) || { id: p.campaign_id, name: p.fundraising_campaigns?.name || 'Campaign', image: p.fundraising_campaigns?.image_url ?? null, currency: p.currency_code || cur, pledged: 0, given: 0 };
      e.pledged += Number(p.amount || 0);
      map.set(p.campaign_id, e);
    }
    for (const d of completed) {
      const e = map.get(d.campaign_id);
      if (e) e.given += Number(d.amount || 0) / 100;
    }
    return [...map.values()];
  }, [pledges, completed, cur]);

  const regionOptions = useMemo(() => {
    const seen = new Map<string, string>();
    let hasGlobal = false;
    for (const c of campaigns || []) {
      if (c.region_id && c.region_name) seen.set(c.region_id, c.region_name);
      else if (!c.region_id) hasGlobal = true;
    }
    return [
      { id: 'all', label: 'All regions' },
      ...(hasGlobal ? [{ id: 'global', label: 'Global' }] : []),
      ...[...seen.entries()].map(([id, label]) => ({ id, label })),
    ];
  }, [campaigns]);

  const filtered = (campaigns || []).filter((c) =>
    regionFilter === 'all' ? true : regionFilter === 'global' ? !c.region_id : c.region_id === regionFilter);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      {/* Summary */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-80">My campaign giving</p>
            <p className="mt-1 truncate font-heading text-2xl font-bold sm:text-3xl">{formatCurrency(givenTotal, cur)}</p>
            <p className="mt-1 text-xs opacity-80">{formatCurrency(pledgedTotal, cur)} pledged across {myPledges.length} campaign{myPledges.length === 1 ? '' : 's'}</p>
          </div>
          <div className="relative grid shrink-0 place-items-center">
            <Ring pct={fulfilled} />
            <span className="absolute text-xs font-bold">{fulfilled}%</span>
          </div>
        </div>
      </section>

      <Segmented<'pledges' | 'campaigns'> full value={tab} onChange={setTab} options={[
        { value: 'pledges', label: `My Pledges${myPledges.length ? ` (${myPledges.length})` : ''}` },
        { value: 'campaigns', label: 'Campaigns' },
      ]} />

      {tab === 'pledges' && (
        !mine ? (
          <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : !myPledges.length ? (
          <EmptyState icon={HandCoins} title="No pledges yet" hint="Pledge to a campaign to track it here." action={<Button size="sm" onClick={() => setTab('campaigns')}>Browse campaigns</Button>} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {myPledges.map((p) => {
              const pct = p.pledged > 0 ? Math.min(100, Math.round((p.given / p.pledged) * 100)) : 0;
              return (
                <li key={p.id}>
                  <Link to={`/member/fundraising/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary">
                      {p.image ? <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <HandCoins className="absolute inset-0 m-auto h-6 w-6 text-primary-foreground/80" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{p.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{formatCurrency(p.given, p.currency)} given of {formatCurrency(p.pledged, p.currency)}</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-heading text-sm font-bold text-foreground">{pct}%</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      )}

      {tab === 'campaigns' && (
        isLoading ? (
          <div className="space-y-3"><Skeleton className="h-10 rounded-full" /><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : !campaigns?.length ? (
          <EmptyState icon={Heart} title="No active campaigns" hint="New campaigns will appear here." />
        ) : (
          <div className="space-y-5">
            {regionOptions.length > 2 && (
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
                {regionOptions.map((r) => (
                  <button key={r.id} type="button" onClick={() => setRegionFilter(r.id)} className={cn('flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    regionFilter === r.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
                    {r.id === 'global' && <Globe className="h-3 w-3" />}{r.label}
                  </button>
                ))}
              </div>
            )}

            {!featured ? (
              <EmptyState icon={Heart} title="No campaigns here" hint="Try another region filter." action={<Button size="sm" variant="outline" onClick={() => setRegionFilter('all')}>Show all regions</Button>} />
            ) : (<>
              {/* Featured campaign */}
              {(() => { const s = campaignStats(featured); return (
                <article className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Link to={`/member/fundraising/${featured.id}`} className="relative block h-44 w-full bg-gradient-to-br from-primary to-secondary text-left sm:h-56">
                    {featured.image_url && <img src={featured.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground"><Flame className="h-3 w-3 text-primary" />Featured</span>
                    <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground">{s.label}</span>
                    <h2 className="absolute bottom-3 left-4 right-4 line-clamp-2 font-heading text-xl font-bold text-background">{featured.name}</h2>
                  </Link>
                  <div className="space-y-4 p-4">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{featured.region_name ? <Target className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}{featured.region_name || 'Global campaign'}</p>
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
                        <Link to={`/member/fundraising/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary">
                            {c.image_url ? <img src={c.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Target className="absolute inset-0 m-auto h-6 w-6 text-primary-foreground/80" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">{c.name}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{c.region_name || 'Global'}</span>
                            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} /></span>
                            <span className="mt-1 block text-[11px] text-muted-foreground">{Math.round(s.pct)}% · {s.label}</span>
                          </span>
                        </Link>
                        <Button size="sm" onClick={() => setGiveTo(c)} className="shrink-0 rounded-full">Give</Button>
                      </li>
                    ); })}
                  </ul>
                </div>
              )}
            </>)}
          </div>
        )
      )}

      <MemberGiveSheet open={!!giveTo} onOpenChange={(o) => !o && setGiveTo(null)} currency={giveTo?.currency_code || cur}
        campaign={giveTo ? { id: giveTo.id, name: giveTo.name, regionId: giveTo.region_id } : null} />
    </div>
  );
}
