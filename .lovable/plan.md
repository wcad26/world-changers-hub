

## Two issues, one approved plan

### A. Endless reload/preview-churn loop (blocking edits)

**Cause 1 — `useEffect` thrash in `src/pages/DcgAuth.tsx`.**
The effect that auto-redirects already-authenticated users lists `hasRole` and `getAvailablePortals` in its dependency array. Both are recreated every render by `useAuth`, so the effect re-runs forever, repeatedly calling `navigate(...)` and re-mounting the auth tree. This is the dominant source of the visible "loading and reloading" the user sees.

**Cause 2 — DCG portal routes bypass the DCG-association gate.**
In `src/App.tsx`, every `/dcg/*` route is wrapped in `MultiRoleProtectedRoute allowedRoles={['dcg_admin','regional_admin','super_admin']}`, never in `DcgProtectedRoute`. Result: a `regional_admin`/`super_admin` (e.g. Timah) is admitted to `/dcg/dashboard` even with `userDcg=null`, the dashboard renders against an undefined DCG id, child queries get rejected/empty, and the layout header shows a generic "DCG Portal" — exactly the "vague DCG that does not exist" we already fixed at the auth-data layer but never wired into routing. This contradicts the policy already approved last turn.

**Cause 3 — Multiple `useAuth` instances each install their own auth subscriber.**
Console shows repeated "Setting up auth state listener..." / "Getting initial session..." pairs. Every `useAuth()` call mounts its own `onAuthStateChange` subscription and re-runs `fetchUserData`, multiplying network traffic and re-renders. Today this works but amplifies any other render churn (like Cause 1) into a visible reload storm.

### B. Eye/show-password toggle missing on the DCG login page

`src/pages/DcgAuth.tsx` renders a plain `<Input type="password">` with no toggle. SuperAuth and RegionSpecificAuth already use the same `Eye` / `EyeOff` pattern — we'll mirror it.

---

## Fix (code only, no DB or schema changes)

### 1. `src/pages/DcgAuth.tsx`
- Stabilise the redirect effect: depend ONLY on `user?.id`. Read `hasRole`/`getAvailablePortals` inside the effect body without listing them in deps. This stops the re-run loop entirely.
- Add a `showPassword` state and an `Eye` / `EyeOff` toggle button positioned absolutely inside the password field, matching the SuperAuth/RegionSpecificAuth implementation. Switch `<Input type=...>` between `'text'` and `'password'`.

### 2. `src/App.tsx` — wrap DCG routes with the DCG-association guard
Replace each `/dcg/*` route's `MultiRoleProtectedRoute allowedRoles={['dcg_admin','regional_admin','super_admin']}` with a composition:
```text
<MultiRoleProtectedRoute allowedRoles={['dcg_admin','regional_admin','super_admin']}>
  <DcgProtectedRoute>
    <DcgDashboard />
  </DcgProtectedRoute>
</MultiRoleProtectedRoute>
```
The outer guard ensures the user is authenticated; the inner `DcgProtectedRoute` (which we already updated) shows the friendly "No DCG Association" screen when `userDcg` is null. Timah will see KOTTO DCG once `userDcg` resolves; pure super admins or regional admins with no DCG link will see the explicit "no DCG" screen instead of an empty dashboard.

### 3. `src/hooks/useAuth.tsx` — minor hardening (optional but recommended)
- Memoise the returned helper functions (`hasRole`, `hasAnyRole`, `canAccessPortal`, `getAvailablePortals`, `hasRegionalPermission`) with `useCallback` so any consumer that lists them as deps (current or future) doesn't thrash. Keys: `[userRoles]`, `[userRoles, userRegionalRoles, memberRecord, userDcg]` as appropriate.
- Reduce log noise: drop the per-render `console.log` in `hasRole` (it's firing dozens of times per second in the console panel and contributes to perceived churn). Keep the auth-state-change and fetch logs.

No change to the multi-instance subscription pattern in this pass — fixing #1 alone removes the visible loop. Switching `useAuth` to a single shared context can come later as a perf cleanup.

---

## Files to edit

```text
src/pages/DcgAuth.tsx       (stabilise redirect effect deps + add Eye/EyeOff password toggle)
src/App.tsx                 (wrap each /dcg/* route with DcgProtectedRoute inside MultiRoleProtectedRoute)
src/hooks/useAuth.tsx       (memoise helpers with useCallback, drop hasRole console.log spam)
```

No DB changes. No edits to `DcgProtectedRoute.tsx` (already correct from the last turn).

---

## Verification

1. Open `/dcg-auth`: the password field shows an eye icon; clicking it toggles visibility. Identical UX to Super and Regional auth pages.
2. Editing files in the preview no longer triggers a reload storm. Console no longer spams "Checking role …" and "Setting up auth state listener…" repeatedly while idle.
3. As Timah, click DCG Portal in the switcher → land on `/dcg/dashboard` showing "KOTTO DCG" header with real members/events/finances.
4. As a pure super admin (no DCG association), navigating to `/dcg/dashboard` shows the friendly "No DCG Association" card with Back/Sign Out buttons (not a blank dashboard, not `/unauthorized`).
5. Existing dedicated DCG leaders (with `dcg_user_sessions` row) continue to land on their DCG without regression.

