## Goal

One simple regional login page — just like `/dcg-auth` — that any regional user from any region can use. No region picker, no per-region URLs. After login, the only check is: "does this user belong to a region?" If yes → `/admin/regional/dashboard`. If no → sign out + toast.

## What changes

### 1. Replace `/auth/regional` with one login form

Rewrite `src/pages/RegionalAuth.tsx` to mirror `DcgAuth.tsx`:

- Email + password fields, show/hide password, "Forgot password?" link.
- On submit:
  1. `supabase.auth.signInWithPassword`.
  2. Read `profiles.region_id` for the signed-in user.
  3. If `region_id` is set → `navigate('/admin/regional/dashboard')`.
  4. If not set → `supabase.auth.signOut()` + destructive toast "This account is not associated with a region."
- No `useRegions`, no slug navigation, no AuthProvider, no role lookups.

### 2. Delete the stale region-picker / per-region pages

Remove these files entirely:
- `src/pages/RegionSelect.tsx`
- `src/components/auth/RegionSpecificAuth.tsx`

And remove these routes from `src/App.tsx`:
- `/auth/regions` (RegionSelect)
- `/auth/regions/:regionSlug` (RegionSpecificAuth)

Also remove their imports at the top of `App.tsx`.

The only regional auth route that remains is `/auth/regional`.

### 3. Fix every remaining link that points to the deleted routes

- `src/pages/auth/ForgotPasswordPage.tsx`
  - Replace `navigate('/auth/regions/${region}')` and `navigate('/auth/regions')` with `navigate('/auth/regional')`.
  - Drop the `region` query param handling in the regional branch — there are no per-region pages anymore.
- `src/contexts/RegionalSessionContext.tsx` — already redirects to `/auth/regional`, leave as is.
- `src/components/auth/RegionalSessionRoute.tsx` — already redirects to `/auth/regional`, leave as is.
- `src/components/auth/RegionalPermissionRoute.tsx` — already redirects to `/auth/regional`, leave as is.
- `src/components/auth/PortalSelector.tsx` — already points to `/auth/regional`, leave as is.
- `src/contexts/AuthContext.tsx` — already redirects to `/auth/regional`, leave as is.

### 4. Keep regional admin shell exactly as it is

- `/admin/regional/*` routes, `RegionalSessionRoute`, `RegionalSessionProvider`, `EnhancedRegionalAdminLayout` — all unchanged.
- `RegionalSessionProvider` already gates on `profile.region_id` being present, which matches the new login rule perfectly.

### 5. Confirm DCG, Super Admin, and Member portals are untouched

- `/dcg-auth`, `/auth/super`, `/auth/member`, `/auth/forgot-password`, all `/admin/super/*`, `/dcg/*`, `/member/*` routes stay exactly as they are.

## Final regional auth surface

- One page: `/auth/regional`
- One check after sign-in: `profiles.region_id IS NOT NULL`
- One destination: `/admin/regional/dashboard`

Symmetrical with how `/dcg-auth` works today.

## Files touched

- `src/pages/RegionalAuth.tsx` — rewritten as a single login form (DCG-style).
- `src/App.tsx` — remove `/auth/regions` and `/auth/regions/:regionSlug` routes and their imports.
- `src/pages/RegionSelect.tsx` — deleted.
- `src/components/auth/RegionSpecificAuth.tsx` — deleted.
- `src/pages/auth/ForgotPasswordPage.tsx` — point regional flow back to `/auth/regional`.
