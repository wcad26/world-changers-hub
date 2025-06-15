
-- Phase 1: Database Schema for DCGs and Financials

-- Create custom types (enums) for structured data
CREATE TYPE public.dcg_member_role AS ENUM ('Leader', 'Assistant', 'Member');
CREATE TYPE public.financial_transaction_type AS ENUM ('Income', 'Expense');

-- Create table for Destiny Care Groups (DCGs)
CREATE TABLE public.dcgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    meeting_day TEXT,
    meeting_time TIME,
    contact_phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to link members to DCGs
CREATE TABLE public.dcg_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dcg_id UUID NOT NULL REFERENCES public.dcgs(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    role public.dcg_member_role NOT NULL DEFAULT 'Member',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dcg_id, member_id)
);

-- Create table for financial transaction categories
CREATE TABLE public.financial_transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type public.financial_transaction_type NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create table for financial transactions
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    dcg_id UUID REFERENCES public.dcgs(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.financial_transaction_categories(id),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modify existing attendance_events table to link attendance to DCGs
ALTER TABLE public.attendance_events
ADD COLUMN dcg_id UUID REFERENCES public.dcgs(id) ON DELETE SET NULL;


-- Security: Row Level Security (RLS) Policies

-- Helper function to get region_id from a dcg_id for RLS checks
CREATE OR REPLACE FUNCTION public.get_region_from_dcg(_dcg_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT region_id FROM public.dcgs WHERE id = _dcg_id;
$$;

-- Enable RLS on new tables
ALTER TABLE public.dcgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcg_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transaction_categories ENABLE ROW LEVEL SECURITY;

-- Policy for dcgs: Regional admins can manage DCGs in their assigned region.
CREATE POLICY "Regional admins can manage DCGs in their region"
ON public.dcgs
FOR ALL
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Policy for dcg_members: Regional admins can manage DCG members in their assigned region.
CREATE POLICY "Regional admins can manage DCG members in their region"
ON public.dcg_members
FOR ALL
USING (public.user_belongs_to_region(auth.uid(), public.get_region_from_dcg(dcg_id)))
WITH CHECK (public.user_belongs_to_region(auth.uid(), public.get_region_from_dcg(dcg_id)));

-- Policy for financial_transactions: Regional admins can manage transactions in their assigned region.
CREATE POLICY "Regional admins can manage financial transactions in their region"
ON public.financial_transactions
FOR ALL
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Policies for financial_transaction_categories
CREATE POLICY "Authenticated users can view categories"
ON public.financial_transaction_categories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage categories"
ON public.financial_transaction_categories
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed Data: Insert default financial categories
INSERT INTO public.financial_transaction_categories (name, type, description) VALUES
('Tithe', 'Income', 'Regular tithe contributions'),
('Offering', 'Income', 'General offerings'),
('Project Fund', 'Income', 'Contributions for specific projects'),
('Donation', 'Income', 'General donations'),
('Utilities', 'Expense', 'Electricity, water, internet bills'),
('Rent/Mortgage', 'Expense', 'Building rental or mortgage payments'),
('Salaries', 'Expense', 'Staff and pastor salaries'),
('Missions', 'Expense', 'Funding for missionary activities'),
('Events', 'Expense', 'Costs associated with church events'),
('Supplies', 'Expense', 'Office, cleaning, and other supplies');

