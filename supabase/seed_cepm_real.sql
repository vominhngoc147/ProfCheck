-- Real CEPM professor seed crawled from cepm.ftu.edu.vn/ho-so-giang-vien (58 lecturers)
-- Crawled: 2026-10-04. Detail pages on ktdqt.ftu.edu.vn are dead (404), so bios come from the listing.
-- Safe to re-run: idempotent upsert on school_id+slug, seed rows only (never touches claimed profiles).

-- Ensure CEPM faculty exists (Trường Kinh tế và Quản lý công)
insert into public.faculties (school_id, slug, name_vi, name_en)
select s.id, 'cepm', 'Trường Kinh tế và Quản lý công', 'School of Economics and Public Management'
from public.schools s where s.slug = 'ftu'
on conflict do nothing;

-- Insert professors
insert into public.professors (school_id, faculty_id, slug, full_name, academic_title, bio, research_interests, source_status)
select s.id, f.id, v.slug, v.full_name, v.title, v.bio, v.interests::text[], 'seed'
from public.schools s
join public.faculties f on f.school_id = s.id and f.slug = 'cepm'
join (values
    ('vu-thanh-toan', 'Vũ Thành Toàn', 'TS', 'Trưởng Bộ môn Thương mại quốc tế. Lĩnh vực: Kinh tế, Kinh doanh, Thương mại. Email: toanvt@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế,Kinh doanh,Thương mại}'),
    ('bui-thi-ly', 'Bùi Thị Lý', 'PGS, TS', 'Viện Trưởng. Lĩnh vực: Kinh tế, Kinh doanh, Thương mại. Email: lybt@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế,Kinh doanh,Thương mại}'),
    ('dao-ngoc-tien', 'Đào Ngọc Tiến', 'PGS, TS', 'Phó Hiệu trưởng. Email: dntien@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('vu-thi-hien', 'Vũ Thị Hiền', 'PGS, TS', 'Trưởng phòng Quản lý Đào tạo. Email: hienvt@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('le-thi-thu-ha', 'Lê Thị Thu Hà', 'TS', 'Giám đốc trung tâm Sáng tạo và Ươm tạo FTU PGS,. Email: ha.le@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-quang-minh', 'Nguyễn Quang Minh', 'TS', 'Lĩnh vực: Quan hệ kinh tế quốc tế, Thương mại dịch vụ, Toàn cầu hóa kinh tế. Email: quangminh.ftu@gmail.com. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Quan hệ kinh tế quốc tế,Thương mại dịch vụ,Toàn cầu hóa kinh tế}'),
    ('vu-huyen-phuong', 'Vũ Huyền Phương', 'TS', 'Phó trưởng phòng Quản lý khoa học. Email: phuongvh@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-thu-hang', 'Nguyễn Thu Hằng', 'TS', 'Lĩnh vực: Kinh tế, Thương mại quốc tế, Thuế, Nghiên cứu Trung Quốc. Email: nguyen.thuhang@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế,Thương mại quốc tế,Thuế,Nghiên cứu Trung Quốc}'),
    ('hoang-ngoc-thuan', 'Hoàng Ngọc Thuận', 'TS', 'Lĩnh vực: Luật Kinh tế quốc tế, Các biện pháp phòng vệ thương mại, Sở hữu trí tuệ. Email: hoangthuan@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Luật Kinh tế quốc tế,Các biện pháp phòng vệ thương mại,Sở hữu trí tuệ}'),
    ('vu-hoang-viet', 'Vũ Hoàng Việt', 'ThS', 'Lĩnh vực: Chính sách và phân tích dữ liệu thương mại. Email: vietvh@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Chính sách và phân tích dữ liệu thương mại}'),
    ('ngo-hoang-quynh-anh', 'Ngô Hoàng Quỳnh Anh', 'ThS', 'Lĩnh vực: Chính sách và luật thương mại quốc tế, Marketing. Email: anh.nhq@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Chính sách và luật thương mại quốc tế,Marketing}'),
    ('phung-bao-ngoc-van', 'Phùng Bảo Ngọc Vân', 'ThS', 'Email: ngocvanpb@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('do-ngoc-son', 'Đỗ Ngọc Sơn', 'ThS', 'Email: sondongoc@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-minh-phuong', 'Nguyễn Minh Phương', 'ThS', 'Email: nguyenminhphuong@ftu.edu.vn. Bộ môn Thương mại quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('trinh-thi-thu-huong', 'Trịnh Thị Thu Hương', 'PGS, TS', 'Phó Viện Trưởng &#8211; Trưởng Bộ môn Logistics và Quản lý chuỗi cung ứng. Lĩnh vực: Vận tải và giao nhận quốc tế, Bảo hiểm và bảo hiểm hàng hải, Logistics và quản lý chuỗi cung ứng, Tạo thuận lợi thương mại. Email: ttthuhuong@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Vận tải và giao nhận quốc tế,Bảo hiểm và bảo hiểm hàng hải,Logistics và quản lý chuỗi cung ứng,Tạo thuận lợi thương mại}'),
    ('vu-si-tuan', 'Vũ Sĩ Tuấn', 'PGS, TS', 'Email: vusituan@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('tran-si-lam', 'Trần Sĩ Lâm', 'PGS, TS', 'Lĩnh vực: Quản lý chuỗi cung ứng, Logistics, Bảo hiểm trong KD, Quản trị rủi ro trong KD. Email: transilam@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Quản lý chuỗi cung ứng,Logistics,Bảo hiểm trong KD,Quản trị rủi ro trong KD}'),
    ('bui-duy-linh', 'Bùi Duy Linh', 'TS', 'Phó trưởng phòng Hợp tác quốc tế. Lĩnh vực: Logistics, quản lý chuỗi cung ứng, quản lý rủi ro trong kinh doanh, quản lý chính sách công. Email: duylinh@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Logistics,quản lý chuỗi cung ứng,quản lý rủi ro trong kinh doanh,quản lý chính sách công}'),
    ('vu-thi-minh-ngoc', 'Vũ Thị Minh Ngọc', 'TS', 'Lĩnh vực: Logistics, Quản lý chuỗi cung ứng, Bảo hiểm trong KD, Thương mại quốc tế, Hải quan. Email: vuminhngoc@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Logistics,Quản lý chuỗi cung ứng,Bảo hiểm trong KD,Thương mại quốc tế,Hải quan}'),
    ('nguyen-thi-binh', 'Nguyễn Thị Bình', 'PGS, TS', 'Lĩnh vực: Logistics và quản lý chuỗi cung ứng, quản lý vận tải hàng hóa. Email: ntbinh@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Logistics và quản lý chuỗi cung ứng,quản lý vận tải hàng hóa}'),
    ('nguyen-minh-phuc', 'Nguyễn Minh Phúc', 'TS', 'Lĩnh vực: Logistics và quản lý chuỗi cung ứng. Email: phuc.nguyen@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Logistics và quản lý chuỗi cung ứng}'),
    ('pham-duy-hung', 'Phạm Duy Hưng', 'TS', 'Email: p.hung@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-thi-yen', 'Nguyễn Thị Yến', 'TS', 'Lĩnh vực: Vận tải và bảo hiểm. logistics, quản lý chuỗi cung ứng. Email: yennguyen87@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Vận tải và bảo hiểm. logistics,quản lý chuỗi cung ứng}'),
    ('hoang-thi-doan-trang', 'Hoàng Thị Đoan Trang', 'TS', 'Lĩnh vực: Logistics & SCM, Bảo hiểm trong kinh doanh, quản lý rủi ro. Email: hoangthidoantrang@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Logistics & SCM,Bảo hiểm trong kinh doanh,quản lý rủi ro}'),
    ('le-minh-tram', 'Lê Minh Trâm', 'ThS', 'Lĩnh vực: Vận tải, logistics, quản lý chuỗi cung ứng, quản lý rủi ro và bảo hiểm. Email: tramle@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Vận tải,logistics,quản lý chuỗi cung ứng,quản lý rủi ro và bảo hiểm}'),
    ('le-my-huong', 'Lê Mỹ Hương', 'ThS', 'Lĩnh vực: Quản lý chuỗi cung ứng, Chuỗi giá trị Mô hình kinh doanh Nghiên cứu vận hành và khoa học quản lý. Email: huonglm@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{Quản lý chuỗi cung ứng,Chuỗi giá trị Mô hình kinh doanh Nghiên cứu vận hành và khoa học quản lý}'),
    ('pham-thi-hien-minh', 'Phạm Thị Hiền Minh', 'ThS', 'Email: minhpth@ftu.edu.vn. Bộ môn Logistics và quản lý chuỗi cung ứng. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-thi-viet-hoa', 'Nguyễn Thị Việt Hoa', 'TS', 'Phó Viện Trưởng. Lĩnh vực: Đầu tư quốc tế, Tài chính doanh nghiệp. Email: ntvhoa@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{Đầu tư quốc tế,Tài chính doanh nghiệp}'),
    ('tran-thi-ngoc-quyen', 'Trần Thị Ngọc Quyên', 'PGS, TS', 'Lĩnh vực: Đầu tư quốc tế; văn hoá doanh nghiệp; các nền kinh tế Đông Á. Email: quyenttn@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{Đầu tư quốc tế; văn hoá doanh nghiệp; các nền kinh tế Đông Á}'),
    ('hoang-huong-giang', 'Hoàng Hương Giang', 'TS', 'Lĩnh vực: Kinh tế và phát triển bền vững, quản trị, đầu tư quốc tế và TNCs. Email: hoanghuonggiang@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế và phát triển bền vững,quản trị,đầu tư quốc tế và TNCs}'),
    ('cao-thi-hong-vinh', 'Cao Thị Hồng Vinh', 'TS', 'Email: caovinhftu@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('dinh-hoang-minh', 'Đinh Hoàng Minh', 'ThS', 'Email: hoangminh007@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('tran-thanh-phuong', 'Trần Thanh Phương', 'TS', 'Lĩnh vực: Đầu tư quốc tế, Kinh tế đầu tư. Email: phuong.tranthanh@ftu.edu.vn. Bộ môn Kinh tế và quản lý. Nguồn: cepm.ftu.edu.vn.', '{Đầu tư quốc tế,Kinh tế đầu tư}'),
    ('phan-thi-thu-hien', 'Phan Thị Thu Hiền', 'PGS, TS', 'Trưởng Bộ môn Kinh doanh quốc tế. Lĩnh vực: Giao dịch TMQT, Hải quan, Kinh doanh quốc tế và đàm phán. Email: phanhien@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Giao dịch TMQT,Hải quan,Kinh doanh quốc tế và đàm phán}'),
    ('nguyen-van-hong', 'Nguyễn Văn Hồng', 'PGS, TS', 'Email: nvanhong69@gmail.com. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('pham-thi-cam-anh', 'Phạm Thị Cẩm Anh', 'TS', 'Lĩnh vực: Kinh tế, Chính sách công, Phân tích chính sách, Giao dịch thương mại quốc tế. Email: phamthicamanh@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế,Chính sách công,Phân tích chính sách,Giao dịch thương mại quốc tế}'),
    ('vu-thi-bich-hai', 'Vũ Thị Bích Hải', 'TS', 'Lĩnh vực: Kinh doanh, Kinh doanh quốc tế, Quản trị nhân sự, Văn hóa KD, Đạo đức KD và TNXH, Tâm lý học. Email: haivtb@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh doanh,Kinh doanh quốc tế,Quản trị nhân sự,Văn hóa KD,Đạo đức KD và TNXH,Tâm lý học}'),
    ('vu-thi-hanh', 'Vũ Thị Hạnh', 'PGS. TS', 'Email: hanhvt@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-hong-tra-my', 'Nguyễn Hồng Trà My', 'ThS', 'Lĩnh vực: Kinh tế, Tài chính, Kinh doanh, Quản trị. Email: nguyenhongtramy@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Kinh tế,Tài chính,Kinh doanh,Quản trị}'),
    ('tran-bich-ngoc', 'Trần Bích Ngọc', 'ThS', 'Lĩnh vực: Các vấn đề liên quan đến GDTMQT, Thương mại điện tử, Marketing điện tử, Trách nhiệm xã hội của doanh nghiệp. Email: ngoctb@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{Các vấn đề liên quan đến GDTMQT,Thương mại điện tử,Marketing điện tử,Trách nhiệm xã hội của doanh nghiệp}'),
    ('nguyen-cuong', 'Nguyễn Cương', 'ThS', 'Email: nguyencuong@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-hong-hanh', 'Nguyễn Hồng Hạnh', 'TS', 'Email: hanhnh@ftu.edu.vn. Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('ly-nguyen-ngoc', 'Lý Nguyên Ngọc', 'ThS', 'Bộ môn Kinh doanh quốc tế. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-thanh-binh', 'Nguyễn Thanh Bình', 'PGS, TS', 'Trưởng Bộ môn Marketing và Truyền thông. Lĩnh vực: Marketing, Digital marketing, nghiên cứu thị trường, Truyền thông marketing, CRM, Quản trị thương hiệu. Email: nguyenthanhbinh@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing,Digital marketing,nghiên cứu thị trường,Truyền thông marketing,CRM,Quản trị thương hiệu}'),
    ('pham-thu-huong', 'Phạm Thu Hương', 'PGS, TS', 'Lĩnh vực: Marketing điện tử, hành vi tiêu dùng xanh, chuỗi giá trị toàn cầu, xúc tiến thương mại. Email: huong.pt@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing điện tử,hành vi tiêu dùng xanh,chuỗi giá trị toàn cầu,xúc tiến thương mại}'),
    ('tran-hai-ly', 'Trần Hải Ly', 'TS', 'Lĩnh vực: Marketing, Kĩ năng mềm. Email: tranhaily@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing,Kĩ năng mềm}'),
    ('tran-thu-trang', 'Trần Thu Trang', 'TS', 'Lĩnh vực: Marketing, Trách nhiệm xã hội doanh nghiệp, Sáng tạo xã hội và doanh nghiệp xã hội. Email: thutrang@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing,Trách nhiệm xã hội doanh nghiệp,Sáng tạo xã hội và doanh nghiệp xã hội}'),
    ('le-thi-thu-huong', 'Lê Thị Thu Hường', 'TS', 'Email: vanmeoth@yahoo.com. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-ngoc-dat', 'Nguyễn Ngọc Đạt', 'TS', 'Lĩnh vực: Marketing điện tử, hành vi tiêu dùng; Các vấn đề liên quan tới lữ hành; xu hướng chấp nhận sử dụng công nghệ mới, sản phẩm mới (Các mô hình TAM, TRA, TPB, E –CAM); Hiệu quả hoạt động các Công ty; Sự hài lòng, trung thành khách hàng (mô hình SERVQUAL, Nordict, CSI); Hài lòng công việc, trung thành với tổ chức của người lao động (Mô hình JDI, Minnesota). Email: nguyenngocdat@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing điện tử,hành vi tiêu dùng; Các vấn đề liên quan tới lữ hành; xu hướng chấp nhận sử dụng công nghệ mới,sản phẩm mới (Các mô hình TAM,TRA,TPB,E –CAM); Hiệu quả hoạt động các Công ty; Sự hài lòng}'),
    ('pham-thi-minh-chau', 'Phạm Thị Minh Châu', 'ThS', 'Lĩnh vực: Marketing, Digital marketing, nghiên cứu thị trường, Truyền thông marketing, CRM, Quản trị thương hiệu. Email: minhchaupham@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Marketing,Digital marketing,nghiên cứu thị trường,Truyền thông marketing,CRM,Quản trị thương hiệu}'),
    ('nguyen-thi-phuong-anh', 'Nguyễn Thị Phương Anh', 'ThS', 'Email: anhntp@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('nguyen-huyen-minh', 'Nguyễn Huyền Minh', 'ThS', 'Lĩnh vực: Ứng dụng lý thuyết trò chơi trong truyền thông/Marketing ; Các vấn đề về xúc tiến thương mại; Các vấn đề về xúc tiến đầu tư. Email: huyenminh@ftu.edu.vn. Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{Ứng dụng lý thuyết trò chơi trong truyền thông/Marketing ; Các vấn đề về xúc tiến thương mại; Các vấn đề về xúc tiến đầu tư}'),
    ('nguyen-thuy-duong', 'Nguyễn Thùy Dương', 'ThS', 'Bộ môn Marketing và truyền thông. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('chu-phuong-anh', 'Chu Phương Anh', 'TS', 'Lĩnh vực: Trưởng Bộ môn Tiếng Nga. Bộ môn Tiếng Nga. Nguồn: cepm.ftu.edu.vn.', '{Trưởng Bộ môn Tiếng Nga}'),
    ('nguyen-thi-kim-anh', 'Nguyễn Thị Kim Anh', 'TS', 'Bộ môn Tiếng Nga. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('hoang-thi-ben', 'Hoàng Thị Bến', 'TS', 'Bộ môn Tiếng Nga. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('pham-quynh-huong', 'Phạm Quỳnh Hương', 'Ths', 'Bộ môn Tiếng Nga. Nguồn: cepm.ftu.edu.vn.', '{}'),
    ('ta-thi-thanh-tam', 'Tạ Thị Thanh Tâm', 'Ths', 'Bộ môn Tiếng Nga. Nguồn: cepm.ftu.edu.vn.', '{}')
  ) as v(slug, full_name, title, bio, interests) on true
where s.slug = 'ftu'
on conflict (school_id, slug) do update set
  full_name = excluded.full_name,
  academic_title = excluded.academic_title,
  bio = excluded.bio,
  research_interests = excluded.research_interests
where public.professors.source_status = 'seed';
