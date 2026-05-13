# Fix DCG portal login instability

## Symptoms

1. On `/dcg-auth`, the page re-renders / "refreshes" every ~2 seconds (dev only), making typing nearly impossible.
2. After a successful sign-in (auth log confirms `login` event at 21:39:35), the user is bounced back to the login screen instead of staying on `/dcg/dashboard`.

## Root causes (from code reading)

- **Shared Supabase storage key** (`wca-auth`) is used by every portal. When the DCG `AuthProvider` mounts on `/dcg/dashboard`, its custom `waitForSession` loop (`getSession` × 8 with 150ms gaps) races against any other Supabase activity. In dev with HMR re-mounting providers, this loop runs repeatedly and re-fires queries/state, which presents as the page "refreshing".
- **`AuthProvider` does not subscribe to `onAuthStateChange`**. After login, the navigation to `/dcg/dashboard` happens before Supabase has finished writing the session to `localStorage`. The provider's polling sometimes returns `null`, so `user` stays `null`, hooks throw under RLS, and the UI looks "logged out".
- **`DcgAuth` does no readiness check** — it calls `signInWithPassword` and immediately `navigate()`s, so the dashboard mounts with a half-hydrated session.
- **Dev HMR amplifies the race**: every saved file remounts `AuthProvider`, restarting the 1.2s wait loop and re-running data fetches. This is why the bug only happens in dev.

## Plan

Rebuild the DCG auth path the same way the regional portal was rebuilt: a tiny bootstrap record + a deterministic, listener-based provider. No polling, no `getSession` retry loops, no shared races.

### 1. New `src/lib/dcgBootstrap.ts`
Mirror `regionalBootstrap.ts`. Stores `{ userId }` in `sessionStorage` (key `wca-dcg-bootstrap`) the moment login succeeds. Exposes `read`, `write`, `clear`.

### 2. Rewrite `src/contexts/AuthContext.tsx` (DCG/Super/Member share it)
- Remove the `waitForSession` 8-iteration polling loop.
- On mount: call `supabase.auth.getSession()` **once**, then subscribe to `onAuthStateChange`.
- Treat `SIGNED_IN` / `TOKEN_REFRESHED` / `INITIAL_SESSION` uniformly: set user, fetch profile data **once per userId** (guarded by `fetchedForUserRef`), never re-fetch on token refresh.
- Treat `SIGNED_OUT` as: clear state, do not auto-navigate (caller decides).
- Keep `signOut({ scope: 'local' })` so other portals/tabs are not affected.
- No data fetched inside the listener callback synchronously — defer with `queueMicrotask` to avoid Supabase deadlock.

### 3. Rewrite `src/pages/DcgAuth.tsx`
- After `signInWithPassword` resolves successfully:
  1. Write DCG bootstrap (`{ userId }`).
  2. Use `window.location.assign('/dcg/dashboard')` (hard navigation) so the dashboard mounts with the session already persisted in `localStorage`. This eliminates the race entirely — no more polling needed.
- Show a single inline error on failure; do not toast.

### 4. New `src/components/auth/DcgSessionRoute.tsx`
Currently a pass-through. Replace with a real guard:
- If `authReady` is `true` and `user` is `null` → `<Navigate to="/dcg-auth" replace />`.
- While `authReady` is `false` → render a tiny centered spinner (no full-screen flash).
- Otherwise render `children`.
This stops the "blank dashboard with errors" state and gives the user a clear redirect.

### 5. Convert all DCG data hooks to gated queries
In `useDcgMembers`, `useDcgEvents`, `useDcgAttendance*`, `useDcgFinancials`, `useFinancialTransactions`:
- Add `enabled: authReady && !!user && !!userDcg?.id` to every `useQuery`.
- This prevents the dashboard from firing 6+ unauthenticated requests in the brief window before the session lands, which is what currently triggers the cascading re-renders observed in dev.

### 6. Logout flow
- `DcgAdminLayout.handleSignOut`: `await signOut()` then `window.location.assign('/dcg-auth')`. Hard-redirect so React Query and all DCG hooks tear down cleanly (same pattern just applied to regional portal).

### 7. Verify the "every 2 s re-render" goes away
After the changes, check the preview console. The 2 s cadence should disappear because the provider no longer remounts/re-polls. If a residual cadence remains it is HMR file-watch noise unrelated to auth and will not affect typing once the provider is stable.

## Out of scope

- No DB migrations.
- No changes to Regional, Super, or Member portals beyond the shared `AuthContext` rewrite (which becomes simpler and strictly more correct for them too).
- No changes to RLS or business logic.

## Files

- **New**: `src/lib/dcgBootstrap.ts`
- **Rewrite**: `src/contexts/AuthContext.tsx`, `src/pages/DcgAuth.tsx`, `src/components/auth/DcgSessionRoute.tsx`
- **Edit**: `src/components/admin/DcgAdminLayout.tsx`, `src/hooks/useDcgMembers.ts`, `src/hooks/useDcgEvents.ts`, `src/hooks/useDcgAttendance.ts`, `src/hooks/useDcgFinancials.ts`, `src/hooks/useFinancials.ts`
