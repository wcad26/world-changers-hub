# Root cause — found it

The blank page after a successful regional login is **not** an auth, RLS, or routing problem. The Supabase session is created, `profile.region_id` is set (`WCA DOUALA`), and the routes are correctly isolated from the global `AuthProvider`. The issue is a classic **React 18 StrictMode double-mount race** inside `RegionalSessionContext.tsx`.

### What happens, step by step

`src/main.tsx` wraps the app in `<StrictMode>`. In dev, every effect runs **mount → cleanup → mount**.

`src/contexts/RegionalSessionContext.tsx` (lines 46–92):

```tsx
useEffect(() => {
  if (bootedRef.current) return;     // <-- bails on the SECOND mount
  bootedRef.current = true;          // set true on the FIRST mount

  let cancelled = false;
  (async () => {
    ...
    if (cancelled) return;           // <-- bails because cleanup already ran
    setReady(true);                  //     ← never reached
  })();

  return () => { cancelled = true; }; // <-- StrictMode runs this BEFORE 2nd mount
}, []);
```

Timeline under StrictMode:

1. **Mount #1** — `bootedRef.current = true`. Async kicks off. Captures `cancelled = false`.
2. **Cleanup #1** (immediate, by StrictMode) — sets that closure's `cancelled = true`.
3. **Mount #2** — `bootedRef.current` is already `true`, effect returns immediately. **No new fetch.**
4. The async from step 1 finally resolves → checks `cancelled` (now `true`) → returns early → **`setReady(true)` is never called**.

Result: `ready` stays `false` forever → `RegionalSessionGate` keeps rendering the spinner → user sees what looks like a blank/loading page indefinitely. When they refresh or navigate away (or the dev server HMRs), they land back on `/auth/regional`, which they perceive as being "logged out".

### Why the DCG portal works fine

`src/components/auth/DcgSessionRoute.tsx` uses the same `cancelled` pattern but **does not** have a `bootedRef` guard. So under StrictMode, the second mount simply re-runs the async fetch, that second run's `cancelled` is `false`, and state gets set correctly. It accidentally survives StrictMode by re-fetching once. The Regional version added `bootedRef` to "prevent re-fetches" and inadvertently broke the only mount whose state actually mattered.

### Confirmed against the live data

- `profiles.region_id` for `chimbotimah@gmail.com` = `dbf432ef-…` (`WCA DOUALA`) ✅
- `regions.is_active = true` for that region ✅
- RLS: `profiles` row is selectable via `id = auth.uid()`; `regions` is selectable via the public `is_active = true` policy ✅
- No `signOut`, no `Navigate`, and no `onAuthStateChange` listener exists inside the regional bundle that could kick the user out ✅
- Console logs are clean (no JS errors) ✅

The user is not actually being signed out — the session lives. They are being held on a perpetual loading screen because of the race above, and any refresh sends them back to `/auth/regional` since `RegionalSessionGate` still reports `ready=false → renders spinner` (and on a fresh load with the StrictMode race, same outcome).

---

# Fix — 3 small, targeted changes

### 1. `src/contexts/RegionalSessionContext.tsx` — drop the broken `bootedRef`, make the effect StrictMode-safe

Remove the `bootedRef.current` early return entirely. The `cancelled` flag is sufficient and correct — under StrictMode the async kicked off in mount #1 is cancelled, then mount #2 starts a fresh async with its own `cancelled = false` that runs to completion and calls `setReady(true)`. This is the standard React 18 pattern (and it's exactly what `DcgSessionRoute` does).

While there, add a tiny guard so we don't `setState` after unmount.

```tsx
useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        setReady(true);
        return;
      }

      setUser({ id: session.user.id, email: session.user.email ?? undefined });

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;

      setProfile(profileRow ?? null);

      if (profileRow?.region_id) {
        const { data: regionRow } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileRow.region_id)
          .maybeSingle();
        if (!cancelled && regionRow) setRegion(regionRow);
      }
    } catch {
      /* swallow — guard will redirect if needed */
    } finally {
      if (!cancelled) setReady(true);
    }
  })();

  return () => { cancelled = true; };
}, []);
```

Also delete the now-unused `bootedRef` declaration and its `useRef` import-usage.

### 2. `src/pages/RegionalAuth.tsx` — wait for the session to actually be persisted before navigating

Even with the fix above, there is a small additional race: `signInWithPassword` resolves before Supabase has finished persisting the session to `localStorage`. If the navigation to `/admin/regional/dashboard` happens immediately, the brand-new `RegionalSessionProvider` may call `getSession()` and get `null` back (rare, but it has happened to some users). Mirror what the DCG login does — call `getSession()` once after sign-in to make sure persistence is committed before navigating.

```tsx
const { data: authData, error: authError } =
  await supabase.auth.signInWithPassword({ email: email.trim(), password });

if (authError || !authData.user) {
  setError(authError?.message ?? 'Invalid credentials.');
  return;
}

// Make sure the session is persisted before we navigate into the portal.
await supabase.auth.getSession();

const { data: profile } = await supabase
  .from('profiles')
  .select('region_id')
  .eq('id', authData.user.id)
  .maybeSingle();

if (!profile?.region_id) {
  await supabase.auth.signOut();
  toast({ title: 'Access denied', description: '…', variant: 'destructive' });
  return;
}

navigate('/admin/regional/dashboard', { replace: true });
```

### 3. `src/components/auth/RegionalSessionRoute.tsx` — small UX safety net

If for any reason `ready` stays `false` for an unreasonable amount of time, surface that instead of an indefinite spinner. This is purely defensive — once fix #1 is in, `ready` flips on every page load. But it prevents another silent infinite-spinner in the future.

Add a 7-second timeout that, if `ready` is still `false`, redirects to `/auth/regional` with a state flag we can later use for a toast. (No new dependencies; just a single `setTimeout` inside a `useEffect` that clears on unmount or when `ready` flips.)

---

# What this does NOT touch

- The global `AuthProvider`, the Super Admin portal, the DCG portal, the Member portal — all unchanged.
- Routing in `App.tsx` — unchanged. Regional routes stay outside the global `AuthProvider`.
- RLS policies — unchanged. The data already loads correctly under the user's identity.
- `useAuth.tsx` fallback wiring — unchanged. It already correctly proxies `RegionalSessionContext` to legacy hooks.

# How we will verify

1. Sign in at `/auth/regional` with `chimbotimah@gmail.com`.
2. Expect: brief spinner (≤1 s) → dashboard renders with `WCA DOUALA` in the sidebar.
3. Hard refresh `/admin/regional/dashboard` while signed in — expect the same: brief spinner → dashboard. No bounce to `/auth/regional`.
4. Click **Sign Out** in the sidebar — expect a clean redirect to `/auth/regional` with no React state surviving.
5. The Super Admin portal (`/admin/super/dashboard`) and DCG portal (`/dcg-auth` → `/dcg/dashboard`) continue to work exactly as before.

# Files to be edited

- `src/contexts/RegionalSessionContext.tsx` (remove `bootedRef`, keep `cancelled` only)
- `src/pages/RegionalAuth.tsx` (await `getSession()` before navigating)
- `src/components/auth/RegionalSessionRoute.tsx` (defensive timeout fallback)

No DB migrations, no new dependencies, no edge-function changes.