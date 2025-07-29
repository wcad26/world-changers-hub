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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events you're expected to attend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{event.location}</span>
                    </div>
                  </div>
                  <Badge variant={event.type === 'regional' ? 'default' : 'secondary'}>
                    {event.type.toUpperCase()}
                  </Badge>
                </div>
              ))}
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
          <div className="h-40 flex items-end justify-between gap-2">
            {[85, 92, 78, 88, 95, 87].map((rate, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary rounded-t"
                  style={{ height: `${rate}%` }}
                ></div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(2024, 6 + index).toLocaleDateString('en', { month: 'short' })}
                </p>
                <p className="text-xs font-medium text-foreground">{rate}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}