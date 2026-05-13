import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import * as z from 'zod';

export type Currency = Database['public']['Tables']['currencies']['Row'];
export type CurrencyInsert = Database['public']['Tables']['currencies']['Insert'];

// Schema for creating/editing currencies
export const currencySchema = z.object({
  code: z.string()
    .length(3, 'Currency code must be 3 characters')
    .regex(/^[A-Z]+$/, 'Currency code must be uppercase letters')
    .trim(),
  name: z.string().min(1, 'Currency name is required').max(100),
  symbol: z.string().min(1, 'Currency symbol is required').max(10),
  decimal_places: z.coerce.number().int().min(0).max(4).default(2),
  is_active: z.boolean().default(true),
});

export type CurrencyFormData = z.infer<typeof currencySchema>;

// Hook to fetch all active currencies
export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Currency[];
    },
  });
};

// Hook to fetch all currencies (including inactive) - Super Admin only
export const useAllCurrencies = () => {
  return useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Currency[];
    },
  });
};

// Hook to get region's currency
export const useRegionCurrency = (regionId?: string) => {
  return useQuery({
    queryKey: ['region_currency', regionId],
    queryFn: async () => {
      if (!regionId) return null;
      
      const { data, error } = await supabase
        .from('regions')
        .select('currency_code')
        .eq('id', regionId)
        .single();
      
      if (error) throw error;
      
      // Fetch the full currency details
      if (data?.currency_code) {
        const { data: currency, error: currencyError } = await supabase
          .from('currencies')
          .select('*')
          .eq('code', data.currency_code)
          .single();
        
        if (currencyError) throw currencyError;
        return currency as Currency;
      }
      
      return null;
    },
    enabled: !!regionId,
  });
};

// Hook to create currency (Super Admin only)
export const useCreateCurrency = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (currency: CurrencyFormData) => {
      const insertData: CurrencyInsert = {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimal_places: currency.decimal_places,
        is_active: currency.is_active,
        created_by: user?.id || null,
      };
      
      const { data, error } = await supabase
        .from('currencies')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};

// Hook to update currency (Super Admin only)
export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CurrencyFormData> }) => {
      const { data: updated, error } = await supabase
        .from('currencies')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};

// Hook to toggle currency active status (Super Admin only)
export const useToggleCurrencyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('currencies')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};
