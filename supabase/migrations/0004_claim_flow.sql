-- Migration 0004: professor claim flow (D11) + profiles self-update guards

-- 1. Guard: non-staff cannot change their own role or verification
create or replace function public.guard_profile_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.verification is distinct from old.verification)
     and not is_staff() then
    raise exception 'permission denied: role/verification changes require staff';
  end if;
  return new;
end;
$$;

create trigger trg_profile_escalation before update on public.profiles
  for each row execute function public.guard_profile_escalation();

-- 2. Submit a professor claim (D11 hybrid):
--    - claimant email domain in school's edu_domains -> auto approve + take ownership
--    - otherwise -> pending for admin review
--    Returns 'approved' | 'pending' | 'already_owned'.
create or replace function public.submit_professor_claim(
  p_professor_id uuid,
  p_evidence_url text default null
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_domain text;
  v_school_id uuid;
  v_owner uuid;
  v_edu_domains text[];
  v_existing text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select school_id, owner_profile_id into v_school_id, v_owner
  from public.professors where id = p_professor_id;
  if not found then
    raise exception 'professor not found';
  end if;

  if v_owner = v_uid then
    return 'already_owned';
  end if;

  -- one active claim per claimant/professor
  select status into v_existing
  from public.professor_claims
  where professor_id = p_professor_id and claimant_id = v_uid and status = 'pending'
  limit 1;
  if v_existing is not null then
    return 'pending';
  end if;

  select email into v_email from auth.users where id = v_uid;
  v_domain := lower(split_part(coalesce(v_email,''), '@', 2));

  select edu_domains into v_edu_domains
  from public.schools where id = v_school_id;

  if v_domain <> '' and v_domain = any(v_edu_domains) then
    insert into public.professor_claims (professor_id, claimant_id, evidence_url, status)
    values (p_professor_id, v_uid, p_evidence_url, 'approved');

    update public.professors
    set source_status = 'claimed', owner_profile_id = v_uid
    where id = p_professor_id;

    update public.profiles set role = 'professor' where id = v_uid and role = 'student';

    return 'approved';
  else
    insert into public.professor_claims (professor_id, claimant_id, evidence_url, status)
    values (p_professor_id, v_uid, p_evidence_url, 'pending');
    return 'pending';
  end if;
end;
$$;

grant execute on function public.submit_professor_claim(uuid, text) to authenticated;
