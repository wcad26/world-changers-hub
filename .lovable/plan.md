# Fix: emmanuelamiki@gmail.com missing from Promote-to-Super-Admin picker

## Root cause (verified against the database)

Two distinct profiles exist with the name fields swapped between them:

| email | first_name | last_name | position when ordered by last_name |
| --- | --- | --- | --- |
| ghislainsilafe@gmail.com | Silafe | Ghislain | 257 |
| emmanuelamiki@gmail.com | Ghislain | Silafe | **638** |

`profiles` currently has 747 rows. The Promote picker in `src/components/admin/super/access/PromoteSuperAdminDialog.tsx` fetches candidates with:

```ts
supabase.from('profiles')
  .select('id, first_name, last_name, email')
  .order('last_name', { ascending: true })
  .limit(500);
```

Row 638 falls beyond the 500-row cap, so `emmanuelamiki@gmail.com` is never in the candidate list — no matter what you type in the search box, cmdk can only filter what was loaded. `ghislainsilafe@gmail.com` sits at row 257 and appears normally, which is why the search "silafe ghi" returns exactly one result.

The user's `auth.users` row and role state are healthy; nothing else is wrong with the account.

## Fix

Edit only `src/components/admin/super/access/PromoteSuperAdminDialog.tsx`:

1. Remove the `.limit(500)` on the candidates query so all non-super-admin profiles are returned (747 rows is well within Supabase's 1000-row default; if we want headroom, page in batches, but a single fetch is sufficient here).
2. Add `first_name` as a secondary sort so rows with null `last_name` remain discoverable.
3. Leave the cmdk `CommandInput` client-side filter as-is — it handles a few hundred rows without issue.

No schema, RLS, backend, or data changes. Once the picker loads the full set, `emmanuelamiki@gmail.com` will be selectable and the existing `useAssignSuperAdminRole` flow will grant super admin access normally.

## Optional follow-up (not required for this fix)

The two profiles have `first_name`/`last_name` swapped on one of them. That's a data-quality issue, not a bug in the picker. Worth flagging to whoever owns those records, but out of scope here.

## Files touched

- `src/components/admin/super/access/PromoteSuperAdminDialog.tsx`
