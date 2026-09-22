# Fast Public Pages + About and Locations Rebuild

## Goal
Make `/about`, `/locations`, and the rest of the public website open quickly and reliably, then rebuild About and Locations in the same **Heritage Modernism** visual language as the new homepage.

The existing vision, mission, values, history, leadership, location records, bilingual behavior, links, and admin-managed content remain authoritative.

## 1. Fix loading reliability first

- Replace the About page’s full-screen client-only loading gate with route-level data preparation, cached delivery, and content-first fallbacks so the page shell and meaningful content appear immediately.
- Move public About and Locations reads into server-safe query functions and prime TanStack Query in each route before rendering.
- Add explicit timeout, retry, empty, and error behavior. A slow database response must never leave an endless spinner.
- Remove duplicate or unnecessary browser requests and request only fields each public page displays.
- Replace the Locations page’s sequential location → DCG → member-count request chain with a bounded, consolidated read or parallelized queries.
- Ensure public reads do not wait for portal authentication/profile lookups.
- Keep cached data visible during background refreshes rather than blanking an already rendered page.

## 2. Rebuild `/about` in Heritage Modernism

- Use an image-led, full-width opening consistent with the homepage, with concise WCA identity copy and clear links to Locations and Events.
- Recompose the existing content into an editorial story:
  - who WCA is and why it exists;
  - the unchanged vision and mission;
  - core values in a restrained, scannable arrangement;
  - the WCA journey as a strong chronological narrative;
  - leadership as an image-led editorial roster with accessible expandable biographies;
  - a final invitation to find a community or contact WCA.
- Remove the old generic glass-card grid, decorative circles, oversized loader, and legacy gray/purple utility styling.
- Use WCA Heritage semantic colors, Sora/Manrope, compact corners, balanced light/dark presentation, and the homepage’s editorial spacing.
- Add subtle image depth, pointer movement, and reveal motion only where useful; disable them for touch devices and reduced-motion visitors.
- Preserve database-managed content and gracefully handle partially configured fields or missing images.

## 3. Rebuild `/locations` in the same design language

- Replace the unrelated purple/pink magazine treatment with a full-width WCA Heritage introduction that immediately communicates the global network and live location totals.
- Create a fast, mobile-first location finder with:
  - immediate search;
  - WCA Center / DCG Home filtering;
  - region filtering;
  - visible result count and one-action reset;
  - compact, accessible controls that remain usable on narrow screens.
- Redesign location results as clean editorial cards using actual location imagery and practical information first: type, region, address, meeting time, contact, directions, and regional page.
- Remove non-functional donation actions and placeholder contact behavior from public cards.
- Use stable image dimensions, lazy loading below the first viewport, and responsive image handling to prevent layout shifts.
- Preserve the existing `/locations/:slug` navigation and all real database records.

## 4. Public-site performance pass

Audit every public route and apply the same reliability baseline without redesigning pages outside About and Locations:

- route-level query preloading for initial public data;
- no `useEffect`-driven initial fetching;
- no full-page indefinite spinners;
- consistent skeletons, empty states, and retry actions;
- shared query keys and caching to prevent duplicate requests during navigation;
- lazy loading for non-critical sections and images;
- stable media dimensions and one prioritized first-viewport image per page;
- remove avoidable large imports from first-load page bundles;
- verify parent routes render child pages correctly and do not mask errors.

Priority routes: Home, About, Locations, Events, event details, Fundraising, campaign details, Blog, Media, Store, Counseling, Privacy, and Terms.

## 5. Language, metadata, and accessibility

- Deliver visible About and Locations interface text in French when the browser/device is French, while honoring an explicit user language choice.
- Use existing French database fields where available and safe French fallbacks for interface labels.
- Keep unique route metadata for both pages; use a meaningful absolute page image for social previews when the data supplies one.
- Preserve keyboard navigation, visible focus states, semantic headings, useful alternative text, and adequate contrast in both themes.

## 6. Verification

- Measure first render and navigation behavior for `/about` and `/locations`, including slow-network and failed-request cases.
- Verify all public routes return successful server-rendered content and do not show the global error page.
- Test mobile (390px), tablet (834px), and desktop (1280px) in light and dark modes.
- Test English and a French browser locale.
- Confirm search, filters, expandable biographies, internal links, directions, and contact actions work.
- Check for horizontal overflow, layout shifts, missing images, hydration warnings, duplicate requests, console errors, and runtime errors.
- Finish only when the build is clean and every tested public page has a usable non-blocking loading/error state.

## Technical approach

- TanStack route loaders will prime TanStack Query with `ensureQueryData`; page components will consume the same cached query definitions.
- Public data helpers will return small serializable objects and use public/RLS-safe access only.
- Query stale times will favor fast back-navigation while retaining background freshness.
- About and Locations will reuse the homepage’s semantic design tokens and interaction utilities rather than introducing a separate palette or visual system.
