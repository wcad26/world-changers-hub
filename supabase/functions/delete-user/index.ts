import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the requesting user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get request body
    const { user_id: targetUserId } = await req.json();

    if (!targetUserId) {
      throw new Error('user_id is required');
    }

    console.log('Delete user request:', { requestingUser: user.id, targetUser: targetUserId });

    // Check if requesting user has regional_admin or super_admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role, region_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['regional_admin', 'super_admin']);

    if (!roles || roles.length === 0) {
      throw new Error('Insufficient permissions');
    }

    const isSuperAdmin = roles.some(r => r.role === 'super_admin');

    // If not super admin, verify the target user is in the same region
    if (!isSuperAdmin) {
      const requestingUserRegion = roles.find(r => r.role === 'regional_admin')?.region_id;
      
      const { data: targetProfile } = await supabaseClient
        .from('profiles')
        .select('region_id')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile || targetProfile.region_id !== requestingUserRegion) {
        throw new Error('Cannot delete users from other regions');
      }
    }

    // Delete the user from auth.users (this will cascade to profiles and members)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('User deleted successfully:', targetUserId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to delete user' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
