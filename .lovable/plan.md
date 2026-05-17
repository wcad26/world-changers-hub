I’ll fix this as an app-wide auth/session race, not only a DCG issue.

## Plan

1. **Create one stable portal session pattern**
   - Make protected portal guards use the already-mounted auth/session provider instead of each guard starting separate `supabase.auth.getSession()` and `onAuthStateChange()` flows.
   - Apply this to:
     - DCG portal
     - Member portal
     - Super Admin portal
     - Regional portal session handling

2. **Make redirects conservative**
   - Do not redirect to login on a transient `null` session during startup.
   - Keep the user on a loading screen while the session is restoring.
   - Only redirect after Supabase session restoration has clearly completed and there is still no user.
   - Treat data-fetch failures as page errors/retry states, not as logout reasons.

3. **Harden `AuthProvider`**
   - Ensure `authReady` means the Supabase session has been restored, not just that an auth event fired.
   - Do not clear the user from early `INITIAL_SESSION` / empty events unless it is a real `SIGNED_OUT` event or final confirmed no-session state.
   - Keep profile, region, member, and DCG lookups best-effort, but expose loading/ready states so pages can wait for critical context.

4. **Fix portal-specific loading gates**
   - **DCG:** dashboard waits for authenticated user + current DCG resolution before running DCG dashboard queries.
   - **Regional:** dashboard waits for regional session/bootstrap/region context before showing the dashboard, instead of rendering with missing context or bouncing out.
   - **Member:** dashboard waits for auth-ready + member/profile context where required.
   - **Super Admin:** dashboard waits for auth-ready before report queries start.

5. **Standardize no-access vs loading**
   - Loading state: session/context is still being restored.
   - No-access state: authenticated session exists, but the required portal context truly does not exist.
   - Login redirect: only when there is confirmed no authenticated session.

6. **Prevent stale failed queries after logout/login changes**
   - Clear or isolate React Query cache on true sign-out only.
   - Include user/portal identifiers in query keys where needed so old portal queries cannot poison a fresh login.

7. **Validate after implementation**
   - Check Vite/dev-server logs for compile/runtime errors.
   - Check browser console and network signals for auth/logout loops.
   - Confirm portal dashboards show either loading, data, or a clear access/error state — never a blank page and never automatic logout during session restoration.

## Technical notes

Likely files to update:
- `src/contexts/AuthProvider.tsx`
- `src/components/auth/DcgSessionRoute.tsx`
- `src/components/auth/MemberProtectedRoute.tsx`
- `src/components/auth/SuperAdminSessionRoute.tsx`
- `src/contexts/RegionalSessionContext.tsx`
- Dashboard entry points for DCG, Regional, Member, and Super Admin where queries currently begin before critical session context is settled.

No database changes are expected for this fix.