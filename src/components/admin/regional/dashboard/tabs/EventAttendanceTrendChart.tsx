
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useRegionalEvents } from '@/hooks/useEvents';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const EventAttendanceTrendChart: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: events } = useRegionalEvents();
  const { data: attendanceHistory, isLoading, error } = useAttendanceHistoryWithMemberTypes(userRegion?.id);

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!attendanceHistory || !events) return [];
    
    return attendanceHistory
      .slice(0, 10) // Last 10 events
      .reverse() // Show chronological order
      .map((event, index) => ({
        name: `Event ${index + 1}`,
        date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        eventName: event.event_name.length > 15 ? `${event.event_name.substring(0, 15)}...` : event.event_name,
        Attendance: event.total_present || 0,
        Expected: Math.round((event.total_present + event.total_absent) * 0.85) || 0 // Mock expected attendance
      }));
  }, [attendanceHistory, events]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading event attendance data</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Event Attendance Trends</CardTitle>
          <CardDescription>
            Attendance patterns over the last {chartData.length} events
          </CardDescription>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value, name, props) => [
                  value,
                  name,
                  { payload: { eventName: props.payload?.eventName } }
                ]}
                labelFormatter={(label, payload) => 
                  payload && payload[0] ? `${payload[0].payload.eventName} (${label})` : label
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
              <Line 
                type="monotone" 
                dataKey="Expected" 
                stroke="hsl(220, 100%, 60%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(220, 100%, 60%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No event attendance data available</p>
              <p className="text-sm">Start recording event attendance to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventAttendanceTrendChart;
