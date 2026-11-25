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

# Seed dữ liệu mặc định (Admin, Organizer, Judge, Participant)
bun --filter api db:seed
```

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
| `bun --filter api db:seed`          | Nạp dữ liệu vai trò ban đầu                          |

## Xác thực định danh và khôi phục mật khẩu

Áp dụng migration trước khi chạy API. Với môi trường triển khai, đặt `NODE_ENV=production` để chỉ seed role hệ thống khi khởi động.

- Email dùng Nodemailer với `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` và địa chỉ gửi `SMTP_FROM`. Cổng 465 dùng TLS ngay khi kết nối. Cổng khác yêu cầu STARTTLS. [Nodemailer SMTP](https://nodemailer.com/smtp)
- `PASSWORD_RESET_URL` là URL HTTPS của màn đặt lại mật khẩu. Backend thêm tham số `token` vào link. Màn client gửi token, mật khẩu mới và xác nhận đến `POST /api/v1/auth/reset-password`.

Đăng ký tạo tài khoản chờ xác thực. Client xác thực mã email rồi đăng nhập. Số điện thoại là tùy chọn. Xem [Module 01](../../docs/ai/01-auth-and-rbac.md#4-shared-api-contracts-dùng-chung-cho-web--mobile). Integration test inject bộ gửi giả và cần PostgreSQL test có migration. Dùng `bun --filter api test:integration` với `DATABASE_URL` và `TEST_DB_NAME` trỏ vào database test.
