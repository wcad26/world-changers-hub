import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "income" | "expense" | "neutral" | "info" | "warning" | "primary";
  hint?: string;
}

const toneMap: Record<NonNullable<Props["tone"]>, { icon: string; tile: string }> = {
  income:  { icon: "text-green-600",  tile: "bg-green-50 dark:bg-green-900/20" },
  expense: { icon: "text-red-600",    tile: "bg-red-50 dark:bg-red-900/20" },
  neutral: { icon: "text-blue-600",   tile: "bg-blue-50 dark:bg-blue-900/20" },
  info:    { icon: "text-purple-600", tile: "bg-purple-50 dark:bg-purple-900/20" },
  warning: { icon: "text-amber-600",  tile: "bg-amber-50 dark:bg-amber-900/20" },
  primary: { icon: "text-primary",    tile: "bg-primary/10" },
};

const FinanceKpiCard: React.FC<Props> = ({ label, value, icon: Icon, tone = "neutral", hint }) => {
  const t = toneMap[tone];
  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("p-1.5 rounded-lg", t.tile)}>
            <Icon className={cn("h-4 w-4", t.icon)} />
          </div>
        </div>
        <p className="text-lg font-bold truncate" title={String(value)}>{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
};

export default FinanceKpiCard;
