# CINEGEN

Nền tảng Quản lý Cuộc thi Nhiếp ảnh Phim tích hợp Trí tuệ Nhân tạo (**CINEGEN**) là hệ thống Monorepo toàn diện bao gồm: Backend RESTful API, Web Frontend và Mobile App (Flutter).

Dự án được điều phối bằng **[Turborepo](https://turbo.build/)** và sử dụng **[Bun](https://bun.sh/)** làm Package Manager & Runtime chính.

---

## 📌 Mục lục

- [Cấu trúc Monorepo](#-cấu-trúc-monorepo)
- [Tài liệu dự án](#tài-liệu-dự-án)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Khởi động Nhanh (Quick Start)](#-khởi-động-nhanh-quick-start)
- [Các lệnh Điều phối Dự án (Scripts)](#-các-lệnh-điều-phối-dự-án-scripts)
- [Cài đặt Thư viện mới (Add Dependencies)](#-cài-đặt-thư-viện-mới-add-dependencies)
- [Quy chuẩn AI Coding Assistant](#-quy-chuẩn-ai-coding-assistant)

---

## 📁 Cấu trúc Monorepo

```text
film-contest/
├── apps/
│   ├── api/               # Backend RESTful API (Hono + Bun + Drizzle ORM, Port: 8080)
│   ├── web/               # Web Application (Next.js 16 + React 19 + Tailwind v4, Port: 3000)
│   └── mobile/            # Mobile App đa nền tảng (Flutter + Riverpod + GoRouter)
│
├── packages/
│   ├── typescript-config/ # Cấu hình TypeScript dùng chung (@repo/typescript-config)
│   └── eslint-config/     # Cấu hình ESLint & Linting rules (@repo/eslint-config)
│
├── docs/                  # SRS, đặc tả kỹ thuật, OpenAPI và tiến độ
├── AGENTS.md              # Chỉ dẫn bắt buộc dành cho AI Coding Agents
├── .cursorrules           # Cấu hình kiểm soát context cho Cursor AI
├── bun.lock               # Lockfile chính thức của Bun (KHÔNG xoá, KHÔNG dùng npm)
├── package.json           # Điều phối workspace monorepo
└── turbo.json             # Pipeline cấu hình cache và build của Turborepo
```

### Các Ứng dụng Thành phần:

*   **[`apps/api`](apps/api/README.md)**: RESTful API service hiệu năng cao với **Hono**, chạy native trên **Bun runtime**, tích hợp **PostgreSQL 16+**, **`pgvector`** và **Drizzle ORM**.
*   **[`apps/web`](apps/web/README.md)**: Ứng dụng Web dành cho Quản trị viên, Ban tổ chức, Giám khảo và Thí sinh xây dựng trên **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** và **Biome**.
*   **[`apps/mobile`](apps/mobile/README.md)**: Ứng dụng Flutter (iOS / Android) để xem cuộc thi, nộp ảnh kèm thông số phim và theo dõi trạng thái bài thi.

---

## Tài liệu dự án

- [SRS](docs/srs.md) quy định nghiệp vụ, quyền và mã thông báo. [Chỉ mục module trong SRS](docs/srs.md#4-module-specifications-mapping-chỉ-mục-ánh-xạ-module-chi-tiết) dẫn tới từng đặc tả kỹ thuật.
- [Hợp đồng API](docs/ai/09-api-contracts.md) và [OpenAPI](docs/openapi.yaml) ghi DTO, endpoint và trạng thái triển khai.
- [Tổng quan tiến độ](docs/progress/overview.md) và [bảng sprint](docs/progress/sprints.md) ghi phần đã có và phần còn thiếu.

---

## Yêu cầu môi trường

- **Bun** theo phiên bản trong [`package.json`](package.json).
- **Node.js**: `>= 24` theo [`package.json`](package.json).
- **PostgreSQL**: xem [hướng dẫn database](apps/api/README-DATABASE.md).
- **Flutter SDK**: xem [hướng dẫn Mobile](apps/mobile/README.md).

> [!IMPORTANT]
> Dự án sử dụng **Bun** làm runtime và package manager duy nhất. **Tuyệt đối KHÔNG sử dụng `npm`, `yarn` hoặc `pnpm`** để tránh xung đột file lock và hỏng workspace resolution.

---

## 🚀 Khởi động Nhanh (Quick Start)

### 1. Cài đặt Dependencies
Tại thư mục gốc của repository:
```bash
bun install
```

### 2. Cấu hình Môi trường
```bash
# Backend API
cp apps/api/.env.example apps/api/.env

# Web Frontend
cp apps/web/.env.example apps/web/.env.local
```

### 3. Khởi tạo cơ sở dữ liệu

Tạo database và thiết lập `DATABASE_URL` theo [hướng dẫn PostgreSQL](apps/api/README-DATABASE.md).
```bash
bun --filter api db:migrate
bun --filter api db:seed
```

### 4. Chạy Môi trường Phát triển (Development)

Chạy đồng thời cả Web và API:
```bash
bun dev
```
*   🌐 **Web App**: [http://localhost:3000](http://localhost:3000)
*   🚀 **API Endpoint**: [http://localhost:8080](http://localhost:8080)

Chạy ứng dụng Mobile (Flutter):
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 📜 Các lệnh Điều phối Dự án (Scripts)

Các lệnh thực thi tại thư mục gốc:

| Lệnh | Mô tả chức năng |
| :--- | :--- |
| `bun dev` | Chạy đồng thời dev server toàn bộ workspace qua Turborepo |
| `bun run build` | Build production cho tất cả ứng dụng (`turbo run build`) |
| `bun run lint` | Kiểm tra cú pháp và chất lượng mã nguồn (`turbo run lint`) |
| `bun run format` | Chạy Prettier từ gốc repo |
| `bun run check-types` | Kiểm tra tĩnh kiểu dữ liệu TypeScript toàn bộ dự án |
| `bun run test` | Chạy unit test trên toàn monorepo (`turbo run test`) |

---

## 📦 Cài đặt Thư viện mới (Add Dependencies)

Luôn sử dụng cờ `--filter` để cài đặt đúng workspace:

```bash
# Thêm package vào Web:
bun --filter web add <package-name>

# Thêm package vào Backend API:
bun --filter api add <package-name>

# Thêm tooling dùng chung vào Root repo:
bun add -d <package-name>

# Thêm package vào Mobile (Flutter):
cd apps/mobile && flutter pub add <package-name>
```

---

## 🤖 Quy chuẩn AI Coding Assistant

[`AGENTS.md`](AGENTS.md) là chỉ dẫn chung. Các tệp cho [Cursor](.cursor/rules/srs-context.mdc) và [Claude Code](CLAUDE.md) trỏ về tài liệu này. Các yêu cầu riêng cho Next.js được ghi trong [`apps/web/AGENTS.md`](apps/web/AGENTS.md).
