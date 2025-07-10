import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
import * as z from 'zod';

// Types from database
type DiscipleshipRelationship = Database['public']['Tables']['discipleship_relationships']['Row'];
type DiscipleshipProgress = Database['public']['Tables']['discipleship_progress']['Row'];
type DiscipleshipStatus = Database['public']['Enums']['discipleship_status'];
type DiscipleshipMilestone = Database['public']['Enums']['discipleship_milestone'];

// Enhanced types with joined data
export type DiscipleshipRelationshipWithMembers = DiscipleshipRelationship & {
  mentor: { 
    id: string; 
    member_id: string;
    profiles: { first_name: string; last_name: string } | null;
  } | null;
  disciple: { 
    id: string; 
    member_id: string;
    profiles: { first_name: string; last_name: string } | null;
  } | null;
  progress?: DiscipleshipProgress[];
};

export type DiscipleshipStats = {
  total_disciples: number;
  active_disciples: number;
  completed_disciples: number;
  success_rate: number;
};

export type DiscipleshipImpactTrend = {
  event_date: string;
  event_name: string;
  mentor_attended: boolean;
  disciples_attended: number;
};

// Schema for creating discipleship relationships
export const discipleshipRelationshipSchema = z.object({
  mentor_id: z.string().uuid('Invalid mentor ID'),
  disciple_id: z.string().uuid('Invalid disciple ID'),
  start_date: z.string().optional(),
  notes: z.string().optional(),
});

export type NewDiscipleshipRelationshipData = z.infer<typeof discipleshipRelationshipSchema>;

// Schema for progress tracking
export const discipleshipProgressSchema = z.object({
  relationship_id: z.string().uuid('Invalid relationship ID'),
  milestone: z.enum(['first_visit', 'second_visit', 'committed', 'baptized', 'became_member', 'serving']),
  achieved_date: z.string().optional(),
  notes: z.string().optional(),
});

export type NewDiscipleshipProgressData = z.infer<typeof discipleshipProgressSchema>;

// Hook to get discipleship relationships for a region
export const useDiscipleshipRelationships = (regionId?: string) => {
  return useQuery({
    queryKey: ['discipleship-relationships', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      console.log('useDiscipleshipRelationships: Fetching relationships for region:', regionId);
      
      const { data, error } = await supabase
        .from('discipleship_relationships')
        .select(`
          *,
          mentor:mentor_id (
            id,
            member_id,
            profiles (first_name, last_name)
          ),
          disciple:disciple_id (
            id,
            member_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('useDiscipleshipRelationships: Error fetching relationships:', error);
        throw error;
      }
      
      console.log('useDiscipleshipRelationships: Fetched relationships:', data);
      return data as any[];
    },
    enabled: !!regionId,
  });
};

// Hook to get discipleship relationships for a specific member
export const useMemberDiscipleshipRelationships = (memberId?: string) => {
  return useQuery({
    queryKey: ['member-discipleship-relationships', memberId],
    queryFn: async () => {
      if (!memberId) return { asDisciple: [], asMentor: [] };
      
      console.log('useMemberDiscipleshipRelationships: Fetching relationships for member:', memberId);
      
      // Get relationships where member is a disciple
      const { data: asDisciple, error: discipleError } = await supabase
        .from('discipleship_relationships')
        .select(`
          *,
          mentor:members!mentor_id (
            id,
            member_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('disciple_id', memberId);
      
      if (discipleError) {
        console.error('useMemberDiscipleshipRelationships: Error fetching disciple relationships:', discipleError);
        throw discipleError;
      }
      
      // Get relationships where member is a mentor
      const { data: asMentor, error: mentorError } = await supabase
        .from('discipleship_relationships')
        .select(`
          *,
          disciple:members!disciple_id (
            id,
            member_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('mentor_id', memberId);
      
      if (mentorError) {
        console.error('useMemberDiscipleshipRelationships: Error fetching mentor relationships:', mentorError);
        throw mentorError;
      }
      
      console.log('useMemberDiscipleshipRelationships: Fetched relationships:', { asDisciple, asMentor });
      return { asDisciple: asDisciple || [], asMentor: asMentor || [] };
    },
    enabled: !!memberId,
  });
};

// Hook to get member discipleship stats
export const useMemberDiscipleshipStats = (memberId?: string) => {
  return useQuery({
    queryKey: ['member-discipleship-stats', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      
      console.log('useMemberDiscipleshipStats: Fetching stats for member:', memberId);
      
      const { data, error } = await supabase.rpc('get_member_discipleship_stats', {
        _member_id: memberId
      });
      
      if (error) {
        console.error('useMemberDiscipleshipStats: Error fetching stats:', error);
        throw error;
      }
      
      console.log('useMemberDiscipleshipStats: Fetched stats:', data);
      return data?.[0] as DiscipleshipStats || null;
    },
    enabled: !!memberId,
  });
};

// Hook to get discipleship impact trend
export const useDiscipleshipImpactTrend = (memberId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['discipleship-impact-trend', memberId, regionId],
    queryFn: async () => {
      if (!memberId || !regionId) return [];
      
      console.log('useDiscipleshipImpactTrend: Fetching trend for member:', memberId, 'region:', regionId);
      
      const { data, error } = await supabase.rpc('get_discipleship_impact_trend', {
        _member_id: memberId,
        _region_id: regionId
      });
      
      if (error) {
        console.error('useDiscipleshipImpactTrend: Error fetching trend:', error);
        throw error;
      }
      
      console.log('useDiscipleshipImpactTrend: Fetched trend:', data);
      return data as DiscipleshipImpactTrend[] || [];
    },
    enabled: !!memberId && !!regionId,
  });
};

// Hook to create discipleship relationship
export const useCreateDiscipleshipRelationship = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (newRelationship: NewDiscipleshipRelationshipData) => {
      console.log('useCreateDiscipleshipRelationship: Creating relationship:', newRelationship);
      
      if (!userRegion) {
        console.error('useCreateDiscipleshipRelationship: No user region found');
        throw new Error("User region not found");
      }

      const { data, error } = await supabase
        .from('discipleship_relationships')
        .insert({
          mentor_id: newRelationship.mentor_id,
          disciple_id: newRelationship.disciple_id,
          start_date: newRelationship.start_date,
          notes: newRelationship.notes,
          region_id: userRegion.id
        })
        .select()
        .single();

      if (error) {
        console.error('useCreateDiscipleshipRelationship: Error creating relationship:', error);
        throw error;
      }
      
      console.log('useCreateDiscipleshipRelationship: Created relationship:', data);
      return data;
    },
    onSuccess: () => {
      console.log('useCreateDiscipleshipRelationship: Mutation successful, invalidating queries');
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['discipleship-relationships', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['member-discipleship-relationships'] });
        queryClient.invalidateQueries({ queryKey: ['member-discipleship-stats'] });
      }
    },
    onError: (error) => {
      console.error('useCreateDiscipleshipRelationship: Mutation failed:', error);
    },
  });
};

// Hook to update discipleship relationship
export const useUpdateDiscipleshipRelationship = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DiscipleshipRelationship> }) => {
      console.log('useUpdateDiscipleshipRelationship: Updating relationship:', id, updates);
      
      const { data, error } = await supabase
        .from('discipleship_relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('useUpdateDiscipleshipRelationship: Error updating relationship:', error);
        throw error;
      }
      
      console.log('useUpdateDiscipleshipRelationship: Updated relationship:', data);
      return data;
    },
    onSuccess: () => {
      console.log('useUpdateDiscipleshipRelationship: Mutation successful, invalidating queries');
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['discipleship-relationships', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['member-discipleship-relationships'] });
        queryClient.invalidateQueries({ queryKey: ['member-discipleship-stats'] });
      }
    },
    onError: (error) => {
      console.error('useUpdateDiscipleshipRelationship: Mutation failed:', error);
    },
  });
};

// Hook to add discipleship progress
export const useAddDiscipleshipProgress = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (newProgress: NewDiscipleshipProgressData) => {
      console.log('useAddDiscipleshipProgress: Adding progress:', newProgress);
      
      const { data, error } = await supabase
        .from('discipleship_progress')
        .insert({
          relationship_id: newProgress.relationship_id,
          milestone: newProgress.milestone,
          achieved_date: newProgress.achieved_date,
          notes: newProgress.notes
        })
        .select()
        .single();

      if (error) {
        console.error('useAddDiscipleshipProgress: Error adding progress:', error);
        throw error;
      }
      
      console.log('useAddDiscipleshipProgress: Added progress:', data);
      return data;
    },
    onSuccess: () => {
      console.log('useAddDiscipleshipProgress: Mutation successful, invalidating queries');
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['discipleship-relationships', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['member-discipleship-stats'] });
      }
    },
    onError: (error) => {
      console.error('useAddDiscipleshipProgress: Mutation failed:', error);
    },
  });
};