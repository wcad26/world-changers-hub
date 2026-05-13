## Diagnosis

The login itself is succeeding. The affected account signs in correctly, but it has no active row in `dcg_user_sessions` and is only connected to a DCG through `dcg_members`. The frontend currently tries to recover from that, but the DCG portal can still mount before the DCG context is fully usable, leaving the dashboard in a blank/loading state and then bouncing back to `/dcg-auth`.

## Plan

1. **Make DCG auth resolution deterministic**
   - Update the portal auth provider so it always clears stale portal state before loading a new session.
   - Resolve the user’s DCG in one reliable order:
     1. active `dcg_user_sessions` row,
     2. DCG led by the user’s member record,
     3. active `dcg_members` membership.
   - Keep `authReady` false until this resolution finishes, so the dashboard cannot render with partial auth data.

2. **Fix the DCG route guard**
   - Make `/dcg/*` wait for both the Supabase user and DCG-context loading to finish.
   - If the user is signed in but has no DCG assignment, show a clear access message instead of a blank screen or silent logout.
   - Only redirect to `/dcg-auth` when there is truly no authenticated Supabase session.

3. **Stop dashboard blank states**
   - Guard DCG dashboard data hooks behind a resolved `userDcg`.
   - Replace any blank/empty interim state with a visible loading or “no DCG assigned” state.
   - Avoid using broader regional DCG queries for the current DCG when the resolved `userDcg` is already available.

4. **Validate the fix**
   - Re-check the dev-server logs for module resolution/runtime errors.
   - Verify the affected account path: login succeeds, `/dcg/dashboard` stays mounted, and the user is not automatically redirected back to `/dcg-auth`.

## Technical files likely to change

- `src/contexts/AuthProvider.tsx`
- `src/components/auth/DcgSessionRoute.tsx`
- `src/pages/dcg/Dashboard.tsx`

No database schema change is planned for this fix.