import React from 'react';
import MemberLayout from '@/components/layout/MemberLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MapPin,
  ChevronRight,
  Heart,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicEvents } from '@/hooks/useEvents';
import { format, parseISO, isFuture } from 'date-fns';

export default function MemberDashboard() {
  const { profile, userRegion } = useAuth();
  const { data: events } = usePublicEvents();

  // Get upcoming events for the member's region
  const upcomingEvents = events?.filter(event => 
    event.region_id === profile?.region_id && 
    isFuture(parseISO(event.start_datetime))
  ).slice(0, 3) || [];

  return (
    <MemberLayout>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            {userRegion?.name} Branch
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Next Event</p>
                  <p className="text-xs text-muted-foreground">
                    {upcomingEvents[0] ? format(parseISO(upcomingEvents[0].start_datetime), 'MMM dd') : 'None scheduled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-xs text-muted-foreground">View Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <Link to="/member/events">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(parseISO(event.start_datetime), 'MMM dd, h:mm a')}</span>
                    </div>
                    {event.location_name && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location_name}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {event.category}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/member/finances">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Give</p>
                <p className="text-xs text-muted-foreground">Tithes & Offerings</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/member/discipleship">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Discipleship</p>
                <p className="text-xs text-muted-foreground">Mentoring</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/member/fundraising">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium">Support</p>
                <p className="text-xs text-muted-foreground">Campaigns</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/member/media">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium">Media</p>
                <p className="text-xs text-muted-foreground">Sermons & More</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MemberLayout>
  );
}