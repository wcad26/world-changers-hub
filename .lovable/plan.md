## Goal
Add a fast, cart-style QR scanner that marks attendees present per event (per day for multi-day events), accessible from both the regional and super admin Events pages. Also change badge QR codes so they encode the member's identifier directly, which makes scanning and resolution trivial.

## Change 1 — Badge QR encodes the member identifier
Certificates keep the current `/verify/<verification_code>` QR (used for public verification). Badges are different:
- The QR payload becomes the **member UUID** (i.e. `members.id`, the same value already stored in `certificates.member_id`). Plain text, no URL wrapper.
- Applies to every `output_type = 'badge'` template.
- Pre-registration-only badges (no linked member yet) fall back to `pre_reg:<pre_registration_id>`; the scanner recognises both.

Files:
- `src/utils/certificateUtils.ts` — in `generateCertificateImage`, accept `outputType` and, for badges, generate the QR from the member id instead of the verify URL.
- `supabase/functions/generate-certificates/index.ts` — same branch server-side.
- `src/pages/admin/super/Certificates.tsx` / `src/pages/admin/regional/Certificates.tsx` — pass `output_type` into the generator.

No schema change: `member_id` and `pre_registration_id` already exist on `certificates`.

## Change 2 — Multi-day attendance
`attendance_events` already supports multi-day via `parent_event_id` + `day_index`, and `attendance_records` is keyed by `event_id + member_id`. The scanner requires the operator to pick both the event and (for multi-day events) the specific day before scanning. If a source event doesn't yet have per-day child attendance_events, the submit function creates the missing child row for the chosen date on first use.

## Change 3 — New scanner page
Route: `/admin/attendance/scan`, mounted under both `AdminLayout` (regional) and `SuperAdminLayout` (super). Existing route guards apply — no new roles.

Flow:
1. **Event picker** — searchable dropdown of events the user can record for (regional user → own region; super admin → all). Multi-day events show a day selector (defaults to today when in range).
2. **Scanner panel** — live camera via `@yudiel/react-qr-scanner` (or `html5-qrcode`, whichever installs cleanly). Continuous scanning with a short debounce so a badge held in view doesn't re-fire. Torch + camera-switch controls on mobile.
3. **Cart panel — kept simple.** Every successful scan resolves the scanned value to a member and appends **one line: the member's full name** (Last First). No photos, no region chips, no metadata. A small ✕ removes a line. Duplicates within the current cart, or a member already marked present for this event+day, are silently ignored (with a brief beep so the operator knows the scan registered).
4. **Submit** — one call marks every cart entry present. Success toast + short summary: total submitted and how many were newly marked vs already present. Cart clears; scanner stays open.
5. **Manual fallback** — a small "Add by name" field (uses `search_region_members` / `search_all_members`) for badges that won't scan.

## Speed
- Batched edge function `attendance-scan-resolve` accepts many codes at once and returns `{ code → { member_id, display_name } }`, using indexed lookups.
- In-session cache so re-scanning the same badge is instant.
- Beep on successful scan; distinct tone on unknown/duplicate.
- Submit uses one edge function `attendance-mark-present` that upserts many `attendance_records` in a single call (idempotent via `unique(event_id, member_id)`).

## Entry point
Add a **Record Attendance** button beside **Add Event** on:
- `src/pages/admin/super/Events.tsx`
- Regional Events page (`src/pages/admin/regional/…`)

The button navigates to the scanner page (full-screen, mobile-first).

## Files to add
- `src/pages/admin/AttendanceScan.tsx` — page shell (event/day picker, scanner, simple cart, submit).
- `src/components/attendance/QrScannerView.tsx` — camera + decode wrapper.
- `src/components/attendance/ScanCart.tsx` — flat list of names + remove + submit.
- `src/components/attendance/EventDaySelector.tsx` — event and day picker.
- `src/hooks/useAttendanceScan.ts` — cart state, resolver calls, submit call.
- `supabase/functions/attendance-scan-resolve/index.ts` — batch resolver that accepts either a bare member UUID, a `pre_reg:<uuid>` string, a `verification_code`, or a full `/verify/<code>` URL, and returns display names.
- `supabase/functions/attendance-mark-present/index.ts` — batch upsert of `attendance_records` for a given event_id (child day event when multi-day), ensuring the child attendance_event exists.

## Files to edit
- `src/App.tsx` — register `/admin/attendance/scan` under both admin layouts.
- `src/pages/admin/super/Events.tsx` — add "Record Attendance" button.
- Regional Events page — same button.
- `src/utils/certificateUtils.ts`, `supabase/functions/generate-certificates/index.ts`, both Certificates pages — badge QR change from Change 1.

## Migration
Only if verification confirms they're missing:
- Unique index on `certificates.verification_code` (kept — still used by cert verify).
- Unique constraint on `attendance_records(event_id, member_id)` so submit is idempotent.
No new tables.

## Out of scope
- Regenerating already-issued badges (users can re-issue if they want the new QR).
- Offline scanning.
- Face recognition / NFC.

## Summary
Simplify badge QR codes to encode the member id directly, then add a shared scanner page reachable from a new "Record Attendance" button on both admin Events pages. The cart is a plain list of names; submit marks everyone present against the chosen event/day in one batched call.