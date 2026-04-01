import React from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EventAttendanceTrendChart: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: events } = useRegionalEvents();
  const { data: attendanceHistory, isLoading, error } = useAttendanceHistoryWithMemberTypes(userRegion?.id);

  const chartData = React.useMemo(() => {
    if (!attendanceHistory || !events) return [];

    return attendanceHistory
      .slice(0, 10)
      .reverse()
      .map((event) => {
        // Find matching source event for attendance_target
        const sourceEvent = events.find(e => e.id === event.source_event_id || e.name === event.event_name);
        return {
          date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          eventName: event.event_name.length > 15 ? `${event.event_name.substring(0, 15)}...` : event.event_name,
          Attendance: event.total_present || 0,
          ...(sourceEvent?.attendance_target ? { Target: sourceEvent.attendance_target } : {}),
          isDcg: !!event.dcg_id
        };
      });
  }, [attendanceHistory, events]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-80 w-full rounded-xl" /></CardContent>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading event attendance data</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An unknown error occurred'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Event Attendance Trends</CardTitle>
          <CardDescription>Attendance patterns over the last {chartData.length} events (incl. DCG)</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-xs text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label, payload) =>
                    payload && payload[0] ? `${payload[0].payload.eventName} (${label})${payload[0].payload.isDcg ? ' [DCG]' : ''}` : label
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Attendance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {chartData.some(d => 'Target' in d) && (
                  <Line
                    type="monotone"
                    dataKey="Target"
                    stroke="hsl(220, 100%, 60%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(220, 100%, 60%)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No event attendance data available</p>
              <p className="text-sm">Start recording event attendance to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default EventAttendanceTrendChart;
