-- Add foundation_school_date column to members table
ALTER TABLE public.members 
ADD COLUMN foundation_school_date date;

-- Add comment for documentation
COMMENT ON COLUMN public.members.foundation_school_date 
IS 'Date when member completed Foundation School';