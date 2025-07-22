
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

  return null;
};

export default DashboardFiltersComponent;
