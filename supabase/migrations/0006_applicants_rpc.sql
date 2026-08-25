-- Migration 0006: professor lists applicants of own opportunities

create or replace function public.list_applicants(p_opportunity_id uuid)
returns table (
  student_name text,
  message text,
  status text,
  created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select pr.display_name, a.message, a.status, a.created_at
  from public.applications a
  join public.profiles pr on pr.id = a.student_id
  where a.opportunity_id = p_opportunity_id
    and exists (
      select 1
      from public.opportunities o
      join public.professors pf on pf.id = o.professor_id
      where o.id = p_opportunity_id
        and pf.owner_profile_id = auth.uid()
    )
  order by a.created_at desc;
$$;

grant execute on function public.list_applicants(uuid) to authenticated;
