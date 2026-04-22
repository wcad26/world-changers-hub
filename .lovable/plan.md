

## Why the page keeps reloading and sign-out re-signs in

The console proves it:

```
useAuth: Setting up auth state listener...   ← instance A
useAuth: Setting up auth state listener...   ← instance B
useAuth: Fetching user data for: ec363...    ← A
useAuth: Fetching user data for: ec363...    ← B
useAuth: Fetching user data for: ec363...    ← C  (3 fetches per event!)
```

`useAuth` is a plain hook, not a context. Every component that imports it (`PortalSelector`, `DcgAuth`, layouts, route guards, sidebars, dashboards…) **creates its own Supabase auth listener and its own user-data fetch pipeline**. That single design flaw causes both bugs:

1. **Endless reload feel** — N listeners × every auth event = N re-fetches and N state churns. Any navigation mounts new `useAuth` instances, each one re-subscribes, each subscription fires `INITIAL_SESSION` immediately, each one re-fetches profile/roles/region/member/dcg/regional-roles. Components depending on those values re-render in a cascade. This is the "loading and reloading" the user sees.
2. **Sign out re-signs in** — `signOut()` is invoked on instance X. `SIGNED_OUT` fans out to every instance, each clears its own local state and toasts/navigates. But because navigating to `/dcg-auth` mounts a **fresh** `useAuth`, that fresh instance's `getInitialSession()` reads the Supabase session from local storage *before* the global sign-out has fully cleared it (race), sees a user, sets `user`, the `DcgAuth` effect detects `user` and routes back into the portal. Net effect: signed back in.

The previously approved "stabilise the redirect effect / memoise helpers" patch reduces a fraction of the churn but cannot fix this — the root cause is having many independent auth subscriptions.

## Fix: one shared auth context, one listener, one fetch

Convert `useAuth` from a hook into a React Context provider so the entire app shares **one** auth state machine.

### 1. New `src/contexts/AuthContext.tsx`
- Move all current logic from `src/hooks/useAuth.tsx` into an `AuthProvider` component:
  - One `onAuthStateChange` subscription, lifetime = app lifetime.
  - One `getSession()` initial probe.
  - One `fetchUserData()` pipeline keyed by user id; if the same id is requested while a fetch is in flight, dedupe.
  - All helpers (`hasRole`, `hasAnyRole`, `canAccessPortal`, `getAvailablePortals`, `hasRegionalPermission`, `signOut`, etc.) wrapped in `useCallback`/`useMemo` with stable deps so consumers don't re-render needlessly.
- Export a `useAuth()` hook that just calls `useContext(AuthContext)` and throws if used outside the provider.

### 2. `src/App.tsx`
- Wrap the app inside `<BrowserRouter>` with `<AuthProvider>`. Order: `QueryClientProvider → TooltipProvider → BrowserRouter → AuthProvider → Routes`. (AuthProvider must be inside BrowserRouter because `signOut` uses `useNavigate`/`useLocation`.)

### 3. `src/hooks/useAuth.tsx`
- Reduce to a thin re-export: `export { useAuth } from '@/contexts/AuthContext'` so existing imports across the codebase continue to work without edits.

### 4. Hard-stop the sign-out → re-sign-in race
Inside the new provider's `signOut`:
- Set a module-level `isSigningOut = true` flag immediately.
- Call `supabase.auth.signOut({ scope: 'global' })`.
- In `onAuthStateChange`, when an event arrives **and** `isSigningOut` is true, ignore any non-SIGNED_OUT event (no `INITIAL_SESSION` rehydration, no `TOKEN_REFRESHED`).
- Set a `sessionStorage` key `wca:just_signed_out` with a 5-second TTL. The provider's initial `getSession()` checks this flag on mount; if set, it skips reading the session, treats user as null, and clears the flag. This blocks the local-storage rehydration race even if the user navigates immediately.
- Clear all state, then `navigate(redirectUrl, { replace: true })` so the auth page can't be "back-buttoned" into the authed state.

### 5. `src/pages/DcgAuth.tsx` (small follow-up)
- The redirect effect already depends only on `userId`. With the shared context, `userId` is now stable across the app, so the existing logic stops thrashing automatically. Add one guard: if `sessionStorage.getItem('wca:just_signed_out')` exists, skip auto-redirect entirely on mount.

### 6. Trim console noise
- Drop the per-fetch `console.log` lines inside `fetchUserData` (keep one summary line on success, one on error). The current logs spam ~20 lines per page transition, which itself contributes to the perceived "reloading".

## Files touched

```text
src/contexts/AuthContext.tsx     (NEW — single provider, single listener, single fetch)
src/hooks/useAuth.tsx            (shrink to re-export from AuthContext)
src/App.tsx                      (wrap Routes with <AuthProvider> inside BrowserRouter)
src/pages/DcgAuth.tsx            (respect the just_signed_out flag)
```

No DB changes. No edits to route guards, layouts, or the dozens of components that already call `useAuth()` — their imports keep working.

## Verification

1. Open any portal page; the console shows **exactly one** `Setting up auth state listener…` and **one** `Fetching user data for: …` per real auth event. Idle navigation no longer triggers re-fetches. Editing files in the preview no longer causes visible reload churn.
2. Sign in as Timah, land on `/portal-selector`. Click Sign Out. The user is taken to `/dcg-auth` (or appropriate auth page) and stays there. Refreshing or navigating to `/portal-selector` does **not** re-authenticate them.
3. Sign in again normally — no regressions: portal selector, DCG dashboard (KOTTO DCG), regional dashboard, super admin dashboard all load with their data.
4. Existing dedicated DCG leaders and regional admins continue to work unchanged.

