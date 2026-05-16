import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePlanTargets {
  activePlanId: string | null;
  targetsByKey: Record<string, number>;
}

/**
 * Fetches the currently active regional plan and returns a lookup of
 * metric_key -> target_value drawn from regional_plan_targets.
 */
export const useActivePlanTargets = (regionId?: string) => {
  return useQuery<ActivePlanTargets>({
    queryKey: ['active-plan-targets', regionId],
    queryFn: async () => {
      if (!regionId) return { activePlanId: null, targetsByKey: {} };

      const { data: plan } = await supabase
        .from('regional_plans')
        .select('id')
        .eq('region_id', regionId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan?.id) return { activePlanId: null, targetsByKey: {} };

      const { data: targets } = await supabase
        .from('regional_plan_targets')
        .select('metric_key, target_value')
        .eq('plan_id', plan.id);

      const map: Record<string, number> = {};
      (targets || []).forEach((t: any) => {
        if (t.metric_key) map[t.metric_key] = Number(t.target_value) || 0;
      });

      return { activePlanId: plan.id, targetsByKey: map };
    },
    enabled: !!regionId,
  });
};
