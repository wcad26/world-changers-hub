-- Mark two additional visitors as present for IGNITE event
-- Brenda Calice LEKAUKENG BOUZAP (WCAD-2025-0098)
-- Natacha Merveille MBOGNE KAMGA (WCAD-2025-0097)

INSERT INTO attendance_records (
  id,
  event_id,
  member_id,
  is_present,
  recorded_at
)
VALUES
  (
    gen_random_uuid(),
    'bebd3f09-bde8-4c84-b8ca-b56978860395'::uuid, -- IGNITE event ID
    '54b8ff1c-6f44-447d-83ef-bf20ba364143'::uuid, -- Brenda Calice
    true,
    now()
  ),
  (
    gen_random_uuid(),
    'bebd3f09-bde8-4c84-b8ca-b56978860395'::uuid, -- IGNITE event ID
    'd5ea3531-cab7-4586-9157-226439c8544a'::uuid, -- Natacha Merveille
    true,
    now()
  );