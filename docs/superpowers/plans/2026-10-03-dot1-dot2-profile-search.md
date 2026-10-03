# Đợt 1+2 Implementation Plan (Profile + Search)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai đợt 1 (profile GV mở rộng + mã môn tự động) và đợt 2 (search phân loại theo mục đích) lên production.

**Architecture:** 1 migration SQL duy nhất `0017` (profile cols + purpose/program + unique mới + trigger sync courses + bucket avatars + view), sau đó sửa Server Actions + UI + i18n. Không đụng thang điểm (để đợt 3).

**Tech Stack:** Next.js 16 App Router, Supabase Postgres + RLS + Storage, TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-03-profcheck-upgrade-design.md`

## Global Constraints
- Migration mới = thêm file SQL đánh số tăng dần vào `supabase/migrations/`, KHÔNG sửa file đã chạy.
- Code tiếng Anh, UI copy qua dictionary i18n (`src/i18n/dictionaries/vi.ts`, `en.ts`).
- Không commit secret; `.env*` đã trong `.gitignore`.
- `npm run build` + `eslint` sạch trước khi commit.

---

### Task 1: Migration 0017

**Files:**
- Create: `supabase/migrations/0017_professor_profile_search.sql`
- Modify: none (idempotent, IF NOT EXISTS / OR REPLACE)

**Interfaces:**
- Consumes: schema hiện tại (professors, reviews, courses, professor_courses, public_reviews view).
- Produces: cột mới + trigger `sync_professor_courses()` + bucket `professor-avatars` + view mới có `purpose, program`.

- [ ] **Step 1: Viết migration 0017** với nội dung: professors thêm degrees/titles/awards/research_fields/allow_forum_reup; reviews thêm purpose/program + check constraints; drop unique cũ + unique index mới (professor_id, author_id, purpose, lower(coalesce(course_code,''))); function+trigger sync courses từ course_code; bucket professor-avatars + storage policies; fix guard avg_clarity; drop+create lại view public_reviews gồm purpose/program.
- [ ] **Step 2: Kiểm tra SQL parse** — đọc lại file, đảm bảo không có placeholder, mọi statement idempotent.
- [ ] **Step 3: Commit migration riêng** — `git add supabase/migrations/0017_* docs/superpowers/specs/* docs/superpowers/plans/*`.

### Task 2: Backend — actions + auth

**Files:**
- Modify: `src/lib/auth.ts` (OwnedProfessor thêm fields mới)
- Modify: `src/app/actions/professor.ts` (updateProfessorProfileAction lưu degrees/titles/awards/research_fields/allow_forum_reup + upload avatar qua storage)

**Interfaces:**
- Consumes: cột mới từ Task 1.
- Produces: `getOwnedProfessor()` trả về full fields; action lưu được fields mới.

- [ ] **Step 1: Mở rộng OwnedProfessor + select** trong `getOwnedProfessor`.
- [ ] **Step 2: Mở rộng updateProfessorProfileAction** parse FormData mới (comma-split cho arrays, JSON.parse an toàn cho awards).
- [ ] **Step 3: Typecheck** qua `npm run build` ở Task 4.

### Task 3: UI đợt 1+2 + i18n

**Files:**
- Modify: `src/components/prof-profile-form.tsx` (fields mới + avatar upload + allow toggle)
- Modify: `src/app/prof/profile/page.tsx` (truyền initial mới)
- Modify: `src/app/(public)/professors/[slug]/page.tsx` (hiện avatar ảnh, degrees/titles/awards/research_fields/môn đang dạy qua professor_courses join)
- Modify: `src/components/professor-card.tsx` (Avatar hiện <img> khi có avatar_url)
- Modify: `src/app/(public)/search/page.tsx` (tab purpose + 7 filter params + query join courses/faculties/schools/reviews)
- Modify: `src/i18n/dictionaries/vi.ts`, `en.ts` (keys: profileExt, searchFilters, purpose, program)

**Interfaces:**
- Consumes: Task 2.
- Produces: UI hiển thị + search filter hoạt động với params `purpose, school, faculty, course_code, course_name, program, field`.

- [ ] **Step 1: i18n keys mới** (vi+en, không placeholder).
- [ ] **Step 2: prof-profile-form + prof/profile page.**
- [ ] **Step 3: professor detail + professor-card avatar.**
- [ ] **Step 4: search page filters + query.**
- [ ] **Step 5: Build + lint** — `npm run build`, fix lỗi, `npx eslint` (repo không có test suite; build+lint là verification).

### Task 4: Commit + push deploy

- [ ] **Step 1: `npm run build` pass + eslint sạch.**
- [ ] **Step 2: Commit theo cụm** (đợt 1, đợt 2 riêng nếu kịp; gộp 1 commit nếu file đan xen).
- [ ] **Step 3: Push master** → Vercel auto-deploy + GitHub Action chạy migration 0017.
