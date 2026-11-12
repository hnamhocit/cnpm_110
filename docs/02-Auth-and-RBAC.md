# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - CHUYÊN ĐỀ XÁC THỰC & PHÂN QUYỀN
**Hệ thống:** AI-powered Film Photography Contest Management Platform (FilmContest-AI)  
**Tài liệu:** Auth_and_RBAC.md  
**Phiên bản:** 1.0  
**Vai trò phụ trách:** Technical Writer & Software Architect  

---

## 1. Tổng quan & Các Tác nhân Hệ thống (System Actors & RBAC Scope)

### 1.1 Tổng quan Kiến trúc Xác thực & Phân quyền
Hệ thống Quản lý Cuộc thi Nhiếp ảnh Phim tích hợp AI (FilmContest-AI) vận hành theo mô hình kiểm soát truy cập dựa trên vai trò phân cấp (Hierarchical Role-Based Access Control - RBAC). Cơ chế xác thực sử dụng JSON Web Token (JWT) phi trạng thái (Stateless), mã hóa một chiều mật khẩu bằng giải thuật BCrypt có muối (Salted BCrypt), kết hợp lớp bảo vệ phiên làm việc và kiểm soát giới hạn thiết bị nhằm bảo đảm an toàn dữ liệu tuyệt đối.

Phân quyền trong hệ thống được thực thi nhất quán ở hai tầng:
1. **Frontend / UI Layer:** Kiểm soát hiển thị thanh điều hướng (Sidebar Navigation), nút chức năng (Action Buttons) và bộ bảo vệ định tuyến (Route Guards).
2. **Backend API Middleware:** Kiểm tra chữ ký số JWT, thẩm định hiệu lực phiên qua Redis Whitelist/Blacklist, đối chiếu ma trận quyền hạn chi tiết (CRUD + Approve/Execute) trước khi cho phép dữ liệu đi vào tầng Controller/Service.

---

### 1.2 Các Tác nhân Hệ thống (Actors) & Phạm vi Quyền hạn
Hệ thống định nghĩa 4 nhóm tác nhân cốt lõi kế thừa từ mô hình tài khoản người dùng chung:

```
                  +-----------------------------------+
                  |        Base User Account          |
                  | (Email, Password Hash, JWT Auth)  |
                  +-----------------+-----------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
+-------v-------+           +-------v-------+           +-------v-------+
| Administrator |           |   Organizer   |           |     Judge     |
+---------------+           +---------------+           +---------------+
        |                                                       |
        +---------------------------+---------------------------+
                                    |
                            +-------v-------+
                            |  Participant  |
                            +---------------+
```

| STT | Tác nhân (Actor) | Mô tả Vai trò & Trách nhiệm (Role Description) | Phạm vi Quyền hạn Tài khoản & Phân quyền (RBAC Scope) |
| :---: | :--- | :--- | :--- |
| **1** | **Administrator** *(System Admin)* | Chịu trách nhiệm cấu hình toàn hệ thống, quản lý toàn bộ vòng đời tài khoản người dùng và phân quyền RBAC (Roles & Permissions). Quản lý dữ liệu danh mục gốc (Master Data), giám sát nhật ký kiểm toán (System Audit Logs) và cấu hình các tham số ngưỡng AI. | **Toàn quyền Quản trị (Super Admin):**<br>- Toàn quyền (C-R-U-D) trên tài khoản người dùng (User Accounts) và ma trận vai trò/quyền hạn (Roles & Permissions).<br>- Toàn quyền cấu hình tham số hệ thống và tra cứu Audit Logs toàn cục.<br>- Khóa/Mở khóa tài khoản người dùng và kích hoạt cơ chế thu hồi Token tức thì (Token Revocation). |
| **2** | **Contest Organizer** *(Ban tổ chức)* | Đơn vị hoặc cá nhân tổ chức cuộc thi. Khởi tạo và cấu hình cuộc thi (Wizard 4 bước), định nghĩa hạng mục (Categories), thiết lập bộ tiêu chí chấm điểm, quản lý đăng ký của thí sinh, kiểm duyệt bài thi dựa trên cảnh báo AI, yêu cầu bổ sung ảnh âm bản đối chứng, phân công giám khảo, phê duyệt và công bố bảng kết quả chung cuộc. | **Quản trị Cuộc thi (Contest Operations):**<br>- Quyền Đọc (R) danh sách tài khoản người dùng để tra cứu thí sinh và giám khảo.<br>- Toàn quyền (C-R-U-D-A) quản lý cuộc thi, hạng mục, tiêu chí chấm và phân công giám khảo.<br>- Quyền Thẩm định/Phê duyệt bài thi (A) và công bố kết quả (A).<br>- *Ràng buộc:* Bị chặn đăng ký làm thí sinh dự thi trong chính cuộc thi mình quản lý (Quy tắc Xung đột lợi ích - BR-21). |
| **3** | **Judge** *(Hội đồng Giám khảo)* | Chuyên gia nhiếp ảnh được mời tham gia đánh giá tác phẩm. Truy cập không gian chấm thi ẩn danh độc quyền, xem tác phẩm độ phân giải cao kèm thông số kỹ thuật phim, thực hiện chấm điểm theo từng tiêu chí thành phần, viết nhận xét chuyên môn, tham gia các vòng chấm (Sơ khảo, Bán kết, Chung kết) và xác nhận khóa bảng điểm. | **Chấm thi Độc lập (Evaluation & Scoring):**<br>- Chỉ có quyền truy cập vào các bài thi thuộc hạng mục và vòng thi được phân công cụ thể.<br>- Quyền Tạo/Cập nhật (C-U) bảng điểm cá nhân và khóa điểm (Lock).<br>- *Bảo vệ Ẩn danh (Blind Guard):* Tuyệt đối không có quyền xem thông tin cá nhân (Tên, Email, Avatar) của thí sinh (BR-12).<br>- *Tính Độc lập:* Không có quyền xem điểm số hoặc nhận xét của giám khảo khác cho đến khi vòng chấm khép lại (BR-13). |
| **4** | **Participant** *(Thí sinh / Nhiếp ảnh gia)* | Nhiếp ảnh gia analog tham gia cuộc thi. Quản lý hồ sơ cá nhân và portfolio ảnh phim trực tuyến, ghi chép nhật ký cuộn phim (Film Roll & Frame Logbook), đăng ký dự thi, tải lên ảnh quét kỹ thuật số kèm siêu dữ liệu và ảnh dải phim âm bản đối chứng, theo dõi tiến trình kiểm duyệt và nhận phản hồi từ giám khảo. | **Người dùng Cá nhân (Self-Service Data Owner):**<br>- Quyền Quản lý (C-R-U-D) dữ liệu cá nhân: Hồ sơ, Sổ tay cuộn phim (Film Roll Log) và khung hình (Frame Log).<br>- Quyền Nộp bài dự thi (C) và Chỉnh sửa/Rút bài (U) khi cuộc thi chưa đóng cổng nhận bài (BR-24).<br>- Quyền Xem kết quả cá nhân và phản hồi chấm điểm khi kết quả đã được công bố chính thức. |

---

## 2. Danh sách Use Cases Xác thực & Phân quyền (Mục 2.2)

Hệ thống quản lý định danh và phân quyền thông qua cụm Use Cases nền tảng sau:

### 2.1 Bảng tổng hợp Use Cases

| Mã Use Case | Tên Use Case | Tác nhân (Actors) | Mô tả Tóm tắt Chức năng (SRS Section 2.2.2) |
| :---: | :--- | :--- | :--- |
| **UC-01** | **Login / Logout** | All Actors | Xác thực người dùng bằng thông tin đăng nhập (JWT) để cấp quyền truy cập vào dashboard theo vai trò và hỗ trợ đăng xuất an toàn khỏi hệ thống. |
| **UC-02** | **Recover Password** | All Actors | Cho phép người dùng yêu cầu đặt lại mật khẩu đã quên thông qua liên kết xác thực an toàn gửi đến địa chỉ Email đã đăng ký. |
| **UC-03** | **View & Update Profile** | All Actors | Hiển thị và cho phép người dùng tự cập nhật thông tin hồ sơ cá nhân, hình ảnh đại diện (Avatar), tiểu sử nghệ thuật và thay đổi mật khẩu hiện tại. |
| **UC-04** | **Manage User Accounts** | Admin | Cho phép Quản trị viên quản lý vòng đời tài khoản người dùng trên toàn hệ thống (Tạo mới, xem chi tiết, phân nhóm, kích hoạt, khóa hoặc mở khóa tài khoản). |
| **UC-05** | **Manage Roles & Permissions** | Admin | Cho phép Quản trị viên định nghĩa vai trò mới và gán ma trận quyền hạn chi tiết (RBAC) theo từng module chức năng cho các nhóm người dùng. |

---

### 2.2 Mô tả Chi tiết Từng Use Case

#### UC-01: Login / Logout
- **Tác nhân:** Toàn bộ tác nhân (Admin, Organizer, Judge, Participant).
- **Mục tiêu:** Xác minh danh tính của người dùng, thiết lập phiên làm việc được bảo vệ bằng JWT và điều hướng tới Dashboard tương ứng với vai trò. Khi đăng xuất, thu hồi token và xóa sạch phiên làm việc trên Client/Server.
- **Tiền điều kiện:** Người dùng đã có tài khoản hoạt động (`Status = ACTIVE`) trong hệ thống.
- **Luồng sự kiện chính (Login):**
  1. Người dùng nhập thông tin định danh (Email hoặc Tên đăng nhập) và Mật khẩu.
  2. Client gửi yêu cầu HTTPS POST chứa thông tin đăng nhập đến `/api/v1/auth/login`.
  3. Hệ thống kiểm tra tài khoản, đối chiếu mật khẩu băm BCrypt với cơ sở dữ liệu.
  4. Hệ thống kiểm tra số lượng thiết bị đăng nhập đồng thời (BR-04); vô hiệu hóa phiên cũ nếu vượt ngưỡng cấu hình.
  5. Hệ thống sinh cặp mã xác thực: `AccessToken` (thời hạn ngắn, ví dụ 15 phút) và `RefreshToken` (thời hạn dài, ví dụ 7 ngày).
  6. Hệ thống trả dữ liệu hồ sơ rút gọn kèm Token và chuyển hướng người dùng về trang đích theo Role (BR-02).
- **Luồng sự kiện chính (Logout):**
  1. Người dùng kích hoạt nút "Đăng xuất" trên giao diện.
  2. Client gửi yêu cầu HTTPS POST tới `/api/v1/auth/logout` kèm Bearer Token hiện hành.
  3. Hệ thống đưa Access Token vào danh sách hủy hiệu lực (Redis Token Blacklist) cho đến khi hết hạn và hủy bỏ Refresh Token trong cơ sở dữ liệu.
  4. Client xóa sạch bộ nhớ cục bộ (Local Storage/Cookies) và chuyển hướng về trang Login.

#### UC-02: Recover Password
- **Tác nhân:** Toàn bộ tác nhân.
- **Mục tiêu:** Cung cấp phương thức an toàn để khôi phục quyền truy cập tài khoản khi người dùng quên mật khẩu.
- **Luồng sự kiện chính:**
  1. Người dùng chọn liên kết "Quên mật khẩu" tại màn hình Đăng nhập.
  2. Nhập Email đã đăng ký trong hệ thống.
  3. Hệ thống kiểm tra sự tồn tại của Email trong bảng `Users`. Nếu hợp lệ, sinh một mã thông báo ngẫu nhiên có chữ ký số (Password Reset Token) với thời hạn hiệu lực nghiêm ngặt (ví dụ: 15 phút).
  4. Hệ thống gửi email chứa liên kết đặt lại mật khẩu độc nhất đến hòm thư người dùng qua dịch vụ SMTP.
  5. Người dùng nhấp vào liên kết trong email, hệ thống xác thực tính hợp lệ và thời hạn của Token.
  6. Người dùng nhập mật khẩu mới (phải đáp ứng độ phức tạp: tối thiểu 8 ký tự, có chữ hoa, chữ số và ký tự đặc biệt).
  7. Hệ thống mã hóa mật khẩu mới bằng BCrypt, cập nhật vào cơ sở dữ liệu, hủy Token khôi phục và thu hồi toàn bộ các phiên đăng nhập cũ trên mọi thiết bị.

#### UC-03: View & Update Profile
- **Tác nhân:** Toàn bộ tác nhân.
- **Mục tiêu:** Quản lý thông tin hồ sơ cá nhân và bảo mật tài khoản cá nhân.
- **Luồng sự kiện chính:**
  1. Người dùng truy cập trang "Hồ sơ cá nhân" (Profile Settings).
  2. Hệ thống truy vấn thông tin chi tiết: Họ tên, Tên hiển thị, Email, Số điện thoại, Ảnh đại diện, Tiểu sử ngắn (Bio).
  3. Người dùng cập nhật các trường thông tin cho phép hoặc tải lên Avatar mới (JPG/PNG < 5MB).
  4. Khi đổi mật khẩu: Bắt buộc người dùng nhập đúng "Mật khẩu hiện tại", sau đó nhập "Mật khẩu mới" và "Xác nhận mật khẩu mới".
  5. Hệ thống kiểm tra mật khẩu hiện tại qua BCrypt. Nếu khớp, băm mật khẩu mới và lưu vào cơ sở dữ liệu.

#### UC-04: Manage User Accounts
- **Tác nhân:** Administrator.
- **Mục tiêu:** Quản lý toàn bộ cơ sở dữ liệu người dùng nhằm bảo đảm an ninh hệ thống và điều phối nhân sự.
- **Luồng sự kiện chính:**
  1. Quản trị viên truy cập màn hình "User Account List".
  2. Hệ thống hiển thị danh sách người dùng phân trang kèm bộ lọc theo Vai trò (Role), Trạng thái (Active, Inactive, Locked) và ô tìm kiếm theo Tên/Email.
  3. Quản trị viên có thể:
     - **Tạo tài khoản nội bộ:** Điền thông tin tạo mới tài khoản cho Ban tổ chức (Organizer) hoặc Giám khảo (Judge).
     - **Cập nhật thông tin:** Điều chỉnh thông tin liên lạc, gán vai trò bổ sung.
     - **Khóa tài khoản (Lock Account):** Nhập lý do khóa. Hệ thống lập tức đổi trạng thái sang `LOCKED`, ghi log vào `AuditLog` và thu hồi toàn bộ JWT Token đang hoạt động của người dùng đó (BR-04).
     - **Mở khóa tài khoản (Unlock Account):** Khôi phục trạng thái hoạt động bình thường.

#### UC-05: Manage Roles & Permissions
- **Tác nhân:** Administrator.
- **Mục tiêu:** Thiết lập các vai trò nghiệp vụ và cấu hình quyền hạn chi tiết (RBAC) đến từng chức năng và tài nguyên.
- **Luồng sự kiện chính:**
  1. Quản trị viên truy cập màn hình "Role & Permission List".
  2. Hệ thống hiển thị danh mục các vai trò mặc định (Admin, Organizer, Judge, Participant) và ma trận phân quyền chi tiết theo từng mô-đun chức năng.
  3. Quản trị viên chọn vai trò cần điều chỉnh và tích chọn/bỏ chọn các hành động: Create (C), Read (R), Update (U), Delete (D), Approve (A), Execute (E).
  4. Hệ thống kiểm tra tính toàn vẹn (không cho phép tước quyền quản trị tối cao của tài khoản Super Admin).
  5. Lưu ma trận phân quyền mới vào cơ sở dữ liệu, áp dụng ngay lập tức cho các yêu cầu API tiếp theo.

---

## 3. Ma trận Phân quyền Màn hình (Screen Authorization Matrix)

Bảng ma trận dưới đây được trích xuất nguyên văn từ **Mục 3.1.9** của tài liệu SRS gốc, đặc tả quyền hạn của 4 nhóm vai trò trên từng màn hình và mô-đun ứng dụng:

> **Quy ước Ký hiệu Hành động:**  
> - **C** = Create (Tạo mới)  
> - **R** = Read (Xem, Đọc, Tra cứu)  
> - **U** = Update (Chỉnh sửa, Cập nhật)  
> - **D** = Delete (Xóa dữ liệu / Xóa mềm)  
> - **A** = Approve / Verify (Phê duyệt, Thẩm định, Xác minh)  
> - **E** = Execute (Thực thi quy trình ngầm, Worker AI)  
> - **✓** = Có toàn quyền thực hiện các Typical Actions của màn hình đó.  
> - **-** = Không có quyền truy cập (Access Denied).  

### Bảng Ma trận Phân quyền Màn hình Chi tiết (Mục 3.1.9)

| # | Web / Mobile Module & Screen | Typical Actions | Admin | Organizer | Judge | Participant | Ghi chú & Ràng buộc Kỹ thuật |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **Authentication (Login/Logout/Change PW)** | C-R-U | ✓ | ✓ | ✓ | ✓ | Toàn bộ người dùng đều có quyền đăng nhập, đăng xuất và đổi mật khẩu cá nhân. |
| **2** | **Own Profile Management** | R-U | ✓ | ✓ | ✓ | ✓ | Người dùng tự quản lý thông tin hồ sơ và ảnh đại diện của chính mình. |
| **3** | **User Account Management** | C-R-U-D | ✓ | R | - | - | Admin toàn quyền quản trị; Organizer chỉ có quyền Đọc (R) để tra cứu; Judge và Participant không có quyền. |
| **4** | **Role & Permission Configuration** | C-R-U-D | ✓ | - | - | - | Đặc quyền độc nhất của Administrator; các vai trò khác tuyệt đối không được truy cập. |
| **5** | **Analog Master Data (Film, Camera, Lab)** | C-R-U-D | ✓ | R | R | R | Admin toàn quyền thiết lập dữ liệu danh mục gốc; các vai trò khác chỉ có quyền Đọc (R) để chọn nhanh. |
| **6** | **AI Threshold & System Configuration** | R-U | ✓ | R | - | - | Admin có quyền xem và cấu hình các ngưỡng kỹ thuật AI; Organizer chỉ có quyền Đọc (R) tham số. |
| **7** | **Contest & Category Management** | C-R-U-D | R | ✓ | R | R | Organizer toàn quyền quản lý vòng đời cuộc thi; Admin, Judge và Participant có quyền Xem thông tin. |
| **8** | **Scoring Criteria & Judge Assignment** | C-R-U-D | R | ✓ | R (Own) | R | Organizer toàn quyền cấu hình; Judge chỉ xem được tiêu chí và phân công của chính mình (`Own`). |
| **9** | **Film Roll & Frame Logbook** | C-R-U-D | - | - | - | ✓ (Own) | Sổ tay cá nhân của Participant; chỉ tác giả mới có quyền Tạo, Đọc, Sửa, Xóa dữ liệu cuộn phim của mình. |
| **10** | **Contest Submission & Negative Upload** | C-R-U | R | R | - | ✓ (Own) | Thí sinh tự nộp và quản lý bài thi của mình; Admin và Organizer có quyền Xem bài; Judge bị chặn ở bước này. |
| **11** | **AI Verification Pipeline & Reports** | R-E-A | R | ✓ | - | - | Organizer toàn quyền xem báo cáo AI, kích hoạt quét lại và thẩm định rủi ro; Admin có quyền Xem (R). |
| **12** | **Submission Moderation (Approve/Disqualify)** | R-U-A | R | ✓ | - | R (Own Status) | Organizer kiểm duyệt, phê duyệt hoặc loại bài; Thí sinh chỉ xem được trạng thái bài thi của chính mình. |
| **13** | **Blind Judging Workspace & Scoring** | C-R-U | - | R (Summary) | ✓ (Assigned) | - | Không gian chấm thi: Judge toàn quyền chấm các bài được phân công (`Assigned`); Organizer xem bảng điểm tổng hợp. |
| **14** | **Leaderboard, Award & Result Publication** | C-R-U-A | R | ✓ | R | R | Organizer tổng hợp bảng điểm, chốt giải và công bố; các vai trò khác có quyền Xem sau khi công bố. |
| **15** | **Digital Archive & Online Exhibition** | C-R-U-D | ✓ | ✓ | R | R | Admin và Organizer cùng quản lý xuất bản vào kho lưu trữ số; Judge và Participant có quyền Xem triển lãm. |

---

## 4. Đặc tả Kỹ thuật Chi tiết: Xác thực & Cấp quyền (Functional Specification)

### 4.1 Chi tiết Mục 3.2.1: Authenticate Users (Xác thực người dùng)

#### A. Kích hoạt Chức năng (Function Trigger)
Người dùng truy cập vào đường dẫn cổng thông tin Web (URL) hoặc mở ứng dụng Mobile và nhấp chọn hành động "Đăng nhập" (Login).

#### B. Tác nhân & Vai trò (Actors / Roles)
- System Administrator
- Contest Organizer
- Judge
- Participant

#### C. Mục đích (Purpose)
Xác minh danh tính người dùng qua thông tin đăng nhập hợp lệ, cấp phát cặp khóa JSON Web Token (Access Token / Refresh Token) phục vụ các phiên làm việc tiếp theo, và tự động điều hướng người dùng tới không gian làm việc (Dashboard) tương ứng với vai trò đã được thiết lập (BR-02).

#### D. Luồng Xử lý Dữ liệu Chi tiết (Data Processing Pipeline)
Quy trình xác thực được thực thi tuần tự qua 4 giai đoạn nghiêm ngặt:

```
[Người dùng] 
     │ (1) Nhập Email/Username + Mật khẩu
     ▼
[Frontend Client] 
     │ (2) POST /api/v1/auth/login (HTTPS)
     ▼
[Authentication API Gateway / Controller]
     │ (3) Kiểm tra trạng thái tài khoản (Status = ACTIVE?)
     ├──── [Nếu LOCKED / INACTIVE] ──► Báo lỗi tài khoản bị khóa (MSG005)
     │ (4) Đối chiếu mật khẩu băm (BCrypt.checkpw)
     ├──── [Nếu Không khớp] ──────────► Báo lỗi sai thông tin (MSG004)
     │ (5) Kiểm tra giới hạn thiết bị (BR-04)
     ├──── [Nếu vượt ngưỡng] ────────► Thu hồi Token phiên cũ trong Redis
     │ (6) Cấp phát JWT Access Token (15m) + Refresh Token (7d)
     ▼
[Frontend Client] 
     │ (7) Lưu Token an toàn & Điều hướng theo Role (BR-02)
     ▼
[Dashboard tương ứng: Admin / Organizer / Judge / Participant]
```

1. **Giai đoạn 1 - Tiếp nhận thông tin định danh:**  
   Người dùng nhập thông tin đăng nhập gồm `Email` (hoặc `Username`) và `Password` trên giao diện người dùng. Client-side tiến hành kiểm tra tính toàn vẹn (Validation) theo quy tắc CR-01 và CR-02 (Email đúng định dạng RFC, mật khẩu không được để trống).

2. **Giai đoạn 2 - Truyền tải & Tiếp nhận API an toàn:**  
   Thông tin đăng nhập được gói trong yêu cầu HTTPS POST gửi đến máy chủ tại endpoint `/api/v1/auth/login`. Mọi dữ liệu truyền tải đều được mã hóa bằng TLS 1.3 để ngăn chặn hành vi nghe lén (Man-in-the-Middle).

3. **Giai đoạn 3 - Xác thực Danh tính & Đối chiếu Mật khẩu BCrypt:**  
   - Hệ thống truy vấn bản ghi tài khoản trong bảng `Users` theo Email hoặc Username.
   - **Kiểm tra trạng thái tài khoản:** Nếu tài khoản có cờ `Status = LOCKED` hoặc `INACTIVE`, hệ thống từ chối ngay lập tức và trả về mã lỗi thông báo tài khoản đang bị khóa hoặc vô hiệu hóa.
   - **Đối chiếu mật khẩu băm:** Hệ thống sử dụng thuật toán kiểm tra mã băm của BCrypt (`BCrypt.checkpw(plainPassword, user.passwordHash)`) để đối sánh mật khẩu vừa nhập với chuỗi băm lưu trong cơ sở dữ liệu. Nhờ cơ chế tự sinh muối (Salt) ngẫu nhiên của BCrypt, hệ thống hoàn toàn miễn nhiễm với tấn công dạng Rainbow Tables. Nếu đối chiếu thất bại, trả về mã thông báo `MSG004` ("Email hoặc mật khẩu không chính xác").

4. **Giai đoạn 4 - Khởi tạo Phiên, Quản lý Giới hạn Thiết bị & Cấp phát JWT:**  
   - Khi thông tin xác thực hoàn toàn hợp lệ, hệ thống kiểm tra số lượng phiên đăng nhập hiện thời của người dùng trên hệ thống lưu trữ đệm Redis (theo quy định tại BR-04).
   - Nếu phát hiện vượt quá số lượng thiết bị cho phép đối với từng vai trò cụ thể, hệ thống sẽ tự động đưa Access Token cũ vào danh sách đen (Blacklist) hoặc thu hồi Refresh Token cũ nhằm ngăn chặn hành vi chia sẻ tài khoản trái phép.
   - Hệ thống tạo cặp mã thông báo JWT có chữ ký số bí mật (sử dụng thuật toán HMAC-SHA256 hoặc RSA-256):
     * **Access Token:** Thời hạn ngắn (15 phút), chứa Payload tối giản gồm `userId`, `role`, `email`, danh sách mã quyền `permissions`.
     * **Refresh Token:** Thời hạn dài (7 ngày), được lưu vào bảng `UserSessions` để cấp phát lại Access Token khi hết hạn.
   - Hệ thống phản hồi mã trạng thái HTTP `200 OK` kèm dữ liệu Token và thông báo `MSG003` ("Đăng nhập thành công. Chào mừng {username}!").
   - Giao diện người dùng nhận dữ liệu, lưu trữ Access Token an toàn và tự động kích hoạt bộ định tuyến để chuyển hướng người dùng về Dashboard tương ứng với Role của họ (BR-02):
     * `Admin` ➔ `/admin/dashboard`
     * `Organizer` ➔ `/organizer/contests`
     * `Judge` ➔ `/judge/workspace`
     * `Participant` ➔ `/participant/contests`

---

### 4.2 Các Quy tắc Nghiệp vụ Đính kèm (Business Rules)

* **BR-01 (Tài khoản Độc nhất):** Mỗi người dùng (Admin, Organizer, Judge, Participant) chỉ sở hữu một tài khoản duy nhất định danh qua Email và Số điện thoại đã xác thực. Không cho phép trùng lặp Email trên toàn hệ thống.
* **BR-02 (Kiểm soát Phân quyền RBAC):** Người dùng chỉ được phép truy cập các màn hình, menu điều hướng và gọi các API endpoint tương ứng với Role và Permission đã được cấp phát. Bất kỳ yêu cầu truy cập trái phép nào đều bị tầng Middleware chặn lại và phản hồi mã lỗi HTTP 403 Forbidden kèm thông báo `MSG005`.
* **BR-04 (Bảo vệ Phiên & Thu hồi Token Tức thì):** Phiên đăng nhập của Giám khảo và Quản trị viên được bảo vệ bằng JWT; khi tài khoản bị khóa (`LOCKED`), mọi token hiện hành lập tức bị thu hồi hiệu lực (Token Revocation) thông qua cơ chế Redis Invalidation, buộc người dùng phải thoát khỏi hệ thống ngay lập tức mà không cần chờ hết hạn token tự nhiên.
* **BR-12 (Chấm Ẩn danh Kép - Double-Blind Judging):** Trong suốt giai đoạn chấm thi, Giám khảo tuyệt đối không được xem Tên, Email, Ảnh đại diện hoặc bất kỳ thông tin định danh nào của thí sinh. Tầng API DTO bắt buộc phải lọc bỏ hoàn toàn các thông tin này trước khi trả về cho Role Judge.
* **BR-13 (Tính Độc lập của Giám khảo):** Một giám khảo không được phép xem điểm số hoặc nhận xét của các giám khảo khác đối với cùng một tác phẩm cho đến khi vòng chấm chính thức khép lại.
* **BR-21 (Xung đột Lợi ích - Conflict of Interest):** Một người dùng đã được gán vai trò Judge hoặc Organizer trong một cuộc thi thì bị hệ thống chặn không cho phép đăng ký làm Participant (nộp bài thi) trong chính cuộc thi đó. Vi phạm quy tắc này sẽ bị cảnh báo bằng mã `MSG022`.

---

### 4.3 Yêu cầu Chung & Yêu cầu Phi Chức năng Liên quan (CR & NFR)

* **CR-03 (Authorization & Blind Guard):** Mọi API endpoint và Route giao diện phải kiểm tra JWT Token, quyền RBAC và áp dụng bộ lọc ẩn danh tự động đối với luồng dữ liệu trả về cho Giám khảo.
* **CR-04 (Audit Logging):** Mọi thao tác Tạo, Cập nhật, Khóa, Mở khóa tài khoản người dùng hoặc thay đổi phân quyền phải được ghi nhận tự động vào bảng `AuditLog` (User ID, Timestamp, Action, Old Value, New Value, Reason).
* **NFR 4.2.5 (Bảo mật Hệ thống - Security Attributes):**
  - **Mã hóa truyền tải:** Bắt buộc 100% kết nối qua giao thức HTTPS (TLS 1.3).
  - **Mã hóa lưu trữ:** Mật khẩu lưu dưới dạng Salted BCrypt Hash với Cost Factor tối thiểu là 10.
  - **Kiểm soát quyền tầng API:** Thực thi Interceptor / Middleware giải mã Token và xác thực quyền hạn trên từng Request trước khi chuyển tới Business Controller.

---

### 4.4 Danh mục Thông báo Hệ thống Liên quan (Application Messages)

| Mã Thông báo | Loại Thông báo (Type) | Ngữ cảnh (Context) | Nội dung Thông báo Hiển thị (Content) |
| :---: | :---: | :---: | :--- |
| **MSG003** | Toast (Success) | Auth | Đăng nhập thành công. Chào mừng {username}! |
| **MSG004** | Inline (Red) | Auth | Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại. |
| **MSG005** | Toast (Error) | Permission | Bạn không có quyền thực hiện thao tác này. / Access denied. |
| **MSG022** | Toast (Error) | Conflict of Interest | Không thể phân công giám khảo này vì tài khoản đang có bài dự thi trong cùng cuộc thi. |
