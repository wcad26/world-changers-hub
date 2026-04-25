The problem is not the `/auth/regional` selector page anymore. The replay shows this exact sequence:

```text
1. Region login succeeds
2. Toast says "Welcome to WCA DOUALA"
3. App navigates to the regional dashboard
4. RegionalSessionRoute shows its loading spinner
5. A few seconds later the browser is back on /auth/regional
```

What is still causing it:

- The rebuilt regional login page is simple, but the regional dashboard is still wrapped by the old global `AuthProvider` state.
- `RegionalSessionRoute` still depends on `useAuth()` and waits for `authReady`, `loading`, `user`, and `profile` from the global AuthContext.
- That AuthContext still fetches roles, regional roles, member data, DCG data, and other portal-related data during login/session restoration.
- The regional layout still filters the sidebar through old permission logic (`hasRole`, `hasRegionalPermission`, `REGIONAL_PAGES`). If those old role/permission queries lag, fail, or return empty during boot, the portal can render as blank or be redirected even after the regional login itself succeeded.
- The user profile is valid in the database: `chimbotimah@gmail.com` belongs to `WCA DOUALA`, so this is a frontend guard/session hydration problem, not a region mismatch.

Plan to fix it completely:

1. Rebuild `RegionalSessionRoute` to be independent of `AuthContext`
   - Use only `supabase.auth.getSession()`.
   - If no Supabase session exists, redirect to `/auth/regional`.
   - If a session exists, query only `profiles.region_id` for that user.
   - If `profile.region_id` exists, allow the portal.
   - Do not query user roles, regional roles, DCG, member record, or super admin state.

2. Create a small dedicated regional session context/hook
   - Store only what the regional portal needs: `user`, `profile`, and `region`.
   - This prevents dashboard/layout components from needing the global `AuthContext` just to show the region name/email.

3. Update the regional admin layout to stop using old permission filtering
   - Make `EnhancedRegionalAdminLayout` show all regional pages directly from `REGIONAL_PAGES`.
   - Remove `hasRole` and `hasRegionalPermission` from the regional layout.
   - Replace `AdminLayout`’s regional use of `useAuth()` with the dedicated regional session data where needed.

4. Make regional logout local and direct
   - For the regional portal logout button, call `supabase.auth.signOut()` directly and navigate to `/auth/regional`.
   - Do not use the global `AuthContext.signOut()` for regional logout, because that function still chooses redirects based on cross-portal roles.

5. Keep Super Admin, DCG, and Member portal behavior unchanged
   - This change will only affect `/admin/regional/*` and the regional portal layout.
   - The regional portal will be: login -> check region membership once -> dashboard, with no role/permission/DCG/super-admin checks involved.

Technical detail:

The new regional flow will become:

```text
/auth/regional
  -> choose region
/auth/regions/:regionSlug
  -> signInWithPassword
  -> SELECT profiles.region_id WHERE id = signed-in user
  -> if it matches selected region: /admin/regional/dashboard

/admin/regional/*
  -> getSession()
  -> SELECT profiles.region_id WHERE id = session user
  -> if region_id exists: render portal
  -> otherwise: /auth/regional
```

This removes the remaining old global-auth dependency that is still causing the blank page and redirect after successful login.