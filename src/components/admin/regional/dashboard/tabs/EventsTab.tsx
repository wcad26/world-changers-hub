
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Calendar, Users } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
      {/* Events Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Events Management</CardTitle>
            <CardDescription>
              {filteredEvents.length} of {events?.length || 0} events
            </CardDescription>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(event.start_datetime), 'PPP')}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(event.start_datetime), 'p')}
                        {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'p')}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{event.location_name || 'TBD'}</div>
                      <div className="text-muted-foreground line-clamp-1">
                        {event.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(event.category)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(event.start_datetime, event.end_datetime)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" />
                      {event.capacity || 'Unlimited'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsTab;
