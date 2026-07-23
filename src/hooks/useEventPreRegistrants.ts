import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PreRegistrantRow {
  id: string;
  event_id: string;
  member_id: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean | null;
  group_id: string | null;
  registration_type: string | null;
  needs_lodging: boolean | null;
  meal_preferences: string[] | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  region_id: string | null;
  region_name: string | null;
  full_name: string;
  age_category: 'adult' | 'child' | 'unknown';
  has_certificate: boolean;
  has_badge: boolean;
}

export interface PreRegistrantFilters {
  primaryOnly?: boolean;
  needsLodging?: boolean;
  attendeeType?: 'all' | 'adult' | 'child';
  regionId?: string;
  search?: string;
}

const computeAge = (dob: string | null | undefined): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

export const useEventPreRegistrants = (eventId: string | undefined, filters: PreRegistrantFilters = {}) => {
  return useQuery({
    queryKey: ['event-pre-registrants', eventId, filters],
    enabled: !!eventId,
    queryFn: async (): Promise<PreRegistrantRow[]> => {
      if (!eventId) return [];

      const { data: preRegs, error } = await supabase
        .from('event_pre_registrations')
        .select(`
          id, event_id, member_id, email, phone, is_primary, group_id, registration_type,
          needs_lodging, meal_preferences,
          members ( id, region_id, regions ( name ), profiles ( first_name, last_name, date_of_birth, email, phone ) )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch already-issued certs/badges for this event's pre-registrants
      const preRegIds = (preRegs || []).map((r: any) => r.id);
      const existing = new Map<string, { cert: boolean; badge: boolean }>();
      if (preRegIds.length > 0) {
        const { data: existingCerts } = await supabase
          .from('certificates')
          .select('pre_registration_id, output_type, is_active')
          .in('pre_registration_id', preRegIds)
          .eq('is_active', true);
        (existingCerts || []).forEach((c: any) => {
          const rec = existing.get(c.pre_registration_id) || { cert: false, badge: false };
          if (c.output_type === 'badge') rec.badge = true;
          else rec.cert = true;
          existing.set(c.pre_registration_id, rec);
        });
      }

      const rows: PreRegistrantRow[] = (preRegs || []).map((r: any) => {
        const p = r.members?.profiles || {};
        const first = p.first_name || null;
        const last = p.last_name || null;
        const fullName = last || first
          ? `${last || ''} ${first || ''}`.trim()
          : (r.email || r.phone || 'Unknown');
        const age = computeAge(p.date_of_birth);
        const category: PreRegistrantRow['age_category'] =
          age === null ? 'unknown' : age < 15 ? 'child' : 'adult';
        const rec = existing.get(r.id) || { cert: false, badge: false };
        return {
          id: r.id,
          event_id: r.event_id,
          member_id: r.member_id,
          email: r.email || p.email || null,
          phone: r.phone || p.phone || null,
          is_primary: r.is_primary,
          group_id: r.group_id,
          registration_type: r.registration_type,
          needs_lodging: r.needs_lodging,
          meal_preferences: r.meal_preferences,
          first_name: first,
          last_name: last,
          date_of_birth: p.date_of_birth || null,
          region_id: r.members?.region_id || null,
          region_name: r.members?.regions?.name || null,
          full_name: fullName,
          age_category: category,
          has_certificate: rec.cert,
          has_badge: rec.badge,
        };
      });

      const search = (filters.search || '').toLowerCase().trim();
      return rows.filter((row) => {
        if (filters.primaryOnly && !row.is_primary) return false;
        if (filters.needsLodging && !row.needs_lodging) return false;
        if (filters.attendeeType && filters.attendeeType !== 'all') {
          if (filters.attendeeType === 'adult' && row.age_category === 'child') return false;
          if (filters.attendeeType === 'child' && row.age_category !== 'child') return false;
        }
        if (filters.regionId && filters.regionId !== 'all' && row.region_id !== filters.regionId) return false;
        if (search) {
          const hay = `${row.full_name} ${row.email || ''} ${row.phone || ''}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      });
    },
  });
};
