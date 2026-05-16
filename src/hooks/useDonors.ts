import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DonorRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  region_id: string;
}

export interface NewDonorInput {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export const useSearchDonors = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ["donor-search", search],
    queryFn: async (): Promise<DonorRow[]> => {
      const { data, error } = await supabase.rpc("search_all_donors", { _search: search });
      if (error) throw error;
      return (data || []) as DonorRow[];
    },
    enabled,
  });
};

export const useCreateDonor = () => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewDonorInput): Promise<DonorRow> => {
      if (!userRegion?.id) throw new Error("Region not found");
      const { data, error } = await supabase
        .from("donors")
        .insert({
          region_id: userRegion.id,
          created_by: user?.id || null,
          first_name: input.first_name.trim(),
          last_name: input.last_name.trim(),
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select("id, first_name, last_name, email, phone, region_id")
        .single();
      if (error) throw error;
      return data as DonorRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-search"] });
    },
  });
};
