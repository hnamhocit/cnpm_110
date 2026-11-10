# 🎬 Film Contest Platform - Monorepo

Nền tảng Quản lý Cuộc thi Nhiếp ảnh Phim tích hợp Trí tuệ Nhân tạo (**FilmContest-AI**) là hệ thống Monorepo toàn diện bao gồm: Backend RESTful API, Web Frontend và Mobile App (Flutter).

Dự án được điều phối bằng **[Turborepo](https://turbo.build/)** và sử dụng **[Bun](https://bun.sh/)** làm Package Manager & Runtime chính.

---

## 📌 Mục lục

- [Cấu trúc Monorepo](#-cấu-trúc-monorepo)
- [Tài liệu Đặc tả AI-First (SSOT)](#-tài-liệu-đặc-tả-ai-first-ssot)
- [Yêu cầu Môi trường (Prerequisites)](#-yêu-cầu-môi-trường-prerequisites)
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
├── docs/                  # Tài liệu đặc tả Master SRS, 10 Module Specs, OpenAPI 3.0 & Postman
├── AGENTS.md              # Chỉ dẫn bắt buộc dành cho AI Coding Agents
├── .cursorrules           # Cấu hình kiểm soát context cho Cursor AI
├── bun.lock               # Lockfile chính thức của Bun (KHÔNG xoá, KHÔNG dùng npm)
├── package.json           # Điều phối workspace monorepo
└── turbo.json             # Pipeline cấu hình cache và build của Turborepo
```

### Các Ứng dụng Thành phần:

*   **[`apps/api`](apps/api/)**: RESTful API service hiệu năng cao với **Hono**, chạy native trên **Bun runtime**, tích hợp **PostgreSQL 16+**, **`pgvector`** và **Drizzle ORM**.
*   **[`apps/web`](apps/web/)**: Ứng dụng Web dành cho Quản trị viên, Ban tổ chức, Giám khảo và Thí sinh xây dựng trên **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** và **Biome**.
*   **[`apps/mobile`](apps/mobile/)**: Ứng dụng di động (iOS / Android) bằng **Flutter**, phục vụ ghi chép sổ tay cuộn phim ngoài hiện trường (Offline-First) và chụp tải dải phim âm bản đối chứng.

---

## 📚 Tài liệu Đặc tả AI-First (SSOT)

Dự án áp dụng phương pháp **AI-First Specification** làm nguồn chân lý duy nhất (Single Source of Truth). Mọi tác vụ lập trình (của con người hoặc AI Assistant) bắt buộc phải đối chiếu theo hệ thống tài liệu trong thư mục [`docs/`](docs/):

### Tài liệu Tổng thể (Master SRS)
*   📖 **[Master SRS Specification](docs/srs.md)**: Đặc tả toàn diện hệ thống, 43 Use Cases cốt lõi, sơ đồ kiến trúc Mermaid, ma trận phân quyền màn hình, 25 Business Rules (`BR-01` $\to$ `BR-25`), 7 Common Rules và 28 Mã thông báo chuẩn.

### Danh mục Module Specifications

| Module | Tệp đặc tả | Phạm vi nghiệp vụ cốt lõi |
| :---: | :--- | :--- |
| **01** | [`docs/01-auth-and-rbac.md`](docs/01-auth-and-rbac.md) | Xác thực JWT, Refresh Token Rotation, Ma trận phân quyền RBAC, Chống brute-force |
| **02** | [`docs/02-analog-master-data.md`](docs/02-analog-master-data.md) | Danh mục Phim (Film Stocks), Máy ảnh, Ống kính, Phòng Lab tráng/quét phim |
| **03** | [`docs/03-contest-lifecycle.md`](docs/03-contest-lifecycle.md) | Vòng đời cuộc thi, Hạng mục, Chuẩn hóa trọng số 100% (BR-15), Lịch trình tuần tự (BR-08) |
| **04** | [`docs/04-film-logbook.md`](docs/04-film-logbook.md) | Sổ tay cuộn phim, Khung hình, Giới hạn vật lý khổ phim (BR-04, BR-23), Push/Pull ISO |
| **05** | [`docs/05-submission-and-proof.md`](docs/05-submission-and-proof.md) | Nộp bài thi, Chống trùng lặp (BR-05), Đồng hồ 48h nộp âm bản (BR-19), Chuẩn ảnh (BR-07) |
| **06** | [`docs/06-ai-verification.md`](docs/06-ai-verification.md) | Giám định AI ($P_{AI} \ge 75\%$), Trùng lặp pHash 64-bit, Vector CLIP, Redis Worker Queue |
| **07** | [`docs/07-blind-judging.md`](docs/07-blind-judging.md) | Chấm thi ẩn danh kép (BR-12), Giám khảo độc lập (BR-13), Lệch điểm > 30% (BR-14) |
| **08** | [`docs/08-archive-and-exhibition.md`](docs/08-archive-and-exhibition.md) | Tính bất biến kết quả (BR-16), Lưu trữ 2 vùng Private/Public Watermark (BR-17) |
| **09** | [`docs/09-api-contracts.md`](docs/09-api-contracts.md) | Chuẩn hóa DTO, Response Envelopes và hợp đồng API dùng chung đa nền tảng |
| **10** | [`docs/10-database-and-storage.md`](docs/10-database-and-storage.md) | DDL PostgreSQL 16+, Extension `pgvector`, Bảng `digital_assets`, Cloud Storage S3/R2 |

*   **API Testing**: [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.0) & [`docs/film-contest.postman_collection.json`](docs/film-contest.postman_collection.json) (Postman Collection tự động hóa lưu Token).

---

## 🛠️ Yêu cầu Môi trường (Prerequisites)

- **Bun**: `>= 1.1.0` (Cài đặt: `curl -fsSL https://bun.sh/install | bash`)
- **Node.js**: `>= 20.0.0` (Hỗ trợ tương thích công cụ tooling)
- **PostgreSQL**: `>= 16.0` (Kèm extension `uuid-ossp` và `vector`)
- **Flutter SDK**: `>= 3.19.0` (Nếu phát triển ứng dụng di động)

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

### 3. Khởi tạo Cơ sở Dữ liệu
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
| `bun run format` | Định dạng code bằng Prettier / Biome (`turbo run format`) |
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

Dự án đã tích hợp các bộ quy tắc tự động bắt buộc tất cả AI Assistant (Cursor, GitHub Copilot, Claude Code, Devin...) phải đọc tài liệu đặc tả trước khi code:
*   **[`AGENTS.md`](AGENTS.md)**: Hướng dẫn cốt lõi cho các Agent tự hành.
*   **[`.cursorrules`](.cursorrules)** & **[`.cursor/rules/srs-context.mdc`](.cursor/rules/srs-context.mdc)**: Ép buộc Cursor AI nạp context từ `docs/srs.md`.
*   **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)**: Chỉ dẫn chuẩn hóa cho GitHub Copilot.
*   **[`CLAUDE.md`](CLAUDE.md)**: Chỉ dẫn cho Claude Code CLI.
