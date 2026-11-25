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

Các bảng Drizzle nằm trong `src/db/schemas/`. `index.ts` xuất schema cho Drizzle Kit. Các import qua `src/db/schema.ts` vẫn dùng được.

| File | Bảng thuộc nghiệp vụ |
| --- | --- |
| `module-1.schema.ts` | Tài khoản, quyền, xác thực, audit tài khoản và phiên |
| `module-3.schema.ts` | Cuộc thi, hạng mục, tiêu chí và phân công |
| `module-4.schema.ts` | Cuộn phim |
| `module-5.schema.ts` | Bài thi, thông số phim và log kiểm duyệt |
| `module-6.schema.ts` | Phân tích và hàng đợi AI |
| `module-7.schema.ts` | Phiếu chấm và điểm theo tiêu chí |

Khi thay đổi bảng, chạy:

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

[Baseline `0000_baseline.sql`](drizzle/0000_baseline.sql) tạo toàn bộ 20 bảng hiện tại. Cách áp dụng phụ thuộc vào lịch sử của database.

| Database | Cách áp dụng |
| --- | --- |
| Mới, chưa có các bảng ứng dụng | Chạy `bun run --filter api db:migrate`. |
| Đã chạy đủ chuỗi cũ đến `0015_pale_johnny_blaze` | Giữ lịch sử trong `public.__drizzle_migrations`. Baseline dùng cùng mốc thời gian `1795606798211`, nên Drizzle bỏ qua baseline và áp dụng được các migration mới sau đó. |
| Đã có bảng nhưng chưa đến `0015` | Sao lưu, dùng mã ở commit `28c674c` để áp dụng các migration cũ còn thiếu trên cùng database. Sau khi thấy mốc `0015`, chuyển sang bản baseline. Nếu database được tạo thủ công hoặc bị lệch schema, đối chiếu trước khi chạy migration. |

Kiểm tra mốc hiện tại của database đã có lịch sử.

```sql
SELECT created_at
FROM public.__drizzle_migrations
ORDER BY created_at DESC
LIMIT 1;
```

Cách chuyển tiếp giữ nguyên dữ liệu nghiệp vụ và bảng lịch sử. Baseline dùng cho DB trống, còn DB cũ được nhận diện theo mốc đã chạy.

## 6. Important notes

- Không commit `apps/api/.env`.
- Không tự ý xóa bảng hoặc lịch sử migration trên database dùng chung.
- Khi thay đổi schema, tạo migration mới và commit cả file SQL cùng metadata trong `apps/api/drizzle/`.
- Thành viên mới nên sử dụng database riêng và chạy migration từ đầu.
