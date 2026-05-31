## Plan to fix the regional development portal

The current route guards are already mostly pass-through, but the regional portal still depends on restricted regional data reads during login and dashboard hydration. If those fail or session restoration lags, the UI can sit blank and later appear logged out.

### 1. Remove signed-in restrictions at the database level for regional portal data
Add one final Supabase migration that gives every authenticated user full access to the core tables the regional portal reads and manipulates, not only certificates:

- `profiles`, `regions`, `members`, `user_roles`, `regional_roles`, `regional_user_roles`
- `events`, `attendance_events`, `attendance_records`
- `dcgs`, `dcg_members`, `locations`
- `communications`, `communication_templates`
- `financial_transactions`, `financial_transaction_categories`, `donors`, `fundraising_campaigns`, `fundraising_donations`
- `discipleship_relationships`, `discipleship_progress`
- `regional_plans`, `regional_plan_targets`, `regional_plan_initiatives`, `member_targets`
- `certificates`, `certificate_templates`

Technical detail: I will keep RLS enabled, but add unconditional policies for `authenticated` users plus explicit Data API grants, so signed-in users are no longer blocked by role, region, or admin criteria. Public/anonymous access will not be widened beyond existing public-facing behavior.

### 2. Make regional login write a safe fallback session immediately
Update `RegionalAuth` so that after successful password login it stores the authenticated user immediately and writes a regional bootstrap even if profile/member region lookup fails. If no region can be resolved, the dashboard should still render the portal shell instead of blanking.

### 3. Make the regional session provider never block rendering
Update `RegionalSessionProvider` so:

- It becomes ready after initial `getSession()` completes, even without a region.
- It ignores all non-explicit `SIGNED_OUT` and null-session events in the development preview.
- It never clears portal state unless the user clicks the logout button.
- It can use a fallback/default active region only for display and query scoping when the user has no assigned region.

### 4. Prevent regional dashboard/data errors from blanking the portal
Harden the regional dashboard entry and high-risk hooks so failed queries return safe empty data instead of throwing into error boundaries during startup. The portal shell, sidebar, and page header must remain visible even when a data request fails.

### 5. Validate the fix
After implementation, verify:

- Active policies/grants show unrestricted authenticated access for the regional portal tables.
- Recent auth logs show login success without forced sign-out.
- The regional dashboard route renders the shell and does not redirect to `/auth/regional` after login.
- Certificate upload/manipulation remains unrestricted for all signed-in users.