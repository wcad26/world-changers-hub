import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Filter,
  Users,
  ExternalLink
} from 'lucide-react';
import { usePublicEvents } from '@/hooks/useEvents';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MemberEvents() {
  const { profile } = useAuth();
  const { data: events, isLoading } = usePublicEvents();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock events data for demo purposes
  const mockEvents = [
    {
      id: "1",
      name: "Sunday Worship Service",
      description: "Join us for our weekly worship service with uplifting music, inspiring messages, and fellowship.",
      start_datetime: "2024-07-30T10:00:00Z",
      end_datetime: "2024-07-30T12:00:00Z",
      location_name: "Main Sanctuary",
      capacity: 300,
      category: "Worship",
      status: "Upcoming",
      is_featured: true,
      image_url: "/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png",
      region_id: profile?.region_id
    },
    {
      id: "2",
      name: "Youth Bible Study",
      description: "A dedicated time for our youth to dive deep into God's word and build lasting friendships.",
      start_datetime: "2024-07-31T18:30:00Z",
      end_datetime: "2024-07-31T20:00:00Z",
      location_name: "Youth Center",
      capacity: 50,
      category: "Bible Study",
      status: "Upcoming",
      is_featured: false,
      region_id: profile?.region_id
    },
    {
      id: "3",
      name: "Community Outreach Day",
      description: "Let's serve our community together by volunteering at the local food bank and homeless shelter.",
      start_datetime: "2024-08-03T09:00:00Z",
      end_datetime: "2024-08-03T15:00:00Z",
      location_name: "Community Center",
      capacity: 100,
      category: "Outreach",
      status: "Upcoming",
      is_featured: true,
      image_url: "/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png",
      region_id: profile?.region_id
    },
    {
      id: "4",
      name: "Women's Prayer Meeting",
      description: "A time for the women of our church to come together in prayer and mutual support.",
      start_datetime: "2024-08-05T19:00:00Z",
      end_datetime: "2024-08-05T20:30:00Z",
      location_name: "Fellowship Hall",
      capacity: 75,
      category: "Prayer",
      status: "Upcoming",
      is_featured: false,
      region_id: profile?.region_id
    },
    {
      id: "5",
      name: "Men's Breakfast Fellowship",
      description: "Start your Saturday with fellowship, food, and encouragement with the men of our church.",
      start_datetime: "2024-08-10T08:00:00Z",
      end_datetime: "2024-08-10T10:00:00Z",
      location_name: "Church Kitchen",
      capacity: 40,
      category: "Fellowship",
      status: "Upcoming",
      is_featured: false,
      region_id: profile?.region_id
    },
    {
      id: "6",
      name: "Sunday School for All Ages",
      description: "Educational classes for children, youth, and adults to grow in faith and knowledge.",
      start_datetime: "2024-07-29T09:00:00Z",
      end_datetime: "2024-07-29T09:45:00Z",
      location_name: "Various Classrooms",
      capacity: 200,
      category: "Education",
      status: "Today",
      is_featured: false,
      region_id: profile?.region_id
    },
    {
      id: "7",
      name: "Church Anniversary Celebration",
      description: "Celebrating 25 years of ministry with special guests, testimonies, and a fellowship meal.",
      start_datetime: "2024-07-20T10:00:00Z",
      end_datetime: "2024-07-20T16:00:00Z",
      location_name: "Main Sanctuary & Fellowship Hall",
      capacity: 500,
      category: "Celebration",
      status: "Past",
      is_featured: true,
      image_url: "/lovable-uploads/5ade5f06-a3a8-4a1e-abfb-038125a75293.png",
      region_id: profile?.region_id
    },
    {
      id: "8",
      name: "Baptism Service",
      description: "Witnessing new believers take the next step in their faith journey through baptism.",
      start_datetime: "2024-07-15T14:00:00Z",
      end_datetime: "2024-07-15T15:30:00Z",
      location_name: "Baptistry",
      capacity: 150,
      category: "Ceremony",
      status: "Past",
      is_featured: false,
      region_id: profile?.region_id
    }
  ];

  // Use mock data if no real events are available
  const regionEvents = events?.filter(event => event.region_id === profile?.region_id) || mockEvents;

  // Filter events by search query
  const filteredEvents = regionEvents.filter(event =>
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
            <Badge variant="secondary">
              {event.category}
            </Badge>
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
      <div className="p-4 space-y-4">
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
    <div className="p-4 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          
          {/* Search */}
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
                <p className="text-muted-foreground">No upcoming events found</p>
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
                <p className="text-muted-foreground">No past events found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}