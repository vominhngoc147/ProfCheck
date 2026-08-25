-- Migration 0005: student card verification flow
-- Private bucket 'student-cards' (created in 0001) + RLS on storage + claim RPC

-- 1. Student can upload/read own card in bucket 'student-cards' under folder <uid>/
create policy "card_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'student-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "card_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-cards'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_staff())
  );

create policy "card_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'student-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.student_card_url is not distinct from name
        and p.verification in ('none','card_pending')
    )
  );

-- 2. RPC: student submits card -> verification='card_pending'
-- (security definer because guard_profile_escalation blocks self-verification changes)
create or replace function public.submit_student_card(p_path text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set student_card_url = p_path,
      verification = case when verification = 'edu_verified' then 'edu_verified' else 'card_pending' end
  where id = v_uid;
end;
$$;

grant execute on function public.submit_student_card(text) to authenticated;
