import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  UserPlus, 
  CalendarPlus, 
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useDcgEvents } from '@/hooks/useDcgEvents';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { useDcgAttendanceAnalytics, useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const DcgDashboard = () => {
  const { profile, userDcg } = useAuth();
  const navigate = useNavigate();
  
  // Data hooks
  const { data: dcgMembers = [] } = useDcgMembers(userDcg?.id);
  const { data: dcgEvents = [] } = useDcgEvents(userDcg?.id);
  const { data: attendanceAnalytics } = useDcgAttendanceAnalytics(userDcg?.id);
  const { data: attendanceHistory = [] } = useDcgAttendanceHistory(userDcg?.id);
  
  // Financial data with current month filter
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: monthlyTransactions = [] } = useFinancialTransactions({
    from: `${currentMonth}-01`,
    to: `${currentMonth}-31`
  });
  const { data: financialSummary } = useFinancialSummary({
    from: `${currentMonth}-01`,
    to: `${currentMonth}-31`
  });

  // Filter DCG-specific transactions
  const dcgTransactions = monthlyTransactions.filter(t => t.dcg_id === userDcg?.id);
  
  // Calculate DCG financial summary
  const dcgFinancialSummary = dcgTransactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount);
    const categoryType = transaction.category?.type;
    
    if (categoryType?.toLowerCase() === 'income') {
      acc.total_income += amount;
      if (transaction.category?.name === 'Offerings') {
        acc.total_offerings += amount;
      } else if (transaction.category?.name === 'Special Giving') {
        acc.total_special_giving += amount;
      }
    } else if (categoryType?.toLowerCase() === 'expense') {
      acc.total_expenses += amount;
    }
    
    return acc;
  }, {
    total_income: 0,
    total_expenses: 0,
    total_offerings: 0,
    total_special_giving: 0,
  });

  // Upcoming events (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingEvents = dcgEvents.filter(event => {
    const eventDate = new Date(event.start_datetime);
    return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
  });

  // Recent attendance (last 3 events)
  const recentAttendance = attendanceHistory.slice(0, 3);

  // Active vs inactive members
  const activeMembers = dcgMembers.filter(member => member.is_active);
  const totalMembers = activeMembers.length;

  const stats = [
    {
      title: "Total Members",
      value: totalMembers.toString(),
      description: "Active DCG members",
      icon: Users,
      trend: totalMembers > 0 ? `${totalMembers} active` : "No members",
      trendType: "neutral" as const
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.length.toString(),
      description: "Next 7 days",
      icon: Calendar,
      trend: upcomingEvents.length > 0 ? "View events" : "No upcoming events",
      trendType: "neutral" as const
    },
    {
      title: "Monthly Income",
      value: `$${dcgFinancialSummary.total_income.toFixed(0)}`,
      description: "This month",
      icon: DollarSign,
      trend: `$${dcgFinancialSummary.total_offerings.toFixed(0)} offerings`,
      trendType: "positive" as const
    },
    {
      title: "Attendance Rate",
      value: attendanceAnalytics ? `${Math.round(attendanceAnalytics.averageAttendanceRate)}%` : "N/A",
      description: "Average attendance",
      icon: TrendingUp,
      trend: attendanceAnalytics?.monthlyChange 
        ? `${attendanceAnalytics.monthlyChange > 0 ? '+' : ''}${Math.round(attendanceAnalytics.monthlyChange)}% this month`
        : "No data",
      trendType: (attendanceAnalytics?.monthlyChange || 0) >= 0 ? "positive" : "negative" as const
    }
  ];

  const quickActions = [
    {
      title: "Add New Member",
      description: "Register a new DCG member",
      icon: UserPlus,
      action: () => navigate('/dcg/members')
    },
    {
      title: "Create Event",
      description: "Schedule a new DCG event",
      icon: CalendarPlus,
      action: () => navigate('/dcg/events')
    },
    {
      title: "Record Income",
      description: "Add income or expense entry",
      icon: DollarSign,
      action: () => navigate('/dcg/finances')
    },
    {
      title: "View Reports",
      description: "Generate DCG reports",
      icon: FileText,
      action: () => navigate('/dcg/reports')
    }
  ];

  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DCG Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name}! Here's your {userDcg?.name} overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                  stat.trendType === 'positive' ? 'text-green-600' : 
                  stat.trendType === 'negative' ? 'text-red-600' : 
                  'text-primary'
                }`}>
                  {stat.trendType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                  {stat.trendType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4">
          {/* Recent Activities */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest updates from your DCG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((event, index) => (
                    <div key={event.event_id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        event.total_present > event.total_absent ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.total_present} present, {event.total_absent} absent
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
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
                        <div key={event.id} className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.name}</p>
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
        </div>

        {/* Members & Finances Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Members Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Members Overview</CardTitle>
                <CardDescription>Current DCG membership</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dcg/members')}>
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Active Members</span>
                  <Badge variant="secondary">{totalMembers}</Badge>
                </div>
                
                {totalMembers > 0 ? (
                  <div className="space-y-2">
                    {activeMembers.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.members?.profiles?.first_name} {member.members?.profiles?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                        </div>
                      </div>
                    ))}
                    {totalMembers > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        And {totalMembers - 3} more members...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No members registered yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>This month's finances</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dcg/finances')}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Income</span>
                    <span className="font-medium text-green-600">
                      ${dcgFinancialSummary.total_income.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Offerings</span>
                    <span className="text-sm text-muted-foreground">
                      ${dcgFinancialSummary.total_offerings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Special Giving</span>
                    <span className="text-sm text-muted-foreground">
                      ${dcgFinancialSummary.total_special_giving.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Expenses</span>
                    <span className="font-medium text-red-600">
                      ${dcgFinancialSummary.total_expenses.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Balance</span>
                    <span className={`font-medium ${
                      dcgFinancialSummary.total_income - dcgFinancialSummary.total_expenses >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ${(dcgFinancialSummary.total_income - dcgFinancialSummary.total_expenses).toFixed(2)}
                    </span>
                  </div>
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