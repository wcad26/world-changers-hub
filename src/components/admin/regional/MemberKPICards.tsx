import React, { useMemo } from 'react';
import { Users, CheckCircle, Clock, Baby, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import type { MemberWithProfile } from '@/hooks/useMembers';

interface MemberKPICardsProps {
  members: MemberWithProfile[] | undefined;
  isLoading: boolean;
  memberRelationships: { member_id: string; related_member_id: string }[];
  specialEventIds: Set<string>;
  regionId?: string;
}

const MemberKPICards: React.FC<MemberKPICardsProps> = ({
  members, isLoading, memberRelationships, specialEventIds, regionId
}) => {
  // Fetch last 5 regional attendance events + records
  const { data: recentAttendance } = useQuery({
    queryKey: ['member-kpi-activity', regionId],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('attendance_events')
        .select('id')
        .eq('region_id', regionId!)
        .is('dcg_id', null)
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
    enabled: !!regionId,
  });

  // Build active member set (attended ≥50% of last 5 events)
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

  // Categorize members
  const kpiData = useMemo(() => {
    if (!members) return null;

    // Build adult DOB lookup so isChildMember can verify the related party is an adult.
    const adultDobLookup = new Map<string, string | null | undefined>();
    members.forEach(m => adultDobLookup.set(m.id, m.profiles?.date_of_birth));

    const childrenSet = new Set<string>();
    members.forEach(m => {
      if (isChildMember(m.profiles?.date_of_birth, m.id, memberRelationships, adultDobLookup)) {
        childrenSet.add(m.id);
      }
    });

    const totalIds: string[] = [];
    const memberTypeIds: string[] = [];
    const regularVisitorIds: string[] = [];
    const childrenIds: string[] = [];
    const specialVisitorIds: string[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let newTotal = 0, newMembers = 0, newChildren = 0, newRegular = 0, newSpecial = 0;

    members.forEach(m => {
      totalIds.push(m.id);
      const isNew = m.join_date && new Date(m.join_date) >= thirtyDaysAgo;
      if (isNew) newTotal++;

      if (childrenSet.has(m.id)) {
        childrenIds.push(m.id);
        if (isNew) newChildren++;
      } else if (m.member_type === 'visitor' && m.rated_event_id && specialEventIds.has(m.rated_event_id)) {
        specialVisitorIds.push(m.id);
        if (isNew) newSpecial++;
      } else if (m.member_type === 'visitor') {
        regularVisitorIds.push(m.id);
        if (isNew) newRegular++;
      } else {
        memberTypeIds.push(m.id);
        if (isNew) newMembers++;
      }
    });

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
      { label: 'Regular Visitors', count: regularVisitorIds.length, growth: calcGrowth(regularVisitorIds.length, newRegular), active: calcActive(regularVisitorIds), icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Children', count: childrenIds.length, growth: calcGrowth(childrenIds.length, newChildren), active: calcActive(childrenIds), icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      { label: 'Special Event Visitors', count: specialVisitorIds.length, growth: calcGrowth(specialVisitorIds.length, newSpecial), active: calcActive(specialVisitorIds), icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    ];
  }, [members, memberRelationships, specialEventIds, activeMemberIds]);

  if (isLoading || !kpiData) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 h-[140px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {kpiData.map(({ label, count, growth, active, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{count}</p>
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

export default MemberKPICards;
