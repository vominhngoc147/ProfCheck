<div align="center">

# 🎓 ProfCheck

**Nền tảng đánh giá giảng viên cho sinh viên Việt Nam: chọn đúng người dạy, đúng người hướng dẫn.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Migrate](https://github.com/vominhngoc147/ProfCheck/actions/workflows/migrate.yml/badge.svg)](https://github.com/vominhngoc147/ProfCheck/actions/workflows/migrate.yml)

🔗 **Dùng thử:** [profcheckvn.vercel.app](https://profcheckvn.vercel.app)

</div>

> Chọn giảng viên dạy hay đã khó, chọn người hướng dẫn khóa luận, thực tập, nghiên cứu khoa học còn khó hơn.
> ProfCheck gom review thật từ sinh viên đã xác thực, điểm số theo từng mục đích, và một forum trao đổi,
> để bạn quyết định bằng dữ liệu, không bằng lời đồn.

## 📖 Mục lục

- [Ai dùng ProfCheck?](#-ai-dùng-profcheck)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Bắt đầu trong 5 phút](#-bắt-đầu-trong-5-phút)
- [Công nghệ](#-công-nghệ)
- [Cấu trúc project](#-cấu-trúc-project)
- [Database & migration](#-database--migration)
- [Roadmap](#-roadmap)
- [Đóng góp](#-đóng-góp)
- [FAQ](#-faq)
- [Giấy phép](#-giấy-phép)

## 👥 Ai dùng ProfCheck?

| Bạn là… | ProfCheck giúp bạn… |
|---|---|
| 🎒 Sinh viên | Đọc review thật, so điểm dạy, điểm chấm và độ hỗ trợ, tìm người hướng dẫn NCKH / khóa luận / thực tập |
| 👩‍🏫 Giảng viên | Claim hồ sơ, giới thiệu lĩnh vực nghiên cứu, đăng tin tìm sinh viên, phản hồi review |
| 🛡️ Admin / moderator | Duyệt thẻ sinh viên, kiểm duyệt nội dung, xử lý report |

## ✨ Tính năng nổi bật

### 🔍 Tìm kiếm
Lọc theo mục đích **Học tập / NCKH / KLTN / TTGK**, rồi thu hẹp bằng tên giảng viên, trường,
khoa, **mã học phần**, tên học phần, hệ đào tạo (CLC / CTTT / ĐHNNQT). Chỉ nhớ mã môn cũng tìm được người dạy.

### ⭐ Review theo mục đích, chấm nửa sao
Mỗi review gắn một mục đích với bộ tiêu chí riêng:

| Mục đích | Chấm gì? |
|---|---|
| Học tập | Tổng thể · Dễ hiểu · Độ khó · Công bằng · Chuyên môn |
| KLTN / Thực tập | Tổng thể · Hỗ trợ & nhiệt tình · Độ khó · Công bằng · Chuyên môn |
| NCKH | Tổng thể · Hỗ trợ & nhiệt tình · Chuyên môn · Độ khó |

Thang **5 sao, bước nửa sao** (3.5 ★ cũng chấm được). Một bạn được review một thầy nhiều lần:
mỗi môn học, mỗi đợt hướng dẫn là một trải nghiệm khác nhau.

### 💬 Review không chỉ để đọc
- Phản hồi ngay dưới review (có chế độ ẩn danh)
- Lưu bài hay vào thư viện cá nhân 🔖
- Tự tạo quick tag cho cộng đồng dùng chung
- Đính kèm ảnh (tối đa 5) và tài liệu môn học PDF/DOC/PPT (tối đa 3)
- Report nội dung độc hại / sai sự thật / xúc phạm, bài vào hàng đợi kiểm duyệt

### 🧑‍🏫 Hồ sơ giảng viên do chính chủ quản
Ảnh đại diện, học hàm, học vị, giải thưởng, lĩnh vực nghiên cứu, **môn đang dạy tự cập nhật**
mỗi khi có review mới gắn mã môn. Giảng viên claim hồ sơ bằng email trường (duyệt tự động)
hoặc bằng chứng bổ nhiệm (admin duyệt).

### 🗣️ P-forum
Forum kiểu Reddit: tag → chủ đề → bài viết → bình luận lồng nhau, vote ±1.
Reup review thành bài forum trong một nút bấm, nhưng chỉ khi **cả tác giả lẫn giảng viên**
đều bật cho phép (tôn trọng quyền riêng tư, có trigger chặn ở database).

## 🚀 Bắt đầu trong 5 phút

**Cần có:** Node.js 20+, một project Supabase (free tier là đủ).

```bash
# 1. Clone và cài đặt
git clone https://github.com/vominhngoc147/ProfCheck.git
cd ProfCheck
npm install

# 2. Khai báo biến môi trường (.env.local, KHÔNG commit file này)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_DB_POOLER=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

# 3. Chạy migration (đánh dấu từng file đã apply vào bảng _migrations)
node scripts/migrate.mjs

# 4. Chạy dev (cổng 4000) rồi mở http://localhost:4000
npm run dev
```

> 💡 Lần `push` nào chạm vào `supabase/migrations/**` cũng tự chạy migration mới trên production
> qua GitHub Actions, bạn không cần chạy tay sau khi merge.

Kiểm tra nhanh trước khi commit:

```bash
npm run build   # TypeScript + production build phải xanh
npm run lint    # ESLint phải sạch
```

## 🛠️ Công nghệ

| Thành phần | Lựa chọn | Vì sao? |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | Server Components render nhanh, ít JavaScript gửi xuống browser |
| Backend / DB | Supabase: Postgres + Auth + Storage + RLS | Không cần viết backend riêng: logic nằm ở RLS, view, trigger |
| Auth | Google OAuth + email/password, xác thực sinh viên qua email `.edu` hoặc ảnh thẻ SV | Chỉ sinh viên thật mới được viết bài |
| Deploy | Vercel (frontend) + Supabase Cloud | Push lên `master` là tự deploy |
| Ngôn ngữ UI | Tiếng Việt mặc định, song ngữ Việt–Anh | Qua dictionary `src/i18n/`, không dùng framework nặng |

Nguyên tắc kiến trúc: **không viết backend riêng**. Mọi logic dữ liệu nằm ở Postgres
(RLS, view, trigger); chỉ chỗ nào cần secret mới dùng Edge Function.

## 📁 Cấu trúc project

```
profcheck/
├── src/
│   ├── app/
│   │   ├── (public)/        # Trang công khai: home, search, professors, forum, me, verify…
│   │   ├── prof/            # Dashboard giảng viên (đã claim hồ sơ)
│   │   ├── (admin)/admin/   # Hàng đợi kiểm duyệt
│   │   └── actions/         # Server Actions: review, social, forum, professor…
│   ├── components/          # UI dùng chung: star-rating, review-form, forum-comments…
│   ├── i18n/                # Dictionary vi/en, đổi ngôn ngữ qua cookie
│   └── lib/                 # Supabase clients, auth guards
├── supabase/
│   ├── migrations/          # 0017, 0018…: file mới chỉ thêm, KHÔNG sửa file đã chạy
│   └── seed_*.sql           # Dữ liệu giảng viên thật (idempotent, chạy lại an toàn)
├── scripts/migrate.mjs      # Runner migration từng-statement (qua pooler)
├── docs/superpowers/        # Spec + plan chi tiết từng đợt phát triển
├── PROJECT.md               # 📌 Nguồn sự thật duy nhất: quyết định, tiến độ, việc tiếp theo
└── .github/
    ├── workflows/migrate.yml# CI: push migration → tự apply lên production
    └── CONTRIBUTING.md      # Nguyên tắc đóng góp, đọc trước pull request đầu tiên
```

## 🗄️ Database & migration

Schema gồm: `profiles`, `schools`, `faculties`, `professors`, `courses`,
`professor_courses`, `reviews`, `review_comments`, `saved_reviews`, `custom_tags`,
`review_attachments`, `professor_replies`, `professor_claims`, `reports`,
`opportunities`, `applications`, `school_ratings`, `forum_*` (tags, topics, posts,
comments, votes). Tất cả bật RLS, đọc public đi qua view `public_*` để bảo vệ ẩn danh.

**3 luật sắt với migration:**

1. File mới = thêm file đánh số tăng dần (`0023_....sql`), **không bao giờ sửa file đã chạy**.
2. Viết idempotent (`IF NOT EXISTS`, `OR REPLACE`, `DROP … IF EXISTS`) vì runner chạy
   từng statement, không bọc transaction, fail giữa chừng thì chạy lại vẫn an toàn.
3. Cột mới dùng bởi view? `DROP VIEW` trước, tạo lại sau (bài học từ migration 0018).

Chi tiết xem [PROJECT.md](./PROJECT.md), file single source of truth của dự án.

## 🗺️ Roadmap

- [x] Core: auth + xác thực SV + review + kiểm duyệt admin + claim hồ sơ GV
- [x] Profile GV mở rộng + tìm kiếm theo mục đích (Đợt 1+2)
- [x] Review theo purpose + nửa sao (Đợt 3)
- [x] Tương tác review: phản hồi, lưu, tag, upload, report (Đợt 4)
- [x] P-forum + reup review (Đợt 5)
- [ ] Mở rộng data nhiều trường, import/crawl danh sách GV
- [ ] AI tóm tắt review + gợi ý giảng viên hướng dẫn
- [ ] So sánh GV, gamification, Q&A

Ý tưởng dài hơi khác (quản lý GPA, tìm teammate,…) được ghi trong [PROJECT.md](./PROJECT.md) §7.

## 🤝 Đóng góp

Project rất cần người cùng làm — từ code, data giảng viên, dịch thuật đến test và review.
Đọc **[CONTRIBUTING.md](./.github/CONTRIBUTING.md)** trước pull request đầu tiên (5 phút),
tóm tắt nhanh:

1. Fork + `git checkout -b feat/ten-ngan-gon` từ `master`
2. Viết code theo quy ước (chi tiết trong CONTRIBUTING)
3. `npm run build` + `npm run lint` xanh, boot server kiểm tra các route liên quan
4. Mở pull request về `master`, mô tả **vì sao** thay đổi. CI xanh + 1 approval là merge được

Có câu hỏi? Mở [issue](https://github.com/vominhngoc147/ProfCheck/issues). Mọi câu hỏi
nghiêm túc đều được trả lời.

## ❓ FAQ

**Tôi không phải sinh viên FTU thì dùng được không?**
Được đọc và tham gia forum. Viết review cần xác thực sinh viên (email `.edu` duyệt tự động,
không có thì gửi ảnh thẻ SV để admin duyệt).

**Trường tôi chưa có dữ liệu thì sao?**
Bạn có thể tự tạo hồ sơ giảng viên cho cộng đồng (gắn nhãn "Chờ xác minh"), hoặc tham gia
nhóm import data. Xem Roadmap và PROJECT.md §7.

**Review của tôi bị report thì sao?**
Bài vào hàng đợi admin xem xét. Điểm số cấu trúc không bao giờ bị gỡ kể cả khi nội dung
văn bản bị gỡ. Triết lý này giống RateMyProfessor: điểm số thuộc về cộng đồng.

**Tôi là giảng viên, làm sao nhận hồ sơ của mình?**
Vào `/join/professor`, tìm tên mình và bấm claim. Dùng email tên miền trường để được
duyệt tự động.

## 📄 Giấy phép

Project dùng giấy phép **MIT**. Xem file [LICENSE](./LICENSE). Bạn được tự do dùng,
sửa, phân phối, kể cả cho mục đích thương mại, chỉ cần giữ lại thông báo bản quyền.
Mọi đóng góp qua pull request được hiểu là đồng ý cấp phép theo MIT.
