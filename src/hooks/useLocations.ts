import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import * as z from 'zod';

// Location schema for form validation
export const locationSchema = z.object({
  name: z.string().min(3, { message: "Location name must be at least 3 characters." }),
  type: z.enum(['WCA Center', 'DCG Location'], { message: "Please select a location type." }),
  address: z.string().min(5, { message: "Please provide a valid address." }),
  city: z.string().min(2, { message: "Please enter a city." }),
  state: z.string().min(2, { message: "Please enter a state." }),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  whatsapp_link: z.string().url().optional().or(z.literal("")),
  fellowship_times: z.array(z.object({
    day: z.string(),
    time: z.string(),
    type: z.string()
  })).optional(),
  capacity: z.number().positive().optional(),
  facilities: z.string().optional(),
});

export type NewLocationData = z.infer<typeof locationSchema>;

type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];

export const useLocations = (regionId?: string) => {
  return useQuery({
    queryKey: ['locations', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching locations:', error);
        throw error;
      }
      
      return data as Location[];
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (newLocation: NewLocationData) => {
      if (!userRegion) {
        throw new Error("User region not found");
      }

      const locationData: LocationInsert = {
        name: newLocation.name,
        type: newLocation.type,
        address: newLocation.address,
        city: newLocation.city,
        state: newLocation.state,
        zip: newLocation.zip,
        latitude: newLocation.latitude || null,
        longitude: newLocation.longitude || null,
        contact_person: newLocation.contact_person || null,
        contact_phone: newLocation.contact_phone || null,
        image_url: newLocation.image_url || null,
        website_url: newLocation.website_url || null,
        whatsapp_link: newLocation.whatsapp_link || null,
        fellowship_times: newLocation.fellowship_times || [],
        capacity: newLocation.capacity || null,
        facilities: newLocation.facilities || null,
        region_id: userRegion.id,
      };

      const { data, error } = await supabase
        .from('locations')
        .insert(locationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating location:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['locations', userRegion.id] });
      }
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['locations', userRegion.id] });
      }
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting location:', error);
        throw error;
      }
    },
    onSuccess: () => {
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['locations', userRegion.id] });
      }
    },
  });
};