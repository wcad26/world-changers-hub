import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, subMonths, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";

export type PeriodKey = "1m" | "3m" | "6m" | "ytd" | "1y" | "custom";

export interface PeriodRange {
  from: Date;
  to: Date;
}

export const periodPresets: { value: PeriodKey; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "custom", label: "Custom" },
];

export function resolvePeriod(period: PeriodKey, custom?: { from?: Date; to?: Date }): PeriodRange {
  const to = custom?.to ?? new Date();
  switch (period) {
    case "1m":  return { from: subMonths(new Date(), 1),  to: new Date() };
    case "3m":  return { from: subMonths(new Date(), 3),  to: new Date() };
    case "6m":  return { from: subMonths(new Date(), 6),  to: new Date() };
    case "ytd": return { from: startOfYear(new Date()),    to: new Date() };
    case "1y":  return { from: subMonths(new Date(), 12), to: new Date() };
    case "custom":
      return { from: custom?.from ?? subMonths(new Date(), 1), to };
  }
}

interface Props {
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
  customRange?: { from?: Date; to?: Date };
  onCustomRangeChange?: (r: { from?: Date; to?: Date }) => void;
}

const PeriodSelector: React.FC<Props> = ({ period, onPeriodChange, customRange, onCustomRangeChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
        {periodPresets.map(opt => (
          <Button
            key={opt.value}
            variant={period === opt.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange(opt.value)}
            className={cn("h-8 px-3 rounded-lg text-xs",
              period === opt.value && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {period === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <CalendarIcon className="h-3.5 w-3.5" />
              {customRange?.from && customRange?.to
                ? `${format(customRange.from, "MMM d")} – ${format(customRange.to, "MMM d, yyyy")}`
                : "Pick range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarUI
              mode="range"
              selected={customRange as any}
              onSelect={(range: any) => onCustomRangeChange?.({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default PeriodSelector;
