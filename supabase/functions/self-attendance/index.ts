import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id, email } = await req.json();

    // Validate inputs
    if (!event_id || typeof event_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Create service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verify the event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, start_datetime, region_id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Look up profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', trimmedEmail)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ 
        error: 'No registered member or visitor found with this email. You must be onboarded at a regional level first.' 
      }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Find member record linked to this profile
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, member_id, member_type, region_id')
      .eq('profile_id', profile.id)
      .limit(1)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ 
        error: 'No member or visitor record found for this email. Please register at your regional branch first.' 
      }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Find or create attendance_event linked to this source event
    let attendanceEventId: string;

    const { data: existingAe } = await supabaseAdmin
      .from('attendance_events')
      .select('id')
      .eq('source_event_id', event_id)
      .limit(1)
      .maybeSingle();

    if (existingAe) {
      attendanceEventId = existingAe.id;
    } else {
      const { data: newAe, error: aeError } = await supabaseAdmin
        .from('attendance_events')
        .insert({
          name: `Attendance - ${event.name}`,
          event_date: new Date(event.start_datetime).toISOString().split('T')[0],
          region_id: event.region_id, // Can be null for global events
          source_event_id: event_id,
          description: `Self-service attendance for ${event.name}`,
        })
        .select('id')
        .single();

      if (aeError || !newAe) {
        console.error('Error creating attendance event:', aeError);
        return new Response(JSON.stringify({ error: 'Failed to create attendance record. Please try again.' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      attendanceEventId = newAe.id;
    }

    // 5. Check for duplicate attendance
    const { data: existingRecord } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('event_id', attendanceEventId)
      .eq('member_id', member.id)
      .maybeSingle();

    if (existingRecord) {
      return new Response(JSON.stringify({ 
        message: `Your attendance has already been recorded, ${profile.first_name || 'member'}!` 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Create attendance record
    const { error: recordError } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        event_id: attendanceEventId,
        member_id: member.id,
        is_present: true,
      });

    if (recordError) {
      console.error('Error creating attendance record:', recordError);
      return new Response(JSON.stringify({ error: 'Failed to record attendance. Please try again.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const memberName = profile.first_name ? `${profile.first_name}` : 'member';
    return new Response(JSON.stringify({ 
      success: true,
      message: `Thank you ${memberName}! Your attendance for "${event.name}" has been recorded successfully.` 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Self-attendance error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
