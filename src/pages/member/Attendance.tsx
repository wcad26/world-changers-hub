import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
          <div className="h-40 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[100, 80, 60, 40, 20].map((value) => (
                <div key={value} className="flex items-center">
                  <span className="text-xs text-muted-foreground w-8">{value}%</span>
                  <div className="flex-1 h-px bg-border opacity-30"></div>
                </div>
              ))}
            </div>
            
            {/* Trend line */}
            <div className="absolute inset-0 pl-8">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Area under curve */}
                <path
                  d="M 0 15 L 60 8 L 120 22 L 180 12 L 240 5 L 300 13 L 300 100 L 0 100 Z"
                  fill="url(#attendanceGradient)"
                  className="animate-fade-in"
                />
                
                {/* Trend line */}
                <path
                  d="M 0 15 L 60 8 L 120 22 L 180 12 L 240 5 L 300 13"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-fade-in"
                  style={{
                    strokeDasharray: "1000",
                    strokeDashoffset: "1000",
                    animation: "dash-line 2s ease-out forwards"
                  }}
                />
                
                {/* Data points */}
                {[
                  { x: 0, y: 15, rate: 85 },
                  { x: 60, y: 8, rate: 92 },
                  { x: 120, y: 22, rate: 78 },
                  { x: 180, y: 12, rate: 88 },
                  { x: 240, y: 5, rate: 95 },
                  { x: 300, y: 13, rate: 87 }
                ].map((point, index) => (
                  <g key={index}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="hsl(var(--primary))"
                      className="animate-scale-in hover:r-6 transition-all duration-200 cursor-pointer"
                      style={{ animationDelay: `${index * 200 + 1500}ms` }}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      fill="hsl(var(--primary))"
                      opacity="0.2"
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 200 + 1500}ms` }}
                    />
                  </g>
                ))}
              </svg>
            </div>
            
            {/* Month labels */}
            <div className="absolute bottom-0 left-8 right-0 flex justify-between">
              {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => (
                <div key={month} className="flex flex-col items-center">
                  <p className="text-xs text-muted-foreground font-medium">{month}</p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {[85, 92, 78, 88, 95, 87][index]}%
                  </p>
                </div>
              ))}
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