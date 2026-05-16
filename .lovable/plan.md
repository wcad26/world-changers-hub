## Problem

The regional admin lands on `/admin/regional/dashboard` and sees a red error banner: **"Some dashboard data could not load. TypeError: Failed to fetch"**, while the rest of the page stays mostly empty.

From the console logs the failure is transient — `useDiscipleshipRelationships` (and `RegionalSession` profile loader) intermittently throws `TypeError: Failed to fetch` on the first request and succeeds on the next retry. That single early failure is enough to populate the `error` on one of the dashboard's React Query hooks, which we surface in the banner. Some hooks (e.g. the `useFinancialTransactions` / discipleship / attendance queries) also don't retry aggressively enough on a network-level `fetch` failure, so the error state can stick until the user reloads.

Root causes:
1. The dashboard banner shows whenever any of 5 queries has a non-null `error`, even when the data eventually loads.
2. Several of the underlying hooks rely on React Query defaults that don't always retry `TypeError: Failed to fetch` quickly, and have no manual recovery affordance.
3. There is no user-facing retry — they have to refresh the whole page.

## Fix

Frontend-only, narrow change to `src/pages/admin/regional/Dashboard.tsx`:

1. **Suppress the banner once data is present.** Treat a query as "errored" only if `error` is set AND its data is still missing. If the retry succeeded and `data` is now defined, hide the notice.
2. **Add a Retry button** to the banner that calls `refetch()` on the failing queries so the user doesn't have to reload.
3. **Make the failing queries auto-retry on network errors.** Pass an explicit `retry` option to the React Query hooks used by the dashboard (members, events, financial transactions, discipleship, attendance) so `TypeError: Failed to fetch` is retried 2–3 times with backoff before surfacing.

   - Where the hook signature already accepts query options, pass them through.
   - Where it doesn't (e.g. `useDiscipleshipRelationships`, `useAttendanceHistoryWithMemberTypes`), add an optional `options` parameter (default `{}`) and merge it into the internal `useQuery` config. No behavior change for other callers.
4. **Keep messaging accurate.** When the banner does show (data truly missing), keep the existing copy but include the Retry action and a short hint that this is usually a temporary network blip.

No backend, schema, RLS, or business-logic changes. No change to KPI math or to the DCG/regional event-type behavior implemented earlier.

## Technical details

Files touched:

- `src/pages/admin/regional/Dashboard.tsx`
  - Replace `dataErrors` computation so each entry is only added when `error && !data`.
  - Collect a `refetchAll` callback that calls `refetch()` on each affected query.
  - Update the `dataErrorNotice` JSX to render a Retry button.
- `src/hooks/useDiscipleship.ts` — extend `useDiscipleshipRelationships` to accept `{ retry, retryDelay }` options and merge into its `useQuery` call. Default to `retry: 3` with exponential backoff for network errors.
- `src/hooks/useAttendance.ts` — same treatment for `useAttendanceHistoryWithMemberTypes`.
- `src/hooks/useFinancials.ts` — same for `useFinancialTransactions`.
- `src/hooks/useMembers.ts` and `src/hooks/useEvents.ts` (`useRegionalEvents`) — same, only if they don't already retry network errors.

Validation:

- Verify the dashboard renders without the banner when the initial fetch succeeds.
- Simulate a transient failure by throttling DevTools network once; confirm the banner either never shows or clears as soon as the retry succeeds.
- Confirm the Retry button re-runs the failed queries.
- No existing callers of the modified hooks need code changes (new param is optional).
