# Fix: revoked admin access still charged the Leader fee

## What I found

Teufack Kisi is **not** an admin anymore. Her Super Admin access was revoked (both the access record and the "Content Admin" tier are switched off), and she cannot enter the Super Admin portal.

The registration-fee calculator, however, only looks at whether the access record was *approved*, and ignores whether it was later *switched off*. So anyone whose access was revoked is still treated as a Leader and billed the Leader rate — exactly what the screenshot shows.

Revoking access itself works correctly: every portal, menu and permission check already respects the switch-off. The fee calculator is the one place that doesn't.

## Status of everyone whose Super Admin access was revoked

All of the people below have lost Super Admin access successfully. The "still has" column is access they hold legitimately through other roles.

| Person | Super Admin | Still has |
| --- | --- | --- |
| Teufack Kisi | Revoked | Nothing — regular member |
| Likine Augustine | Revoked | Nothing |
| Mba Mbuko Rolande | Revoked | Nothing |
| Ndichengoh Rahimu | Revoked | Nothing |
| Onana Kounou Albertine Claudia | Revoked | Nothing |
| Josephine Yurika | Revoked | Group admin |
| Ayuketah Pearl | Revoked | Group admin |
| Munka Velma | Revoked | Regional admin |
| Ankiambom Chia Agabus | Revoked | Regional admin (Logistics), group admin |
| Armstrong Neba Shu | Revoked | Regional admin (Leaders WCA Yde) |
| Ayuketah Pearl Oben | Revoked | Regional admin (Vice President), group admin |
| Ayungha Bernadette | Revoked | Regional admin |
| Chiangeh Amandine Dwin | Revoked | Regional admin (Tech Assistant) |
| Christabel Yennyuy Shiynsa | Revoked | Regional admin (Children Ministry), group admin |
| Njinkeu Tchana Christine Kelly | Revoked | Regional admin (Leaders WCA Yde) |
| Ngalim Mark Dinyuy | Revoked | Regional admin (President), group admin |
| Akia Robert Wiysenyuy | (regional revoked) | Group admin |
| Whits Tim | (regional revoked) | Nothing |
| Nganyu Tanyu Derick | Request rejected | Nothing |

One case to confirm: **Chengwa Precious** — the Operations Admin tier was switched off, but she still holds the Principal Super Admin tier, so she remains a full Super Admin.

## The fix

1. Make the fee calculator ignore access that has been switched off or is still pending, so only people with live admin access get the Leader rate.
2. Apply the same rule to the three places access can live (global access, regional access, Super Admin tiers) so it behaves the same everywhere.
3. After the fix, re-check the registration in the screenshot: Teufack Kisi should be billed at the Member rate.

Nothing changes in the registration page design, in the family logic, or in anyone's actual portal access.

## Technical notes

- `supabase/functions/_shared/eventFees.ts` → `resolveCategoriesForMembers`: the `user_roles` branch tests only `status`, never `is_active`. Change the predicate to `r.is_active !== false && (!r.status || r.status === 'active')`. The `regional_user_roles` and `super_admin_user_roles` branches already test `is_active`, but should additionally require the joined role to be active, matching `has_super_permission`.
- Redeploy `event-fee-quote` and `event-special-register` (both import the shared module).
- Revocation paths (`useSuperAdminUsers.revokeAllSuperAccess`, `UsersList` promote/revoke, `useUserPermissions`) already set `is_active = false` on both tables and every reader filters on it — no change needed there. Rows are intentionally kept (soft revoke) for audit history.
