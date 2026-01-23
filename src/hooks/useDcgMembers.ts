import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
import { memberSchema, type NewMemberData } from './useMembers';
import { useToast } from './use-toast';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];
type DcgMember = Database['public']['Tables']['dcg_members']['Row'];
type Member = Database['public']['Tables']['members']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export type DcgMemberWithDetails = DcgMember & {
  members: Member & {
    profiles: Profile | null;
  } | null;
};

// Get DCG members with full member and profile details
export const useDcgMembers = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-members', dcgId],
    queryFn: async () => {
      if (!dcgId) return [];
      
      console.log('useDcgMembers: Fetching DCG members for DCG:', dcgId);
      
      const { data, error } = await supabase
        .from('dcg_members')
        .select(`
          *,
          members (
            *,
            profiles (
              *
            )
          )
        `)
        .eq('dcg_id', dcgId)
        .eq('is_active', true)
        .order('joined_date', { ascending: false });
      
      if (error) {
        console.error('useDcgMembers: Error fetching DCG members:', error);
        throw error;
      }
      
      console.log('useDcgMembers: Fetched DCG members:', data);
      return data as DcgMemberWithDetails[];
    },
    enabled: !!dcgId,
  });
};

// Get regional members not in DCG (for adding existing members)
export const useAvailableRegionalMembers = (dcgId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['available-regional-members', dcgId, regionId],
    queryFn: async () => {
      if (!dcgId || !regionId) return [];
      
      console.log('useAvailableRegionalMembers: Fetching available members for DCG:', dcgId, 'region:', regionId);
      
      // Get all regional members with their profile data
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          member_id,
          member_type,
          status,
          profile_id,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            address
          )
        `)
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (membersError) {
        console.error('useAvailableRegionalMembers: Error fetching regional members:', membersError);
        throw membersError;
      }
      
      // Get current DCG members
      const { data: dcgMembers, error: dcgError } = await supabase
        .from('dcg_members')
        .select('member_id')
        .eq('dcg_id', dcgId)
        .eq('is_active', true);
      
      if (dcgError) {
        console.error('useAvailableRegionalMembers: Error fetching DCG members:', dcgError);
        throw dcgError;
      }
      
      // Filter out members already in DCG
      const dcgMemberIds = new Set(dcgMembers?.map(dm => dm.member_id) || []);
      const availableMembers = allMembers?.filter(member => !dcgMemberIds.has(member.id)) || [];
      
      console.log('useAvailableRegionalMembers: Available members:', availableMembers.length);
      return availableMembers;
    },
    enabled: !!dcgId && !!regionId,
  });
};

// Add existing regional member to DCG
export const useAddMemberToDcg = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dcgId, memberId, role = 'Member' }: { 
      dcgId: string; 
      memberId: string; 
      role?: DcgMemberRole; 
    }) => {
      console.log('useAddMemberToDcg: Adding member to DCG:', { dcgId, memberId, role });
      
      const { data, error } = await supabase
        .from('dcg_members')
        .insert({
          dcg_id: dcgId,
          member_id: memberId,
          role: role,
          joined_date: new Date().toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('useAddMemberToDcg: Error adding member to DCG:', error);
        throw error;
      }
      
      console.log('useAddMemberToDcg: Member added to DCG successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('useAddMemberToDcg: Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['dcg-members', data.dcg_id] });
      queryClient.invalidateQueries({ queryKey: ['available-regional-members'] });
      toast({
        title: 'Member Added to DCG',
        description: 'Member has been successfully added to the DCG.',
      });
    },
    onError: (error) => {
      console.error('useAddMemberToDcg: Mutation failed:', error);
      toast({
        title: 'Failed to Add Member',
        description: error.message || 'An error occurred while adding the member to DCG.',
        variant: 'destructive',
      });
    },
  });
};

// Create new member and add to DCG
export const useCreateMemberForDcg = () => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberData, dcgId, dcgRole = 'Member' }: { 
      memberData: NewMemberData; 
      dcgId: string; 
      dcgRole?: DcgMemberRole; 
    }) => {
      console.log('useCreateMemberForDcg: Creating member for DCG:', { memberData, dcgId, dcgRole });
      
      if (!userRegion) {
        throw new Error("User region not found");
      }

      // Create the member using the edge function
      const { data: memberResult, error: memberError } = await supabase.functions.invoke('create-member', {
        body: { 
          record: { 
            ...memberData, 
            region_id: userRegion.id 
          } 
        },
      });

      if (memberError || !memberResult?.success) {
        console.error('useCreateMemberForDcg: Member creation failed:', memberError || memberResult);
        throw new Error(memberResult?.error || 'Failed to create member');
      }

      const memberId = memberResult.member.id;
      console.log('useCreateMemberForDcg: Member created, adding to DCG:', memberId);

      // Add the member to the DCG
      const { data: dcgMemberData, error: dcgError } = await supabase
        .from('dcg_members')
        .insert({
          dcg_id: dcgId,
          member_id: memberId,
          role: dcgRole,
          joined_date: new Date().toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single();

      if (dcgError) {
        console.error('useCreateMemberForDcg: Error adding member to DCG:', dcgError);
        throw dcgError;
      }
      
      console.log('useCreateMemberForDcg: Member created and added to DCG successfully');
      return { member: memberResult.member, dcgMember: dcgMemberData };
    },
    onSuccess: (data, variables) => {
      console.log('useCreateMemberForDcg: Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['dcg-members', variables.dcgId] });
      queryClient.invalidateQueries({ queryKey: ['available-regional-members'] });
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      }
      toast({
        title: 'Member Registered and Added to DCG',
        description: `${variables.memberData.first_name} ${variables.memberData.last_name} has been registered and added to the DCG.`,
      });
    },
    onError: (error) => {
      console.error('useCreateMemberForDcg: Mutation failed:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register member. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Update DCG member role
export const useUpdateDcgMemberRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dcgMemberId, role }: { dcgMemberId: string; role: DcgMemberRole }) => {
      console.log('useUpdateDcgMemberRole: Updating DCG member role:', { dcgMemberId, role });
      
      const { data, error } = await supabase
        .from('dcg_members')
        .update({ role })
        .eq('id', dcgMemberId)
        .select()
        .single();

      if (error) {
        console.error('useUpdateDcgMemberRole: Error updating role:', error);
        throw error;
      }
      
      console.log('useUpdateDcgMemberRole: Role updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('useUpdateDcgMemberRole: Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['dcg-members', data.dcg_id] });
      toast({
        title: 'Role Updated',
        description: 'DCG member role has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('useUpdateDcgMemberRole: Mutation failed:', error);
      toast({
        title: 'Failed to Update Role',
        description: error.message || 'An error occurred while updating the member role.',
        variant: 'destructive',
      });
    },
  });
};

// Remove member from DCG
export const useRemoveMemberFromDcg = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dcgMemberId, dcgId }: { dcgMemberId: string; dcgId: string }) => {
      console.log('useRemoveMemberFromDcg: Removing member from DCG:', { dcgMemberId, dcgId });
      
      const { data, error } = await supabase
        .from('dcg_members')
        .update({ is_active: false })
        .eq('id', dcgMemberId)
        .select()
        .single();

      if (error) {
        console.error('useRemoveMemberFromDcg: Error removing member:', error);
        throw error;
      }
      
      console.log('useRemoveMemberFromDcg: Member removed successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('useRemoveMemberFromDcg: Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['dcg-members', data.dcg_id] });
      queryClient.invalidateQueries({ queryKey: ['available-regional-members'] });
      toast({
        title: 'Member Removed from DCG',
        description: 'Member has been removed from the DCG successfully.',
      });
    },
    onError: (error) => {
      console.error('useRemoveMemberFromDcg: Mutation failed:', error);
      toast({
        title: 'Failed to Remove Member',
        description: error.message || 'An error occurred while removing the member from DCG.',
        variant: 'destructive',
      });
    },
  });
};