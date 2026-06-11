
# Special Event Registration & Management

Leverage what already exists (`events.is_special`, `requires_pre_registration`, `event_pre_registrations`, `event-pre-register` + `event-pre-register-lookup` edge functions, visitor/member registration forms, `member_relationships` for family/children, `fundraising_campaigns`/`fundraising_donations`, child logic) and add the missing pieces.

## 1. Database (single migration)

Extend, do not duplicate.

- `events`:
  - `event_days int[]` derived OR `is_multi_day boolean` + use existing `start_datetime`/`end_datetime` (will generate per-day attendance rows from this range — no schema needed beyond a `linked_fundraising_campaign_id uuid` FK on events).
  - `linked_fundraising_campaign_id uuid REFERENCES fundraising_campaigns(id)`.
  - `collect_lodging boolean default false`, `collect_meal_preferences boolean default false`, `collect_pledges boolean default false` — toggles per special event.

- `event_pre_registrations` (extend existing):
  - `visitor_id uuid REFERENCES members(id)` already covered (members table stores both via `member_type`). Add:
  - `attending_with_family boolean`
  - `has_children boolean`
  - `needs_lodging boolean`, `lodging_party_size int`
  - `meal_preferences text[]` (e.g. vegetarian, halal, allergies free-text)
  - `dietary_notes text`
  - `pledge_amount numeric`, `pledge_currency_code text`, `pledge_status text default 'pledged'` (pledged/fulfilled/cancelled)
  - `arrival_date date`, `departure_date date` (optional)

- `event_pre_registration_donations` link table OR simpler: when a pledge is fulfilled, insert a row into `fundraising_donations` with the campaign linked to the event and add `event_pre_registration_id uuid` column on `fundraising_donations` for traceability.

- `attendance_events` already exists for daily attendance. For special events we will auto-generate one `attendance_events` row per calendar day between `start_datetime::date` and `end_datetime::date`, all linked to the same `event_id`. A trigger on insert/update of a special event regenerates the daily attendance shells.

All new columns nullable; RLS keeps current "authenticated full access" pattern, with public `SELECT` only where existing policies already allow it. GRANTs included.

## 2. Public Special Event Registration Page

Route: `/events/:slug/register` (works alongside existing `EventPreRegistrationDialog`, but as a full page since the flow is longer for special events).

Single multi-step flow that branches on lookup:

1. **Identify** – phone OR email lookup via existing `event-pre-register-lookup` edge function (extend to also match by phone).
2. **Branch A – Recognized user**: confirm name, then collect interest options (attending alone / with family / has children), lodging, meal prefs, pledge. Submit.
3. **Branch B – Unknown user**: reuse `MemberRegister` / `VisitorRegister` form components inline (extract their schemas into shared components so they can be embedded). On submit the same edge function:
   - Creates the member/visitor (full onboarding) using existing `create-member-registration` / `create-visitor` logic.
   - Inserts the matching `event_pre_registrations` row (interest signaled automatically).
4. **Family/children add-on step**: a repeatable list where the primary registrant adds each family member by email/phone. For each entry:
   - If found → linked + interest signaled.
   - If not found → mini-form (reuse member or visitor schema, child variant when age < 16). Children automatically get linked to the primary via `member_relationships` (existing helper).
   - All rows share a `group_id` (already supported).
5. **Pledge step** (shown when event has linked fundraising campaign): optional pledge amount + currency, stored on the pre-registration row; visible separately in the campaign report and counted toward forecast.
6. **Confirmation** screen with event summary and dates.

UI built around existing dialog logic but as a stepper page; shared registration forms are extracted into `src/components/registration/MemberRegistrationForm.tsx` and `VisitorRegistrationForm.tsx` reused by current pages and this flow.

## 3. Edge Functions

- Extend `event-pre-register-lookup` to accept `{ email?, phone? }` and resolve `members.profile_id → profiles.phone/email`.
- Extend `event-pre-register` to accept the new fields (lodging, meals, pledge, attending_with_family, has_children) and the new "onboard + register" path: when a member/visitor record does not exist yet, accept a `new_registrant: { type: 'member'|'visitor', payload }` block and invoke the existing onboarding edge functions internally before inserting the pre-registration. Family entries support the same `new_registrant` payload for batch onboarding.
- Child linkage uses the already-built `member_relationships` insert pattern (chunked, see memory rule).

## 4. Super Admin Portal

- **Create Special Event** (existing `SuperEvents` page): when `is_special` is on, show extra fields:
  - Toggles: collect lodging, collect meal preferences, collect pledges.
  - Linked fundraising campaign (dropdown of existing global campaigns or "+ create new"). Creating links it on save.
  - Multi-day support is automatic from `start_datetime`/`end_datetime`.
- **Special Event Report page**: `src/pages/admin/super/SpecialEventReport.tsx` at route `/admin/super/events/:eventId/special-report`. Sections:
  - KPI cards: total registered, individuals vs families, total adults / children, expected attendance vs `attendance_target`.
  - Lodging summary: total beds needed, arrival/departure histogram, party sizes.
  - Meal preferences breakdown (vegetarian, halal, allergies, etc.) and totals per day.
  - Daily attendance grid: per day, expected (from pre-reg) vs actual (from `attendance_records`).
  - Fundraising panel: linked campaign goal, total pledged (sum of `pledge_amount`), total received (sum of donations via campaign), gap to goal, list of pledgers, "mark fulfilled" action that creates a `fundraising_donations` row.
  - Demographics: age bands, region of origin, family vs individual.
  - Export CSV for each section.
- Link button "Special Event Report" added on the event row when `is_special = true`.

## 5. Attendance (multi-day)

- On save of a special event, a server function creates one `attendance_events` row per day in `[start_date, end_date]`, named `"<event name> – Day N (YYYY-MM-DD)"`, linked back to the parent event via existing `region_id`/`event_id` reference (add `parent_event_id uuid` on `attendance_events` to group days under the parent special event).
- Existing Super Admin attendance UI gets a "Multi-day" view for special events showing all days as tabs; recording attendance per day uses existing `attendance_records` logic. Pre-registration list pre-populates each day's expected attendees.

## 6. Fundraising Integration

- `linked_fundraising_campaign_id` is the bridge.
- Pledges live on `event_pre_registrations`; report sums them.
- "Mark pledge fulfilled" in the report opens a donation entry dialog (reuses existing fundraising donation create flow) and writes back `event_pre_registration_id` on the donation for traceability.
- Public registration page shows campaign progress bar if the event has a linked campaign.

## 7. Validation

- Verify migration applies and grants are present.
- Smoke test: create a special multi-day event linked to a campaign → submit registration as new member with 1 spouse + 1 child + pledge → confirm `event_pre_registrations` rows (3, same group_id), `member_relationships` created, child correctly flagged (<16), pledge visible in Super Admin report.
- Recognized-user shortcut: existing member with phone lookup signals interest without re-onboarding.

## Technical notes

- Reuse, do not duplicate: extract member/visitor forms into shared components first; the existing public registration pages keep working unchanged.
- Keep "authenticated full access" RLS pattern per recent memory; public anon `INSERT` on `event_pre_registrations` already allowed for self pre-registration via the public edge function (function uses service role).
- Children/adult rules unchanged — reuse `childUtils` and `fetchMemberRelationshipsForMembers`.
- No changes to existing route guards or auth.
