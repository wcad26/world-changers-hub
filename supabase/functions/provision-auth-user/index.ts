import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Provision a single auth.users row for a profile that doesn't have one,
// preserving the profile id (so all existing FK targets keep working).
// Uses the SECURITY DEFINER SQL function admin_create_auth_user_for_profile.
//
// Callable by any super admin or regional admin.

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

    const { data: isSuper } = await admin.rpc('is_super_admin_user', { _user_id: callerId })
    let allowed = !!isSuper
    if (!allowed) {
      const { data: roles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', callerId)
        .eq('is_active', true)
      allowed = (roles ?? []).some(
        (r: any) => r.role === 'regional_admin' || r.role === 'super_admin',
      )
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

    let useEmail: string = (profile.email ?? '').trim()
    if (!useEmail) {
      useEmail = `user+${profile.id}@placeholder.wcaglobal.org`
      await admin.from('profiles').update({ email: useEmail }).eq('id', profile.id)
    }

    const { data: newId, error: rpcErr } = await admin.rpc(
      'admin_create_auth_user_for_profile',
      { p_profile_id: profile.id, p_email: useEmail, p_password: '123456' },
    )
    if (rpcErr) {
      const msg = describeError(rpcErr)
      await admin.from('backfill_auth_users_report').insert({
        profile_id: profile.id,
        email: useEmail,
        action: 'error',
        note: `single-provision: ${msg}`,
      })
      return json({ error: msg }, 400)
    }

    await admin.from('backfill_auth_users_report').insert({
      profile_id: profile.id,
      email: useEmail,
      action: 'provisioned',
      note: 'single-user provision from role dialog',
    })

    return json({ ok: true, user_id: newId, email: useEmail })
  } catch (e) {
    return json({ ok: false, error: describeError(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function describeError(e: any): string {
  if (!e) return 'unknown error'
  if (typeof e === 'string') return e
  const parts = [e.message, e.details, e.hint, e.code].filter(Boolean)
  if (parts.length) return parts.join(' | ')
  try { return JSON.stringify(e, Object.getOwnPropertyNames(e)) } catch { return String(e) }
}
