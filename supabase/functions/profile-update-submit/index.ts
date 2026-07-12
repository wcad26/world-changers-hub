import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyUpdateToken } from '../_shared/updateToken.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const body = await req.json();
    const { token, data } = body || {};
    const verified = token ? await verifyUpdateToken(String(token)) : null;
    if (!verified) {
      return new Response(JSON.stringify({ success: false, error: 'invalid_or_expired_token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const profileId = verified.pid;

    if (!data) {
      return new Response(JSON.stringify({ success: false, error: 'missing_data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      first_name, last_name, phone, address, date_of_birth, gender, occupation,
      has_completed_foundation_school, foundation_school_date,
      is_baptized, baptism_date,
      ministry_interests, dcg_id, relationships,
    } = data;

    const normalizedGender = typeof gender === 'string' ? gender.trim().toLowerCase() : null;
    const safeGender = normalizedGender === 'male' || normalizedGender === 'female' ? normalizedGender : null;

    // Update profile (email is not changed)
    const { error: profErr } = await supabase.from('profiles').update({
      first_name: (first_name || '').trim() || null,
      last_name: (last_name || '').trim() || null,
      phone: (phone || '').trim() || null,
      address: (address || '').trim() || null,
      date_of_birth: date_of_birth || null,
      gender: safeGender,
      occupation: (occupation || '').trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profileId);
    if (profErr) throw profErr;

    // Find member record
    const { data: member } = await supabase
      .from('members')
      .select('id, region_id, member_type')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (member) {
      const completedFS = has_completed_foundation_school === 'yes';
      const upgradeToMember = completedFS && member.member_type !== 'member';

      const { error: memErr } = await supabase.from('members').update({
        membership_class_completed: completedFS,
        foundation_school_date: (completedFS && foundation_school_date) ? foundation_school_date : null,
        baptism_date: (is_baptized === 'yes' && baptism_date) ? baptism_date : null,
        preferred_service_areas: Array.isArray(ministry_interests) && ministry_interests.length ? ministry_interests : null,
        member_type: completedFS ? 'member' : member.member_type,
        updated_at: new Date().toISOString(),
      }).eq('id', member.id);
      if (memErr) throw memErr;

      // Assign 'member' role if newly qualified
      if (upgradeToMember && member.region_id) {
        await supabase.from('user_roles').upsert({
          user_id: profileId,
          role: 'member',
          region_id: member.region_id,
          is_active: true,
          status: 'active',
          assigned_at: new Date().toISOString(),
        }, { onConflict: 'user_id,role,region_id' });
      }

      // DCG membership: deactivate current, activate selected
      if (typeof dcg_id === 'string' && dcg_id) {
        await supabase.from('dcg_members')
          .update({ is_active: false })
          .eq('member_id', member.id);
        // Try to reactivate an existing row; if none, insert
        const { data: existingRow } = await supabase
          .from('dcg_members')
          .select('id')
          .eq('member_id', member.id)
          .eq('dcg_id', dcg_id)
          .maybeSingle();
        if (existingRow) {
          await supabase.from('dcg_members').update({ is_active: true }).eq('id', existingRow.id);
        } else {
          await supabase.from('dcg_members').insert({
            dcg_id, member_id: member.id, role: 'Member',
            is_active: true, joined_date: new Date().toISOString().split('T')[0],
          });
        }
      }

      // Replace relationships
      if (Array.isArray(relationships)) {
        await supabase.from('member_relationships').delete().eq('member_id', member.id);
        for (const rel of relationships) {
          const relType = rel?.relationship_type;
          const ids: string[] = Array.isArray(rel?.member_ids) ? rel.member_ids : [];
          if (!relType || !ids.length) continue;
          for (const relatedId of ids) {
            await supabase.from('member_relationships').insert({
              member_id: member.id,
              related_member_id: relatedId,
              relationship_type: relType,
              created_by: profileId,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, member_id: member?.id || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('profile-update-submit error', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'server_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
