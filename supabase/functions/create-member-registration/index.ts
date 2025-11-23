import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('create-member-registration: Function invoked')
    
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
      date_of_birth,
      gender,
      occupation,
      emergency_contact_name,
      emergency_contact_phone,
      is_baptized,
      baptism_date,
      ministry_interests,
      skills_talents,
      dcg_id,
      region_id
    } = await req.json()

    console.log('create-member-registration: Received data for', email)

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !address || !region_id) {
      throw new Error('All fields are required: first name, last name, email, phone, address, and region.')
    }

    // Check for existing user with same email
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.some(user => user.email === email)

    if (userExists) {
      console.log('create-member-registration: User already exists:', email)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'An account with this email already exists. Please contact your regional admin if you need assistance.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Check for existing profile with same email in same region
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('region_id', region_id)
      .maybeSingle()

    if (existingProfile) {
      console.log('create-member-registration: Email already registered in this region')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You are already registered in this region. Please contact your regional admin for assistance.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Create authenticated user account with default password
    const defaultPassword = '123456'
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        region_id
      }
    })

    if (authError || !authUser.user) {
      console.error('create-member-registration: User creation failed:', authError)
      throw new Error('Failed to create user account')
    }

    console.log('create-member-registration: User created:', authUser.user.id)

    // Update profile with all information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone,
        address,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        occupation: occupation || null,
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('create-member-registration: Profile update failed:', profileError)
      // Continue anyway, user is created
    }

    console.log('create-member-registration: Profile updated successfully')

    // Generate member ID
    const { data: memberId, error: memberIdError } = await supabaseAdmin.rpc(
      'generate_member_id', 
      { _region_id: region_id }
    )

    if (memberIdError || !memberId) {
      console.error('create-member-registration: Member ID generation failed:', memberIdError)
      throw new Error('Could not generate member ID.')
    }

    console.log('create-member-registration: Member ID generated:', memberId)

    // Prepare skills and interests arrays
    const skillsArray = skills_talents ? [skills_talents] : null
    const ministryArray = ministry_interests && ministry_interests.length > 0 ? ministry_interests : null

    // Create member record
    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: authUser.user.id,
        member_id: memberId,
        region_id: region_id,
        member_type: 'member',
        status: 'new',
        join_date: new Date().toISOString().split('T')[0],
        baptism_date: (is_baptized && baptism_date) ? baptism_date : null,
        skills_talents: skillsArray,
        preferred_service_areas: ministryArray,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, profiles(*)')
      .single()

    if (memberError) {
      console.error('create-member-registration: Member record creation failed:', memberError)
      throw memberError
    }

    console.log('create-member-registration: Member created successfully:', newMember)

    // Assign member role in user_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'member',
        region_id: region_id,
        is_active: true,
        status: 'active',
        assigned_at: new Date().toISOString()
      })

    if (roleError) {
      console.error('create-member-registration: Role assignment failed:', roleError)
      // Don't fail registration, continue
    } else {
      console.log('create-member-registration: Member role assigned successfully')
    }

    // Add to DCG if selected
    let dcgAdded = false
    if (dcg_id) {
      try {
        console.log('create-member-registration: Adding member to DCG:', dcg_id)
        
        const { error: dcgMemberError } = await supabaseAdmin
          .from('dcg_members')
          .insert({
            dcg_id: dcg_id,
            member_id: newMember.id,
            role: 'Member',
            is_active: true,
            joined_date: new Date().toISOString().split('T')[0]
          })

        if (dcgMemberError) {
          console.error('create-member-registration: DCG membership failed:', dcgMemberError)
        } else {
          dcgAdded = true
          console.log('create-member-registration: Member added to DCG successfully')
        }
      } catch (dcgError) {
        console.error('create-member-registration: Non-fatal DCG error:', dcgError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: newMember,
        member_id: memberId,
        message: `Welcome! You have been registered as a member with ID ${memberId}. Your login credentials are:\n\nEmail: ${email}\nPassword: 123456\n\nPlease change your password after your first login.`,
        dcg_added: dcgAdded,
        login_email: email,
        default_password: defaultPassword
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('create-member-registration: Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
