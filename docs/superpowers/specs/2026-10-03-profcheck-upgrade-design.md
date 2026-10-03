# ProfCheck Upgrade — Design Spec (duyệt 2026-10-03)

> Nguồn sự thật cho các đợt 1–5. User đã duyệt toàn bộ, yêu cầu làm đợt 1+2 trước,
> các đợt còn lại giữ nguyên để triển khai sau theo yêu cầu.

## Quyết định đã chốt với user
- D13: Thang điểm **5 sao + bước nửa sao (0.5–5.0)**, không làm 7 sao.
- D14: **1 SV được review 1 GV nhiều lần** (khác môn / khác mục đích). Unique key mới:
  `(professor_id, author_id, purpose, lower(coalesce(course_code,'')))` thay vì
  `(professor_id, author_id)`. Chống spam duplicate exact, vẫn cho review lại.
- D15: **1 review = 1 purpose** (`hoc_tap | nckh | kltn | ttgk`). Form điểm khác nhau theo purpose.
- D16: CTĐT (`clc | cttt | dhnnqt | chinh_quy | khac`, nullable) lưu **theo review**.
- D17: Search làm **UI filter chung trước**, data 4 trường mới seed sau.
- D18: P-forum làm **full Reddit-like** (vote post+comment, nested comment, tag/topic,
  reup review link+quote). Làm cuối cùng (đợt 5).
- D19: Ảnh GV do **GV claimed + admin** quản lý (không cho SV tự ý đổi ảnh người khác).
- D20: `allow_forum_reup` có ở cả `professors` (default policy của GV) và `reviews`
  (quyết định từng bài). Reup chỉ hiện khi cả 2 đều true.

## Đợt 1 — Profile GV (đang làm)
- Migration 0017: `professors` thêm `degrees text[]`, `titles text[]`, `awards jsonb`,
  `research_fields text[]`, `allow_forum_reup bool default true`;
  `reviews` thêm `purpose`, `program` (để đợt 2 search dùng ngay);
  nới unique review (D14); trigger `sync_professor_courses()` tự tạo `courses` +
  `professor_courses` từ `course_code`; bucket `professor-avatars` (public, 2MB);
  fix guard `avg_clarity` + bảo vệ cột stats mới; update view `public_reviews`.
- UI: trang GV hiện ảnh/degrees/titles/awards/research_fields/môn đang dạy;
  `/prof/profile` sửa được các trường mới + toggle allow_forum_reup + upload avatar.

## Đợt 2 — Search phân loại kiểu Úm (đang làm)
- Không migration mới (dùng cột đợt 1). `/search` thêm tab purpose + filter:
  Học/KLTN/TTGK: tên GV, trường, khoa, mã HP, tên HP, CTĐT;
  NCKH: tên GV, lĩnh vực NC, trường/khoa/viện.
- Params: `purpose, school, faculty, course_code, course_name, program, field`.
  Cho phép chỉ gõ mã HP ra list GV.

## Đợt 3 — Review purpose + nửa sao (chưa làm)
- Migration 0018: đổi rating cols → `numeric(3,1)` 0.5–5.0; thêm
  `rating_expertise`, `rating_support`; validate theo purpose ở Server Action;
  trigger stats tách theo purpose; form chọn purpose trước + StarInput nửa sao;
  trang GV tab điểm theo 4 purpose.

## Đợt 4 — Review social (chưa làm)
- Migration 0019+0020: `review_comments` (1 cấp), `saved_reviews`, `custom_tags`,
  `review_attachments` + buckets `review-images` (public 5MB/ảnh, max 5) /
  `review-docs` (private 10MB/file, max 3); `reports.reason` thành enum
  (doc_hai/sai_su_that/xuc_pham/spam/khac); nút reup flag `allow_forum_reup` khi đăng.
- UI: comment dưới review, nút lưu + `/me/saved`, tag tự tạo, gallery + link signed URL,
  nút report mở rộng.

## Đợt 5 — P-forum (chưa làm)
- Migration 0021+0022: `forum_tags/topics/posts/comments/votes` như kế hoạch đã duyệt;
  reup = link + quote snapshot về review gốc; routes `/forum`, `/forum/[topic]`,
  `/forum/post/[id]`; sort hot/new/top; moderation dùng chung queue admin.
