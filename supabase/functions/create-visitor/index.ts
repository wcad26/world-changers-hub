import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('create-visitor: Function invoked')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      address,
      region_id,
      rated_event_id,
      event_satisfaction_rating,
      referral_source,
      referral_person_name
    } = await req.json()

    console.log('create-visitor: Received data for', email)

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !address || !region_id) {
      throw new Error('All fields are required: first name, last name, email, phone, address, and region.')
    }

    // Check for existing visitor profile with same email in same region
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('region_id', region_id)
      .maybeSingle()

    if (existingProfile) {
      // Check if this profile has a visitor member record
      const { data: existingVisitor } = await supabaseAdmin
        .from('members')
        .select('id, member_id')
        .eq('profile_id', existingProfile.id)
        .eq('member_type', 'visitor')
        .maybeSingle()

      if (existingVisitor) {
        console.log('create-visitor: Duplicate found:', existingVisitor.member_id)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'You are already registered as a visitor in this region.',
            visitor_id: existingVisitor.member_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }
    }

    // Generate UUID for profile
    const profileId = crypto.randomUUID()
    console.log('create-visitor: Generated profile ID:', profileId)

    // Create profile (not linked to auth user)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: profileId,
        first_name,
        last_name,
        email,
        phone,
        address,
        region_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('create-visitor: Profile creation failed:', profileError)
      throw profileError
    }

    console.log('create-visitor: Profile created successfully')

    // Generate member ID
    const { data: memberId, error: memberIdError } = await supabaseAdmin.rpc(
      'generate_member_id', 
      { _region_id: region_id }
    )

    if (memberIdError || !memberId) {
      console.error('create-visitor: Member ID generation failed:', memberIdError)
      throw new Error('Could not generate visitor ID.')
    }

    console.log('create-visitor: Member ID generated:', memberId)

    // Create visitor member record
    const { data: newVisitor, error: visitorError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: profileId,
        member_id: memberId,
        region_id: region_id,
        member_type: 'visitor',
        status: 'new',
        join_date: new Date().toISOString().split('T')[0],
        rated_event_id: rated_event_id || null,
        event_satisfaction_rating: event_satisfaction_rating || null,
        referral_source: referral_source || null,
        referral_person_name: referral_person_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, profiles(*)')
      .single()

    if (visitorError) {
      console.error('create-visitor: Visitor record creation failed:', visitorError)
      throw visitorError
    }

    console.log('create-visitor: Visitor created successfully:', newVisitor)

    return new Response(
      JSON.stringify({ 
        success: true, 
        visitor: newVisitor,
        visitor_id: memberId,
        message: `Welcome! You have been registered as a visitor with ID ${memberId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('create-visitor: Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})