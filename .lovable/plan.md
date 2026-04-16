
Goal: make the dashboard filter section permanently fixed while only the dashboard content below it scrolls.

What I found:
- The selected filter section is hardcoded in `src/pages/admin/regional/Dashboard.tsx`.
- Right now it sits inside the same scrolling content flow as the KPI cards/charts.
- `sticky` alone is not enough here because the dashboard page is still being rendered inside the `main` scroll container from `src/components/admin/AdminLayout.tsx`.

Implementation plan:

1. Update `src/components/admin/AdminLayout.tsx`
- Make the regional dashboard route use a route-specific `<main>` layout.
- For `/admin/regional/dashboard`, switch `<main>` from page-scrolling to `overflow-hidden` so the page itself can own its internal scroll behavior.
- Keep current scroll behavior unchanged for all other admin pages.

2. Rebuild the top-level layout in `src/pages/admin/regional/Dashboard.tsx`
- Replace the current single scrolling column with a two-part shell:
```text
Dashboard shell
├─ Fixed filter bar (never scrolls)
└─ Scrollable content area (KPIs, charts, cards)
```
- Use a full-height flex layout such as:
  - outer wrapper: `h-full min-h-0 flex flex-col`
  - filter bar: `shrink-0`
  - content area: `flex-1 min-h-0 overflow-y-auto`

3. Move the filter bar out of the scrolling section
- Remove reliance on `sticky` for the dashboard filter itself.
- Keep the filter row in a dedicated top section with its own background, border, spacing, and z-index.
- Ensure all dashboard sections start below it and scroll independently underneath.

4. Preserve spacing and visual alignment
- Move dashboard padding from the old shared wrapper into:
  - the fixed filter section
  - the inner scrollable content container
- Keep the glassmorphism styling and brand appearance consistent with the rebuilt pages.

5. Protect interactions
- Ensure the custom date popover still opens above charts/cards.
- Keep filters responsive on wrap without causing the fixed area to collapse or overlap content.

6. QA after implementation
- Confirm the filter section remains visible at all times while scrolling the dashboard.
- Confirm only KPI/cards/charts scroll.
- Verify behavior on the current desktop viewport and a narrower tablet/mobile width.

Files to modify:
- `src/components/admin/AdminLayout.tsx`
- `src/pages/admin/regional/Dashboard.tsx`

Technical details:
- This should be solved by layout separation, not by increasing `sticky`/`z-index`.
- The robust fix is: dashboard owns its own internal scroll region; the filter bar is rendered outside that region.
- No dashboard data logic needs to change for this request.
