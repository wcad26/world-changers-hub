import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface PeriodFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  quickDateRange: string;
}

interface PeriodFilterProps {
  filters: PeriodFilters;
  onFiltersChange: (filters: Partial<PeriodFilters>) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  filters,
  onFiltersChange
}) => {
  const quickDateOptions = [
    { value: '1-month', label: '1M' },
    { value: '3-months', label: '3M' },
    { value: '6-months', label: '6M' },
    { value: '1-year', label: '1Y' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleQuickDateChange = (value: string) => {
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    switch (value) {
      case '1-month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3-months':
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6-months':
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1-year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'custom':
        // Keep existing dates for custom, just switch mode
        onFiltersChange({ quickDateRange: value });
        return;
      default:
        return;
    }

    onFiltersChange({
      quickDateRange: value,
      dateRange: { from, to }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-medium text-muted-foreground mr-2">Period:</span>
      
      {/* Quick Date Range Buttons */}
      <div className="flex items-center gap-1">
        {quickDateOptions.map((option) => (
          <Button
            key={option.value}
            variant={filters.quickDateRange === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickDateChange(option.value)}
            className="px-3 py-1 h-8"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {filters.quickDateRange === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "ml-2 justify-start text-left font-normal h-8",
                !filters.dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "MMM d")} - {format(filters.dateRange.to, "MMM d, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "MMM d, y")
                )
              ) : (
                <span>Pick dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange.from}
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={(range) =>
                onFiltersChange({
                  dateRange: {
                    from: range?.from,
                    to: range?.to,
                  },
                })
              }
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default PeriodFilter;
