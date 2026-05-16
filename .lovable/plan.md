# Fix Record Tithe Dialog Header (Sticky)

Make the gradient header (and footer) stay in place while only the form body scrolls.

## Problem
`DialogContent` currently has `max-h-[90vh] overflow-y-auto`, so the whole dialog (header + body + footer) scrolls together.

## Change — `src/components/admin/regional/RecordTitheDialog.tsx`

Restructure the dialog into a flex column where header and footer are fixed and the middle section scrolls:

1. `DialogContent`: replace `max-h-[90vh] overflow-y-auto` with `max-h-[90vh] flex flex-col overflow-hidden`.
2. Header `<div>` (gradient band): add `shrink-0` (stays at top).
3. `<form>`: add `flex flex-col flex-1 min-h-0 overflow-hidden`.
4. Inner body wrapper (`<div className="px-6 py-5 space-y-4">`): add `flex-1 min-h-0 overflow-y-auto`.
5. `DialogFooter`: add `shrink-0` (stays at bottom).

## Apply same fix to Record Offering Dialog
For consistency with the glass dialog standard, mirror the exact same structural changes in `src/components/admin/regional/RecordOfferingDialog.tsx`.

## Out of scope
- No visual restyling, no field changes, no logic changes.
