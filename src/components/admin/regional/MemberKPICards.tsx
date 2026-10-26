import React, { useMemo } from 'react';
import { Users, CheckCircle, Clock, Baby, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { HeroCard, RingTile } from '@/components/admin/regional/RegionalUI';
import type { MemberWithProfile } from '@/hooks/useMembers';

interface MemberKPICardsProps {
  members: MemberWithProfile[] | undefined;
  isLoading: boolean;
  memberRelationships: { member_id: string; related_member_id: string }[];
  specialEventIds: Set<string>;
  regionId?: string;
  selected?: string;
  onSelect?: (key: string) => void;
}

const MemberKPICards: React.FC<MemberKPICardsProps> = ({
  members, isLoading, memberRelationships, specialEventIds, regionId, selected, onSelect
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

    // Single source of truth for the strict child rule.
    const childrenSet = buildChildrenSet(members, memberRelationships);

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
      { key: 'all', tone: 'var(--chart-1)', label: 'Total', count: totalIds.length, growth: calcGrowth(totalIds.length, newTotal), active: calcActive(totalIds), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
      { key: 'member', tone: 'var(--chart-2)', label: 'Members', count: memberTypeIds.length, growth: calcGrowth(memberTypeIds.length, newMembers), active: calcActive(memberTypeIds), icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
      { key: 'visitor_regular', tone: 'var(--chart-3)', label: 'Regular Visitors', count: regularVisitorIds.length, growth: calcGrowth(regularVisitorIds.length, newRegular), active: calcActive(regularVisitorIds), icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
      { key: 'children', tone: 'var(--chart-5)', label: 'Children', count: childrenIds.length, growth: calcGrowth(childrenIds.length, newChildren), active: calcActive(childrenIds), icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      { key: 'visitor_special', tone: 'var(--chart-4)', label: 'Special Event Visitors', count: specialVisitorIds.length, growth: calcGrowth(specialVisitorIds.length, newSpecial), active: calcActive(specialVisitorIds), icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    ];
  }, [members, memberRelationships, specialEventIds, activeMemberIds]);

  if (isLoading || !kpiData) {
    return (
      <div className="space-y-3">
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const [total, ...rest] = kpiData;
  return (
    <div className="space-y-3">
      <HeroCard eyebrow="People in your region" value={total.count}
        sub={<>{total.growth >= 0 ? '+' : ''}{total.growth}% joined in the last 30 days</>}
        ring={total.active} ringLabel="Active" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {rest.map((k) => (
          <RingTile key={k.key} icon={k.icon} label={k.label} value={k.count} ring={k.active} ringLabel="active" tone={k.tone}
            active={selected === k.key}
            onClick={onSelect ? () => onSelect(selected === k.key ? 'all' : k.key) : undefined} />
        ))}
      </div>
    </div>
  );
};

export default MemberKPICards;
