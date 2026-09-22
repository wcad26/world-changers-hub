# Restore page routing and database loading

## Confirmed causes

- The database still contains the Yaounde retreat and its public event content. The data was not deleted.
- Several pages became both a page and a parent during the recent framework upgrade. Their child pages cannot render because the parent shows its own page instead of the child outlet. This is why `/events/wca-yaounde-annual-retreat` currently shows the events list, and the same structural problem affects fundraising, locations, member, DCG, and admin sections.
- Portal parent paths redirect unconditionally, so requests for child pages can be redirected away before their content loads.
- The event metadata loader queries through the browser database client during server rendering, then the page requests the same event again in the browser. This is fragile and duplicates work.
- The Locations page makes a DCG-to-profile relationship request that PostgREST reports does not exist, producing a live database error.
- The screenshot’s global error page followed a failed client-module request while the stylesheet compiler was failing. The current build is green, but the stale/error-prone loading path must be removed and verified in a fresh browser session.

## Implementation

1. **Repair the route hierarchy**
   - Convert every route that owns child pages into a true layout that renders its child outlet.
   - Move the existing list/dashboard content into matching index routes so `/events`, `/locations`, `/fundraising`, and portal landing pages keep their current screens.
   - Replace unconditional parent redirects with index-only redirects, preserving the existing portal access wrappers and permissions.

2. **Make initial database reads server-safe and efficient**
   - Move the public event lookup into a server function using a server-safe publishable Supabase client.
   - Prime TanStack Query from the route loader and reuse that result in the event page instead of requesting the same event twice.
   - Preserve slug-history redirects, public visibility rules, bilingual fields, hero images, and event-specific social/search metadata.
   - Keep signed-in portal reads attached to the real Supabase session and protected by existing row-level permissions.

3. **Fix confirmed data-query failures**
   - Replace the invalid DCG-to-profile nested relationship query with queries that follow the actual member/profile relationships.
   - Audit representative Events, Locations, Fundraising, Regional, Super Admin, DCG, and Member screens for failed or silently swallowed database requests.
   - Show clear page-level retry/error states where a data request genuinely fails instead of falling back to an empty list.

4. **Stabilize the shared page shell**
   - Put the document shell in the framework’s proper shell boundary and retain the global branded error page.
   - Remove the remaining stylesheet compilation hazard and ensure client assets load after refresh and navigation.
   - Add unique required metadata to content routes while preserving event-specific metadata on event detail pages.

5. **Verify the recovery**
   - Check the build and strict type validation.
   - Test all public route families directly and through in-app navigation on desktop and mobile.
   - Test authenticated Regional, Super Admin, DCG, and Member routes with a real session, including refresh and database-backed lists.
   - Confirm no page shows the global failure screen, no parent page masks a child page, key requests return data, and browser/runtime logs contain no new errors.

## Scope note

This repairs the framework-upgrade regressions and existing failed reads; it does not redesign the pages or change database records and permissions unless a verified access rule is itself incorrect.