# Regional Pages: Fast Loading + Heritage Modernism Rebuild

Applies to every regional page at `/locations/<region>` (e.g. `/locations/wca-usa`, `/locations/wca-douala`).

## What's wrong today

Verified in the code:

- The page waits for the region before it can even start loading anything else: it first downloads **every** region in the database, matches the name in the browser, and only then fires three more separate requests (locations, DCG homes, events). That chain is why the page sits on "Loading regional information..." for so long.
- The DCG request alone makes up to four extra round-trips (groups, leaders, members, family links) just to show a count.
- There is no server-side preparation for this page, so nothing arrives with the first paint and social/search previews show generic site info instead of the region.
- The design is the old style: fixed full-screen photo slider, plain white blocks, Unsplash stock photos, a decorative empty circle behind the leader, and an inactive "Explore Events" button.

## Speed plan

1. Add one server-prepared request that returns everything the page needs in a single trip: region details, its locations, its DCG homes (with counts computed in the database), and its upcoming events.
2. Look up the region by name directly instead of downloading all regions.
3. Prepare that data on the server before the page is sent, so the region name, photos and content are in the very first paint — no spinner.
4. Cache it briefly (about 5 minutes) so repeat visits and back-navigation are instant.
5. Give the page its own social/search preview: region name, description, and the region's own hero image.

## New design (same language as the homepage)

Heritage palette, Sora/Manrope type, glass cards, restrained motion, mobile-first. Sections in order:

1. **Editorial hero** — region's own hero images (mobile/tablet/desktop sets already stored), region name, short description, established year, and two real actions: "Register as a visitor" and "See upcoming events" (scrolls to events). Falls back to a branded gradient when the region has no images, instead of stock photos.
2. **At a glance strip** — established year, DCG homes, locations, upcoming events, each as a compact stat card.
3. **About this region** — region description alongside the regional president's photo and title; the decorative empty-circle treatment is dropped. Hidden gracefully when the region has no president on file.
4. **Upcoming events** — editorial cards matching the events page: date block, title, time, venue, link through to the event page. Empty state instead of an empty carousel.
5. **Meeting places** — the region's locations as cards with address, fellowship times, directions, WhatsApp and contact, in the same card style as the rebuilt Locations page (2 per row mobile, 3 tablet, 4 desktop).
6. **DCG homes** — the region's Deeper Christian Groups with meeting day/time, area and member count.
7. **Contact & visit** — phone, email, address, and a clear "Plan your visit" call to action.
8. **Footer CTA** — keep the newsletter capture, restyled.

Everything is bilingual (English/French) and works in both light and dark mode. Region content stays exactly as stored in the database — nothing invented.

## Technical notes

- New `getPublicRegionPage({ slug })` in `src/lib/public-site.functions.ts`, using the existing non-session public client, resolving the slug server-side and returning `{ region, locations, dcgs, events }` in one payload; matching `publicRegionPageQueryOptions(slug)` with 5-minute stale time.
- DCG member counts move to a small read-only database function so the browser no longer chains four requests.
- `src/routes/locations.$slug.tsx` gains a `loader` (`ensureQueryData`), region-specific `head()` (title, description, `og:image`/`twitter:image` from the region hero when it is an absolute URL), plus `errorComponent` and `notFoundComponent`.
- `src/pages/RegionalBranchHome.tsx` rebuilt against `useSuspenseQuery`; no loading spinner path. `useRegionBySlug` and the `useRegionalData` hooks stay for the admin portals but the public page stops using them.
- Verified at 390 / 834 / 1280 px, light and dark, English and French, with build and type checks.
