Update the six KPI cards at the top of `src/pages/admin/super/SpecialEventReport.tsx`. Definitions used everywhere below:

- Adult = age ≥ 15 OR age unknown (existing "adult" + "youth" buckets merged; unknown-age adults still counted here since we no longer surface youth separately)
- Child = age < 15

Note: for the "unknown age" tally shown as a sub-hint elsewhere we keep the existing rule — this change only affects how adults/children are displayed.

### 1. Total Registered card

- Keep main value = total attendees.
- Sub-line becomes: `{individuals} Individuals · {families} Families ({sizeA, sizeB, sizeC…})` where the bracketed list shows the member count of each family group, sorted descending. Truncate to first 8 with a trailing `…` if there are more, and drop the bracket entirely when there are no families. (no don't do the member count sort in the family. instead indicate the total number of individuals in the family pool.)

### 2. Adults / Youth / Children card

- Rename label to `Adults / Children`.
- Value becomes `{adults+youth} / {children}`.
- Sub-line: keep `{unknownAge} age unknown` when > 0, otherwise `≥15 / <15`.

### 3. Lodging Needed card

- Recompute two numbers over groups that need lodging:
  - `lodgingFamilies` = groups with size > 1 that need lodging 
  - `lodgingIndividualsCount` = solo attendees (no group, or group size 1) that need lodging
- Value stays as total people needing lodging.
- Sub-line becomes: `{lodgingFamilies} Families (` (here, indicate the number of children in the family pool and the number of adults in the family pool, so that it will guide the event organizers to know how many people in the families are adults that will be lodged separete from the family. in this separation, also indicate the parent separate as they will have to stay with the children instead of being lodged separately.) `/ {lodgingIndividualsCount} Individuals`.

### 4. Person-nights card → Peak Day card

- Rebuild the day rollup to also track adult and child counts per day (reusing `dayRollup` logic but adding `adults` and `children` per day using the new Adult/Child definition).
- Compute `peakDay` = the day with the highest total attendance (adults + children). Ties break to the earliest date.
- Compute `totalNights` = number of distinct days in the event span (`dayRollup.length`).
- Label stays or becomes `Peak Day Attendance` (short, fits card).
- Value: `{peakAdults} Adults / {peakChildren} Children`.
- Sub-line: `Peak on {peakDate} · night {index} of {totalNights}` where `index` is the 1-based position of the peak day within the event span.

### Files touched

- `src/pages/admin/super/SpecialEventReport.tsx` only — extend the `stats` and `dayRollup` `useMemo` blocks and update the six `<KPI …/>` calls. No schema, hook, or edge-function changes.