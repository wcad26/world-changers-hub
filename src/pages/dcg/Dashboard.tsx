import React, { useEffect, useState } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Calendar, DollarSign, TrendingUp, UserPlus, CalendarPlus, FileText, Eye,
  Clock, ArrowUpRight, ArrowDownRight, Baby
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useDcgEvents } from '@/hooks/useDcgEvents';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { useDcgAttendanceAnalytics, useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDcgs } from '@/hooks/useDCGs';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { buildChildrenSet } from '@/utils/childUtils';
import { supabase } from '@/integrations/supabase/client';

const DcgDashboard = () => {
  const { profile, userDcg } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find(d => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);
  
  const { data: dcgMembers = [] } = useDcgMembers(userDcg?.id);
  const { data: dcgEvents = [] } = useDcgEvents(userDcg?.id);
  const { data: attendanceAnalytics } = useDcgAttendanceAnalytics(userDcg?.id);
  const { data: attendanceHistory = [] } = useDcgAttendanceHistory(userDcg?.id);
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: monthlyTransactions = [] } = useFinancialTransactions({
    from: `${currentMonth}-01`,
    to: `${currentMonth}-31`
  });

  const dcgTransactions = monthlyTransactions.filter(t => t.dcg_id === userDcg?.id);
  
  const dcgFinancialSummary = dcgTransactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount);
    const categoryType = transaction.category?.type;
    if (categoryType?.toLowerCase() === 'income') {
      acc.total_income += amount;
      if (transaction.category?.name === 'Offerings') acc.total_offerings += amount;
      else if (transaction.category?.name === 'Special Giving') acc.total_special_giving += amount;
    } else if (categoryType?.toLowerCase() === 'expense') {
      acc.total_expenses += amount;
    }
    return acc;
  }, { total_income: 0, total_expenses: 0, total_offerings: 0, total_special_giving: 0 });

  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingEvents = dcgEvents.filter(event => {
    const eventDate = new Date(event.start_datetime);
    return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
  });

  const recentAttendance = attendanceHistory.slice(0, 3);
  const activeMembers = dcgMembers.filter(member => member.is_active);
  const totalMembers = activeMembers.length;

  const stats = [
    {
      title: "Members", value: totalMembers.toString(),
      description: "Active DCG members", icon: Users,
      trend: totalMembers > 0 ? `${totalMembers} active` : "No members",
      trendType: "neutral" as const
    },
    {
      title: "Upcoming", value: upcomingEvents.length.toString(),
      description: "Next 7 days", icon: Calendar,
      trend: upcomingEvents.length > 0 ? "View events" : "None",
      trendType: "neutral" as const
    },
    {
      title: "Income", value: formatWithCurrency(dcgFinancialSummary.total_income, regionCurrency),
      description: "This month", icon: DollarSign,
      trend: `${formatWithCurrency(dcgFinancialSummary.total_offerings, regionCurrency)} offerings`,
      trendType: "positive" as const
    },
    {
      title: "Attendance", value: attendanceAnalytics ? `${Math.round(attendanceAnalytics.averageAttendanceRate)}%` : "N/A",
      description: "Average rate", icon: TrendingUp,
      trend: attendanceAnalytics?.monthlyChange 
        ? `${attendanceAnalytics.monthlyChange > 0 ? '+' : ''}${Math.round(attendanceAnalytics.monthlyChange)}%`
        : "No data",
      trendType: (attendanceAnalytics?.monthlyChange || 0) >= 0 ? "positive" : "negative" as const
    }
  ];

  const quickActions = [
    { title: "Add Member", icon: UserPlus, action: () => navigate('/dcg/members') },
    { title: "Create Event", icon: CalendarPlus, action: () => navigate('/dcg/events') },
    { title: "Record Income", icon: DollarSign, action: () => navigate('/dcg/finances') },
    { title: "View Reports", icon: FileText, action: () => navigate('/dcg/reports') },
  ];

  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Hidden on mobile (header shows title) */}
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold">DCG Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name}! Here's your {userDcg?.name} overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium truncate pr-1">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-lg md:text-2xl font-bold truncate">{stat.value}</div>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                  {stat.description}
                </p>
                <div className={`text-[10px] md:text-xs font-medium mt-1 flex items-center gap-0.5 ${
                  stat.trendType === 'positive' ? 'text-green-600' : 
                  stat.trendType === 'negative' ? 'text-red-600' : 'text-primary'
                }`}>
                  {stat.trendType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                  {stat.trendType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                  <span className="truncate">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - mobile 2x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1.5"
              onClick={action.action}
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Recent Activities</CardTitle>
            <CardDescription>Latest updates from your DCG</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((event) => (
                  <div key={event.event_id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      event.total_present > event.total_absent ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.event_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.total_present} present, {event.total_absent} absent
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(event.event_date), 'MMM d')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent attendance records</p>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-primary">Upcoming Events</h4>
                    {upcomingEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_datetime), 'PPP p')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members & Finances Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6">
              <div>
                <CardTitle className="text-base md:text-lg">Members</CardTitle>
                <CardDescription>Current membership</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dcg/members')}>
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">View All</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Members</span>
                  <Badge variant="secondary">{totalMembers}</Badge>
                </div>
                {totalMembers > 0 ? (
                  <div className="space-y-2">
                    {activeMembers.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.members?.profiles?.last_name} {member.members?.profiles?.first_name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                        </div>
                      </div>
                    ))}
                    {totalMembers > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        And {totalMembers - 3} more...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6">
              <div>
                <CardTitle className="text-base md:text-lg">Finances</CardTitle>
                <CardDescription>This month</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dcg/finances')}>
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Details</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Income</span>
                  <span className="font-medium text-green-600 text-sm">
                    {formatWithCurrency(dcgFinancialSummary.total_income, regionCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Offerings</span>
                  <span className="text-sm text-muted-foreground">
                    {formatWithCurrency(dcgFinancialSummary.total_offerings, regionCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expenses</span>
                  <span className="font-medium text-red-600 text-sm">
                    {formatWithCurrency(dcgFinancialSummary.total_expenses, regionCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Balance</span>
                  <span className={`font-medium text-sm ${
                    dcgFinancialSummary.total_income - dcgFinancialSummary.total_expenses >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatWithCurrency(dcgFinancialSummary.total_income - dcgFinancialSummary.total_expenses, regionCurrency)}
                  </span>
                </div>
                {dcgTransactions.length === 0 && (
                  <div className="text-center py-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No transactions this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgDashboard;
