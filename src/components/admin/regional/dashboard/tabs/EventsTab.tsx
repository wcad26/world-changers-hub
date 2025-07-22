
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Calendar, Users } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { DashboardFilters } from '../DashboardFilters';
import { format } from 'date-fns';

interface EventsTabProps {
  filters: DashboardFilters;
}

const EventsTab: React.FC<EventsTabProps> = ({ filters }) => {
  const { data: events, isLoading, error } = useRegionalEvents();

  const getStatusBadge = (startDate: string, endDate?: string | null) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    
    if (end < now) {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (start <= now && end >= now) {
      return <Badge variant="default">Ongoing</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    
    const categoryConfig: Record<string, { variant: 'default' | 'secondary' | 'outline', color: string }> = {
      worship: { variant: 'default', color: 'bg-purple-100 text-purple-800' },
      fellowship: { variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
      training: { variant: 'outline', color: 'bg-green-100 text-green-800' },
      outreach: { variant: 'outline', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = categoryConfig[category.toLowerCase()] || { variant: 'outline' as const, color: '' };
    return <Badge variant={config.variant} className={config.color}>{category}</Badge>;
  };

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!event.name.toLowerCase().includes(searchTerm) && 
            !event.description?.toLowerCase().includes(searchTerm) &&
            !event.location_name?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Status filter based on dates
      if (filters.status && filters.status !== 'all') {
        const now = new Date();
        const start = new Date(event.start_datetime);
        const end = event.end_datetime ? new Date(event.end_datetime) : start;
        
        switch (filters.status) {
          case 'upcoming':
            if (start <= now) return false;
            break;
          case 'completed':
            if (end >= now) return false;
            break;
          case 'ongoing':
            if (start > now || end < now) return false;
            break;
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (event.category !== filters.category) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading events</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
    </div>
  );
};

export default EventsTab;
