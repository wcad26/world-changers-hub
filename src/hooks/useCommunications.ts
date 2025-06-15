import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

export type Communication = Database['public']['Tables']['communications']['Row'];
export type NewCommunication = Database['public']['Tables']['communications']['Insert'];
export type UpdateCommunication = Database['public']['Tables']['communications']['Update'];
export type CommunicationMessageType = Database['public']['Enums']['communication_message_type'];

export type CommunicationTemplate = Database['public']['Tables']['communication_templates']['Row'];
export type NewCommunicationTemplate = Database['public']['Tables']['communication_templates']['Insert'];

export type CommunicationFormValues = {
  title: string;
  messageType: string;
  content: string;
  audience: string;
  channels: string[];
  sendNow: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
};

// Hook to get communications for the current admin's region
export const useCommunications = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['communications', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
  });
};

// Hook to create a communication
export const useCreateCommunication = () => {
  const queryClient = useQueryClient();
  const { user, userRegion } = useAuth();

  return useMutation({
    mutationFn: async (values: CommunicationFormValues) => {
      if (!userRegion?.id || !user?.id) throw new Error('User or region not found');
      
      const scheduled_for = !values.sendNow && values.scheduledDate && values.scheduledTime 
          ? new Date(`${values.scheduledDate}T${values.scheduledTime}`).toISOString() 
          : null;
      
      const communicationToInsert: NewCommunication = {
          title: values.title,
          content: values.content,
          message_type: values.messageType as CommunicationMessageType,
          audience: values.audience,
          channels: values.channels,
          status: scheduled_for ? 'scheduled' : 'sent',
          sent_at: scheduled_for ? null : new Date().toISOString(),
          scheduled_for,
          region_id: userRegion.id,
          created_by: user.id
      };

      const { data, error } = await supabase
          .from('communications')
          .insert(communicationToInsert)
          .select()
          .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });
};

// Hook to get communication templates
export const useCommunicationTemplates = () => {
    const { userRegion } = useAuth();
    const regionId = userRegion?.id;

    return useQuery({
        queryKey: ['communication_templates', regionId],
        queryFn: async () => {
            if (!regionId) return [];
            // Fetches global templates (region_id is null) and templates for the user's region
            const { data, error } = await supabase
                .from('communication_templates')
                .select('*')
                .or(`region_id.eq.${regionId},region_id.is.null`)
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!regionId,
    });
};

// Hook to create a communication template
export const useCreateCommunicationTemplate = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    return useMutation({
        mutationFn: async (templateData: Omit<NewCommunicationTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
            if (!user?.id) throw new Error('User not found');
            
            const insertData: NewCommunicationTemplate = {
                ...templateData,
                created_by: user.id,
            };

            const { data, error } = await supabase
                .from('communication_templates')
                .insert(insertData)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communication_templates'] });
        },
    });
};

// --- SUPER ADMIN HOOKS ---

// Hook to get all communications for super admin
export const useSuperAdminCommunications = () => {
  return useQuery({
    queryKey: ['communications', 'super_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('*, region:regions(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Communication & { region: { name: string } | null })[];
    },
  });
};

// Hook for super admin to create communications
export const useSuperAdminCreateCommunication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ values, targetRegionIds }: { values: CommunicationFormValues, targetRegionIds: string[] }) => {
      if (!user?.id) throw new Error('User not found');

      const scheduled_for = !values.sendNow && values.scheduledDate && values.scheduledTime
          ? new Date(`${values.scheduledDate}T${values.scheduledTime}`).toISOString()
          : null;
      
      const communicationsToInsert: NewCommunication[] = targetRegionIds.map(regionId => ({
          title: values.title,
          content: values.content,
          message_type: values.messageType as CommunicationMessageType,
          audience: values.audience,
          channels: values.channels,
          status: scheduled_for ? 'scheduled' : 'sent',
          sent_at: scheduled_for ? null : new Date().toISOString(),
          scheduled_for,
          region_id: regionId,
          created_by: user.id
      }));

      const { data, error } = await supabase
          .from('communications')
          .insert(communicationsToInsert)
          .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'super_admin'] });
      queryClient.invalidateQueries({ queryKey: ['communications'] }); // Also invalidate regional views
    },
  });
};
