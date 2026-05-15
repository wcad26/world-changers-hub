import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import * as z from 'zod';

export type DcgFinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'] & {
  category?: { name: string; type: string } | null;
  dcg?: { name: string } | null;
  member?: any;
};

export type DcgFinancialSummary = {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  transaction_count: number;
  last_transaction_date: string | null;
};

// Hook to fetch financial transactions for a specific DCG
export const useDcgFinancialTransactions = (dcgId?: string, filters?: { from?: string; to?: string; limit?: number }) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['dcg_financial_transactions', dcgId, regionId, filters],
    queryFn: async (): Promise<DcgFinancialTransaction[]> => {
      if (!regionId || !dcgId) return [];
      
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_transaction_categories(name, type),
          dcg:dcgs(name),
          member:members(member_id, profile:profiles(first_name, last_name))
        `)
        .eq('region_id', regionId)
        .eq('dcg_id', dcgId);
      
      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DcgFinancialTransaction[];
    },
    enabled: !!regionId && !!dcgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch financial summary for a specific DCG
export const useDcgFinancialSummary = (dcgId?: string, filters?: { from?: string; to?: string }) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['dcg_financial_summary', dcgId, regionId, filters],
    queryFn: async (): Promise<DcgFinancialSummary> => {
      if (!regionId || !dcgId) return {
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        transaction_count: 0,
        last_transaction_date: null,
      };

      let query = supabase
        .from('financial_transactions')
        .select('amount, transaction_date, category:financial_transaction_categories(type)')
        .eq('region_id', regionId)
        .eq('dcg_id', dcgId);
      
      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      
      const summary = data?.reduce((acc, transaction) => {
        const amount = Number(transaction.amount);
        const categoryType = transaction.category?.type || '';

        if (categoryType?.toLowerCase() === 'income') {
          acc.total_income += amount;
        } else if (categoryType?.toLowerCase() === 'expense') {
          acc.total_expenses += amount;
        }

        return acc;
      }, {
        total_income: 0,
        total_expenses: 0,
      }) || { total_income: 0, total_expenses: 0 };

      return {
        ...summary,
        net_balance: summary.total_income - summary.total_expenses,
        transaction_count: data?.length || 0,
        last_transaction_date: data?.[0]?.transaction_date || null,
      };
    },
    enabled: !!regionId && !!dcgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch recent financial transactions across all DCGs for comparison
export const useRecentDcgTransactions = (limit: number = 10) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['recent_dcg_transactions', regionId, limit],
    queryFn: async (): Promise<DcgFinancialTransaction[]> => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_transaction_categories(name, type),
          dcg:dcgs(name),
          member:members(member_id, profile:profiles(first_name, last_name))
        `)
        .eq('region_id', regionId)
        .not('dcg_id', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as DcgFinancialTransaction[];
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Schema for DCG transaction creation
export const dcgTransactionSchema = z.object({
  category_id: z.string().uuid('Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  member_id: z.string().uuid().optional().nullable(),
  reference_number: z.string().optional().nullable(),
});

export type DcgTransactionData = z.infer<typeof dcgTransactionSchema>;

// Hook to create a DCG financial transaction
export const useCreateDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();

  return useMutation({
    mutationFn: async (transactionData: DcgTransactionData) => {
      if (!userRegion?.id) throw new Error('User region not found');
      if (!user?.id) throw new Error('User not found');
      if (!dcgId) throw new Error('DCG ID is required');
      
      const newTransaction: Database['public']['Tables']['financial_transactions']['Insert'] = {
        region_id: userRegion.id,
        dcg_id: dcgId,
        recorded_by: user.id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
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
      // Invalidate relevant queries for efficient cache updates
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions', dcgId] });
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_summary', dcgId] });
      queryClient.invalidateQueries({ queryKey: ['recent_dcg_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions', userRegion?.id] });
    },
  });
};

// Hook to update an existing DCG financial transaction
export const useUpdateDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_summary', dcgId] });
      queryClient.invalidateQueries({ queryKey: ['recent_dcg_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions', userRegion?.id] });
      queryClient.invalidateQueries({ queryKey: ['financial_summary', userRegion?.id] });
    },
  });
};

// Hook to delete a DCG financial transaction
export const useDeleteDcgTransaction = (dcgId: string) => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_summary', dcgId] });
      queryClient.invalidateQueries({ queryKey: ['recent_dcg_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions', userRegion?.id] });
      queryClient.invalidateQueries({ queryKey: ['financial_summary', userRegion?.id] });
    },
  });
};