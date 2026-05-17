import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { isChildMember } from '@/utils/childUtils';
import type { MemberWithProfile } from './useMembers';

const ALL = 'all';
const scope = (regionId?: string) => (!regionId || regionId === ALL ? undefined : regionId);

// ─────────── Members ───────────
export const useGlobalMembersScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-members', rid ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('members')
        .select(`*, profiles(*)`)
        .order('created_at', { ascending: false });
      if (rid) q = q.eq('region_id', rid);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as MemberWithProfile[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// ─────────── Events ───────────
export const useGlobalEventsScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-events', rid ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('events')
        .select('*')
        .order('start_datetime', { ascending: false });
      if (rid) q = q.eq('region_id', rid);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ─────────── Financials ───────────
export const useGlobalFinancialTransactionsScoped = (
  regionId?: string,
  filters?: { from?: string; to?: string },
) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-financial-tx', rid ?? 'all', filters],
    queryFn: async () => {
      let q = supabase
        .from('financial_transactions')
        .select('*, category:financial_transaction_categories(name, type)');
      if (rid) q = q.eq('region_id', rid);
      if (filters?.from) q = q.gte('transaction_date', filters.from);
      if (filters?.to) q = q.lte('transaction_date', filters.to);
      const { data, error } = await q.order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useGlobalFinancialSummaryScoped = (
  regionId?: string,
  filters?: { from?: string; to?: string },
) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-financial-summary', rid ?? 'all', filters],
    queryFn: async () => {
      let q = supabase
        .from('financial_transactions')
        .select('amount, category:financial_transaction_categories(name, type)');
      if (rid) q = q.eq('region_id', rid);
      if (filters?.from) q = q.gte('transaction_date', filters.from);
      if (filters?.to) q = q.lte('transaction_date', filters.to);
      const { data, error } = await q;
      if (error) throw error;
      let income = 0, expense = 0;
      (data || []).forEach((t: any) => {
        const amt = Number(t.amount) || 0;
        const type = (t.category?.type || '').toLowerCase();
        if (type === 'income') income += amt;
        else if (type === 'expense') expense += amt;
      });
      return { total_income: income, total_expenses: expense, net_balance: income - expense };
    },
  });
};

// ─────────── Discipleship ───────────
export const useGlobalDiscipleshipRelationshipsScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-disc-rels', rid ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('discipleship_relationships')
        .select('id, region_id');
      if (rid) q = q.eq('region_id', rid);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
};

// ─────────── Fundraising ───────────
export const useGlobalFundraisingCampaignsScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-campaigns', rid ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('fundraising_campaigns').select('goal, raised, region_id');
      if (rid) q = q.eq('region_id', rid);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
};

// ─────────── Active plan targets (SUM across regions when "all") ───────────
export const useGlobalActivePlanTargetsScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-active-plan-targets', rid ?? 'all'],
    queryFn: async () => {
      // Fetch active plan ids in scope
      let plansQ = supabase
        .from('regional_plans')
        .select('id, region_id')
        .eq('status', 'active');
      if (rid) plansQ = plansQ.eq('region_id', rid);
      const { data: plans, error: pErr } = await plansQ;
      if (pErr) throw pErr;

      const planIds = (plans || []).map((p: any) => p.id);
      if (!planIds.length) return { targetsByKey: {} as Record<string, number> };

      const { data: targets, error: tErr } = await supabase
        .from('regional_plan_targets')
        .select('metric_key, target_value')
        .in('plan_id', planIds);
      if (tErr) throw tErr;

      const map: Record<string, number> = {};
      (targets || []).forEach((t: any) => {
        if (!t.metric_key) return;
        map[t.metric_key] = (map[t.metric_key] || 0) + (Number(t.target_value) || 0);
      });
      return { targetsByKey: map };
    },
  });
};

// ─────────── DCG membership (across all regions or one) ───────────
export const useGlobalDcgMembershipScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-dcg-membership', rid ?? 'all'],
    queryFn: async () => {
      let dcgQ = supabase.from('dcgs').select('id, region_id').eq('is_active', true);
      if (rid) dcgQ = dcgQ.eq('region_id', rid);
      const { data: dcgs, error: dcgsErr } = await dcgQ;
      if (dcgsErr) throw dcgsErr;
      const dcgIds = (dcgs || []).map((d: any) => d.id);
      if (!dcgIds.length) {
        return { totalDcgMembers: 0, totalDcgAdults: 0, totalDcgChildren: 0 };
      }

      const { data: rows, error: dmErr } = await supabase
        .from('dcg_members')
        .select('member_id')
        .in('dcg_id', dcgIds)
        .eq('is_active', true);
      if (dmErr) throw dmErr;

      const memberIdSet = new Set<string>();
      (rows || []).forEach((r: any) => r.member_id && memberIdSet.add(r.member_id));
      if (memberIdSet.size === 0) {
        return { totalDcgMembers: 0, totalDcgAdults: 0, totalDcgChildren: 0 };
      }

      const ids = Array.from(memberIdSet);
      const { data: memberRows, error: mErr } = await supabase
        .from('members')
        .select('id, profiles:profile_id(date_of_birth)')
        .in('id', ids);
      if (mErr) throw mErr;

      const relationships = await fetchMemberRelationshipsForMembers(ids);
      const childIds = buildChildrenSet(
        (memberRows || []).map((m: any) => ({
          id: m.id,
          profiles: { date_of_birth: m.profiles?.date_of_birth ?? null },
        })),
        relationships,
      );

      const totalDcgMembers = memberIdSet.size;
      const totalDcgChildren = childIds.size;
      return {
        totalDcgMembers,
        totalDcgChildren,
        totalDcgAdults: Math.max(0, totalDcgMembers - totalDcgChildren),
      };
    },
  });
};

// ─────────── Attendance history with member types (global or scoped) ───────────
export const useGlobalAttendanceScoped = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-attendance', rid ?? 'all'],
    queryFn: async () => {
      // When scoped to a region, also include DCG-recorded attendance for that region's DCGs
      let dcgIds: string[] = [];
      if (rid) {
        const { data: regionalDcgs } = await supabase
          .from('dcgs').select('id').eq('region_id', rid);
        dcgIds = (regionalDcgs || []).map((d: any) => d.id);
      }

      let q = supabase
        .from('attendance_events')
        .select(`
          id, name, event_date, dcg_id, source_event_id, region_id,
          attendance_records!inner (
            is_present,
            members!inner (
              id, member_type,
              profiles ( date_of_birth )
            )
          )
        `)
        .order('event_date', { ascending: false });

      if (rid) {
        if (dcgIds.length > 0) {
          q = q.or(`region_id.eq.${rid},dcg_id.in.(${dcgIds.join(',')})`);
        } else {
          q = q.eq('region_id', rid);
        }
      }

      const { data, error } = await q;
      if (error) throw error;

      // Collect member ids/DOBs
      const memberIds = new Set<string>();
      const dobLookup = new Map<string, string | null | undefined>();
      (data || []).forEach((ev: any) => {
        (ev.attendance_records || []).forEach((r: any) => {
          if (r.members?.id) {
            memberIds.add(r.members.id);
            dobLookup.set(r.members.id, r.members?.profiles?.date_of_birth ?? null);
          }
        });
      });

      let relationships: Array<{ member_id: string; related_member_id: string }> = [];
      const adultDobLookup = new Map(dobLookup);
      if (memberIds.size > 0) {
        const ids = Array.from(memberIds);
        relationships = await fetchMemberRelationshipsForMembers(ids);
        const referenced = new Set<string>();
        relationships.forEach((r) => {
          referenced.add(r.member_id);
          referenced.add(r.related_member_id);
        });
        const missing = Array.from(referenced).filter((id) => !adultDobLookup.has(id));
        if (missing.length > 0) {
          const { data: extras } = await supabase
            .from('members')
            .select('id, profiles:profile_id(date_of_birth)')
            .in('id', missing);
          (extras || []).forEach((m: any) => {
            adultDobLookup.set(m.id, m.profiles?.date_of_birth ?? null);
          });
        }
      }

      const isChild = (rec: any) => {
        const dob = rec.members?.profiles?.date_of_birth;
        const mid = rec.members?.id;
        if (!mid) return false;
        return isChildMember(dob, mid, relationships, adultDobLookup);
      };

      return (data || []).map((event: any) => {
        const records = event.attendance_records || [];
        const presentMemberIds: string[] = [];
        const presentVisitorIds: string[] = [];
        const presentChildrenIds: string[] = [];
        let membersAbsent = 0, visitorsAbsent = 0, childrenAbsent = 0;
        records.forEach((r: any) => {
          const mid = r.members?.id;
          if (!mid) return;
          const child = isChild(r);
          if (r.is_present) {
            if (child) presentChildrenIds.push(mid);
            else if (r.members?.member_type === 'member') presentMemberIds.push(mid);
            else if (r.members?.member_type === 'visitor') presentVisitorIds.push(mid);
          } else {
            if (child) childrenAbsent++;
            else if (r.members?.member_type === 'member') membersAbsent++;
            else if (r.members?.member_type === 'visitor') visitorsAbsent++;
          }
        });
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          dcg_id: event.dcg_id || null,
          source_event_id: event.source_event_id || null,
          members_present: presentMemberIds.length,
          visitors_present: presentVisitorIds.length,
          children_present: presentChildrenIds.length,
          members_absent: membersAbsent,
          visitors_absent: visitorsAbsent,
          children_absent: childrenAbsent,
          total_present: presentMemberIds.length + presentVisitorIds.length + presentChildrenIds.length,
          total_absent: membersAbsent + visitorsAbsent + childrenAbsent,
          present_member_ids: presentMemberIds,
          present_visitor_ids: presentVisitorIds,
          present_children_ids: presentChildrenIds,
        };
      });
    },
  });
};

// ─────────── Special event ids (scope-aware) ───────────
export const useGlobalSpecialEventIds = (regionId?: string) => {
  const rid = scope(regionId);
  return useQuery({
    queryKey: ['global-special-event-ids', rid ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('events').select('id').eq('is_special', true);
      if (rid) q = q.eq('region_id', rid);
      const { data, error } = await q;
      if (error) throw error;
      return new Set((data || []).map((e: any) => e.id));
    },
  });
};

// ─────────── Discipleship progress for given relationship ids ───────────
export const useGlobalDiscipleshipProgress = (relationshipIds: string[]) => {
  const key = [...relationshipIds].sort().join(',');
  return useQuery({
    queryKey: ['global-disc-progress', key],
    queryFn: async () => {
      if (relationshipIds.length === 0) return [];
      const { data, error } = await supabase
        .from('discipleship_progress')
        .select('relationship_id, milestone')
        .in('relationship_id', relationshipIds);
      if (error) throw error;
      return data || [];
    },
    enabled: relationshipIds.length > 0,
  });
};
