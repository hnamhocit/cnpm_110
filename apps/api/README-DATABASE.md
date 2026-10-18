# Database Setup – FPC-8

## 1. Requirements

- Bun
- PostgreSQL
- Database PostgreSQL đã được tạo trước khi chạy migration.

## 2. Configure environment variables

Tạo file `apps/api/.env` dựa trên `apps/api/.env.example`.

Cập nhật `DATABASE_URL` theo thông tin PostgreSQL trên máy của bạn.

Ví dụ:

`DATABASE_URL=postgresql://postgres:your_password@localhost:5432/film_contest`

Không commit file `.env` lên Git.

## 3. Install dependencies

Tại thư mục gốc của repository, chạy:

```bash
bun install
```

## 4. Generate migration

Khi schema trong `apps/api/src/db/schema.ts` được thay đổi, chạy:

```bash
bun run --filter api db:generate
```

Kiểm tra tính nhất quán của migration:

```bash
bun run --filter api db:check
```

Kiểm tra file SQL được sinh ra trước khi áp dụng.

## 5. Apply migrations

Để tạo các bảng trên một database mới:

```bash
bun run --filter api db:migrate
```

Migration khởi tạo tạo các bảng:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

Không chạy migration khởi tạo trên database đã có các bảng này, trừ khi lịch sử migration đã được thiết lập đúng. Nếu database đã tồn tại từ trước, cần đối chiếu schema và thiết lập baseline trước khi dùng Drizzle quản lý tiếp.

## 6. Seed default roles

Sau khi migration thành công, chạy:

```bash
bun run --filter api db:seed
```

Lệnh seed thêm các role mặc định nếu chưa tồn tại:

- Admin
- Organizer
- Judge
- Participant

## 7. Important notes

- Không commit `apps/api/.env`.
- Không tự ý xóa bảng hoặc lịch sử migration trên database dùng chung.
- Khi thay đổi schema, tạo migration mới và commit cả file SQL cùng metadata trong `apps/api/drizzle/`.
- Thành viên mới nên sử dụng database riêng và chạy migration từ đầu.
