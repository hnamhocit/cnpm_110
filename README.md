# 🎬 Film Contest Monorepo

Dự án **Film Contest** là một monorepo chứa toàn bộ mã nguồn của hệ thống: từ Backend API, Web Frontend đến ứng dụng Mobile (Flutter). Dự án được quản lý bằng **[Turborepo](https://turbo.build/)** và sử dụng **[Bun](https://bun.sh/)** làm package manager & runtime chính.

---

## 📌 Mục lục

- [Cấu trúc Monorepo](#-cấu-trúc-monorepo)
- [Yêu cầu hệ thống (Prerequisites)](#-yêu-cầu-hệ-thống-prerequisites)
- [⚠️ Lưu ý quan trọng: Dùng `bun`, KHÔNG dùng `npm`!](#️-lưu-ý-quan-trọng-dùng-bun-không-dùng-npm)
- [Hướng dẫn cài đặt nhanh (Quick Start)](#-hướng-dẫn-cài-đặt-nhanh-quick-start)
- [Khởi chạy dự án (Development)](#-khởi-chạy-dự-án-development)
  - [1. Chạy song song cả Web và API (Khuyên dùng)](#1-chạy-song-song-cả-web-và-api-khuyên-dùng)
  - [2. Chạy riêng từng service](#2-chạy-riêng-từng-service)
  - [3. Chạy ứng dụng Mobile (Flutter)](#3-chạy-ứng-dụng-mobile-flutter)
- [Các lệnh thường dùng (Scripts)](#-các-lệnh-thường-dùng-scripts)
- [Cách cài thêm thư viện (Add Dependencies)](#-cách-cài-thêm-thư-viện-add-dependencies)
- [Xử lý lỗi thường gặp (Troubleshooting)](#-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 📁 Cấu trúc Monorepo

Hệ thống được tổ chức theo mô hình **Monorepo** với 2 thư mục cốt lõi là `apps/` (các ứng dụng) và `packages/` (cấu hình/thư viện dùng chung):

```text
film-contest/
├── apps/
│   ├── api/               # Backend API xây dựng bằng Hono trên Bun runtime (Port: 8080)
│   ├── web/               # Frontend Web xây dựng bằng Next.js 16 + React 19 + Tailwind v4 (Port: 3000)
│   └── mobile/            # Ứng dụng di động đa nền tảng viết bằng Flutter
│
├── packages/
│   ├── typescript-config/ # Cấu hình TypeScript dùng chung (@repo/typescript-config)
│   └── eslint-config/     # Cấu hình ESLint & Linting rules dùng chung (@repo/eslint-config)
│
├── bun.lock               # Lockfile chuẩn của Bun (KHÔNG xoá hoặc dùng npm đè lên)
├── package.json           # Khai báo workspace root và scripts điều phối Turborepo
├── turbo.json             # Cấu hình pipeline Turborepo (build, dev, lint, cache...)
└── README.md
```

### Chi tiết các app:

- **`apps/api`**: RESTful API service siêu nhanh sử dụng **Hono** chạy native trên **Bun** runtime.
- **`apps/web`**: Web app người dùng sử dụng **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4** và **Biome**.
- **`apps/mobile`**: Ứng dụng mobile cross-platform (Android, iOS) viết bằng **Flutter**.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

1. **Bun** (>= 1.2, khuyên dùng **1.4.2** trở lên):
   - Cài đặt trên Linux / macOS:
     ```bash
     curl -fsSL https://bun.sh/install | bash
     ```
   - Cài đặt trên Windows (PowerShell):
     ```powershell
     powershell -c "irm bun.sh/install.ps1 | iex"
     ```
   - Kiểm tra phiên bản:
     ```bash
     bun --version
     ```
2. **Node.js** (>= 24):
   - Đảm bảo môi trường hỗ trợ Node.js phiên bản 24 trở lên (`node -v`).
3. **Flutter SDK** _(nếu bạn làm việc với `apps/mobile`)_:
   - Tải và cài đặt Flutter từ [flutter.dev](https://docs.flutter.dev/get-started/install).
   - Kiểm tra bằng lệnh: `flutter doctor`.

---

## ⚠️ Lưu ý quan trọng: Dùng `bun`, KHÔNG dùng `npm`!

> [!WARNING]
> **TUYỆT ĐỐI KHÔNG CHẠY `npm install`, `yarn`, HOẶC `pnpm`!**
>
> **Lý do:**
>
> 1. Dự án sử dụng file khoá `bun.lock`. Nếu chạy `npm install`, npm sẽ tạo file `package-lock.json` gây xung đột dependency và sai lệch phiên bản thư viện.
> 2. `apps/api` chạy trực tiếp trên môi trường **Bun runtime** với các thư viện đặc thù của Bun.
> 3. Cấu hình Workspace monorepo đã được tối ưu cho Bun & Turborepo.

👉 **Quy tắc vàng:** Luôn dùng lệnh **`bun ...`** thay cho `npm ...` trong mọi thao tác cài đặt package và chạy script.

---

## 🚀 Hướng dẫn cài đặt nhanh (Quick Start)

### Bước 1: Clone source code

```bash
git clone <url-repo-film-contest>
cd film-contest
```

### Bước 2: Cài đặt toàn bộ dependencies

Chỉ cần chạy **1 lệnh duy nhất** ở thư mục gốc:

```bash
bun install
```

> Lệnh này sẽ tự động liên kết các workspace (`apps/web`, `apps/api`, `packages/*`) và cài đặt tất cả dependencies cần thiết trong vài giây nhờ tốc độ của Bun.

---

## 💻 Khởi chạy dự án (Development)

### 1. Chạy song song cả Web và API (Khuyên dùng)

Ở thư mục gốc của dự án, chạy:

```bash
bun dev
```

Turborepo sẽ khởi động đồng thời cả 2 dịch vụ:

- 🌐 **Web**: [http://localhost:3000](http://localhost:3000)
- 🚀 **API**: [http://localhost:8080](http://localhost:8080)

Terminal sẽ hiển thị giao diện TUI của Turborepo giúp bạn dễ dàng theo dõi log của từng dịch vụ.

---

### 2. Chạy riêng từng service

Nếu bạn chỉ cần tập trung làm việc trên một service cụ thể:

#### Chỉ chạy Web (`apps/web`):

```bash
# Cách 1: Sử dụng filter từ thư mục gốc
bun --filter web dev

# Cách 2: Di chuyển vào thư mục apps/web
cd apps/web
bun dev
```

Truy cập: [http://localhost:3000](http://localhost:3000).

#### Chỉ chạy API (`apps/api`):

```bash
# Cách 1: Sử dụng filter từ thư mục gốc
bun --filter api dev

# Cách 2: Di chuyển vào thư mục apps/api
cd apps/api
bun dev
```

API endpoint mặc định: [http://localhost:8080](http://localhost:8080).

---

### 3. Chạy ứng dụng Mobile (Flutter)

Do `apps/mobile` là dự án Flutter, bạn quản lý bằng Flutter CLI:

```bash
# 1. Di chuyển vào thư mục mobile
cd apps/mobile

# 2. Tải dependencies Flutter
flutter pub get

# 3. Chạy ứng dụng (trên emulator, web hoặc thiết bị thật)
flutter run
```

---

## 📜 Các lệnh thường dùng (Scripts)

Các lệnh này thực thi tại thư mục gốc:

| Lệnh                  | Ý nghĩa                                                  |
| :-------------------- | :------------------------------------------------------- |
| `bun dev`             | Chạy dev server cho toàn bộ các workspace trong monorepo |
| `bun run build`       | Build tất cả workspace (`turbo run build`)               |
| `bun run lint`        | Chạy kiểm tra linting (`turbo run lint`)                 |
| `bun run format`      | Định dạng lại code bằng Prettier (`.ts`, `.tsx`, `.md`)  |
| `bun run check-types` | Kiểm tra type check TypeScript trên toàn bộ monorepo     |

---

## 📦 Cách cài thêm thư viện (Add Dependencies)

Trong mô hình Monorepo, hãy chú ý chọn đúng workspace mà bạn muốn cài đặt package:

### 1. Thêm package cho một app cụ thể:

- **Thêm vào Web (`apps/web`):**
  ```bash
  bun --filter web add <ten-package>
  # hoặc devDependencies:
  bun --filter web add -d <ten-package>
  ```
- **Thêm vào API (`apps/api`):**
  ```bash
  bun --filter api add <ten-package>
  # hoặc devDependencies:
  bun --filter api add -d <ten-package>
  ```
- **Thêm vào Mobile (`apps/mobile`):**
  ```bash
  cd apps/mobile && flutter pub add <ten-package>
  ```

### 2. Thêm package dùng chung cho Root (công cụ build, tooling toàn repo):

```bash
bun add -d <ten-package>
```

---

## ❓ Xử lý lỗi thường gặp (Troubleshooting)

1. **Lỗi `command not found: bun`:**
   - Bạn chưa cài Bun hoặc chưa thêm Bun vào biến môi trường PATH.
   - Cài lại Bun theo hướng dẫn ở phần Prerequisites và khởi động lại terminal hoặc chạy `source ~/.bashrc` (hoặc `~/.zshrc`).

2. **Lỗi `node_modules` hoặc xung đột sau khi vô tình chạy `npm install`:**
   - Xoá file `package-lock.json` nếu có:
     ```bash
     rm -f package-lock.json apps/*/package-lock.json
     ```
   - Xoá `node_modules` và cài đặt lại sạch sẽ bằng Bun:
     ```bash
     rm -rf node_modules apps/*/node_modules
     bun install
     ```

3. **Port 3000 hoặc 8080 đã bị chiếm dụng:**
   - Kiểm tra tiến trình đang chạy cổng đó:
     ```bash
     lsof -i :3000
     lsof -i :8080
     ```
   - Kill tiến trình cũ hoặc đổi port cấu hình.

4. **Lỗi Flutter không nhận thiết bị hoặc thiếu SDK:**
   - Chạy `flutter doctor` để kiểm tra chi tiết các thành phần còn thiếu (Android SDK, Chrome, Linux toolchain,...).
   - Chạy `flutter devices` để xem danh sách thiết bị có sẵn.

---

✨ **Chúc bạn có trải nghiệm phát triển mượt mà với Film Contest Monorepo!**
