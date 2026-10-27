import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChipRow } from '@/components/admin/regional/RegionalUI';

export {
  Ring,
  HeroCard,
  RingTile,
  SearchBar,
  RoundButton,
  ChipRow,
  Initials,
  StatusPill,
  TypePill,
  InfoRow,
  SheetHeader,
} from '@/components/admin/regional/RegionalUI';

export {
  StatTile,
  Panel,
  EmptyState,
  Segmented,
  pillTabsList,
  pillTabsTrigger,
  ComingSoonPanel,
} from '@/components/member/MemberUI';

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

/**
 * Unified period filter chips with optional Custom date range popover,
 * matching Regional & Member portal period selectors.
 */
export function PeriodChipBar<T extends string>({
  value,
  onChange,
  options,
  customRange,
  onCustomRangeChange,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: readonly { value: NoInfer<T>; label: string; count?: number }[];
  customRange?: DateRangeValue;
  onCustomRangeChange?: (range: DateRangeValue) => void;
}) {
  return (
    <div className="space-y-2">
      <ChipRow value={value} onChange={onChange} options={options as { value: T; label: string; count?: number }[]} />
      {value === 'custom' && onCustomRangeChange && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted sm:w-auto"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {customRange?.from
                ? `${format(customRange.from, 'dd MMM yyyy')}${customRange.to ? ` – ${format(customRange.to, 'dd MMM yyyy')}` : ''}`
                : 'Pick date range'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="z-50 w-auto bg-popover p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: customRange?.from, to: customRange?.to }}
              onSelect={(range) => onCustomRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={1}
              className="pointer-events-auto p-3"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
