# Contributing

Cảm ơn bạn đã muốn cùng xây ProfCheck! Tài liệu này nói những gì cần biết để
đóng góp trơn tru — đọc một lần trước pull request đầu tiên là đủ.

## Branch model

- `master` — production. Push lên đây là tự deploy lên
  [profcheckvn.vercel.app](https://profcheckvn.vercel.app) qua Vercel.
- `feat/<ten-ngan>` — việc của bạn. Branch từ `master`, ví dụ `feat/forum-search`,
  `fix/avatar-upload`, `docs/readme-faq`.

Không có branch `dev`/`staging` riêng — giữ mọi thứ đơn giản cho tới khi project cần.

## Workflow

1. `git checkout master && git pull`
2. `git checkout -b feat/viec-cua-ban`
3. Viết code. Chạy kiểm tra local:
   ```bash
   npm run build   # TypeScript + production build
   npm run lint    # ESLint
   ```
4. Boot server (`npm run dev` hoặc `npm start`) và mở thử các route bạn đã chạm vào —
   trang render 200, không vỡ layout, không lỗi console.
5. Mở pull request về `master`. CI (migrate + Vercel preview) phải xanh.
6. Nhờ review từ chủ repo hoặc một thành viên khác.
7. Sau approval, squash-merge vào `master` (tự deploy production).

## Database migration

Đây là phần khác biệt nhất của repo này — đọc kỹ:

1. Migration mới = **thêm file** `supabase/migrations/NNNN_ten_ngan.sql` đánh số tăng dần.
   **Không bao giờ sửa file đã chạy** (đã merge vào `master`).
2. Viết idempotent: `IF NOT EXISTS`, `OR REPLACE`, `DROP … IF EXISTS`. Runner
   (`scripts/migrate.mjs`) chạy từng statement, không bọc transaction — fail giữa
   chừng thì chạy lại vẫn an toàn.
3. Push file migration lên `master` là GitHub Actions tự apply lên production
   (theo dõi qua bảng `_migrations`). Kiểm tra tab Actions sau khi merge.
4. Đổi kiểu cột đang dùng bởi view? `DROP VIEW` trước, tạo lại sau (xem migration 0018).
5. Chạy migration local qua pooler (không commit connection string):
   ```bash
   node scripts/migrate.mjs   # cần SUPABASE_DB_POOLER trong môi trường
   ```
6. Seed data (`seed_*.sql`) phải idempotent — chạy lại không được tạo trùng.

## Commit style

```
<type>: <short summary>
```

Subject là ASCII, không dấu. Types: `feat`, `fix`, `refactor`, `docs`, `test`,
`chore`, `ci`.

Examples:

- `feat: add topic filter to forum feed`
- `fix: allow half-star values in rating validation`
- `docs: clarify migration workflow in README`
- `ci: run migrations on seed changes too`

Body commit có thể viết tiếng Việt để giải thích bối cảnh.

## Pull request checklist

Trước khi đánh dấu pull request sẵn sàng:

- [ ] Build xanh local (`npm run build`)
- [ ] Linter sạch (`npm run lint`)
- [ ] Đã mở thử các route liên quan trên browser, không lỗi
- [ ] Không có secret trong diff (tìm `supabase.co`, `password`, `API_KEY`, `service_role`;
  `.env*` không bao giờ được commit)
- [ ] Migration (nếu có) tuân thủ 6 luật ở mục Database migration
- [ ] Copy UI mới đi qua dictionary `src/i18n/` (cả `vi` lẫn `en`)
- [ ] Docs cập nhật nếu hành vi hoặc cách setup thay đổi (`README.md`, `PROJECT.md`)
- [ ] Mô tả pull request giải thích **vì sao** thay đổi, không chỉ thay đổi gì

## Code review

- Ít nhất một approval trước khi merge.
- Mọi CI check phải xanh.
- Không push thẳng lên `master` — mọi thay đổi đi qua pull request.
- Pull request treo quá 24h không ai review? Nhắn trực tiếp cho chủ repo.
- Giữ diff gọn, đúng phạm vi pull request — không refactor lan man không liên quan.

## Testing

Repo chưa có unit test suite — kiểm chứng hiện tại là 3 lớp:

1. `npm run build` — bắt lỗi TypeScript và lỗi render lúc build.
2. `npm run lint` — bắt lỗi style và biến thừa/thiếu.
3. Smoke test tay: boot server, mở các route đã sửa (feed, form, trang chi tiết),
   thử luồng chính end-to-end (viết review, vote, comment…).

Khi thêm tính năng lớn, ghi lại các bước bạn đã test tay trong mô tả pull request để
người review kiểm tra lại nhanh.

## Code style

- TypeScript strict (build fail là lỗi, không warning cho qua).
- Server Components mặc định; chỉ dùng Client Component (`"use client"`) khi cần
  tương tác (form, vote, comment…).
- Styling bằng Tailwind CSS (không CSS module riêng lẻ trừ khi cần).
- Code viết tiếng Anh; copy hiển thị cho người dùng đi qua `src/i18n/dictionaries/`.
- Mọi bảng Postgres mới đều bật RLS; đường đọc public đi qua view `public_*`
  để không lộ `author_id` khi ẩn danh.
- Validate mọi input ở Server Action (đừng tin client gửi lên).

## Security

- Không commit `.env` files, credentials, hay keys — `.env*` đã nằm trong `.gitignore`.
- Không log secret (`console.log(token)` là bug).
- Không bao giờ để `service_role` key ra client — browser chỉ dùng anon key + RLS.
- Input người dùng là không đáng tin: giới hạn độ dài, whitelist giá trị, escape khi render.
- Query database qua Supabase client (parameterized sẵn) — không nối chuỗi SQL từ input.
