import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
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
    const months: Record<string, { income: number; expenses: number; ts: number }> = {};
    for (const r of rows) {
      const d = new Date(r.transaction_date);
      const key = format(d, "MMM yyyy");
      if (!months[key]) months[key] = { income: 0, expenses: 0, ts: d.getTime() };
      const ct = r.category?.type?.toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === "income") months[key].income += amt;
      else if (ct === "expense") months[key].expenses += amt;
    }
    return Object.entries(months)
      .map(([month, v]) => ({ month, Income: v.income, Expenses: v.expenses, Net: v.income - v.expenses, ts: v.ts }))
      .sort((a, b) => a.ts - b.ts);
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
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${currencySymbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px hsl(var(--foreground) / 0.08)",
              }}
              formatter={(value, name) => [fc(Number(value)), name]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Area type="monotone" dataKey="Income" stroke="hsl(var(--chart-1))" fill="url(#gradIncome)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="Expenses" stroke="hsl(var(--chart-2))" fill="url(#gradExpenses)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="Net" stroke="hsl(var(--chart-4))" fill="url(#gradNet)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LedgerTrendChart;
