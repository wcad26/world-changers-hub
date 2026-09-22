# Home Page Rebuild — Heritage Modernism

## Goal
Completely replace the current generic, card-heavy home page with a distinctive, image-led Heritage Modernism experience. Keep the established WCA plum, teal, graphite, and soft-gray themes, Sora–Manrope typography, shared navigation/footer, and the exact existing vision and mission statements.

## Page structure
1. **Immersive opening**
   - Replace the oversized empty split screen and logo card with a full-width, people-focused WCA photograph.
   - Place the main WCA message directly over the image with strong contrast and two clear actions: learn about WCA and find a location.
   - Keep the first screen compact enough to reveal the next section on mobile and desktop.

2. **Vision and mission centerpiece**
   - Give the unchanged, database-driven vision and mission wording the visual prominence of the selected Heritage Modernism direction.
   - Use an asymmetric editorial composition: a light vision surface paired with a deep plum/graphite mission surface, adapted into a clean vertical sequence on mobile.
   - Retain the three existing mission pillars and their supporting points, but present them as a connected progression rather than three generic cards.

3. **WCA community pathways**
   - Replace the six equal service cards with a curated, image-led pathway into locations, events, media, counseling, resources, and fundraising.
   - Emphasize the most useful actions on mobile while preserving every existing destination.

4. **A richer story of WCA**
   - Add a concise “Who we are” editorial story using existing approved content, paired with authentic community imagery.
   - Introduce a “How transformation happens” journey connecting fellowship, training, leadership, service, and community impact without inventing statistics.
   - Add a strong locations preview that makes Douala, Yaoundé, Buea, Kaélé, North America, and Europe feel like one connected movement.
   - Surface the most relevant current initiative or fundraising campaign only when real database content exists.
   - Include a compact latest-resource or media highlight using existing content; gracefully hide it when no suitable item exists.

5. **Live events showcase**
   - Continue using database-backed featured events.
   - Introduce one prominent featured event with supporting events in a compact editorial list instead of a repetitive three-column card grid.
   - Preserve dates, times, locations, images, loading, empty, and error states.

6. **Transformation and connection**
   - Restyle the current testimonial content as an editorial quote section, without inventing claims or statistics.
   - Rework the newsletter area into a concise final invitation that retains the current fields and database-configured copy.

## Visual and interaction rules
- Mobile-first, with deliberate layouts for phone, tablet, and desktop.
- Support both light and dark mode through existing semantic design tokens.
- Use authentic existing WCA imagery where suitable; generate a cohesive replacement image only if the available assets cannot support the new opening.
- Avoid split-screen logo cards, large dead space, nested cards, decorative orbs, excessive gradients, invented metrics, and generic icon grids.
- Use restrained scroll reveals and image movement, with reduced-motion support.
- Add premium depth through gentle floating media, layered image movement, and subtle section transitions rather than decorative effects everywhere.
- On pointer devices, allow restrained cursor-responsive image tilt, soft parallax, and magnetic emphasis on selected primary actions; disable these effects on touch devices and when reduced motion is requested.
- Keep all gestures lightweight, non-blocking, keyboard-accessible, and isolated from data loading so the page remains fast.
- Use a controlled sticky storytelling moment where it adds meaning, but keep normal scrolling predictable on mobile.
- Preserve bilingual and database-driven homepage content wherever it currently exists.

## Scope protection
- Rebuild only the public home page and its home-specific sections.
- Do not alter portals, permissions, routes, database behavior, event logic, or shared header/footer functionality.
- Keep the exact vision and mission statements; prototype sample wording will not be used.
- New homepage information must come from existing approved content or real database records. Any new factual copy will be presented for approval rather than published as fact.

## Verification
- Check the rebuilt page at mobile, tablet, and desktop widths in light and dark mode.
- Confirm all home-page links, event data, content loading, theme switching, and newsletter controls remain functional.
- Measure interaction smoothness and confirm floating/cursor effects never delay taps, scrolling, or content display.
- Verify no horizontal overflow, text overlap, broken images, runtime errors, or build errors.
