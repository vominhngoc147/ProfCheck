-- Migration 0003: professor role, opportunities & applications (D9-D12)
-- Run statement-by-statement via pooler (see PROJECT.md §6 DB note).

-- 1. Add 'professor' role to profiles
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student','professor','moderator','admin'));

-- 2. Opportunities: listings a professor posts for students (D12)
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professors(id) on delete cascade,
  type text not null check (type in ('nckh','kltn','luan_van','thuc_tap','khac')),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  slots_total int not null default 1 check (slots_total >= 1),
  slots_left int not null default 1 check (slots_left >= 0),
  deadline date,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create index idx_opportunities_professor on public.opportunities(professor_id);
create index idx_opportunities_status_type on public.opportunities(status, type);

-- 3. Applications: students apply to opportunities
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  unique (opportunity_id, student_id)
);

create index idx_applications_student on public.applications(student_id);

-- 4. RLS
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;

create policy "opportunities_select_all" on public.opportunities
  for select using (true);

create policy "opportunities_insert_owner" on public.opportunities
  for insert with check (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "opportunities_update_owner" on public.opportunities
  for update using (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "opportunities_delete_owner" on public.opportunities
  for delete using (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "applications_select_involved" on public.applications
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.opportunities o
      join public.professors p on p.id = o.professor_id
      where o.id = opportunity_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('moderator','admin')
    )
  );

create policy "applications_insert_verified_student" on public.applications
  for insert with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.verification <> 'none'
    )
    and exists (
      select 1 from public.opportunities o
      join public.professors p on p.id = o.professor_id
      where o.id = opportunity_id
        and o.status = 'open'
        and o.slots_left > 0
        and (p.owner_profile_id is null or p.owner_profile_id <> auth.uid())
    )
  );

create policy "applications_update_involved" on public.applications
  for update using (
    student_id = auth.uid()
    or exists (
      select 1 from public.opportunities o
      join public.professors p on p.id = o.professor_id
      where o.id = opportunity_id and p.owner_profile_id = auth.uid()
    )
  );

-- 5. Decrement slots_left when an application is accepted
create or replace function public.on_application_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update public.opportunities
    set slots_left = greatest(slots_left - 1, 0)
    where id = new.opportunity_id;
  end if;
  return new;
end;
$$;

create trigger trg_application_accepted
  after update of status on public.applications
  for each row execute function public.on_application_accepted();
