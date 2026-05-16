import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type RegionalPlan = Database['public']['Tables']['regional_plans']['Row'];
export type RegionalPlanInsert = Database['public']['Tables']['regional_plans']['Insert'];
export type RegionalPlanUpdate = Database['public']['Tables']['regional_plans']['Update'];

export type RegionalPlanTarget = Database['public']['Tables']['regional_plan_targets']['Row'];
export type RegionalPlanTargetInsert = Database['public']['Tables']['regional_plan_targets']['Insert'];

export type RegionalPlanInitiative = Database['public']['Tables']['regional_plan_initiatives']['Row'];
export type RegionalPlanInitiativeInsert = Database['public']['Tables']['regional_plan_initiatives']['Insert'];

export type PlanTargetCategory = Database['public']['Enums']['regional_plan_target_category'];
export type PlanTargetUnit = Database['public']['Enums']['regional_plan_target_unit'];
export type PlanInitiativeStatus = Database['public']['Enums']['regional_plan_initiative_status'];
export type PlanInitiativePriority = Database['public']['Enums']['regional_plan_initiative_priority'];
export type PlanStatus = Database['public']['Enums']['regional_plan_status'];
export type PlanPeriodType = Database['public']['Enums']['regional_plan_period_type'];

// ---------- Plans ----------
export const useRegionalPlans = () => {
  const { userRegion } = useAuth();
  return useQuery({
    queryKey: ['regional-plans', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      const { data, error } = await supabase
        .from('regional_plans')
        .select('*')
        .eq('region_id', userRegion.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as RegionalPlan[];
    },
    enabled: !!userRegion?.id,
  });
};

export const useCreateRegionalPlan = () => {
  const qc = useQueryClient();
  const { userRegion, user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<RegionalPlanInsert, 'region_id' | 'created_by'>) => {
      if (!userRegion?.id) throw new Error('No region');
      const { data, error } = await supabase
        .from('regional_plans')
        .insert({ ...input, region_id: userRegion.id, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as RegionalPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regional-plans'] });
      toast.success('Plan created');
    },
    onError: (e: any) => toast.error('Failed to create plan', { description: e?.message }),
  });
};

export const useUpdateRegionalPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: RegionalPlanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('regional_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RegionalPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regional-plans'] });
    },
    onError: (e: any) => toast.error('Failed to update plan', { description: e?.message }),
  });
};

export const useDeleteRegionalPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('regional_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regional-plans'] });
      toast.success('Plan deleted');
    },
    onError: (e: any) => toast.error('Failed to delete plan', { description: e?.message }),
  });
};

// ---------- Targets ----------
export const usePlanTargets = (planId?: string) => {
  return useQuery({
    queryKey: ['regional-plan-targets', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('regional_plan_targets')
        .select('*')
        .eq('plan_id', planId);
      if (error) throw error;
      return data as RegionalPlanTarget[];
    },
    enabled: !!planId,
  });
};

export const useUpsertPlanTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegionalPlanTargetInsert) => {
      const { data, error } = await supabase
        .from('regional_plan_targets')
        .upsert(input, { onConflict: 'plan_id,metric_key' })
        .select()
        .single();
      if (error) throw error;
      return data as RegionalPlanTarget;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['regional-plan-targets', data.plan_id] });
    },
    onError: (e: any) => toast.error('Failed to save target', { description: e?.message }),
  });
};

// ---------- Initiatives ----------
export const usePlanInitiatives = (planId?: string) => {
  return useQuery({
    queryKey: ['regional-plan-initiatives', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('regional_plan_initiatives')
        .select('*')
        .eq('plan_id', planId)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as RegionalPlanInitiative[];
    },
    enabled: !!planId,
  });
};

export const useCreatePlanInitiative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegionalPlanInitiativeInsert) => {
      const { data, error } = await supabase
        .from('regional_plan_initiatives')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as RegionalPlanInitiative;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['regional-plan-initiatives', data.plan_id] });
      toast.success('Initiative added');
    },
    onError: (e: any) => toast.error('Failed to add initiative', { description: e?.message }),
  });
};

export const useUpdatePlanInitiative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RegionalPlanInitiative> & { id: string }) => {
      const { data, error } = await supabase
        .from('regional_plan_initiatives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RegionalPlanInitiative;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['regional-plan-initiatives', data.plan_id] });
    },
    onError: (e: any) => toast.error('Failed to update initiative', { description: e?.message }),
  });
};

export const useDeletePlanInitiative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { error } = await supabase.from('regional_plan_initiatives').delete().eq('id', id);
      if (error) throw error;
      return planId;
    },
    onSuccess: (planId) => {
      qc.invalidateQueries({ queryKey: ['regional-plan-initiatives', planId] });
      toast.success('Initiative removed');
    },
    onError: (e: any) => toast.error('Failed to remove initiative', { description: e?.message }),
  });
};

// ---------- Metric catalog ----------
export type MetricDef = {
  key: string;
  label: string;
  category: PlanTargetCategory;
  unit: PlanTargetUnit;
  description?: string;
};

export const METRIC_CATALOG: MetricDef[] = [
  // Growth
  { key: 'new_members', label: 'New Members', category: 'growth', unit: 'count' },
  { key: 'new_visitors', label: 'New Visitors', category: 'growth', unit: 'count' },
  { key: 'visitor_conversions', label: 'Visitor → Member Conversions', category: 'growth', unit: 'count' },
  { key: 'new_children', label: 'New Children Registered', category: 'growth', unit: 'count' },
  // Discipleship
  { key: 'foundation_completions', label: 'Foundation School Completions', category: 'discipleship', unit: 'count' },
  { key: 'baptisms', label: 'Baptisms', category: 'discipleship', unit: 'count' },
  { key: 'active_mentor_pairs', label: 'Active Mentor Pairs', category: 'discipleship', unit: 'count' },
  { key: 'disciples_graduated', label: 'Disciples Graduated', category: 'discipleship', unit: 'count' },
  // Events
  { key: 'regional_events_count', label: 'Regional Events Held', category: 'events', unit: 'count' },
  { key: 'avg_event_attendance', label: 'Avg Attendance / Event', category: 'events', unit: 'count' },
  { key: 'total_event_attendees', label: 'Total Event Attendees', category: 'events', unit: 'count' },
  { key: 'special_events_count', label: 'Special Events Held', category: 'events', unit: 'count' },
  // DCG
  { key: 'new_dcgs', label: 'New DCGs Launched', category: 'dcg', unit: 'count' },
  { key: 'active_dcgs', label: 'Active DCGs', category: 'dcg', unit: 'count' },
  { key: 'total_dcg_members', label: 'Total DCG Membership', category: 'dcg', unit: 'count' },
  { key: 'avg_dcg_attendance', label: 'Avg DCG Attendance', category: 'dcg', unit: 'count' },
  // Finance
  { key: 'total_income', label: 'Total Income', category: 'finance', unit: 'currency' },
  { key: 'total_expenses', label: 'Total Expenses', category: 'finance', unit: 'currency' },
  { key: 'net_balance', label: 'Net Balance', category: 'finance', unit: 'currency' },
  { key: 'funds_raised', label: 'Fundraising Raised', category: 'finance', unit: 'currency' },
];

export const CATEGORY_LABEL: Record<PlanTargetCategory, string> = {
  growth: 'Growth',
  discipleship: 'Discipleship',
  events: 'Events & Attendance',
  dcg: 'DCG Expansion',
  finance: 'Financial',
};
