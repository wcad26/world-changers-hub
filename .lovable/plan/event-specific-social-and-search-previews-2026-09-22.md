# Event-specific social and search previews

## Goal
Upgrade the app to server-rendered pages, then make every public event URL expose the event’s own title, description, image, and canonical URL to search engines and social platforms.

## Implementation
1. Migrate the current React/Vite app to Lovable’s TanStack Start template while preserving public pages, member portals, admin portals, authentication behavior, bilingual content, and existing URLs.
2. Add server-side event lookup for `/events/:eventId`, supporting both current slugs and UUIDs while keeping old-slug redirects.
3. Generate event metadata from the loaded event:
   - Title: localized event name, with the organization name as a suffix.
   - Description: localized event description, reduced to safe plain text and a suitable preview length.
   - Image: the event’s active-language hero image, falling back to its main event image, then the site default only when no event image exists.
   - Canonical and `og:url`: the event’s own URL on `https://wcaglobal.org`.
   - Open Graph and X/Twitter tags: matching title, description, image, and large-image card.
4. Keep normal page rendering connected to the same event data so visible content and metadata cannot disagree.
5. Preserve the current sitewide metadata as the fallback for non-event pages.

## Validation
- Verify `/events/wca-yaounde-annual-retreat` returns its event title, description, and image in the initial HTML without JavaScript.
- Verify another event automatically receives its own metadata without event-specific hardcoding.
- Verify a missing event and an event without an image use safe fallbacks.
- Check desktop and mobile rendering, slug redirects, navigation, authentication, and build output.

## Publishing note
The live social and search preview changes will appear only after the upgraded app is published. Platforms may retain an older preview until they re-fetch the URL.
