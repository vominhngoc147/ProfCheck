-- Migration 0002: Sửa tên đơn vị — gộp thành một: Trường Luật và Khoa học Chính trị (LPS)
alter table public.faculties
  add column if not exists code text;

delete from public.faculties
where school_id = (select id from public.schools where slug = 'ftu');

with s as (select id from public.schools where slug = 'ftu')
insert into public.faculties (school_id, slug, name_vi, name_en, code)
select s.id, 'lps', 'Trường Luật và Khoa học Chính trị',
       'School of Law and Political Science', 'LPS'
from s;
