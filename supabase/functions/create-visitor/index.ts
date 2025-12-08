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
      date_of_birth,
      gender,
      occupation,
      emergency_contact_name,
      emergency_contact_phone,
      region_id,
      rated_event_id,
      event_satisfaction_rating,
      referral_source,
      referral_person_name,
      referral_other_details
    } = await req.json()

    console.log('create-visitor: Received data for', email)

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !address || !region_id) {
      throw new Error('All fields are required: first name, last name, email, phone, address, and region.')
    }

    // Check for existing profile with same email in same region
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('region_id', region_id)
      .maybeSingle()

    if (existingProfile) {
      // Check if this profile has ANY member record (visitor OR member)
      const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id, member_id, member_type')
        .eq('profile_id', existingProfile.id)
        .maybeSingle()

      if (existingMember) {
        const isVisitor = existingMember.member_type === 'visitor'
        console.log('create-visitor: Duplicate found:', existingMember.member_id, 'type:', existingMember.member_type)
        return new Response(
          JSON.stringify({ 
            success: true,
            is_duplicate: true,
            is_visitor: isVisitor,
            message: isVisitor 
              ? 'You are already registered as a visitor in this region.'
              : 'You are already registered as a member in this region.',
            visitor_id: existingMember.member_id,
            member_type: existingMember.member_type
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
        date_of_birth: date_of_birth || null,
        gender: gender ? gender.toLowerCase() : null,
        occupation: occupation || null,
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
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
        referral_other_details: referral_other_details || null,
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

    // Automatically create attendance record if visitor attended an event
    if (rated_event_id) {
      try {
        console.log('create-visitor: Creating attendance record for event:', rated_event_id)
        
        // 1. Get the event details
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .select('name, start_datetime, region_id')
          .eq('id', rated_event_id)
          .single()
        
        if (eventError) {
          console.error('create-visitor: Failed to fetch event:', eventError)
        } else if (event) {
          console.log('create-visitor: Event found:', event.name)
          const eventDate = new Date(event.start_datetime).toISOString().split('T')[0]
          
          // 2. Check for existing attendance_event by source_event_id (most reliable)
          let { data: attendanceEvent, error: attendanceEventFetchError } = await supabaseAdmin
            .from('attendance_events')
            .select('id')
            .eq('source_event_id', rated_event_id)
            .eq('region_id', event.region_id)
            .maybeSingle()
          
          if (attendanceEventFetchError) {
            console.error('create-visitor: Error checking for attendance event:', attendanceEventFetchError)
          }
          
          // 3. Create attendance_event if it doesn't exist
          if (!attendanceEvent) {
            console.log('create-visitor: Creating new attendance event')
            const { data: newAttendanceEvent, error: createAttendanceEventError } = await supabaseAdmin
              .from('attendance_events')
              .insert({
                name: `Attendance - ${event.name}`,
                event_date: eventDate,
                region_id: event.region_id,
                description: `Attendance tracking for ${event.name}`,
                source_event_id: rated_event_id
              })
              .select('id')
              .single()
            
            if (createAttendanceEventError) {
              console.error('create-visitor: Failed to create attendance event:', createAttendanceEventError)
            } else {
              attendanceEvent = newAttendanceEvent
              console.log('create-visitor: Attendance event created:', attendanceEvent.id)
            }
          } else {
            console.log('create-visitor: Using existing attendance event:', attendanceEvent.id)
          }
          
          // 4. Create attendance record for visitor
          if (attendanceEvent) {
            const { error: attendanceRecordError } = await supabaseAdmin
              .from('attendance_records')
              .insert({
                event_id: attendanceEvent.id,
                member_id: newVisitor.id,
                is_present: true,
                recorded_at: new Date().toISOString()
              })
            
            if (attendanceRecordError) {
              console.error('create-visitor: Failed to create attendance record:', attendanceRecordError)
            } else {
              console.log('create-visitor: Attendance record created successfully for visitor')
            }
          }
        }
      } catch (attendanceError) {
        // Don't fail visitor registration if attendance tracking fails
        console.error('create-visitor: Non-fatal error in attendance tracking:', attendanceError)
      }
    }

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