## Goal

Make the "Family & Children" step (step 2) smart: when the primary registrant is an existing member, auto-load all family members they already have relationships with so they only need to **tick** who is attending. Keep "Add person" for ad-hoc additions, persist any new relationship both ways (logically), and place Back / Continue side-by-side on mobile.

## Changes

### 1. Extend the lookup edge function — `supabase/functions/event-pre-register-lookup/index.ts`

When a primary is found, also return their existing family. Query `member_relationships` for rows where the primary is on **either side** (chunked `.in()` on both `member_id` and `related_member_id`, mirroring `fetchMemberRelationshipsForMembers`). For each related member, resolve profile + member info and compute the relationship label **from the primary's perspective** using an inverse map:

```text
spouse ↔ spouse
parent ⇄ child
guardian → (other side sees) ward / "other"
sibling ↔ sibling
other ↔ other
```

Return the related members as:
```
relations: [{ member_id, profile_id, first_name, last_name, email, phone,
              date_of_birth, is_child, relationship_type }]
```

`is_child` = age < 16 when DOB is known.

### 2. `src/pages/SpecialEventRegister.tsx` — prefill family from `relations`

- Extend `Lookup` type with `relations`.
- Add a new `FamilyRow` flavour for *prefilled* members carrying `existing_member_id`, profile fields, and a new `attending: boolean` (default **false** — user must tick).
- After `handleLookup` returns `found`, seed `family` from `data.relations` (one row each, `status: "found"`, `attending: false`).
- In the Family step UI:
  - Render prefilled rows as compact tiles with: checkbox (attending), name, relationship badge, "child" pill if applicable. No "Check" button, no email/phone inputs for these rows.
  - Keep the existing manual flow (Add person → email/phone lookup → if missing, capture details) for ad-hoc additions.
  - "Remove" on a prefilled row just unticks/hides it from this registration but does not delete the relationship in DB.
- On submit, only include family rows where `attending === true` (prefilled) OR rows the user added manually.

### 3. Bidirectional relationships

The DB already stores one row per pair, and `fetchMemberRelationshipsForMembers` reads both directions, so reads are already bidirectional. We will:

- **Not** duplicate rows (no symmetric insert).
- In `event-special-register/index.ts`, when inserting a brand-new relationship for an ad-hoc family addition, first check (both directions) whether a row already exists — if not, insert one row using the relationship as given. Reads via the lookup function (step 1) and existing utilities will surface it for either party.
- Fix the existing duplicate-detection query in `event-special-register` (currently uses a fragile `.or(and(...),and(...))` string) by switching to two `.in()` queries — same pattern as `fetchMemberRelationshipsForMembers` — to avoid silent partial results.

### 4. Mobile Back / Continue layout — `renderActions()`

Change the wrapper to a 2-column grid on mobile so Back (left) and Continue (right) sit on the same row:

```text
grid grid-cols-2 gap-3 sm:flex sm:justify-end
```

When there's no Back (first step), Continue spans both columns via `col-span-2` so the layout doesn't shift.

### 5. Out of scope

- No schema changes (member_relationships already supports this).
- Self-registration of a spouse who is already pre-registered by their partner is naturally handled: the `event_pre_registrations` upsert is keyed on `(event_id, member_id)`, so re-submitting is a no-op. No extra UI for that case in this pass.

## Files touched

- `supabase/functions/event-pre-register-lookup/index.ts` — return `relations[]`
- `supabase/functions/event-special-register/index.ts` — robust relationship dedupe
- `src/pages/SpecialEventRegister.tsx` — auto-populate family, tick-to-attend UI, mobile button row
