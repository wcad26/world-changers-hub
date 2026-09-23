# Upgrade Portal Reporting Colors and Charts

## Goal
Make charts, graphs, reporting icons, and KPI signals across the Member, DCG, Regional Admin, and Super Admin portals colorful, clear, and consistent in both light and dark mode, without changing any report calculations or permissions.

## Confirmed issue
- The theme stores chart and interface colors as complete `oklch(...)` values.
- Many portal charts incorrectly wrap those values in `hsl(...)`, producing invalid colors that browsers render as black, gray, or transparent. This is the main cause of the monochrome screenshots.
- Other reports bypass the theme with unrelated hex, HSL, and Tailwind colors, so the same category changes color between pages.
- Several pie charts show bare numbers without a useful legend, percentages, or clear category-to-color mapping.

## Reporting color system
- Replace the current muted five-color chart set with a balanced WCA-compatible reporting palette for both themes:
  - plum for members and primary totals
  - teal for visitors and secondary comparisons
  - golden amber for children, goals, and targets
  - coral/red for expenses, negative movement, and risk
  - emerald for income, success, and positive movement
  - clear blue for totals, net balance, and neutral comparison
  - violet and cyan for additional categories in pies and multi-series reports
  - neutral gray only for unknown or unavailable data
- Define these once as semantic tokens in the global theme, with separately tuned light- and dark-mode values and sufficient contrast against cards and tooltips.
- Preserve the WCA Heritage plum/teal identity while ensuring adjacent series remain distinguishable, including for common color-vision deficiencies.
- Replace invalid `hsl(var(--...))` wrappers with direct token values and remove scattered hardcoded chart colors.

## Shared chart presentation
- Add shared chart palette and presentation helpers so axes, grids, legends, tooltips, active points, reference lines, and empty states behave consistently.
- Give chart tooltips readable themed surfaces, colored series markers, clear values, totals where useful, and currency/percentage formatting appropriate to each report.
- Keep line styles meaningful as well as color: solid for actual values, dashed for targets or totals, and distinct markers where series could otherwise be confused.
- Keep legends visible and ordered consistently; allow wrapping or compact placement on phones instead of clipping.
- Use stable chart heights, reduced axis clutter, shortened long labels with full values in tooltips, and responsive margins for phone, tablet, and desktop views.

## Chart improvements by report type

### Attendance and membership
- Apply a stable mapping everywhere: Members = plum, Regular Visitors = teal, Children = amber, Total = blue, Target = coral dashed.
- Update the Regional, Super Admin, DCG, event, DCG-profile, and member attendance charts so fills, lines, dots, legends, and tooltip markers all match.
- Improve rate charts with clearly different success, caution, and needs-attention colors rather than lighter shades of one color.
- Keep gender and age categories consistently colored and add readable labels/legends without relying on color alone.

### Finance and fundraising
- Apply a stable financial mapping: Income/Raised = emerald, Expenses = coral, Net = blue, Goal/Target = amber, Pledges = violet.
- Update ledger, campaign, fundraising, and planning visuals across Regional, Super Admin, DCG, and Member portals.
- Keep currency formatting in axes and tooltips and ensure positive/negative KPI icons use the same semantic colors as their charts.
- Replace demonstration-era purple/green hex values with the shared reporting tokens.

### Special-event reports and pie charts
- Replace solid black pie output with themed donut charts using non-zero categories only.
- Add category legends with colored markers, counts, and percentages; use center totals where they improve scanning.
- Add slice separation, controlled labels, and themed tooltips so small values remain readable without text collisions.
- Improve daily attendance, lodging, health/allergy, meal, travel, and region breakdown charts with consistent series colors and accessible legends.

### Reporting icons and KPI signals
- Audit report headers, KPI cards, trend indicators, targets, alerts, and finance summaries.
- Give icons a semantic color and subtle tinted background based on what they represent rather than coloring every icon plum or gray.
- Replace raw green/red/blue/purple utility colors in reporting surfaces with theme-aware success, danger, information, warning, and chart tokens.
- Keep decorative/navigation icons neutral where color would not convey information.

## Scope
- Cover every Recharts visualization and reporting summary in all four portals, including shared report views and campaign/event reports.
- Preserve all existing data queries, filters, calculations, exports, route access, and portal permissions.
- Do not redesign unrelated public pages or change the WCA brand colors used outside reporting surfaces.

## Verification
- Search the portal code for remaining invalid wrapped OKLCH variables and unintended hardcoded chart colors.
- Check representative attendance, membership, finance, fundraising, DCG, special-event, and personal-report pages in light and dark mode.
- Verify pie legends, tooltips, percentages, currencies, targets, zero-data states, and long category labels.
- Test phone, tablet, and desktop widths for clipped axes, overlapping labels, overflowing legends, and unreadable tooltips.
- Confirm report values and exports remain unchanged, then verify the preview compiles without errors.