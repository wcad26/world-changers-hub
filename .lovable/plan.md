# Merge the two "Kibula Fanny" records into one

## What is on file today

Two separate records exist for the same person, both in WCA Douala, both in the Japoma group:

| | Record A (Jan 2026) | Record B (Jun 2026) |
|---|---|---|
| ID shown | WCAD-2026-0364 | WCAD-2026-0452 |
| Email | mfan85@yahoo.com | fannykibula1@gmail.com |
| Phone | 677412785 | +273677412785 |
| Date of birth | missing | 19/01/1985 |
| Type | Member | Visitor |
| Attendances | 45 | 24 |
| Family links | spouse of Terence + the three children | spouse of Terence only |
| Event pre-registrations | none | 1 |
| Group membership | Japoma (joined 31/01/2026) | Japoma (joined 16/06/2026) |

Neither record has a login account or an admin role, so nothing about sign-in changes.

## The merge

Keep **Record A** as the surviving person (it holds the longer history, the member status and the full family), and fold Record B into it:

- **Email**: replace with the most recent one from registration — fannykibula1@gmail.com.
- **Date of birth**: take 19/01/1985 from Record B (A has none).
- **Phone**: keep the clean 677412785; the other is the same number with a mistyped country code.
- **Other details** (address, gender, name): identical, keep as is.
- **Status**: stays Member.

Everything attached to Record B moves onto Record A:

- **Attendance**: all 24 attendances move across. Four meetings were recorded under both records — those duplicates are dropped so the person is counted once per meeting, and the earliest record of each is kept.
- **Family links**: the duplicate "spouse of Terence" link is dropped (Record A already has it); the children links stay on Record A. Result: one household with Terence, Fanny and the three children.
- **Event pre-registration**: the one registration moves to Record A.
- **Group membership**: the two Japoma rows collapse into one, keeping the earlier join date (31/01/2026).
- Anything else pointing at Record B (certificates, feedback, pledges, discipleship, transfers) is repointed too, even though there is none today.

Record B and its profile are then deleted, so the household and all reports show one Fanny.

## Technical details

A one-off data script (run through SQL, not a schema migration), in a single transaction:

1. `UPDATE profiles` on A: `email = 'fannykibula1@gmail.com'`, `date_of_birth = '1985-01-19'`.
2. Repoint child tables from B to A: `attendance_records`, `event_pre_registrations`, `certificates`, `event_feedback` (both `member_id` and `profile_id`), `fundraising_pledges`, `discipleship_relationships` (disciple + mentor), `discipleship_progress.recorded_by`, `member_transfers`, `dcgs.leader_id`, `wcbn_members`, `member_relationships` (both sides).
3. Deduplicate after repointing:
   - `attendance_records`: keep one row per (event_id, member_id) — lowest `created_at`.
   - `member_relationships`: keep one row per (member_id, related_member_id, relationship_type); drop any self-link.
   - `dcg_members`: keep one row per (dcg_id, member_id) — earliest `joined_date`.
4. `DELETE FROM members WHERE id = 'e08c4dbf-…'` then `DELETE FROM profiles WHERE id = 'e08c4dbf-…'`.
5. Re-query afterwards to confirm: one Fanny in the region, one spouse link to Terence, three child links, 65 distinct attendance rows, one Japoma membership.

No schema change, no code change, no edge-function change. Fee pricing already treats the household correctly and will simply see one spouse instead of two.

## Optional follow-up (not included)

A reusable "merge duplicate records" action in the admin member list, so future duplicates can be merged without a script. Say the word and I will plan it separately.
