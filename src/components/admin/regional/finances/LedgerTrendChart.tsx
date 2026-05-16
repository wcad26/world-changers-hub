import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
      .map(([month, v]) => ({ month, income: v.income, expenses: v.expenses, net: v.income - v.expenses, ts: v.ts }))
      .sort((a, b) => a.ts - b.ts);
  }, [rows]);

  const fc = (v: number) => formatCurrencyWithSymbol(v, regionCurrency);

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No data for the selected period.</p>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(value, name) => [fc(Number(value)), name]} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} name="Income" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LedgerTrendChart;
