import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, startOfWeek, eachWeekOfInterval } from "date-fns";
import { formatCurrencyWithSymbol, getCurrencySymbol } from "@/utils/currencyUtils";
import type { Currency } from "@/hooks/useCurrencies";
import type { LedgerRow } from "@/hooks/useRegionalLedger";

interface Props {
  rows: LedgerRow[];
  regionCurrency?: Currency | null;
  title?: string;
  description?: string;
}

const LedgerTrendChart: React.FC<Props> = ({ rows, regionCurrency, title = "Financial Trends", description }) => {
  const currencySymbol = getCurrencySymbol(regionCurrency);

  const data = useMemo(() => {
    if (!rows.length) return [];
    const weeks: Record<string, { income: number; expenses: number; ts: number }> = {};
    let minTs = Infinity;
    let maxTs = -Infinity;
    for (const r of rows) {
      const d = new Date(r.transaction_date);
      const ws = startOfWeek(d, { weekStartsOn: 1 });
      const key = format(ws, "yyyy-MM-dd");
      if (!weeks[key]) weeks[key] = { income: 0, expenses: 0, ts: ws.getTime() };
      const ct = r.category?.type?.toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === "income") weeks[key].income += amt;
      else if (ct === "expense") weeks[key].expenses += amt;
      if (ws.getTime() < minTs) minTs = ws.getTime();
      if (ws.getTime() > maxTs) maxTs = ws.getTime();
    }
    // Build sorted weekly buckets as a running cumulative total across the
    // filtered range. Empty weeks add 0, so the line stays flat between
    // activity and the final point equals the period's totals.
    const series: { week: string; Income: number; Expenses: number; Net: number; ts: number }[] = [];
    if (isFinite(minTs) && isFinite(maxTs)) {
      const all = eachWeekOfInterval({ start: new Date(minTs), end: new Date(maxTs) }, { weekStartsOn: 1 });
      let cumIncome = 0;
      let cumExpenses = 0;
      for (const w of all) {
        const key = format(w, "yyyy-MM-dd");
        const bucket = weeks[key];
        if (bucket) {
          cumIncome += bucket.income;
          cumExpenses += bucket.expenses;
        }
        series.push({
          week: format(w, "MMM d"),
          Income: cumIncome,
          Expenses: cumExpenses,
          Net: cumIncome - cumExpenses,
          ts: w.getTime(),
        });
      }
    }
    return series;
  }, [rows]);

  const fc = (v: number) => formatCurrencyWithSymbol(v, regionCurrency);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {title}
          </h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
          No data for the selected period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${currencySymbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px color-mix(in oklab, var(--foreground) calc(0.08 * 100%), transparent)",
              }}
              formatter={(value, name) => [fc(Number(value)), name]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Area type="monotone" dataKey="Income" stroke="var(--chart-1)" fill="url(#gradIncome)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="Expenses" stroke="var(--chart-2)" fill="url(#gradExpenses)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="Net" stroke="var(--chart-4)" fill="url(#gradNet)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LedgerTrendChart;
