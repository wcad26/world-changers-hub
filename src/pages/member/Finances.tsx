import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, Gift, Heart, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/router-compat';
import { EmptyState } from '@/components/member/MemberUI';
export default function MemberFinances() {
  const {
    userRegion
  } = useAuth();
  const {
    data: regionCurrency
  } = useRegionCurrency(userRegion?.id);
  const [dateFilter, setDateFilter] = useState('3-months');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const quickDateOptions = [{
    value: '1-month',
    label: '1M'
  }, {
    value: '3-months',
    label: '3M'
  }, {
    value: '6-months',
    label: '6M'
  }, {
    value: '1-year',
    label: '1Y'
  }, {
    value: 'custom',
    label: 'Custom'
  }];
  const handleQuickDateChange = (value: string) => {
    setDateFilter(value);
  };

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === 'custom' && customDateRange.from) {
      return {
        from: customDateRange.from.toISOString().split('T')[0],
        to: (customDateRange.to || now).toISOString().split('T')[0]
      };
    }
    switch (dateFilter) {
      case '1-month':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case '3-months':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case '6-months':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case '1-year':
        return {
          from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      default:
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
    }
  };
  const dateRange = getDateRange();
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useFinancialTransactions(dateRange);
  const {
    data: summary,
    isLoading: summaryLoading
  } = useFinancialSummary(dateRange);
  if (transactionsLoading || summaryLoading) {
    return <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>;
  }
  const total = summary?.total_income || 0;
  const parts = [
    { label: 'Tithes', value: summary?.total_tithes || 0, tone: 'var(--chart-1)', icon: Heart },
    { label: 'Offerings', value: summary?.total_offerings || 0, tone: 'var(--chart-2)', icon: Gift },
    { label: 'Special giving', value: summary?.total_special_giving || 0, tone: 'var(--chart-3)', icon: TrendingUp },
  ];
  return <div className="space-y-6">
      {/* Period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex gap-1 rounded-full border border-border bg-muted/50 p-1">
            {quickDateOptions.map(option => <button key={option.value} type="button" onClick={() => handleQuickDateChange(option.value)} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors', dateFilter === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {option.label}
              </button>)}
          </div>
          {dateFilter === 'custom' && <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 justify-start rounded-full font-normal", !customDateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from ? customDateRange.to ? <>{format(customDateRange.from, "dd/MM/yyyy")} – {format(customDateRange.to, "dd/MM/yyyy")}</> : format(customDateRange.from, "dd/MM/yyyy") : <span>Pick dates</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-50 w-auto bg-popover p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={customDateRange.from} selected={{ from: customDateRange.from, to: customDateRange.to }} onSelect={range => setCustomDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>}
        </div>
        <Button asChild className="w-full rounded-full sm:w-auto"><Link to="/fundraising"><DollarSign className="mr-2 h-4 w-4" />Give now</Link></Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Total + breakdown */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <p className="text-sm text-primary-foreground/75">Total given · {userRegion?.name}</p>
          <p className="mt-1 font-heading text-3xl font-bold sm:text-4xl">{formatWithCurrency(total, regionCurrency)}</p>
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-primary-foreground/20">
            {total > 0 && parts.map(p => <div key={p.label} style={{ width: `${p.value / total * 100}%`, background: p.tone }} />)}
          </div>
          <p className="mt-2 text-xs text-primary-foreground/75">{transactions?.length || 0} contributions in this period</p>
        </section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {parts.map(p => <div key={p.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${p.tone} 15%, transparent)`, color: p.tone }}><p.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{p.label}</p>
                <p className="truncate font-heading text-lg font-bold text-foreground">{formatWithCurrency(p.value, regionCurrency)}</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{total > 0 ? Math.round(p.value / total * 100) : 0}%</span>
            </div>)}
        </div>
      </div>

      {/* History */}
      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 sm:px-5"><h3 className="font-heading text-base font-semibold text-foreground">Giving history</h3></div>
        {transactions && transactions.length > 0 ? <ul className="divide-y divide-border">
            {transactions.map((t: any) => <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Heart className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.category?.name || 'Contribution'}</p>
                  <p className="truncate text-xs text-muted-foreground">{format(new Date(t.transaction_date), 'dd/MM/yyyy')}{t.description ? ` · ${t.description}` : ''}</p>
                </div>
                <p className="shrink-0 font-semibold" style={{ color: 'var(--chart-5)' }}>+{formatWithCurrency(Number(t.amount), regionCurrency)}</p>
              </li>)}
          </ul> : <div className="p-5"><EmptyState icon={Heart} title="No giving recorded in this period" hint="Try a longer period or give online." /></div>}
      </section>
    </div>;
}
