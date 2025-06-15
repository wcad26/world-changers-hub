
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
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
});
export type TransactionData = z.infer<typeof transactionSchema>;

// Hook to fetch financial transactions
export const useFinancialTransactions = (filters?: { from?: string, to?: string }) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

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

// Hook to create a financial transaction
export const useCreateFinancialTransaction = () => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();

  return useMutation({
    mutationFn: async (transactionData: TransactionData) => {
      if (!userRegion?.id) throw new Error('User region not found');
      if (!user?.id) throw new Error('User not found');
      
      const newTransaction: Database['public']['Tables']['financial_transactions']['Insert'] = {
        region_id: userRegion.id,
        recorded_by: user.id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
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
        queryClient.invalidateQueries({ queryKey: ['regionalReports', userRegion.id] });
      }
    },
  });
};
