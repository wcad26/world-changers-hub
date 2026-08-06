# Event Feedback & Testimonial Submission

Let attendees of an event share feedback and (optionally) a public testimonial, after identifying themselves with the phone number or email already known to the system.

## User flow

1. On the public event page (e.g. `/events/desco-2026`) a new button appears: "Share Your Feedback".
2. It opens `/events/:slug/feedback`, which first asks for a phone number **or** email.
3. The system looks the person up. If they are recognised (a member/profile who pre-registered for, or was marked present at, this event), they continue. Otherwise they see a friendly "we couldn't find you" message with a hint to use the number/email they registered with.
4. The feedback form opens with their name shown at the top (no name/email/personal fields — identity comes from the lookup). Every question is optional and mirrors the DESCO feedback form:

   **About you**
   - First time attending this event? (Yes / No)
   - Fellowship / region (pre-filled from their member record, editable, with "Other")

   **General experience**
   - Overall experience (1 = Very disappointing to 5 = Excellent)
   - Pre-event communication (1 = Poor to 5 = Very clear and timely)
   - Impact of the teachings (Not impactful / Somewhat impactful / Impactful / Very impactful / Extremely impactful)
   - Which speaker(s) or session(s) impacted you the most, and why? (text)
   - What did you enjoy most? (multi-select: Teachings, Group Fellowship, Food, Gala Night, Accommodation, Other + free text)
   - What challenges or difficulties did you face? (text)

   **Logistics & comfort**
   - Lodging / accommodation (1–5)
   - Food quality, variety and timing (1–5)
   - Wake-up and sleep times (Too strict / Just right / Too relaxed)
   - Management of children, for parents (1–5, skippable)

   **Future expectations**
   - Topics or speakers you'd like next time (text)
   - Other suggestions or comments for the planning team (text)

   **Testimonial (optional)**
   - Your testimonial (text)
   - How you'd like to be credited: name shown / role or title / anonymous

5. Submit shows a thank-you screen. Re-submitting later updates their existing feedback instead of duplicating.


## Moderation

Testimonials do **not** appear publicly right away. They land as pending and only show on the event page once an admin approves them. Admins get a "Feedback" view per event where they can read all feedback, see averages, and approve or hide testimonials.

## Language

The whole flow is bilingual (English/French) using the existing language detection and toggle.

## Technical notes

- **Database migration**
  - New table `public.event_feedback` (all answer columns nullable): `id`, `event_id`, `member_id`, `profile_id`, `first_time_attending boolean`, `fellowship text`, `overall_rating`, `communication_rating`, `lodging_rating`, `food_rating`, `children_management_rating` (smallints 1–5), `teaching_impact text`, `schedule_feedback text` (too_strict / just_right / too_relaxed), `impactful_sessions text`, `enjoyed_most text[]`, `enjoyed_most_other text`, `challenges text`, `future_topics text`, `suggestions text`, `submitted_at`, `updated_at`; unique on `(event_id, member_id)` so re-submission updates.
  - Grants: `service_role` full access (edge functions write), `authenticated` select for admin reads; no `anon` access. RLS on, with admin-scoped read policies mirroring existing event policies (region admins for their region, super admins globally).
  - `event_testimonials`: add `status text default 'pending'`, `member_id uuid`, `submitted_at timestamptz`. Existing rows backfilled to `approved`. Public read policy narrowed to `status = 'approved'`.
- **Edge functions** (service role, mirroring `event-pre-register-lookup` patterns)
  - `event-feedback-lookup`: input `{ event_id, email|phone }`; resolves profile by email (`ilike`) or last-9-digit phone match, then the member record; verifies eligibility via `event_pre_registrations` or `attendance_records` joined to that event's `attendance_events` (including all day-child sessions via `source_event_id`); returns name + any existing feedback/testimonial for pre-filling.
  - `event-feedback-submit`: upserts `event_feedback`, and upserts a `pending` row into `event_testimonials` when testimonial text is present (deleted if cleared). Re-validates eligibility server-side; validates lengths (text fields capped, ratings 1–5).
- **Frontend**
  - `src/pages/EventFeedback.tsx` — two-step (lookup, then form) page using the glass dialog/panel standard; route `/events/:eventId/feedback` added in `App.tsx`, accepting slug or UUID like `EventDetail`.
  - Button added in `src/pages/EventDetail.tsx` action-button stack (shown for events that have started or are completed).
  - `src/hooks/useEventFeedback.ts` for the two edge-function calls; `zod` schema for client-side validation with all fields optional.
  - `EventTestimonials` continues to read approved testimonials only (no component change needed once the policy/query filters on `status`).
- **Admin**
  - New "Feedback" tab inside the shared `EventReportView` showing average ratings, response count, the written responses, and testimonial approve/hide actions (super admin and regional admin reports both get it).
