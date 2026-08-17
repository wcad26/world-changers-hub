import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'custom_days';

export interface RecurrenceRule {
  id: string;
  template_event_id: string | null;
  region_id: string | null;
  dcg_id: string | null;
  name: string;
  frequency: RecurrenceFrequency;
  interval_count: number;
  days_of_week: number[];
  start_time: string;
  duration_minutes: number;
  lead_time_days: number;
  end_date: string | null;
  is_active: boolean;
  last_generated_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  interval_count: number;
  days_of_week: number[];
  lead_time_days: number;
  end_date: string | null;
}

export const DEFAULT_RECURRENCE: RecurrenceInput = {
  frequency: 'weekly',
  interval_count: 1,
  days_of_week: [],
  lead_time_days: 30,
  end_date: null,
};

type Scope = { regionId?: string | null; dcgId?: string | null; global?: boolean };

export const useRecurrenceRules = (scope: Scope) => {
  const { regionId, dcgId, global } = scope;
  return useQuery({
    queryKey: ['recurrence-rules', regionId ?? null, dcgId ?? null, !!global],
    queryFn: async () => {
      let query = supabase
        .from('event_recurrence_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (dcgId) query = query.eq('dcg_id', dcgId);
      else if (regionId) query = query.eq('region_id', regionId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as RecurrenceRule[];
    },
    enabled: !!(global || regionId || dcgId),
  });
};

const invokeGenerator = async (ruleId?: string) => {
  const { error } = await supabase.functions.invoke('generate-recurring-events', {
    body: ruleId ? { rule_id: ruleId } : {},
  });
  if (error) throw error;
};

export const useCreateRecurrenceRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      templateEventId: string;
      name: string;
      regionId: string | null;
      dcgId: string | null;
      startDatetime: string;
      endDatetime?: string | null;
      createdBy: string | null;
      recurrence: RecurrenceInput;
    }) => {
      const start = new Date(params.startDatetime);
      const duration = params.endDatetime
        ? Math.max(30, Math.round((new Date(params.endDatetime).getTime() - start.getTime()) / 60000))
        : 120;
      const startTime = start.toISOString().slice(11, 19);
      const dow = params.recurrence.days_of_week.length
        ? params.recurrence.days_of_week
        : [start.getUTCDay()];

      const { data, error } = await supabase
        .from('event_recurrence_rules')
        .insert({
          template_event_id: params.templateEventId,
          name: params.name,
          region_id: params.regionId,
          dcg_id: params.dcgId,
          frequency: params.recurrence.frequency,
          interval_count: params.recurrence.interval_count,
          days_of_week: dow,
          start_time: startTime,
          duration_minutes: duration,
          lead_time_days: params.recurrence.lead_time_days,
          end_date: params.recurrence.end_date,
          created_by: params.createdBy,
        })
        .select()
        .single();
      if (error) throw error;

      // Link the seed event to the series, then fill the window.
      await supabase
        .from('events')
        .update({ recurrence_rule_id: data.id })
        .eq('id', params.templateEventId);

      await invokeGenerator(data.id);
      return data as unknown as RecurrenceRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-rules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      toast.success('Recurring series created — upcoming events generated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create recurring series'),
  });
};

export const useUpdateRecurrenceRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurrenceRule> & { id: string }) => {
      const { error } = await supabase
        .from('event_recurrence_rules')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-rules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update series'),
  });
};

export const useGenerateRecurringEvents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId?: string) => invokeGenerator(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      queryClient.invalidateQueries({ queryKey: ['recurrence-rules'] });
      toast.success('Upcoming occurrences generated');
    },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });
};

// Deletes a series. Optionally removes its future, non-detached occurrences.
export const useDeleteRecurrenceRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deleteFuture }: { id: string; deleteFuture: boolean }) => {
      if (deleteFuture) {
        const { error: delError } = await supabase
          .from('events')
          .delete()
          .eq('recurrence_rule_id', id)
          .eq('is_recurring_instance', true)
          .eq('detached_from_series', false)
          .gte('start_datetime', new Date().toISOString());
        if (delError) throw delError;
      }
      const { error } = await supabase.from('event_recurrence_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-rules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      toast.success('Recurring series removed');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove series'),
  });
};

export const frequencyLabel = (rule: Pick<RecurrenceRule, 'frequency' | 'interval_count'>) => {
  switch (rule.frequency) {
    case 'weekly':
      return rule.interval_count > 1 ? `Every ${rule.interval_count} weeks` : 'Weekly';
    case 'biweekly':
      return 'Every 2 weeks';
    case 'monthly':
      return 'Monthly (same weekday)';
    case 'custom_days':
      return `Every ${rule.interval_count} days`;
    default:
      return rule.frequency;
  }
};

export const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];
