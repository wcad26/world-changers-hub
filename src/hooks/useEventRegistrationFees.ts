import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeeCategory = 'leader' | 'member' | 'child' | 'family';

export interface EventFeeRow {
  id?: string;
  category: FeeCategory;
  label: string;
  /** major units in the editor (e.g. 5000 = 5,000 FCFA) */
  amount: number;
  currency_code: string;
  sort_order?: number;
}

export const FEE_CATEGORIES: { value: FeeCategory; label: string; hint: string }[] = [
  { value: 'leader', label: 'Leader', hint: 'Anyone with an admin role in the system' },
  { value: 'member', label: 'Member', hint: 'Members and visitors' },
  { value: 'child', label: 'Child', hint: 'Under 16 linked to an adult' },
  {
    value: 'family',
    label: 'Family (per household)',
    hint: 'Charged once per family registering together (spouse + under-16 children); replaces the individual fees for that group',
  },
];

/** Categories that must have a fee set; family is optional. */
export const REQUIRED_FEE_CATEGORIES: FeeCategory[] = ['leader', 'member', 'child'];

/** Load fee rows for an event (amounts converted to major units). */
export const fetchEventRegistrationFees = async (eventId: string): Promise<EventFeeRow[]> => {
  const { data, error } = await supabase
    .from('event_registration_fees')
    .select('id, category, label, amount, currency_code, sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    category: r.category as FeeCategory,
    label: r.label || '',
    amount: (Number(r.amount) || 0) / 100,
    currency_code: r.currency_code || '',
    sort_order: r.sort_order ?? 0,
  }));
};

export const useEventRegistrationFees = (eventId?: string) =>
  useQuery({
    queryKey: ['event-registration-fees', eventId],
    enabled: !!eventId,
    queryFn: () => fetchEventRegistrationFees(eventId as string),
  });

/** Replace all fee rows for an event. Amounts given in major units. */
export const saveEventRegistrationFees = async (eventId: string, rows: EventFeeRow[]) => {
  await supabase.from('event_registration_fees').delete().eq('event_id', eventId);
  const clean = (rows || []).filter((r) => r.category && r.currency_code);
  if (clean.length === 0) return;
  const { error } = await supabase.from('event_registration_fees').insert(
    clean.map((r, i) => ({
      event_id: eventId,
      category: r.category,
      label: r.label || null,
      amount: Math.round((Number(r.amount) || 0) * 100),
      currency_code: r.currency_code,
      sort_order: i,
    }))
  );
  if (error) throw error;
};
