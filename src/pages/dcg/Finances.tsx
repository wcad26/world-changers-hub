import React, { useMemo, useState } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Download,
  Loader2,
  AlertCircle,
  Inbox,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  FileText,
  Tag,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  subMonths,
  startOfYear,
} from 'date-fns';
import { toast } from 'sonner';

import {
  useCurrentDcg,
  useDcgFinancialTransactions,
  useDeleteDcgTransaction,
  type DcgFinancialTransaction,
} from '@/hooks/useDcgFinancials';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatCurrencyWithSymbol, getCurrencySymbol } from '@/utils/currencyUtils';
import { exportCsv } from '@/utils/csvExport';

import {
  HeroCard,
  RingTile,
  SearchBar,
  RoundButton,
  ChipRow,
  PeriodChipBar,
  Panel,
  EmptyState,
  TypePill,
  InfoRow,
  SheetHeader,
  type DateRangeValue,
} from '@/components/admin/dcg/DcgUI';
import { RecordDcgIncomeDialog } from '@/components/admin/dcg/RecordDcgIncomeDialog';
import { RecordDcgExpenseDialog } from '@/components/admin/dcg/RecordDcgExpenseDialog';
import { EditDcgTransactionDialog } from '@/components/admin/dcg/EditDcgTransactionDialog';

type PeriodKey = 'all' | '1m' | '3m' | '6m' | 'ytd' | '1y' | 'custom';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1 year' },
  { value: 'custom', label: 'Custom' },
];

const parseLocalDate = (raw: string): Date => {
  if (!raw) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const resolvePeriod = (
  p: PeriodKey,
  customRange: DateRangeValue,
): { from?: Date; to?: Date } => {
  const now = new Date();
  switch (p) {
    case '1m':
      return { from: subMonths(now, 1), to: now };
    case '3m':
      return { from: subMonths(now, 3), to: now };
    case '6m':
      return { from: subMonths(now, 6), to: now };
    case 'ytd':
      return { from: startOfYear(now), to: now };
    case '1y':
      return { from: subMonths(now, 12), to: now };
    case 'custom':
      return { from: customRange.from, to: customRange.to };
    case 'all':
    default:
      return {};
  }
};

const DcgFinances: React.FC = () => {
  const { userDcg } = useAuth();
  const { data: resolvedDcg, isLoading: dcgLoading, error: dcgError } = useCurrentDcg();
  const currentDcg = resolvedDcg || userDcg;
  const dcgId = currentDcg?.id;
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);
  const currencySymbol = getCurrencySymbol(regionCurrency);

  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customRange, setCustomRange] = useState<DateRangeValue>({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [offeringsOnly, setOfferingsOnly] = useState(false);

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [viewingTx, setViewingTx] = useState<DcgFinancialTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<DcgFinancialTransaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<DcgFinancialTransaction | null>(null);

  const deleteMutation = useDeleteDcgTransaction(dcgId || '');

  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);
  const filters = useMemo(
    () => ({
      from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    }),
    [range],
  );

  const {
    data: rows = [],
    isLoading: txLoading,
    isFetching: txFetching,
    error: txError,
    refetch,
  } = useDcgFinancialTransactions(dcgId, filters);

  // Period-wide KPI summary (reflects period + search so cards stay stable while toggling type filter)
  const periodSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let offerings = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const r of rows) {
      const ct = (r.category?.type || '').toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === 'income') {
        income += amt;
        incomeCount += 1;
      } else if (ct === 'expense') {
        expenses += amt;
        expenseCount += 1;
      }
      if (/offering/i.test(r.category?.name || '')) {
        offerings += amt;
      }
    }
    return {
      income,
      expenses,
      net: income - expenses,
      offerings,
      count: rows.length,
      incomeCount,
      expenseCount,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const ct = (r.category?.type || '').toLowerCase();
      if (typeFilter !== 'all' && ct !== typeFilter) return false;
      if (offeringsOnly && !/offering/i.test(r.category?.name || '')) return false;
      if (!s) return true;
      return (
        (r.category?.name || '').toLowerCase().includes(s) ||
        (r.description || '').toLowerCase().includes(s) ||
        String(r.amount).includes(s)
      );
    });
  }, [rows, search, typeFilter, offeringsOnly]);

  // Monthly income/expense bars with net trend (period-filtered)
  const trendData = useMemo(() => {
    const m: Record<string, { month: string; Income: number; Expenses: number; ts: number }> = {};
    for (const r of rows) {
      const d = parseLocalDate(r.transaction_date);
      const key = format(d, 'yyyy-MM');
      if (!m[key]) m[key] = { month: format(d, 'MMM yy'), Income: 0, Expenses: 0, ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      const ct = (r.category?.type || '').toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === 'income') m[key].Income += amt;
      else if (ct === 'expense') m[key].Expenses += amt;
    }
    return Object.values(m).sort((x, y) => x.ts - y.ts).map((v) => ({ ...v, Net: v.Income - v.Expenses }));
  }, [rows]);

  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  const handleExport = () => {
    if (!filtered.length) return;
    exportCsv(
      `dcg-${(currentDcg?.name || 'finances').toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd')}.csv`,
      filtered.map((r) => ({
        date: r.transaction_date,
        category: r.category?.name ?? '',
        type: r.category?.type ?? '',
        description: r.description ?? '',
        amount: r.amount,
      })),
    );
    toast.success('Financial ledger exported to CSV');
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      await deleteMutation.mutateAsync(deletingTx.id);
      toast.success('Financial record deleted');
      setDeletingTx(null);
    } catch (e: any) {
      toast.error('Failed to delete record', { description: e?.message });
    }
  };

  if (dcgLoading && !currentDcg) {
    return (
      <DcgAdminLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your DCG finances…</span>
        </div>
      </DcgAdminLayout>
    );
  }

  if (!currentDcg) {
    return (
      <DcgAdminLayout>
        <EmptyState
          icon={AlertCircle}
          title="No DCG Assigned"
          hint={
            dcgError
              ? (dcgError as Error).message
              : 'We could not find an active DCG assigned to your account. Please contact your regional administrator.'
          }
        />
      </DcgAdminLayout>
    );
  }

  const grossVolume = periodSummary.income + periodSummary.expenses;
  const retainedPct =
    periodSummary.income > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(((periodSummary.income - periodSummary.expenses) / periodSummary.income) * 100),
          ),
        )
      : 0;

  return (
    <DcgAdminLayout>
      <div className="space-y-4 sm:space-y-5">
        {/* Period Filter Chips */}
        <PeriodChipBar
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        {/* Hero Summary Card */}
        <HeroCard
          eyebrow={`${currentDcg.name} · Net Balance`}
          value={fc(periodSummary.net)}
          ring={retainedPct}
          ringLabel="Of income"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncomeOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary-foreground px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:opacity-95 active:scale-95"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Record Income
            </button>
            <button
              type="button"
              onClick={() => setExpenseOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/25 active:scale-95"
            >
              <Minus className="h-4 w-4 shrink-0" />
              Record Expense
            </button>
          </div>
        </HeroCard>

        {txError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{(txError as Error).message || 'Failed to load financial records.'}</span>
            </div>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <RingTile
            icon={ArrowUpRight}
            label="Total Income"
            value={fc(periodSummary.income)}
            tone="var(--chart-2)"
            active={typeFilter === 'income'}
            onClick={() => {
              setOfferingsOnly(false);
              setTypeFilter((prev) => (prev === 'income' ? 'all' : 'income'));
            }}
          />
          <RingTile
            icon={ArrowDownRight}
            label="Total Expenses"
            value={fc(periodSummary.expenses)}
            ring={grossVolume > 0 ? (periodSummary.expenses / grossVolume) * 100 : 0}
            ringLabel="Share"
            tone="var(--chart-4)"
            active={typeFilter === 'expense'}
            onClick={() => {
              setOfferingsOnly(false);
              setTypeFilter((prev) => (prev === 'expense' ? 'all' : 'expense'));
            }}
          />
        </div>

        {/* Financial Trends Chart */}
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Financial Trends
            </span>
          }
          action={
            <span className="text-xs text-muted-foreground">Monthly income vs expenses</span>
          }
        >
          {trendData.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No trend data yet"
              hint="Record income or expenses to see your DCG financial trajectory."
            />
          ) : (
            <div className="h-[260px] w-full sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `${currencySymbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [fc(Number(value)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Income" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Expenses" fill="var(--chart-4)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="Net" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Search, Export & Type Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search category, description, or amount…"
            />
            <RoundButton
              icon={RefreshCw}
              label="Refresh ledger"
              onClick={() => void refetch()}
            />
            <RoundButton
              icon={Download}
              label="Export CSV"
              onClick={handleExport}
            />
          </div>

          <ChipRow
            value={offeringsOnly ? ('offerings' as any) : typeFilter}
            onChange={(v: 'all' | 'income' | 'expense' | 'offerings') => {
              if (v === 'offerings') {
                setTypeFilter('all');
                setOfferingsOnly(true);
              } else {
                setOfferingsOnly(false);
                setTypeFilter(v);
              }
            }}
            options={[
              { value: 'all', label: 'All records', count: periodSummary.count },
              { value: 'income', label: 'Income', count: periodSummary.incomeCount },
              { value: 'expense', label: 'Expenses', count: periodSummary.expenseCount },
              { value: 'offerings', label: 'Offerings' },
            ]}
          />
        </div>

        {/* Itemized Financial Records */}
        <Panel
          title={`Financial Records (${filtered.length})`}
          action={
            txFetching && !txLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : undefined
          }
          bodyClassName="p-3 sm:p-5"
        >
          {txLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Loading financial records…</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                rows.length === 0
                  ? 'No financial records yet'
                  : 'No records match your filters'
              }
              hint={
                rows.length === 0
                  ? `Start tracking income and expenses for ${currentDcg.name}.`
                  : 'Try clearing your search or switching the selected filter chips.'
              }
              action={
                rows.length === 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIncomeOpen(true)}
                      className="rounded-full"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Record Income
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpenseOpen(true)}
                      className="rounded-full"
                    >
                      <Minus className="mr-1.5 h-4 w-4" />
                      Record Expense
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('all');
                      setOfferingsOnly(false);
                      setPeriod('all');
                    }}
                  >
                    Reset filters
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Mobile & Tablet Card List (< 1024px) */}
              <div className="space-y-2.5 lg:hidden">
                {filtered.map((r) => {
                  const ct = (r.category?.type || '').toLowerCase();
                  const isIncome = ct === 'income';
                  const txDate = parseLocalDate(r.transaction_date);

                  return (
                    <div
                      key={r.id}
                      onClick={() => setViewingTx(r)}
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:border-primary/40 active:scale-[0.99]"
                    >
                      <span
                        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{
                          background: `color-mix(in oklab, ${isIncome ? 'var(--chart-2)' : 'var(--chart-4)'} 15%, transparent)`,
                          color: isIncome ? 'var(--chart-2)' : 'var(--chart-4)',
                        }}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-semibold text-foreground">
                              {r.category?.name ?? 'Uncategorized'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {format(txDate, 'MMM dd, yyyy')}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <span
                              className="whitespace-nowrap text-sm font-bold tabular-nums"
                              style={{
                                color: isIncome ? 'var(--chart-2)' : 'var(--chart-4)',
                              }}
                            >
                              {isIncome ? '+' : '-'}
                              {fc(Number(r.amount))}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Edit financial record"
                              title="Edit record"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTx(r);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Record actions"
                                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingTx(r);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTx(r);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingTx(r);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {r.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                            {r.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Rounded Table (>= 1024px) */}
              <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const ct = (r.category?.type || '').toLowerCase();
                      const isIncome = ct === 'income';
                      const txDate = parseLocalDate(r.transaction_date);

                      return (
                        <TableRow
                          key={r.id}
                          onClick={() => setViewingTx(r)}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                        >
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(txDate, 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {r.category?.name ?? '—'}
                          </TableCell>
                          <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                            {r.description || '—'}
                          </TableCell>
                          <TableCell>
                            <TypePill
                              label={r.category?.type ?? 'Other'}
                              tone={isIncome ? 'var(--chart-2)' : 'var(--chart-4)'}
                            />
                          </TableCell>
                          <TableCell
                            className="whitespace-nowrap text-right font-semibold tabular-nums"
                            style={{
                              color: isIncome ? 'var(--chart-2)' : 'var(--chart-4)',
                            }}
                          >
                            {isIncome ? '+' : '-'}
                            {fc(Number(r.amount))}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Edit financial record"
                                title="Edit record"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingTx(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="More actions"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                  <DropdownMenuItem onClick={() => setViewingTx(r)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingTx(r)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit record
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingTx(r)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete record
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Record Income & Expense Dialogs */}
      <RecordDcgIncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        dcgId={currentDcg.id}
        regionCurrency={regionCurrency}
      />
      <RecordDcgExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        dcgId={currentDcg.id}
        regionCurrency={regionCurrency}
      />

      {/* Edit Financial Record Dialog */}
      <EditDcgTransactionDialog
        open={!!editingTx}
        onOpenChange={(open) => {
          if (!open) setEditingTx(null);
        }}
        dcgId={currentDcg.id}
        transaction={editingTx}
        regionCurrency={regionCurrency}
      />

      {/* Read-Only Transaction Details Dialog (with quick Edit transition) */}
      <Dialog
        open={!!viewingTx}
        onOpenChange={(open) => {
          if (!open) setViewingTx(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-[440px]">
          <SheetHeader
            icon={Eye}
            title="Transaction Details"
            description={`${currentDcg.name} financial ledger record`}
          />
          <DialogHeader className="sr-only">
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Detailed view of the selected financial record.</DialogDescription>
          </DialogHeader>

          {viewingTx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Amount
                  </p>
                  <p
                    className="mt-1 font-heading text-2xl font-bold tabular-nums"
                    style={{
                      color:
                        (viewingTx.category?.type || '').toLowerCase() === 'income'
                          ? 'var(--chart-2)'
                          : 'var(--chart-4)',
                    }}
                  >
                    {(viewingTx.category?.type || '').toLowerCase() === 'income' ? '+' : '-'}
                    {fc(Number(viewingTx.amount))}
                  </p>
                </div>
                <TypePill
                  label={viewingTx.category?.type ?? 'Record'}
                  tone={
                    (viewingTx.category?.type || '').toLowerCase() === 'income'
                      ? 'var(--chart-2)'
                      : 'var(--chart-4)'
                  }
                />
              </div>

              <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
                <InfoRow
                  icon={Tag}
                  label="Category"
                  value={viewingTx.category?.name || 'Uncategorized'}
                />
                <InfoRow
                  icon={CalendarIcon}
                  label="Transaction Date"
                  value={format(parseLocalDate(viewingTx.transaction_date), 'EEEE, MMMM d, yyyy')}
                />
                <InfoRow
                  icon={FileText}
                  label="Description"
                  value={viewingTx.description || 'No additional notes recorded.'}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    const tx = viewingTx;
                    setViewingTx(null);
                    setDeletingTx(tx);
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setViewingTx(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
                    onClick={() => {
                      const tx = viewingTx;
                      setViewingTx(null);
                      setEditingTx(tx);
                    }}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit Record
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTx}
        onOpenChange={(open) => {
          if (!open) setDeletingTx(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete financial record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this{' '}
              <span className="font-medium text-foreground">
                {deletingTx?.category?.name || 'financial'}
              </span>{' '}
              entry of{' '}
              <span className="font-semibold text-foreground">
                {deletingTx ? fc(Number(deletingTx.amount)) : ''}
              </span>{' '}
              from <span className="font-medium text-foreground">{currentDcg.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DcgAdminLayout>
  );
};

export default DcgFinances;
