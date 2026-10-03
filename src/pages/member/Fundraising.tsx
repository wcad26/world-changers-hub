import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Target, HandCoins, Wallet } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { format, differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '@/utils/currencyUtils';
import { StatTile, EmptyState, pillTabsList, pillTabsTrigger } from '@/components/member/MemberUI';

// Units: campaign goal/raised and donation amounts are stored in minor units (x100);
// pledge amounts are stored in major units.
export default function MemberFundraising() {
  const { userRegion, memberRecord } = useAuth();
  const memberId = memberRecord?.id;

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['member-campaigns', userRegion?.id],
    queryFn: async () => {
      let q = supabase.from('fundraising_campaigns').select('*').eq('status', 'active').order('start_date', { ascending: false });
      q = userRegion?.id ? q.or(`region_id.eq.${userRegion.id},region_id.is.null`) : q.is('region_id', null);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
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
  const donations = mine?.donations || [];
  const cur = campaigns?.[0]?.currency_code || pledges[0]?.currency_code || 'XAF';
  const pledgedTotal = pledges.reduce((s, p) => s + Number(p.amount || 0), 0);
  const givenTotal = donations.reduce((s, d) => s + Number(d.amount || 0) / 100, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active campaigns" value={campaigns?.length ?? '…'} icon={Target} tone="var(--chart-1)" />
        <StatTile label="My pledges" value={formatCurrency(pledgedTotal, cur)} sub={`${pledges.length} pledge(s)`} icon={HandCoins} tone="var(--chart-7)" />
        <StatTile label="My donations" value={formatCurrency(givenTotal, cur)} sub={`${donations.length} gift(s)`} icon={Wallet} tone="var(--chart-5)" />
        <StatTile label="Pledge fulfilled" value={`${pledgedTotal > 0 ? Math.min(100, Math.round((givenTotal / pledgedTotal) * 100)) : 0}%`} icon={Heart} tone="var(--chart-4)" />
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className={pillTabsList}>
          <TabsTrigger value="campaigns" className={pillTabsTrigger}>Campaigns</TabsTrigger>
          <TabsTrigger value="history" className={pillTabsTrigger}>My giving</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
          ) : !campaigns?.length ? (
            <EmptyState icon={Heart} title="No active campaigns" hint="New campaigns will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((c: any) => {
                const goal = Number(c.goal || 0) / 100;
                const raised = Number(c.raised || 0) / 100;
                const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
                const days = c.end_date ? differenceInCalendarDays(new Date(c.end_date), new Date()) : null;
                return (
                  <article key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="relative h-36 bg-gradient-to-br from-primary to-secondary">
                      {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                      <Badge className="absolute right-3 top-3" variant={pct >= 100 ? 'default' : 'secondary'}>
                        {pct >= 100 ? 'Goal reached' : days === null ? 'Ongoing' : days > 0 ? `${days} days left` : 'Ended'}
                      </Badge>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <h3 className="line-clamp-2 font-heading font-semibold text-foreground">{c.name}</h3>
                        {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                      </div>
                      <div>
                        <Progress value={pct} className="h-2" />
                        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                          <span><b className="text-foreground">{formatCurrency(raised, c.currency_code)}</b> raised</span>
                          <span>{Math.round(pct)}% of {formatCurrency(goal, c.currency_code)}</span>
                        </div>
                      </div>
                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <Button asChild size="sm"><Link to={`/fundraising/${c.id}/pledge`}>Pledge</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link to={`/fundraising/${c.id}/donate`}>Give</Link></Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {!pledges.length && !donations.length ? (
            <EmptyState icon={HandCoins} title="No pledges or gifts yet" hint="Support a campaign to see it here." />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {[...pledges.map((p) => ({ ...p, kind: 'Pledge', when: p.created_at, value: Number(p.amount) })),
                ...donations.map((d) => ({ ...d, kind: 'Gift', when: d.donation_date, value: Number(d.amount) / 100 }))]
                .sort((a, b) => +new Date(b.when) - +new Date(a.when))
                .map((x) => (
                  <li key={x.kind + x.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${x.kind === 'Gift' ? 'var(--chart-5)' : 'var(--chart-7)'} 15%, transparent)`, color: x.kind === 'Gift' ? 'var(--chart-5)' : 'var(--chart-7)' }}>
                      {x.kind === 'Gift' ? <Wallet className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{x.fundraising_campaigns?.name || 'Campaign'}</p>
                      <p className="text-xs text-muted-foreground">{x.kind} · {format(new Date(x.when), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(x.value, x.currency_code)}</p>
                      <p className="text-[11px] capitalize text-muted-foreground">{x.status}</p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
