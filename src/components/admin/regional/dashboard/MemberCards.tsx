import React from 'react';
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

const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all duration-300">
    {children}
  </div>
);

const MemberCards: React.FC<MemberCardsProps> = ({ members, isLoading: membersLoading }) => {
  const { userRegion } = useAuth();
  const { data: attendanceWithTypes, isLoading: isLoadingWithTypes, error: historyError } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: currentTarget, isLoading: isLoadingTarget } = useCurrentMemberTarget();

  const totalMembers = members?.filter(m => m.member_type === 'member').length || 0;
  const totalVisitors = members?.filter(m => m.member_type === 'visitor').length || 0;

  const growthTrends = React.useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length < 2) {
      return { memberGrowth: 0, visitorGrowth: 0 };
    }
    const half = Math.ceil(attendanceWithTypes.length / 2);
    const recent = attendanceWithTypes.slice(0, half);
    const prev = attendanceWithTypes.slice(half);
    if (!recent.length || !prev.length) return { memberGrowth: 0, visitorGrowth: 0 };

    const recentAvgM = recent.reduce((s, e) => s + e.members_present, 0) / recent.length;
    const prevAvgM = prev.reduce((s, e) => s + e.members_present, 0) / prev.length;
    const recentAvgV = recent.reduce((s, e) => s + e.visitors_present, 0) / recent.length;
    const prevAvgV = prev.reduce((s, e) => s + e.visitors_present, 0) / prev.length;

    return {
      memberGrowth: prevAvgM > 0 ? Math.round(((recentAvgM - prevAvgM) / prevAvgM) * 100) : 0,
      visitorGrowth: prevAvgV > 0 ? Math.round(((recentAvgV - prevAvgV) / prevAvgV) * 100) : 0,
    };
  }, [attendanceWithTypes]);

  const isLoading = membersLoading || isLoadingWithTypes || isLoadingTarget;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  if (historyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading attendance data</AlertTitle>
        <AlertDescription>{historyError instanceof Error ? historyError.message : 'An unknown error occurred'}</AlertDescription>
      </Alert>
    );
  }

  const TrendBadge = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-xs text-muted-foreground">0%</span>;
    const pos = value > 0;
    return (
      <div className={`flex items-center gap-1 ${pos ? 'text-green-600' : 'text-red-600'}`}>
        {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-xs font-medium">{pos ? '+' : ''}{value}%</span>
      </div>
    );
  };

  const targetProgress = currentTarget ? Math.round((totalMembers / currentTarget.target_members) * 100) : null;
  const daysLeft = currentTarget ? differenceInDays(new Date(currentTarget.target_date), new Date()) : null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Total Members</span>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold">{totalMembers}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{members?.filter(m => m.status === 'active').length || 0} active</p>
          <TrendBadge value={growthTrends.memberGrowth} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Total Visitors</span>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="text-2xl font-bold">{totalVisitors}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">Registered visitors</p>
          <TrendBadge value={growthTrends.visitorGrowth} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Member Target</span>
          <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className="text-2xl font-bold">{targetProgress !== null ? `${targetProgress}%` : 'No Target'}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {currentTarget ? `${totalMembers} of ${currentTarget.target_members}` : 'Set a target'}
          </p>
          {daysLeft !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-orange-500' : 'text-blue-600'
            }`}>
              <Calendar className="h-3 w-3" />
              {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Growth Rate</span>
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="text-2xl font-bold">{growthTrends.memberGrowth}%</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">vs previous period</p>
          <TrendBadge value={growthTrends.memberGrowth} />
        </div>
      </GlassCard>
    </div>
  );
};

export default MemberCards;
