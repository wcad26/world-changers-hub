# Anonymous Event Feedback

Make the event feedback form fully anonymous: no phone or email lookup, no identity check. Anyone with the event link can open the form and submit.

## What changes for the visitor

- Clicking "Share Your Feedback" on an event page opens the form directly at the first question — the "Identify" step is removed.
- Steps become: Experience, Logistics, Testimony.
- All fields stay optional, and the flow stays bilingual (EN/FR).
- Testimonials: since there is no identity, the testimony step gets an optional "Name to display" and "Role/title" field. Left blank, the testimonial is credited as "Anonymous".
- Testimonials still land as pending and only appear on the event page after an admin approves them.
- Each submission is a new record (no "update my previous feedback", since there is nobody to match against).

## What changes for admins

Nothing structural — the existing Feedback panel in the event report keeps working. Rows without a member simply show as "Anonymous" instead of a name.

## Technical notes

- **Migration on `public.event_feedback`**
  - Make `member_id` nullable and drop the unique `(event_id, member_id)` constraint (replace with a plain index on `event_id`).
  - Add `GRANT INSERT ON public.event_feedback TO anon, authenticated` is not needed — writes continue through the service-role edge function, so grants stay as they are.
- **`event-feedback-submit` edge function**
  - Accept `{ event_id, feedback, testimonial }` with no `member_id`; remove the member lookup and the pre-registration/attendance eligibility check.
  - Validate that `event_id` exists; keep rating clamping and text-length caps.
  - Switch the upsert to a plain insert.
  - Testimonial insert uses the submitted display name (capped, fallback "Anonymous") and `member_id` null, `status = 'pending'`.
  - Basic abuse guard: reject submissions where every field is empty.
- **`event-feedback-lookup` edge function** — no longer called by the page; delete it and its `supabase/config.toml` entry.
- **`src/pages/EventFeedback.tsx`**
  - Remove the identify step, lookup state, `member` state, and the hello banner; start on "Experience".
  - Add optional display-name and role inputs to the testimony section.
  - Submit calls the function without member details.
- **`EventFeedbackPanel.tsx`** — render "Anonymous" where a member name is currently expected.
