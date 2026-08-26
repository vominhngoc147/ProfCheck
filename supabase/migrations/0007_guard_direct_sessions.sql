-- Migration 0007: allow direct DB admin sessions (no JWT) to change role/verification.
-- The escalation guard should only block authenticated app-level requests.

create or replace function public.guard_profile_escalation()
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
     and not is_staff() then
    raise exception 'permission denied: role/verification changes require staff';
  end if;
  return new;
end;
$$;
