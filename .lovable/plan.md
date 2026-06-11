## Goal
Restyle the Pre-Register and Contact Us buttons on the event detail hero.

## Changes
1. **Pre-Register button color**: Change from gradient `from-primary to-accent` to solid `bg-primary` with `text-primary-foreground`.
2. **Button layout**: Change the action-buttons container from `flex flex-row` (horizontal) to `flex flex-col` (vertical stack). Each button gets `w-full` so they each occupy the full width of the container (`max-w-sm`).
3. **Button order**: Move Pre-Register to the top of the stack (first), followed by Contact Us, then Register for Event (if present).

## Where
`src/pages/EventDetail.tsx`, lines 161-198 (the action buttons block inside the hero section).

## No other changes
- No schema, API, or translation changes.
- The `EventPreRegistrationDialog` and its logic remain untouched.