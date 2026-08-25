-- Demo seed data (viewable UI sample) — safe to re-run
insert into public.faculties (school_id, slug, name_vi, name_en)
select s.id, 'lps', 'Trường Luật và Khoa học Chính trị', 'School of Law and Political Science'
from public.schools s where s.slug = 'ftu'
on conflict do nothing;

insert into public.professors
  (school_id, faculty_id, slug, full_name, academic_title, bio, research_interests, source_status, review_count, avg_overall, avg_difficulty, avg_fairness, would_take_again_pct)
select s.id, f.id, v.slug, v.full_name, v.title, v.bio,
       string_to_array(trim(v.interests), ',') as interests_arr,
       'seed', v.rc, v.avg, v.diff, v.fair, v.wta
from public.schools s
join public.faculties f on f.school_id = s.id and f.slug = 'lps'
join (values
  ('nguyen-van-a', N'Nguyễn Văn A', N'TS', N'Giảng viên Luật Dân sự, quan tâm luật hợp đồng và tranh chấp thương mại.', N'luật hợp đồng,tranh chấp thương mại,luật dân sự', 12, 4.2, 2.8, 4.5, 83),
  ('tran-thi-b', N'Trần Thị B', N'ThS', N'Giảng viên Luật Hiến pháp và Khoa học Chính trị.', N'luật hiến pháp,chính trị so sánh,rights', 7, 3.9, 3.6, 4.1, 71),
  ('le-van-c', N'Lê Văn C', N'PGS.TS', N'Phó giáo sư Luật Quốc tế, hướng dẫn nhiều đề tài NCKH sinh viên.', N'luật quốc tế,WTO,đầu tư nước ngoài', 21, 4.6, 3.9, 4.7, 91),
  ('pham-thi-d', N'Phạm Thị D', N'TS', N'Giảng viên Luật Hình sự.', N'luật hình sự,tố tụng hình sự', 5, 3.4, 4.3, 3.6, 58)
) as v(slug, full_name, title, bio, interests, rc, avg, diff, fair, wta)
on true
on conflict (school_id, slug) do nothing;


-- one open opportunity for demo of /prof/slots style data
insert into public.opportunities (professor_id, type, title, description, tags, slots_total, slots_left)
select p.id, 'nckh', N'Sinh viên tham gia đề tài NCKH về tranh chấp thương mại quốc tế', N'Cần 2 bạn năm 3-4, GPA từ 3.2, có kỹ năng tiếng Anh. Công việc: thu thập tài liệu, phân tích án lệ.', string_to_array(N'tranh chấp thương mại,tiếng anh,án lệ', ','), 2, 2
from public.professors p where p.slug = 'le-van-c'
on conflict do nothing;
