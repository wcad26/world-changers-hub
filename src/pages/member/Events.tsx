import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Users
} from 'lucide-react';
import { useMemberRegionEvents } from '@/hooks/useEvents';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MemberEvents() {
  const { data: events, isLoading } = useMemberRegionEvents();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events by search query
  const filteredEvents = (events || []).filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize events
  const upcomingEvents = filteredEvents.filter(event => isFuture(parseISO(event.start_datetime)));
  const todayEvents = filteredEvents.filter(event => isToday(parseISO(event.start_datetime)));
  const pastEvents = filteredEvents.filter(event => isPast(parseISO(event.start_datetime)) && !isToday(parseISO(event.start_datetime)));

  const EventCard = ({ event }: { event: any }) => (
    <Card className="overflow-hidden">
      {event.image_url && (
        <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${event.image_url})` }}>
          <div className="absolute inset-0 bg-black/20" />
          {event.is_featured && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
      )}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-1">{event.name}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{format(parseISO(event.start_datetime), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>
                {format(parseISO(event.start_datetime), 'h:mm a')}
                {event.end_datetime && (
                  <> - {format(parseISO(event.end_datetime), 'h:mm a')}</>
                )}
              </span>
            </div>

            {event.location_name && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location_name}</span>
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Capacity: {event.capacity} people</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {event.category && (
              <Badge variant="secondary">
                {event.category}
              </Badge>
            )}
            <Badge variant={event.status === 'Upcoming' ? 'default' : 'secondary'}>
              {event.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Event Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="today">
            Today ({todayEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          {todayEvents.length > 0 ? (
            todayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No events today</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastEvents.length > 0 ? (
            pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No past events</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
