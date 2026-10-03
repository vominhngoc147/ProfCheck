# Đợt 4 Implementation Plan (Review social: phản hồi, lưu, tag, upload, report)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review có thread phản hồi, nút lưu vào thư viện cá nhân, quick tag tự tạo, upload ảnh + tài liệu môn học, report với lý do độc hại/sai sự thật/xúc phạm.

**Architecture:** 2 migration (`0019` tables+buckets+view, `0020` chuẩn hóa reason), actions mới `social.ts`, mở rộng `submitReviewAction` (custom tags + files), UI trong ReviewCard + trang `/me/saved`.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres + RLS + Storage (public buckets), TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-03-profcheck-upgrade-design.md` (mục Đợt 4)

## Global Constraints
- Migration mới = thêm file SQL đánh số tăng dần vào `supabase/migrations/`, KHÔNG sửa file đã chạy.
- Code tiếng Anh, UI copy qua dictionary i18n (`src/i18n/dictionaries/vi.ts`, `en.ts`).
- Không commit secret; `.env*` đã trong `.gitignore`.
- `npm run build` + `eslint` sạch trước khi commit.

## Quy ước đã chốt
- Comments: thread 1 cấp dưới mỗi review, verified mới được viết, có tick ẩn danh, tự xóa được.
- Saved: bảng `saved_reviews`, trang `/me/saved`.
- Custom tags: gõ tự do khi viết review (tối đa 5, mỗi tag ≤30 ký tự), lưu vào `custom_tags` + merge vào `tags[]`, hiển thị chung (fallback raw label đã có).
- Upload: ảnh `review-images` (public, ≤5MB/ảnh, ≤5 ảnh), tài liệu `review-docs` (public, PDF/DOC/PPT ≤10MB/file, ≤3 file). Public để chia sẻ, tránh signed-URL complexity.
- Report reasons mới: `doc_hai / sai_su_that / xuc_pham / spam / khac`; map cũ toxic→xuc_pham, false→sai_su_that, pii→khac.

---

### Task 1: Migrations 0019 + 0020

**Files:**
- Create: `supabase/migrations/0019_review_social.sql`
- Create: `supabase/migrations/0020_report_reasons.sql`

**Interfaces:**
- Consumes: schema sau 0018.
- Produces: `review_comments` (+view `public_review_comments`), `saved_reviews`, `custom_tags`, `review_attachments`, buckets + storage policies, `reports.reason` check mới.

- [ ] **Step 1: Viết 0019** — 4 bảng + index + RLS (comments/saved/tags/attachments theo quy ước trên), view public_review_comments (mask tên khi ẩn danh), 2 buckets + policies (public read, authenticated insert, own/admin delete).
- [ ] **Step 2: Viết 0020** — UPDATE map reason cũ → mới, rồi ADD CHECK `reports_reason_check`.
- [ ] **Step 3: Đọc lại** — idempotent, không placeholder.

### Task 2: Actions

**Files:**
- Create: `src/app/actions/social.ts` (addComment/deleteComment/toggleSave)
- Modify: `src/app/actions/review.ts` (submitReviewAction: custom tags + upload files; reportReviewAction: whitelist reason mới)

**Interfaces:**
- Consumes: Task 1.
- Produces: comment CRUD, save toggle trả `{saved}`, review insert kèm attachments/tags.

- [ ] **Step 1: social.ts** — addComment (verified, length 1–2000, revalidate professor page), deleteComment (own or admin), toggleSave (insert/delete own, return state).
- [ ] **Step 2: submitReviewAction** — parse `custom_tags` (tối đa 5, filter từ khóa độc hại, upsert custom_tags, merge tags), parse `images`/`docs` (đếm/size/type, upload, insert attachments; best-effort sau khi review đã tạo), giữ pre-filter + 23505 → already_reviewed.
- [ ] **Step 3: reportReviewAction** — whitelist 5 reason mới.

### Task 3: UI + i18n

**Files:**
- Create: `src/components/review-comments.tsx`, `src/components/save-review-button.tsx`
- Modify: `src/components/review-form.tsx` (ô custom tags step 2, file inputs step 3, dict keys mới)
- Modify: `src/app/(public)/professors/[slug]/page.tsx` (fetch comments/attachments/saved, render trong ReviewCard)
- Modify: `src/components/report-button.tsx` (5 reasons mới)
- Create: `src/app/(public)/me/saved/page.tsx`
- Modify: `src/i18n/dictionaries/vi.ts`, `en.ts`

- [ ] **Step 1: i18n keys** (comments, saved, attachments, customTags, report reasons mới).
- [ ] **Step 2: review-comments + save button (client).**
- [ ] **Step 3: review-form inputs mới.**
- [ ] **Step 4: professor page fetch + ReviewCard gallery/comments/save.**
- [ ] **Step 5: /me/saved + report-button reasons.**
- [ ] **Step 6: build + lint.**

### Task 4: Commit + push
- [ ] Commit (`Dot 4: ... (migrations 0019-0020)`), cập nhật `PROJECT.md`. Push master.
