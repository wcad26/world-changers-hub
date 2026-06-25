import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Single-profile version of backfill-auth-users.
// Called inline from role-assignment dialogs when an admin tries to assign a
// role to a user that has no auth account yet.
//
// Caller must be an authenticated admin (super admin OR regional admin).
// Returns the auth user id (== profile id) on success.

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: claims, error: claimsErr } = await caller.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    )
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
    const callerId = claims.claims.sub as string

    // Caller must be either super admin OR have any regional admin role.
    const { data: isSuper } = await admin.rpc('is_super_admin_user', { _user_id: callerId })
    let allowed = !!isSuper
    if (!allowed) {
      const { data: roles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', callerId)
        .eq('is_active', true)
      allowed = (roles ?? []).some((r: any) => r.role === 'regional_admin' || r.role === 'super_admin')
    }
    if (!allowed) return json({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => ({}))
    const profileId = body?.profile_id as string | undefined
    if (!profileId) return json({ error: 'profile_id is required' }, 400)

    // Already has an auth row?
    const { data: existing } = await admin.auth.admin.getUserById(profileId)
    if (existing?.user) return json({ ok: true, user_id: existing.user.id, already_existed: true })

    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('id,email,first_name,last_name')
      .eq('id', profileId)
      .maybeSingle()
    if (pErr || !profile) return json({ error: 'Profile not found' }, 404)

    let useEmail: string = profile.email ?? ''
    if (!useEmail) return json({ error: 'Profile has no email' }, 400)

    // If email already taken by a different auth user, append +dup suffix.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const taken = (list?.users ?? []).find(
      (u) => (u.email ?? '').toLowerCase() === useEmail.toLowerCase(),
    )
    if (taken) {
      const suffix = profile.id.slice(0, 8)
      useEmail = useEmail.replace(/@/, `+dup-${suffix}@`)
      await admin.from('profiles').update({ email: useEmail }).eq('id', profile.id)
    }

    const { error: createErr } = await admin.auth.admin.createUser({
      id: profile.id,
      email: useEmail,
      password: '123456',
      email_confirm: true,
      user_metadata: {
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
      },
    } as any)
    if (createErr) return json({ error: createErr.message }, 400)

    await admin.from('backfill_auth_users_report').insert({
      profile_id: profile.id,
      email: useEmail,
      action: 'provisioned',
      note: 'single-user provision from role dialog',
    })

    return json({ ok: true, user_id: profile.id, email: useEmail })
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
