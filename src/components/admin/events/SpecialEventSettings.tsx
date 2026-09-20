import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RegistrationFeesEditor } from '@/components/admin/events/RegistrationFeesEditor';
import type { EventFeeRow } from '@/hooks/useEventRegistrationFees';

interface Props {
  form: any;
  feeRows: EventFeeRow[];
  setFeeRows: (rows: EventFeeRow[]) => void;
  currencies?: { code: string; symbol: string; name: string }[];
  regionId?: string | null;
}

export const SpecialEventSettings: React.FC<Props> = ({ form, feeRows, setFeeRows, currencies, regionId }) => {
  const { data: campaigns } = useQuery({
    queryKey: ['special-event-campaigns', regionId || 'all'],
    queryFn: async () => {
      let q = supabase.from('fundraising_campaigns').select('id, name, goal, currency_code, region_id');
      if (regionId) q = q.eq('region_id', regionId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (!form.watch('is_special')) return null;

  const checkbox = (name: string, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }: any) => (
        <FormItem className="flex items-center gap-2 space-y-0">
          <FormControl>
            <input type="checkbox" checked={!!field.value} onChange={field.onChange} className="h-4 w-4 rounded border-input" />
          </FormControl>
          <FormLabel className="font-normal">{label}</FormLabel>
        </FormItem>
      )}
    />
  );

  return (
    <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-500/5 space-y-3">
      <h4 className="text-sm font-semibold text-amber-700">Special Event Settings</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {checkbox('collect_lodging', 'Collect lodging')}
        {checkbox('collect_meal_preferences', 'Collect meal preferences')}
        {checkbox('collect_pledges', 'Collect pledges')}
      </div>
      <FormField
        control={form.control}
        name="linked_fundraising_campaign_id"
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Linked Fundraising Campaign</FormLabel>
            <FormControl>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={field.value || ''}
                onChange={field.onChange}
              >
                <option value="">— None —</option>
                {(campaigns || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currency_code} {((Number(c.goal) || 0) / 100).toLocaleString()})
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <RegistrationFeesEditor rows={feeRows} onChange={setFeeRows} currencies={currencies} />
    </div>
  );
};
