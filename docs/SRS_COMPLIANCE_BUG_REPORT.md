# Báo Cáo Tổng Hợp Lỗi, Lệch Đường Dẫn API & Giả Lập Dữ Liệu Vi Phạm SRS
*(SRS Compliance, API Routing Mismatch & Mock Data Masking Bug Report)*

> **Mục đích**: Tổng hợp toàn diện tất cả các lỗi kỹ thuật (lệch endpoint API giữa Web/Mobile và Backend, ngụy trang tính năng bằng mock data / fake behavior, thiếu thư viện, lỗi fatal compile) và các vi phạm quy tắc nghiệp vụ đặc tả (SRS Violations) phát hiện trong toàn bộ codebase dự án.  
>
> **Quy tắc phân bổ trách nhiệm đặc biệt**:
> - Mọi lỗi do **Hoài Bảo** (`BAO TU`) tạo ra $\to$ Chuyển giao trách nhiệm xử lý cho **Dương Nguyễn** (`syduong009`).
> - Mọi lỗi do **Dương Nguyễn** (`syduong009`) tạo ra $\to$ Chuyển giao trách nhiệm xử lý cho **hnamhocit** (`Hoang Nam`).
> - Các tác giả còn lại (**Hải Bình**, **Trương Vĩ**, **Thành Nhân**, **Huỳnh Bảo**) giữ nguyên trách nhiệm của mình.
>
> ⚠️ **Lưu ý**: Báo cáo phục vụ rà soát, đánh giá chất lượng; **tuyệt đối không can thiệp sửa code** trong đợt quét này theo đúng yêu cầu.

---

## 📑 Mục lục
1. [Phần 1: Lỗi Lệch Đường Dẫn API & Xung Đột Định Dạng Routing (Routing Discrepancies)](#-phần-1-lỗi-lệch-đường-dẫn-api--xung-đột-định-dạng-routing)
2. [Phần 2: Giả Lập Dữ Liệu Mẫu & Nuốt Lỗi Che Giấu Lỗi Thực Tế (Mock Data & Fake Implementations)](#-phần-2-giả-lập-dữ-liệu-mẫu--nuốt-lỗi-che-giấu-lỗi-thực-tế)
3. [Phần 3: Lỗi Kỹ Thuật Fatal, Thiếu Thư Viện & Crash Biên Dịch (Compile & Dependency Errors)](#-phần-3-lỗi-kỹ-thuật-fatal-thiếu-thư-viện--crash-biên-dịch)
4. [Phần 4: Vi Phạm Quy Tắc Nghiệp Vụ Đặc Tả Cốt Lõi (Core Domain & Business Rules Violations)](#-phần-4-vi-phạm-quy-tắc-nghiệp-vụ-đặc-tả-cốt-lõi)
5. [Bảng Phân Bổ Trách Nhiệm Xử Lý (Task Assignment Matrix)](#-bảng-phân-bổ-trách-nhiệm-xử-lý)

---

## 🌐 Phần 1: Lỗi Lệch Đường Dẫn API & Xung Đột Định Dạng Routing

Các endpoint trên Web và Mobile đang gọi lệch hoàn toàn so với router Backend mount trên `apps/api/src/index.ts`, khiến tính năng trả về **404 Not Found** hoặc crash ngay khi bấm submit:

| STT | File / Vị trí gọi | URL Frontend đang gọi | URL Backend thực tế lắng nghe | Hậu quả kỹ thuật | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | `apps/web/src/components/auth/login-form.tsx` (dòng 39) | `POST /api/v1/auth/login` | `POST /auth/login` | **404 Not Found**. Ngoài ra, code parse `res.data.data` trong khi Backend trả root `{ message, user, accessToken, refreshToken }` $\to$ crash `TypeError: Cannot read properties of undefined`. | `2b25da0` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **02** | `apps/web/src/components/auth/register-form.tsx` (dòng 61) | `POST /api/v1/auth/register` | `POST /auth/register` | **404 Not Found**. Ngoài ra, Web gửi `role: 'ORGANIZER'` viết hoa trong khi Backend chỉ chấp nhận `isRole: ["Admin", "Organizer", "Judge", "Participant"]` (và API register thực tế hardcode role `Participant`, chặn client tự chọn role). | `2b25da0` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **03** | `apps/web/src/app/portal/contests/page.tsx` (dòng 27) | `GET /api/v1/contests` | `GET /contests` | **404 Not Found**. Dữ liệu parse sai tên trường: Web đọc `title`, `startDate`, `endDate` trong khi Backend trả `name`, `start_at`, `end_at` khiến bảng danh sách bị trống trơn. | `ac62eaf` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **04** | `apps/web/src/app/portal/contests/create/page.tsx` (dòng 63) | `POST /api/v1/contests` | `POST /contests` | **404 Not Found**. Payload gửi trường `title`, `submissionStart`, `submissionEnd` thay vì `name`, `startAt`, `endAt`. | `63d77b3` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **05** | `apps/api/src/index.ts` (dòng 24-27) | Backend mounting root | Không đồng nhất chuẩn `/api/v1/` | `app.route("/contests")` và `app.route("/auth")` gắn tại root không có `/api/v1/`, nhưng `app.route("/api/v1/submissions")` lại có `/api/v1/`. Tiền tố API bị phân mảnh làm cấu hình `baseURL` giữa các ứng dụng bị xung đột. | `9f2d4b5` & `27505bc` | `syduong009` & `binhhd796108-star` | ➡️ Phần `syduong009` chuyển **hnamhocit**; Phần `binhhd796108-star` giữ **Hải Bình** |
| **06** | `apps/mobile/lib/core/data/contest_repository.dart` & `auth_provider.dart` | `/contests`, `/auth/login`, `/auth/register` | Backend `/contests`, `/auth/...` | Mobile gọi API trực tiếp vào root không có `/api/v1/` theo chuẩn Module 09 của SRS (ngược lại `submission_repository.dart` lại gọi `/api/v1/submissions`). | `f9e3b85`, `ca22a0f`, `69a8c22` | `syduong009` & `BAO TU` | ➡️ Của `BAO TU` chuyển **Dương Nguyễn**; Của `syduong009` chuyển **hnamhocit** |

---

## 🎭 Phần 2: Giả Lập Dữ Liệu Mẫu & Nuốt Lỗi Che Giấu Lỗi Thực Tế

Nhiều màn hình và luồng thao tác không hề kết nối Backend mà ngụy trang bằng mock data tĩnh, comment bỏ lệnh gọi API, hoặc đặt `try...catch` rỗng nuốt lỗi:

| STT | File / Vị trí | Mô tả Chi tiết Hành vi Giả Lập / Nuốt Lỗi | Hậu quả kiểm thử | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **07** | `apps/web/src/app/contests/[id]/page.tsx` & `mock-contest-details.ts` | **100% Mock Data, Không tích hợp Backend**: Toàn bộ trang chi tiết cuộc thi đọc từ mảng giả lập 325 dòng `DETAILED_CONTESTS`. Nếu truyền vào ID lạ bất kỳ, hàm tự động clone dữ liệu từ `contest-1`: `{ ...DETAILED_CONTESTS["contest-1"], id, name: "Cuộc thi Nhiếp ảnh Phim #" + id }`. | Tạo cảm giác chức năng đã hoàn thành nhưng thực chất không có bất kỳ lệnh gọi API nào đến máy chủ. | `5ac64b0` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **08** | `apps/web/src/components/home/ongoing-contests.tsx` (dòng 116-118) | **Nuốt Lỗi Mạng (Silent Fail) & Đắp Mock Data**: Gọi `${apiUrl}/contests` nhưng bọc trong `catch {}` rỗng. Khi API sập, mạng lỗi hoặc trả 404/500, code tự động nuốt ngoại lệ và hiển thị `FALLBACK_CONTESTS` kèm chú thích: `"Backend chưa bật hoặc có lỗi mạng -> Giữ nguyên dữ liệu mẫu để giao diện hoạt động tốt"`. | Che giấu toàn bộ lỗi kết nối máy chủ; tester không thể biết API có hoạt động thật hay không. | `8fc1cf6` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **09** | `apps/web/src/app/portal/contests/criteria/page.tsx` (dòng 82-85) | **Bỏ Trống API & Giả Lập Bằng Alert**: Nút "Lưu cấu hình tiêu chí" comment dòng gọi API (`// await http.post(...)`) và chỉ bật popup `alert("Lưu cấu hình tiêu chí thành công!")`. Backend hiện tại thậm chí chưa code endpoint lưu tiêu chí này. | Người dùng tưởng đã lưu cấu hình trọng số nhưng CSDL không nhận được gì. | `730b1ef` | **Trương Vĩ** (`Nguyen Truong Vi`) | **Trương Vĩ** (`Nguyen Truong Vi`) |
| **10** | `apps/web/src/components/auth/judge-login-form.tsx` (dòng 54) | **Giao Diện Ảo, Không Mật Khẩu, Không API**: Form đăng nhập của Giám khảo chỉ kiểm tra regex email/mã mời, không hề có ô nhập password, không gọi Backend API và chỉ set text thông báo: `"Login API is not connected yet."`. | Giám khảo không thể đăng nhập vào hệ thống theo UC-01/UC-02. | `c54bf23` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **11** | `apps/web/src/components/auth/login-form.tsx` & `src/app/portal/template.tsx` | **Xung Đột Nơi Lưu Token Gây Vòng Lặp Vô Tận (Redirect Loop)**: `login-form.tsx` lưu token vào Zustand client in-memory và tự phong quyền: `role: data.user?.role \|\| "Organizer"`. Ngược lại, `portal/template.tsx` (`AuthGuard`) chạy trên Next.js Server Component đọc token từ `cookieStore.get("access_token")`. Vì cookie không bao giờ được set, người dùng vừa đăng nhập thành công vào `/portal` thì lập tức bị Server đá văng về lại `/login`. | Người dùng bị kẹt trong vòng lặp đăng nhập vô hạn, không thể vào Portal. | `2b25da0` & `0ae5511` | `Nguyen Truong Vi` & `XDamDaddyX` | **Trương Vĩ** & **Thành Nhân** |
| **12** | `apps/mobile/lib/screens/contest/contest_detail_screen.dart` (dòng 96-100) | **Nút Đăng Ký Ảo (Fake SnackBar)**: Khi nhấn nút "Đăng ký tham gia", ứng dụng không gọi bất kỳ API đăng ký nào mà chỉ bắn một SnackBar: `"Chức năng đăng ký sẽ được hoàn thiện ở FPC-42"`. | Thí sinh không thể đăng ký tham gia cuộc thi trên ứng dụng di động. | `70358e4` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **13** | `apps/mobile/lib/screens/submission/submission_upload_screen.dart` (dòng 182-183) | **Hardcode Fallback UUID Giả & Metadata Mặc Định**: Gán UUID rác `'00000000-0000-0000-0000-000000000001'` khi `contestId` hoặc `categoryId` null, dẫn tới lỗi vi phạm khóa ngoại (Foreign Key Constraint 500) trên Backend PostgreSQL. Đồng thời tự gán metadata mặc định (`Kodak`, `Portra 400`, `35mm`) che giấu việc thiếu dữ liệu thực từ thí sinh. | Gây sập API Backend khi submit và sai lệch hồ sơ dự thi. | `55e4e51` | **Huỳnh Bảo** (`huynhbao1710`) | **Huỳnh Bảo** (`huynhbao1710`) |
| **14** | `apps/mobile/lib/screens/profile_screen.dart` (dòng 18-21) | **Menu Tính Năng Bản Demo**: 4 mục tính năng quan trọng (Cập nhật thông tin, Đổi mật khẩu, Cài đặt ứng dụng, Trợ giúp) chỉ bật SnackBar thông báo `"(bản demo)"`, không có code nghiệp vụ. | Người dùng không thể cập nhật thông tin cá nhân hay đổi mật khẩu. | `fea0569` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **15** | `apps/mobile/lib/router/app_router.dart` (dòng 32 & 50) | **Trùng Lặp Route & Bỏ Quên Màn Hình Nộp Bài**: Route `path: '/contests/:id'` bị khai báo 2 lần liên tiếp. Hai màn hình quan trọng là `SubmissionUploadScreen` và `FilmDevScanScreen` đã code xong nhưng **không hề được khai báo vào `appRouter`**, khiến luồng nộp bài trên Mobile hoàn toàn không thể điều hướng tới được. | Không có cách nào truy cập vào màn hình nộp bài thi ảnh trên Mobile. | `70358e4` & `166fb6d` | `BAO TU` & `huynhbao1710` | ➡️ Phần `BAO TU` chuyển **Dương Nguyễn**; Phần `huynhbao1710` giữ **Huỳnh Bảo** |
| **16** | `apps/web/src/app/portal/page.tsx` & `reports/page.tsx` | **Trang Dashboard & Báo Cáo Rỗng**: Cả 2 trang chỉ có các thẻ tiêu đề văn bản tĩnh (`"Dashboard"`, `"Reports overview is coming soon"`), không có thống kê cuộc thi, số lượng thí sinh, bài thi hay biểu đồ theo SCR-ORG-01. | Organizer không có dữ liệu để quản lý cuộc thi. | `ef0fa5d` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |

---

## 💥 Phần 3: Lỗi Kỹ Thuật Fatal, Thiếu Thư Viện & Crash Biên Dịch

Các lỗi cú pháp và thiếu khai báo dependencies trong `package.json` khiến câu lệnh `check-types`, `bun test`, và `flutter analyze` thất bại:

| STT | File / Vị trí lỗi | Mô tả Lỗi Kỹ Thuật / Thiếu Gì | Triệu chứng & Mã lỗi | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **17** | `apps/mobile/lib/screens/contest/contest_card.dart` | **Sử dụng biến chưa khai báo (Undefined Variables)**: Gọi các biến `background`, `foreground`, `description`, `scheme`, `_dateRange` sau khi refactor dở dang khiến `flutter analyze` báo 10 lỗi fatal. | `error: Undefined name 'background'` / `foreground` / `description` / `scheme` / `_dateRange` | `ca22a0f` / `70358e4` | **Hoài Bảo** (`BAO TU`) | ➡️ **Dương Nguyễn** (`syduong009`) |
| **18** | `apps/api/src/r2.ts` (dòng 3) | **Thiếu Thư Viện (Missing Dependency)**: Gọi `import { Upload } from "@aws-sdk/lib-storage"` nhưng gói `@aws-sdk/lib-storage` **chưa hề được cài đặt trong `apps/api/package.json`**. | `error TS2307: Cannot find module '@aws-sdk/lib-storage'` | `27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **19** | `apps/api/src/utils/validate-image.ts` & `tests/validate-image.test.ts` | **Thiếu Thư Viện (Missing Dependency)**: Gọi `import sharp from "sharp"` nhưng `sharp` và `@types/sharp` **chưa hề được khai báo trong `apps/api/package.json`**, làm crash `check-types` và bộ kiểm thử `bun test`. | `error TS2307: Cannot find module 'sharp'` / `Cannot find package 'sharp'` | `b7609c5` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **20** | `apps/web/src/app/portal/template.tsx` (dòng 11) | **Sai Kiểu Trả Về Component (Invalid JSX Element)**: Hàm `AuthGuard` là hàm `async` trả về kiểu `Promise<void>` thay vì `ReactNode`, khiến TypeScript checker của Web bị crash. | `error TS2786: 'AuthGuard' cannot be used as a JSX component. Type 'Promise<void>' is not assignable to type 'ReactNode'` | `0ae5511` / `d0c441e` | **Thành Nhân** (`XDamDaddyX`) | **Thành Nhân** (`XDamDaddyX`) |
| **21** | `apps/api/src/index.ts` (dòng 98 & 108) | **Khai báo Trùng Endpoint**: Khai báo lặp lại 2 lần liên tiếp route `app.get("/rbac/manage-contest", ...)` ở dòng 98 và dòng 108. | Cú pháp trùng lặp, vi phạm quy tắc Clean Code. | `4c08388` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |

---

## ⚖️ Phần 4: Vi Phạm Quy Tắc Nghiệp Vụ Đặc Tả Cốt Lõi

Các vi phạm trực tiếp các điều khoản bất khả xâm phạm trong Master SRS (`docs/srs.md`):

| STT | File / Vị trí | Mô tả Vi phạm Nghiệp vụ | Quy tắc SRS Vi phạm | Commit Hash | Tác giả Gốc | Phân bổ Trách nhiệm |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **22** | `apps/api/src/routes/contests.ts` (dòng 380) | **Xóa Cứng CSDL (Hard Delete)**: Trong `DELETE /contests/:id`, thực hiện SQL `DELETE FROM contests WHERE id = $1` xóa vật lý bản ghi thay vì soft delete. | **BR-03** (Soft Delete Only - Tuyệt đối không xóa vật lý) | `9f2d4b5` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **23** | `apps/api/src/routes/contests.ts` | **Sai Lịch trình & Sai State Machine**: `POST /contests` và `PUT /contests/:id` chỉ check `startAt < endAt`, bỏ qua 4 mốc thời gian tuần tự. Khai báo enum trạng thái sai lệch: `VALID_STATUSES = ["draft", "published", "ongoing", "completed", "cancelled"]` (5 trạng thái tự chế) thay vì 6 trạng thái chuẩn. | **BR-08** (Lịch trình tuần tự $T_{reg} < T_{sub} < T_{judge\_start} < T_{judge\_end} < T_{pub}$) & **Máy trạng thái 6 bước** | `9f2d4b5` / `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **24** | `apps/api/src/routes/contests.ts` | **Vi phạm Tính Bất biến Kết quả**: `PUT /contests/:id` cho phép cập nhật thông tin và sửa thời hạn ngay cả khi cuộc thi đã ở trạng thái công bố kết quả (`published`), không có cơ chế khóa Read-Only. | **BR-16** (Result Immutability - Sau khi Publish, toàn bộ dữ liệu bị khóa vĩnh viễn) | `9f2d4b5` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **25** | `apps/api/src/routes/contests.ts` (dòng 69) | **Lọc ngầm trạng thái**: `GET /contests` nếu không truyền param `status` sẽ tự động lọc `WHERE status IN ('published', 'ongoing')`. Khiến Organizer không thể lấy danh sách các cuộc thi ở trạng thái `draft`, `completed`, `cancelled`. | **CR-05**, **SCR-ORG-01** | `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |
| **26** | `apps/api/src/routes/submissions.ts` | **Sai Tiêu chuẩn Kỹ thuật File Ảnh**: Cấu hình validate cho phép ảnh dung lượng lên tới **100MB** (`maxBytes: 100 * MiB`) và kích thước tối thiểu chỉ **1000px**, vi phạm chuẩn ảnh scan. | **BR-07** (Yêu cầu ảnh scan tối đa **25MB**, cạnh ngắn nhất tối thiểu **2000px**) | `b7609c5` / `27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **27** | `apps/api/src/routes/submissions.ts` | **Thiếu Validate Deadline & Chống Trùng**: Không kiểm tra thời hạn đóng cổng nộp bài (`submission_deadline_at`), không kiểm tra trùng lặp cặp frame (`rollId` + `frameNumber`) trong cuộc thi, không kiểm tra giới hạn số bài/hạng mục. | **BR-05** (Chống trùng lặp), **BR-08** (Khóa cổng khi hết hạn), **MSG012**, **MSG014** | `27505bc` | **Hải Bình** (`binhhd796108-star`) | **Hải Bình** (`binhhd796108-star`) |
| **28** | `apps/mobile/lib/screens/film_params/film_params_form.dart` | **Thiếu Ràng buộc Khung hình Vật lý & Trường Bắt buộc**: Validator `_frameNumberController` chỉ check `maxLength(20)`, không kiểm tra giới hạn vật lý theo khổ phim (135 max 39, 120 max 10-16). Đặt số frame là optional trong khi SRS bắt buộc 5 thông số. | **BR-04 / BR-23** (Giới hạn vật lý frame), **BR-22** (5 trường bắt buộc) | `6b9b60f` | **Huỳnh Bảo** (`huynhbao1710`) | **Huỳnh Bảo** (`huynhbao1710`) |
| **29** | `apps/mobile/lib/models/contest.dart` (dòng 1-6) | **Enum Trạng Thái Không Khớp Đặc Tả**: Khai báo enum trạng thái cuộc thi sai lệch: `draft`, `published`, `ongoing`, `completed`, `cancelled` thay vì 6 trạng thái chuẩn theo SRS (`DRAFT`, `PUBLISHED`, `SUBMISSION_OPEN`, `JUDGING`, `SCORING_FINAL`, `ARCHIVED`). | **BR-08**, **Module 03** | `f9e3b85` | **Dương Nguyễn** (`syduong009`) | ➡️ **hnamhocit** (`Hoang Nam`) |

---

## 👥 Bảng Phân Bổ Trách Nhiệm Xử Lý

Áp dụng quy tắc chuyển giao:
- 🔁 **Hoài Bảo (`BAO TU`) $\to$ Dương Nguyễn (`syduong009`)**
- 🔁 **Dương Nguyễn (`syduong009`) $\to$ hnamhocit (`Hoang Nam`)**

### 1. hnamhocit (`Hoang Nam`) nhận bàn giao từ Dương Nguyễn (Tổng cộng: 7 hạng mục)
- **Bug 05**: Chuẩn hóa router Backend sang prefix chuẩn `/api/v1/` trong `apps/api/src/index.ts`.
- **Bug 06**: Điều chỉnh endpoint `contest_repository.dart` và `auth_service.dart` sang `/api/v1/`.
- **Bug 22**: Sửa endpoint `DELETE /contests/:id` sang Soft Delete (`is_deleted = TRUE`) theo **BR-03**.
- **Bug 23**: Sửa validator ngày thi tuần tự theo **BR-08** và chuẩn hóa 6 trạng thái vòng đời cuộc thi.
- **Bug 24**: Bổ sung cơ chế khóa dữ liệu Read-Only sau khi cuộc thi ở trạng thái `PUBLISHED` theo **BR-16**.
- **Bug 25**: Sửa lại query lọc trạng thái trong `GET /contests` để Organizer xem được các cuộc thi nháp/đã đóng.
- **Bug 29**: Cập nhật enum `ContestStatus` trong `apps/mobile/lib/models/contest.dart` theo đúng 6 trạng thái SRS.

### 2. Dương Nguyễn (`syduong009`) nhận bàn giao từ Hoài Bảo (Tổng cộng: 5 hạng mục)
- **Bug 06**: Đồng bộ endpoint auth trên Mobile (`/api/v1/auth/...`).
- **Bug 12**: Thay thế SnackBar thông báo ảo FPC-42 bằng flow gọi API đăng ký tham gia cuộc thi thực tế.
- **Bug 14**: Thay thế SnackBar `(bản demo)` trên màn hình Profile bằng màn hình cập nhật thông tin và đổi mật khẩu.
- **Bug 15**: Xóa bỏ route trùng lặp `/contests/:id` trong `app_router.dart`.
- **Bug 17**: Sửa 10 lỗi fatal undefined variable (`background`, `foreground`, `description`, `scheme`, `_dateRange`) trong `contest_card.dart` để Mobile app biên dịch thành công.

### 3. Trương Vĩ (`Nguyen Truong Vi`) (Tổng cộng: 5 hạng mục)
- **Bug 01**: Sửa endpoint gọi API đăng nhập thành `/api/v1/auth/login` (hoặc `/auth/login`) và sửa lỗi parse `res.data.data` crash app.
- **Bug 02**: Sửa endpoint gọi API đăng ký thành `/api/v1/auth/register` (hoặc `/auth/register`) và loại bỏ tham số role sai định dạng.
- **Bug 03**: Sửa endpoint và map đúng trường dữ liệu (`name`, `start_at`, `end_at`) trên trang danh sách cuộc thi Portal.
- **Bug 04**: Sửa endpoint và map đúng trường dữ liệu (`name`, `startAt`, `endAt`) trên trang tạo cuộc thi Portal.
- **Bug 09**: Bỏ comment và kích hoạt API lưu cấu hình trọng số tiêu chí chấm điểm thay vì chỉ hiện `alert()`.

### 4. Thành Nhân (`XDamDaddyX`) (Tổng cộng: 5 hạng mục)
- **Bug 07**: Thay thế toàn bộ mock data tĩnh trong `DETAILED_CONTESTS` và logic clone `contest-1` bằng API call thực tế.
- **Bug 08**: Xóa bỏ cơ chế nuốt lỗi (silent catch) và fallback mock data trong `ongoing-contests.tsx`, hiển thị đúng trạng thái lỗi mạng/API.
- **Bug 10**: Bổ sung trường nhập mật khẩu và kết nối API xác thực cho màn hình đăng nhập giám khảo `judge-login-form.tsx`.
- **Bug 11**: Sửa lại cơ chế lưu Access Token vào Cookies để tránh vòng lặp redirect vô tận giữa `login-form` và `AuthGuard`.
- **Bug 16 & 20**: Sửa lỗi TypeScript TS2786 cho `AuthGuard` trong `portal/template.tsx` và xây dựng giao diện thống kê thực tế cho Dashboard/Reports.

### 5. Hải Bình (`binhhd796108-star`) (Tổng cộng: 5 hạng mục)
- **Bug 05 & 21**: Chuẩn hóa tiền tố endpoint trong `apps/api/src/index.ts` và xóa bỏ route `app.get("/rbac/manage-contest")` bị khai báo trùng 2 lần.
- **Bug 18**: Thêm thư viện `@aws-sdk/lib-storage` vào `apps/api/package.json` để sửa lỗi TS2307 trong `r2.ts`.
- **Bug 19**: Thêm thư viện `sharp` và `@types/sharp` vào `apps/api/package.json` để sửa lỗi TS2307 và chạy được test.
- **Bug 26**: Sửa lại thông số validator ảnh scan trong `validate-image.ts` và `submissions.ts`: tối đa 25MB, cạnh ngắn tối thiểu 2000px theo **BR-07**.
- **Bug 27**: Bổ sung kiểm tra deadline nộp bài và kiểm tra chống trùng cặp roll + frame theo **BR-05** và **BR-08**.

### 6. Huỳnh Bảo (`huynhbao1710`) (Tổng cộng: 3 hạng mục)
- **Bug 13**: Xóa bỏ UUID mặc định `00000000-0000-0000-0000-000000000001` và các giá trị fallback chụp phim trong `submission_upload_screen.dart`, bắt buộc truyền đúng ID cuộc thi/hạng mục.
- **Bug 15**: Đăng ký các route màn hình `SubmissionUploadScreen` và `FilmDevScanScreen` vào `appRouter`.
- **Bug 28**: Thêm ràng buộc kiểm tra số khung hình vật lý theo khổ phim (135 tối đa 39, 120 tối đa 10-16) và bắt buộc nhập số frame theo **BR-04, BR-22, BR-23**.
