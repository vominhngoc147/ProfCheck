-- Migration 0008: allow direct DB admin sessions (no JWT) to bypass the
-- 0001 profile guard as well (same rationale as 0007).

create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Direct SQL sessions (migrations, psql/pooler admin) carry no JWT claims
  if coalesce(
    current_setting('request.jwt.claim.sub', true),
    current_setting('request.jwt.claims', true)
  ) is null then
    return new;
  end if;

  if (new.role is distinct from old.role or new.verification is distinct from old.verification)
     and not public.is_staff() then
    raise exception 'Chỉ admin/moderator được thay đổi quyền hoặc trạng thái xác thực';
  end if;
  return new;
end;
$$;
