# Đợt 3 Implementation Plan (Review purpose + nửa sao + thang điểm riêng)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi review thuộc 1 purpose với bộ tiêu chí riêng, chấm được nửa sao 0.5–5.0, trang GV có tab điểm theo purpose.

**Architecture:** 1 migration `0018` (numeric + 2 cột mới + stats + view), sửa Server Action validate theo purpose, form chọn purpose trước, StarInput nửa sao, trang GV tab `?tab=` server-rendered.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres + RLS, TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-03-profcheck-upgrade-design.md` (mục Đợt 3)

## Global Constraints
- Migration mới = thêm file SQL đánh số tăng dần vào `supabase/migrations/`, KHÔNG sửa file đã chạy.
- Code tiếng Anh, UI copy qua dictionary i18n (`src/i18n/dictionaries/vi.ts`, `en.ts`).
- Không commit secret; `.env*` đã trong `.gitignore`.
- `npm run build` + `eslint` sạch trước khi commit.

## Rating matrix (D13–D16)
- hoc_tap: overall, clarity, difficulty, fairness, expertise (all required)
- kltn / ttgk: overall, support, difficulty, fairness, expertise (all required)
- nckh: overall, support, difficulty, expertise (all required; clarity/fairness unused)
- Half-step: 0.5–5.0, `(v*2) = floor(v*2)`. Data cũ (nguyên) giữ nguyên.

---

### Task 1: Migration 0018

**Files:**
- Create: `supabase/migrations/0018_review_purpose_halfstar.sql`

**Interfaces:**
- Consumes: schema sau 0017.
- Produces: rating cols numeric(3,1) + check half-step, `rating_expertise`/`rating_support`, `professors.avg_expertise/avg_support`, trigger stats mới, view `public_reviews` mới.

- [ ] **Step 1: Viết migration** — alter type 4 cột, add 2 cột, DO block drop check cũ `reviews_rating_%_check`, add check `reviews_ratings_halfstep`, professors add 2 avg cols, replace `guard_professor_owner_update` (bảo vệ 2 cột mới), replace `refresh_professor_stats` (tính avg expertise/support), backfill 1 lần, grants select/insert 2 cột mới, drop+create view `public_reviews` (thêm 2 cột), revoke write.
- [ ] **Step 2: Đọc lại file** — không placeholder, idempotent (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).

### Task 2: Server Action

**Files:**
- Modify: `src/app/actions/review.ts` (`submitReviewAction`)

**Interfaces:**
- Consumes: cột mới từ Task 1.
- Produces: insert review với purpose/program/course_code/expertise/support/allow_forum_reup, validate required theo matrix, lỗi `rating_required` khi thiếu.

- [ ] **Step 1: Parse purpose/program/course_code/allow_forum_reup** từ FormData (purpose default `hoc_tap`, whitelist 4 giá trị; program whitelist/nullable; course_code trim→null).
- [ ] **Step 2: Validate half-step** — helper `isHalf(v)`: `v>=0.5 && v<=5 && (v*2)%1===0`; required matrix theo purpose; thiếu → `{error:"rating_required"}`.
- [ ] **Step 3: Insert đủ cột** — giữ pre-filter + unique-violation → `already_reviewed`.

### Task 3: UI + i18n

**Files:**
- Modify: `src/components/star-rating.tsx` (StarRating hiện nửa sao, overlay width %)
- Modify: `src/components/review-form.tsx` (chọn purpose, StarInput nửa sao + hiện số, program select, allow-reup checkbox, lưu course_code thật)
- Modify: `src/app/(public)/professors/[slug]/page.tsx` (tab `?tab=` all+4 purpose, stats theo tab, badge purpose/program, hiện expertise/support, distribution bucket Math.round)
- Modify: `src/app/(public)/me/page.tsx` (badge purpose/course)
- Modify: `src/app/(admin)/admin/page.tsx` (sửa `"★".repeat(rating_overall)` crash với số lẻ → StarRating)
- Modify: `src/i18n/dictionaries/vi.ts`, `en.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces: form purpose đúng matrix, trang GV tab điểm, không còn chỗ nào crash với rating lẻ.

- [ ] **Step 1: i18n keys** (reviewForm: expertiseRating/supportRating/purposeLabel/programLabel/allowReup; reviewExtra: expertiseLabel/supportLabel; ratingRequired mới).
- [ ] **Step 2: StarRating + StarInput nửa sao.**
- [ ] **Step 3: ReviewForm purpose/program/reup.**
- [ ] **Step 4: Professor page tabs + badges.**
- [ ] **Step 5: /me badges + admin repeat fix.**
- [ ] **Step 6: `npm run build` + eslint sạch.**

### Task 4: Commit + push
- [ ] **Step 1: Commit** (`Dot 3: ... (migration 0018)`), cập nhật `PROJECT.md` tiến độ.
- [ ] **Step 2: Push master** → Vercel + Action chạy migration.
