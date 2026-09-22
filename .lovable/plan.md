# Restore the WCA home page

## Confirmed issue

- The published site currently returns an HTTP 500 response for `/`, `/about`, `/locations`, and `/events` before React can render the page.
- The current local preview serves the home page successfully and the latest build reports success.
- This is therefore a published server-rendering/runtime failure, not a visual defect isolated to the home-page sections.

## Repair plan

1. **Identify the production-only crash**
   - Inspect the published server failure and the custom TanStack server entry/error wrapper.
   - Reproduce the production rendering path locally where possible and isolate the first incompatible import or thrown response.

2. **Restore reliable page delivery**
   - Replace or correct the failing custom server-entry path using the standard TanStack Start server flow.
   - Keep the branded failure page only as a true fallback, without allowing it to replace valid page responses or API errors.
   - Preserve existing routes, authentication behavior, database rules, and the approved homepage design.

3. **Make Home resilient and fast**
   - Preload the homepage content and featured events through the existing server-safe public data layer rather than starting separate browser-only database requests after render.
   - Render approved fallback content if optional homepage data is unavailable, so a temporary content request cannot take down the page.
   - Keep the current vision, mission, slogan, layout, theme, and mobile presentation unchanged.

4. **Remove hydration risks affecting first render**
   - Ensure browser-only cached authentication, language, theme, and current-time filtering do not produce different initial server and browser markup.
   - Address the recorded server/browser text mismatch without changing portal permissions or navigation behavior.

5. **Verify before completion**
   - Confirm direct refresh and internal navigation for Home, About, Locations, Events, and one regional page.
   - Test the home page on phone, tablet, and desktop in light/dark mode and French/English.
   - Confirm database-backed homepage content and featured events appear, with no 500 responses, blank screens, hydration errors, console errors, or horizontal overflow.
   - Recheck the production-compatible build and published URL response before reporting the repair complete.

## Scope

This repair targets page delivery and homepage data loading. It will not redesign the approved homepage or change database content, permissions, calculations, or portal workflows.
