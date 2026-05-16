## What's happening

The Member Management page itself is fine — `src/pages/admin/regional/Members.tsx` has no broken imports, and the dev-server log shows no runtime error when you navigated there. What the log does show is this sequence right before your blank screen:

```
hmr update /src/pages/admin/regional/Reports.tsx
page reload src/hooks/useReports.ts
```

That is from my previous change, where I deleted `Reports.tsx` and `useReports.ts`. Vite tried to hot-reload modules that no longer exist, then forced a full page reload. After a forced reload, the SPA momentarily has no auth/session state in memory — `RegionalSessionRoute` sees "not authenticated yet", renders nothing for a frame (blank), and bounces you back to the dashboard while the session re-hydrates.

You're noticing it only in the dev preview because HMR + forced reloads only happen in development. The published build doesn't go through that path.

## Fix

Restart the Vite dev server inside the sandbox so the module graph is rebuilt cleanly without the deleted `Reports.tsx` / `useReports.ts` ghosts. No source code changes are needed — the app code is correct.

Steps:
1. Restart the dev server (clears stale HMR module cache referencing deleted files).
2. Reload the preview and navigate to **Member Management** to confirm it loads normally.

## Out of scope

- No changes to `Members.tsx`, routing, auth guards, or the error boundary. Editing working code to "fix" a stale dev cache would mask the real cause.
