-- Migration 0012: lock down _migrations bookkeeping table (security advisor)
-- RLS on with no policies = deny all app-level access; the migrate runner
-- connects via direct SQL (table owner) so it is unaffected.

alter table public._migrations enable row level security;
