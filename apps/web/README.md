# 🌐 Film Contest - Web Application

Ứng dụng Frontend cho dự án Film Contest, được xây dựng bằng **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4** và **Biome**.

---

## 📌 Công nghệ sử dụng

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router với Turbopack)
- **UI Library**: [React 19](https://react.dev/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Linter & Formatter**: [Biome](https://biomejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **HTTP Client**: Axios với Interceptor xử lý tự động refresh token

---

## 🚀 Hướng dẫn khởi chạy

> [!IMPORTANT]
> Dự án sử dụng **Bun** làm package manager. **Không** dùng `npm`, `yarn`, hoặc `pnpm`.

### 1. Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục `apps/web/` dựa trên `.env.example`:

```bash
cp .env.example .env.local
```

Nội dung cấu hình mẫu:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
API_INTERNAL_URL=http://localhost:8080
```

### 2. Cài đặt dependencies (từ thư mục gốc repo)

```bash
bun install
```

### 3. Chạy môi trường phát triển (Development)

Chạy riêng service Web:

```bash
# Từ thư mục gốc monorepo:
bun --filter web dev
```

Ứng dụng chạy tại: [http://localhost:3000](http://localhost:3000)

---

## 📜 Các lệnh khả dụng

| Lệnh                           | Ý nghĩa                                         |
| :----------------------------- | :---------------------------------------------- |
| `bun --filter web dev`         | Chạy Next.js dev server                         |
| `bun --filter web build`       | Build ứng dụng cho môi trường production        |
| `bun --filter web start`       | Chạy production server sau khi đã build         |
| `bun --filter web lint`        | Kiểm tra lỗi code bằng Biome (`biome check`)    |
| `bun --filter web format`      | Tự động format code bằng Biome (`biome format`) |
| `bun --filter web test`        | Chạy unit tests bằng Bun test runner            |
| `bun --filter web check-types` | Kiểm tra lỗi kiểu TypeScript (`tsc --noEmit`)   |

---

## 📁 Cấu trúc thư mục

```text
apps/web/
├── src/
│   ├── app/                      # Next.js App Router pages & layouts
│   │   ├── (auth)/               # Các trang đăng nhập/đăng ký
│   │   │   ├── judge/login/      # Đăng nhập dành cho Giám khảo
│   │   │   ├── login/            # Đăng nhập chung
│   │   │   └── register/         # Đăng ký tài khoản
│   │   ├── portal/               # Khu vực quản trị / ban giám khảo (Guard route)
│   │   │   ├── contests/         # Quản lý cuộc thi
│   │   │   └── reports/          # Báo cáo thống kê
│   │   ├── forbidden/            # Trang 403 Forbidden
│   │   ├── globals.css           # Cấu hình styles toàn cục (Tailwind v4)
│   │   └── page.tsx              # Trang chủ Landing page
│   ├── components/               # UI components dùng chung (shadcn / radix)
│   └── lib/                      # Tiện ích, HTTP client, Auth guards
├── biome.json                    # Cấu hình Biome
├── next.config.ts                # Cấu hình Next.js
├── package.json
└── tsconfig.json
```
