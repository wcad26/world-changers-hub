import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CalendarDays, Users, BarChart2, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EventsTabProps {
  selectedPeriod: string;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const EventsTab: React.FC<EventsTabProps> = ({ selectedPeriod }) => {
  const [drilldownEvent, setDrilldownEvent] = useState<any>(null);
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: events, isLoading, error } = useRegionalEvents();
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);

  const eventCategories = [
    'Conference', 'Worship', 'Revival', 'Outreach', 'Training', 'Workshop',
    'Community Service', 'Bible Study', 'Retreat', 'Seminar', 'DCG Meeting', 'Other'
  ] as const;

  // All calculations at the top level
  const analyticsData = useMemo(() => {
    if (!events || !attendanceData) return {
      totalEvents: 0, avgAttendance: 0, totalAttendance: 0,
      categoryBreakdown: [], topPerformingEvents: [],
      monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 },
      turnoutPct: 0, turnoutLabel: 'tracking'
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Category breakdown using source_event_id linkage when possible
    const categoryBreakdown = eventCategories.map(category => {
      const categoryEvents = events.filter(e => e.category === category);
      const categoryEventIds = categoryEvents.map(e => e.id);
      const attendance = attendanceData
        .filter(a => {
          // Match by source_event_id linkage or fallback to name
          if (a.source_event_id) return categoryEventIds.includes(a.source_event_id);
          return categoryEvents.some(e => e.name === a.event_name);
        })
        .reduce((sum, a) => sum + a.total_present, 0);
      // Also count DCG attendance events that match category name
      const dcgAttendance = category === 'DCG Meeting'
        ? attendanceData.filter(a => a.dcg_id && !a.source_event_id).reduce((sum, a) => sum + a.total_present, 0)
        : 0;
      return {
        category,
        count: categoryEvents.length + (category === 'DCG Meeting' ? attendanceData.filter(a => a.dcg_id && !a.source_event_id).length : 0),
        attendance: attendance + dcgAttendance,
        isDcg: category === 'DCG Meeting'
      };
    }).filter(c => c.count > 0);

    // Top performing events
    const topPerformingEvents = [...attendanceData]
      .sort((a, b) => b.total_present - a.total_present)
      .slice(0, 5)
      .map(event => ({
        name: event.event_name,
        attendance: event.total_present,
        date: event.event_date,
        isDcg: !!event.dcg_id,
        attendanceRate: event.total_present > 0
          ? Math.round((event.total_present / (event.total_present + event.total_absent)) * 100) : 0
      }));

    // Monthly comparison (real data)
    const thisMonthEvents = attendanceData.filter(e => {
      const d = new Date(e.event_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const lastMonthEvts = attendanceData.filter(e => {
      const d = new Date(e.event_date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });
    const thisMonthAtt = thisMonthEvents.reduce((s, e) => s + e.total_present, 0);
    const lastMonthAtt = lastMonthEvts.reduce((s, e) => s + e.total_present, 0);
    const change = lastMonthAtt > 0 ? Math.round(((thisMonthAtt - lastMonthAtt) / lastMonthAtt) * 100) : 0;

    // Turnout expectation (real capacity data)
    const eventsWithCap = events.filter(e => e.capacity && e.capacity > 0);
    const totalExpected = eventsWithCap.reduce((s, e) => s + (e.capacity || 0), 0);
    const totalActual = attendanceData
      .filter(a => eventsWithCap.some(e => e.id === a.source_event_id || e.name === a.event_name))
      .reduce((s, a) => s + a.total_present, 0);
    const turnoutPct = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;
    const turnoutLabel = eventsWithCap.length === 0 ? 'no data' : turnoutPct >= 80 ? 'excellent' : turnoutPct >= 60 ? 'good' : 'needs improvement';

    const totalAttendance = attendanceData.reduce((s, e) => s + e.total_present, 0);
    const avgAttendance = attendanceData.length > 0 ? Math.round(totalAttendance / attendanceData.length) : 0;

    return {
      totalEvents: events.length,
      avgAttendance,
      totalAttendance,
      categoryBreakdown,
      topPerformingEvents,
      monthlyComparison: { thisMonth: thisMonthAtt, lastMonth: lastMonthAtt, change },
      turnoutPct,
      turnoutLabel
    };
  }, [events, attendanceData]);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading events</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An unknown error occurred'}</AlertDescription>
      </Alert>
    );
  }

  const TrendBadge = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-xs text-muted-foreground">0%</span>;
    const positive = value > 0;
    return (
      <div className={`flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-xs font-medium">{positive ? '+' : ''}{value}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard onClick={() => setDrilldownEvent('total')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">All time</p>
              <TrendBadge value={analyticsData.monthlyComparison.change} />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard onClick={() => setDrilldownEvent('attendance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold">{analyticsData.avgAttendance}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Per event</p>
              <TrendBadge value={analyticsData.monthlyComparison.change} />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard onClick={() => setDrilldownEvent('total_attendance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold">{analyticsData.totalAttendance}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
          </CardContent>
        </GlassCard>

        <GlassCard onClick={() => setDrilldownEvent('turnout')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
            <CardTitle className="text-sm font-medium">Event Turnout</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold">{analyticsData.turnoutPct}%</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">vs capacity</p>
              <span className={`text-xs font-medium ${
                analyticsData.turnoutPct >= 80 ? 'text-green-600' : analyticsData.turnoutPct >= 60 ? 'text-orange-500' : 'text-red-500'
              }`}>{analyticsData.turnoutLabel}</span>
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Categories */}
        <GlassCard>
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5 text-primary" />
              Event Categories
            </CardTitle>
            <CardDescription>Distribution by event type (incl. DCG events)</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {analyticsData.categoryBreakdown.length > 0 ? (
                analyticsData.categoryBreakdown.map((cat, i) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${(i * 50) % 360}, 65%, 55%)` }} />
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {cat.category}
                          {cat.isDcg && <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-full">DCG</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{cat.count} events</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{cat.attendance}</div>
                      <div className="text-xs text-muted-foreground">attended</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No event categories available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {/* Top Performing Events */}
        <GlassCard>
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performing Events
            </CardTitle>
            <CardDescription>Highest attendance events</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {analyticsData.topPerformingEvents.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analyticsData.topPerformingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setDrilldownEvent(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-xs text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {event.name}
                          {event.isDcg && <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-full">DCG</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{event.attendance}</div>
                      <div className="text-xs text-muted-foreground">{event.attendanceRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No performance data available</p>
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>

      {/* Drilldown Dialog */}
      {drilldownEvent && (
        <Dialog open={!!drilldownEvent} onOpenChange={() => setDrilldownEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>Detailed analytics for selected metric</DialogDescription>
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
                  <Button className="w-full" onClick={() => {
                    setDrilldownEvent(null);
                    toast({ title: "Info", description: "Detailed event view coming soon." });
                  }}>
                    View Full Event Details
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p>Analytics overview for {drilldownEvent}</p>
                  <Button variant="outline" onClick={() => setDrilldownEvent(null)} className="mt-4">Close</Button>
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
