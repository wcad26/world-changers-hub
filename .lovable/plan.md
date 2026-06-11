# Finish the currency fix

The DB backfill already ran: every existing financial transaction now carries its region's true currency (WCA Douala → XAF, etc.) and the misleading `'USD'` default has been dropped from `financial_transactions.currency_code`.

Because the default is gone, `currency_code` is required on insert, which broke the two remaining insert paths. Build errors:

- `src/hooks/useFinancials.ts:165` — regional record income/expense
- `src/hooks/useDcgFinancials.ts:160` — DCG record income/expense

## Changes

1. **`src/hooks/useFinancials.ts` (`useCreateFinancialTransaction`)** — before inserting, look up `regions.currency_code` for `userRegion.id` and include it in the insert payload (fallback `'USD'` if null).

2. **`src/hooks/useDcgFinancials.ts` (`useCreateDcgTransaction`)** — the hook already fetches the DCG's `region_id`; extend the select to `region_id, region:regions(currency_code)` (or do a follow-up select on `regions`) and include `currency_code` in the insert payload.

3. **Super Admin resolver order** — in the three aggregating tabs, prefer the region's currency over the row's stored currency (region is authoritative for that region's ledger). Files:
   - `src/components/admin/super/finances/GlobalLedgerTab.tsx`
   - `src/components/admin/super/finances/GlobalDcgLedgerTab.tsx`
   - `src/components/admin/super/finances/GlobalBooksTab.tsx`
   
   Change `r.currency_code || r.region?.currency_code || baseCode` → `r.region?.currency_code || r.currency_code || baseCode`.

After these edits the build will pass, WCA Douala's XAF transactions will convert through the existing EUR↔XAF rate, and the Regional / DCG tabs will populate correctly in the Super Admin portal.
