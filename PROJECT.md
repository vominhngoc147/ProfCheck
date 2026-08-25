# ProfCheck — Project Context & Master Plan

> **LƯU Ý CHO AI/DEV SESSION MỚI:** Đọc toàn bộ file này TRƯỚC khi làm bất cứ việc gì.
> File này là nguồn sự thật duy nhất (single source of truth) về mục tiêu, quyết định,
> thiết kế hệ thống và tiến độ của dự án. Cập nhật file này sau mỗi quyết định hoặc
> milestone quan trọng. KHÔNG cần hỏi lại context — mọi thứ cần biết nằm ở đây.

---

## 1. Tổng quan

**ProfCheck** là nền tảng đánh giá giảng viên cho sinh viên Việt Nam, tương tự
RateMyProfessor (RMP), nhưng mở rộng hơn để giúp sinh viên chọn **giảng viên hướng dẫn
NCKH / khóa luận / luận văn**.

**Vision:** Bắt đầu từ Trường ĐH Ngoại thương (FTU) — thí điểm Trường Luật và Khoa
Khoa học Chính trị → mở rộng toàn FTU → mở rộng toàn quốc thành cộng đồng như RMP.

- Ngôn ngữ UI: **Tiếng Việt + English (i18n)**, tiếng Việt là mặc định.
- Người dùng chính: sinh viên, giảng viên, admin/moderator.

## 2. Tech Stack (đã chốt)

| Thành phần | Lựa chọn |
|---|---|
| Frontend | Next.js (App Router, TypeScript, `src/` dir, alias `@/*`) |
| Styling | Tailwind CSS v4 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Row Level Security) |
| Deploy dự kiến | Vercel (frontend) + Supabase cloud |
| State/data fetching | Server Components mặc định; client chỉ khi cần tương tác |

Project đã được scaffold tại thư mục gốc của repo (`profcheck/`).

## 3. Decision Log (quyết định đã chốt)

| # | Ngày | Quyết định | Chi tiết |
|---|---|---|---|
| D1 | 2026-08-26 | Tech stack | Next.js + Supabase, Tailwind, TS |
| D2 | 2026-08-26 | Scope MVP | Full: review + auth + kiểm duyệt admin (không cắt giảm) |
| D3 | 2026-08-26 | i18n | Song ngữ Việt + Anh |
| D4 | 2026-08-26 | Xác thực sinh viên | Email tên miền `.edu` của trường (vd `*.ftu.edu.vn`) → **duyệt tự động**. Email không phải edu → **xác thực bằng thẻ SV** (upload ảnh thẻ, admin duyệt) |
| D5 | 2026-08-26 | Nguồn dữ liệu ban đầu | Seed thủ công FTU trước: **Trường Luật và Khoa học Chính trị (LPS)** — lưu ý đây là MỘT đơn vị duy nhất, tên đầy đủ "Trường Luật và Khoa học Chính trị" / "School of Law and Political Science", viết tắt **LPS** — rồi mở rộng dần các khoa/viện khác → toàn FTU → toàn VN. Có thể import danh sách GV từ website trường |
| D6 | 2026-08-26 | GV tự tạo profile | **Cho phép** giảng viên tự tạo profile. Profile tự tạo đánh dấu trạng thái `unverified` hiển thị nhãn "Chờ xác minh" đến khi GV claim/xác thực (email trường hoặc bằng chứng bổ nhiệm). Admin có quyền gỡ/sửa nếu sai |
| D7 | 2026-08-26 | Ẩn danh review + moderation | Reviewer **chọn** ẩn danh hoặc hiện tên. **Moderation hybrid**: mọi review (public + anonymous) publish NGAY nếu pass filter tự động (toxicity/PII/name-mention — Phase đầu dùng từ khóa đơn giản, sau nâng cấp AI); chỉ nội dung nghi vấn mới vào queue admin. Minh bạch bằng: chỉ verified SV được viết, GV có right-of-reply (Phase 3+), hiển thị full phân phối sao. Điểm số cấu trúc không bao giờ bị gỡ khi text bị gỡ (giống triết lý RMP) |
| D8 | 2026-08-26 | Nghiên cứu RMP | RMP không pre-moderation (publish ngay, duyệt reactive qua auto-filter + community report), không verify sinh viên. Bài học: lợi thế ProfCheck = verify SV bắt buộc (lớp lọc nguồn mạnh nhất) → publish nhanh mà vẫn an toàn hơn RMP |
| D9 | 2026-08-26 | GV là first-class user | Chiến lược dữ liệu **claim-first**: nguồn chính = GV tự tạo tài khoản + tự quản hồ sơ (data mạng thường lỗi thời/sai sót). Seed chỉ là điểm khởi đầu khi có data công khai tốt; hồ sơ claimed override seed. UI tách theo vai trò bằng Route Groups: `(public)` khách+SV, `(professor)/prof/*` dashboard GV, `(admin)/admin/*` admin. Guard bằng `src/lib/auth.ts` (`getProfile`, `requireRole`) ở layout |
| D10 | 2026-08-26 | Cấm GV review GV | Giảng viên (role='professor') KHÔNG được viết review về GV khác (tránh xung đột lợi ích đồng nghiệp). Chặn ở server action; sau thêm RLS/trigger |
| D11 | 2026-08-26 | Xác minh claim GV hybrid | Claim/tạo profile GV: email thuộc `edu_domains` của trường → **auto-approve** (`claimed` + set `owner_profile_id` + role 'professor'); email khác → upload bằng chứng, **admin duyệt**. Nhất quán với flow SV (D4) |
| D12 | 2026-08-26 | Kết nối SV–GV Phase 3 | Mô hình "Opportunities": GV đăng tin cơ hội (`opportunities`: nckh/kltn/luan_van/thuc_tap/khac, tags, slots, deadline) → SV apply (`applications`). Recommend giai đoạn sau: match tags/lĩnh vực SV ↔ `research_interests` GV (keyword trước, AI sau). Schema tạo sẵn từ migration 0003, UI làm Phase 3 |

Mọi quyết định mới thêm vào bảng này với số tăng dần.

## 4. Phases chi tiết

### Phase 1 — Core MVP (đang thực hiện)
- [x] Scaffold Next.js + Tailwind + TS
- [ ] Supabase setup: schema SQL, RLS policies, seed data FTU (Trường Luật + KHCT)
- [ ] Supabase client (`@supabase/ssr`), env config (`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] i18n (vi/en) — dùng dictionary đơn giản hoặc `next-intl`
- [ ] Layout, trang chủ, tìm kiếm trường → khoa → giảng viên
- [ ] Trang chi tiết GV: điểm trung bình, phân phối sao, danh sách review
- [ ] Form viết review (đăng nhập bắt buộc, chọn ẩn danh/công khai)
- [ ] Auth: Google OAuth + email/password qua Supabase Auth
- [ ] Flow xác thực SV (edu auto-pass / thẻ SV upload)
- [ ] Admin dashboard: duyệt review ẩn danh, duyệt thẻ SV, quản lý report
- [ ] Ràng buộc 1 review/GV/người dùng

### Phase 2 — Parity với RMP
- [ ] Tags nhanh cho review ("Chấm dễ", "Khó tính", "Dạy hay", "Có tâm", ...)
- [ ] Chỉ số "Would take again" %, độ khó trung bình
- [ ] Trending/leaderboard theo trường (yêu thích nhất / khó nhất)
- [ ] Report review vi phạm → hàng đợi xử lý
- [ ] Edit/delete review của chính mình (có giới hạn thời gian sửa)
- [ ] Phân trang, filter, sort nâng cao

### Phase 3 — Đặc trưng VN: chọn GV hướng dẫn (điểm khác biệt cốt lõi)
- [ ] Hồ sơ nghiên cứu GV: lĩnh vực, từ khóa, công trình/dự án nổi bật
- [ ] Trạng thái nhận SV: "Đang nhận NCKH/KLTN/Luận văn/cao học" + số slot
- [ ] Rating riêng vai trò hướng dẫn: hỗ trợ nhiệt tình, phản hồi nhanh, chấm luận văn công bằng
- [ ] Tìm GV theo đề tài/lĩnh vực (full-text search trên research_interests)
- [ ] Review kèm loại đề tài được hướng dẫn
- [ ] Thông báo khi GV mở slot mới (Phase 4 có thể gộp)

### Phase 5 — Mở rộng cộng đồng (sau Phase 3, thứ tự linh hoạt)
- [ ] Q&A hỏi đáp về GV/học phần
- [ ] AI summary ưu/nhược điểm từ review
- [ ] So sánh 2–3 GV cạnh tranh
- [ ] Gamification nhẹ (reputation, huy hiệu reviewer tích cực)
- [ ] Mở rộng data: nhiều trường, import/crawl danh sách GV, cộng đồng tự đóng góp

> **Thứ tự build:** Phase 1 → 2 → 3 là ưu tiên. Phase 5 làm song song khi có cộng đồng.

## 5. System Design

### 5.1 Kiến trúc tổng thể

```
Browser ── Next.js App Router (Vercel)
             │  Server Components → query Supabase trực tiếp (anon key + RLS)
             │  Client Components  → @supabase/ssr browser client
             │  Route handlers     → auth callback, webhook nhẹ
             ▼
          Supabase (Postgres + RLS, Auth, Storage)
             ├── public.*        : dữ liệu app (bảng dưới)
             ├── storage buckets : avatars, ảnh thẻ SV (bucket PRIVATE)
             └── edge functions  : (tương lai) AI summary, notification
```

Nguyên tắc: **không viết backend riêng**. Toàn bộ logic dữ liệu nằm ở Postgres
(RLS, views, triggers). Chỉ những chỗ cần secret (AI, gửi mail) mới dùng Edge Functions.

### 5.2 Schema database (Postgres)

```sql
-- ===== Users & xác thực =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null default 'student'
    check (role in ('student','moderator','admin')),
  -- verification: 'none' | 'edu_verified' (auto) | 'card_pending' | 'card_verified'
  verification text not null default 'none',
  school_id uuid references public.schools(id),
  student_card_url text,              -- private bucket path
  created_at timestamptz not null default now()
);

-- ===== Cấu trúc trường/khoa =====
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- vd 'ftu'
  name_vi text not null,
  name_en text not null,
  edu_domains text[] not null default '{}',  -- vd '{ftu.edu.vn}'
  logo_url text,
  is_active boolean not null default true
);

create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  slug text not null,
  name_vi text not null,               -- vd 'Trường Luật', 'Khoa Khoa học Chính trị'
  name_en text,
  unique (school_id, slug)
);

-- ===== Giảng viên =====
create table public.professors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  faculty_id uuid references public.faculties(id),
  slug text not null,
  full_name text not null,
  academic_title text,                 -- 'Giảng viên','TS','ThS','PGS','GS'...
  avatar_url text,
  bio text,
  research_interests text[] not null default '{}',   -- Phase 3
  publications jsonb not null default '[]',          -- Phase 3
  accepting_students boolean not null default false, -- Phase 3
  open_slots jsonb not null default '{}',            -- Phase 3: {"nckh":2,"kltn":0,"ths":1}
  -- 'seed' (nhập bởi admin) | 'user_created' (ai đó tạo) | 'claimed' (chính chủ)
  source_status text not null default 'seed',
  owner_profile_id uuid references public.profiles(id), -- khi GV claim
  -- cache thống kê, cập nhật bằng trigger:
  review_count int not null default 0,
  avg_overall numeric(3,2),
  avg_difficulty numeric(3,2),
  avg_fairness numeric(3,2),
  would_take_again_pct int,
  unique (school_id, slug)
);

-- ===== Học phần =====
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  code text,
  name_vi text not null,
  unique (school_id, code)
);

create table public.professor_courses (
  professor_id uuid references public.professors(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  primary key (professor_id, course_id)
);

-- ===== Reviews =====
create type public.review_status as enum ('pending','approved','rejected');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professors(id) on delete cascade,
  course_id uuid references public.courses(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  -- Điểm thang 1–5 (difficulty 1–5, càng cao càng khó)
  rating_overall smallint not null check (rating_overall between 1 and 5),
  rating_difficulty smallint not null check (rating_difficulty between 1 and 5),
  rating_fairness smallint not null check (rating_fairness between 1 and 5),
  would_take_again boolean,
  tags text[] not null default '{}',
  content text not null check (char_length(content) >= 30),
  advisor_type text check (advisor_type in ('nckh','kltn','luan_van','khac')), -- Phase 3
  status public.review_status not null default 'pending',
  moderated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- mỗi user chỉ 1 review/GV (cho phép cập nhật thay vì tạo mới)
  unique (professor_id, author_id)
);

-- ===== Claim GV (giảng viên nhận quyền sở hữu profile) =====
create table public.professor_claims (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professors(id),
  claimant_id uuid not null references public.profiles(id),
  evidence_url text,                   -- ảnh email trường/quyết định bổ nhiệm
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- ===== Reports (báo cáo vi phạm) =====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id),
  reason text not null,
  details text,
  status text not null default 'open'
    check (status in ('open','resolved','dismissed')),
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
```

### 5.3 Roles & RLS (Row Level Security)

Bật RLS trên **mọi** bảng. Tóm tắt policy:

| Bảng | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| schools, faculties, courses, professors | everyone (active) | admin | admin, GV owner (professor chỉ update cột hồ sơ của mình khi `source_status='claimed'` và `owner_profile_id=auth.uid()`) | admin |
| profiles | public (chỉ cột an toàn qua view) | own row (trigger signup) | own row | – |
| reviews | `approved` với mọi người; `pending/rejected` chỉ author + moderator/admin. **TUYỆT ĐỐI không expose `author_id` khi `is_anonymous=true`** → dùng view `public_reviews` bỏ cột author | author (auth + verified ≠ 'none'), status='pending' nếu anonymous | author (own, trong 24h) | author (own), admin |
| reports | author own + moderator | any logged-in | moderator/admin | admin |

Chiến lược ẩn danh: app **luôn lưu** `author_id` (để chống spam, 1 review/GV),
nhưng mọi đường đọc public đi qua **view `public_reviews`** không chứa `author_id`.
Chỉ moderator thấy ánh xạ trong bảng gốc khi xử lý vi phạm.

### 5.4 Flows quan trọng

**Đăng ký & xác thực SV:**
1. Signup (Google/email) → trigger tạo `profiles`.
2. Nếu domain email ∈ `schools.edu_domains` → set `verification='edu_verified'` (auto).
3. Không phải edu → upload ảnh thẻ SV (private bucket) → `verification='card_pending'` → admin duyệt → `card_verified`.
4. Chỉ `verification != 'none'` mới được viết review.

**Review lifecycle:**
- Anonymous review → `status='pending'` → moderator duyệt → `approved`.
- Public review → cấu hình được; mặc định MVP để cũng `pending` cho an toàn (D7 ghi rõ nếu đổi).
- Trigger sau insert/update `reviews` tính lại cache thống kê trên `professors`.

**GV tự tạo / claim profile (D6):**
- Ai đăng nhập verified cũng có thể đề xuất tạo GV mới (`source_status='user_created'`,
  hiển thị nhãn "Chờ xác minh").
- GV thật claim qua form `professor_claims` + bằng chứng → admin duyệt →
  `source_status='claimed'`, `owner_profile_id` set → GV tự quản hồ sơ, bật/tắt nhận SV.
- Admin giữ quyền sửa/gỡ mọi profile.

**Moderation queue (admin dashboard):**
Tab: (1) review pending, (2) thẻ SV chờ duyệt, (3) reports mở, (4) claims GV,
(5) profile user_created chờ rà soát.

### 5.5 i18n

- Mặc định `vi`, toggle sang `en`. Dùng cookie/locale segment, dictionary TS đơn giản
  (`src/i18n/{vi,en}.ts`) — tránh phức tạp middleware lúc đầu; cân nhắc `next-intl` nếu cần route `/en/...`.

## 6. Tiến độ hiện tại (cập nhật thường xuyên!)

- ✅ Scaffold Next.js 16 tại `./profcheck` (App Router, TS, Tailwind v4, src dir)
- ✅ Cài `@supabase/supabase-js` + `@supabase/ssr`
- ✅ Supabase project đã tạo:
  - URL: `https://samybozpkcstmdzdqvtu.supabase.co`
  - Keys nằm trong `.env.local` (KHÔNG commit)
- ✅ Migration `supabase/migrations/0001_init.sql` đã viết (schema + RLS + triggers + views + seed FTU)
- ✅ **Migration ĐÃ CHẠY THÀNH CÔNG** (9 bảng + 2 views + 26 RLS policies + triggers +
  buckets `avatars`/`student-cards` + seed FTU: Trường Luật và Khoa học Chính trị (LPS))
- ✅ Supabase clients: `src/lib/supabase/{client,server,proxy}.ts`, session refresh ở `src/proxy.ts` (Next 16 dùng `proxy.ts`, middleware cũ deprecated)
- ℹ️ DB connection: host direct `db.<ref>.supabase.co` không resolve từ máy dev (IPv6-only) —
  luôn dùng **pooler** `aws-0-ap-northeast-1.pooler.supabase.com:5432` (biến `SUPABASE_DB_POOLER`
  trong `.env.local`, KHÔNG commit). Script chạy migration từng-statement nằm ở
  `%TEMP%\opencode\pgmigrate\run.js` (cần vì chạy cả file qua pg fail ngầm do implicit transaction)
- ✅ i18n dictionary vi/en (`src/i18n/`), locale lưu cookie `pc_locale`, switch qua Server Action (`src/app/actions/locale.ts`)
- ✅ Layout + Header/Footer, locale switcher, login/logout
- ✅ Trang chủ `/` (hero + search + browse faculty), tìm kiếm `/search` (q hoặc faculty slug)
- ✅ Trang chi tiết GV `/professors/[slug]`: điểm TB, phân phối sao, WTA%, danh sách review từ view `public_reviews`
- ✅ Form review: chấm 3 tiêu chí (star input), WTA, ẩn danh; Server Action `submitReviewAction` — pre-filter từ khóa đơn giản (pass → approved ngay theo D7, nghi vấn → pending), chặn trùng review (unique constraint)
- ✅ Auth pages: `/login`, `/signup`, Google OAuth + email/password, callback `/auth/callback`
- ✅ `/verify`: trang stub xác thực SV (edu auto / thẻ SV coming soon)
- ✅ Build production pass, eslint sạch, smoke test 200 trên `/`, `/search`, `/login`
- ✅ **D9-D12 đã chốt & triển khai**: GV là first-class user (claim-first), tách UI theo
  Route Groups `(public)` / `prof/*` / `(admin)/admin`, chặn GV review GV,
  claim hybrid (edu auto-pass / admin duyệt), schema opportunities + applications
- ✅ Migration 0003 (role 'professor', opportunities/applications + RLS + trigger giảm slot)
  và 0004 (hàm `submit_professor_claim` security-definer, guard chống tự sửa role/verification)
  đã chạy thành công qua pooler
- ✅ Onboarding GV `/join/professor` (tìm hồ sơ → claim; tạo mới → user_created + claim),
  auto-approve nếu email thuộc edu_domains
- ✅ Dashboard `/prof`: tổng quan (điểm, review về mình), `/prof/profile` sửa hồ sơ
  (chỉ khi claimed), `/prof/slots` quản lý opportunities (thêm/đóng/mở/xóa)
- ✅ Admin skeleton `/admin`: đếm hàng đợi (review pending, claims, user_created, reports)
- ✅ Dev server chạy cổng **4000** (`npm run dev`); seed demo 4 GV LPS + 1 opportunity
  (`supabase/seed_demo.sql`) để xem UI — data giả, có thể xóa khi import dữ liệu thật
- ✅ **Import 36 giảng viên LPS THẬT** (crawled từ khctnv.ftu.edu.vn + law.ftu.edu.vn,
  full tiểu sử; script crawl tại `%TEMP%\opencode\crawl-lps\`; data seed
  `supabase/seed_lps_real.sql` idempotent). Demo data đã xóa.
  ⚠️ Lưu ý: user chốt giữ **1 đơn vị LPS** dù 2 website là Khoa Luật và Khoa KHCT&NV riêng biệt
- ✅ Migration 0005: storage policies bucket `student-cards` (upload/read own folder,
  staff read all) + RPC `submit_student_card`
- ✅ Migration 0006: RPC `list_applicants` (GV xem ứng viên của mình)
- ✅ Flow thẻ SV: `/verify` upload ảnh → `card_pending` → admin duyệt ở `/admin`
- ✅ Admin dashboard đầy đủ: duyệt review pending, claims GV (approve set owner+role),
  thẻ SV (signed URL), reports
- ✅ `/me`: lịch sử review của SV (kèm trạng thái duyệt)
- ✅ `/opportunities`: sinh viên browse + apply tin cơ hội (filter theo loại);
  GV thấy danh sách ứng viên trong `/prof/slots`
- ⬜ Việc đầu sau khi đăng ký user đầu tiên — promote thành admin:
  `update public.profiles set role='admin' where id='<user-id>';`
- Git repo: https://github.com/vominhngoc147/ProfCheck (private)

## 7. Việc cần làm tiếp (next actions)

1. Deploy Vercel qua CLI (user chạy `vercel login`, sau đó deploy + set env vars)
2. Cấu hình Supabase Auth: thêm redirect URLs (localhost:4000 + domain Vercel)
   cho Google OAuth
3. Right-of-reply cho GV (Phase 3), AI summary, recommend SV↔GV theo tags/research_interests
4. Report review UI (nút report trên review → insert vào bảng reports)

## 8. Quy ước làm việc cho session sau

- Đọc file này trước, cập nhật mục §3 (decision), §6 (tiến độ), §7 (next actions) sau mỗi buổi làm.
- Code tiếng Anh, UI copy qua dictionary i18n, comment tối thiểu.
- Migration SQL đặt `supabase/migrations/`, đánh số tăng dần, không sửa migration đã chạy.
- Không commit secret; `.env*` đã trong `.gitignore`.
- Khi câu hỏi thiết kế mới nảy sinh → quyết định rồi ghi vào Decision Log, không để chỉ trong đầu.
