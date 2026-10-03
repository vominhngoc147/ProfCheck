-- Migration 0020: report reasons enum (dot 4)
-- New set: doc_hai / sai_su_that / xuc_pham / spam / khac.
-- Normalize legacy values first (toxic->xuc_pham, false->sai_su_that, pii->khac).

update public.reports set reason = 'xuc_pham' where reason = 'toxic';
update public.reports set reason = 'sai_su_that' where reason = 'false';
update public.reports set reason = 'khac' where reason = 'pii';
update public.reports set reason = 'khac'
  where reason not in ('doc_hai', 'sai_su_that', 'xuc_pham', 'spam', 'khac');

alter table public.reports
  drop constraint if exists reports_reason_check;
alter table public.reports
  add constraint reports_reason_check check (
    reason in ('doc_hai', 'sai_su_that', 'xuc_pham', 'spam', 'khac')
  );
