# Software Requirements Specification (SRS)

**Project:** AI-powered Film Photography Contest Management Platform

## 1. Product Overview (Tổng quan sản phẩm)

Nền tảng Quản lý Cuộc thi Nhiếp ảnh Phim tích hợp Trí tuệ Nhân tạo (FilmContest-AI) là hệ thống Web và Mobile toàn diện được thiết kế nhằm số hóa, chuẩn hóa và tối ưu hóa toàn bộ quy trình vận hành các cuộc thi nhiếp ảnh phim (Analog Photography), từ lập kế hoạch, đăng ký, nộp bài kèm siêu dữ liệu cuộn phim, thẩm định bằng AI, chấm thi ẩn danh đến lưu trữ triển lãm số.

#### 1.1. Operational Environment

- **Platform:** Ứng dụng Web đa nền tảng (Chrome, Edge, Safari, Firefox) dành cho Ban tổ chức, Giám khảo, Quản trị viên và Thí sinh; kết hợp ứng dụng Mobile (iOS/Android) dành cho Thí sinh quản lý nhật ký cuộn phim (Film Roll Log) và theo dõi cuộc thi.
- **Connectivity:** Yêu cầu kết nối Internet ổn định để tải lên ảnh scan độ phân giải cao và đồng bộ kết quả chấm điểm thời gian thực.
- **Infrastructure:** Triển khai trên hạ tầng đám mây với Docker containerization, PostgreSQL (kèm pgvector), Redis (hàng đợi xử lý AI) và Cloud Object Storage (Cloudflare R2 / AWS S3 / Firebase Storage).

### 1.2. Anticipated Users (Người dùng dự kiến)

- **Internal / Management Users:** Quản trị viên hệ thống (Administrator), Ban tổ chức cuộc thi (Contest Organizer), Giám khảo chuyên môn (Judge).
- **External Users:** Thí sinh / Nhiếp ảnh gia phim (Participant), Khách tham quan triển lãm số (Public Visitor).

### 1.3. Constraints & Assumptions (Ràng buộc & Giả định)

- **Đặc thù ảnh phim:** Mọi bài thi bắt buộc phải khai báo siêu dữ liệu vật lý của cuộn phim (Film Stock, Format, Camera, Lens, Frame Number, Developing Lab) và cung cấp ảnh chụp phim âm bản (Negative Strip / Contact Sheet) khi vào vòng chung kết hoặc khi có nghi vấn.
- **Phạm vi AI:** Mô-đun AI đóng vai trò công cụ hỗ trợ thẩm định kỹ thuật (phát hiện ảnh trùng lặp, phát hiện ảnh tạo sinh bởi AI, gợi ý phân loại thẻ). Quyết định loại bài thi cuối cùng thuộc thẩm quyền của Ban tổ chức sau khi đối chiếu âm bản.
- **Bảo mật chấm thi:** Áp dụng nguyên tắc chấm ẩn danh kép (Double-Blind Judging). Giám khảo không được thấy thông tin định danh của thí sinh trong suốt các vòng chấm.

### 1.4. Dependencies (Phụ thuộc hệ thống)

- Phụ thuộc vào dịch vụ lưu trữ đám mây cho tệp ảnh dung lượng lớn (JPEG/TIFF), dịch vụ gửi thông báo Email/Push Notification và Worker xử lý mô hình thị giác máy tính (Computer Vision & Perceptual Hashing).

## 2. User Requirements (Yêu cầu người dùng)

### 2.1. System Actors (Các tác nhân hệ thống)

Hệ thống có 4 tác nhân chính: Administrator, Contest Organizer, Judge và Participant.

#### 2.1.1. Administrator (Quản trị viên)

Chịu trách nhiệm cấu hình hệ thống, quản lý toàn bộ tài khoản người dùng và phân quyền RBAC (Roles/Permissions).

Các trách nhiệm chính:

- Quản lý danh mục dữ liệu gốc (Master Data): Hãng phim, Film Stock, Khổ phim, Máy ảnh, Ống kính và Phòng Lab tráng/scan.
- Giám sát nhật ký hệ thống (Audit Logs).
- Cấu hình các tham số ngưỡng AI.

#### 2.1.2. Contest Organizer (Ban tổ chức cuộc thi)

Đơn vị hoặc cá nhân tổ chức cuộc thi.

Các trách nhiệm chính:

- Khởi tạo và cấu hình cuộc thi.
- Định nghĩa hạng mục dự thi (Categories).
- Thiết lập bộ tiêu chí chấm điểm (Scoring Criteria).
- Quản lý đăng ký của thí sinh.
- Kiểm duyệt bài thi dựa trên cảnh báo AI và yêu cầu bổ sung ảnh âm bản.
- Phân công giám khảo.
- Phê duyệt, công bố kết quả và quản lý triển lãm lưu trữ số.

#### 2.1.3. Judge (Giám khảo)

Giám khảo chuyên môn được mời đánh giá tác phẩm.

Các trách nhiệm chính:

- Truy cập không gian chấm thi ẩn danh.
- Xem tác phẩm độ phân giải cao kèm thông số kỹ thuật phim.
- Chấm điểm theo từng tiêu chí thành phần.
- Viết nhận xét chuyên môn.
- Tham gia các vòng chấm như Sơ khảo và Chung khảo.
- Xác nhận khóa bảng điểm.

#### 2.1.4. Participant (Thí sinh)

Nhiếp ảnh gia phim tham gia cuộc thi.

Các trách nhiệm chính:

- Quản lý hồ sơ cá nhân và portfolio ảnh phim.
- Ghi chép nhật ký cuộn phim (Film Roll & Frame Log).
- Đăng ký cuộc thi.
- Tải lên ảnh dự thi kèm thông số kỹ thuật và ảnh âm bản đối chứng.
- Theo dõi trạng thái kiểm duyệt.
- Nhận kết quả và phản hồi từ giám khảo.

### 2.2. Use Cases (Danh sách ca sử dụng)

#### 2.2.1. Use Case Overview (Tổng quan ca sử dụng)

Theo SRS gốc, hệ thống có 45 Use Cases cốt lõi, được tổ chức theo 4 tác nhân chính:

- **Administrator:** Quản trị tài khoản, phân quyền RBAC, quản lý danh mục dữ liệu gốc và cấu hình hệ thống.
- **Contest Organizer:** Tổ chức cuộc thi, quản lý bài dự thi, kiểm duyệt bằng AI, phân công giám khảo, công bố kết quả và quản lý triển lãm số.
- **Judge:** Xem các bài được phân công trong chế độ ẩn danh, chấm điểm, nhận xét và khóa bảng điểm.
- **Participant:** Đăng ký cuộc thi, quản lý nhật ký cuộn phim, nộp bài, cung cấp ảnh âm bản và xem kết quả.

**Quan hệ giữa các tác nhân và chức năng:**

1. Cả 4 tác nhân đều sử dụng nhóm chức năng xác thực tài khoản (Account Authentication).
2. Administrator quản lý dữ liệu và cấu hình dùng chung cho toàn hệ thống.
3. Contest Organizer tạo cuộc thi và thiết lập quy trình chấm thi.
4. Participant đăng ký, nộp tác phẩm và theo dõi kết quả.
5. Organizer kiểm duyệt tác phẩm trước khi chuyển đến Judge.
6. Judge chấm điểm các tác phẩm được phân công trong chế độ ẩn danh.
7. Organizer phê duyệt và công bố kết quả, sau đó quản lý lưu trữ và triển lãm số.

Phần mô tả này thay thế sơ đồ Use Case Overview trong SRS gốc để các công cụ AI có thể đọc trực tiếp dưới dạng văn bản.

#### 2.2.2. Use Case Descriptions (Mô tả chi tiết các Use Case)

##### Authentication & Administrator Use Cases

| ID | Use Case | Actors | Description |
|---|---|---|---|
| UC-01 | Login / Logout | All Actors | Xác thực người dùng bằng thông tin đăng nhập (JWT) để cấp quyền truy cập vào dashboard theo vai trò và đăng xuất an toàn. |
| UC-02 | Recover Password | All Actors | Cho phép người dùng đặt lại mật khẩu thông qua liên kết xác thực gửi qua email. |
| UC-03 | View & Update Profile | All Actors | Hiển thị và cho phép cập nhật thông tin hồ sơ cá nhân, ảnh đại diện và mật khẩu. |
| UC-04 | Manage User Accounts | Admin | Quản lý vòng đời tài khoản người dùng: tạo mới, xem chi tiết, khóa/mở khóa tài khoản. |
| UC-05 | Manage Roles & Permissions | Admin | Tạo vai trò và gán quyền hạn chi tiết (RBAC) cho từng nhóm người dùng trong hệ thống. |
| UC-06 | Manage Film Stock Catalog | Admin | Quản lý danh mục các loại phim chuẩn: hãng phim, tên Film Stock, ISO danh định, loại phim màu/đen trắng/dương bản. |
| UC-07 | Manage Camera & Lens Catalog | Admin | Quản lý danh mục thiết bị thân máy ảnh phim (Camera Bodies) và ống kính (Lenses). |
| UC-08 | Manage Film Lab Directory | Admin | Quản lý danh sách các phòng Lab tráng và quét phim uy tín trong cộng đồng. |
| UC-09 | Configure AI Thresholds | Admin | Cấu hình ngưỡng cảnh báo xác suất ảnh AI (P_AI) và ngưỡng khoảng cách pHash phát hiện ảnh trùng. |
| UC-10 | View System Audit Logs | Admin | Tra cứu lịch sử thao tác nhạy cảm trên toàn hệ thống: ai làm gì, khi nào, giá trị cũ/mới. |
| UC-11 | Create Contest | Organizer | Khởi tạo cuộc thi mới thông qua quy trình Wizard: thông tin chung, mốc thời gian, thể lệ và giải thưởng. |
| UC-12 | Update Contest Configuration | Organizer | Chỉnh sửa thông tin cuộc thi, điều chỉnh thời hạn nộp bài hoặc quy định khi cuộc thi chưa đóng. |
| UC-13 | Manage Contest Categories | Organizer | Thêm, sửa, xóa hoặc kích hoạt/vô hiệu hóa các bảng thi, hạng mục dự thi. |
| UC-14 | Configure Judging Criteria | Organizer | Thiết lập các tiêu chí chấm điểm và tỷ trọng phần trăm (Weights) cho từng hạng mục thi. |
| UC-15 | Manage Judging Rounds | Organizer | Cấu hình các vòng chấm thi như vòng loại, bán kết, chung kết và số lượng bài đi tiếp. |
| UC-16 | Assign Judges to Categories | Organizer | Phân công giám khảo phụ trách chấm điểm cho từng hạng mục và vòng thi cụ thể. |
| UC-17 | View Participant Registrations | Organizer | Xem danh sách thí sinh đã đăng ký tham gia cuộc thi và trạng thái nộp bài. |
| UC-18 | View Submission Queue | Organizer | Xem danh sách toàn bộ tác phẩm dự thi kèm trạng thái kiểm duyệt và nhãn cảnh báo từ AI. |
| UC-19 | Trigger AI Verification Scan | Organizer | Kích hoạt quét AI hàng loạt hoặc từng bài để kiểm tra trùng lặp, phát hiện ảnh AI và tự động gán thẻ. |
| UC-20 | Review AI Flagged Submissions | Organizer | Kiểm tra các bài thi bị AI gắn cờ cảnh báo, so sánh ảnh nghi trùng lặp hoặc xem bản đồ nhiệt nghi vấn AI. |
| UC-21 | Request Negative / Contact Sheet Proof | Organizer | Yêu cầu thí sinh tải lên ảnh chụp dải phim âm bản gốc để xác minh tính chân thực. |
| UC-22 | Verify & Approve Submission | Organizer | Phê duyệt bài thi hợp lệ về kỹ thuật và xác thực để đưa vào danh sách chấm của giám khảo. |
| UC-23 | Disqualify / Reject Submission | Organizer | Loại bỏ bài thi vi phạm quy chế như ảnh số giả phim, ảnh AI hoặc đạo nhái, kèm lý do bắt buộc. |
| UC-24 | Monitor Judging Progress | Organizer | Theo dõi tiến độ chấm bài của từng giám khảo và phát hiện các bài có độ lệch điểm lớn. |
| UC-25 | Resolve Score Discrepancy | Organizer | Mở phiên điều phối hoặc phúc khảo đối với các bài có điểm chấm chênh lệch vượt ngưỡng quy định. |
| UC-26 | Approve & Publish Results | Organizer | Chốt bảng xếp hạng cuối cùng, gán giải thưởng và công bố kết quả chính thức. |
| UC-27 | Manage Digital Archive & Exhibition | Organizer | Chọn lọc các tác phẩm đạt giải và xuất sắc để đưa vào kho lưu trữ số và phòng triển lãm trực tuyến. |
| UC-28 | Export Contest Analytics Report | Organizer | Xem và xuất báo cáo thống kê cuộc thi như phân bố loại phim, máy ảnh, tỷ lệ cảnh báo AI và tiến độ. |
| UC-29 | View Assigned Submissions | Judge | Xem danh sách các tác phẩm được phân công chấm trong chế độ ẩn danh tác giả (Blind Mode). |
| UC-30 | Inspect High-Res Image & Film Metadata | Judge | Phóng to kiểm tra chi tiết hạt phim (Film Grain), dải sắc độ và xem thông số kỹ thuật chụp, tráng, scan của bức ảnh. |
| UC-31 | Score & Comment on Submission | Judge | Chấm điểm theo từng tiêu chí thành phần và nhập nhận xét chuyên môn cho tác phẩm. |
| UC-32 | Update Evaluation Score | Judge | Chỉnh sửa điểm số và nhận xét của các bài đã chấm khi vòng chấm chưa bị khóa. |
| UC-33 | Lock & Confirm Final Evaluations | Judge | Xác nhận hoàn tất và khóa bảng điểm cá nhân cho vòng thi được giao. |
| UC-34 | Browse & Register for Contests | Participant | Tìm kiếm cuộc thi đang mở, xem thể lệ chi tiết và đăng ký tham gia hạng mục. |
| UC-35 | Manage Film Roll Log | Participant | Tạo và quản lý nhật ký các cuộn phim cá nhân: tên phim, khổ phim, ISO, máy sử dụng, ngày lắp phim và Lab tráng. |
| UC-36 | Manage Frame Metadata | Participant | Ghi chép thông số từng khung hình: ống kính, khẩu độ, tốc độ và ghi chú bối cảnh. |
| UC-37 | Submit Film Photograph | Participant | Nộp bài dự thi bằng cách tải ảnh scan, liên kết hoặc nhập thông số kỹ thuật phim/máy/Lab và khai báo thông tin tác phẩm. |
| UC-38 | Upload Negative / Contact Sheet Proof | Participant | Tải lên ảnh chụp dải phim âm bản có viền mã vạch phim để chứng thực tác phẩm gốc. |
| UC-39 | Edit / Withdraw Submission | Participant | Cập nhật thông tin hoặc rút lại bài dự thi khi vẫn còn trong thời hạn nhận bài. |
| UC-40 | Track Submission Status | Participant | Theo dõi trạng thái bài thi như đã nộp, đang quét AI, cần bổ sung âm bản, đã duyệt chấm hoặc đạt giải. |
| UC-41 | View Contest Results & Judge Feedback | Participant | Xem kết quả chung cuộc, điểm số trung bình và nhận xét từ hội đồng giám khảo cho bài thi của mình. |
| UC-42 | Manage Personal Film Portfolio | Participant | Quản lý bộ sưu tập các tác phẩm ảnh phim cá nhân và lịch sử tham gia các cuộc thi. |
| UC-43 | Explore Digital Archive & Gallery | All Actors | Tham quan kho lưu trữ tác phẩm đạt giải, lọc tác phẩm theo loại phim (ví dụ: Kodak Portra, Ilford HP5), máy ảnh hoặc năm thi. |

## 3. Functional Requirements (Yêu cầu chức năng)

### 3.1. System Functional Overview (Tổng quan chức năng hệ thống)

#### 3.1.1. Web Application Administrator Screen Flow

Luồng màn hình quản trị được mô tả bằng văn bản như sau:

1. Người dùng truy cập trang Home.
2. Administrator đăng nhập thông qua màn hình Login.
3. Sau khi xác thực thành công, hệ thống hiển thị Admin Dashboard.
4. Từ Admin Dashboard, Administrator có thể truy cập các nhóm chức năng:
   - **Account Management:** User Account List, Create / Update User.
   - **Role Management:** Role & Permission List.
   - **Master Data:** Film Stock Catalog, Camera & Lens Catalog, Film Lab Directory.
   - **System Config:** AI Engine Settings, System Audit Logs.

Phần này là mô tả văn bản dựa trên các màn hình được liệt kê trong SRS, thay cho sơ đồ hình ảnh.

#### 3.1.2. Web Application Administrator Screen Description

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | General | Home | Trang chủ giới thiệu nền tảng, danh sách cuộc thi nổi bật và lối vào khu vực đăng nhập. |
| 2 | General | Login | Màn hình xác thực tài khoản dành cho Quản trị viên truy cập hệ thống. |
| 3 | Dashboard | Admin Dashboard | Trung tâm hiển thị số liệu toàn hệ thống: Tổng người dùng, Tổng cuộc thi đang chạy, Số tác phẩm lưu trữ, Trạng thái hàng đợi AI Worker. |
| 4 | Account Management | User Account List | Danh sách toàn bộ tài khoản người dùng (Organizer, Judge, Participant). Hỗ trợ tìm kiếm, lọc theo vai trò và khóa/mở khóa tài khoản. |
| 5 | Account Management | Create / Update User | Biểu mẫu tạo mới tài khoản nội bộ (Admin, Organizer) hoặc cập nhật thông tin người dùng. |
| 6 | Role Management | Role & Permission List | Danh sách các vai trò hệ thống và ma trận gán quyền hạn chi tiết (RBAC) theo từng module. |
| 7 | Master Data | Film Stock Catalog | Quản lý danh mục phim chuẩn hóa (Hãng sản xuất, Tên phim, ISO, Định dạng 35mm/120/LF, Quy trình tráng C-41/BW/E-6/ECN-2). |
| 8 | Master Data | Camera & Lens Catalog | Quản lý cơ sở dữ liệu máy ảnh phim và ống kính để thí sinh chọn nhanh khi nộp bài. |
| 9 | Master Data | Film Lab Directory | Danh sách các phòng Lab tráng/scan phim kèm trạng thái xác thực đối tác. |
| 10 | System Config | AI Engine Settings | Màn hình cấu hình các ngưỡng kỹ thuật cho mô-đun AI (Ngưỡng cảnh báo ảnh AI tạo sinh, Ngưỡng độ tương đồng pHash). |
| 11 | System Config | System Audit Logs | Bảng tra cứu lịch sử thay đổi dữ liệu quan trọng trên toàn hệ thống. |

#### 3.1.3. Web Application Contest Organizer Screen Flow

Luồng màn hình dành cho Contest Organizer được mô tả bằng văn bản như sau:

1. Organizer truy cập Organizer Dashboard để theo dõi tình hình cuộc thi.
2. Từ Dashboard, Organizer có thể truy cập các nhóm chức năng:
   - **Contest Setup:** Contest List, Create Contest Wizard, Category & Criteria Config.
   - **Moderation:** Submission Queue, AI Verification Report, Submission Review Detail.
   - **Judging Management:** Judge Assignment, Judging Progress & Discrepancy.
   - **Results & Archive:** Leaderboard & Award Approval, Archive & Exhibition Manager.
   - **Analytics:** Contest Analytics Report.
3. Khi tạo cuộc thi, Organizer thực hiện quy trình 4 bước:
   - Bước 1: Thông tin chung và thể lệ.
   - Bước 2: Hạng mục dự thi.
   - Bước 3: Tiêu chí chấm và trọng số.
   - Bước 4: Cơ cấu giải thưởng.
4. Trong quá trình tổ chức, Organizer quản lý bài dự thi, xem báo cáo AI và quyết định duyệt, yêu cầu bổ sung âm bản hoặc loại bài.
5. Sau khi giám khảo hoàn tất chấm điểm, Organizer rà soát bảng xếp hạng, gán giải thưởng, công bố kết quả và quản lý triển lãm số.

Phần này là mô tả văn bản dựa trên các màn hình và chức năng trong SRS, thay thế sơ đồ hình ảnh.

#### 3.1.4. Web Application Contest Organizer Screen Description

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | Dashboard | Organizer Dashboard | Hiển thị các chỉ số KPI của cuộc thi: Số lượng thí sinh đăng ký, Số bài đã nộp, Số bài bị AI gắn cờ cảnh báo, Tiến độ chấm điểm của giám khảo. |
| 2 | Contest Setup | Contest List | Danh sách các cuộc thi do Organizer quản lý kèm trạng thái (Draft, Open, Verifying, Judging, Published, Archived). |
| 3 | Contest Setup | Create Contest Wizard | Giao diện 4 bước khởi tạo cuộc thi: (1) Thông tin chung & Thể lệ → (2) Hạng mục dự thi → (3) Tiêu chí chấm & Trọng số → (4) Cơ cấu giải thưởng. |
| 4 | Contest Setup | Category & Criteria Config | Thiết lập chi tiết từng bảng thi, giới hạn số bài nộp và cấu hình thang điểm tiêu chí đặc thù ảnh phim. |
| 5 | Moderation | Submission Queue | Danh sách toàn bộ bài thi đã nộp. Hỗ trợ lọc theo trạng thái kiểm duyệt, hạng mục và mức độ rủi ro AI (Clean, Warning, High Risk). |
| 6 | Moderation | AI Verification Report | Giao diện đối chiếu trực quan các bài bị AI phát hiện: Hiển thị song song 2 bức ảnh nghi trùng lặp (kèm điểm pHash) hoặc điểm xác suất ảnh do AI tạo ra. |
| 7 | Moderation | Submission Review Detail | Xem chi tiết bài thi, thông số kỹ thuật phim, ảnh chụp âm bản (Negative Strip) và thực hiện thao tác: Duyệt, Yêu cầu bổ sung âm bản hoặc Loại bài. |
| 8 | Judging Mgmt | Judge Assignment | Quản lý danh sách giám khảo khách mời và phân bổ giám khảo vào từng hạng mục/vòng chấm. |
| 9 | Judging Mgmt | Judging Progress & Discrepancy | Theo dõi tỷ lệ hoàn thành chấm bài của từng giám khảo và danh sách các bài thi bị lệch điểm quá lớn (Score Variance Alert) cần điều phối. |
| 10 | Results & Archive | Leaderboard & Award Approval | Bảng xếp hạng điểm trung bình tự động tổng hợp từ các giám khảo. Cho phép Organizer rà soát lần cuối, gán giải thưởng và công bố kết quả. |
| 11 | Results & Archive | Archive & Exhibition Manager | Quản lý việc chuyển các tác phẩm đạt giải vào Kho lưu trữ số dài hạn và xuất bản phòng triển lãm trực tuyến. |
| 12 | Analytics | Contest Analytics Report | Biểu đồ thống kê chuyên sâu: Top Film Stock được sử dụng nhiều nhất, tỷ lệ khổ phim (35mm so với 120), thống kê theo Lab tráng và báo cáo chất lượng bài thi. |

#### 3.1.5. Web Application Judge Screen Flow

Luồng màn hình dành cho Judge (Giám khảo) được mô tả bằng văn bản như sau:

1. Giám khảo truy cập Judge Dashboard để xem các cuộc thi và vòng chấm được phân công.
2. Từ Dashboard, giám khảo truy cập Blind Judging Gallery để xem danh sách tác phẩm cần chấm.
3. Trong Blind Judging Gallery, hệ thống chỉ hiển thị mã bài thi và hình thu nhỏ, không hiển thị thông tin định danh thí sinh.
4. Giám khảo mở Lightbox Evaluation Workspace để xem ảnh độ phân giải cao, kiểm tra hạt phim (Film Grain), thông số Film/Camera/Lens và chấm điểm theo từng tiêu chí.
5. Sau khi chấm, giám khảo truy cập Evaluation Summary để xem lại các bài đã đánh giá, điều chỉnh điểm nếu còn được phép và xác nhận khóa bảng điểm cuối cùng.

Phần này là mô tả văn bản dựa trên các màn hình và chức năng trong SRS, thay thế sơ đồ hình ảnh.

#### 3.1.6. Web Application Judge Screen Description

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | Dashboard | Judge Dashboard | Hiển thị các cuộc thi và vòng chấm được phân công, thời hạn hoàn thành chấm và số lượng bài đã chấm / còn lại. |
| 2 | Judging | Blind Judging Gallery | Lưới hiển thị các tác phẩm cần chấm ở chế độ ẩn danh hoàn toàn (chỉ hiện mã bài thi và hình thu nhỏ, ẩn mọi thông tin thí sinh). |
| 3 | Judging | Lightbox Evaluation Workspace | Không gian chấm điểm chuyên dụng nền tối chuẩn màu: Tích hợp kính lúp phóng đại kiểm tra hạt phim (Film Grain), xem thông số Film/Camera/Lens và thanh trượt chấm điểm theo tiêu chí. |
| 4 | Judging | Evaluation Summary | Bảng tổng hợp các bài giám khảo đã chấm, cho phép lọc nhanh các bài điểm cao nhất/thấp nhất, điều chỉnh điểm và khóa bảng điểm cuối cùng. |

#### 3.1.7. Web & Mobile Application Participant Screen Flow

Luồng màn hình dành cho Participant (Thí sinh) được mô tả bằng văn bản như sau:

1. Thí sinh truy cập Participant Dashboard để theo dõi các cuộc thi đang tham gia, thời hạn nộp bài và thông báo mới.
2. Từ Dashboard, thí sinh có thể truy cập các nhóm chức năng:
   - **Contests:** Contest Discovery & Details.
   - **Analog Logbook:** My Film Rolls, Roll Frame Details.
   - **Submission:** Submit Photograph Wizard, My Submissions List, Upload Negative Proof.
   - **Results:** Contest Results & Feedback.
   - **Portfolio:** Personal Analog Portfolio.
3. Thí sinh tìm kiếm cuộc thi, xem thể lệ và đăng ký tham gia.
4. Thí sinh quản lý nhật ký cuộn phim (Film Roll Log) và thông số từng khung hình (Frame Metadata).
5. Khi nộp tác phẩm, thí sinh thực hiện các bước:
   - Bước 1: Chọn hạng mục dự thi.
   - Bước 2: Tải lên ảnh scan chất lượng cao.
   - Bước 3: Gắn thông số từ Film Roll Log hoặc nhập mới.
   - Bước 4: Đính kèm ảnh âm bản.
   - Bước 5: Xác nhận nộp bài.
6. Sau khi nộp, thí sinh theo dõi trạng thái bài thi tại My Submissions List.
7. Nếu Ban tổ chức yêu cầu xác minh, thí sinh sử dụng Upload Negative Proof để bổ sung ảnh âm bản hoặc Contact Sheet.
8. Khi cuộc thi công bố kết quả, thí sinh xem thứ hạng, điểm số và nhận xét của giám khảo.
9. Thí sinh quản lý các tác phẩm của mình tại Personal Analog Portfolio.

Phần này là mô tả văn bản dựa trên các màn hình và chức năng trong SRS, thay thế sơ đồ hình ảnh.

#### 3.1.8. Web & Mobile Application Participant Screen Description

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | Dashboard | Participant Dashboard | Tổng quan các cuộc thi đang tham gia, thông báo nhắc hạn nộp bài, cảnh báo yêu cầu bổ sung ảnh âm bản và kết quả mới công bố. |
| 2 | Contests | Contest Discovery & Details | Danh sách các cuộc thi nhiếp ảnh phim đang mở, thể lệ chi tiết, cơ cấu giải thưởng và nút Đăng ký tham gia. |
| 3 | Analog Logbook | My Film Rolls | Sổ tay quản lý các cuộn phim của nhiếp ảnh gia (Mã cuộn, Loại phim, Khổ phim, ISO chụp, Máy ảnh, Phòng Lab tráng, Ngày tráng). |
| 4 | Analog Logbook | Roll Frame Details | Danh sách các khung hình (Frame 01–36) trong một cuộn phim kèm ghi chú ống kính, thông số phơi sáng và ảnh scan tương ứng. |
| 5 | Submission | Submit Photograph Wizard | Giao diện nộp tác phẩm dự thi: Chọn hạng mục → Tải ảnh scan chất lượng cao → Gắn thông số từ Film Roll Log (hoặc nhập mới) → Đính kèm ảnh âm bản → Xác nhận nộp. |
| 6 | Submission | My Submissions List | Danh sách các bài thi đã nộp kèm trạng thái kiểm duyệt trực quan (Submitted, AI Verified, Proof Requested, Approved for Judging, Disqualified). |
| 7 | Submission | Upload Negative Proof | Màn hình chuyên biệt để thí sinh tải lên ảnh chụp dải phim âm bản gốc hoặc Contact Sheet khi bài thi lọt vào chung kết hoặc cần xác minh. |
| 8 | Results | Contest Results & Feedback | Hiển thị thứ hạng đạt được, điểm số chi tiết từng tiêu chí và lời bình chuyên môn từ các giám khảo sau khi cuộc thi công bố kết quả. |
| 9 | Portfolio | Personal Analog Portfolio | Trang hồ sơ nghệ thuật cá nhân trưng bày các tác phẩm ảnh phim đã tham dự và đạt giải, phân loại theo loại phim và thiết bị. |

#### 3.1.9. Screen Authorization Matrix (Ma trận phân quyền màn hình)

Ma trận phân quyền xác định các thao tác mà từng vai trò được phép thực hiện đối với các nhóm chức năng Web/Mobile của hệ thống.

**Ký hiệu thao tác:**

- **C (Create):** Tạo mới.
- **R (Read):** Xem hoặc truy xuất dữ liệu.
- **U (Update):** Cập nhật dữ liệu.
- **D (Delete):** Xóa dữ liệu.
- **A (Approve/Verify):** Phê duyệt hoặc xác minh.
- **E (Execute):** Thực thi chức năng.

**Ký hiệu phân quyền:**

- **✓:** Được phép thực hiện các thao tác được quy định cho nhóm chức năng.
- **R:** Chỉ có quyền xem.
- **-:** Không có quyền truy cập.
- **Own:** Chỉ được thao tác với dữ liệu của chính mình.
- **Assigned:** Chỉ được thao tác với dữ liệu được phân công.
- **Summary:** Chỉ được xem thông tin tổng hợp.

| # | Web / Mobile Module & Screen | Typical Actions | Admin | Organizer | Judge | Participant |
|---|---|---|---|---|---|---|
| 1 | Authentication (Login/Logout/Change PW) | C-R-U | ✓ | ✓ | ✓ | ✓ |
| 2 | Own Profile Management | R-U | ✓ | ✓ | ✓ | ✓ |
| 3 | User Account Management | C-R-U-D | ✓ | R | - | - |
| 4 | Role & Permission Configuration | C-R-U-D | ✓ | - | - | - |
| 5 | Analog Master Data (Film, Camera, Lab) | C-R-U-D | ✓ | R | R | R |
| 6 | AI Threshold & System Configuration | R-U | ✓ | R | - | - |
| 7 | Contest & Category Management | C-R-U-D | R | ✓ | R | R |
| 8 | Scoring Criteria & Judge Assignment | C-R-U-D | R | ✓ | R (Own) | R |
| 9 | Film Roll & Frame Logbook | C-R-U-D | - | - | - | ✓ (Own) |
| 10 | Contest Submission & Negative Upload | C-R-U | R | R | - | ✓ (Own) |
| 11 | AI Verification Pipeline & Reports | R-E-A | R | ✓ | - | - |
| 12 | Submission Moderation (Approve/Disqualify) | R-U-A | R | ✓ | - | R (Own Status) |
| 13 | Blind Judging Workspace & Scoring | C-R-U | - | R (Summary) | ✓ (Assigned) | - |
| 14 | Leaderboard, Award & Result Publication | C-R-U-A | R | ✓ | R | R |
| 15 | Digital Archive & Online Exhibition | C-R-U-D | ✓ | ✓ | R | R |

**Lưu ý về phân quyền:**

- Administrator có quyền quản trị tài khoản, vai trò, danh mục dữ liệu gốc và cấu hình hệ thống.
- Organizer có quyền tổ chức cuộc thi, kiểm duyệt bài dự thi, quản lý chấm thi và công bố kết quả.
- Judge chỉ được chấm các bài được phân công và phải tuân thủ nguyên tắc chấm thi ẩn danh.
- Participant chỉ được quản lý nhật ký phim, bài dự thi và dữ liệu cá nhân của mình.
- Các quyền thực tế phải được kiểm tra tại Backend, không chỉ dựa vào việc ẩn hoặc hiện màn hình trên giao diện.

#### 3.1.10. Non-screen Functions (Các chức năng chạy ngầm không giao diện)

Các chức năng chạy ngầm là những tác vụ được hệ thống tự động thực hiện mà không yêu cầu người dùng thao tác trực tiếp trên giao diện.

| # | Feature | System Function | Description |
|---|---|---|---|
| 1 | AI Verification Worker | Asynchronous Image Analysis Pipeline | Khi thí sinh nộp bài thi mới (SUBMITTED), Background Worker tự động kéo ảnh từ Cloud Storage để chạy 3 tác vụ: (1) Tính toán mã băm 64-bit Perceptual Hash (pHash) và so khớp khoảng cách Hamming với kho ảnh để tìm ảnh trùng; (2) Đưa qua mô hình Deep Learning tính xác suất ảnh do AI tạo sinh (P_AI); (3) Trích xuất thẻ phân loại nội dung ảnh tự động. |
| 2 | Contest Lifecycle Cronjob | Automated Phase Transition | Hệ thống chạy Cronjob mỗi phút để kiểm tra thời gian hệ thống so với cấu hình cuộc thi: Tự động mở nhận bài khi đến giờ Submission Start, tự động khóa cổng nộp bài và hủy các bản nháp (Draft) khi điểm Submission Deadline chạm mốc 00:00:00. |
| 3 | Email & Notification Dispatcher | Event-driven Alerts | Tự động gửi Email và In-app Notification khi: (1) Thí sinh nộp bài thành công; (2) Bài thi bị yêu cầu bổ sung ảnh âm bản (kèm hạn chót 48 giờ); (3) Nhắc nhở Giám khảo hoàn thành chấm bài trước hạn 24 giờ; (4) Thông báo khi kết quả cuộc thi chính thức được công bố. |
| 4 | Archive Image Processor | Watermark & Resolution Generator | Khi tác phẩm được đưa vào Kho lưu trữ số (Digital Archive), hệ thống tự động sinh bản ảnh xem trước chuẩn WebP (độ phân giải tối ưu và đóng dấu bản quyền cuộc thi), đồng thời bảo toàn tệp ảnh gốc Master ở bucket riêng biệt. |

**Tóm tắt chức năng:**

- **AI Verification Worker:** Phân tích ảnh dự thi, phát hiện ảnh trùng lặp, đánh giá khả năng ảnh do AI tạo sinh và phân loại nội dung.
- **Contest Lifecycle Cronjob:** Tự động chuyển trạng thái nhận bài theo thời gian cấu hình của cuộc thi.
- **Email & Notification Dispatcher:** Gửi thông báo khi phát sinh các sự kiện quan trọng.
- **Archive Image Processor:** Tạo ảnh xem trước có watermark và bảo quản ảnh gốc trong kho lưu trữ.

#### 3.1.11. Entity Relationship Diagram (Sơ đồ Thực thể Liên kết - ERD Overview)

Phần này mô tả tổng quan các nhóm dữ liệu chính của hệ thống AI-powered Film Photography Contest Management Platform dưới dạng văn bản để hỗ trợ AI đọc và phân tích yêu cầu.

**1. User & Role Management**

Quản lý tài khoản người dùng và phân quyền truy cập hệ thống.

- User: Lưu thông tin tài khoản, trạng thái và thông tin hồ sơ.
- Role: Xác định vai trò Administrator, Organizer, Judge hoặc Participant.
- Permission: Xác định các quyền thao tác đối với từng chức năng.

**2. Contest Management**

Quản lý các cuộc thi nhiếp ảnh phim và cấu hình liên quan.

- Contest: Lưu thông tin cuộc thi, thể lệ, thời gian và trạng thái.
- Category: Lưu các hạng mục dự thi thuộc cuộc thi.
- Scoring Criteria: Lưu tiêu chí và trọng số chấm điểm.
- Judge Assignment: Quản lý việc phân công giám khảo vào cuộc thi hoặc vòng chấm.

**3. Analog Photography Data**

Quản lý dữ liệu đặc thù của nhiếp ảnh phim.

- Film Stock: Danh mục các loại phim.
- Camera & Lens: Danh mục máy ảnh và ống kính.
- Film Lab: Danh mục phòng Lab tráng và quét phim.
- Film Roll: Thông tin cuộn phim của thí sinh.
- Frame: Thông tin từng khung hình trong cuộn phim.

**4. Submission & Verification**

Quản lý bài dự thi và quá trình xác minh.

- Submission: Lưu thông tin tác phẩm dự thi, người nộp và hạng mục.
- Film Metadata: Lưu thông số kỹ thuật liên quan đến tác phẩm.
- Negative Proof: Lưu thông tin ảnh âm bản hoặc bằng chứng xác minh.
- AI Verification: Lưu kết quả phân tích ảnh, phát hiện trùng lặp và cảnh báo AI.

**5. Judging & Results**

Quản lý quá trình chấm thi và công bố kết quả.

- Evaluation: Lưu điểm số và nhận xét của giám khảo.
- Award: Lưu thông tin giải thưởng.
- Contest Result: Lưu kết quả và thứ hạng của tác phẩm.

**6. Digital Archive**

Quản lý việc lưu trữ và trưng bày các tác phẩm sau cuộc thi.

- Digital Archive: Quản lý tác phẩm được lưu trữ lâu dài.
- Exhibition: Quản lý việc trưng bày tác phẩm trên triển lãm trực tuyến.

**Các mối quan hệ nghiệp vụ tổng quan:**

- Một cuộc thi có thể có nhiều hạng mục dự thi.
- Một hạng mục có thể nhận nhiều bài dự thi.
- Một thí sinh có thể quản lý nhiều cuộn phim và nộp nhiều tác phẩm.
- Một cuộn phim có thể chứa nhiều khung hình.
- Một bài dự thi thuộc một hạng mục và có thể gắn với dữ liệu phim, ảnh âm bản và kết quả xác minh.
- Một giám khảo có thể được phân công chấm nhiều bài dự thi.
- Một bài dự thi có thể nhận đánh giá từ nhiều giám khảo.
- Các tác phẩm đạt giải có thể được đưa vào kho lưu trữ số và triển lãm trực tuyến.

**Lưu ý:** Đây là bản mô tả khái niệm dựa trên các chức năng trong SRS, không phải bản chuyển đổi chính xác toàn bộ thực thể, khóa chính, khóa ngoại và quan hệ của sơ đồ ERD gốc. Khi triển khai cơ sở dữ liệu, cần đối chiếu với ERD và database schema chính thức của dự án.

### 3.2. Web & Mobile Application Detailed Functional Specifications

#### 3.2.1. Authenticate Users (Xác thực người dùng)

**Function trigger:**

Người dùng truy cập đường dẫn hệ thống hoặc mở ứng dụng và chọn "Đăng nhập".

**Function description:**

- **Actors/Roles:** System Admin, Contest Organizer, Judge, Participant.
- **Purpose:** Xác minh danh tính người dùng, cấp phát JWT Access/Refresh Token và điều hướng tới không gian làm việc tương ứng với vai trò (BR-02).

**Data processing:**

1. Người dùng nhập Email/Username và Mật khẩu.
2. Hệ thống gửi thông tin xác thực qua HTTPS tới Authentication API.
3. Hệ thống kiểm tra trạng thái tài khoản (Active/Locked) và đối chiếu mật khẩu băm (BCrypt).
4. Nếu hợp lệ, hệ thống khởi tạo phiên đăng nhập, vô hiệu hóa phiên cũ nếu vượt giới hạn thiết bị (BR-04), sau đó chuyển hướng người dùng về Dashboard theo Role.

**Business rules:** BR-01, BR-02, BR-04.

---

#### 3.2.2. Manage Analog Master Data (Quản lý danh mục dữ liệu gốc Ảnh Phim)

##### 3.2.2.1. View & Manage Film Stock Catalog

**Function trigger:**

Admin chọn "Master Data" > "Film Stocks" trên thanh điều hướng.

**Function description:**

- **Actors/Roles:** System Admin (C-R-U-D), các vai trò khác (Read-only).
- **Purpose:** Quản lý danh mục chuẩn hóa các loại phim nhiếp ảnh trên thế giới nhằm đảm bảo tính đồng nhất dữ liệu khi thí sinh khai báo bài thi và phục vụ thống kê.

**Data processing:**

1. Hiển thị các thẻ thống kê:
   - Tổng số loại phim.
   - Phim âm bản màu (Color Negative – C41).
   - Phim đen trắng (B&W).
   - Phim dương bản (Slide – E6).
   - Phim điện ảnh (Cine – ECN2).
2. Hiển thị danh sách phim với các trường:
   - Mã phim (FILM_CODE).
   - Tên phim (ví dụ: Kodak Portra 400).
   - Hãng sản xuất (Kodak, Fujifilm, Ilford, Harman, Cinestill...).
   - Độ nhạy sáng danh định (Box Speed ISO).
   - Khổ phim hỗ trợ (35mm, 120, 4x5).
   - Trạng thái (Active/Discontinued).
3. Khi thêm mới hoặc cập nhật, hệ thống kiểm tra tính duy nhất của tổ hợp Tên phim + Hãng + ISO (BR-02).
4. Khi xóa, hệ thống chỉ thực hiện xóa mềm (Soft Delete – BR-03) để không làm ảnh hưởng các bài thi lịch sử đã liên kết với loại phim.

**Business rules:** BR-02, BR-03, BR-07.

##### 3.2.2.2. View & Manage Film Lab Directory

**Function trigger:**

Admin chọn "Master Data" > "Film Labs".

**Function description:**

- **Actors/Roles:** System Admin.
- **Purpose:** Quản lý danh sách các phòng Lab tráng và quét phim để thí sinh liên kết nguồn gốc xử lý hậu kỳ.

**Data processing:**

1. Lưu trữ thông tin Lab:
   - Mã Lab.
   - Tên phòng Lab.
   - Thành phố/Quốc gia.
   - Dịch vụ cung cấp (Tráng C-41, B&W, E-6, ECN-2).
   - Các dòng máy Scan sở hữu (Noritsu, Frontier, Hasselblad Flextight, DSLR Scan).
2. Cho phép đánh dấu "Verified Partner Lab" hoặc vô hiệu hóa Lab ngừng hoạt động.

**Business rules:** BR-02, BR-03.

#### 3.2.3. Manage Contests & Categories (Quản lý Cuộc thi & Hạng mục)

##### 3.2.3.1. View Contest List

**Function trigger:**

Organizer chọn "Contest Management" > "Contests".

**Function description:**

- **Actors/Roles:** Contest Organizer, System Admin.
- **Purpose:** Theo dõi toàn bộ các cuộc thi, trạng thái vận hành và truy cập nhanh vào cấu hình từng cuộc thi.

**Data processing:**

1. Hiển thị các thẻ thống kê:
   - Tổng số cuộc thi.
   - Đang mở nhận bài (OPEN).
   - Đang thẩm định và chấm (IN_JUDGING).
   - Đã kết thúc (COMPLETED).
2. Hiển thị bảng danh sách cuộc thi với các trường:
   - Mã cuộc thi.
   - Tên cuộc thi.
   - Thời gian nhận bài.
   - Thời gian chấm.
   - Số bài đã nộp.
   - Trạng thái.
   - Thao tác.

**Business rules:** BR-02, BR-03.

---

##### 3.2.3.2. Create & Configure Contest (4-Step Wizard)

**Function trigger:**

Organizer nhấn nút "+ Create Contest".

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Thiết lập một cuộc thi ảnh phim mới với đầy đủ quy tắc thời gian, hạng mục, tiêu chí chấm và yêu cầu xác thực.

**Data processing:**

**Bước 1: Thông tin chung & Lịch trình**

- Nhập tên cuộc thi.
- Nhập chủ đề.
- Nhập thể lệ chi tiết.
- Tải lên ảnh bìa.
- Thiết lập 4 mốc thời gian theo thứ tự:

  `Registration Start < Submission Deadline < Judging Deadline < Result Publication Date`

- Hệ thống kiểm tra thứ tự thời gian theo BR-08.

**Bước 2: Thiết lập Hạng mục (Categories)**

- Tạo các hạng mục dự thi, ví dụ:
  - Đời thường 35mm.
  - Chân dung Đen Trắng.
- Cấu hình số lượng bài dự thi tối đa mà mỗi thí sinh được phép nộp trong từng hạng mục (ví dụ: tối đa 3 ảnh/hạng mục).
- Thiết lập quy định nộp ảnh âm bản:
  - Bắt buộc nộp ngay từ đầu.
  - Hoặc chỉ yêu cầu khi tác phẩm vào vòng chung kết.
- Áp dụng quy tắc BR-06.

**Bước 3: Cấu hình Tiêu chí chấm điểm (Scoring Criteria)**

- Thiết lập các tiêu chí chấm điểm, chẳng hạn:
  - Bố cục & Sáng tạo.
  - Kỹ thuật phơi sáng.
  - Sắc độ & Hạt phim.
  - Câu chuyện.
- Gán trọng số phần trăm cho từng tiêu chí.
- Tổng trọng số của các tiêu chí trong một hạng mục phải bằng đúng **100%** theo BR-15.

**Bước 4: Cơ cấu Giải thưởng & Xác nhận**

- Định nghĩa các giải thưởng:
  - Giải Nhất.
  - Giải Nhì.
  - Giải Ba.
  - Giải Yêu thích.
- Lưu cuộc thi ở trạng thái `DRAFT` hoặc xuất bản sang trạng thái `PUBLISHED`.

**Business rules:** BR-06, BR-08, BR-15.

#### 3.2.4. Manage Film Roll Log & Submissions (Quản lý Cuộn phim & Nộp bài dự thi)

##### 3.2.4.1. Manage Personal Film Roll & Frame Logbook

**Function trigger:**

Participant chọn "Film Logbook" > "My Film Rolls".

**Function description:**

- **Actors/Roles:** Participant.
- **Purpose:** Giúp nhiếp ảnh gia lưu trữ nhật ký các cuộn phim đã chụp và tái sử dụng thông số chính xác khi nộp bài thi.

**Data processing:**

1. **Tạo cuộn phim (Create Film Roll):**
   - Chọn Film Stock từ danh mục.
   - Chọn khổ phim (35mm, 120, 4x5).
   - Nhập ISO thực tế khi chụp (Push/Pull).
   - Chọn máy ảnh sử dụng.
   - Nhập ngày bắt đầu chụp, ngày tráng và phòng Lab tráng.

2. **Ghi nhật ký khung hình (Frame Logging):**
   - Thêm các frame vào cuộn phim.
   - Nhập số thứ tự Frame.
   - Nhập thông tin ống kính.
   - Nhập khẩu độ.
   - Nhập tốc độ màn trập.
   - Nhập địa điểm chụp.

3. **Kiểm tra ràng buộc vật lý:**
   - Hệ thống ngăn số thứ tự frame vượt quá giới hạn của khổ phim.
   - Phim 135/35mm: Tối đa 39 frame.
   - Phim 120 khổ 6x4.5: Tối đa 16 frame.
   - Áp dụng quy tắc BR-04.

**Business rules:** BR-03, BR-04.

---

##### 3.2.4.2. Submit Film Photograph to Contest

**Function trigger:**

Participant nhấn "+ Submit Entry" trong trang chi tiết cuộc thi.

**Function description:**

- **Actors/Roles:** Participant.
- **Purpose:** Tải lên tác phẩm ảnh phim dự thi kèm đầy đủ siêu dữ liệu kỹ thuật và bằng chứng xác thực.

**Data processing:**

**Bước 1: Chọn Hạng mục & Tải ảnh Scan**

- Chọn hạng mục dự thi.
- Tải lên tệp ảnh scan kỹ thuật số.
- Hệ thống kiểm tra các điều kiện:
  - Định dạng: JPG/JPEG/TIFF.
  - Dung lượng tối đa: 25MB.
  - Chiều ngắn nhất của ảnh: Tối thiểu 2000px.
- Áp dụng quy tắc BR-07.

**Bước 2: Khai báo Siêu dữ liệu Nhiếp ảnh Phim**

Thí sinh có thể lấy thông tin từ Film Roll Logbook hoặc nhập trực tiếp các trường bắt buộc:

- Film Stock.
- Khổ phim.
- ISO chụp.
- Thân máy (Camera Body).
- Ống kính (Lens).
- Số khung hình (Frame Number).
- Phòng Lab tráng/scan hoặc quy trình Home Dev.
- Máy Scan.

**Bước 3: Tải ảnh Âm bản & Thông điệp**

- Nhập tên tác phẩm.
- Nhập hoàn cảnh sáng tác (Artist Statement).
- Đính kèm ảnh chụp dải phim âm bản (Negative Strip) nếu hạng mục yêu cầu bắt buộc theo BR-06.

**Bước 4: Kiểm tra hợp lệ & Lưu**

Hệ thống thực hiện các bước kiểm tra:

1. Hạn nộp bài vẫn còn hiệu lực (BR-08).
2. Thí sinh chưa vượt quá số lượng bài nộp tối đa của hạng mục.
3. Không trùng lặp cặp (Film Roll + Frame Number) trong cùng cuộc thi (BR-05).
4. Nếu hợp lệ, hệ thống:
   - Tạo mã bài dự thi theo định dạng `SUB-YYYY-XXXX`.
   - Lưu bài dự thi với trạng thái `SUBMITTED`.
   - Đẩy sự kiện vào hàng đợi quét AI.

**Business rules:** BR-03, BR-04, BR-05, BR-06, BR-07, BR-08.

---

##### 3.2.4.3. Upload Negative / Contact Sheet Proof

**Function trigger:**

Participant nhận được yêu cầu xác thực với trạng thái `PROOF_REQUESTED` và nhấn "Upload Negative Proof".

**Function description:**

- **Actors/Roles:** Participant.
- **Purpose:** Cung cấp bằng chứng vật lý để chứng minh bức ảnh được chụp bằng phim thật, không phải ảnh kỹ thuật số giả màu phim hoặc ảnh AI.

**Data processing:**

1. Thí sinh tải lên từ 1 đến 3 ảnh chụp rõ dải phim âm bản.
2. Ảnh phải hiển thị:
   - Khung hình dự thi.
   - Phần rìa phim (Rebate Edge).
   - Mã vạch hãng phim và số thứ tự frame trên rìa phim.
3. Hệ thống cập nhật trạng thái bài thi sang `PROOF_SUBMITTED`.
4. Hệ thống thông báo ngay cho Ban tổ chức để tiến hành thẩm định.

**Business rules:** BR-06, BR-19.

#### 3.2.5. AI Verification & Submission Moderation (Thẩm định AI & Kiểm duyệt bài thi)

##### 3.2.5.1. View Submission Queue & AI Risk Dashboard

**Function trigger:**

Organizer chọn "Moderation" > "Submission Queue".

**Function description:**

- **Actors/Roles:** Contest Organizer, System Admin.
- **Purpose:** Giám sát toàn bộ bài dự thi và lọc nhanh các bài có dấu hiệu bất thường do AI phát hiện.

**Data processing:**

1. Hiển thị các thẻ tổng hợp:
   - Tổng số bài nộp.
   - Đã qua AI kiểm tra an toàn (`AI_CLEAN`).
   - Cảnh báo nghi vấn (`AI_FLAGGED`).
   - Đang chờ bổ sung âm bản (`PROOF_PENDING`).
   - Đã duyệt vào vòng chấm (`APPROVED_FOR_JUDGING`).
   - Đã loại (`DISQUALIFIED`).

2. Hiển thị bảng dữ liệu với các trường:
   - Mã bài thi.
   - Ảnh thu nhỏ.
   - Hạng mục.
   - Loại phim.
   - Điểm xác suất AI (`P_AI %`).
   - Độ tương đồng cao nhất (`Max Similarity %`).
   - Thẻ phân loại tự động (`Auto Tags`).
   - Trạng thái.

**Business rules:** BR-09, BR-10, BR-11.

---

##### 3.2.5.2. Inspect AI Verification Report (Duplicate & AI-Generated Check)

**Function trigger:**

Organizer nhấn vào bài thi có trạng thái `AI_FLAGGED`.

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Xem chi tiết bằng chứng kỹ thuật từ mô-đun AI để đưa ra quyết định xử lý chính xác.

**Data processing:**

**Tab 1: Phát hiện ảnh tạo sinh bởi AI (AI-Generated Analysis)**

1. Hiển thị chỉ số `P_AI` trong khoảng từ 0 đến 100%.
2. Nếu `P_AI >= 75%`, hệ thống gắn nhãn đỏ `HIGH RISK - AI SUSPECT` theo BR-09.
3. Hiển thị các bất thường về cấu trúc hạt phim nhân tạo hoặc chi tiết quang học phi vật lý.

**Tab 2: Phát hiện trùng lặp & Đạo nhái (Image Similarity & pHash)**

1. Kiểm tra ảnh dự thi với các ảnh khác trong hệ thống.
2. Nếu khoảng cách Hamming của pHash nhỏ hơn hoặc bằng 5, hoặc Cosine Similarity lớn hơn hoặc bằng 92%, hệ thống hiển thị chế độ `Side-by-Side Comparison`.
3. Chế độ so sánh hiển thị:
   - Hai bức ảnh đặt cạnh nhau.
   - Thông tin người nộp.
   - Thời gian nộp của từng bài.
4. Áp dụng quy tắc BR-10.

**Tab 3: Đối chiếu Siêu dữ liệu & Âm bản (Metadata & Negative Inspection)**

1. Hiển thị ảnh dự thi đặt cạnh ảnh chụp dải phim âm bản.
2. Cung cấp công cụ `Invert Negative Preview` ngay trên trình duyệt.
3. Organizer sử dụng công cụ này để đối chiếu khung hình trên ảnh âm bản với tác phẩm dự thi.

**Business rules:** BR-09, BR-10, BR-11, BR-19.

---

##### 3.2.5.3. Process Moderation Decision (Approve / Request Proof / Disqualify)

**Function trigger:**

Organizer nhấn nút hành động trong màn hình chi tiết thẩm định.

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Ra quyết định chính thức đối với từng bài dự thi trước khi chuyển sang giai đoạn chấm điểm.

**Data processing:**

**1. Approve (Phê duyệt)**

- Organizer phê duyệt bài dự thi.
- Hệ thống chuyển trạng thái bài thi sang `APPROVED_FOR_JUDGING`.
- Bài thi đủ điều kiện xuất hiện trong không gian chấm điểm của giám khảo.

**2. Request Negative Proof (Yêu cầu bổ sung âm bản)**

- Organizer yêu cầu thí sinh bổ sung bằng chứng ảnh âm bản.
- Hệ thống chuyển trạng thái bài thi sang `PROOF_REQUESTED`.
- Hệ thống gửi email yêu cầu thí sinh tải ảnh chụp âm bản trong vòng 48 giờ theo BR-19.

**3. Disqualify (Loại bài thi)**

- Organizer bắt buộc chọn lý do loại từ danh mục.
- Organizer nhập ghi chú giải thích.
- Hệ thống chuyển trạng thái bài thi sang `DISQUALIFIED`.
- Quyết định loại bài được ghi vào `AuditLog`.
- Áp dụng quy tắc BR-18.

**Business rules:** BR-18, BR-19.

#### 3.2.6. Manage Judging & Evaluation (Quản lý Chấm thi & Đánh giá)

##### 3.2.6.1. Assign Judges to Contest Categories

**Function trigger:**

Organizer chọn "Judging Management" > "Judge Assignment".

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Phân công giám khảo chuyên môn vào từng hạng mục và vòng chấm, đảm bảo không xảy ra xung đột lợi ích.

**Data processing:**

1. Organizer chọn hạng mục thi và vòng chấm (Sơ khảo / Chung khảo).
2. Organizer chọn danh sách giám khảo được phân công.
3. Mỗi hạng mục chính thức phải có tối thiểu **3 giám khảo độc lập** theo BR-20.
4. Hệ thống kiểm tra xung đột lợi ích:
   - Một người dùng không được vừa là Participant vừa là Judge trong cùng một cuộc thi.
   - Áp dụng quy tắc BR-21.

**Business rules:** BR-20, BR-21.

---

##### 3.2.6.2. Blind Judging & Criteria Scoring Workspace

**Function trigger:**

Judge đăng nhập và chọn cuộc thi được phân công chấm.

**Function description:**

- **Actors/Roles:** Judge.
- **Purpose:** Cung cấp môi trường chấm điểm độc lập, ẩn danh và chính xác theo đặc thù nhiếp ảnh phim.

**Data processing:**

**1. Hiển thị ẩn danh (Blind Rendering)**

Hệ thống chỉ cung cấp cho giám khảo các thông tin:

- Mã bài thi (`SUBMISSION_CODE`).
- Tệp ảnh độ phân giải cao.
- Tên tác phẩm.
- Thông điệp nghệ thuật.
- Thông số kỹ thuật phim (Film Stock, Camera, Lens, Lab).

Hệ thống phải ẩn hoàn toàn:

- Tên thí sinh.
- ID thí sinh.
- Lịch sử cá nhân của thí sinh.

Áp dụng quy tắc BR-12.

**2. Chấm điểm thành phần**

- Giám khảo sử dụng thanh trượt để chấm từng tiêu chí.
- Thang điểm có thể là 1–10 hoặc 1–100 theo cấu hình.
- Ví dụ về các tiêu chí và trọng số:
  - Bố cục: 30%.
  - Ánh sáng: 25%.
  - Sắc độ & Hạt phim: 25%.
  - Câu chuyện: 20%.

**3. Tính tổng điểm có trọng số**

Hệ thống tự động tính tổng điểm của từng giám khảo theo công thức:

\[
S_j = \sum_i (w_i \times c_i)
\]

Trong đó:

- `S_j`: Tổng điểm của giám khảo.
- `w_i`: Trọng số của tiêu chí thứ i.
- `c_i`: Điểm của tiêu chí thứ i.

Hệ thống lưu điểm số và nhận xét chuyên môn của giám khảo theo BR-15.

**4. Bảo mật điểm chấm**

Giám khảo không được xem điểm của các giám khảo khác khi chưa khóa sổ vòng chấm.

Áp dụng quy tắc BR-13.

**Business rules:** BR-12, BR-13, BR-15.

---

##### 3.2.6.3. Monitor Score Discrepancy & Finalize Evaluation

**Function trigger:**

Organizer mở "Judging Management" > "Score Discrepancy & Progress".

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Phát hiện các tác phẩm có ý kiến đánh giá chênh lệch lớn giữa các giám khảo để tổ chức thảo luận và thống nhất trước khi chốt giải.

**Data processing:**

1. Hệ thống tự động tính độ lệch chuẩn và khoảng cách điểm tối đa giữa các giám khảo đối với từng bài thi.

2. Công thức tính khoảng cách điểm:

   `ΔS = S_max - S_min`

   Trong đó:
   - `S_max`: Điểm cao nhất.
   - `S_min`: Điểm thấp nhất.
   - `ΔS`: Khoảng cách giữa điểm cao nhất và thấp nhất.

3. Nếu `ΔS > 30%` tổng thang điểm, hệ thống gắn cờ:

   `DISCREPANCY_CONFLICT`

   Áp dụng quy tắc BR-14.

4. Organizer mở phiên phúc khảo cho bài thi bị gắn cờ.

5. Các giám khảo xem xét lại bài thi và xác nhận điểm thống nhất trước khi khóa bảng điểm vòng thi.

**Business rules:** BR-14, BR-15, BR-18.

#### 3.2.7. Manage Results, Digital Archive & Analytics (Công bố kết quả & Kho lưu trữ số)

##### 3.2.7.1. Approve Leaderboard & Publish Contest Results

**Function trigger:**

Organizer chọn "Results" > "Publish Results".

**Function description:**

- **Actors/Roles:** Contest Organizer.
- **Purpose:** Xác nhận bảng xếp hạng cuối cùng, gán danh hiệu giải thưởng và công bố rộng rãi tới cộng đồng.

**Data processing:**

**1. Kiểm tra điều kiện công bố kết quả**

Hệ thống kiểm tra:

- Toàn bộ giám khảo đã khóa điểm với trạng thái `LOCKED`.
- Mọi bài thi đạt giải đều đã được xác thực âm bản hợp lệ theo BR-06.

**2. Tự động xếp hạng bài dự thi**

- Hệ thống tính điểm trung bình trọng số của hội đồng giám khảo.
- Sắp xếp bài thi theo điểm từ cao xuống thấp.
- Tạo bảng xếp hạng cuối cùng.

**3. Công bố kết quả chính thức**

Khi Organizer nhấn "Publish Official Results", hệ thống thực hiện:

1. Chuyển trạng thái cuộc thi sang `PUBLISHED`.
2. Giải mã ẩn danh, hiển thị tên tác giả thật gắn với tác phẩm.
3. Khóa bất biến toàn bộ dữ liệu điểm số và kết quả theo BR-16.
4. Gửi thông báo kết quả tới tất cả thí sinh.

**Business rules:** BR-06, BR-16, BR-18.

---

##### 3.2.7.2. Manage Digital Archive & Online Exhibition

**Function trigger:**

Người dùng truy cập "Digital Archive" trên thanh điều hướng.

**Function description:**

- **Actors/Roles:** Organizer (Curate), All Actors (View & Filter).
- **Purpose:** Xây dựng thư viện lưu trữ di sản nhiếp ảnh phim lâu dài, phục vụ tra cứu giáo dục, triển lãm trực tuyến và tham khảo chất ảnh của từng loại phim hoặc ống kính.

**Data processing:**

**1. Lưu trữ tác phẩm**

Hệ thống tự động lưu trữ các tác phẩm:

- Đạt giải thưởng.
- Vào vòng chung kết.

Mỗi tác phẩm được lưu cùng các thông tin:

- Film Stock.
- ISO.
- Camera.
- Lens.
- Lab.
- Lời bình của ban giám khảo.

**2. Xử lý ảnh lưu trữ**

- Hệ thống tạo bản ảnh hiển thị trên Web.
- Ảnh hiển thị được đóng dấu bản quyền.
- Tệp ảnh gốc được bảo vệ theo BR-17.

**3. Tìm kiếm và lọc kho lưu trữ**

Người dùng có thể tìm kiếm, kết hợp nhiều bộ lọc theo:

- Cuộc thi.
- Năm tổ chức.
- Giải thưởng.
- Loại phim (ví dụ: Ilford HP5 Plus).
- Khổ phim.
- Thẻ chủ đề AI.

**Business rules:** BR-16, BR-17.