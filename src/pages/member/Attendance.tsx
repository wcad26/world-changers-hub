import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
export default function MemberAttendance() {
  const { user } = useAuth();

  // Mock data - will be replaced with actual hooks when available
  const attendanceStats = {
    overall_rate: 87,
    regional_events: 12,
    dcg_events: 24,
    recent_streak: 5,
    last_event: "Sunday Service - Dec 15, 2024"
  };

  const recentEvents = [
    { id: 1, name: "Sunday Service", date: "2024-12-15", type: "regional", attended: true },
    { id: 2, name: "DCG Meeting", date: "2024-12-12", type: "dcg", attended: true },
    { id: 3, name: "Prayer Meeting", date: "2024-12-10", type: "regional", attended: false },
    { id: 4, name: "DCG Meeting", date: "2024-12-05", type: "dcg", attended: true },
    { id: 5, name: "Sunday Service", date: "2024-12-08", type: "regional", attended: true },
  ];

  const upcomingEvents = [
    { id: 1, name: "Sunday Service", date: "2024-12-22", type: "regional", location: "Main Church" },
    { id: 2, name: "DCG Meeting", date: "2024-12-19", type: "dcg", location: "Community Center" },
    { id: 3, name: "Christmas Service", date: "2024-12-25", type: "regional", location: "Main Church" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{attendanceStats.overall_rate}%</p>
                <p className="text-sm text-muted-foreground">Overall Rate</p>
              </div>
            </div>
            <Progress value={attendanceStats.overall_rate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{attendanceStats.regional_events}</p>
                <p className="text-sm text-muted-foreground">Regional Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{attendanceStats.dcg_events}</p>
                <p className="text-sm text-muted-foreground">DCG Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{attendanceStats.recent_streak}</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trend</CardTitle>
          <CardDescription>Your attendance pattern over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Jul', rate: 85 },
                  { month: 'Aug', rate: 92 },
                  { month: 'Sep', rate: 78 },
                  { month: 'Oct', rate: 88 },
                  { month: 'Nov', rate: 95 },
                  { month: 'Dec', rate: 87 },
                ]}
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  width={45}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  formatter={(value: number) => [`${value}%`, 'Attendance']}
                />
                <Bar 
                  dataKey="rate" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  {[85, 92, 78, 88, 95, 87].map((rate, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={rate >= 90 ? 'hsl(var(--primary))' : rate >= 80 ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--muted-foreground) / 0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <span className="text-muted-foreground">Good (80-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted-foreground/50" />
              <span className="text-muted-foreground">Needs Improvement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your attendance history for the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-foreground">{event.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={event.type === 'regional' ? 'default' : 'secondary'}>
                    {event.type.toUpperCase()}
                  </Badge>
                  <Badge variant={event.attended ? 'default' : 'destructive'}>
                    {event.attended ? 'Present' : 'Absent'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}