# Fix Regional Portal Logout

## Problem

When clicking **Logout** in the regional portal:

1. `signOut()` in `RegionalSessionContext` clears the user, region, bootstrap and Supabase session — but **never navigates away**.
2. The Regional Dashboard stays mounted with `user = null` and `region = null`. Its data hooks immediately re-fire without a session and fail with `TypeError: Failed to fetch` (visible in console as `[RegionalSession] region load error: Failed to fetch`).
3. The dashboard shows the "We could not resolve your region yet" diagnostic panel as if logout failed, even though the Supabase session was actually cleared.

So the logout *did* succeed at the auth layer — it just looks broken because the page never leaves the dashboard.

## Fix

Make logout always end on the regional login page, with a fully reset app state.

### Changes

1. **`src/contexts/RegionalSessionContext.tsx`** — at the end of `signOut()`, after clearing local state and calling `supabase.auth.signOut`, do a hard redirect:
   ```ts
   window.location.replace('/auth/regional');
   ```
   A hard redirect (instead of `navigate`) guarantees:
   - All in-flight React Query requests are aborted.
   - Every cached hook/provider is torn down.
   - The dashboard cannot re-render with `user = null` and trigger the "Failed to fetch" error.

2. **`src/components/admin/RegionalAdminShell.tsx`** (desktop + mobile logout buttons) and **`src/pages/admin/regional/Dashboard.tsx`** (the diagnostic panel's Logout button) — wrap `signOut` so it always awaits, and fall back to `window.location.replace('/auth/regional')` if `signOut` throws. This guarantees the user is taken to the login page even on transient network errors.

3. **Suppress the misleading error**: in `RegionalSessionContext`, ignore "Failed to fetch" errors that occur after `signingOutRef.current === true` so the console no longer reports a region-load failure caused by the logout itself.

### Out of scope

- No database / RLS changes.
- No changes to other portals (Super Admin, DCG, Member).
- No changes to the login flow or bootstrap mechanism.

## Verification

After approval and implementation:
1. Log in to the regional portal.
2. Click **Logout** (sidebar, mobile sheet, and dashboard diagnostic panel).
3. Expect: immediate redirect to `/auth/regional`, no error toast, no "Failed to fetch" in console attributable to the logout.
