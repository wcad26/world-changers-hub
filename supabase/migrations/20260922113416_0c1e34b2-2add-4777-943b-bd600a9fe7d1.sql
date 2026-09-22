-- Public, read-only aggregate for regional pages: DCG list with leader name and
-- member counts (children excluded) computed in one round-trip.
create or replace function public.get_public_region_dcgs(_region_id uuid)
returns table(
  id uuid,
  name text,
  description text,
  location text,
  meeting_day text,
  meeting_time text,
  leader_name text,
  member_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with dm as (
    select dmem.dcg_id, dmem.member_id, p.date_of_birth
    from dcg_members dmem
    join members m on m.id = dmem.member_id
    left join profiles p on p.id = m.profile_id
    where dmem.is_active
      and dmem.dcg_id in (select d.id from dcgs d where d.region_id = _region_id and d.is_active)
  ),
  under16 as (
    select distinct member_id
    from dm
    where date_of_birth is not null
      and date_of_birth > (current_date - interval '16 years')
  ),
  children as (
    select distinct u.member_id
    from under16 u
    join member_relationships mr
      on mr.member_id = u.member_id or mr.related_member_id = u.member_id
    join members rm
      on rm.id = case when mr.member_id = u.member_id then mr.related_member_id else mr.member_id end
    left join profiles rp on rp.id = rm.profile_id
    where rp.date_of_birth is null
       or rp.date_of_birth <= (current_date - interval '16 years')
  ),
  counts as (
    select dcg_id, count(distinct member_id)::bigint as member_count
    from dm
    where member_id not in (select member_id from children)
    group by dcg_id
  )
  select
    d.id,
    d.name,
    d.description,
    d.location,
    d.meeting_day::text,
    d.meeting_time::text,
    nullif(trim(concat(coalesce(lp.last_name, ''), ' ', coalesce(lp.first_name, ''))), '') as leader_name,
    coalesce(c.member_count, 0)
  from dcgs d
  left join profiles lp on lp.id = d.leader_id
  left join counts c on c.dcg_id = d.id
  where d.region_id = _region_id
    and d.is_active
  order by d.name;
$$;

grant execute on function public.get_public_region_dcgs(uuid) to anon, authenticated, service_role;