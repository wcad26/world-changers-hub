import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "income" | "expense" | "neutral" | "info" | "warning" | "primary";
  hint?: string;
  trend?: number | null;
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  income:  "bg-green-500/10 text-green-600",
  expense: "bg-red-500/10 text-red-600",
  neutral: "bg-blue-500/10 text-blue-600",
  info:    "bg-purple-500/10 text-purple-600",
  warning: "bg-amber-500/10 text-amber-600",
  primary: "bg-primary/10 text-primary",
};

const FinanceKpiCard: React.FC<Props> = ({ label, value, icon: Icon, tone = "neutral", hint, trend }) => {
  const iconTone = toneMap[tone];
  return (
    <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground truncate">{label}</span>
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", iconTone)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="font-bold truncate text-lg" title={String(value)}>{value}</div>
      <div className="flex items-center justify-between mt-1 gap-2">
        {hint ? <p className="text-xs text-muted-foreground truncate">{hint}</p> : <span />}
        {trend !== null && trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium shrink-0",
            trend >= 0 ? "text-green-600" : "text-red-600")}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceKpiCard;
