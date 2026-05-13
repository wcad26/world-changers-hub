I found the real blank-screen trigger in the live preview: the browser is still being served transformed DCG modules that import `/src/hooks/useAuth.tsx?t=...`, even though the current source imports `@/hooks/useAuth` and the real file is now `src/hooks/useAuth.ts`. That stale `.tsx` module request fails/returns the wrong content, so React never mounts after redirecting to `/dcg/dashboard`.

Plan:

1. Clear the stale dev-server module graph
   - Restart the Vite dev server so extensionless imports resolve fresh to `src/hooks/useAuth.ts` instead of the deleted `src/hooks/useAuth.tsx`.
   - Recheck the transformed DCG modules to confirm they no longer reference `/src/hooks/useAuth.tsx`.

2. Add a small defensive compatibility layer only if the restart does not clear it
   - If Vite or the preview still requests the old path, add a minimal `src/hooks/useAuth.tsx` shim that re-exports from `src/hooks/useAuth.ts` so stale browser/module-cache requests cannot blank the app.
   - Keep the real hook implementation in `.ts` to avoid the Fast Refresh invalidation that caused the original dev-only instability.

3. Validate the DCG login path
   - Open `/dcg/dashboard` in the preview and confirm it shows either the auth guard/loading/login redirect or dashboard content, not a blank page.
   - Inspect browser console/network for any remaining failed `/src/hooks/useAuth.tsx` or `AuthContext.tsx` module requests.
   - Confirm the DCG guard still waits for `authReady` before rendering protected pages.

No database, RLS, or Supabase login-flow changes are needed; this is a frontend dev-server/module-resolution failure after successful authentication.