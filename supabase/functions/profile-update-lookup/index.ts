import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { signUpdateToken } from '../_shared/updateToken.ts';

const normEmail = (s?: string | null) => (s ?? '').trim().toLowerCase();
const normDigits = (s?: string | null) => (s ?? '').replace(/\D+/g, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { email, phone } = await req.json();
    const e = normEmail(email);
    const p = normDigits(phone);

    if (!e && !p) {
      return new Response(JSON.stringify({ success: false, error: 'missing_contact' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find candidate profiles
    let profiles: any[] = [];
    if (e) {
      const { data } = await supabase.from('profiles').select('*').ilike('email', e).limit(5);
      profiles = data || [];
    }
    if (!profiles.length && p) {
      // Match by last 9 digits using ilike patterns that ignore separators.
      const last9 = p.slice(-9);
      const pattern = '%' + last9.split('').join('%') + '%';
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('phone', pattern)
        .limit(20);
      profiles = data || [];
      // Prefer exact digit match if multiple
      const exact = profiles.filter((row: any) => normDigits(row.phone) === p || normDigits(row.phone).endsWith(last9));
      if (exact.length) profiles = exact;
    }

    if (!profiles.length) {
      return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profiles.length > 1) {
      const masked = profiles.map((pr) => ({
        id: pr.id,
        name: `${pr.last_name || ''} ${pr.first_name || ''}`.trim(),
        email_masked: pr.email ? pr.email.replace(/(.).*(@.*)/, '$1***$2') : null,
      }));
      return new Response(JSON.stringify({ success: false, error: 'multiple_matches', candidates: masked }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profile = profiles[0];

    // Load member record (any region)
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    // Load region
    let region: any = null;
    const regionId = member?.region_id || profile.region_id;
    if (regionId) {
      const { data: r } = await supabase.from('regions').select('id, name, code, slug').eq('id', regionId).maybeSingle();
      region = r;
    }

    // Load DCG membership
    let dcg_id: string | null = null;
    if (member?.id) {
      const { data: dm } = await supabase
        .from('dcg_members')
        .select('dcg_id')
        .eq('member_id', member.id)
        .eq('is_active', true)
        .maybeSingle();
      dcg_id = dm?.dcg_id ?? null;
    }

    // Load relationships
    let relationships: Array<{ relationship_type: string; member_ids: string[] }> = [];
    if (member?.id) {
      const { data: rels } = await supabase
        .from('member_relationships')
        .select('relationship_type, related_member_id')
        .eq('member_id', member.id);
      const grouped = new Map<string, string[]>();
      (rels || []).forEach((r: any) => {
        const arr = grouped.get(r.relationship_type) || [];
        arr.push(r.related_member_id);
        grouped.set(r.relationship_type, arr);
      });
      relationships = Array.from(grouped.entries()).map(([relationship_type, member_ids]) => ({ relationship_type, member_ids }));
    }

    const token = await signUpdateToken(profile.id);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        profile: {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          date_of_birth: profile.date_of_birth || '',
          gender: profile.gender || '',
          occupation: profile.occupation || '',
          region_id: regionId || null,
        },
        member: member ? {
          id: member.id,
          member_id: member.member_id,
          member_type: member.member_type,
          membership_class_completed: !!member.membership_class_completed,
          foundation_school_date: member.foundation_school_date || '',
          baptism_date: member.baptism_date || '',
          ministry_interests: member.preferred_service_areas || [],
        } : null,
        region,
        dcg_id,
        relationships,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('profile-update-lookup error', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'server_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
