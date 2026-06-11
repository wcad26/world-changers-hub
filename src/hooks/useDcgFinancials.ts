import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import * as z from 'zod';

// Resolve the current signed-in DCG leader's active DCG row directly from
// Supabase, independent of any regional context. This is the source of
// truth for the DCG portal.
export const useCurrentDcg = () => {
  return useQuery({
    queryKey: ['current_dcg'],
    queryFn: async (): Promise<Database['public']['Tables']['dcgs']['Row'] | null> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) return null;

      const { data: dcgId, error: rpcErr } = await supabase.rpc('get_user_dcg', { _user_id: uid });
      if (rpcErr) throw rpcErr;
      if (!dcgId) return null;

      const { data: dcg, error } = await supabase
        .from('dcgs')
        .select('*')
        .eq('id', dcgId)
        .maybeSingle();
      if (error) throw error;
      return dcg ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export type DcgFinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'] & {
  category?: { name: string; type: string } | null;
  dcg?: { name: string } | null;
};

export type DcgFinancialSummary = {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  transaction_count: number;
  last_transaction_date: string | null;
};

export const useDcgFinancialSummary = (
  dcgId?: string,
  filters?: { from?: string; to?: string },
) => {
  return useQuery({
    queryKey: ['dcg_financial_summary', dcgId, filters],
    queryFn: async (): Promise<DcgFinancialSummary> => {
      const empty: DcgFinancialSummary = {
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        transaction_count: 0,
        last_transaction_date: null,
      };
      if (!dcgId) return empty;

      let query = supabase
        .from('financial_transactions')
        .select('amount, transaction_date, category:financial_transaction_categories(type)')
        .eq('dcg_id', dcgId);

      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);

      const { data, error } = await query.order('transaction_date', { ascending: false });
      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, t: any) => {
          const amt = Number(t.amount) || 0;
          const ct = (t.category?.type || '').toString().toLowerCase();
          if (ct === 'income') acc.total_income += amt;
          else if (ct === 'expense') acc.total_expenses += amt;
          return acc;
        },
        { total_income: 0, total_expenses: 0 },
      );

      return {
        ...totals,
        net_balance: totals.total_income - totals.total_expenses,
        transaction_count: data?.length || 0,
        last_transaction_date: data?.[0]?.transaction_date || null,
      };
    },
    enabled: !!dcgId,
    staleTime: 60 * 1000,
  });
};

// Hook to fetch financial transactions for a specific DCG.
// Scoped strictly by dcg_id; no region or member joins (to avoid PostgREST
// embedded-join issues caused by unrelated RLS on members/profiles).
export const useDcgFinancialTransactions = (
  dcgId?: string,
  filters?: { from?: string; to?: string; limit?: number },
) => {
  return useQuery({
    queryKey: ['dcg_financial_transactions', dcgId, filters],
    queryFn: async (): Promise<DcgFinancialTransaction[]> => {
      if (!dcgId) return [];

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_transaction_categories(name, type)
        `)
        .eq('dcg_id', dcgId);

      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DcgFinancialTransaction[];
    },
    enabled: !!dcgId,
    staleTime: 60 * 1000,
  });
};

// Schema for DCG transaction creation
export const dcgTransactionSchema = z.object({
  category_id: z.string().uuid('Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
});

export type DcgTransactionData = z.infer<typeof dcgTransactionSchema>;

// Create a DCG financial transaction. Region is derived from the DCG row
// so DCG leaders without a profile region can still record.
export const useCreateDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transactionData: DcgTransactionData) => {
      if (!user?.id) throw new Error('User not found');
      if (!dcgId) throw new Error('DCG ID is required');

      const { data: dcgRow, error: dcgErr } = await supabase
        .from('dcgs')
        .select('region_id, region:regions(currency_code)')
        .eq('id', dcgId)
        .single();
      if (dcgErr) throw dcgErr;
      if (!dcgRow?.region_id) throw new Error('Region not found for this DCG');
      const currencyCode = (dcgRow as any)?.region?.currency_code || 'USD';

      const newTransaction: Database['public']['Tables']['financial_transactions']['Insert'] = {
        region_id: dcgRow.region_id,
        dcg_id: dcgId,
        recorded_by: user.id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
        currency_code: currencyCode,
        description: transactionData.description,
        transaction_date: transactionData.transaction_date,
      };

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(newTransaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions', dcgId] });
    },
  });
};

export const useUpdateDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DcgTransactionData }) => {
      const updates: Database['public']['Tables']['financial_transactions']['Update'] = {
        category_id: data.category_id,
        amount: data.amount,
        description: data.description,
        transaction_date: data.transaction_date,
      };

      const { data: row, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions', dcgId] });
    },
  });
};

export const useDeleteDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions', dcgId] });
    },
  });
};
