
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Region = Database['public']['Tables']['regions']['Row'];

interface UseAllRegionsOptions {
  includeInactive?: boolean;
  searchTerm?: string;
  sortBy?: 'name' | 'code' | 'created_at' | 'established_date';
  sortOrder?: 'asc' | 'desc';
}

export const useAllRegions = (options: UseAllRegionsOptions = {}) => {
  const {
    includeInactive = false,
    searchTerm = '',
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  return useQuery({
    queryKey: ['regions', 'all', { includeInactive, searchTerm, sortBy, sortOrder }],
    queryFn: async () => {
      console.log('Fetching all regions with options:', options);
      
      let query = supabase.from('regions').select('*');

      // Filter by active status
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Search functionality
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,regional_president.ilike.%${searchTerm}%`);
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching regions:', error);
        throw error;
      }

      console.log('Regions fetched successfully:', data?.length);
      return data as Region[];
    }
  });
};
