-- Tiered registration fees per event
create table public.event_registration_fees (
  id uuid not null default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null check (category in ('leader','member','child')),
  label text,
  amount bigint not null default 0 check (amount >= 0),
  currency_code text references public.currencies(code),
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

GRANT SELECT ON public.event_registration_fees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registration_fees TO authenticated;
GRANT ALL ON public.event_registration_fees TO service_role;

alter table public.event_registration_fees enable row level security;

create policy "Public can read fees of public special events"
  on public.event_registration_fees for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.is_public = true and e.is_special = true
    )
  );

create policy "Regional and super admins manage fees"
  on public.event_registration_fees for all to authenticated
  using (
    public.is_super_admin_user(auth.uid())
    or (
      public.has_role(auth.uid(), 'regional_admin')
      and exists (
        select 1 from public.events e
        where e.id = event_id
          and e.region_id is not null
          and public.user_belongs_to_region(auth.uid(), e.region_id)
      )
    )
  )
  with check (
    public.is_super_admin_user(auth.uid())
    or (
      public.has_role(auth.uid(), 'regional_admin')
      and exists (
        select 1 from public.events e
        where e.id = event_id
          and e.region_id is not null
          and public.user_belongs_to_region(auth.uid(), e.region_id)
      )
    )
  );

create trigger trg_event_registration_fees_updated
  before update on public.event_registration_fees
  for each row execute function public.trigger_set_timestamp();

-- Per-registrant fee snapshot and payment tracking
alter table public.event_pre_registrations
  add column if not exists registration_fee_category text,
  add column if not exists registration_fee_amount bigint,
  add column if not exists fee_status text not null default 'unpaid' check (fee_status in ('unpaid','paid','waived')),
  add column if not exists fee_paid_at timestamp with time zone;

-- Ledger category for collected registration fees
insert into public.financial_transaction_categories (name, type, description, is_active)
values ('Event Registration Fees', 'Income', 'Registration fees collected for special events', true)
on conflict (name) do nothing;