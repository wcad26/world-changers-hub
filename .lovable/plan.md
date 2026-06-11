## Goal
Show a "Pre-Register" call-to-action on the public event landing page (`/events/:eventId`) for events that have pre-registration enabled, so visitors can open the existing `EventPreRegistrationDialog` and submit themselves (and family members).

## Where
`src/pages/EventDetail.tsx` — in the hero/quick-info section (around line 154, alongside the existing **Contact Us** and **Register for Event** buttons).

## Behavior
- Show a new **Pre-Register** button only when:
  - `event.is_special === true`
  - `event.requires_pre_registration === true`
  - Event is still upcoming and not Cancelled/Completed (same `canRegister` guard used today)
- Clicking it opens `EventPreRegistrationDialog` (already implemented at `src/components/events/EventPreRegistrationDialog.tsx`), wired with local `useState` for `open`.
- Button styling: matches the existing gradient/glass CTA pair, using a distinct accent (e.g. gradient primary→accent) so it stands out from Contact Us / Register for Event. Icon: `UserPlus` from lucide-react.
- Label localized via `t('preRegister')` with English fallback "Pre-Register" and French "Pré-inscription" added to the language dictionary.

## Also
- Mirror the same button on `EventRegistrationSection` (the lower CTA block) so users scrolling past the hero still see it. Same visibility rules.
- No backend/schema changes — the edge function `event-pre-register` and dialog already exist.

## Technical notes
- Import `EventPreRegistrationDialog` and `UserPlus` in `EventDetail.tsx`.
- Add `const [preRegOpen, setPreRegOpen] = useState(false);`
- Render `<EventPreRegistrationDialog open={preRegOpen} onOpenChange={setPreRegOpen} event={event} />` once near the end of the JSX.
- Add `preRegister` key to `src/contexts/LanguageContext.tsx` (or wherever translations live) for EN/FR.

## Follow-up: Button styling refinement
- Change Pre-Register button to use the project's `primary` color (`bg-primary text-primary-foreground`).
- Stack all CTA buttons vertically (`flex-col`) with each button at `w-full` so they occupy the full width of the container (max-w-sm), rather than sitting side-by-side in a row.
