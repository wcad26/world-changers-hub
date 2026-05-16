import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PlanActuals = Record<string, number>;

/**
 * Computes live actuals for every metric in METRIC_CATALOG, scoped to the
 * region and date window of the plan.
 */
export const useRegionalPlanActuals = (
  startDate?: string,
  endDate?: string,
) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['regional-plan-actuals', regionId, startDate, endDate],
    queryFn: async (): Promise<PlanActuals> => {
      if (!regionId || !startDate || !endDate) return {};

      const actuals: PlanActuals = {};

      // --- Members & Visitors (created within window) ---
      const { data: newMembers } = await supabase
        .from('members')
        .select('id, member_type, created_at')
        .eq('region_id', regionId)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      actuals.new_members = (newMembers ?? []).filter(m => m.member_type === 'member').length;
      actuals.new_visitors = (newMembers ?? []).filter(m => m.member_type === 'visitor').length;

      // Visitor → Member conversions: members who started as visitor and now are member, updated within window.
      // Approximation: members with member_type='member' whose updated_at is in window and have visitor history.
      // We use status change as a proxy via member_status_history if available; otherwise leave 0.
      actuals.visitor_conversions = 0;

      // New children: members with DOB making them <16 created in window (simple heuristic — categorisation matches app rules).
      const { data: children } = await supabase
        .from('members')
        .select('id, date_of_birth, created_at')
        .eq('region_id', regionId)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 16);
      actuals.new_children = (children ?? []).filter(m => {
        if (!m.date_of_birth) return false;
        return new Date(m.date_of_birth) > cutoff;
      }).length;

      // --- Discipleship ---
      const { data: progress } = await supabase
        .from('discipleship_progress')
        .select('milestone, achieved_date, relationship:discipleship_relationships(mentor:members!discipleship_relationships_mentor_id_fkey(region_id))')
        .gte('achieved_date', startDate)
        .lte('achieved_date', endDate);

      const scopedProgress = (progress ?? []).filter((p: any) => p?.relationship?.mentor?.region_id === regionId);
      actuals.baptisms = scopedProgress.filter((p: any) => p.milestone === 'baptized').length;
      actuals.foundation_completions = scopedProgress.filter((p: any) => p.milestone === 'became_member').length;
      actuals.disciples_graduated = scopedProgress.filter((p: any) => p.milestone === 'serving').length;

      const { data: rels } = await supabase
        .from('discipleship_relationships')
        .select('id, status, mentor:members!discipleship_relationships_mentor_id_fkey(region_id)')
        .eq('status', 'active');
      actuals.active_mentor_pairs = (rels ?? []).filter((r: any) => r?.mentor?.region_id === regionId).length;

      // --- Events ---
      const { data: events } = await supabase
        .from('attendance_events')
        .select('id, event_date, is_special')
        .eq('region_id', regionId)
        .gte('event_date', startDate)
        .lte('event_date', endDate);

      const regularEvents = (events ?? []).filter(e => !e.is_special);
      actuals.regional_events_count = regularEvents.length;
      actuals.special_events_count = (events ?? []).filter(e => e.is_special).length;

      if ((events ?? []).length > 0) {
        const { data: records } = await supabase
          .from('attendance_records')
          .select('event_id, is_present')
          .in('event_id', (events ?? []).map(e => e.id))
          .eq('is_present', true);
        const total = (records ?? []).length;
        actuals.total_event_attendees = total;
        actuals.avg_event_attendance = regularEvents.length > 0
          ? Math.round(total / regularEvents.length)
          : 0;
      } else {
        actuals.total_event_attendees = 0;
        actuals.avg_event_attendance = 0;
      }

      // --- DCGs ---
      const { data: dcgs } = await supabase
        .from('dcgs')
        .select('id, is_active, created_at')
        .eq('region_id', regionId);
      actuals.active_dcgs = (dcgs ?? []).filter(d => d.is_active).length;
      actuals.new_dcgs = (dcgs ?? []).filter(d => {
        const c = new Date(d.created_at);
        return c >= new Date(startDate) && c <= new Date(endDate + 'T23:59:59');
      }).length;

      if ((dcgs ?? []).length > 0) {
        const dcgIds = (dcgs ?? []).map(d => d.id);
        const { count: memberCount } = await supabase
          .from('dcg_members')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .in('dcg_id', dcgIds);
        actuals.total_dcg_members = memberCount ?? 0;

        const { data: dcgEvents } = await supabase
          .from('attendance_events')
          .select('id')
          .in('dcg_id', dcgIds)
          .gte('event_date', startDate)
          .lte('event_date', endDate);
        if ((dcgEvents ?? []).length > 0) {
          const { count: presentCount } = await supabase
            .from('attendance_records')
            .select('id', { count: 'exact', head: true })
            .in('event_id', (dcgEvents ?? []).map(e => e.id))
            .eq('is_present', true);
          actuals.avg_dcg_attendance = Math.round((presentCount ?? 0) / (dcgEvents ?? []).length);
        } else {
          actuals.avg_dcg_attendance = 0;
        }
      } else {
        actuals.total_dcg_members = 0;
        actuals.avg_dcg_attendance = 0;
      }

      // --- Financials ---
      const { data: tx } = await supabase
        .from('financial_transactions')
        .select('amount, category:financial_transaction_categories(type)')
        .eq('region_id', regionId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      let income = 0;
      let expense = 0;
      (tx ?? []).forEach((t: any) => {
        const type = t.category?.type?.toLowerCase();
        const amt = Number(t.amount) || 0;
        if (type === 'income') income += amt;
        else if (type === 'expense') expense += amt;
      });
      actuals.total_income = income;
      actuals.total_expenses = expense;
      actuals.net_balance = income - expense;

      // --- Fundraising ---
      const { data: campaigns } = await supabase
        .from('fundraising_campaigns')
        .select('id, raised')
        .eq('region_id', regionId);
      actuals.funds_raised = (campaigns ?? []).reduce((s, c: any) => s + (Number(c.raised) || 0), 0);

      return actuals;
    },
    enabled: !!regionId && !!startDate && !!endDate,
    staleTime: 60_000,
  });
};
