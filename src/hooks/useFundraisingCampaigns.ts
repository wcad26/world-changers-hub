import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useRegionCurrency } from './useCurrencies';
import * as z from 'zod';

export type FundraisingCampaign = Database['public']['Tables']['fundraising_campaigns']['Row'];
export type FundraisingDonation = Database['public']['Tables']['fundraising_donations']['Row'];

// Schema for creating a new campaign
export const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  goal: z.coerce.number().positive('Goal must be positive'),
  startDate: z.string().min(1, 'Please select a start date'),
  endDate: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
});

export type CampaignData = z.infer<typeof campaignSchema>;

// Hook to fetch fundraising campaigns
export const useFundraisingCampaigns = (filters?: { status?: string }, regionIdOverride?: string) => {
  const { userRegion } = useAuth();
  const regionId = regionIdOverride ?? userRegion?.id;


  return useQuery({
    queryKey: ['fundraising_campaigns', regionId, filters],
    queryFn: async () => {
      if (!regionId) return [];
      
      let query = supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('region_id', regionId);
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
  });
};

// Hook to create a fundraising campaign
export const useCreateFundraisingCampaign = () => {
  const queryClient = useQueryClient();
  const { userRegion, user } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);

  return useMutation({
    mutationFn: async (campaignData: CampaignData) => {
      if (!userRegion?.id) throw new Error('User region not found');
      if (!user?.id) throw new Error('User not found');
      
      const newCampaign: Database['public']['Tables']['fundraising_campaigns']['Insert'] = {
        region_id: userRegion.id,
        created_by: user.id,
        name: campaignData.name,
        description: campaignData.description,
        goal: Math.round(campaignData.goal * 100), // Convert to cents
        start_date: campaignData.startDate,
        end_date: campaignData.endDate || null,
        image_url: campaignData.imageUrl || null,
        is_public: campaignData.isPublic,
        status: 'Active',
        currency_code: regionCurrency?.code || 'USD',
      };
      
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .insert(newCampaign)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns', userRegion.id] });
      }
    },
  });
};

// Hook to fetch a single fundraising campaign by id
export const useFundraisingCampaign = (campaignId?: string) => {
  return useQuery({
    queryKey: ['fundraising_campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
};

// Hook to update an existing campaign
export interface UpdateCampaignInput {
  id: string;
  name?: string;
  description?: string;
  goal?: number; // major units
  startDate?: string;
  endDate?: string | null;
  imageUrl?: string | null;
  isPublic?: boolean;
  status?: string;
}

export const useUpdateFundraisingCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCampaignInput) => {
      const patch: Database['public']['Tables']['fundraising_campaigns']['Update'] = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.goal !== undefined) patch.goal = Math.round(input.goal * 100);
      if (input.startDate !== undefined) patch.start_date = input.startDate;
      if (input.endDate !== undefined) patch.end_date = input.endDate;
      if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
      if (input.isPublic !== undefined) patch.is_public = input.isPublic;
      if (input.status !== undefined) patch.status = input.status;
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .update(patch)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['fundraising_campaign', data.id] });
      queryClient.invalidateQueries({ queryKey: ['fundraising_analytics'] });
    },
  });
};

// Hook to delete a campaign (cascades donations)
export const useDeleteFundraisingCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fundraising_campaigns').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['region_donations'] });
      queryClient.invalidateQueries({ queryKey: ['fundraising_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_donations'] });
    },
  });
};

// Hook to get campaign analytics
export const useFundraisingAnalytics = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['fundraising_analytics', regionId],
    queryFn: async () => {
      if (!regionId) return null;
      
      const { data: campaigns, error } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('region_id', regionId);

      if (error) throw error;

      const totalRaised = campaigns.reduce((acc, campaign) => acc + campaign.raised, 0);
      const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
      
      // Get total donors count
      const { data: donations, error: donationsError } = await supabase
        .from('fundraising_donations')
        .select('id, campaign_id')
        .in('campaign_id', campaigns.map(c => c.id));

      if (donationsError) throw donationsError;

      const totalDonors = donations?.length || 0;

      return {
        totalRaised: totalRaised / 100, // Convert from cents
        activeCampaigns,
        totalDonors,
        campaigns,
      };
    },
    enabled: !!regionId,
  });
};

// Hook to get donations for a campaign
export const useCampaignDonations = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign_donations', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fundraising_donations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('donation_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
};

// Mutation: create a donation (regional admin manual entry)
export interface NewDonationInput {
  campaign_id: string;
  amount: number; // major units, will be converted to cents
  donor_name?: string | null;
  donor_email?: string | null;
  donor_id?: string | null;
  member_id?: string | null;
  message?: string | null;
  anonymous?: boolean;
  donation_date?: string; // ISO
  currency_code?: string;
  event_pre_registration_id?: string | null;
}

export const useCreateDonation = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  return useMutation({
    mutationFn: async (input: NewDonationInput) => {
      const payload: Database['public']['Tables']['fundraising_donations']['Insert'] = {
        campaign_id: input.campaign_id,
        amount: Math.round(input.amount * 100),
        donor_name: input.anonymous ? null : (input.donor_name || null),
        donor_email: input.anonymous ? null : (input.donor_email || null),
        donor_id: input.anonymous ? null : (input.donor_id || null),
        member_id: input.anonymous ? null : (input.member_id || null),
        message: input.message || null,
        anonymous: !!input.anonymous,
        donation_date: input.donation_date || new Date().toISOString(),
        currency_code: input.currency_code || regionCurrency?.code || 'USD',
        event_pre_registration_id: input.event_pre_registration_id ?? null,
      };
      const { data, error } = await supabase
        .from('fundraising_donations')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['region_donations'] });
      queryClient.invalidateQueries({ queryKey: ['fundraising_analytics'] });
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns', userRegion.id] });
      }
    },
  });
};

// Mutation: delete a donation
export const useDeleteDonation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fundraising_donations').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraising_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['region_donations'] });
      queryClient.invalidateQueries({ queryKey: ['fundraising_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_donations'] });
    },
  });
};

// Hook: fetch donations across all campaigns in the user's region within a date range
export const useRegionDonations = (from: Date, to: Date) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;
  return useQuery({
    queryKey: ['region_donations', regionId, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      if (!regionId) return [];
      const { data: campaigns, error: cErr } = await supabase
        .from('fundraising_campaigns')
        .select('id, name, currency_code')
        .eq('region_id', regionId);
      if (cErr) throw cErr;
      const ids = (campaigns || []).map(c => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('fundraising_donations')
        .select('*')
        .in('campaign_id', ids)
        .gte('donation_date', from.toISOString())
        .lte('donation_date', to.toISOString())
        .order('donation_date', { ascending: false });
      if (error) throw error;
      const byId = new Map(campaigns.map(c => [c.id, c]));
      return (data || []).map(d => ({
        ...d,
        campaign: byId.get(d.campaign_id) || null,
      }));
    },
    enabled: !!regionId,
  });
};