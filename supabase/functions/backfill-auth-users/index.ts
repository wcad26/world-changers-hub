import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// One-time (idempotent) backfill: every public.profiles row must have a matching
// auth.users row so that user_roles / regional_user_roles FK targets exist and
// people can sign in with the default password "123456".
//
// Only callable by a Principal Super Admin (is_principal_super_admin).

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

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

    // Pull all orphan profiles (no matching auth.users row).
    // Cap at 2000 per run to stay within edge runtime limits.
    const { data: orphans, error: listErr } = await admin
      .rpc('list_orphan_profiles', {})
      .select()
      .returns<Array<{ id: string; email: string; first_name: string | null; last_name: string | null; created_at: string }>>()
      .limit(2000)
      .order('created_at', { ascending: true })

    // Fallback: simple SQL via PostgREST if RPC missing.
    let orphanList = orphans as any[] | null
    if (listErr || !orphanList) {
      const { data: allProfiles } = await admin
        .from('profiles')
        .select('id,email,first_name,last_name,created_at')
        .order('created_at', { ascending: true })
        .limit(5000)
      const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
      // need a more reliable listing — iterate pages
      const authIds = await collectAllAuthUserIds(admin)
      orphanList = (allProfiles ?? []).filter((p: any) => !authIds.has(p.id))
    }

    let created = 0
    let merged = 0
    let skipped = 0
    const errors: Array<{ profile_id: string; email: string; error: string }> = []
    const seenEmail = new Set<string>()

    // Build email → existing auth user map.
    const allAuthByEmail = await collectAuthByEmail(admin)

    for (const p of orphanList ?? []) {
      try {
        const email = (p.email ?? '').trim().toLowerCase()
        if (!email) {
          await logRow(admin, p.id, p.email, 'skip', 'no email')
          skipped++
          continue
        }

        // Case A: email already owned by a different auth user → merge.
        const existingAuthId = allAuthByEmail.get(email)
        if (existingAuthId && existingAuthId !== p.id) {
          // Re-point members.profile_id from orphan → existing auth user.
          const { error: upErr } = await admin
            .from('members')
            .update({ profile_id: existingAuthId })
            .eq('profile_id', p.id)
          if (upErr) throw upErr
          // Delete the orphan profile (no FK collisions since member moved).
          const { error: delErr } = await admin
            .from('profiles')
            .delete()
            .eq('id', p.id)
          if (delErr) throw delErr
          await logRow(admin, p.id, p.email, 'merged', `merged into ${existingAuthId}`)
          merged++
          continue
        }

        // Case B: duplicate email among orphans → rename later duplicates.
        let useEmail = p.email as string
        if (seenEmail.has(email)) {
          const suffix = p.id.slice(0, 8)
          useEmail = p.email.replace(/@/, `+dup-${suffix}@`)
          await admin
            .from('profiles')
            .update({ email: useEmail })
            .eq('id', p.id)
        }
        seenEmail.add(useEmail.toLowerCase())

        // Case C: create auth user preserving id.
        const { error: createErr } = await admin.auth.admin.createUser({
          id: p.id,
          email: useEmail,
          password: '123456',
          email_confirm: true,
          user_metadata: {
            first_name: p.first_name ?? '',
            last_name: p.last_name ?? '',
          },
        } as any)
        if (createErr) throw createErr
        await logRow(admin, p.id, useEmail, 'created', useEmail === p.email ? null : 'email renamed due to duplicate')
        allAuthByEmail.set(useEmail.toLowerCase(), p.id)
        created++
      } catch (e: any) {
        errors.push({ profile_id: p.id, email: p.email, error: e?.message ?? String(e) })
        await logRow(admin, p.id, p.email, 'error', e?.message ?? String(e))
      }
    }

    return json({ ok: true, created, merged, skipped, errors_count: errors.length, errors })
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

async function logRow(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  email: string | null,
  action: string,
  note: string | null,
) {
  await admin.from('backfill_auth_users_report').insert({
    profile_id: profileId,
    email,
    action,
    note,
  })
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
