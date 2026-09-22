# Revamp the WCA brand system across the website and portals

## Locked design direction

- Use the selected **Regal modern portal** composition: dark, dignified framing; clear operational hierarchy; compact controls; restrained glow; and strong active states.
- Keep the selected **WCA Heritage** palette across both themes:
  - Plum `#572A4E` — primary actions, active navigation, key highlights
  - Teal `#477A78` — secondary emphasis, positive/supporting states
  - Graphite `#242329` — dark surfaces and high-contrast text
  - Soft gray `#EEF0F2` — light surfaces and quiet section bands
- Use **Sora** for headings and **Manrope** for body and interface text. The selected prototype controls composition, not its sample fonts or colors.
- Preserve the WCA logo, current bilingual content, route structure, permissions, data rules, and existing workflows.

## Phase 1 — Shared brand foundation

1. Rebuild the light and dark semantic color tokens for backgrounds, elevated surfaces, borders, text, plum/teal actions, status colors, charts, focus rings, overlays, and shadows.
2. Add the theme provider and a persistent light/dark/system selector in public navigation and every portal shell.
3. Standardize Sora/Manrope typography, spacing, compact 8px-or-less radii, focus treatment, icon sizing, and reduced-motion behavior.
4. Restyle the shared building blocks first: buttons, inputs, selects, tabs, badges, cards, tables, alerts, skeletons, popovers, sheets, tooltips, pagination, and toasts.
5. Bring all dialogs into the existing WCA glass-dialog standard while replacing unrelated purple/blue/gray hardcoding with semantic brand roles.
6. Remove duplicated legacy presentation helpers only after their callers use the new shared components.

## Phase 2 — Header, footer, and public frame

1. Consolidate the overlapping public header/navigation implementations into one bilingual component.
2. Build the selected regal sticky header with clear current-page state, compact contact actions, language and theme controls, a mobile menu, and a stronger Visit Us action.
3. Rebuild the footer as a dark graphite/plum information band in both themes, retaining WCA locations, contact details, resources, legal links, and social links.
4. Create reusable public page headings, dark feature bands, section headers, content grids, empty states, and calls to action so pages remain visually consistent.

## Phase 3 — Flagship public pages

1. **Home:** replace the current sparse split presentation with an image-led WCA introduction, then restyle Mission, Features, upcoming events, testimonials, and newsletter sections.
2. **Events list:** apply the selected dark event-search composition, responsive filter controls, branded event cards, and clear upcoming/past sections.
3. **Event detail:** retain the recently rebuilt mobile-first event experience, aligning its surfaces, actions, typography, status badges, carousel, registration panel, and mobile action bar with the new tokens.
4. Verify English and French layouts, long titles/locations, empty states, image fallbacks, and mobile controls before moving to the remaining public pages.

## Phase 4 — Remaining public journeys, page by page

1. **About** and **Locations:** standardize editorial sections, leadership/location cards, regional details, maps, and visit/register actions.
2. **Regional branch pages:** align local information, events, contacts, and registration actions with the public WCA frame.
3. **Fundraising:** redesign campaign listing, campaign detail, pledge, and donation screens as one coherent journey with distinct pledge and payment messaging.
4. **Event participation:** align pre-registration, feedback, self-attendance, attendance login/scan, and certificate verification screens.
5. **Registration and profile:** align member registration, visitor registration, and profile update forms, including validation, progress, success, and failure states.
6. **Authentication:** apply one recognizable WCA sign-in system to Member, Regional, Super Admin, DCG, password reset, portal selector, and unauthorized screens.
7. **Resources and legal:** restyle Blog, Media, Store, Counselling, Privacy, Terms, Coming Soon, and Not Found without inventing unavailable content.

## Phase 5 — One portal shell for every role

1. Consolidate the duplicated Admin and Regional shell presentation into one reusable portal frame while retaining each portal’s navigation and permissions.
2. Apply the same frame to **Super Admin**, **Regional Admin**, **DCG**, and **Member** portals: branded sidebar, compact top bar, page title/actions, user menu, theme control, and consistent content width.
3. Keep mobile/tablet bottom navigation and the required `pb-24` clearance; simplify selected states and ensure labels fit.
4. Preserve the existing pass-through session guards and all access behavior; this phase changes presentation only.

## Phase 6 — Portal dashboards

1. **Super Admin dashboard:** clarify global/region filters, KPI hierarchy, chart legends, trends, targets, loading, and partial-error states.
2. **Regional dashboard:** mirror the same information hierarchy while preserving regional scope, member/visitor/child rules, event filters, and target calculations.
3. **DCG dashboard:** use a compact operational overview for members, events, attendance, and finances.
4. **Member dashboard:** create a warmer personal overview for next event, attendance, giving, discipleship, fundraising, and media.
5. Standardize chart colors and tooltips so every chart remains readable in both themes and does not rely on color alone.

## Phase 7 — Portal work areas by shared page pattern

Apply each pattern across portals before moving to the next, which avoids redesigning the same interface repeatedly:

1. **People:** Super/Regional/DCG member lists, member profiles, user management, family relationships, transfers, and approvals.
2. **Events:** Super/Regional/DCG event lists and forms, attendance management, scanners, recurring series, special-event settings, reports, feedback, and certificates.
3. **Finance and fundraising:** global/regional/DCG ledgers, donations, pledges, campaigns, reports, currencies, and exchange rates; retain distinct registration-fee and pledge records.
4. **DCG and discipleship:** DCG lists/profiles, attendance, finances, disciple assignment, progress, and mentoring views.
5. **Communication and planning:** messages, audience controls, plan targets, filters, reports, and exports.
6. **Settings and access:** regional settings, Super Admin settings, role management, permission summaries, pending access, homepage settings, About settings, and location management.
7. For every work area, standardize the title row, primary action, filters, tabs, KPI cards, tables/cards, row actions, empty/loading/error states, and related dialogs.

## Phase 8 — Efficiency and accessibility pass

- Replace remaining hardcoded visual colors with semantic tokens; preserve genuine status meaning for success, warning, danger, and information.
- Remove unnecessary blur, oversized shadows, excessive gradients, and nested cards; keep effects concentrated in navigation, key actions, and dialogs.
- Keep large data views dense and scannable, use mobile card alternatives where tables cannot fit, and avoid layout shifts while data loads.
- Confirm keyboard navigation, visible focus, contrast, touch targets, text wrapping, French expansion, reduced motion, and screen-reader labels.
- Resolve the currently recorded root hydration mismatch before declaring the visual rollout complete.

## Verification and rollout gates

After each phase, verify representative mobile, tablet, desktop, light, and dark screens before continuing. The final pass will cover:

- Public routes and their database-backed content, including direct refresh and internal navigation.
- Member, DCG, Regional Admin, and Super Admin routes with authenticated sessions and preserved permissions.
- Forms, dialogs, tables, charts, uploads, filters, exports, event registration, attendance, finance, and access-management workflows.
- Unique page metadata, English/French display, no horizontal overflow, no overlapping fixed navigation, no new browser errors, and a clean preview build.

## Scope

This is a presentation-system rebuild. It will not change database structures, calculations, registration rules, attendance rules, access permissions, or other business logic unless a separate verified defect blocks a page from rendering.