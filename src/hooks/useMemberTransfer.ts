import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransferMemberParams {
  memberId: string;
  profileId: string | null;
  fromRegionId: string;
  toRegionId: string;
  oldMemberCode: string;
  reason?: string;
  notes?: string;
}

export const useTransferMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: TransferMemberParams) => {
      // 1. Generate new member ID for the destination region
      const { data: newMemberCode, error: genError } = await supabase
        .rpc('generate_member_id', { _region_id: params.toRegionId });

      if (genError) throw new Error(`Failed to generate new member ID: ${genError.message}`);

      // 2. Update the member's region and member_id code
      const { error: memberError } = await supabase
        .from('members')
        .update({
          region_id: params.toRegionId,
          member_id: newMemberCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.memberId);

      if (memberError) throw new Error(`Failed to update member: ${memberError.message}`);

      // 3. Update the profile's region_id so auth context reflects new region
      if (params.profileId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ region_id: params.toRegionId })
          .eq('id', params.profileId);

        if (profileError) throw new Error(`Failed to update profile region: ${profileError.message}`);
      }

      // 4. Get current user for transferred_by
      const { data: { user } } = await supabase.auth.getUser();

      // 5. Insert transfer record
      const { error: transferError } = await supabase
        .from('member_transfers')
        .insert({
          member_id: params.memberId,
          from_region_id: params.fromRegionId,
          to_region_id: params.toRegionId,
          old_member_code: params.oldMemberCode,
          new_member_code: newMemberCode,
          reason: params.reason || null,
          notes: params.notes || null,
          transferred_by: user?.id || null,
        });

      if (transferError) throw new Error(`Failed to record transfer: ${transferError.message}`);

      return { newMemberCode };
    },
    onSuccess: (data) => {
      toast({
        title: 'Member transferred successfully',
        description: `New member ID: ${data.newMemberCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['member'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      queryClient.invalidateQueries({ queryKey: ['member-transfers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Transfer failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useMemberTransferHistory = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-transfers', memberId],
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('member_transfers')
        .select(`
          *,
          from_region:regions!member_transfers_from_region_id_fkey(name),
          to_region:regions!member_transfers_to_region_id_fkey(name)
        `)
        .eq('member_id', memberId)
        .order('transferred_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!memberId,
  });
};
