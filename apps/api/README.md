# 🚀 CINEGEN - Backend API

Dịch vụ Backend RESTful API cho dự án CINEGEN, được xây dựng bằng **[Hono](https://hono.dev/)** chạy native trên **[Bun](https://bun.sh/)** runtime, sử dụng **[Drizzle ORM](https://orm.drizzle.team/)** và **PostgreSQL**.

Mọi nghiệp vụ, DTO, phân quyền và ràng buộc dữ liệu tuân thủ nghiêm ngặt **[Master SRS](../../docs/srs.md)** và hợp đồng API tại **[`docs/ai/09-api-contracts.md`](../../docs/ai/09-api-contracts.md)**.

---

## 📌 Công nghệ sử dụng

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: PostgreSQL
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Cloud Storage**: Cloudflare R2 (S3 compatible)
- **Authentication**: JWT (Access Token + Refresh Token lưu database)

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `apps/api/` dựa trên `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/film_contest
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
```

> [!WARNING]
> Không bao giờ commit file `apps/api/.env` lên Git.

### 2. Cài đặt dependencies (từ thư mục gốc repo)

```bash
bun install
```

### 3. Cài đặt & Migrate Database

Xem chi tiết tại [README-DATABASE.md](./README-DATABASE.md).

Các lệnh cơ bản:

```bash
# Áp dụng migrations tạo các bảng users, roles, permissions...
bun --filter api db:migrate
```

API tự nạp vai trò hệ thống khi khởi động. Môi trường phát triển cũng tự nạp tài khoản và cuộc thi mẫu.

Nếu database local cũ lệch schema và có thể xóa, chạy `bun --filter api db:reset --confirm=cinegen` với tên database thực tế. Lệnh xóa dữ liệu trong schema `public` và chạy lại migration. Xem [hướng dẫn reset và xử lý lỗi](./README-DATABASE.md#6-reset-và-migrate-database-local).

### 4. Khởi chạy Development Server

```bash
# Từ thư mục gốc monorepo:
bun --filter api dev
```

API Server lắng nghe tại cổng: **[http://localhost:8080](http://localhost:8080)**

---

## Tài liệu API

- [Danh mục endpoint và trạng thái triển khai](../../docs/ai/09-api-contracts.md#6-danh-mục-endpoint)
- [OpenAPI](../../docs/openapi.yaml) để mở trong Swagger hoặc import vào Postman

---

## 📜 Các lệnh khả dụng

| Lệnh                                | Ý nghĩa                                              |
| :---------------------------------- | :--------------------------------------------------- |
| `bun --filter api dev`              | Chạy API dev server với Hot Reload (`--hot`)         |
| `bun --filter api check-types`      | Kiểm tra lỗi type TypeScript (`tsc --noEmit`)        |
| `bun --filter api test`             | Chạy unit test cho Auth, kiểm tra ảnh và kết quả             |
| `bun --filter api test:integration` | Chạy integration test Auth trên PostgreSQL |
| `bun --filter api db:generate`      | Sinh file SQL migration mới từ schema                |
| `bun --filter api db:migrate`       | Áp dụng migration vào PostgreSQL                     |
| `bun --filter api db:reset --confirm=cinegen` | Xóa schema `public` của database local rồi chạy lại migration |

## Xác thực định danh và khôi phục mật khẩu

Áp dụng migration trước khi chạy API. Với môi trường triển khai, đặt `NODE_ENV=production` để chỉ seed role hệ thống khi khởi động.

- Email dùng Nodemailer với `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` và địa chỉ gửi `SMTP_FROM`. Cổng 465 dùng TLS ngay khi kết nối. Cổng khác yêu cầu STARTTLS. [Nodemailer SMTP](https://nodemailer.com/smtp)
- `PASSWORD_RESET_URL` trỏ đến màn đặt lại mật khẩu, ví dụ `http://localhost:3000/auth/reset-password` khi phát triển cục bộ. Production yêu cầu HTTPS. Backend thêm tham số `token` vào link. Màn client gửi token, mật khẩu mới và xác nhận đến `POST /api/v1/auth/reset-password`.

Đăng ký tạo tài khoản chờ xác thực. Client xác thực mã email rồi đăng nhập. Số điện thoại là tùy chọn. Xem [Module 01](../../docs/ai/01-auth-and-rbac.md#4-shared-api-contracts-dùng-chung-cho-web--mobile). Integration test inject bộ gửi giả và cần PostgreSQL test có migration. Dùng `bun --filter api test:integration` với `DATABASE_URL` và `TEST_DB_NAME` trỏ vào database test.

## Dữ liệu demo UC-40

Sau khi migrate hoặc reset PostgreSQL local, khởi động API để tự tạo cuộc thi **CINEGEN Demo · Theo dõi bài dự thi**. Cuộc thi có 72 bài với sáu trạng thái, metadata phim, lý do bị loại và nhiều thí sinh để kiểm tra phạm vi truy cập. Có thể dùng `bun --filter api db:seed:demo` để chuẩn bị dữ liệu trước khi bật API nếu database local có tên `cinegen_demo`. Demo dùng ảnh minh họa công khai. Các bài bị gắn cờ có thêm kết quả đối sánh giả lập để trình diễn UC-20, và giao diện ghi rõ dữ liệu demo. Seed không tạo ảnh âm bản hay contact sheet.

- Organizer dùng `organizer.test@example.com` để duyệt bài **DEMO · Bài chờ Organizer duyệt**.
- Participant dùng `participant.test@example.com` để xem bài, làm mới trạng thái và xem lý do bị loại. `participant.demo2@example.com` dùng để kiểm tra bài thuộc một thí sinh khác.
- Mật khẩu tài khoản demo là `password123`. Database demo chỉ dùng trên máy local.
- Khi chuyển database, khởi động lại API để tạo kết nối theo cấu hình mới.

## Fixture nghiệm thu

Sau khi migrate PostgreSQL local, trỏ `DATABASE_URL` vào database `cinegen_acceptance_test` rồi chạy `bun --filter api dev`. API tự nạp fixture nghiệm thu khi khởi động. Docker Compose mặc định mở PostgreSQL ở cổng `5433`. Bỏ các biến cấu hình R2 khi chạy API với database này để dùng ảnh JPEG tổng hợp trong `apps/api/uploads`.

- Log khởi động liệt kê email và vai trò của từng tài khoản. Mật khẩu mặc định là `password123`. Tra ID cố định theo alias trong [seed-acceptance.ts](src/db/seed-acceptance.ts).
- Alias: O1/O2 (Organizer), P1/P2 (Participant), J1/J2 (Judge), A (Admin). C1 thuộc O1 và C2 thuộc O2; K1/K2 thuộc C1, K3 thuộc C2. S1 thuộc P1/K1 và S2 thuộc P2/K2 trong C1.
- Lịch seed theo UTC+7: mở 01/12 09:00, hạn nộp 05/12 18:00, chấm 06/12 09:00, kết thúc chấm 07/12 18:00, công bố 08/12 09:00. Dùng lịch này để đặt đồng hồ test theo từng ca.
- Dữ liệu M08 có sẵn: C1 đã ở trạng thái đã công bố với vòng chung kết đã khóa. S1 đạt 8.50 (Giải Nhất) kèm nhận xét riêng của J1 và J2, có ảnh âm bản đã xác minh nên có thể đưa thẳng vào triển lãm; S2 chưa có trong kết quả công bố.
- Nếu ca kiểm thử làm thay đổi dữ liệu, có thể reset riêng database này bằng `bun --filter api db:reset --confirm=cinegen_acceptance_test` rồi khởi động lại API.
