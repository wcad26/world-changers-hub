## Goal
Replace the Pre-Register dialog with a full, well-designed registration page that covers every section enabled on the event (family, lodging, meals, pledges).

## Wiring (small)
**`src/pages/EventDetail.tsx`**
- Pre-Register button `onClick` → `navigate(\`/events/${event.slug || event.id}/register\`)`.
- Remove the `EventPreRegistrationDialog` import, `preRegOpen` state, and dialog mount on this page.

The route `/events/:slug/register` is already wired in `src/App.tsx` to `SpecialEventRegister`.

## Page content — already correct, conditional on event flags
`src/pages/SpecialEventRegister.tsx` already renders the right steps based on event flags from `events` table:

```text
Step 1 — Identify
  • Email/phone lookup via event-pre-register-lookup
  • If found: confirm identity
  • If not found: inline onboarding (Family Name, Other Names, Email, Phone,
    Address, DOB, Gender) — creates visitor on submit

Step 2 — Family & Children
  • Add multiple family members (relationship type)
  • Each row: email/phone lookup; if not found, capture name/DOB/gender;
    auto-flag children under 16

Step 3 — Extras (rendered only when the event opts in)
  • Lodging                  → when event.collect_lodging
       party size, arrival date, departure date
  • Meal preferences         → when event.collect_meal_preferences
       checkboxes (Vegetarian, Vegan, Halal, Kosher, Gluten-free, allergies)
       + free-text dietary notes
  • Pledge to support        → when event.collect_pledges AND
                               event.linked_fundraising_campaign_id is set
       shows campaign name, goal/raised, accepts pledge amount in
       campaign currency

Done — confirmation screen with a link back to /events
```

Submission posts to existing `event-special-register` edge function with the full payload (primary, family, lodging, meals, pledge).

## Visual redesign — match VisitorRegister
Bring the same glassy, modern aesthetic the user already approved on visitor registration:

- Wrap each step in the `GlassSection` pattern from `VisitorRegister.tsx`
  (`rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6` with an icon-chip header).
- Step indicator at the top: 3-dot progress (Identify → Family → Extras) with
  active/done states using `bg-primary` / `bg-muted`.
- Replace bare native `<select>` with shadcn `Select` for consistency, and
  use `Input` rounded-xl variants (`nativeSelectClassName` already exists in
  VisitorRegister and can be reused).
- Hero header: keep the gradient hero card but tighten typography
  (`text-fluid-3xl`, badge row with date / location chips).
- Sticky bottom action bar on mobile (`fixed bottom-0` + `pb-24` page
  padding) holding Back / Continue so users on mobile don't have to scroll
  to the bottom of a long form.
- Show a one-line campaign progress card inside Step 3 when pledges are
  enabled (already there — restyle to glass).
- Success state uses the same glass card + `CheckCircle2` accent.

No new fields beyond what's already in the schema/edge function.

## Out of scope
- No backend or schema changes.
- The `EventPreRegistrationDialog` component file stays in the tree (we can delete it in a follow-up once we confirm nothing else uses it).