## Shortest-path QR + scanner fix

### Proposal: which ID to encode in the badge QR

Encode **`members.id`** (the row id in `public.members`) directly as the QR payload — nothing else, no prefix, no URL.

Why this is the fastest possible route:
- `attendance_records.member_id` is a foreign key to `members.id`. So the scanned value can be inserted directly into attendance with **zero translation**.
- Resolving the display name is a **single query**: `select id, member_id, profile_id, profiles(first_name,last_name) from members where id in (...)`.
- No certificate lookup, no verification-code lookup, no pre_reg lookup in the hot path.
- The value is already what the badge generator has in hand today (`certificates.member_id`), so no schema change is needed — only the resolver is simplified.

Rejected alternatives:
- `profile_id`: would still require a second hop to `members.id` before we can insert into `attendance_records`.
- `certificates.verification_code`: forces a `certificates` lookup on every scan, and the code is per-certificate not per-person.
- Pre-registration id: not linked to a member row, so it cannot mark attendance directly.

### Fixes to actually stop the "Scan failed" toast

1. **Register the edge functions** in `supabase/config.toml`:
   - `[functions.attendance-scan-resolve] verify_jwt = true`
   - `[functions.attendance-mark-present] verify_jwt = true`
   Missing config is the most likely reason the invoke returned an error and the hook fell through to the generic `Scan failed` message.

2. **Simplify `attendance-scan-resolve`** to the shortest path:
   - Accept `codes: string[]`.
   - For each code, trim it. If it matches a UUID, treat it as a `members.id`.
   - One query: `from('members').select('id, member_id, profile_id').in('id', uuids)`.
   - One query: `from('profiles').select('id, first_name, last_name').in('id', profileIds)`.
   - Return `{ code, member_id, display_name: "Last First", member_code }`.
   - Keep a small backwards-compat branch for old badges that still encode `/verify/CODE`, but do it only when the raw string is clearly not a bare UUID.

3. **Surface the real error in the hook** — `useAttendanceScan` currently prints `Scan failed` for every error. Change it to show `error.message` (or the `results[0].error`) so future failures are self-diagnosing.

### Mobile-only scanner page

Remove the admin bottom bars from the scanner experience and make the page mobile-first:
- Drop the shared admin layout wrappers (`SuperAdminLayout` / `RegionalAdminShell`) for `/admin/*/attendance/scan` so there is no bottom navigation bar.
- Full-width camera, large Pause/Resume, name-only cart directly below, sticky Submit button with safe-area padding.
- Manual add fallback for damaged badges.

### Today-only event selector

- Load only attendance events with `event_date = today` (plus child rows of today's multi-day events).
- Auto-select when there is exactly one.
- If none today, show a clear message and a small "Show recent events" link for edge cases.

### Verify

- Deploy both edge functions after config change, then scan a real badge and confirm the name lands in the cart and Submit marks attendance.
- Confirm no bottom bar appears on the scanner route on a phone viewport.