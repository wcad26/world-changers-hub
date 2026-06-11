## Goal
On the pre-registration page, after the email/phone lookup the user must explicitly choose **Individual** or **Family** before continuing. Individuals skip the family step entirely; families must add their members. Also clean up the Check button so it only re-appears when the lookup value is edited, and add a Back button on later steps.

All work stays in `src/pages/SpecialEventRegister.tsx` (frontend only). No schema, edge function, or backend changes — the existing `event-special-register` payload already supports both individuals (empty `family`) and families.

## Changes

### 1. New state
- `registrationMode: "individual" | "family" | null` — resets to `null` whenever the lookup value changes or the user is re-checked.
- `lastCheckedValue: string` — stores the value that was last submitted to the lookup endpoint. The Check button is hidden when `lookupStatus === "found"` AND `lookupValue === lastCheckedValue`. As soon as the user edits the email/telephone, `lookupStatus` resets to `idle` and Check reappears (current behavior — just make sure the input `onChange` also clears `registrationMode`).

### 2. Identify step — after a successful lookup
Replace the current single Alert + Continue block with:

```text
[green Alert] Hello {first_name}, are you registering for {event.name}
              as a family or an individual?

[ Individual ]   [ Family ]      ← two large buttons, radio-tick when selected
                                   (same visual pattern as the Email / Telephone
                                    buttons already on this page — Individual in
                                    one accent color, Family in another, green
                                    check circle inside the selected one)

[ Continue → ]                    ← disabled until a mode is picked
```

For users who weren't found and are onboarding inline (the "missing" branch), show the same Individual / Family selector below the new-user form so the choice is captured before Continue.

The Check button is removed from view as soon as `lookupStatus === "found"` and the input hasn't been edited since. Editing the email or phone clears the found state and brings Check back (already partly wired — just ensure the registrationMode also resets).

### 3. Step flow
- `steps` array becomes dynamic on `registrationMode`:
  - `individual`: `Identify → Extras` (or just `Identify` if no extras).
  - `family`: `Identify → Family → Extras` (or `Identify → Family`).
- `onNext` in `renderActions`:
  - From `identify`: go to `details` if `registrationMode === "family"`, else go to `extras` if extras exist, else `submit()`.
  - From `details` (family branch): go to `extras` if extras exist, else `submit()`.
  - From `extras`: `submit()`.
- `canProceedFromIdentify` also requires `registrationMode !== null`.
- When `registrationMode === "individual"`, clear `family` to `[]` before submit so no family entries are sent.

### 4. Back button
Add a Back button next to Continue on every step except `identify`. It moves the user one step backward in the dynamic `steps` array. Pattern mirrors the existing Continue button (outline variant, full-width on mobile, auto width on desktop, centered on mobile / right-aligned on desktop).

### 5. Everything else stays
- Family step keeps its current "Add person" / lookup / inline-onboard fields. Children-under-16 flag, relationship select, etc. unchanged.
- Extras step (lodging / meal prefs / pledge) is unchanged — both individuals and families pass through it when the event opts in, so every detail the event is configured to collect is still gathered.
- Submit payload is unchanged: `family: []` for individuals, populated array for families.

## Out of scope
- No edge function or DB changes.
- No changes to `EventDetail.tsx` or any other page.
