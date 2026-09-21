import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const targetUserId: string | undefined = body?.user_id;
    if (!targetUserId) throw new Error('user_id is required');

    if (targetUserId === user.id) {
      throw new Error('You cannot delete your own account');
    }

    console.log('Delete user request:', { requestingUser: user.id, targetUser: targetUserId });

    // ---- Authorization -------------------------------------------------
    // Super admins can delete anyone. Regional admins (legacy user_roles row
    // OR the newer regional_user_roles access management) can delete people
    // inside their own region.
    const [{ data: legacyRoles }, { data: superRoles }, { data: regionalAccess }] = await Promise.all([
      admin.from('user_roles')
        .select('role, region_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('role', ['regional_admin', 'super_admin']),
      admin.from('super_admin_user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true),
      admin.from('regional_user_roles')
        .select('region_id, regional_roles ( permissions )')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]);

    const isSuperAdmin =
      (superRoles?.length ?? 0) > 0 ||
      (legacyRoles ?? []).some((r) => r.role === 'super_admin');

    // Regions where the requester may manage members
    const adminRegions = new Set<string>();
    for (const r of legacyRoles ?? []) {
      if (r.role === 'regional_admin' && r.region_id) adminRegions.add(r.region_id);
    }
    for (const r of (regionalAccess ?? []) as any[]) {
      const perms: string[] = r.regional_roles?.permissions ?? [];
      const canManage =
        perms.includes('*') || perms.includes('members_edit') || perms.includes('access_management');
      if (canManage && r.region_id) adminRegions.add(r.region_id);
    }

    if (!isSuperAdmin && adminRegions.size === 0) {
      throw new Error('Insufficient permissions');
    }

    // ---- Resolve the target profile / members --------------------------
    const { data: targetProfile } = await admin
      .from('profiles')
      .select('id, region_id')
      .eq('id', targetUserId)
      .maybeSingle();

    const { data: targetMembers } = await admin
      .from('members')
      .select('id, region_id')
      .eq('profile_id', targetUserId);

    if (!isSuperAdmin) {
      const regions = new Set<string>();
      if (targetProfile?.region_id) regions.add(targetProfile.region_id);
      for (const m of targetMembers ?? []) if (m.region_id) regions.add(m.region_id);

      const allowed = [...regions].some((r) => adminRegions.has(r));
      if (!allowed) throw new Error('Cannot delete users from other regions');
    }

    // ---- Detach references that would block deletion -------------------
    const memberIds = (targetMembers ?? []).map((m) => m.id);
    if (memberIds.length > 0) {
      await admin.from('dcgs').update({ leader_id: null }).in('leader_id', memberIds);
    }

    // Roles / access rows
    await admin.from('user_roles').delete().eq('user_id', targetUserId);
    await admin.from('regional_user_roles').delete().eq('user_id', targetUserId);
    await admin.from('super_admin_user_roles').delete().eq('user_id', targetUserId);
    await admin.from('dcg_user_sessions').delete().eq('user_id', targetUserId);

    // Member rows (cascades to attendance, relationships, DCG membership, ...)
    if (memberIds.length > 0) {
      const { error: memberError } = await admin.from('members').delete().in('id', memberIds);
      if (memberError) {
        console.error('Error deleting member records:', memberError);
        throw new Error(`Failed to delete member records: ${memberError.message}`);
      }
    }

    // Profile row (there is no cascade from auth.users, so delete it here)
    if (targetProfile) {
      const { error: profileError } = await admin.from('profiles').delete().eq('id', targetUserId);
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }
    }

    // Auth account (may legitimately not exist)
    const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
    if (deleteError && (deleteError as any).status !== 404) {
      console.error('Error deleting auth user:', deleteError);
      throw deleteError;
    }

    console.log('User deleted successfully:', targetUserId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Failed to delete user' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
