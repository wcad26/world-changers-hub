-- Add cost fields to events table
ALTER TABLE public.events 
ADD COLUMN cost numeric DEFAULT 0,
ADD COLUMN cost_currency_code text;

-- Add foreign key constraint to currencies table
ALTER TABLE public.events
ADD CONSTRAINT events_cost_currency_code_fkey 
FOREIGN KEY (cost_currency_code) 
REFERENCES public.currencies(code);

-- Add comment for documentation
COMMENT ON COLUMN public.events.cost IS 'Event cost amount. 0 or NULL means free event';
COMMENT ON COLUMN public.events.cost_currency_code IS 'Currency code for the event cost, references currencies table';