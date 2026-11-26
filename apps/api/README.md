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

Sau khi migrate hoặc reset PostgreSQL local, khởi động API để tự tạo cuộc thi **CINEGEN Demo · Theo dõi bài dự thi**. Cuộc thi có 72 bài với sáu trạng thái, metadata phim, lý do bị loại và nhiều thí sinh để kiểm tra phạm vi truy cập. Dữ liệu tự tạo sau `bun --filter api db:migrate` và khi API khởi động. Demo dùng ảnh minh họa công khai. Các bài bị gắn cờ có thêm kết quả đối sánh giả lập để trình diễn UC-20, và giao diện ghi rõ dữ liệu demo. Seed không tạo ảnh âm bản hay contact sheet.

- Organizer dùng `organizer.test@example.com` để duyệt bài **DEMO · Bài chờ Organizer duyệt**.
- Participant dùng `participant.test@example.com` để xem bài, làm mới trạng thái và xem lý do bị loại. `participant.demo2@example.com` dùng để kiểm tra bài thuộc một thí sinh khác.
- Mật khẩu tài khoản demo là `password123`. Database demo chỉ dùng trên máy local.
- Khi chuyển database, khởi động lại API để tạo kết nối theo cấu hình mới.

## Fixture nghiệm thu

`bun --filter api db:migrate` áp dụng migration rồi tự seed. API cũng gọi seed khi khởi động, giữ dữ liệu fixture đã có. Không cần chạy lệnh seed riêng. Email nghiệp vụ tự xử lý bởi worker trong API khi ứng dụng chạy, gồm gửi lại các lượt thất bại.

Fixture v2 dùng database local `cinegen_acceptance_test` hoặc `cinegen_acceptance_verify_<suffix>`. Tắt cấu hình R2 cho các database này. Mọi ảnh scan, proof và preview nằm chung trong `apps/api/uploads/acceptance/<database>/`. Database và storage production bị từ chối trong acceptance seed. Fixture v1 được giữ nguyên; dùng một database kiểm chứng mới để tạo v2 đầy đủ.

- Tài khoản A, O1/O2, P1/P2, J1/J2 có email `acceptance.<alias viết thường>@example.com`, mật khẩu test `password123`. Database lưu hash và seed không in mật khẩu. Đây là địa chỉ mẫu; kiểm thử SMTP thật dùng hộp thư test được cho phép.
- C1 thuộc O1, đã công bố bằng service công bố thật. K1/K2 chứa S1/P1 và S2/P2 với điểm cuối 8.50/7.50. Ảnh preview được tạo bằng service triển lãm thật.
- C2 thuộc O2, đang mở; K3 dùng cho kiểm tra owner và cấu hình. C3 thuộc O1, có K4 và S3/P1, S4/P2; vòng R2 đã khóa, đủ proof, sẵn sàng cho API công bố. C3 giữ trạng thái trước công bố sau smoke test.
- R1 thuộc C1, R2 thuộc C3. Mỗi hạng mục đã chấm có hai tiêu chí 0.5/0.5 và hai Judge đã xác nhận. S1/S3 có phiếu 8/9 và 9/8; S2/S4 có phiếu 7/8 và 8/7. Seed không chép điểm vào response giả.
- ROLL1 thuộc P1, ROLL2 thuộc P2. Metadata dùng roll ID thật và số frame riêng 1/2. Schema/API registration và Frame chưa có, được ghi rõ là phụ thuộc N134-05 trong checklist.
- Năm mốc được tạo tương đối tại lần seed đầu. Đọc thời gian thật từ API. Chạy lại seed giữ trạng thái hiện tại, không đổi lịch hay công bố lại.
- Alias UUID được xuất qua `acceptanceIds` trong [seed-acceptance.ts](src/db/seed-acceptance.ts). Các alias gốc giữ UUID, alias mới được nối cuối danh sách.

Smoke test dùng DB kiểm chứng riêng đã migrate. Chạy `bun --filter api test:all tests/acceptance-seed.integration.test.ts` với DATABASE_URL trỏ vào DB đó. Bộ test đăng nhập qua API thật, đọc contest/bài/kết quả, kiểm tra storage và điều kiện công bố, rồi khôi phục các điều kiện lỗi tạm thời. Không cần chỉnh DB thủ công.
