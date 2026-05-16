# Fix: New financial records not appearing in Regional Finances ledger

## Root cause

The Regional Ledger query is cached under the key `["regional_ledger", regionId, filters]` (underscore), but:

1. `useCreateFinancialTransaction` (used by `RecordOfferingDialog`, `RecordSpecialGivingDialog`, etc.) never invalidates the `regional_ledger` key on success — so newly created transactions don't appear until a hard page reload.
2. The Refresh button in `RegionalLedgerTab.tsx` invalidates `["regional-ledger"]` (hyphen) — a key that doesn't exist. So Refresh also fails to drop the stale cache.

## Changes

### 1. `src/hooks/useFinancials.ts` — `useCreateFinancialTransaction.onSuccess`
Add invalidation for the regional ledger key (and DCG ledger keys for consistency with `useUpdateRegionalTransaction`):

```ts
queryClient.invalidateQueries({ queryKey: ['regional_ledger', userRegion.id] });
queryClient.invalidateQueries({ queryKey: ['dcg_financial_transactions'] });
queryClient.invalidateQueries({ queryKey: ['dcg_financial_summary'] });
queryClient.invalidateQueries({ queryKey: ['recent_dcg_transactions'] });
```

### 2. `src/components/admin/regional/finances/RegionalLedgerTab.tsx` — `handleRefresh`
Fix the typo: change `["regional-ledger"]` to `["regional_ledger"]` so the Refresh button actually invalidates the cache. Also invalidate `["financial_transactions"]` and `["financial_summary"]` for completeness.

## Out of scope

- No schema, RLS, or dialog changes.
- No changes to the actual record-creation flow or business logic.

## Verification

After the fix:
- Recording a new offering/special giving immediately updates the ledger table without a page reload.
- The Refresh button refetches fresh data.
