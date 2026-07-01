// Shared helper: guarantee an auth.users row exists so a public.profiles
// row can be created (the profiles_require_auth_user trigger rejects any
// insert whose id has no matching auth.users row).
//
// Strategy — prefer the SQL function admin_create_auth_user_for_profile
// (SECURITY DEFINER) which lets us pin the auth.users.id to a specific
// value. This avoids the GoTrue admin.createUser flow, which:
//   - assigns a random id (so it can't be attached to an existing profile),
//   - fails silently on profile-email collisions (leaves orphans).
//
// Order of resolution:
//   1) If email provided and an auth user with that email exists → reuse.
//   2) If email provided and a public.profiles row with that email exists
//      but has no auth row → provision auth with the profile's id.
//   3) Otherwise mint a fresh uuid and provision both.
//
// Public shape kept stable: { id, email, created }.

export interface EnsureAuthUserArgs {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password?: string;
  metadata?: Record<string, unknown>;
}

export interface EnsureAuthUserResult {
  id: string;
  email: string;
  created: boolean;
}

export async function ensureAuthUser(
  admin: any,
  args: EnsureAuthUserArgs,
): Promise<EnsureAuthUserResult> {
  const rawEmail = (args.email ?? "").trim().toLowerCase();
  const password = args.password ?? "123456";

  // 1) Reuse an existing auth user by email.
  if (rawEmail) {
    try {
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) break;
        const users = data?.users ?? [];
        const hit = users.find((u: any) => (u.email ?? "").toLowerCase() === rawEmail);
        if (hit) return { id: hit.id, email: hit.email ?? rawEmail, created: false };
        if (users.length < 1000) break;
      }
    } catch (e) {
      console.error("ensureAuthUser: listUsers failed", e);
    }

    // 2) Orphan profile with this email? Provision auth using its id.
    const { data: existingProfile, error: profErr } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", rawEmail)
      .maybeSingle();
    if (profErr) console.error("ensureAuthUser: profile lookup failed", profErr);

    if (existingProfile?.id) {
      const { data: rpcId, error: rpcErr } = await admin.rpc(
        "admin_create_auth_user_for_profile",
        { p_profile_id: existingProfile.id, p_email: rawEmail, p_password: password },
      );
      if (rpcErr) {
        console.error("ensureAuthUser: rpc provision failed for existing profile", rpcErr);
        throw new Error(`Could not provision auth account: ${rpcErr.message}`);
      }
      return { id: (rpcId as string) ?? existingProfile.id, email: rawEmail, created: true };
    }
  }

  // 3) Fresh account: mint an id and provision via the SQL function.
  const newId = crypto.randomUUID();
  const useEmail = rawEmail || `visitor+${newId}@placeholder.wcaglobal.org`;
  const { data: rpcId, error: rpcErr } = await admin.rpc(
    "admin_create_auth_user_for_profile",
    { p_profile_id: newId, p_email: useEmail, p_password: password },
  );
  if (rpcErr) {
    console.error("ensureAuthUser: rpc provision failed for new id", rpcErr);
    throw new Error(`Could not provision auth account: ${rpcErr.message}`);
  }
  // handle_new_user seeds the profile via ON CONFLICT DO UPDATE. Backfill
  // metadata so first/last name land on the profile even for fresh accounts.
  if (args.firstName || args.lastName) {
    await admin.from("profiles").upsert(
      {
        id: (rpcId as string) ?? newId,
        first_name: args.firstName ?? null,
        last_name: args.lastName ?? null,
        email: useEmail,
      },
      { onConflict: "id" },
    );
  }
  return { id: (rpcId as string) ?? newId, email: useEmail, created: true };
}
