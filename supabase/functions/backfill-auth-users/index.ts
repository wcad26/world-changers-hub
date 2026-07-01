import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Backfill sign-in accounts for every public.profiles row that has no matching
// auth.users row. Uses the SECURITY DEFINER SQL function
// public.admin_create_auth_user_for_profile so the created auth.users.id
// exactly matches the profile id (which the JS admin SDK does not support).
//
// Only callable by a Principal Super Admin.

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

    const { data: isPrincipal } = await admin.rpc('is_principal_super_admin', {
      _user_id: callerId,
    })
    if (!isPrincipal) return json({ error: 'Forbidden — Principal Super Admin only' }, 403)

    // Load every auth user email (for merge detection).
    const authByEmail = await collectAuthByEmail(admin)
    const authIds = await collectAllAuthUserIds(admin)

    // Load orphan profiles (paginate to avoid the 1000-row limit).
    const orphans: Array<{
      id: string
      email: string | null
      first_name: string | null
      last_name: string | null
    }> = []
    const PAGE = 1000
    let from = 0
    while (true) {
      const { data, error } = await admin
        .from('profiles')
        .select('id,email,first_name,last_name')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      const batch = data ?? []
      for (const p of batch) if (!authIds.has(p.id)) orphans.push(p as any)
      if (batch.length < PAGE) break
      from += PAGE
      if (from > 20000) break
    }

    let created = 0
    let merged = 0
    let skipped = 0
    const errors: Array<{ profile_id: string; email: string | null; error: string }> = []
    const seenEmail = new Set<string>()

    for (const p of orphans) {
      const rawEmail = (p.email ?? '').trim().toLowerCase()
      try {
        // Clear previous error rows for this profile so re-runs are clean.
        await admin.from('backfill_auth_users_report').delete().eq('profile_id', p.id).eq('action', 'error')

        // Case A: another auth user already owns this email → merge.
        const existingAuthId = rawEmail ? authByEmail.get(rawEmail) : undefined
        if (existingAuthId && existingAuthId !== p.id) {
          const { error: upErr } = await admin
            .from('members')
            .update({ profile_id: existingAuthId })
            .eq('profile_id', p.id)
          if (upErr) throw upErr
          const { error: delErr } = await admin.from('profiles').delete().eq('id', p.id)
          if (delErr) throw delErr
          await logRow(admin, p.id, p.email, 'merged', `merged into ${existingAuthId}`)
          merged++
          continue
        }

        // Case B: rename duplicated orphan emails so auth.users unique index holds.
        let useEmail = p.email ?? ''
        if (rawEmail && seenEmail.has(rawEmail)) {
          const suffix = p.id.slice(0, 8)
          useEmail = useEmail.replace(/@/, `+dup-${suffix}@`)
          await admin.from('profiles').update({ email: useEmail }).eq('id', p.id)
        }
        if (rawEmail) seenEmail.add(useEmail.toLowerCase())

        // Case C: create the matching auth.users row via SECURITY DEFINER RPC.
        const { data: newId, error: rpcErr } = await admin.rpc(
          'admin_create_auth_user_for_profile',
          { p_profile_id: p.id, p_email: useEmail || '', p_password: '123456' },
        )
        if (rpcErr) throw rpcErr

        await logRow(admin, p.id, useEmail, 'created', useEmail === p.email ? null : 'email renamed due to duplicate')
        authByEmail.set((useEmail || '').toLowerCase(), newId as string)
        authIds.add(newId as string)
        created++
      } catch (e) {
        const msg = describeError(e)
        errors.push({ profile_id: p.id, email: p.email, error: msg })
        await logRow(admin, p.id, p.email, 'error', msg)
      }
    }

    return json({
      ok: true,
      scanned: orphans.length,
      created,
      merged,
      skipped,
      errors_count: errors.length,
      errors: errors.slice(0, 20),
    })
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
  try {
    return JSON.stringify(e, Object.getOwnPropertyNames(e))
  } catch {
    return String(e)
  }
}

async function logRow(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  email: string | null,
  action: string,
  note: string | null,
) {
  await admin.from('backfill_auth_users_report').insert({ profile_id: profileId, email, action, note })
}

async function collectAllAuthUserIds(admin: ReturnType<typeof createClient>): Promise<Set<string>> {
  const ids = new Set<string>()
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    const users = data?.users ?? []
    if (!users.length) break
    for (const u of users) ids.add(u.id)
    if (users.length < 1000) break
    page++
    if (page > 20) break
  }
  return ids
}

async function collectAuthByEmail(admin: ReturnType<typeof createClient>): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    const users = data?.users ?? []
    if (!users.length) break
    for (const u of users) {
      const e = (u.email ?? '').trim().toLowerCase()
      if (e && !map.has(e)) map.set(e, u.id)
    }
    if (users.length < 1000) break
    page++
    if (page > 20) break
  }
  return map
}
