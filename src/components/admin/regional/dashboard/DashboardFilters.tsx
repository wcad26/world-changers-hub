
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
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>

          {/* Quick Date Range */}
          <Select
            value={filters.quickDateRange}
            onValueChange={(value) => onFiltersChange({ quickDateRange: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {quickDateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          {filters.quickDateRange === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      format(filters.dateRange.from, "PPP")
                    ) : (
                      <span>From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) => 
                      onFiltersChange({ 
                        dateRange: { ...filters.dateRange, from: date } 
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !filters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.to ? (
                      format(filters.dateRange.to, "PPP")
                    ) : (
                      <span>To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) => 
                      onFiltersChange({ 
                        dateRange: { ...filters.dateRange, to: date } 
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value })}
          >
            <SelectTrigger className="w-32">
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
          <Select
            value={filters.category}
            onValueChange={(value) => onFiltersChange({ category: value })}
          >
            <SelectTrigger className="w-36">
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

          {/* Export Button */}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFiltersComponent;
