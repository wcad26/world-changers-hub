import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ensureAuthUser } from '../_shared/ensureAuthUser.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const body = await req.json().catch(() => ({}))
    const record = body?.record ?? body ?? {}
    const {
      first_name, last_name, phone, address, date_of_birth, gender, occupation, region_id,
    } = record
    const email = String(record.email ?? '').trim().toLowerCase()
    const member_type = record.member_type === 'visitor' ? 'visitor' : 'member'

    if (!email || !first_name || !last_name || !region_id) {
      return json({ success: false, error: 'Email, first name, last name and region are required.' })
    }

    // Already registered in this region? Tell the admin clearly instead of crashing.
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles').select('id').ilike('email', email).maybeSingle()
    if (existingProfile) {
      const { data: existingMember } = await supabaseAdmin
        .from('members').select('id, member_id, member_type, region_id')
        .eq('profile_id', existingProfile.id).maybeSingle()
      if (existingMember) {
        const sameRegion = existingMember.region_id === region_id
        return json({
          success: false,
          is_duplicate: true,
          error: sameRegion
            ? `This email is already registered in this region as a ${existingMember.member_type} (${existingMember.member_id}).`
            : `This email is already registered in another region (${existingMember.member_id}). Use Member Transfer instead.`,
        })
      }
    }

    // Reuse or provision the sign-in account (handles existing emails safely).
    const auth = await ensureAuthUser(supabaseAdmin, {
      email, firstName: first_name, lastName: last_name, metadata: { region_id, phone, address },
    })
    const profileId = auth.id

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: profileId,
      email,
      first_name,
      last_name,
      phone: phone || null,
      address: address || null,
      date_of_birth: date_of_birth || null,
      gender: gender ? String(gender).toLowerCase() : null,
      occupation: occupation || null,
      region_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (profileError) throw profileError

    const { data: memberId, error: memberIdError } = await supabaseAdmin.rpc('generate_member_id', { _region_id: region_id })
    if (memberIdError || !memberId) throw memberIdError ?? new Error('Could not generate member ID.')

    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: profileId,
        region_id,
        member_id: memberId,
        member_type,
        status: 'new',
        join_date: new Date().toISOString().split('T')[0],
      })
      .select('*, profiles(*)')
      .single()
    if (memberError) throw memberError

    if (member_type === 'member') {
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: profileId, role: 'member', region_id, is_active: true, status: 'active',
      })
      if (roleError) console.error('create-member: role assignment failed', roleError)
    }

    return json({
      success: true,
      id: newMember.id,
      member: newMember,
      message: `${first_name} ${last_name} registered with ID ${memberId}`,
    })
  } catch (error) {
    console.error('create-member: Fatal error:', error)
    return json({ success: false, error: (error as Error)?.message ?? 'Registration failed' })
  }
})
