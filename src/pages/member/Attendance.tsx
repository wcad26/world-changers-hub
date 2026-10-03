import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Users, Flame, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemberDetailedAttendance } from '@/hooks/useAttendance';
import PeriodFilter, { PeriodFilters } from '@/components/admin/regional/dashboard/PeriodFilter';
import { StatTile } from '@/components/member/MemberUI';
import { format } from 'date-fns';
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
  return <div className="space-y-6">
      

      {/* Period Filter */}
      <PeriodFilter filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="flex items-center gap-5 rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(attendanceData?.overall.rate || 0) / 100 * 97.4} 97.4`} />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-heading text-xl font-bold">{isLoading ? '…' : `${attendanceData?.overall.rate || 0}%`}</span>
          </div>
          <div>
            <p className="text-sm text-primary-foreground/75">Overall attendance</p>
            <p className="font-heading text-lg font-semibold">{attendanceData?.overall.attended || 0} of {attendanceData?.overall.total || 0} events</p>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Regional" value={isLoading ? '…' : `${attendanceData?.regional.attended || 0}/${attendanceData?.regional.total || 0}`} icon={Calendar} tone="var(--chart-6)" />
          <StatTile label="DCG" value={isLoading ? '…' : `${attendanceData?.dcg.attended || 0}/${attendanceData?.dcg.total || 0}`} icon={Users} tone="var(--chart-5)" />
          <StatTile label="Prayer" value={isLoading ? '…' : `${attendanceData?.prayerMeeting.attended || 0}/${attendanceData?.prayerMeeting.total || 0}`} icon={Heart} tone="var(--chart-7)" />
          <StatTile label="Streak" value={isLoading ? '…' : attendanceData?.streak || 0} sub="in a row" icon={Flame} tone="var(--chart-3)" />
        </div>
      </div>

      {/* Monthly Trend */}
      <Card className="rounded-2xl">
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
                fill: 'var(--muted-foreground)',
                fontSize: 12
              }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{
                fill: 'var(--muted-foreground)',
                fontSize: 12
              }} tickFormatter={value => `${value}%`} width={45} />
                  <Tooltip cursor={{
                fill: 'var(--muted)',
                opacity: 0.3
              }} contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} labelStyle={{
                color: 'var(--foreground)',
                fontWeight: 600
              }} formatter={(value: number) => [`${value}%`, 'Attendance']} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {attendanceData.monthlyTrend.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.rate >= 90 ? 'var(--chart-5)' : entry.rate >= 80 ? 'var(--chart-3)' : 'var(--chart-4)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-muted-foreground">
                No attendance data for the selected period
              </div>}
          </div>
          <div className="flex-col md:flex-row gap-2 md:gap-6 mt-4 text-sm flex items-start justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-5" />
              <span className="text-muted-foreground">Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-3" />
              <span className="text-muted-foreground">Good (80-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-4" />
              <span className="text-muted-foreground">Needs Improvement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your attendance history for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-muted-foreground">Loading...</div> : attendanceData?.recentEvents && attendanceData.recentEvents.length > 0 ? <div className="space-y-2">
              {attendanceData.recentEvents.map(event => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-foreground">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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