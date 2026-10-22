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
  return <div className="space-y-5">
      {/* Hero: total + inline period + give */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/70">Total given</p>
            <p className="mt-1 truncate font-heading text-3xl font-bold sm:text-4xl">{formatWithCurrency(total, regionCurrency)}</p>
            <p className="mt-1 text-xs text-primary-foreground/75">{transactions?.length || 0} contributions · {userRegion?.name}</p>
          </div>
          <Link to="/fundraising" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-transform active:scale-95">
            <DollarSign className="h-4 w-4" />Give
          </Link>
        </div>
        <div className="relative mt-5 flex h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          {total > 0 && parts.map(p => <div key={p.label} style={{ width: `${p.value / total * 100}%`, background: p.tone }} />)}
        </div>
        <div className="relative mt-4 grid grid-cols-5 gap-1 rounded-full bg-primary-foreground/15 p-1">
          {quickDateOptions.map(option => <button key={option.value} type="button" onClick={() => handleQuickDateChange(option.value)} className={cn('rounded-full py-1.5 text-xs font-semibold transition-colors', dateFilter === option.value ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/80')}>
              {option.label}
            </button>)}
        </div>
      </section>

      {dateFilter === 'custom' && <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-10 w-full justify-start rounded-full font-normal sm:w-auto", !customDateRange.from && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange.from ? customDateRange.to ? <>{format(customDateRange.from, "dd/MM/yyyy")} – {format(customDateRange.to, "dd/MM/yyyy")}</> : format(customDateRange.from, "dd/MM/yyyy") : <span>Pick dates</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="z-50 w-auto bg-popover p-0" align="start">
            <Calendar initialFocus mode="range" defaultMonth={customDateRange.from} selected={{ from: customDateRange.from, to: customDateRange.to }} onSelect={range => setCustomDateRange({ from: range?.from, to: range?.to })} numberOfMonths={1} className="pointer-events-auto" />
          </PopoverContent>
        </Popover>}

      {/* Compact breakdown */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {parts.map(p => <div key={p.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full blur-xl" style={{ background: `color-mix(in oklab, ${p.tone} 20%, transparent)` }} />
            <div className="relative flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${p.tone} 15%, transparent)`, color: p.tone }}><p.icon className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold text-muted-foreground">{total > 0 ? Math.round(p.value / total * 100) : 0}%</span>
            </div>
            <p className="relative mt-3 truncate font-heading text-sm font-bold text-foreground sm:text-lg">{formatWithCurrency(p.value, regionCurrency)}</p>
            <p className="relative truncate text-[11px] text-muted-foreground sm:text-xs">{p.label}</p>
          </div>)}
      </section>

      {/* History */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="font-heading text-base font-semibold text-foreground">Recent giving</h3>
          <span className="text-xs text-muted-foreground">{transactions?.length || 0}</span>
        </div>
        {transactions && transactions.length > 0 ? <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {transactions.map((t: any) => <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Heart className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.category?.name || 'Contribution'}</p>
                  <p className="truncate text-xs text-muted-foreground">{format(new Date(t.transaction_date), 'dd/MM/yyyy')}{t.description ? ` · ${t.description}` : ''}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold" style={{ color: 'var(--chart-5)' }}>+{formatWithCurrency(Number(t.amount), regionCurrency)}</p>
              </li>)}
          </ul> : <EmptyState icon={Heart} title="No giving in this period" hint="Try a longer period or give online." />}
      </section>
    </div>;
}
