-- Add join_interest column to members table for tracking visitor interest in joining WCA
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS join_interest text CHECK (join_interest IN ('yes', 'no', 'undecided'));