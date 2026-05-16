## Problem

The DCG Finances page (`src/pages/dcg/Finances.tsx`) is blank even though Kotto DCG has 20 financial transactions in the database.

Root cause: `useDcgFinancialTransactions` (in `src/hooks/useDcgFinancials.ts`) gates its query on `useAuth().userRegion?.id`:

```ts
enabled: !!regionId && !!dcgId,
```

In the DCG portal session, `userRegion` is populated from the user's `profiles.region_id`. For DCG leaders who don't have a region set on their profile (or where the auth context hasn't loaded it in the DCG session), `regionId` is `undefined`, so the query never runs and `rawRows` stays empty → blank KPIs, blank chart, blank table.

The DCG already knows its own `region_id` (we resolve `currentDcg.region_id` via `useDcgs` in the page), and RLS on `financial_transactions` already scopes access. The `region_id` filter in the hook is redundant for the DCG-scoped use case.

## Fix

Make the DCG finance hooks work purely from `dcg_id`, deriving `region_id` from the DCG row instead of from the logged-in user's profile.

### Changes to `src/hooks/useDcgFinancials.ts`

1. **`useDcgFinancialTransactions(dcgId, filters)`**
   - Remove the `useAuth().userRegion` dependency.
   - Drop the `.eq('region_id', regionId)` filter (keep `.eq('dcg_id', dcgId)`; RLS handles authorization).
   - `enabled: !!dcgId`.
   - Update `queryKey` to `['dcg_financial_transactions', dcgId, filters]`.

2. **`useDcgFinancialSummary(dcgId, filters)`** — same treatment (remove region gating, key off `dcgId` only).

3. **`useRecentDcgTransactions`**, **`useCreateDcgTransaction`**, **`useUpdateDcgTransaction`**, **`useDeleteDcgTransaction`**
   - For the create hook, derive `region_id` from the DCG row (`supabase.from('dcgs').select('region_id').eq('id', dcgId).single()`) instead of `userRegion.id`, so DCG leaders without a profile region can still record transactions.
   - For read/list/delete hooks, drop the `region_id` filter and rely on RLS + `dcg_id` scoping.
   - Keep invalidations working (use `dcgId` in keys).

### No changes needed in `src/pages/dcg/Finances.tsx`

The page already passes `userDcg?.id` and reads `currentDcg.region_id` separately for currency — that continues to work.

### Out of scope

- No DB schema or RLS changes (existing RLS on `financial_transactions` already restricts access by DCG membership/role).
- No UI/visual changes.
- Regional admin's `DcgFinancialsTab` continues to work because it passes `dcgId` explicitly; removing the region filter does not broaden its access (RLS still enforces region scope for regional admins).

## Verification

1. Reload `/dcg/finances` as the Kotto DCG leader → KPIs, chart, and transactions table populate with the 20 existing rows.
2. Recording a new income/expense still succeeds and the lists refresh.
3. Regional admin DCG financials tab still shows the same per-DCG data.
