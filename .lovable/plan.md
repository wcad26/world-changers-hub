

## Issue: Christian Collins Cannot Access Regional Admin Portal

### Root cause (confirmed in DB)

Christian Collins Nimpa Nyutchem (`christian.nyutchco@gmail.com`, region: WCA DOUALA) holds two base roles in `user_roles`, both active:
- `regional_admin` (active, since 2025-09-13)
- `dcg_admin` (active, since 2025-11-30)

**However, he has ZERO entries in `regional_user_roles`** — meaning no granular regional role (no "Regional Admin", no "Integration", etc.) is assigned to him.

The portal guard `RegionalPermissionRoute` works like this:
1. If `super_admin` → bypass, allow.
2. Otherwise → require a `regional_user_roles` entry whose granular role contains the page's permission key.
3. If the user has no granular permissions at all → redirect to `/unauthorized`.

The base `regional_admin` role is treated only as a "login token", not as a permission grant. So even though Christian is flagged `regional_admin`, every page in the regional portal kicks him to `/unauthorized` because his granular role list is empty. This matches exactly the symptom — he can log in, but no regional page loads.

For comparison, in the same region:
- Terence Lukong holds the granular **Regional Admin** role → full access.
- Tsi Viola / Ayuk Meldwine hold **Integration** → partial access.
- Shiynsah Christabel holds **Children Ministry** → partial access.

Christian was likely a region owner whose granular role row got removed or never created (his `regional_admin` row predates the granular system rollout, and he doesn't have an `assigned_by` value).

### Fix

Insert a granular role assignment for Christian into `regional_user_roles`, pointing him at the **Regional Admin** granular role (`50b48078-2dc8-4e19-8edc-8ca5334dc5c3`) for **WCA DOUALA** (`dbf432ef-…`). This is the same role Terence Lukong holds and contains every permission key, restoring full regional portal access.

```text
INSERT regional_user_roles
  user_id           = 3bf68690-2278-4115-bb26-1a6d91ea797b   (Christian Collins)
  region_id         = dbf432ef-5844-4558-b385-698e17be919e   (WCA DOUALA)
  regional_role_id  = 50b48078-2dc8-4e19-8edc-8ca5334dc5c3   (Regional Admin)
  is_active         = true
```

This is a pure data fix — no schema migration, no code changes. After insertion, on his next login (or page reload) `useAuth` will load the granular role, `hasRegionalPermission(...)` will return `true` for every page, and the portal will be fully accessible again. His existing `dcg_admin` role is untouched, so the DCG portal still works.

### Optional follow-up (not in this fix)

The current behavior — base `regional_admin` granting login but NOT page access — is correct by design (Children Ministry users shouldn't see Finances) but causes silent lockouts when a granular row is missing. A future hardening could be to auto-create the matching "Regional Admin" granular row whenever a user is approved as base `regional_admin`. Worth raising as a separate task once Christian is unblocked.

### Steps once approved

1. Run the single `INSERT` above against `regional_user_roles`.
2. Ask Christian to refresh / re-login and confirm `/admin/regional/dashboard` loads.

