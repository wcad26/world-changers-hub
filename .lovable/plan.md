# Rebuild the public event details page

## Design direction

Rebuild the page as an immersive, dark event experience using the selected composition:

- Refine WCA’s current purple-to-teal identity rather than replacing it.
- Use **Sora** for headings and **Manrope** for body copy.
- Treat the uploaded event artwork as the visual anchor, with a dark tonal overlay for readable information.
- Use crisp glass surfaces, restrained glow, strong contrast, 8px-or-less corners, and subtle motion.
- Build mobile first, then expand into a wider editorial layout for tablets and desktops.

## First viewport

- Create a cinematic, edge-to-edge event image area with status/category badges and accessible carousel controls when multiple images exist.
- Place the event name, date, time, location, and primary action directly in the first viewport without hiding the artwork.
- Prioritize **Pre-register/Register**, then WhatsApp contact; completed events switch to **Share feedback**.
- Add a compact share action and a persistent mobile action bar that clears the fixed bottom navigation.
- Replace the current separate hero and gradient information band with one coherent visual introduction.

## Event information architecture

Restructure the rest of the page into a clear public event journey:

1. **At a glance** — start/end dates, time, venue, full address, capacity, category, and event status.
2. **About** — localized description in a readable editorial layout.
3. **What to expect** — show configured special-event services such as lodging, meal preferences, and pledge/support collection; hide the section when none apply.
4. **Registration** — use the current pre-registration route and external registration link; surface that fees are calculated for each attendee or qualifying family during registration, without exposing misleading legacy event cost fields.
5. **Requirements** — show localized event requirements only when supplied.
6. **Speakers, gallery, testimonials, related events, and FAQs** — restyle each existing data-driven section into the same visual system and omit empty sections.
7. **Completed events** — emphasize feedback instead of registration.

## Mobile, tablet, and desktop behavior

- **Mobile:** single-column reading flow, compact metadata rows, swipeable media, thumb-reachable sticky action bar, and `pb-24` clearance.
- **Tablet:** two-column information groups with prominent artwork and balanced section spacing.
- **Desktop:** wide editorial composition with the main story on the left and a sticky registration/details panel on the right.
- Prevent image, title, button, and long-location overflow at all supported widths.
- Respect reduced-motion settings and maintain keyboard-visible focus states.

## Component work

- Recompose `EventDetail` around the new page structure and state-specific actions.
- Rebuild the hero and sticky quick-information behavior to match the selected dark direction.
- Modernize the about, registration, speakers, gallery, testimonials, related-events, and FAQ presentations without changing their data sources.
- Add small focused presentation components for the metadata, special-event features, requirements, sharing, and mobile action bar where this keeps the page maintainable.
- Remove fallback testimonials that were not created for the event; an empty testimonial section should not invent public endorsements.

## Design system and language

- Add event-page semantic surface, overlay, border, gradient, and shadow tokens to the shared theme, with light/dark-safe contrast.
- Add Sora and Manrope through the document font link and expose them through the theme configuration.
- Replace raw page-level colour values with semantic tokens and existing button variants.
- Keep English/French selection through the existing language system and localize all newly introduced public labels.
- Keep internal navigation on React Router links.

## Verification

- Check an upcoming special event, an ordinary event, a completed event, and sparse/empty optional sections.
- Verify pre-registration, external registration, WhatsApp, sharing, feedback, gallery navigation, FAQs, and related-event links.
- Visually test at representative mobile, tablet, and desktop widths, including long translated text and long venue names.
- Confirm loading and not-found states match the redesign, browser console stays clean, and the preview build passes.

## Scope

This rebuild changes the public presentation and uses event information already stored by event creation and management. It does not change registration rules, fee calculations, event creation forms, reporting, or finance logic.
