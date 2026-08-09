# Children's Class feedback section

Add a conditional "Children's Class" section to the anonymous event feedback form, shown only to people who indicate that their child attended the event.

## Flow

1. In the **Logistics** step, a new question appears first:
   - "Did your child / children attend the event?" (Yes / No)
2. If the answer is **Yes**, a new **Children** step is inserted in the step bar, between Logistics and Testimony, with these questions (all optional):
   - Were you able to send your child daily for the children's class? (Yes / No / Sometimes)
   - Satisfaction with lesson comprehension and retention (1-5 stars)
   - Satisfaction with the care of your child daily at the children's service (1-5 stars)
   - Satisfaction with meals provision at the children's service (1-5 stars)
   - Any remarks, complaints or suggestions? (long text)
3. If the answer is No or left blank, the step is not shown and the flow goes straight from Logistics to Testimony.

The existing "Children management" star rating moves into this new section so all child-related questions live together, and it stops appearing for people without children.

Everything uses the same glass panel styling and the same star rating control as the rest of the form, and is fully translated to French.

## Admin view

The event report Feedback tab gains a small "Children's class" block: number of parents who answered, the three new average ratings, how many sent their child daily, and the written remarks listed with the other written responses. New fields are added to the CSV export.

## Technical notes

- **Migration** on `public.event_feedback` (all nullable, no default):
  - `kids_attended boolean`
  - `kids_daily_attendance text` (`yes` / `no` / `sometimes`)
  - `kids_comprehension_rating smallint` (1-5)
  - `kids_care_rating smallint` (1-5)
  - `kids_meals_rating smallint` (1-5)
  - `kids_remarks text`
  - Existing grants/RLS unchanged (columns inherit table policies).
- `supabase/functions/event-feedback-submit/index.ts`: extend the payload with the six fields, reusing `clampRating` for the ratings and `clean` for text; whitelist `kids_daily_attendance` to the three allowed values; include them in the `hasContent` emptiness check.
- `src/pages/EventFeedback.tsx`: add the six state values, add the gating radio to the Logistics `GlassSection`, add a `children` `StepKey` computed into the `steps` array only when `kidsAttended === "yes"`, render the new `GlassSection` (Baby/Users icon) reusing `StarRating`, add EN/FR strings to the `T` map, and send the fields in the submit body. If a user switches back to "No", the kids answers are cleared before submit.
- `src/hooks/useEventFeedback.ts`: add the fields to `EventFeedbackRow`.
- `src/components/admin/EventFeedbackPanel.tsx`: add the children summary block (averages over non-null values only), show `kids_remarks` in written responses, and add the columns to CSV export.
