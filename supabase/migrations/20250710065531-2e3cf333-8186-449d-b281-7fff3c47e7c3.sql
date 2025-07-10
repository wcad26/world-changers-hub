-- Add member_type column to members table to differentiate between visitors and members
ALTER TABLE public.members 
ADD COLUMN member_type TEXT NOT NULL DEFAULT 'member';

-- Add a check constraint to ensure only valid member types
ALTER TABLE public.members 
ADD CONSTRAINT check_member_type 
CHECK (member_type IN ('member', 'visitor'));