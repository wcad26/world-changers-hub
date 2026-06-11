# Clean Test Registrations & Pledges

## Findings

- **Event "DESCO 2026"** (`078aff4a-8910-4332-90b4-8f41d9026cf6`) has **2 pre-registrations**:
  - Chimbo Timah — chimbotimah@gmail.com — pledge XAF 1,000
  - test test name — test@gmail.com — pledge XAF 10,000
- **Campaign "DESCO 2K26"** (`0a6f60df-9b4e-4330-9d12-530101131af3`) has **0 rows** in `fundraising_donations` — nothing to clean there.
- Pledge amounts are stored directly on `event_pre_registrations.pledge_amount`, so removing these 2 rows clears both the event registrations and their pledges in one step.
- Members/profiles (users) will NOT be touched.

## Action

Run a single delete against `event_pre_registrations`:

```sql
DELETE FROM event_pre_registrations
WHERE event_id = '078aff4a-8910-4332-90b4-8f41d9026cf6';
```

Affected rows: 2. Member records (WCAD-2026-0383, WCAD-2026-0452) and all auth users remain intact.

## Verification

After deletion, the All Registrations table for DESCO 2026 should show 0 entries, and the campaign progress card should remain at its current state (no donations existed).
