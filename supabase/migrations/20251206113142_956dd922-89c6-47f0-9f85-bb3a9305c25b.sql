-- Clean up duplicate Timah Chimbo records created due to the bug
-- Delete the duplicate visitor member record first
DELETE FROM members 
WHERE id = 'c250febc-a99f-441f-bea5-5c22dd92f878';

-- Delete the duplicate profile
DELETE FROM profiles 
WHERE id = 'c0ab7e37-0b58-4902-80e7-3c675b28388f';