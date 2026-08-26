-- Fix 1: Grant SELECT on author_id back to authenticated (needed for /me page)
-- Anonymity is enforced by the public_reviews view which nullifies author_id for anon
GRANT SELECT (author_id) ON public.reviews TO authenticated;

-- Fix 2: Revoke dangerous write permissions on public_reviews view
-- The view should be read-only for everyone
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_reviews FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_reviews FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_reviews FROM service_role;

-- Ensure only SELECT is granted (safe reads only)
GRANT SELECT ON public.public_reviews TO anon, authenticated;
