## Dedicated Attendance Login

Add a standalone login page for staff who only need to record attendance, so they can skip the Super Admin / Regional Admin portals entirely.

### Routes
- `/attendance/login` — new standalone login page (no admin chrome, no bottom bar).
- `/attendance/scan` — existing scanner page, already outside admin layouts.

### Behavior
1. **Auto-redirect on existing session**: On mount, if `supabase.auth.getSession()` returns a user, immediately navigate to `/attendance/scan`. This lets someone already signed into any portal in the same browser skip the form.
2. **Login form**: Simple email + password, mobile-first, matching the visual language of `MemberAuth` / `SuperAuth` but stripped down (no signup, no password reset link — this is a staff utility page).
3. **Authorization check after sign-in**: After a successful `signInWithPassword`, verify the user has either:
   - a `super_admin` role in `user_roles`, OR
   - any active role in `regional_user_roles`.
   
   If neither, sign them back out and show an inline error: "Your account doesn't have attendance access. Ask an admin to grant you a Super Admin or Regional Admin role." If authorized, navigate to `/attendance/scan`.
4. **Scanner page tweak**: Add a small "Sign out" button in the sticky header of `AttendanceScan.tsx` that calls `supabase.auth.signOut()` and returns to `/attendance/login`, so shared devices can hand off between staff without visiting an admin portal.

### Files
- **New**: `src/pages/AttendanceLogin.tsx` — the login page.
- **Edit**: `src/App.tsx` — register `/attendance/login` (public, no layout wrapper, alongside the existing `/attendance/scan` route).
- **Edit**: `src/pages/admin/AttendanceScan.tsx` — add the sign-out control in the header.

### Notes
- No database changes. Authorization is a read-only check against existing `user_roles` and `regional_user_roles` tables.
- No changes to badge generation or the scan resolver — the scanner already works end-to-end for any signed-in user with the right role, since the edge functions use `verify_jwt = true`.
