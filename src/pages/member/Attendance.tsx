import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Users, Flame, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemberDetailedAttendance } from '@/hooks/useAttendance';
import PeriodFilter, { PeriodFilters } from '@/components/admin/regional/dashboard/PeriodFilter';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
export default function MemberAttendance() {
  const {
    memberRecord,
    userRegion
  } = useAuth();

  // Period filter state
  const [filters, setFilters] = useState<PeriodFilters>({
    quickDateRange: '3-months',
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      to: new Date()
    }
  });
  const handleFiltersChange = (newFilters: Partial<PeriodFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Fetch attendance data with date filter
  const {
    data: attendanceData,
    isLoading
  } = useMemberDetailedAttendance(memberRecord?.id, userRegion?.id, filters.dateRange);
  return <div className="container mx-auto p-6 space-y-6 px-[15px]">
      

      {/* Period Filter */}
      <PeriodFilter filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Stats Overview - KPI Cards */}
      <div className="space-y-4 mb-6">
        {/* Overall Attendance Rate - Full Width */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '...' : `${attendanceData?.overall.rate || 0}%`}
                </p>
                <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
              </div>
            </div>
            <Progress value={attendanceData?.overall.rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* Other KPIs - 2x2 grid on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Regional Events */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoading ? '...' : `${attendanceData?.regional.attended || 0}/${attendanceData?.regional.total || 0}`}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Regional Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DCG */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoading ? '...' : `${attendanceData?.dcg.attended || 0}/${attendanceData?.dcg.total || 0}`}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">DCG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prayer Meeting */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoading ? '...' : `${attendanceData?.prayerMeeting.attended || 0}/${attendanceData?.prayerMeeting.total || 0}`}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Prayer Meeting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streaks */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoading ? '...' : attendanceData?.streak || 0}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Streaks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trend</CardTitle>
          <CardDescription>Your attendance pattern over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {isLoading ? <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div> : attendanceData?.monthlyTrend && attendanceData.monthlyTrend.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData.monthlyTrend} margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 5
            }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12
              }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12
              }} tickFormatter={value => `${value}%`} width={45} />
                  <Tooltip cursor={{
                fill: 'hsl(var(--muted))',
                opacity: 0.3
              }} contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: 600
              }} formatter={(value: number) => [`${value}%`, 'Attendance']} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {attendanceData.monthlyTrend.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.rate >= 90 ? 'hsl(var(--primary))' : entry.rate >= 80 ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--muted-foreground) / 0.5)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-muted-foreground">
                No attendance data for the selected period
              </div>}
          </div>
          <div className="flex-col md:flex-row gap-2 md:gap-6 mt-4 text-sm flex items-start justify-center">
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
          <CardDescription>Your attendance history for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : attendanceData?.recentEvents && attendanceData.recentEvents.length > 0 ? <div className="space-y-4">
              {attendanceData.recentEvents.map(event => <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.type === 'regional' ? 'default' : event.type === 'dcg' ? 'secondary' : 'outline'}>
                      {event.type === 'prayer' ? 'PRAYER' : event.type.toUpperCase()}
                    </Badge>
                    <Badge variant={event.attended ? 'default' : 'destructive'}>
                      {event.attended ? 'Present' : 'Absent'}
                    </Badge>
                  </div>
                </div>)}
            </div> : <div className="text-muted-foreground">No events found for the selected period</div>}
        </CardContent>
      </Card>
    </div>;
}