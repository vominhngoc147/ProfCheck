-- Real CEPM professor seed crawled from cepm.ftu.edu.vn (41 professors)
-- Safe to re-run (idempotent upsert on school_id+slug).

-- First ensure CEPM faculty exists
insert into public.faculties (school_id, slug, name_vi, name_en)
select s.id, 'cepm', 'Viện Kinh tế và Quản lý công', 'Center for Economics and Public Management'
from public.schools s where s.slug = 'ftu'
on conflict do nothing;

-- Insert professors
insert into public.professors (school_id, faculty_id, slug, full_name, academic_title, bio, research_interests, source_status)
select s.id, f.id, v.slug, v.full_name, v.title, v.bio, v.interests::text[], 'seed'
from public.schools s
join public.faculties f on f.school_id = s.id and f.slug = 'cepm'
join (values
    -- Page 1
    ('vu-kim-dung', 'TS. Vũ Kim Dung', 'TS', 'Lĩnh vực giảng dạy, nghiên cứu: Kinh doanh quốc tế. Quá trình học tập: Cử nhân Thương mại quốc tế – Trường Đại học Ngoại thương; Thạc sĩ Chính sách và Luật Thương mại quốc tế – Trường Đại học Ngoại thương; Tiến sĩ Kinh tế quốc tế – Trường Đại học Ngoại thương. Email: dungvk@ftu.edu.vn', '{Kinh doanh quốc tế,Thương mại quốc tế,Chính sách thương mại}'),
    ('le-my-huong', 'ThS Lê Mỹ Hương', 'ThS', 'Lĩnh vực giảng dạy, nghiên cứu: Quản lý chuỗi cung ứng, Chuỗi giá trị, Mô hình kinh doanh, Nghiên cứu vận hành và khoa học quản lý. Quá trình học tập: Cử nhân Kinh doanh quốc tế tại trường Đại học Ngoại thương (2014); Thạc sĩ Quản lý chuỗi cung ứng và Logistics tại trường Đại học Southampton, Anh Quốc (2015). Công trình NCKH tiêu biểu: Thành viên chính đề tài cấp Bộ "Triển khai các cam kết của Việt Nam liên quan tới di chuyển lao động trong cộng đồng kinh tế ASEAN" (2019-2021); Tham gia xuất bản sách "Chi phí và năng lực Logistics tại Việt Nam" (2020), NXB Công thương. Email: huonglm@ftu.edu.vn', '{Quản lý chuỗi cung ứng,Logistics,Chuỗi giá trị,Mô hình kinh doanh,Nghiên cứu vận hành}'),
    ('pham-thi-minh-chau', 'ThS Phạm Thị Minh Châu', 'ThS', 'Quá trình học tập: Cử nhân Tài chính ứng dụng tại ĐH Macquarie, Úc (2013); Thạc sĩ Kinh doanh quốc tế tại ĐH Latrobe, Úc (2014). Công trình NCKH tiêu biểu: "Towards innovation and creativity for Vietnamese startups in the context of the industrial revolution 4.0" (2020); "Factors affecting the intention to subscribe to online music streaming services of young Vietnamese consumers" (2019) tại Tạp chí Kinh tế dự báo; "Prospects of online retail market in Vietnam" (2018); "An analysis on shopping behaviors of different consumer groups in Vietnam" (2018).', '{Kinh doanh quốc tế,Tài chính ứng dụng,Khởi nghiệp,Thương mại điện tử,Hành vi người tiêu dùng}'),
    ('tran-thu-trang', 'TS Trần Thu Trang', 'TS', 'Quá trình học tập: Cử nhân ngành Kinh tế đối ngoại tại trường Đại học Ngoại thương (2005); Thạc sĩ chuyên ngành Marketing/Marketing chiến lược và vận hành tại Viện quản trị Rennes – Đại học Rennes 1 (Pháp) (2006); Tiến sĩ chuyên ngành Quản trị tại HEC Montréal (Canada) (2017). Công trình NCKH tiêu biểu: Thành viên đề tài cấp Bộ "Hoạt động đổi mới sáng tạo của doanh nghiệp xã hội tại Việt Nam" (2020/2021); Thành viên đề tài cấp Bộ "Quản trị quan hệ khách hàng CRM trong các doanh nghiệp xuất khẩu Việt Nam" (2010/2011); "Nghiên cứu hành vi tiêu dùng mỹ phẩm hữu cơ của phụ nữ Việt Nam", Tạp chí Kinh tế và Dự báo (2019).', '{Marketing,Marketing chiến lược,Quản trị,Hành vi người tiêu dùng,CRM}'),
    ('tran-hai-ly', 'TS Trần Hải Ly', 'TS', 'Quá trình học tập: Cử nhân Quản trị Kinh doanh tại ĐH Kinh tế quốc dân (2003); Thạc sĩ Quản trị Kinh doanh tại Trung tâm Pháp Việt đào tạo về Quản lý, ĐH KTQD (2005); Tiến sĩ Marketing tại trường ĐH Kinh tế quốc dân (2020). Công trình NCKH tiêu biểu: Thành viên đề tài cấp Nhà nước "Đề xuất giải pháp để thúc đẩy xuất khẩu sản phẩm nông sản chủ lực của Tây Nguyên" (2019); Thành viên đề tài cấp Tỉnh "Đánh giá tác động của đầu tư trực tiếp nước ngoài đến sự phát triển kinh tế-xã hội tỉnh Bắc Giang" (2018); "Factors influencing customer satisfaction: The case of Facebook Chatbot Vietnam" (2020) tại International Journal of Data and Network Science; "Vận dụng nghiên cứu định tính trong việc phát hiện ra tính cách thương hiệu điểm đến đặc trưng cho Việt Nam" (2019).', '{Marketing,Quản trị Kinh doanh,Thương hiệu,Du lịch,Hành vi người tiêu dùng}'),
    ('pham-thu-huong', 'PGS.TS Phạm Thu Hương', 'PGS.TS', 'Quá trình học tập: Cử nhân chuyên ngành Kinh tế ngoại thương tại Đại học Ngoại thương (1993); Thạc sĩ chuyên ngành KTTG và QHKTQT tại Đại học Ngoại thương (1998); Thạc sĩ chuyên ngành Kinh doanh Quốc tế tại EWHA Womans University, Hàn Quốc (2002); Tiến sĩ chuyên ngành KTTG và QHKTQT tại Đại học Ngoại thương (2004). Công trình NCKH tiêu biểu: Trưởng nhóm nghiên cứu "hành vi tiêu dùng xanh" trường Đại học Ngoại thương (2019); Chủ nhiệm đề tài cấp Bộ "Nghiên cứu hành vi mua hàng của người tiêu dùng Việt Nam thông qua mạng xã hội Facebook" (2017); Tham gia viết sách "Phát triển hoạt động bán sản phẩm lữ hành qua internet của các công ty du lịch Việt Nam", NXB Dân trí (2019); Đồng tác giả các bài báo trên Journal of Strategic Marketing (Scopus).', '{Kinh tế ngoại thương,Quản lý kinh tế quốc tế,Kinh doanh quốc tế,Hành vi tiêu dùng xanh,Thương mại điện tử}'),

    -- Page 2
    ('nguyen-thanh-binh', 'Nguyễn Thanh Bình', 'ThS', 'Trưởng Bộ môn Marketing và Truyền thông. Quá trình học tập: Cử nhân Marketing tại ĐH Kinh tế Quốc dân (1993); Cử nhân bằng đại học 2 Tiếng Anh thương mại (2014); Thạc sĩ... (đang cập nhật chi tiết).', '{Marketing,Truyền thông,Quản trị}'),
    ('nguyen-van-hong', 'Nguyễn Văn Hồng', 'ThS', 'Quá trình học tập: Cử nhân ngành Kinh tế đối ngoại tại Đại học Ngoại thương (1983); Thạc sĩ chuyên ngành MBA tại Viện Phát triển... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,MBA,Quản trị}'),
    ('vu-thi-bich-hai', 'Vũ Thị Bích Hải', 'ThS', 'Quá trình học tập: Cử nhân Ngôn ngữ Anh, Đại học Ngoại Ngữ - ĐHQG (2001); Cử nhân Kế toán tại Học Viện tài chính (2002);... (đang cập nhật chi tiết).', '{Ngoại ngữ,Kế toán,Quản trị}'),
    ('nguyen-hong-hanh', 'TS Nguyễn Hồng Hạnh', 'TS', 'Quá trình học tập: Cử nhân Kinh tế và Kinh doanh quốc tế tại Đại học Ngoại Thương (2013); Thạc sĩ Kinh doanh quốc tế tại... (đang cập nhật chi tiết).', '{Kinh tế,Kinh doanh quốc tế}'),
    ('nguyen-cuong', 'Nguyễn Cương', 'ThS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (2007); Thạc sĩ Nghiên cứu thị trường và chiến lược Marketing tại... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Marketing,Nghiên cứu thị trường}'),
    ('tran-bich-ngoc', 'Trần Bích Ngọc', 'ThS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (2001); Thạc sĩ Quản trị Kinh doanh; chuyên sâu Quản trị Marketing... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Quản trị Kinh doanh,Marketing}'),

    -- Page 3
    ('phan-thi-thu-hien', 'PGS.TS Phan Thị Thu Hiền', 'PGS.TS', 'Quá trình học tập: Cử nhân Kinh tế ngoại thương tại trường ĐH Ngoại thương (2000); Cử nhân bằng 2: Ngôn ngữ Anh tại trường Đại... (đang cập nhật chi tiết).', '{Kinh tế ngoại thương,Ngôn ngữ Anh}'),
    ('vu-thi-hanh', 'Vũ Thị Hạnh', 'TS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (2001); Thạc sĩ Kinh tế tại ĐH Ngoại thương (2007); Tiến sĩ Kinh... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Kinh tế}'),
    ('pham-thi-cam-anh', 'Phạm Thị Cẩm Anh', 'ThS', 'Quá trình học tập: Cử nhân Kinh tế và Kinh doanh quốc tế tại ĐH Ngoại thương (2009); Thạc sĩ Chính sách công tại ĐH Indiana,... (đang cập nhật chi tiết).', '{Kinh tế,Kinh doanh quốc tế,Chính sách công}'),
    ('nguyen-hong-tra-my', 'Nguyễn Hồng Trà My', 'ThS', 'Quá trình học tập: Cử nhân Kinh tế Đối ngoại tại ĐH Ngoại thương (2009); Thạc sĩ Kinh doanh Quốc tế tại ĐH Latrobe, Úc (2011). Công trình... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Kinh doanh quốc tế}'),
    ('nguyen-hai-ninh', 'TS. Nguyễn Hải Ninh', 'TS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại Thương (2001); Thạc sĩ Quản trị Kinh doanh Quốc tế tại ĐH Flinders,... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Quản trị Kinh doanh Quốc tế}'),
    ('tran-thanh-phuong', 'TS Trần Thanh Phương', 'TS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (2010); Thạc sĩ Tài chính ngân hàng tại ĐH Queen Mary, Anh... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Tài chính ngân hàng}'),

    -- Page 4
    ('do-ngoc-kien', 'Đỗ Ngọc Kiên', 'TS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (2006); Thạc sĩ Chính sách công tại ĐH Hitotsaubashi, Nhật Bản (2012)... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Chính sách công}'),
    ('cao-thi-hong-vinh', 'Cao Thị Hồng Vinh', 'TS', 'Quá trình học tập: Cử nhân Kinh tế quốc tế tại ĐH Ngoại thương (2008); Thạc sĩ Kinh tế học tại ĐH tổng hợp Mannheim, CHLB... (đang cập nhật chi tiết).', '{Kinh tế quốc tế,Kinh tế học}'),
    ('dinh-hoang-minh', 'Đinh Hoàng Minh', 'TS', 'Quá trình học tập: Cử nhân Kinh tế đối ngoại ĐH Ngoại Thương (2006); Thạc sĩ Kinh Doanh Quốc tế ĐH La Trobe, Australia (2011). Công trình... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Kinh doanh quốc tế}'),
    ('hoang-huong-giang', 'Hoàng Hương Giang', 'ThS', 'Quá trình học tập: Cử nhân Thương mại quốc tế tại ĐH Kinh tế Quốc dân Hà Nội (1998); Cử nhân bằng đại học 2: tiếng... (đang cập nhật chi tiết).', '{Thương mại quốc tế,Ngôn ngữ Anh}'),
    ('tran-thi-ngoc-quyen', 'Trần Thị Ngọc Quyên', 'TS', 'Quá trình học tập: Cử nhân Kinh tế Đối ngoại tại ĐH Ngoại thương (2000); Thạc sĩ Kinh tế thế giới và Quan hệ kinh tế... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Kinh tế thế giới,Quan hệ kinh tế quốc tế}'),
    ('nguyen-thi-viet-hoa', 'Nguyễn Thị Việt Hoa', 'TS', 'Phó Viện trưởng. Quá trình học tập: Cử nhân Kinh tế đối ngoại tại ĐH Ngoại thương (1995); Thạc sĩ Quản trị kinh doanh tại Trung tâm Pháp –... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Quản trị kinh doanh}'),

    -- Page 5
    ('nguyen-minh-phuc', 'TS Nguyễn Minh Phúc', 'TS', 'Lĩnh vực giảng dạy, nghiên cứu: Logistics và quản lý chuỗi cung ứng. Quá trình học tập: Cử nhân Kinh tế đối ngoại tại trường Đại học Ngoại thương... (đang cập nhật chi tiết).', '{Logistics,Quản lý chuỗi cung ứng}'),
    ('nguyen-thi-binh', 'PGS.TS Nguyễn Thị Bình', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Logistics và quản lý chuỗi cung ứng, quản lý vận tải hàng hóa. Quá trình học tập: Cử nhân Kinh... (đang cập nhật chi tiết).', '{Logistics,Quản lý chuỗi cung ứng,Quản lý vận tải}'),
    ('bui-duy-linh', 'TS Bùi Duy Linh', 'TS', 'Chức vụ: Phó trưởng phòng Hợp tác quốc tế. Lĩnh vực giảng dạy, nghiên cứu: Logistics, quản lý chuỗi cung ứng, quản lý rủi ro trong kinh... (đang cập nhật chi tiết).', '{Logistics,Quản lý chuỗi cung ứng,Quản lý rủi ro,Hợp tác quốc tế}'),
    ('tran-si-lam', 'PGS.TS Trần Sĩ Lâm', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Quản lý chuỗi cung ứng, Logistics, Bảo hiểm trong Kinh doanh, Quản trị rủi ro trong Kinh doanh. Quá trình học tập... (đang cập nhật chi tiết).', '{Quản lý chuỗi cung ứng,Logistics,Bảo hiểm,Quản trị rủi ro}'),
    ('vu-si-tuan', 'PGS.TS Vũ Sĩ Tuấn', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Quá trình học tập: Cử nhân ngành Kinh tế Ngoại thương tại trường Đại học Ngoại thương (1986); Thạc... (đang cập nhật chi tiết).', '{Kinh tế Ngoại thương}'),
    ('trinh-thi-thu-huong', 'PGS.TS Trịnh Thị Thu Hương', 'PGS.TS', 'Chức vụ: Phó Viện Trưởng – Trưởng Bộ môn Logistics và Quản lý chuỗi cung ứng. Lĩnh vực giảng dạy, nghiên cứu: Vận tải và giao nhận, Logistics, Quản lý chuỗi cung ứng. Quá trình học tập... (đang cập nhật chi tiết).', '{Vận tải,Logistics,Quản lý chuỗi cung ứng}'),

    -- Page 6
    ('ngo-hoang-quynh-anh', 'ThS Ngô Hoàng Quỳnh Anh', 'ThS', 'Lĩnh vực giảng dạy, nghiên cứu: Chính sách và luật thương mại quốc tế, Marketing. Quá trình học tập: Cử nhân Kinh tế tại trường Đại... (đang cập nhật chi tiết).', '{Chính sách thương mại,Luật thương mại quốc tế,Marketing}'),
    ('vu-hoang-viet', 'ThS Vũ Hoàng Việt', 'ThS', 'Lĩnh vực giảng dạy, nghiên cứu: Chính sách và phân tích dữ liệu thương mại. Quá trình học tập: Cử nhân ngành Kinh tế đối ngoại... (đang cập nhật chi tiết).', '{Chính sách thương mại,Phân tích dữ liệu,Thương mại}'),
    ('hoang-ngoc-thuan', 'TS. Hoàng Ngọc Thuận', 'TS', 'Lĩnh vực giảng dạy, nghiên cứu: Luật Kinh tế quốc tế, Các biện pháp phòng vệ thương mại, Sở hữu trí tuệ. Quá trình học tập... (đang cập nhật chi tiết).', '{Luật Kinh tế quốc tế,Phòng vệ thương mại,Sở hữu trí tuệ}'),
    ('nguyen-thu-hang', 'TS Nguyễn Thu Hằng', 'TS', 'Lĩnh vực giảng dạy, nghiên cứu: Kinh tế, Thương mại quốc tế, Thuế, Nghiên cứu Trung Quốc. Quá trình học tập: Cử nhân Kinh tế đối ngoại... (đang cập nhật chi tiết).', '{Kinh tế,Thương mại quốc tế,Thuế,Nghiên cứu Trung Quốc}'),
    ('vu-huyen-phuong', 'TS. Vũ Huyền Phương', 'TS', 'Chức vụ: Phó trưởng phòng Quản lý Khoa học. Lĩnh vực giảng dạy nghiên cứu: Quá trình học tập: Cử nhân Kinh tế Quốc tế tại trường... (đang cập nhật chi tiết).', '{Kinh tế Quốc tế,Quản lý Khoa học}'),
    ('nguyen-quang-minh', 'TS. Nguyễn Quang Minh', 'TS', 'Chức vụ: Giảng viên. Lĩnh vực giảng dạy, nghiên cứu: Quan hệ Kinh tế quốc tế, Thương mại dịch vụ, Toàn cầu hóa kinh tế. Quá trình học tập... (đang cập nhật chi tiết).', '{Quan hệ Kinh tế quốc tế,Thương mại dịch vụ,Toàn cầu hóa kinh tế}'),

    -- Page 7
    ('le-thi-thu-ha', 'PGS.TS Lê Thị Thu Hà', 'PGS.TS', 'Chức vụ: Giám đốc Trung tâm Sáng tạo và Ươm tạo. Lĩnh vực giảng dạy, nghiên cứu: Quá trình học tập: Cử nhân Kinh tế đối ngoại... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Sáng tạo,Ươm tạo}'),
    ('vu-thi-hien', 'PGS.TS Vũ Thị Hiền', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Quá trình học tập: Cử nhân Kinh tế đối ngoại tại Trường Đại học Ngoại thương (1999); Thạc sĩ... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại}'),
    ('dao-ngoc-tien', 'PGS.TS Đào Ngọc Tiến', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Quá trình học tập: Cử nhân Kinh tế đối ngoại Trường Đại học Ngoại thương (2000); Thạc sĩ Quản... (đang cập nhật chi tiết).', '{Kinh tế đối ngoại,Quản trị}'),
    ('bui-thi-ly', 'PGS.TS Bùi Thị Lý', 'PGS.TS', 'Lĩnh vực giảng dạy, nghiên cứu: Kinh tế, kinh doanh, thương mại. Quá trình học tập: Cử nhân Kinh tế tại trường Đại học Ngoại thương... (đang cập nhật chi tiết).', '{Kinh tế,Kinh doanh,Thương mại}'),
    ('vu-thanh-toan', 'TS. Vũ Thành Toàn', 'TS', 'Chức vụ: Trưởng Bộ môn Thương mại Quốc tế. Lĩnh vực giảng dạy, nghiên cứu: Kinh tế, Kinh doanh, Thương mại. Quá trình học tập: Cử nhân Kinh... (đang cập nhật chi tiết).', '{Thương mại Quốc tế,Kinh tế,Kinh doanh}')
) as v(slug, full_name, title, bio, interests)
where s.slug = 'ftu'
on conflict (school_id, slug) do update set
  full_name = excluded.full_name,
  academic_title = excluded.academic_title,
  bio = excluded.bio,
  research_interests = excluded.research_interests;