import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useCurrentMemberTarget } from '@/hooks/useMemberTargets';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import type { MemberWithProfile } from '@/hooks/useMembers';

interface MemberCardsProps {
  members?: MemberWithProfile[];
  isLoading?: boolean;
}

const MemberCards: React.FC<MemberCardsProps> = ({ members, isLoading: membersLoading }) => {
  const { userRegion } = useAuth();
  // Only fetch attendance data - members come from props now
  const { data: attendanceWithTypes, isLoading: isLoadingWithTypes, error: historyError } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: currentTarget, isLoading: isLoadingTarget } = useCurrentMemberTarget();

  // Component for percentage indicator
  const PercentageIndicator = ({ percentage }: { percentage: number }) => {
    const isPositive = percentage > 0;
    const isNegative = percentage < 0;
    
    if (percentage === 0) {
      return (
        <div className="flex items-center gap-1 text-primary">
          <span className="text-xs font-medium">0%</span>
        </div>
      );
    }
    
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{percentage}%
        </span>
      </div>
    );
  };

  const totalMembers = members?.filter(m => m.member_type === 'member').length || 0;
  const totalVisitors = members?.filter(m => m.member_type === 'visitor').length || 0;

  // Calculate active members based on attendance (haven't missed last 3 events)
  const activeMembers = React.useMemo(() => {
    if (!attendanceWithTypes || !members) return 0;
    const last3Events = attendanceWithTypes.slice(0, 3);
    if (last3Events.length === 0) return totalMembers;

    return members.filter(member => {
      if (member.member_type !== 'member') return false;
      
      // Count how many of the last 3 events this member attended
      const attendedEvents = last3Events.filter(event => {
        // This is a simplified check - in reality you'd need attendance_records data for each member
        // For now, we'll use a placeholder logic
        return true; // Placeholder - would need actual attendance record lookup
      });
      
      // Member is active if they attended at least 1 of the last 3 events
      return attendedEvents.length > 0;
    }).length;
  }, [attendanceWithTypes, members, totalMembers]);

  // Calculate inactive visitors (missed last 2 events)
  const inactiveVisitors = React.useMemo(() => {
    if (!attendanceWithTypes || !members) return 0;
    const last2Events = attendanceWithTypes.slice(0, 2);
    if (last2Events.length === 0) return 0;

    return members.filter(member => {
      if (member.member_type !== 'visitor') return false;
      
      // Count how many of the last 2 events this visitor attended
      const attendedEvents = last2Events.filter(event => {
        // This is a simplified check - in reality you'd need attendance_records data for each member
        // For now, we'll use a placeholder logic
        return true; // Placeholder - would need actual attendance record lookup
      });
      
      // Visitor is inactive if they missed both of the last 2 events
      return attendedEvents.length === 0;
    }).length;
  }, [attendanceWithTypes, members]);

  const attendanceSummary = React.useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length === 0) return { avgAttendance: 0, lastEvent: null };
    const totalAttendance = attendanceWithTypes.reduce((sum, event) => sum + event.total_present, 0);
    const avgAttendance = attendanceWithTypes.length > 0 ? (totalAttendance / attendanceWithTypes.length) : 0;
    return {
      avgAttendance: Math.round(avgAttendance),
      lastEvent: attendanceWithTypes[0]
    };
  }, [attendanceWithTypes]);

  // Calculate growth trends for the cards
  const growthTrends = React.useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length < 2) {
      return {
        memberGrowth: 0,
        visitorGrowth: 0,
        avgAttendanceGrowth: 0,
        lastEventGrowth: 0
      };
    }

    // Get recent vs previous period data
    const recentEvents = attendanceWithTypes.slice(0, Math.ceil(attendanceWithTypes.length / 2));
    const previousEvents = attendanceWithTypes.slice(Math.ceil(attendanceWithTypes.length / 2));

    if (recentEvents.length === 0 || previousEvents.length === 0) {
      return {
        memberGrowth: 0,
        visitorGrowth: 0,
        avgAttendanceGrowth: 0,
        lastEventGrowth: 0
      };
    }

    // Calculate averages for recent vs previous periods
    const recentAvgMembers = recentEvents.reduce((sum, e) => sum + e.members_present, 0) / recentEvents.length;
    const previousAvgMembers = previousEvents.reduce((sum, e) => sum + e.members_present, 0) / previousEvents.length;
    
    const recentAvgVisitors = recentEvents.reduce((sum, e) => sum + e.visitors_present, 0) / recentEvents.length;
    const previousAvgVisitors = previousEvents.reduce((sum, e) => sum + e.visitors_present, 0) / previousEvents.length;

    const recentAvgTotal = recentEvents.reduce((sum, e) => sum + e.total_present, 0) / recentEvents.length;
    const previousAvgTotal = previousEvents.reduce((sum, e) => sum + e.total_present, 0) / previousEvents.length;

    // Calculate growth percentages
    const memberGrowth = previousAvgMembers > 0 ? Math.round(((recentAvgMembers - previousAvgMembers) / previousAvgMembers) * 100) : 0;
    const visitorGrowth = previousAvgVisitors > 0 ? Math.round(((recentAvgVisitors - previousAvgVisitors) / previousAvgVisitors) * 100) : 0;
    const avgAttendanceGrowth = previousAvgTotal > 0 ? Math.round(((recentAvgTotal - previousAvgTotal) / previousAvgTotal) * 100) : 0;

    // For last event growth, compare with previous event
    const lastEventGrowth = attendanceWithTypes.length > 1 ? 
      Math.round(((attendanceWithTypes[0].total_present - attendanceWithTypes[1].total_present) / attendanceWithTypes[1].total_present) * 100) : 0;

    return {
      memberGrowth,
      visitorGrowth,
      avgAttendanceGrowth,
      lastEventGrowth
    };
  }, [attendanceWithTypes]);

  const isLoading = membersLoading || isLoadingWithTypes || isLoadingTarget;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (historyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading attendance data</AlertTitle>
        <AlertDescription>
          {historyError instanceof Error ? historyError.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{activeMembers} active</p>
            <PercentageIndicator percentage={growthTrends.memberGrowth} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisitors}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{inactiveVisitors} inactive visitors</p>
            <PercentageIndicator percentage={growthTrends.visitorGrowth} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Member Target</CardTitle>
          <Target className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentTarget ? (
              `${Math.round((totalMembers / currentTarget.target_members) * 100)}%`
            ) : (
              'No Target'
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {currentTarget ? (
                <>
                  {totalMembers} of {currentTarget.target_members} members
                </>
              ) : (
                'Set a target to track progress'
              )}
            </p>
            <div className={`flex items-center gap-1 ${
              currentTarget ? (
                (() => {
                  const progress = (totalMembers / currentTarget.target_members) * 100;
                  const daysLeft = differenceInDays(new Date(currentTarget.target_date), new Date());
                  
                  if (progress >= 100) return 'text-green-600';
                  if (daysLeft < 0) return 'text-red-600';
                  if (daysLeft < 30) return 'text-orange-600';
                  return 'text-blue-600';
                })()
              ) : 'text-muted-foreground'
            }`}>
              {currentTarget && (
                <>
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {(() => {
                      const daysLeft = differenceInDays(new Date(currentTarget.target_date), new Date());
                      if (daysLeft < 0) return 'Overdue';
                      if (daysLeft === 0) return 'Due today';
                      if (daysLeft === 1) return '1 day left';
                      return `${daysLeft} days left`;
                    })()}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Member Growth Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{growthTrends.memberGrowth}%</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">vs previous period</p>
            <PercentageIndicator percentage={growthTrends.memberGrowth} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberCards;