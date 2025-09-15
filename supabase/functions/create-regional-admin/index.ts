import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateRegionalAdminRequest {
  email: string;
  firstName: string;
  lastName: string;
  regionId: string;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, firstName, lastName, regionId, phone }: CreateRegionalAdminRequest = await req.json();

    console.log('Creating regional admin:', { email, firstName, lastName, regionId });

    // Validate required fields
    if (!email || !firstName || !lastName || !regionId) {
      throw new Error('Missing required fields: email, firstName, lastName, regionId');
    }

    // Validate region exists
    const { data: region, error: regionError } = await supabase
      .from('regions')
      .select('id, name')
      .eq('id', regionId)
      .single();

    if (regionError || !region) {
      throw new Error('Invalid region specified');
    }

    // Check if user already exists with this email
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError);
    }

    const userExists = existingUser?.users?.find(user => user.email === email);
    
    if (userExists) {
      // Check if user already has member record in this region
      const { data: existingMember } = await supabase
        .from('members')
        .select('id, member_id')
        .eq('profile_id', userExists.id)
        .eq('region_id', regionId)
        .single();

      if (existingMember) {
        return new Response(
          JSON.stringify({
            success: false,
            userExists: true,
            message: 'This user already exists as a member in this region. Please assign them regional admin role instead of creating a new account.',
            userId: userExists.id,
            memberId: existingMember.member_id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Generate a temporary password
    const tempPassword = `WCA${Math.random().toString(36).slice(-8)}!`;

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        region_id: regionId,
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    console.log('User created:', authData.user.id);

    // Update profile with additional information
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        region_id: regionId,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log('Profile updated');

    // Assign regional_admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'regional_admin',
        region_id: regionId,
        is_active: true,
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    console.log('Role assigned');

    // Send invitation email with temporary password
    try {
      const { error: emailError } = await supabase.functions.invoke('send-admin-invitation', {
        body: {
          email,
          firstName,
          lastName,
          tempPassword,
          regionName: region.name,
        },
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Don't throw error for email failure - account is still created
      }
    } catch (emailError) {
      console.error('Email function error:', emailError);
      // Don't throw error for email failure - account is still created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Regional administrator account created successfully',
        userId: authData.user.id,
        tempPassword,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-regional-admin function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});