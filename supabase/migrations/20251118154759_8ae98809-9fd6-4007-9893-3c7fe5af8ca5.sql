-- Migration to create attendance events and records for previously registered visitors
-- This ensures all visitors who registered for events are marked as having attended

DO $$
DECLARE
  v_event RECORD;
  v_attendance_event_id UUID;
  v_event_date DATE;
  v_records_created INTEGER;
BEGIN
  RAISE NOTICE 'Starting backfill migration for visitor attendance records...';
  
  -- Loop through each event that has visitors without attendance records
  FOR v_event IN (
    SELECT DISTINCT
      e.id as event_id,
      e.name as event_name,
      e.start_datetime,
      e.region_id
    FROM members m
    JOIN events e ON m.rated_event_id = e.id
    LEFT JOIN attendance_records ar ON ar.member_id = m.id
    WHERE m.member_type = 'visitor'
      AND m.rated_event_id IS NOT NULL
      AND ar.id IS NULL
  )
  LOOP
    -- Extract event date
    v_event_date := DATE(v_event.start_datetime);
    
    RAISE NOTICE 'Processing event: % (Date: %)', v_event.event_name, v_event_date;
    
    -- Check if attendance_event already exists
    SELECT id INTO v_attendance_event_id
    FROM attendance_events
    WHERE event_date = v_event_date
      AND region_id = v_event.region_id
      AND name ILIKE '%' || v_event.event_name || '%'
    LIMIT 1;
    
    -- Create attendance_event if it doesn't exist
    IF v_attendance_event_id IS NULL THEN
      INSERT INTO attendance_events (
        name,
        event_date,
        region_id,
        description,
        created_at,
        updated_at
      ) VALUES (
        'Attendance - ' || v_event.event_name,
        v_event_date,
        v_event.region_id,
        'Attendance tracking for ' || v_event.event_name,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_attendance_event_id;
      
      RAISE NOTICE '✓ Created attendance_event (ID: %) for event: %', v_attendance_event_id, v_event.event_name;
    ELSE
      RAISE NOTICE '✓ Using existing attendance_event (ID: %) for event: %', v_attendance_event_id, v_event.event_name;
    END IF;
    
    -- Create attendance records for all visitors of this event who don't have one
    WITH inserted_records AS (
      INSERT INTO attendance_records (
        event_id,
        member_id,
        is_present,
        recorded_at
      )
      SELECT 
        v_attendance_event_id,
        m.id,
        true,
        m.created_at
      FROM members m
      LEFT JOIN attendance_records ar ON ar.member_id = m.id AND ar.event_id = v_attendance_event_id
      WHERE m.member_type = 'visitor'
        AND m.rated_event_id = v_event.event_id
        AND ar.id IS NULL
      RETURNING id
    )
    SELECT COUNT(*) INTO v_records_created FROM inserted_records;
    
    RAISE NOTICE '✓ Created % attendance records for visitors of event: %', v_records_created, v_event.event_name;
  END LOOP;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '==========================================';
END $$;