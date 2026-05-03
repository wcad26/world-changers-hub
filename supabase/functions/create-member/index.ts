
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('create-member: Function invoked')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { record } = await req.json()
    console.log('create-member: Received record:', record)
    
    const { 
      email, 
      first_name, 
      last_name, 
      phone, 
      address, 
      date_of_birth, 
      gender, 
      occupation,
      region_id 
    } = record

    // Validate required fields
    if (!email || !first_name || !last_name || !region_id) {
      console.error('create-member: Missing required fields')
      throw new Error('Email, first name, last name, and region ID are required.')
    }

    console.log('create-member: Starting user invitation...')
    
    // 1. Create user with default password - no email invitation required
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: '123456',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name,
        last_name,
      },
    })

    if (createError) {
      console.error('create-member: User creation failed:', createError)
      throw createError
    }
    
    if (!user) {
      console.error('create-member: No user data received after invitation')
      throw new Error('User could not be created.')
    }

    console.log('create-member: User created successfully:', user.id)

    // 2. Update the profile with complete information including region_id
    console.log('create-member: Updating profile with complete data...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email: email,
        first_name,
        last_name,
        phone: phone || null,
        address: address || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        occupation: occupation || null,
        region_id: region_id, // This is crucial - ensure profile has region_id
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('create-member: Profile update failed:', profileError)
      // Don't throw here, but log the error
      console.error('create-member: Continuing despite profile update error')
    } else {
      console.log('create-member: Profile updated successfully')
    }

    // 3. Generate member ID
    console.log('create-member: Generating member ID...')
    const { data: memberId, error: memberIdError } = await supabaseAdmin.rpc('generate_member_id', {
      _region_id: region_id,
    })

    if (memberIdError) {
      console.error('create-member: Member ID generation failed:', memberIdError)
      throw memberIdError
    }
    
    if (!memberId) {
      console.error('create-member: No member ID generated')
      throw new Error('Could not generate member ID.')
    }

    console.log('create-member: Member ID generated:', memberId)

    // 4. Create the member record
    console.log('create-member: Creating member record...')
    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: user.id,
        region_id: region_id,
        member_id: memberId,
        status: 'new',
        join_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, profiles(*)')
      .single()

    if (memberError) {
      console.error('create-member: Member creation failed:', memberError)
      throw memberError
    }

    console.log('create-member: Member created successfully:', newMember)

    // 5. Assign member role to the user
    console.log('create-member: Assigning member role...')
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'member',
        region_id: region_id,
        is_active: true,
        assigned_at: new Date().toISOString()
      })

    if (roleError) {
      console.error('create-member: Role assignment failed:', roleError)
      // Don't throw here, just log the error as member is already created
      console.error('create-member: Member created but role assignment failed')
    } else {
      console.log('create-member: Member role assigned successfully')
    }

    console.log('create-member: Process completed successfully')
    
    return new Response(JSON.stringify({ 
      success: true,
      member: newMember,
      message: `Member ${first_name} ${last_name} created successfully with ID ${memberId}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('create-member: Fatal error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
