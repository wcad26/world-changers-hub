
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DashboardFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  quickDateRange: string;
  search: string;
  status: string;
  category: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
  activeTab: string;
}

const DashboardFiltersComponent: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  activeTab
}) => {
  const quickDateOptions = [
    { value: '1-month', label: '1 Month' },
    { value: '3-months', label: '3 Months' },
    { value: '6-months', label: '6 Months' },
    { value: '1-year', label: '1 Year' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Period' }
  ];

  const getStatusOptions = () => {
    switch (activeTab) {
      case 'members':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'visitor', label: 'Visitor' }
        ];
      case 'events':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'dcg':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ];
      default:
        return [{ value: 'all', label: 'All Status' }];
    }
  };

  const getCategoryOptions = () => {
    switch (activeTab) {
      case 'events':
        return [
          { value: 'all', label: 'All Categories' },
          { value: 'worship', label: 'Worship' },
          { value: 'fellowship', label: 'Fellowship' },
          { value: 'training', label: 'Training' },
          { value: 'outreach', label: 'Outreach' }
        ];
      case 'finance':
        return [
          { value: 'all', label: 'All Categories' },
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' }
        ];
      case 'locations':
        return [
          { value: 'all', label: 'All Types' },
          { value: 'WCA Center', label: 'WCA Center' },
          { value: 'DCG Location', label: 'DCG Location' }
        ];
      default:
        return [{ value: 'all', label: 'All Categories' }];
    }
  };

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
      case 'last-year':
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        // Don't auto-set dates for custom
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
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Date Range Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.quickDateRange} onValueChange={handleQuickDateChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {quickDateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filters.quickDateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
            </div>
          )}

          {/* Search Filter */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-[200px]"
            />
          </div>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {getStatusOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filters.category} onValueChange={(value) => onFiltersChange({ category: value })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {getCategoryOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFiltersComponent;
