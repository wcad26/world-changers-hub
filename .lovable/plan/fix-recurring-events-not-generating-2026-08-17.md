# Fix: Recurring events not generating

## What is wrong

The recurring series themselves are being saved correctly — two series already exist in the database. What fails is the step that creates the actual future events: the `generate-recurring-events` function is not deployed, so every call from the app returns "Failed to send a request to the Edge Function" (confirmed: a direct call returns 404 NOT_FOUND, and the function has no logs at all).

That also explains the empty "Recurring Series" dialog on the DCG page: the list is scoped to the current DCG, and no occurrences were ever produced.

## Fix

1. Deploy `generate-recurring-events` and confirm it responds instead of 404.
2. Run it once on demand and verify it creates the missing occurrences (plus their attendance sessions) for the two existing series.
3. Verify the "Recurring Series" dialog now lists the series for the DCG that owns them, and that generated occurrences appear in the events table with the Recurring badge.
4. Schedule the daily top-up job (pg_cron + pg_net calling the function) so the chosen lead time stays filled without anyone pressing "Generate now".
5. If the on-demand run surfaces further errors (date maths, attendance insert, duplicate slots), fix them in the function and re-verify.

## Technical notes

- The function uses the service role key, so RLS is not the blocker; it simply was never shipped.
- Scheduling uses the insert tool (not a migration) because the SQL embeds the project URL and anon key.
- Duplicate protection already exists via the unique index on (`recurrence_rule_id`, `start_datetime`), so re-running the generator is safe.
