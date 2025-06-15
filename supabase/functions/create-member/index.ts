
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { record } = await req.json()
    const { email, first_name, last_name, phone, address, date_of_birth, gender, occupation, region_id } = record

    if (!email || !first_name || !last_name || !region_id) {
      throw new Error('Email, first name, last name, and region ID are required.')
    }

    // 1. Invite user by email. This creates an auth.users record.
    const { data: { user }, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
      },
    })

    if (inviteError) throw inviteError
    if (!user) throw new Error('User could not be created.')

    // The handle_new_user trigger has already created a profile.
    // 2. Update the new profile with additional details.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone,
        address,
        date_of_birth,
        gender,
        occupation,
        region_id,
        first_name,
        last_name
      })
      .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        // We can decide to continue or throw here. Let's continue for now.
    }

    // 3. Generate a member ID.
    const { data: memberId, error: memberIdError } = await supabaseAdmin.rpc('generate_member_id', {
      _region_id: region_id,
    })

    if (memberIdError) throw memberIdError
    if (!memberId) throw new Error('Could not generate member ID.')

    // 4. Create the member record.
    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: user.id,
        region_id: region_id,
        member_id: memberId,
        status: 'new'
      })
      .select()
      .single()

    if (memberError) throw memberError

    return new Response(JSON.stringify({ member: newMember }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
