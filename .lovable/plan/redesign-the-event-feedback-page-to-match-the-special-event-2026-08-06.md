# Redesign the Event Feedback page to match the Special Event Registration experience

Bring `/events/:slug/feedback` in line with the look and feel of the special event pre-registration page, starting from the very first screen where the phone number or email is entered.

## What changes visually

- **Event hero header**: the page opens with the same gradient hero band showing the event badge, event name, dates and location, instead of the current plain card header.
- **Step indicator**: the feedback flow becomes an explicit multi-step journey with the same step bar used in registration:
  1. Identify (email or phone lookup)
  2. Experience (about you + general experience)
  3. Logistics (lodging, food, children, schedule, challenges)
  4. Testimony (future topics, suggestions, testimony)
  Each step has Back / Continue buttons in the same layout, with the final step showing the Submit action.
- **Identify step**: identical treatment to registration — two selectable Email / Phone pill buttons with the green check indicator, a single rounded input with a "Check" button, a green success alert greeting the person by first name, and an amber alert when no registration or attendance is found.
- **Glass sections**: every group of questions is wrapped in the same glass panel (icon + title + description, rounded-2xl, blurred card background) used across registration.
- **Done screen**: the same centered success panel with the green circle icon and a button back to the event page.
- **Page shell**: same background gradient, spacing, rounded inputs/textareas, and Navbar/Footer treatment.

Ratings keep their current star control, restyled to sit inside the glass panels. All questions stay optional, and the existing English/French copy and browser-language detection are unchanged.

## Technical notes

- Extract `GlassSection` and `StepIndicator` from `src/pages/SpecialEventRegister.tsx` into a shared module (e.g. `src/components/events/EventFlowUI.tsx`) and import them in both pages so the styling stays in sync. `SpecialEventRegister.tsx` changes only its imports.
- Rewrite the presentation layer of `src/pages/EventFeedback.tsx`: replace `Card`/`CardHeader` blocks with `GlassSection`, add a `StepKey` state (`identify | experience | logistics | testimony | done`) and a `renderActions()` navigation footer mirroring registration.
- Fetch the event (name, dates, location) for the hero using the existing slug-with-history hook already used by the event pages, falling back gracefully if unavailable.
- No changes to `event-feedback-lookup` / `event-feedback-submit` edge functions, the database, or `useEventFeedback.ts` — submission payload and validation stay exactly as they are.
