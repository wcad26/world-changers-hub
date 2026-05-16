import React, { useMemo } from 'react';
import { Users, CheckCircle, Clock, Baby, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import type { MemberWithProfile } from '@/hooks/useMembers';

interface DcgMemberKPICardsProps {
  members: MemberWithProfile[] | undefined;
  isLoading: boolean;
  memberRelationships: { member_id: string; related_member_id: string }[];
  specialEventIds: Set<string>;
  dcgId?: string;
}

const DcgMemberKPICards: React.FC<DcgMemberKPICardsProps> = ({
  members, isLoading, memberRelationships, specialEventIds, dcgId,
}) => {
  const { data: recentAttendance } = useQuery({
    queryKey: ['dcg-member-kpi-activity', dcgId],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('attendance_events')
        .select('id')
        .eq('dcg_id', dcgId!)
        .order('event_date', { ascending: false })
        .limit(5);
      if (!events?.length) return { eventCount: 0, records: [] as { member_id: string }[] };
      const eventIds = events.map(e => e.id);
      const { data: records } = await supabase
        .from('attendance_records')
        .select('member_id')
        .in('event_id', eventIds)
        .eq('is_present', true);
      return { eventCount: events.length, records: records || [] };
    },
    enabled: !!dcgId,
  });

  const activeMemberIds = useMemo(() => {
    if (!recentAttendance || recentAttendance.eventCount === 0) return new Set<string>();
    const threshold = Math.ceil(recentAttendance.eventCount / 2);
    const countMap = new Map<string, number>();
    recentAttendance.records.forEach(r => {
      countMap.set(r.member_id, (countMap.get(r.member_id) || 0) + 1);
    });
    const set = new Set<string>();
    countMap.forEach((count, id) => { if (count >= threshold) set.add(id); });
    return set;
  }, [recentAttendance]);

  const kpiData = useMemo(() => {
    if (!members) return null;

    const childrenSet = buildChildrenSet(members, memberRelationships);

    const memberTypeIds: string[] = [];
    const regularVisitorIds: string[] = [];
    const childrenIds: string[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let newMembers = 0, newChildren = 0, newRegular = 0;

    members.forEach(m => {
      const isNew = m.join_date && new Date(m.join_date) >= thirtyDaysAgo;
      if (childrenSet.has(m.id)) {
        childrenIds.push(m.id);
        if (isNew) newChildren++;
      } else if (m.member_type === 'visitor' && m.rated_event_id && specialEventIds.has(m.rated_event_id)) {
        // exclude special-event visitors
      } else if (m.member_type === 'visitor') {
        regularVisitorIds.push(m.id);
        if (isNew) newRegular++;
      } else {
        memberTypeIds.push(m.id);
        if (isNew) newMembers++;
      }
    });

    const totalIds = [...memberTypeIds, ...regularVisitorIds, ...childrenIds];
    const newTotal = newMembers + newChildren + newRegular;

    const calcGrowth = (total: number, newCount: number) => {
      const prev = total - newCount;
      return prev > 0 ? Math.round((newCount / prev) * 100) : newCount > 0 ? 100 : 0;
    };

    const calcActive = (ids: string[]) => {
      if (ids.length === 0) return 0;
      const activeCount = ids.filter(id => activeMemberIds.has(id)).length;
      return Math.round((activeCount / ids.length) * 100);
    };

    return [
      { label: 'Total', count: totalIds.length, growth: calcGrowth(totalIds.length, newTotal), active: calcActive(totalIds), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Members', count: memberTypeIds.length, growth: calcGrowth(memberTypeIds.length, newMembers), active: calcActive(memberTypeIds), icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Children', count: childrenIds.length, growth: calcGrowth(childrenIds.length, newChildren), active: calcActive(childrenIds), icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      { label: 'Regular Visitors', count: regularVisitorIds.length, growth: calcGrowth(regularVisitorIds.length, newRegular), active: calcActive(regularVisitorIds), icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    ];
  }, [members, memberRelationships, specialEventIds, activeMemberIds]);

  if (isLoading || !kpiData) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 h-[140px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpiData.map(({ label, count, growth, active, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <p className="font-bold text-foreground text-lg">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">Active: {active}%</p>
          <div className="mt-2">
            {growth !== 0 ? (
              <div className={`flex items-center gap-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="text-xs font-medium">{growth > 0 ? '+' : ''}{growth}% last 30 days</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">0% growth</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DcgMemberKPICards;
