import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventById } from '@/hooks/useEvents';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEventById(eventId);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-96 w-full mb-6" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link to="/events">
              <Button variant="ghost" className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
            <Card>
              <CardContent className="py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The event you're looking for doesn't exist or has been removed.
                </p>
                <Link to="/events">
                  <Button>View All Events</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

  const getStatusBadge = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(startDate);
    eventDate.setHours(0, 0, 0, 0);

    if (event.status === 'Completed') {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (event.status === 'Cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (eventDate.getTime() === today.getTime()) {
      return <Badge className="bg-green-600 hover:bg-green-700">Today</Badge>;
    } else if (eventDate > today) {
      return <Badge>Upcoming</Badge>;
    } else {
      return <Badge variant="secondary">Past</Badge>;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/events">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>

          {/* Event Image */}
          {event.image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}

          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {getStatusBadge()}
                  {event.is_featured && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Featured
                    </Badge>
                  )}
                  {event.category && (
                    <Badge variant="outline">{event.category}</Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
                {event.description && (
                  <p className="text-lg text-muted-foreground">{event.description}</p>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Date</p>
                    <p className="text-muted-foreground">
                      {format(startDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Time</p>
                    <p className="text-muted-foreground">
                      {format(startDate, 'h:mm a')}
                      {endDate && ` - ${format(endDate, 'h:mm a')}`}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(event.location_name || event.address) && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Location</p>
                      <p className="text-muted-foreground">
                        {event.location_name}
                        {event.location_name && event.address && <br />}
                        {event.address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Capacity */}
                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Capacity</p>
                      <p className="text-muted-foreground">
                        {event.capacity} attendees
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link to="/events">
                  <Button variant="outline">View All Events</Button>
                </Link>
                {event.status === 'Upcoming' && (
                  <Button>Register for Event</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EventDetail;
