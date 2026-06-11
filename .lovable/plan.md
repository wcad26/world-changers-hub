All work stays in `src/pages/SpecialEventRegister.tsx` — no schema or edge function changes. The `event_pre_registrations` row already carries `arrival_date` and `departure_date`; we'll derive them from the first/last ticked day so the existing payload still works.

## 1. Lodging — per-day attendance picker
Replace the Party size / Arrival date / Departure date inputs (lines 793–814) with a list of checkboxes — one per calendar day between `ev.start_datetime` and `ev.end_datetime` (fallback: single day = start).

- Compute `eventDays: string[]` (ISO yyyy-mm-dd) with a `useMemo` over `ev.start_datetime` / `ev.end_datetime`. Cap at ~30 days for safety.
- New state `attendingDays: string[]` (replaces `arrivalDate` / `departureDate`).
- Render each day as a tile matching the meal-preferences styling (same `cn(...)` block, `Checkbox` + label, `bg-primary/10 border-primary/40` when selected). Label format: `EEE, MMM d` (e.g. "Fri, May 1").
- Keep the "I need lodging" checkbox and the Party size input — only the date inputs change.
- On submit, set `arrival_date = attendingDays[0] || null`, `departure_date = attendingDays[attendingDays.length - 1] || null` so the edge function payload contract is preserved.
- Remove `arrivalDate` / `departureDate` state and their setters.

## 2. Pledge input — thousands separators
The pledge input is a `type="number"` (line 864–871) which can't show commas. Change to `type="text"` with `inputMode="numeric"`:

- Display value: `pledgeAmount === "" ? "" : pledgeAmount.toLocaleString("en-US")`.
- On change: strip everything except digits, parse with `Number(...)`, store as number (or `""`). Reject NaN.
- The submit payload (`pledge_amount: Number(pledgeAmount)`) stays the same.

## 3. Fix campaign goal/raised in the pledge box
Line 852 currently prints `campaign.raised / campaign.goal` raw, but `fundraising_campaigns.goal` and `.raised` are stored as minor units (×100), which is why the user sees `XAF 0 / 1,000,000,000` instead of `XAF 0 / 10,000,000`. The header at line 516–517 already divides by 100 — apply the same convention here:

```tsx
{campaign.currency_code} {((campaign.raised || 0) / 100).toLocaleString()} / {((campaign.goal || 0) / 100).toLocaleString()}
```

Progress bar width calc on line 858 also needs the divide for consistency (functionally identical since it's a ratio, but keep it tidy).

## Out of scope
- No DB/edge function changes — `arrival_date` / `departure_date` semantics are unchanged.
- No changes elsewhere in the file (Identify / Family / Meal steps untouched).
