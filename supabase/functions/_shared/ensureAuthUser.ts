// Shared helper: guarantee an auth.users row exists for a profile before
// inserting into public.profiles. The profiles_require_auth_user trigger
// rejects any profile insert whose id has no matching auth.users row.
//
// Usage:
//   const { id, email } = await ensureAuthUser(admin, {
//     email: "someone@example.com",
//     firstName: "Ada", lastName: "Lovelace",
//   });
//   await admin.from("profiles").insert({ id, email, ... });
//
// - Reuses an existing auth user when the email is already taken.
// - Falls back to a placeholder email when none is provided so the auth
//   account can still be created (e.g. anonymous walk-in visitors).
// - Default password is "123456" (project convention) with email confirmed
//   so the user can sign in immediately.

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
  const metadata = {
    first_name: args.firstName ?? "",
    last_name: args.lastName ?? "",
    ...(args.metadata ?? {}),
  };

  // 1) Reuse existing auth user by email when possible.
  if (rawEmail) {
    // Paginate defensively in case of large user tables.
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      const users = data?.users ?? [];
      const hit = users.find((u: any) => (u.email ?? "").toLowerCase() === rawEmail);
      if (hit) return { id: hit.id, email: hit.email ?? rawEmail, created: false };
      if (users.length < 1000) break;
    }
  }

  // 2) Create a new auth user. Use a placeholder email if none provided.
  const useEmail = rawEmail || `visitor+${crypto.randomUUID()}@placeholder.wcaglobal.org`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: useEmail,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (createErr || !created?.user) {
    throw new Error(`Could not provision auth account: ${createErr?.message ?? "unknown error"}`);
  }
  return { id: created.user.id, email: created.user.email ?? useEmail, created: true };
}
