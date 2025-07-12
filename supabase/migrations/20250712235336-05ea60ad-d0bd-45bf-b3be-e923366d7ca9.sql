-- Delete all data associated with timah@gmail.com user
-- First get the user ID
DO $$
DECLARE
    target_user_id uuid;
    target_dcg_id uuid;
BEGIN
    -- Get the user ID for timah@gmail.com
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE email = 'timah@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Get any DCG this user is associated with
        SELECT dcg_id INTO target_dcg_id 
        FROM dcg_user_sessions 
        WHERE user_id = target_user_id;
        
        -- Delete DCG user sessions
        DELETE FROM dcg_user_sessions WHERE user_id = target_user_id;
        
        -- Delete user roles
        DELETE FROM user_roles WHERE user_id = target_user_id;
        
        -- If there was a DCG, delete all related DCG data
        IF target_dcg_id IS NOT NULL THEN
            -- Delete DCG members
            DELETE FROM dcg_members WHERE dcg_id = target_dcg_id;
            
            -- Delete attendance records for events related to this DCG
            DELETE FROM attendance_records 
            WHERE event_id IN (
                SELECT id FROM attendance_events WHERE dcg_id = target_dcg_id
            );
            
            -- Delete attendance events for this DCG
            DELETE FROM attendance_events WHERE dcg_id = target_dcg_id;
            
            -- Delete financial transactions for this DCG
            DELETE FROM financial_transactions WHERE dcg_id = target_dcg_id;
            
            -- Delete events for this DCG
            DELETE FROM events WHERE dcg_id = target_dcg_id;
            
            -- Finally delete the DCG itself
            DELETE FROM dcgs WHERE id = target_dcg_id;
        END IF;
        
        -- Delete the user's member record if it exists
        DELETE FROM members WHERE profile_id = target_user_id;
        
        -- Delete the user's profile
        DELETE FROM profiles WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully deleted all data for user timah@gmail.com';
    ELSE
        RAISE NOTICE 'No user found with email timah@gmail.com';
    END IF;
END $$;