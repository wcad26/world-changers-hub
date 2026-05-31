## Plan

1. **Fix certificate database permissions**
   - Replace the restrictive certificate table RLS rules that depend on `regional_admin`, `super_admin`, and matching regions.
   - Allow every signed-in user to view, create, update, soft-delete, reinstate, and permanently delete certificate records and certificate templates.
   - Keep public certificate verification working for active certificates.

2. **Fix certificate storage permissions**
   - Recreate storage rules for both buckets:
     - `certificate-templates`
     - `certificates`
   - Allow every signed-in user to upload, replace, and delete files in those buckets.
   - Keep public read access so templates/certificate images can still display and download.

3. **Prevent blank-screen crashes on certificate pages**
   - Add safe error handling around the certificate queries in the regional/super certificate pages so an RLS/storage error shows a normal page state instead of crashing the portal.
   - Do not add any route/login restrictions; portal guards remain pass-through as required.

4. **Validate the fix**
   - Re-check the active RLS policies after the migration.
   - Confirm certificate table and storage access no longer depends on regional role checks.

## Technical details

- Migration will update only existing RLS/storage policies; no new tables are needed.
- Target tables: `public.certificates`, `public.certificate_templates`.
- Target storage policies: `storage.objects` policies for `certificate-templates` and `certificates` buckets.
- Frontend changes will be limited to certificate-page error resilience if needed after the policy change.