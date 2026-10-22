import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarClock, Globe, HandCoins, Heart, Sparkles, Target, Wallet } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currencyUtils';
import { EmptyState } from '@/components/member/MemberUI';
import { MemberGiveSheet } from '@/components/member/MemberGiveSheet';
import { campaignStats, Ring, type Campaign } from './Fundraising';
import { cn } from '@/lib/utils';

/** Personal campaign page: the member's own pledge, gifts and history for one campaign. */
export default function MemberFundraisingCampaign({ campaignId }: { campaignId: string }) {
  const { memberRecord } = useAuth();
  const memberId = memberRecord?.id;
  const [give, setGive] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['member-campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fundraising_campaigns').select('*, regions(name)').eq('id', campaignId).maybeSingle();
      if (error) throw error;
      return (data ? { ...data, region_name: (data as any).regions?.name ?? null } : null) as Campaign | null;
    },
  });

  const { data: mine } = useQuery({
    queryKey: ['member-campaign-giving', memberId, campaignId],
    enabled: !!memberId,
    queryFn: async () => {
      const [p, d] = await Promise.all([
        supabase.from('fundraising_pledges').select('id, amount, currency_code, status, created_at').eq('member_id', memberId!).eq('campaign_id', campaignId).order('created_at', { ascending: false }),
        supabase.from('fundraising_donations').select('id, amount, currency_code, status, donation_date').eq('member_id', memberId!).eq('campaign_id', campaignId).order('donation_date', { ascending: false }),
      ]);
      return { pledges: (p.data || []) as any[], donations: (d.data || []) as any[] };
    },
  });

  const pledges = (mine?.pledges || []).filter((p) => p.status !== 'cancelled');
  const donations = (mine?.donations || []).filter((d) => d.status !== 'failed');
  const completed = donations.filter((d) => (d.status ?? 'completed') === 'completed');
  const cur = campaign?.currency_code || pledges[0]?.currency_code || 'XAF';
  const pledged = pledges.reduce((s, p) => s + Number(p.amount || 0), 0);
  const given = completed.reduce((s, d) => s + Number(d.amount || 0) / 100, 0);
  const pct = pledged > 0 ? Math.min(100, Math.round((given / pledged) * 100)) : 0;

  const history = useMemo(() => [
    ...pledges.map((p) => ({ ...p, kind: 'Pledge', when: p.created_at, value: Number(p.amount) })),
    ...donations.map((d) => ({ ...d, kind: 'Gift', when: d.donation_date, value: Number(d.amount) / 100 })),
  ].sort((a, b) => +new Date(b.when) - +new Date(a.when)), [pledges, donations]);

  if (isLoading) return <div className="space-y-4 pb-24"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  if (!campaign) return (
    <div className="space-y-4 pb-24">
      <Link to="/member/fundraising" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Fundraising</Link>
      <EmptyState icon={Heart} title="Campaign not found" hint="It may have ended or been removed." />
    </div>
  );

  const s = campaignStats(campaign);

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      <Link to="/member/fundraising" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Fundraising</Link>

      {/* Campaign header */}
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-40 bg-gradient-to-br from-primary to-secondary sm:h-52">
          {campaign.image_url && <img src={campaign.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground">{s.label}</span>
          <h1 className="absolute bottom-3 left-4 right-4 line-clamp-2 font-heading text-xl font-bold text-background">{campaign.name}</h1>
        </div>
        <div className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{campaign.region_name ? <Target className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}{campaign.region_name || 'Global campaign'}</p>
          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${s.pct}%` }} /></div>
            <div className="mt-2 flex items-end justify-between gap-2 text-xs">
              <span><b className="font-heading text-base text-foreground">{formatCurrency(s.raised, campaign.currency_code)}</b><span className="text-muted-foreground"> raised</span></span>
              <span className="text-muted-foreground">{Math.round(s.pct)}% of {formatCurrency(s.goal, campaign.currency_code)}</span>
            </div>
          </div>
          {campaign.end_date && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-4 w-4" />Ends {format(new Date(campaign.end_date), 'dd/MM/yyyy')}</p>}
        </div>
      </article>

      {/* My pledge KPI */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        {pledged > 0 ? (
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium opacity-80">My pledge given</p>
              <p className="mt-1 truncate font-heading text-2xl font-bold sm:text-3xl">{formatCurrency(given, cur)}</p>
              <p className="mt-1 text-xs opacity-80">of {formatCurrency(pledged, cur)} pledged</p>
            </div>
            <div className="relative grid shrink-0 place-items-center">
              <Ring pct={pct} />
              <span className="absolute text-xs font-bold">{pct}%</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-xs font-medium opacity-80">My pledge</p>
            <p className="mt-1 font-heading text-xl font-bold">You haven't pledged yet</p>
            <p className="mt-1 text-xs opacity-80">Pledge to this campaign to track your giving here.</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button onClick={() => setGive(true)} className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-regal"><Sparkles className="mr-2 h-4 w-4" />Give now</Button>
        <Button asChild variant="outline" className="h-12 rounded-full px-5"><Link to={`/fundraising/${campaign.id}/pledge`}><HandCoins className="mr-2 h-4 w-4" />Pledge</Link></Button>
      </div>

      {/* My contribution history */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">My contributions</p>
        {!history.length ? (
          <EmptyState icon={HandCoins} title="No contributions yet" hint="Your pledges and gifts to this campaign will appear here." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((x) => (
              <li key={x.kind + x.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', x.kind === 'Gift' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary')}>
                  {x.kind === 'Gift' ? <Wallet className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{x.kind}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(x.when), 'dd/MM/yyyy')}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(x.value, x.currency_code)}</p>
                  <p className={cn('text-[11px] capitalize', x.status === 'pending' ? 'text-warning' : 'text-muted-foreground')}>{x.status || 'completed'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MemberGiveSheet open={give} onOpenChange={setGive} currency={cur}
        campaign={{ id: campaign.id, name: campaign.name, regionId: campaign.region_id }} />
    </div>
  );
}
