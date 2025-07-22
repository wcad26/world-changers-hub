import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CalendarDays, Users, BarChart2, Calendar, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EventAttendanceTrendChart from './EventAttendanceTrendChart';
import type { DashboardFilters } from '../DashboardFilters';

interface EventsTabProps {
  filters: DashboardFilters;
}

const EventsTab: React.FC<EventsTabProps> = ({ filters }) => {
  const [drilldownEvent, setDrilldownEvent] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { userRegion } = useAuth();
  const { data: events, isLoading, error } = useRegionalEvents();
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);

  const eventCategories = [
    'Conference', 'Worship', 'Revival', 'Outreach', 'Training', 'Workshop', 'Community Service', 'Bible Study', 'Retreat', 'Seminar', 'DCG Meeting', 'Other'
  ] as const;

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!event.name.toLowerCase().includes(searchTerm) &&
            !event.category?.toLowerCase().includes(searchTerm) &&
            !event.location_name?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const isUpcoming = new Date(event.start_datetime) > new Date();
        if (filters.status === 'upcoming' && !isUpcoming) return false;
        if (filters.status === 'completed' && isUpcoming) return false;
      }

      return true;
    });
  }, [events, filters]);

  const upcomingEvents = React.useMemo(() => 
    filteredEvents.filter(e => new Date(e.start_datetime) >= new Date() && e.status !== 'Cancelled'), 
    [filteredEvents]
  );

  // Analytics calculations using real data
  const analyticsData = React.useMemo(() => {
    if (!events || !attendanceData) return {
      totalEvents: 0,
      avgAttendance: 0,
      totalAttendance: 0,
      categoryBreakdown: [],
      attendanceTrend: [],
      topPerformingEvents: [],
      categoryPerformance: [],
      monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 }
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Event counts by category
    const categoryBreakdown = eventCategories.map(category => ({
      category,
      count: events.filter(e => e.category === category).length,
      attendance: attendanceData
        .filter(a => events.find(e => e.name === a.event_name)?.category === category)
        .reduce((sum, a) => sum + a.total_present, 0)
    })).filter(c => c.count > 0);

    // Top performing events by attendance
    const topPerformingEvents = attendanceData
      .sort((a, b) => b.total_present - a.total_present)
      .slice(0, 5)
      .map(event => ({
        name: event.event_name,
        attendance: event.total_present,
        date: event.event_date,
        attendanceRate: event.total_present > 0 ? Math.round((event.total_present / (event.total_present + event.total_absent)) * 100) : 0
      }));

    // Monthly attendance trend
    const attendanceTrend = attendanceData
      .slice(0, 12)
      .reverse()
      .map(event => ({
        date: event.event_date,
        attendance: event.total_present,
        name: event.event_name.length > 20 ? `${event.event_name.substring(0, 20)}...` : event.event_name
      }));

    // This month vs last month
    const thisMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const lastMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
    });

    const thisMonthAttendance = thisMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const lastMonthAttendance = lastMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const monthlyChange = lastMonthAttendance > 0 ? Math.round(((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100) : 0;

    return {
      totalEvents: events.length,
      avgAttendance: attendanceData.length > 0 ? Math.round(attendanceData.reduce((sum, e) => sum + e.total_present, 0) / attendanceData.length) : 0,
      totalAttendance: attendanceData.reduce((sum, e) => sum + e.total_present, 0),
      categoryBreakdown,
      attendanceTrend,
      topPerformingEvents,
      categoryPerformance: categoryBreakdown,
      monthlyComparison: { thisMonth: thisMonthAttendance, lastMonth: lastMonthAttendance, change: monthlyChange }
    };
  }, [events, attendanceData]);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('total')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">All time</p>
              <div className={`flex items-center gap-1 ${analyticsData.monthlyComparison.change > 0 ? 'text-green-600' : analyticsData.monthlyComparison.change < 0 ? 'text-red-600' : 'text-primary'}`}>
                {analyticsData.monthlyComparison.change !== 0 && (
                  analyticsData.monthlyComparison.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {analyticsData.monthlyComparison.change > 0 ? '+' : ''}{analyticsData.monthlyComparison.change}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('attendance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgAttendance}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Per event</p>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('total_attendance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <BarChart2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalAttendance}</div>
            <p className="text-xs text-muted-foreground">Cumulative</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('turnout_expectation')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Turnout Expectation</CardTitle>
            <BarChart2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {React.useMemo(() => {
                if (!events || !attendanceData || events.length === 0) return '0%';
                
                const eventsWithCapacity = events.filter(event => event.capacity && event.capacity > 0);
                if (eventsWithCapacity.length === 0) return 'N/A';
                
                const totalExpected = eventsWithCapacity.reduce((sum, event) => sum + (event.capacity || 0), 0);
                const totalActual = attendanceData
                  .filter(attendance => eventsWithCapacity.some(event => event.name === attendance.event_name))
                  .reduce((sum, attendance) => sum + attendance.total_present, 0);
                
                if (totalExpected === 0) return '0%';
                
                const expectationPercentage = Math.round((totalActual / totalExpected) * 100);
                return `${expectationPercentage}%`;
              }, [events, attendanceData])}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">vs expected capacity</p>
              <div className={`flex items-center gap-1 ${
                React.useMemo(() => {
                  if (!events || !attendanceData || events.length === 0) return 'text-primary';
                  
                  const eventsWithCapacity = events.filter(event => event.capacity && event.capacity > 0);
                  if (eventsWithCapacity.length === 0) return 'text-primary';
                  
                  const totalExpected = eventsWithCapacity.reduce((sum, event) => sum + (event.capacity || 0), 0);
                  const totalActual = attendanceData
                    .filter(attendance => eventsWithCapacity.some(event => event.name === attendance.event_name))
                    .reduce((sum, attendance) => sum + attendance.total_present, 0);
                  
                  const expectationPercentage = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
                  
                  if (expectationPercentage >= 80) return 'text-green-600';
                  if (expectationPercentage >= 60) return 'text-orange-600';
                  return 'text-red-600';
                }, [events, attendanceData])
              }`}>
                {React.useMemo(() => {
                  if (!events || !attendanceData || events.length === 0) return null;
                  
                  const eventsWithCapacity = events.filter(event => event.capacity && event.capacity > 0);
                  if (eventsWithCapacity.length === 0) return null;
                  
                  const totalExpected = eventsWithCapacity.reduce((sum, event) => sum + (event.capacity || 0), 0);
                  const totalActual = attendanceData
                    .filter(attendance => eventsWithCapacity.some(event => event.name === attendance.event_name))
                    .reduce((sum, attendance) => sum + attendance.total_present, 0);
                  
                  const expectationPercentage = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
                  
                  if (expectationPercentage >= 80) return <TrendingUp className="h-3 w-3" />;
                  if (expectationPercentage >= 60) return <BarChart2 className="h-3 w-3" />;
                  return <TrendingDown className="h-3 w-3" />;
                }, [events, attendanceData])}
                <span className="text-xs font-medium">
                  {React.useMemo(() => {
                    if (!events || !attendanceData || events.length === 0) return 'tracking';
                    
                    const eventsWithCapacity = events.filter(event => event.capacity && event.capacity > 0);
                    if (eventsWithCapacity.length === 0) return 'no data';
                    
                    const totalExpected = eventsWithCapacity.reduce((sum, event) => sum + (event.capacity || 0), 0);
                    const totalActual = attendanceData
                      .filter(attendance => eventsWithCapacity.some(event => event.name === attendance.event_name))
                      .reduce((sum, attendance) => sum + attendance.total_present, 0);
                    
                    const expectationPercentage = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
                    
                    if (expectationPercentage >= 80) return 'excellent';
                    if (expectationPercentage >= 60) return 'good';
                    return 'needs improvement';
                  }, [events, attendanceData])}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Attendance Trend Chart - only shown in Events tab */}
      <EventAttendanceTrendChart />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Attendance Trend
            </CardTitle>
            <CardDescription>Event attendance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {analyticsData.attendanceTrend.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.attendanceTrend.slice(0, 8).map((event, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setDrilldownEvent(event)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.name}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-lg">{event.attendance}</div>
                          <div className="text-xs text-muted-foreground">attendees</div>
                        </div>
                        <div className="w-12 h-6 bg-primary/10 rounded-full relative overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((event.attendance / Math.max(...analyticsData.attendanceTrend.map(e => e.attendance))) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No attendance data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Event Categories
            </CardTitle>
            <CardDescription>Distribution by event type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {analyticsData.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.categoryBreakdown.map((category, index) => (
                    <div 
                      key={category.category} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory(category.category)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                        />
                        <div>
                          <div className="font-medium">{category.category}</div>
                          <div className="text-xs text-muted-foreground">{category.count} events</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{category.attendance}</div>
                        <div className="text-xs text-muted-foreground">total attendance</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No event categories available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Events
          </CardTitle>
          <CardDescription>Highest attendance events</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.topPerformingEvents.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.topPerformingEvents.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setDrilldownEvent(event)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{event.attendance}</div>
                    <div className="text-sm text-muted-foreground">{event.attendanceRate}% attendance rate</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drilldown Dialog */}
      {drilldownEvent && (
        <Dialog open={!!drilldownEvent} onOpenChange={() => setDrilldownEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>
                Detailed analytics for selected metric
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {typeof drilldownEvent === 'object' && drilldownEvent.name ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Event Name</div>
                      <div className="font-medium">{drilldownEvent.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-medium">{format(new Date(drilldownEvent.date), 'MMM dd, yyyy')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                      <div className="font-medium">{drilldownEvent.attendance} people</div>
                    </div>
                    {drilldownEvent.attendanceRate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Attendance Rate</div>
                        <div className="font-medium">{drilldownEvent.attendanceRate}%</div>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setDrilldownEvent(null);
                      toast({ title: "Info", description: "Detailed event view coming soon." });
                    }}
                  >
                    View Full Event Details
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p>Analytics overview for {drilldownEvent}</p>
                  <Button variant="outline" onClick={() => setDrilldownEvent(null)} className="mt-4">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventsTab;
