
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import * as z from 'zod';

export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
export type FinancialCategory = Database['public']['Tables']['financial_transaction_categories']['Row'];

// Schema for a new financial transaction
export const transactionSchema = z.object({
  category_id: z.string().uuid('Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  dcg_id: z.string().uuid().optional().nullable(),
  member_id: z.string().uuid().optional().nullable(),
  reference_number: z.string().optional().nullable(),
});
export type TransactionData = z.infer<typeof transactionSchema>;

// Financial summary type
export type FinancialSummary = {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  total_tithes: number;
  total_offerings: number;
  total_special_giving: number;
};

// Hook to fetch financial transactions
export const useFinancialTransactions = (filters?: { from?: string, to?: string }, regionIdOverride?: string) => {
  const { userRegion } = useAuth();
  const regionId = regionIdOverride ?? userRegion?.id;

  return useQuery({
    queryKey: ['financial_transactions', regionId, filters],
    queryFn: async () => {
      if (!regionId) return [];
      let query = supabase
        .from('financial_transactions')
        .select('*, category:financial_transaction_categories(name, type), dcg:dcgs(name)')
        .eq('region_id', regionId);
      
      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to fetch financial categories
export const useFinancialCategories = () => {
  return useQuery({
    queryKey: ['financial_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transaction_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook to fetch financial summary
export const useFinancialSummary = (filters?: { from?: string, to?: string }, regionIdOverride?: string) => {
  const { userRegion } = useAuth();
  const regionId = regionIdOverride ?? userRegion?.id;


  return useQuery({
    queryKey: ['financial_summary', regionId, filters],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!regionId) return {
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        total_tithes: 0,
        total_offerings: 0,
        total_special_giving: 0,
      };

      // Build dynamic SQL query for financial summary
      let query = supabase
        .from('financial_transactions')
        .select('amount, category:financial_transaction_categories(name, type)')
        .eq('region_id', regionId);
      
      if (filters?.from) query = query.gte('transaction_date', filters.from);
      if (filters?.to) query = query.lte('transaction_date', filters.to);

      const { data, error } = await query;

      if (error) throw error;
      
      // Calculate summary from transaction data
      const summary = data?.reduce((acc, transaction) => {
        const amount = Number(transaction.amount);
        const categoryName = transaction.category?.name || '';
        const categoryType = transaction.category?.type || '';

        if (categoryType?.toLowerCase() === 'income') {
          acc.total_income += amount;
          
          if (categoryName === 'Tithes') {
            acc.total_tithes += amount;
          } else if (categoryName.includes('Offering')) {
            acc.total_offerings += amount;
          } else if (['Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund'].includes(categoryName)) {
            acc.total_special_giving += amount;
          }
        } else if (categoryType?.toLowerCase() === 'expense') {
          acc.total_expenses += amount;
        }

        return acc;
      }, {
        total_income: 0,
        total_expenses: 0,
        total_tithes: 0,
        total_offerings: 0,
        total_special_giving: 0,
      }) || {
        total_income: 0,
        total_expenses: 0,
        total_tithes: 0,
        total_offerings: 0,
        total_special_giving: 0,
      };

      return {
        ...summary,
        net_balance: summary.total_income - summary.total_expenses,
      };
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to create a financial transaction
export const useCreateFinancialTransaction = () => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();

  return useMutation({
    mutationFn: async (transactionData: TransactionData) => {
      if (!userRegion?.id) throw new Error('User region not found');
      if (!user?.id) throw new Error('User not found');

      const { data: regionRow } = await supabase
        .from('regions')
        .select('currency_code')
        .eq('id', userRegion.id)
        .maybeSingle();
      const currencyCode = regionRow?.currency_code || 'USD';

      const newTransaction: Database['public']['Tables']['financial_transactions']['Insert'] = {
        region_id: userRegion.id,
        recorded_by: user.id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
        currency_code: currencyCode,
        description: transactionData.description,
        transaction_date: transactionData.transaction_date,
        dcg_id: transactionData.dcg_id,
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
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['financial_transactions', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['financial_summary', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['regionalReports', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['regional_ledger', userRegion.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dcg_financial_summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent_dcg_transactions'] });
    },
  });
};
