import React, { useMemo } from 'react';
import { Users, CheckCircle, Clock, Baby } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { HeroCard, RingTile } from '@/components/admin/dcg/DcgUI';
import type { MemberWithProfile } from '@/hooks/useMembers';

interface DcgMemberKPICardsProps {
  members: MemberWithProfile[] | undefined;
  isLoading: boolean;
  memberRelationships: { member_id: string; related_member_id: string }[];
  specialEventIds: Set<string>;
  dcgId?: string;
  selected?: string;
  onSelect?: (key: string) => void;
}

const DcgMemberKPICards: React.FC<DcgMemberKPICardsProps> = ({
  members,
  isLoading,
  memberRelationships,
  specialEventIds,
  dcgId,
  selected,
  onSelect,
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
      const eventIds = events.map((e) => e.id);
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
    recentAttendance.records.forEach((r) => {
      countMap.set(r.member_id, (countMap.get(r.member_id) || 0) + 1);
    });
    const set = new Set<string>();
    countMap.forEach((count, id) => {
      if (count >= threshold) set.add(id);
    });
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

    let newMembers = 0;
    let newChildren = 0;
    let newRegular = 0;

    members.forEach((m) => {
      const isNew = m.join_date && new Date(m.join_date) >= thirtyDaysAgo;
      if (childrenSet.has(m.id)) {
        childrenIds.push(m.id);
        if (isNew) newChildren++;
      } else if (m.member_type === 'visitor' && m.rated_event_id && specialEventIds.has(m.rated_event_id)) {
        // exclude special-event visitors from DCG KPI counts
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
      const activeCount = ids.filter((id) => activeMemberIds.has(id)).length;
      return Math.round((activeCount / ids.length) * 100);
    };

    return [
      {
        key: 'all',
        tone: 'var(--chart-1)',
        label: 'Total',
        count: totalIds.length,
        growth: calcGrowth(totalIds.length, newTotal),
        active: calcActive(totalIds),
        icon: Users,
      },
      {
        key: 'member',
        tone: 'var(--chart-2)',
        label: 'Members',
        count: memberTypeIds.length,
        growth: calcGrowth(memberTypeIds.length, newMembers),
        active: calcActive(memberTypeIds),
        icon: CheckCircle,
      },
      {
        key: 'visitor_regular',
        tone: 'var(--chart-3)',
        label: 'Regular Visitors',
        count: regularVisitorIds.length,
        growth: calcGrowth(regularVisitorIds.length, newRegular),
        active: calcActive(regularVisitorIds),
        icon: Clock,
      },
      {
        key: 'children',
        tone: 'var(--chart-5)',
        label: 'Children',
        count: childrenIds.length,
        growth: calcGrowth(childrenIds.length, newChildren),
        active: calcActive(childrenIds),
        icon: Baby,
      },
    ];
  }, [members, memberRelationships, specialEventIds, activeMemberIds]);

  if (isLoading || !kpiData) {
    return (
      <div className="space-y-3">
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const [total, ...rest] = kpiData;
  return (
    <div className="space-y-3">
      <HeroCard
        eyebrow="People in your DCG"
        value={total.count}
        sub={<>{total.growth >= 0 ? '+' : ''}{total.growth}% joined in the last 30 days</>}
        ring={total.active}
        ringLabel="Active"
      />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {rest.map((k) => (
          <RingTile
            key={k.key}
            icon={k.icon}
            label={k.label}
            value={k.count}
            ring={k.active}
            ringLabel="active"
            tone={k.tone}
            active={selected === k.key}
            onClick={onSelect ? () => onSelect(selected === k.key ? 'all' : k.key) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default DcgMemberKPICards;
