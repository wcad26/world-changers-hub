import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Occupation {
  id: string;
  name: string;
  name_fr: string | null;
  display_order: number;
  is_active: boolean;
}

export const useOccupations = () => {
  return useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occupations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Occupation[];
    },
  });
};
