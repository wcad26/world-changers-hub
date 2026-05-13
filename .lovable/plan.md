## Root cause

In dev, Vite logs:

```
[vite] hmr invalidate /src/contexts/AuthContext.tsx Could not Fast Refresh ("AuthContext" export is incompatible)
[vite] hmr invalidate /src/hooks/useAuth.tsx     Could not Fast Refresh ("useAuth" export is incompatible)
```

React Fast Refresh requires each module to export **only React components** or **only non-components** — never both. Today:

- `src/contexts/AuthContext.tsx` exports both `AuthContext` (a context value) and `AuthProvider` (a component).
- `src/hooks/useAuth.tsx` is a `.tsx` file but exports only the `useAuth` hook (lowercase identifier — Fast Refresh can't classify it as a component).

Whenever any file in the dependency tree changes during a DCG login, Vite **invalidates** these modules. The new module instance gets a fresh `AuthContext` symbol while mounted consumers still hold the old one, so `useContext(AuthContext)` returns `null`. `useAuth`'s fallback then returns `{ authReady: true, user: null }`, `DcgSessionRoute` sees no user and redirects back to `/dcg-auth`. This is invisible in production (no HMR), which is why the bug only happens in dev.

## Plan

1. **Split `src/contexts/AuthContext.tsx`** into two files:
   - `src/contexts/AuthContext.ts` — exports only `AuthContext` (created by `createContext`) and the `AuthContextValue` / `AppRole` types. No JSX, no component.
   - `src/contexts/AuthProvider.tsx` — exports only the `AuthProvider` component. Imports `AuthContext` from the file above.

2. **Rename `src/hooks/useAuth.tsx` → `src/hooks/useAuth.ts`** (no JSX inside it). This lets Fast Refresh skip it instead of invalidating.

3. **Update imports** across the codebase:
   - Anywhere that imports `AuthProvider` from `@/contexts/AuthContext` → switch to `@/contexts/AuthProvider` (App.tsx is the only consumer).
   - Anywhere that imports `AuthContext` or types stays on `@/contexts/AuthContext` (now the `.ts` file).
   - Imports of `useAuth` already resolve via extension stripping, so renaming `.tsx` → `.ts` requires no path changes.

4. **No behavior change** to the auth logic itself — the listener pattern, `fetchedForUserRef` guard, and `signOut({ scope: 'local' })` flow remain exactly as they are. This is purely a module-boundary refactor to make Fast Refresh happy and stop the dev-only stale-context bounce.

## Files touched

- New: `src/contexts/AuthContext.ts` (context + types)
- New: `src/contexts/AuthProvider.tsx` (component, moved out of the old file)
- Delete: `src/contexts/AuthContext.tsx`
- Rename: `src/hooks/useAuth.tsx` → `src/hooks/useAuth.ts`
- Edit: `src/App.tsx` — update `AuthProvider` import path

## Out of scope

- No changes to RegionalSessionContext, MemberAuth, SuperAuth, or DCG hooks.
- No DB / RLS changes.
- No changes to logout flow.

## Verification

After the change, editing any file in dev should no longer log `hmr invalidate ... AuthContext export is incompatible`. The login → `/dcg/dashboard` transition should remain stable across HMR reloads.
