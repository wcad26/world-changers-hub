## Goal

1. Make the entire special event pre-registration flow at `/events/:slug/register` fully bilingual (EN + FR) using the browser language already detected by `LanguageProvider`.
2. Rework the "Meal preferences" extras section into an **Allergies & Health Challenges** section with a tailored option list, and reflect that change in the Super Admin Special Event Report.
3. Translate the new section (heading, subtitle, all options, textarea placeholder) into French as part of the same translation pass.

## How language already works (reuse, don't rebuild)

- `LanguageProvider` (mounted in `App.tsx`) runs `detectBrowserLanguage()` from `navigator.language` and caches the choice in `localStorage`.
- `useLanguage()` exposes `t(key)` for UI strings and `localizedField(en, fr)` for DB content (`*_fr` columns).
- Outcome: once every literal English string in the two flow screens is wrapped with `t(...)`, French browsers get French automatically; the Navbar toggle still lets users switch.

## Part A — Allergies & Health Challenges (replaces "Meal preferences")

### Frontend change (`src/pages/SpecialEventRegister.tsx`)

- Section heading: **"Allergies & Health Challenges"** (FR: "Allergies et problèmes de santé").
- Subtitle: **"Indicate any allergies or health challenges we should accommodate."** (FR: "Indiquez toute allergie ou tout problème de santé que nous devrions prendre en compte.").
- Replace the current 7 meal options with 7 health/allergy options (6 specific + 1 "Other"):

  | Stored value (EN, sent to backend) | EN label | FR label |
  |---|---|---|
  | `Food allergy` | Food allergy | Allergie alimentaire |
  | `Drug allergy` | Drug allergy | Allergie médicamenteuse |
  | `Asthma / Respiratory` | Asthma / Respiratory | Asthme / Respiratoire |
  | `Diabetes` | Diabetes | Diabète |
  | `Hypertension` | Hypertension | Hypertension |
  | `Mobility / Accessibility` | Mobility / Accessibility | Mobilité / Accessibilité |
  | `Other health/allergy` | Other health/allergy | Autre santé/allergie |

  Stored values remain English so analytics, CSV exports and historical data stay consistent.
- Textarea placeholder becomes "Other health or allergy details" (FR: "Autres précisions sur la santé ou les allergies").
- Keep storing in the existing columns (`meal_preferences` string array + `dietary_notes` text) — **no schema change, no backend change**. The edge function `event-special-register/index.ts` is untouched; it already accepts arbitrary string arrays for `meal_preferences`.
- Keep `ev.collect_meal_preferences` as the toggle that shows/hides this section (still the same DB flag; we are only relabelling its UI).

### Admin report change (`src/pages/admin/super/SpecialEventReport.tsx`)

- Rename UI labels (English-only — the admin portal is English):
  - Tab trigger `"Meals & Dietary"` → `"Health & Allergies"`.
  - Filter placeholder `"Meal"` / option `"All meals"` → `"Health/Allergy"` / `"All health & allergies"`.
  - Section titles `"Meal preferences overall"` → `"Health & allergy concerns overall"`; `"Daily meal demand"` → `"Daily health & allergy load"`; `"Allergies & dietary notes"` → `"Allergies & health notes"`.
  - Table headers `"Meals"` → `"Health/Allergies"`.
  - Empty state `"No meal preferences captured."` → `"No health or allergy concerns captured."`.
  - CSV header `"Meal Preferences"` → `"Health/Allergies"`.
  - "Meal day rollup" comment/identifiers stay internal; chart `dataKey="meal"` and the `mealOptions` array stay as-is (they are dynamic from data, so the new option strings flow through automatically).
- Keep data column names (`meal_preferences`, `dietary_notes`) and types unchanged so historical records still load.

## Part B — Full FR/EN translation of the pre-registration flow

Stages covered, end-to-end:

1. **Hero header** — "Special Event Pre-Registration" badge, dates, location, fundraising campaign block. Event name/location use `localizedField(ev.name, ev.name_fr)` etc.
2. **Step indicator** — labels: You / Onboard / Family / Extras (FR: Vous / Inscription / Famille / Extras).
3. **Step 1 — Identify** — title, description, Email/Telephone toggle, input placeholders, "Check" button, "found" greeting ("Hello X, are you registering as a family or individual?"), Individual/Family choices, "missing" alert and Continue copy.
4. **Step 2 — Onboard** (`src/components/events/SpecialEventOnboardForm.tsx`) — every label, helper, placeholder, button and option:
   - Attendee-type chooser (Member / Visitor).
   - Region section.
   - Personal Information (Family Name, Other Names, Email, Phone, Address, DOB, Gender, Occupation + placeholders).
   - Spiritual Information (Foundation School Y/N + date, Baptism Y/N + date).
   - Ministry & Service intro + the 10 ministry option labels (stored values stay English).
   - Destiny Care Group selector + "Select region first" empty state.
   - Family Relationships block (search prompts, "Add relationship", empty state, badges).
   - Visitor Referral block (sources + social-media platforms + "Tell us more").
   - Join Interest radio (Yes / No / Undecided).
5. **Step 3 — Family & Children** — section title, description, "Your family" header, child/relationship badges, "Add person", empty state, per-row relationship dropdown, Email/Telephone toggle, lookup placeholder, Check, "Linked: …" / "We don't have this person yet — onboard them here.".
6. **Step 4 — Extras** (conditional):
   - Lodging — title, description, "I need lodging provided by the organizers", "Days you will attend", date pills localized via `date-fns/locale/fr` when `language === 'fr'`.
   - **Allergies & Health Challenges** — title, subtitle, the 7 options above, "Other health or allergy details" placeholder.
   - Pledge — title, description, currency line, amount placeholder.
7. **Action bar** — Back / Continue / Confirm registration / Submitting… / toasts.
8. **Done screen** — "You're registered!", body, "Browse other events".
9. **Error/not-available states** — "Event not available", body, "Back to events".

## Technical approach

1. **Extend `src/utils/languageUtils.ts`** with one new block of ~115 EN/FR key pairs covering the registration flow + the new health/allergy strings + the new option labels. Reuse keys that already exist (`firstName`, `lastName`, `email`, `phone`, `address`, `dateOfBirth`, `gender`, `occupation`, `back`, `yes`, `no`, `male`, `female`, `joinYes/No/Undecided`, `selectGender`, `socialMedia`, `website`, `invitedBy`, `other`, etc.) — no duplicates.
2. **Refactor `src/pages/SpecialEventRegister.tsx`**:
   - `const { t, localizedField, language } = useLanguage();`
   - Replace every literal English string with `t(...)`.
   - Move `REL_OPTIONS` / option lists into functions that return `t(...)` labels (stored value stays English).
   - Replace `MEAL_OPTIONS` with the new 7-item health/allergy list described above.
   - For event hero use `localizedField(ev.name, ev.name_fr)` and `localizedField(ev.location_name, ev.location_name_fr)`.
   - Format dates with `format(d, "PPP", { locale: language === 'fr' ? fr : undefined })` from `date-fns/locale/fr` (hero + "Days you will attend" pills).
3. **Refactor `src/components/events/SpecialEventOnboardForm.tsx`** the same way: wire `useLanguage`, swap every literal string (labels, helpers, placeholders, options, empty states, badges). Keep underlying stored values English (`spouse`, `facebook`, `invited_by`, …).
4. **Update `src/pages/admin/super/SpecialEventReport.tsx`** with the relabelled tab/filter/chart/table/CSV strings (English only — admin portal is English).
5. **No edge-function, schema, or payload change.** `event-pre-register-lookup` and `event-special-register` continue to receive the same shape; `meal_preferences` now carries the new health/allergy strings.

## Backward compatibility

- Historical attendees with old meal values ("Vegetarian", "Halal", …) still render correctly because the report builds its option list dynamically from the data. They will just appear alongside the new health/allergy values for past events. No migration needed.

## Files touched

- `src/utils/languageUtils.ts` — add ~115 EN/FR key pairs (incl. the new health/allergy section).
- `src/pages/SpecialEventRegister.tsx` — wire `useLanguage`, swap every literal string, swap `MEAL_OPTIONS` to the new 7-item list, localize dates and event content.
- `src/components/events/SpecialEventOnboardForm.tsx` — wire `useLanguage`, swap every literal string.
- `src/pages/admin/super/SpecialEventReport.tsx` — relabel meal → health/allergy UI strings (EN only).

## Verification

- Browser set to French → `/events/desco-2026/register` renders every stage (Identify → Onboard → Family → Extras → Done) in French, including the new "Allergies et problèmes de santé" section with translated options.
- Switching languages via the Navbar toggle flips all strings without losing form state.
- Submitting a registration: payload identical to before, with `meal_preferences` containing the new English stored values (e.g. `"Food allergy"`, `"Other health/allergy"`).
- In Super Admin → Special Event Report, the tab now reads "Health & Allergies", filters/charts/CSV reflect the new labels, and historical events still display their legacy meal values without errors.
