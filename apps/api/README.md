# 🚀 Film Contest - Backend API

Dịch vụ Backend RESTful API cho dự án Film Contest, được xây dựng bằng **[Hono](https://hono.dev/)** chạy native trên **[Bun](https://bun.sh/)** runtime, sử dụng **[Drizzle ORM](https://orm.drizzle.team/)** và **PostgreSQL**.

Mọi nghiệp vụ, DTO, phân quyền và ràng buộc dữ liệu tuân thủ nghiêm ngặt **[Master SRS](../../docs/srs.md)** và hợp đồng API tại **[`docs/09-api-contracts.md`](../../docs/09-api-contracts.md)**.

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

## 📡 Danh sách Endpoints chính

### Xác thực (Auth)

- `POST /auth/register`: Đăng ký tài khoản Participant mới
- `POST /auth/login`: Đăng nhập, nhận Access Token (15 phút) & Refresh Token (7 ngày)
- `POST /auth/refresh`: Cấp mới Access Token bằng Refresh Token (Token Rotation)
- `POST /auth/logout`: Thu hồi Refresh Token

### Upload & Lưu trữ

- `POST /upload`: Upload file ảnh (JPEG, PNG, WebP tối đa 50MB) lên Cloudflare R2

### Phân quyền (RBAC)

- `GET /rbac/admin`: Yêu cầu quyền `Admin`
- `GET /rbac/organizer`: Yêu cầu quyền `Organizer`
- `GET /rbac/judge`: Yêu cầu quyền `Judge`
- `GET /rbac/participant`: Yêu cầu quyền `Participant`
- `GET /rbac/manage-contest`: Cho phép quyền `Admin` hoặc `Organizer`

---

## 📖 Tài liệu đặc tả API (API Specification)

- **OpenAPI 3.0 (Swagger)**: [`docs/openapi.yaml`](../../docs/openapi.yaml) (Có thể mở bằng Swagger Editor hoặc Swagger UI).
- **Postman Collection**: [`docs/film-contest.postman_collection.json`](../../docs/film-contest.postman_collection.json) (Import trực tiếp vào Postman để test toàn bộ luồng Auth, Refresh Token, Upload và RBAC với kịch bản tự động lưu token).

---

## 📜 Các lệnh khả dụng

| Lệnh                                | Ý nghĩa                                              |
| :---------------------------------- | :--------------------------------------------------- |
| `bun --filter api dev`              | Chạy API dev server với Hot Reload (`--hot`)         |
| `bun --filter api check-types`      | Kiểm tra lỗi type TypeScript (`tsc --noEmit`)        |
| `bun --filter api test`             | Chạy bộ Unit Tests cho Auth & Middleware             |
| `bun --filter api test:integration` | Chạy Integration Tests (yêu cầu database `fpc_test`) |
| `bun --filter api db:generate`      | Sinh file SQL migration mới từ schema                |
| `bun --filter api db:migrate`       | Áp dụng migration vào PostgreSQL                     |
| `bun --filter api db:seed`          | Nạp dữ liệu vai trò ban đầu                          |
