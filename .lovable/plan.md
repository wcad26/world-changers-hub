## Goal
Stop the regional portal from blanking and returning to `/admin/regional/dashboard` when the user opens other regional pages in the development preview.

## What I found
- Regional routes are wrapped by `RegionalErrorBoundary`.
- That boundary currently has a `Go to dashboard` callback wired in `RegionalSessionRoute`.
- In Lovable preview, a page-level render/query error or transient regional context issue can produce a blank-page recovery cycle; because the recovery target is the dashboard, the user gets bounced back instead of seeing the page they selected.
- The regional session provider is already sticky and does not intentionally redirect on transient auth null states, so the fix should focus on route recovery and page-level loading/error behavior, not reworking auth again.

## Plan
1. **Remove automatic dashboard recovery from regional page errors**
   - Update `RegionalSessionRoute` so it no longer passes `onGoHome={() => navigate('/admin/regional/dashboard')}` into the error boundary.
   - Keep the boundary reset key as the current pathname so moving between pages clears stale page errors.

2. **Make the regional error boundary non-redirecting**
   - Adjust `RegionalErrorBoundary` so recovery never navigates away from the page the user clicked.
   - If a page fails, show the inline error card with a retry action only, so the URL and selected sidebar item remain on the intended page.

3. **Harden transient regional-session recovery**
   - Keep the existing sticky regional bootstrap/session behavior.
   - Ensure transient provider/context errors only reset in place and never push the user to the dashboard or login.

4. **Validate the routing behavior**
   - Use the preview/browser tools to open regional pages like Members, Events, Finance, DCG, and Communication.
   - Confirm the current URL stays on the selected page, no blank screen persists, and no automatic dashboard navigation occurs.