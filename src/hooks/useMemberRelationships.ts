import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export type FamilyRelationshipType = 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'other';

export interface MemberRelationship {
  id: string;
  member_id: string;
  related_member_id: string;
  relationship_type: FamilyRelationshipType;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  related_member?: {
    id: string;
    member_id: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      email: string | null;
    } | null;
  };
}

export const useMemberRelationships = (memberId?: string) => {
  return useQuery({
    queryKey: ['member-relationships', memberId],
    queryFn: async (): Promise<MemberRelationship[]> => {
      if (!memberId) return [];

      // Fetch relationships
      const { data, error } = await supabase
        .from('member_relationships' as any)
        .select('*')
        .eq('member_id', memberId);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const rows = data as any[];
      const relatedMemberIds = rows.map((r: any) => r.related_member_id);

      // Fetch related member details
      const { data: relatedMembers, error: membersError } = await supabase
        .from('members')
        .select('id, member_id, profiles(first_name, last_name, phone, email)')
        .in('id', relatedMemberIds);

      if (membersError) throw membersError;

      return rows.map((rel: any) => ({
        ...rel,
        related_member: relatedMembers?.find(m => m.id === rel.related_member_id),
      }));
    },
    enabled: !!memberId,
  });
};

export const useCreateMemberRelationship = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      relatedMemberId,
      relationshipType,
      notes,
    }: {
      memberId: string;
      relatedMemberId: string;
      relationshipType: FamilyRelationshipType;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('member_relationships' as any)
        .insert({
          member_id: memberId,
          related_member_id: relatedMemberId,
          relationship_type: relationshipType,
          notes: notes || null,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relationships', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-relationships', variables.relatedMemberId] });
      toast({ title: 'Success', description: 'Family relationship added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteMemberRelationship = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('member_relationships' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relationships', variables.memberId] });
      toast({ title: 'Success', description: 'Relationship removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
