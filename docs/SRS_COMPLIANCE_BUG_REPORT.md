# Báo Cáo Tổng Hợp Lỗi, Vi Phạm Hợp Đồng API & Dữ Liệu Giả Lập Vi Phạm SRS
*(Master Bug Report: API Contract Non-Compliance, Mock Data Masking & SRS Violations)*

> **Nguyên tắc kim chỉ nam (Single Source of Truth - SSOT)**:  
> Bộ đặc tả tài liệu trong thư mục `docs/` (Đặc tả tổng thể [`docs/srs.md`](srs.md) và Hợp đồng API chuẩn hóa [`docs/09-api-contracts.md`](09-api-contracts.md), các module từ `01` đến `10`) là **chuẩn mực duy nhất và cao nhất**. Mã nguồn Backend hiện tại không phải là khuôn mẫu chuẩn; mọi sai lệch giữa Backend, Web, Mobile so với hợp đồng tài liệu đều bị xác định là lỗi vi phạm.
>
> **Quy tắc phân bổ trách nhiệm đặc biệt**:
> - Mọi lỗi do **Hoài Bảo** (`BAO TU`) tạo ra $\to$ Chuyển giao trách nhiệm xử lý cho **Dương Nguyễn** (`syduong009`).
> - Mọi lỗi do **Dương Nguyễn** (`syduong009`) tạo ra $\to$ Chuyển giao trách nhiệm xử lý cho **hnamhocit** (`Hoang Nam`).
> - Các tác giả còn lại (**Hải Bình**, **Trương Vĩ**, **Thành Nhân**, **Huỳnh Bảo**) giữ nguyên trách nhiệm của mình.

---

## 📑 Mục lục
1. [Phần 1: Vi Phạm Hợp Đồng API Chuẩn Hóa (API Contract Non-Compliance)](#-phần-1-vi-phạm-hợp-đồng-api-chuẩn-hóa)
2. [Phần 2: Giả Lập Dữ Liệu Mẫu & Nuốt Lỗi Che Giấu Lỗi Kỹ Thuật (Mock Data & Fake Implementations)](#-phần-2-giả-lập-dữ-liệu-mẫu--nuốt-lỗi-che-giấu-lỗi-kỹ-thuật)
3. [Phần 3: Lỗi Kỹ Thuật Fatal, Thiếu Thư Viện & Crash Biên Dịch (Compile & Dependency Errors)](#-phần-3-lỗi-kỹ-thuật-fatal-thiếu-thư-viện--crash-biên-dịch)
4. [Phần 4: Vi Phạm Quy Tắc Nghiệp Vụ Đặc Tả Cốt Lõi (Core Domain & Business Rules Violations)](#-phần-4-vi-phạm-quy-tắc-nghiệp-vụ-đặc-tả-cốt-lõi)
5. [Phần 5: Bảng Tổng Hợp Phân Bổ Trách Nhiệm Xử Lý (Task Assignment Matrix)](#-phần-5-bảng-tổng-hợp-phân-bổ-trách-nhiệm-xử-lý)

---

## 🌐 Phần 1: Vi Phạm Hợp Đồng API Chuẩn Hóa

Theo [`docs/09-api-contracts.md`](09-api-contracts.md) (Mục 2.1, 4.1), [`docs/01-auth-and-rbac.md`](01-auth-and-rbac.md) (Dòng 304, 329, 384, 445) và [`docs/03-contest-lifecycle.md`](03-contest-lifecycle.md):
1. **Chuẩn Tiền Tố (Prefix)**: Mọi endpoint dịch vụ bắt buộc tuân theo tiền tố `/api/v1/...` (Base URL: `http://localhost:8080/api/v1`).
2. **Chuẩn Đóng Gói Envelope**: Tất cả phản hồi thành công bắt buộc bọc trong cấu trúc chuẩn: `{ "code": 200, "message": "...", "data": { ... } }`. Phản hồi lỗi: `{ "code": 4xx/5xx, "message": "...", "data": null }`.

Việc Backend tự ý phá vỡ hợp đồng (mount ở root `/auth`, `/contests` và trả JSON trực tiếp không bọc `data`) là nguyên nhân gốc rễ gây crash runtime và 404 cho các ứng dụng client:

| STT | Vị trí vi phạm | Hiện trạng Mã nguồn | Hợp đồng API Chuẩn mực (`docs/`) | Phân tích Sai phạm & Tác động | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | `apps/api/src/index.ts` (dòng 24-27) | `app.route("/auth", auth);`<br>`app.route("/contests", contests);` | Phải mount thống nhất tại:<br>`/api/v1/auth`<br>`/api/v1/contests`<br>`/api/v1/submissions` | **Backend vi phạm Hợp đồng Định tuyến**: Backend gắn trực tiếp `/auth` và `/contests` tại root, chỉ có `/api/v1/submissions` là có prefix. Gây phân mảnh toàn bộ cấu hình `baseURL` của Web và Mobile. | `9f2d4b5`<br>`27505bc` | `syduong009` & `binhhd796108-star` | ➡️ Phần `syduong009` chuyển **hnamhocit**; Phần `binhhd796108-star` giữ **Hải Bình** |
| **02** | `apps/api/src/routes/auth.ts` (dòng 250-259) | Trả về root object:<br>`{ message, user, accessToken, refreshToken }` | Hợp đồng chuẩn envelope:<br>`{ code: 200, message: "...", data: { user, accessToken, refreshToken } }` | **Backend vi phạm Chuẩn Envelope Response**: Trả dữ liệu phẳng không có wrapper `data`. Khi Web (`login-form.tsx`) tuân thủ hợp đồng đọc `res.data.data` thì bị nhận `undefined` $\to$ crash `TypeError: Cannot read properties of undefined (reading 'accessToken')`. | `9f2d4b5` / `27505bc` | `syduong009` & `binhhd796108-star` | ➡️ Phần `syduong009` chuyển **hnamhocit**; Phần `binhhd796108-star` giữ **Hải Bình** |
| **03** | `apps/api/src/routes/contests.ts` (dòng 95-103) | Trả về định dạng tự chế:<br>`{ data: rows, pagination: { ... } }`<br>Lỗi trả: `{ error: "..." }` | Hợp đồng chuẩn envelope:<br>`{ code: 200, message: "...", data: { items: [], page, totalPages, total } }`<br>Lỗi: `{ code, message, data: null }` | **Backend vi phạm Chuẩn Pagination & Error DTO**: Không bọc mã code HTTP vào body, không chuẩn hóa cấu trúc phân trang theo mục 4.5.2 `docs/09-api-contracts.md`. | `9f2d4b5` / `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **04** | `apps/api/src/routes/contests.ts` (`POST /contests`) | Payload chỉ nhận 5 trường:<br>`name, description, startAt, endAt, status` | Hợp đồng DTO `CreateContestRequestDto` yêu cầu đủ lịch trình 4 mốc thời gian (**BR-08**) & `maxEntriesPerUser` | **Backend bỏ rơi Hợp đồng Lịch trình**: Backend chỉ kiểm tra `startAt < endAt`, không hề cài đặt 4 mốc thời gian tuần tự theo đặc tả Module 03 và Hợp đồng API. | `9f2d4b5` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **05** | `apps/mobile/lib/core/data/contest_repository.dart` & `auth_provider.dart` | Mobile gọi API root:<br>`_dio.get('/contests')`<br>`_dio.post('/auth/login')`<br>`_dio.post('/auth/register')` | Hợp đồng API chuẩn bắt buộc gọi qua tiền tố versioning:<br>`/api/v1/contests`<br>`/api/v1/auth/login`<br>`/api/v1/auth/register` | **Mobile vi phạm Hợp đồng Tiền tố API**: Tự ý gọi thẳng vào root của Backend thay vì tuân theo hợp đồng chuẩn `/api/v1/`, tạo ra sự bất đồng bộ giữa Mobile và Web. | `f9e3b85`<br>`ca22a0f`<br>`69a8c22` | `syduong009` & `BAO TU` | ➡️ Của `BAO TU` chuyển **Dương Nguyễn**; Của `syduong009` chuyển **hnamhocit** |
| **06** | `apps/web/src/app/portal/contests/create/page.tsx` (dòng 63) | Web gửi payload tự phát:<br>`title, submissionStart, submissionEnd, bannerUrl` | Hợp đồng DTO quy định:<br>`name, description, registrationStart, registrationEnd, submissionStart, submissionEnd, judgingStart, judgingEnd, resultsAnnounced` | **Web vi phạm Hợp đồng DTO Tạo Cuộc Thi**: Đặt sai tên trường cốt lõi (`title` thay vì `name`), thiếu các trường mốc thời gian theo hợp đồng. | `63d77b3` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **07** | `apps/web/src/app/portal/contests/page.tsx` (dòng 9-16) | Đọc các trường không có trong hợp đồng:<br>`title, startDate, endDate, participantsCount` | DTO quy định trường chuẩn:<br>`name, startAt, endAt, status, id` | **Web lệch DTO Danh Sách Cuộc Thi**: Đọc sai tên trường khiến toàn bộ bảng cuộc thi tại Portal bị rỗng dù API có trả về dữ liệu. | `ac62eaf` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |

---

## 🎭 Phần 2: Giả Lập Dữ Liệu Mẫu & Nuốt Lỗi Che Giấu Lỗi Kỹ Thuật

Nhiều màn hình và tính năng cốt lõi không kết nối hệ thống mà ngụy trang bằng 100% dữ liệu tĩnh, nuốt ngoại lệ mạng, hoặc bật alert/snackbar giả lập:

| STT | File / Vị trí | Mô tả Chi tiết Hành vi Giả Lập / Nuốt Lỗi | Hậu quả Kiểm thử & Trải nghiệm | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **08** | `apps/web/src/app/contests/[id]/page.tsx` & `mock-contest-details.ts` | **100% Mock Data, Hoàn Toàn Không Tích Hợp API**: Toàn bộ trang chi tiết cuộc thi đọc từ mảng giả lập 325 dòng `DETAILED_CONTESTS`. Nếu nhập ID bất kỳ, code tự clone từ `contest-1`: `{ ...DETAILED_CONTESTS["contest-1"], id, name: "Cuộc thi Nhiếp ảnh Phim #" + id }`. | Che mắt ban dự án tưởng chức năng đã xong; thực chất không có bất kỳ lệnh gọi API nào đến máy chủ. | `5ac64b0` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **09** | `apps/web/src/components/home/ongoing-contests.tsx` (dòng 116-118) | **Nuốt Ngoại Lệ Mạng (Silent Fail) & Đắp Mock Data**: Gọi `${apiUrl}/contests` nhưng bọc trong `catch {}` rỗng. Khi API lỗi hoặc chưa bật, code tự động nuốt lỗi và hiển thị `FALLBACK_CONTESTS` kèm chú thích: `"Backend chưa bật hoặc có lỗi mạng -> Giữ nguyên dữ liệu mẫu để giao diện hoạt động tốt"`. | Đánh lừa quy trình kiểm thử; API sập hay sống thì giao diện vẫn luôn hiện bình thường. | `8fc1cf6` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **10** | `apps/web/src/app/portal/contests/criteria/page.tsx` (dòng 82-85) | **Bỏ Trống API & Giả Lập Bằng Alert**: Nút "Lưu cấu hình tiêu chí" comment dòng gọi API (`// await http.post(...)`) và chỉ bật popup `alert("Lưu cấu hình tiêu chí thành công!")`. Thực chất Backend chưa hề có API tiêu chí và không có dữ liệu nào được lưu vào CSDL. | Đánh lừa người dùng đã lưu trọng số nhưng CSDL thực tế bị bỏ trống. | `730b1ef` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **11** | `apps/web/src/components/auth/judge-login-form.tsx` (dòng 54) | **Giao Diện Ảo, Không Mật Khẩu, Không API**: Form đăng nhập của Giám khảo không hề có ô nhập password, không gọi Backend API và chỉ set text thông báo: `"Login API is not connected yet."`. | Giám khảo hoàn toàn không có cách nào đăng nhập vào hệ thống. | `c54bf23` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **12** | `apps/web/src/components/auth/login-form.tsx` & `portal/template.tsx` | **Xung Đột Nơi Lưu Token Gây Vòng Lặp Vô Tận (Redirect Loop)**: `login-form.tsx` lưu token vào Zustand client in-memory và tự phong quyền: `role: data.user?.role \|\| "Organizer"`. Ngược lại, `portal/template.tsx` (`AuthGuard`) chạy trên Server Component lại đọc từ `cookieStore.get("access_token")`. Vì cookie không được set, người dùng vừa đăng nhập vào `/portal` lập tức bị đá văng về `/login`. | Người dùng bị kẹt trong vòng lặp đăng nhập vô hạn, không thể vào Portal. | `2b25da0`<br>`0ae5511` | `Nguyen Truong Vi` & `XDamDaddyX` | **Trương Vĩ** & **Thành Nhân** |
| **13** | `apps/mobile/lib/screens/contest/contest_detail_screen.dart` (dòng 96-100) | **Nút Đăng Ký Ảo (Fake SnackBar)**: Khi nhấn nút "Đăng ký tham gia", ứng dụng không gọi bất kỳ API đăng ký nào mà chỉ bắn một SnackBar: `"Chức năng đăng ký sẽ được hoàn thiện ở FPC-42"`. | Thí sinh không thể thực hiện đăng ký cuộc thi trên Mobile. | `70358e4` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **14** | `apps/mobile/lib/screens/submission/submission_upload_screen.dart` (dòng 182-183) | **Hardcode Fallback UUID Giả & Metadata Mặc Định**: Gán UUID rác `'00000000-0000-0000-0000-000000000001'` khi `contestId` hoặc `categoryId` null, dẫn tới lỗi Foreign Key Constraint 500 trên CSDL. Đồng thời tự gán metadata mặc định (`Kodak`, `Portra 400`, `35mm`) che giấu việc thiếu dữ liệu thực từ thí sinh. | Gây sập API Backend khi submit và sai lệch hồ sơ bài thi quang học. | `55e4e51` | **Huỳnh Bảo** (`huynhbao1710`) | **Huỳnh Bảo** (`huynhbao1710`) |
| **15** | `apps/mobile/lib/screens/profile_screen.dart` (dòng 18-21) | **Menu Tính Năng Bản Demo**: 4 mục tính năng quan trọng (Cập nhật thông tin, Đổi mật khẩu, Cài đặt ứng dụng, Trợ giúp) chỉ bật SnackBar thông báo `"(bản demo)"`, không có code nghiệp vụ. | Người dùng không thể cập nhật thông tin cá nhân hay đổi mật khẩu. | `fea0569` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **16** | `apps/mobile/lib/router/app_router.dart` (dòng 32 & 50) | **Trùng Lặp Route & Bỏ Quên Màn Hình Nộp Bài**: Route `path: '/contests/:id'` bị khai báo 2 lần liên tiếp. Hai màn hình quan trọng là `SubmissionUploadScreen` và `FilmDevScanScreen` đã code xong nhưng **hoàn toàn không được khai báo vào router**, khiến luồng nộp bài trên Mobile không thể truy cập. | Không có cách nào truy cập vào màn hình nộp bài thi ảnh trên Mobile. | `70358e4`<br>`166fb6d` | `BAO TU` & `huynhbao1710` | ➡️ Phần `BAO TU` chuyển **Dương Nguyễn**; Phần `huynhbao1710` giữ **Huỳnh Bảo** |
| **17** | `apps/web/src/app/portal/page.tsx` & `reports/page.tsx` | **Trang Dashboard & Báo Cáo Rỗng**: Cả 2 trang chỉ có các thẻ tiêu đề văn bản tĩnh (`"Dashboard"`, `"Reports overview is coming soon"`), không có thống kê cuộc thi, số lượng thí sinh, bài thi hay biểu đồ theo SCR-ORG-01. | Organizer không có số liệu để quản lý cuộc thi. | `ef0fa5d` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |

---

## 💥 Phần 3: Lỗi Kỹ Thuật Fatal, Thiếu Thư Viện & Crash Biên Dịch

Các lỗi cú pháp và thiếu khai báo dependencies trong `package.json` khiến câu lệnh `check-types`, `bun test`, và `flutter analyze` thất bại hoàn toàn:

| STT | File / Vị trí lỗi | Mô tả Lỗi Kỹ Thuật / Thiếu Thư viện | Triệu chứng & Mã lỗi | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **18** | `apps/mobile/lib/screens/contest/contest_card.dart` | **Sử dụng biến chưa khai báo (Undefined Variables)**: Gọi các biến `background`, `foreground`, `description`, `scheme`, `_dateRange` sau khi refactor dở dang khiến `flutter analyze` báo 10 lỗi fatal, crash build. | `error: Undefined name 'background'` / `foreground` / `description` / `scheme` / `_dateRange` | `ca22a0f`<br>`70358e4` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **19** | `apps/api/src/r2.ts` (dòng 3) | **Thiếu Thư Viện (Missing Dependency)**: Gọi `import { Upload } from "@aws-sdk/lib-storage"` nhưng gói `@aws-sdk/lib-storage` **chưa hề được khai báo trong `apps/api/package.json`**. | `error TS2307: Cannot find module '@aws-sdk/lib-storage'` | `27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **20** | `apps/api/src/utils/validate-image.ts` & `tests/validate-image.test.ts` | **Thiếu Thư Viện (Missing Dependency)**: Gọi `import sharp from "sharp"` nhưng `sharp` và `@types/sharp` **chưa hề được cài đặt trong `apps/api/package.json`**, làm crash `check-types` và bộ kiểm thử `bun test`. | `error TS2307: Cannot find module 'sharp'` / `Cannot find package 'sharp'` | `b7609c5` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **21** | `apps/web/src/app/portal/template.tsx` (dòng 11) | **Sai Kiểu Trả Về Component (Invalid JSX Element)**: Hàm `AuthGuard` là hàm `async` trả về kiểu `Promise<void>` thay vì `ReactNode`, khiến TypeScript checker của Web bị crash. | `error TS2786: 'AuthGuard' cannot be used as a JSX component. Type 'Promise<void>' is not assignable to type 'ReactNode'` | `0ae5511`<br>`d0c441e` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **22** | `apps/api/src/index.ts` (dòng 98 & 108) | **Khai báo Trùng Endpoint**: Khai báo lặp lại 2 lần liên tiếp route `app.get("/rbac/manage-contest", ...)` ở dòng 98 và dòng 108. | Cú pháp trùng lặp, vi phạm Clean Code. | `4c08388` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |

---

## ⚖️ Phần 4: Vi Phạm Quy Tắc Nghiệp Vụ Đặc Tả Cốt Lõi

Các vi phạm trực tiếp các điều khoản bất khả xâm phạm trong Master SRS ([`docs/srs.md`](srs.md)):

| STT | File / Vị trí | Mô tả Vi phạm Nghiệp vụ | Quy tắc SRS Vi phạm | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **23** | `apps/api/src/routes/contests.ts` (dòng 380) | **Xóa Cứng CSDL (Hard Delete)**: Trong `DELETE /contests/:id`, thực hiện SQL `DELETE FROM contests WHERE id = $1` xóa vật lý bản ghi thay vì soft delete. | **BR-03** (Soft Delete Only - Tuyệt đối không xóa vật lý) | `9f2d4b5` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **24** | `apps/api/src/routes/contests.ts` | **Sai Lịch trình & Sai State Machine**: Khai báo enum trạng thái sai lệch: `VALID_STATUSES = ["draft", "published", "ongoing", "completed", "cancelled"]` (5 trạng thái tự chế) thay vì 6 trạng thái chuẩn. Bỏ qua 4 mốc thời gian tuần tự. | **BR-08** (Lịch trình tuần tự $T_{reg} < T_{sub} < T_{judge\_start} < T_{judge\_end} < T_{pub}$) & **Máy trạng thái 6 bước** | `9f2d4b5`<br>`f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **25** | `apps/api/src/routes/contests.ts` | **Vi phạm Tính Bất biến Kết quả**: `PUT /contests/:id` cho phép cập nhật thông tin và sửa thời hạn ngay cả khi cuộc thi đã ở trạng thái công bố kết quả (`published`), không có cơ chế khóa Read-Only. | **BR-16** (Result Immutability - Sau khi Publish, toàn bộ dữ liệu bị khóa vĩnh viễn) | `9f2d4b5` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **26** | `apps/api/src/routes/contests.ts` (dòng 69) | **Lọc ngầm trạng thái**: `GET /contests` nếu không truyền param `status` sẽ tự động lọc `WHERE status IN ('published', 'ongoing')`. Khiến Organizer không thể lấy danh sách các cuộc thi ở trạng thái `draft`, `completed`, `cancelled`. | **CR-05**, **SCR-ORG-01** | `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **27** | `apps/api/src/routes/submissions.ts` | **Sai Tiêu chuẩn Kỹ thuật File Ảnh**: Cấu hình validate cho phép ảnh dung lượng lên tới **100MB** (`maxBytes: 100 * MiB`) và kích thước tối thiểu chỉ **1000px**, vi phạm chuẩn ảnh scan. | **BR-07** (Yêu cầu ảnh scan tối đa **25MB**, cạnh ngắn nhất tối thiểu **2000px**) | `b7609c5`<br>`27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **28** | `apps/api/src/routes/submissions.ts` | **Thiếu Validate Deadline & Chống Trùng**: Không kiểm tra thời hạn đóng cổng nộp bài (`submission_deadline_at`), không kiểm tra trùng lặp cặp frame (`rollId` + `frameNumber`) trong cuộc thi, không kiểm tra giới hạn số bài/hạng mục. | **BR-05** (Chống trùng lặp), **BR-08** (Khóa cổng khi hết hạn), **MSG012**, **MSG014** | `27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **29** | `apps/mobile/lib/screens/film_params/film_params_form.dart` | **Thiếu Ràng buộc Khung hình Vật lý & Trường Bắt buộc**: Validator `_frameNumberController` chỉ check `maxLength(20)`, không kiểm tra giới hạn vật lý theo khổ phim (135 max 39, 120 max 10-16). Đặt số frame là optional trong khi SRS bắt buộc 5 thông số. | **BR-04 / BR-23** (Giới hạn vật lý frame), **BR-22** (5 trường bắt buộc) | `6b9b60f` | **Huỳnh Bảo** (`huynhbao1710`) | **Huỳnh Bảo** (`huynhbao1710`) |
| **30** | `apps/mobile/lib/models/contest.dart` (dòng 1-6) | **Enum Trạng Thái Không Khớp Đặc Tả**: Khai báo enum trạng thái cuộc thi sai lệch: `draft`, `published`, `ongoing`, `completed`, `cancelled` thay vì 6 trạng thái chuẩn theo SRS (`DRAFT`, `PUBLISHED`, `SUBMISSION_OPEN`, `JUDGING`, `SCORING_FINAL`, `ARCHIVED`). | **BR-08**, **Module 03** | `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |

---

## 👥 Phần 5: Bảng Tổng Hợp Phân Bổ Trách Nhiệm Xử Lý

Áp dụng quy tắc chuyển giao:
- 🔁 **Hoài Bảo (`BAO TU`) $\to$ Dương Nguyễn (`syduong009`)**
- 🔁 **Dương Nguyễn (`syduong009`) $\to$ hnamhocit (`Hoang Nam`)**

### 1. hnamhocit (`Hoang Nam`) nhận bàn giao từ Dương Nguyễn (Tổng cộng: 8 hạng mục)
- **Bug 01**: Chuẩn hóa router Backend sang prefix hợp đồng `/api/v1/contests` trong [`apps/api/src/index.ts`](file:///home/hnamhocit/Workspace/fullstack/film-contest/apps/api/src/index.ts).
- **Bug 02 & 03**: Bọc toàn bộ response Backend trong cấu trúc chuẩn Hợp đồng `{ code, message, data }` và chuẩn hóa Pagination DTO.
- **Bug 04**: Bổ sung 4 mốc thời gian tuần tự theo **BR-08** vào DTO tạo cuộc thi của Backend.
- **Bug 05**: Chuẩn hóa các lời gọi API trên Mobile (`contest_repository.dart`, `auth_service.dart`) sang `/api/v1/`.
- **Bug 23**: Sửa endpoint `DELETE /contests/:id` sang Soft Delete (`is_deleted = TRUE`) theo **BR-03**.
- **Bug 24**: Sửa validator ngày thi tuần tự theo **BR-08** và chuẩn hóa 6 trạng thái vòng đời cuộc thi trên Backend.
- **Bug 25**: Bổ sung cơ chế khóa dữ liệu Read-Only sau khi cuộc thi ở trạng thái `PUBLISHED` theo **BR-16**.
- **Bug 26 & 30**: Sửa query lọc trạng thái trong `GET /contests` và cập nhật enum `ContestStatus` trong Mobile model theo đúng 6 trạng thái SRS.

### 2. Dương Nguyễn (`syduong009`) nhận bàn giao từ Hoài Bảo (Tổng cộng: 5 hạng mục)
- **Bug 05**: Sửa các lời gọi API auth trên Mobile (`/api/v1/auth/...`) tuân theo Hợp đồng API.
- **Bug 13**: Thay thế SnackBar thông báo ảo FPC-42 bằng flow gọi API đăng ký tham gia cuộc thi thực tế.
- **Bug 15**: Thay thế SnackBar `(bản demo)` trên màn hình Profile bằng màn hình cập nhật thông tin và đổi mật khẩu.
- **Bug 16**: Xóa bỏ route trùng lặp `/contests/:id` trong `app_router.dart`.
- **Bug 18**: Sửa 10 lỗi fatal undefined variable (`background`, `foreground`, `description`, `scheme`, `_dateRange`) trong `contest_card.dart` để Mobile app biên dịch thành công.

### 3. Trương Vĩ (`Nguyen Truong Vi`) (Tổng cộng: 4 hạng mục)
- **Bug 06**: Điều chỉnh Form tạo cuộc thi Portal gửi đúng tên trường theo Hợp đồng DTO (`name, description, ...`) thay vì trường tự phát (`title, ...`).
- **Bug 07**: Map đúng các trường dữ liệu Hợp đồng (`name, startAt, endAt`) trên bảng danh sách cuộc thi Portal.
- **Bug 10**: Bỏ comment và kích hoạt API lưu cấu hình trọng số tiêu chí chấm điểm thay vì chỉ hiện `alert()`.
- **Bug 12**: Sửa cơ chế lưu token sau đăng nhập để đồng bộ với cơ chế xác thực cookie của Server Component `AuthGuard`.

### 4. Thành Nhân (`XDamDaddyX`) (Tổng cộng: 5 hạng mục)
- **Bug 08**: Xóa bỏ 325 dòng mock data tĩnh trong `DETAILED_CONTESTS` và logic clone `contest-1`, tích hợp API cuộc thi thật theo hợp đồng.
- **Bug 09**: Xóa bỏ cơ chế nuốt lỗi (silent catch) và fallback mock data trong `ongoing-contests.tsx`, hiển thị đúng trạng thái lỗi mạng/API.
- **Bug 11**: Bổ sung trường nhập mật khẩu và kết nối API xác thực cho màn hình đăng nhập giám khảo `judge-login-form.tsx`.
- **Bug 17**: Xây dựng giao diện hiển thị dữ liệu thực tế cho Dashboard và Reports thay vì thẻ text rỗng.
- **Bug 21**: Sửa lỗi TypeScript TS2786 cho `AuthGuard` trong `portal/template.tsx` (trả về `ReactNode` thay vì `Promise<void>`).

### 5. Hải Bình (`binhhd796108-star`) (Tổng cộng: 5 hạng mục)
- **Bug 01 & 22**: Chuẩn hóa tiền tố `/api/v1/` trong `apps/api/src/index.ts` và xóa bỏ route `app.get("/rbac/manage-contest")` bị khai báo trùng 2 lần.
- **Bug 19**: Thêm thư viện `@aws-sdk/lib-storage` vào `apps/api/package.json` để sửa lỗi TS2307 trong `r2.ts`.
- **Bug 20**: Thêm thư viện `sharp` và `@types/sharp` vào `apps/api/package.json` để sửa lỗi TS2307 và chạy được test.
- **Bug 27**: Sửa lại thông số validator ảnh scan trong `validate-image.ts` và `submissions.ts`: tối đa 25MB, cạnh ngắn tối thiểu 2000px theo **BR-07**.
- **Bug 28**: Bổ sung kiểm tra deadline nộp bài và kiểm tra chống trùng cặp roll + frame theo **BR-05** và **BR-08**.

### 6. Huỳnh Bảo (`huynhbao1710`) (Tổng cộng: 3 hạng mục)
- **Bug 14**: Xóa bỏ UUID mặc định `00000000-0000-0000-0000-000000000001` và các giá trị fallback chụp phim trong `submission_upload_screen.dart`, bắt buộc truyền đúng ID cuộc thi/hạng mục từ người dùng.
- **Bug 16**: Đăng ký các route màn hình `SubmissionUploadScreen` và `FilmDevScanScreen` vào `appRouter`.
- **Bug 29**: Thêm ràng buộc kiểm tra số khung hình vật lý theo khổ phim (135 tối đa 39, 120 tối đa 10-16) và bắt buộc nhập số frame theo **BR-04, BR-22, BR-23**.
