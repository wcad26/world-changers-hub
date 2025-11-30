import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type MemberRow = Database['public']['Tables']['members']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RegionRow = Database['public']['Tables']['regions']['Row'];

export interface MemberWithDetails extends MemberRow {
  profiles: ProfileRow | null;
  regions: RegionRow | null;
}

interface UseAllMembersOptions {
  searchTerm?: string;
  regionId?: string;
  status?: string;
  memberType?: string;
}

export const useAllMembers = (options: UseAllMembersOptions = {}) => {
  const { searchTerm = '', regionId, status, memberType } = options;

  return useQuery({
    queryKey: ['members', 'all', options],
    queryFn: async () => {
      console.log('Fetching all members with options:', options);
      
      let query = supabase
        .from('members')
        .select(`
          *,
          profiles (*),
          regions (*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (regionId) {
        query = query.eq('region_id', regionId);
      }
      
      if (status && (status === 'active' || status === 'inactive' || status === 'new' || status === 'transferred')) {
        query = query.eq('status', status);
      }
      
      if (memberType) {
        query = query.eq('member_type', memberType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }

      // Apply client-side search filtering if searchTerm is provided
      let filteredData = data as MemberWithDetails[];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(member => {
          const firstName = member.profiles?.first_name?.toLowerCase() || '';
          const lastName = member.profiles?.last_name?.toLowerCase() || '';
          const email = member.profiles?.email?.toLowerCase() || '';
          const phone = member.profiles?.phone || '';
          const memberId = member.member_id?.toLowerCase() || '';
          
          return firstName.includes(searchLower) ||
                 lastName.includes(searchLower) ||
                 email.includes(searchLower) ||
                 phone.includes(searchLower) ||
                 memberId.includes(searchLower);
        });
      }

      console.log('Members fetched successfully:', filteredData.length);
      return filteredData;
    }
  });
};

interface RegionalStats {
  region_id: string;
  region_name: string;
  total: number;
  active: number;
  inactive: number;
  new: number;
  members: number;
  visitors: number;
}

export const useGlobalMemberStats = () => {
  return useQuery({
    queryKey: ['members', 'global-stats'],
    queryFn: async () => {
      console.log('Fetching global member statistics');
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          region_id,
          status,
          member_type,
          regions (
            id,
            name,
            code
          )
        `);

      if (error) {
        console.error('Error fetching member stats:', error);
        throw error;
      }

      // Aggregate statistics per region
      const statsMap = new Map<string, RegionalStats>();

      data.forEach((member: any) => {
        const regionId = member.region_id;
        const regionName = member.regions?.name || 'Unknown';
        
        if (!statsMap.has(regionId)) {
          statsMap.set(regionId, {
            region_id: regionId,
            region_name: regionName,
            total: 0,
            active: 0,
            inactive: 0,
            new: 0,
            members: 0,
            visitors: 0,
          });
        }

        const stats = statsMap.get(regionId)!;
        stats.total++;

        // Count by status
        if (member.status === 'active') stats.active++;
        else if (member.status === 'inactive') stats.inactive++;
        else if (member.status === 'new') stats.new++;

        // Count by member type
        if (member.member_type === 'member') stats.members++;
        else if (member.member_type === 'visitor') stats.visitors++;
      });

      const statsArray = Array.from(statsMap.values());
      console.log('Member statistics calculated:', statsArray);
      return statsArray;
    }
  });
};
