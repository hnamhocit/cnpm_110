# Checklist nghiệm thu CINEGEN

AI-powered Film Photography Contest Management Platform

## 1. Tổng quan

### 10 high-level Functional Requirements, detailed through 43 Use Cases

8/43 Use Cases accepted end-to-end. 1/10 nhóm FR hoàn thành. Hai tỷ lệ phản ánh số mục đã đóng, không quy đổi thành khối lượng kỹ thuật có trọng số.

| Chỉ số | Kết quả |
| --- | --- |
| Nhóm FR cấp cao | 10 |
| Luồng nghiệp vụ cốt lõi | 5 |
| Vai trò hệ thống | 4 |
| Tổng số module triển khai | 11 |
| Tổng số Use Case | 43 |
| Đã có triển khai (Overall DONE + PARTIAL) | 38/43 |
| Đã nghiệm thu Backend (Backend DONE) | 10/43 |
| Đã nghiệm thu toàn luồng (Integration và Overall DONE) | 8/43 |
| Overall PARTIAL | 30 |
| Overall TODO | 5 |
| Module hoàn thành | 1/11 |

### Cách ghi kết quả

Trạng thái nhóm lấy theo Overall. DONE là đã nghiệm thu theo hồ sơ nhóm, PARTIAL là đã triển khai hoặc tích hợp một phần, TODO là còn phải triển khai hoặc kết nối. Giảng viên đánh dấu một ô mỗi hàng sau khi kiểm tra. Để trống cả hai ô nếu chưa kiểm tra.

## Tổng hợp nghiệm thu theo nhóm FR

Mỗi Use Case được tính một lần theo FR chính trong SRS §2.3. Một FR chỉ DONE khi tất cả UC chính đều Overall DONE. Nhóm PARTIAL còn ít nhất một UC chưa DONE và đã có UC triển khai. Nhóm TODO có toàn bộ UC chính là TODO.

| FR ID | Functional Requirement | Accepted UC / Total UC | Status |
| --- | --- | --- | --- |
| FR-01 | Authentication & Access Control | 5/5 | DONE |
| FR-02 | System Administration & Master Data | 0/5 | PARTIAL |
| FR-03 | Contest Planning & Configuration | 0/5 | PARTIAL |
| FR-04 | Judge Assignment & Participant Registration | 0/3 | PARTIAL |
| FR-05 | Film Roll & Frame Management | 0/2 | PARTIAL |
| FR-06 | Film Submission & Tracking | 1/4 | PARTIAL |
| FR-07 | Submission Verification & Moderation | 2/4 | PARTIAL |
| FR-08 | AI-assisted Verification & Analytics | 0/3 | PARTIAL |
| FR-09 | Judging & Evaluation Management | 0/7 | PARTIAL |
| FR-10 | Result Publication & Digital Archive | 0/5 | PARTIAL |

Các bảng chi tiết ở phần 2 tiếp tục trình bày theo module sở hữu triển khai.

## 2. Functional Acceptance Checklist

### M01 Authentication & RBAC

Xác thực email, quản lý phiên, hồ sơ và phân quyền theo vai trò. 5/5 UC hoàn thành · DONE

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Register / Login / Logout | Đăng ký Participant bằng email duy nhất, xác minh email rồi đăng nhập bằng JWT. Từ chối email trùng và token phiên đã đăng xuất. (BR-01/04) | DONE |  |  |  |
| UC-02 | Recover Password | Yêu cầu khôi phục qua email, mở liên kết và đặt mật khẩu mới. Kiểm tra mật khẩu cũ bị từ chối. (SRS §2.2) | DONE |  |  |  |
| UC-03 | View & Update Profile | Xem và sửa hồ sơ, ảnh đại diện, mật khẩu của chính mình. Tải lại để kiểm tra dữ liệu đã lưu. (SRS §2.2, CR-01/03) | DONE |  |  |  |
| UC-04 | Manage User Accounts | Admin tạo, xem, khóa và mở khóa tài khoản. API bảo vệ từ chối tài khoản bị khóa. Kiểm tra phiên cũ vẫn bị thu hồi sau mở khóa. (BR-02/04, M01) | DONE |  |  |  |
| UC-05 | Manage Roles & Permissions | Admin gán một trong 4 vai trò cố định. Kiểm tra quyền mới trên màn hình và API, kể cả thu hồi phiên cũ khi đổi vai trò. (BR-02, CR-03, M01) | DONE |  |  |  |

### M02 Analog Master Data

Chuẩn hóa danh mục phim, thân máy, ống kính và phòng Lab. 0/3 UC hoàn thành · TODO

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-06 | Manage Film Stock Catalog | Admin tạo/sửa Film Stock với hãng, tên, ISO và loại phim. Vô hiệu hóa vẫn giữ dữ liệu lịch sử. (BR-02/03) | TODO |  |  |  |
| UC-07 | Manage Camera & Lens Catalog | Admin tạo/sửa và tra cứu thân máy, ống kính. Kiểm tra dữ liệu dùng được khi khai báo thông số ảnh. (BR-02/22) | TODO |  |  |  |
| UC-08 | Manage Film Lab Directory | Admin tạo/sửa và tra cứu Lab tráng/quét phim. Kiểm tra Lab chọn được trong metadata. (BR-02/22) | TODO |  |  |  |

### M03 Contest Lifecycle

Cấu hình, đăng ký và vận hành cuộc thi theo lịch, hạng mục và vòng chấm. 0/8 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-11 | Create / Duplicate Contest | Tạo cuộc thi với năm mốc hợp lệ. Sao chép hạng mục, tiêu chí, vòng, thể lệ và giải sang DRAFT có lịch mới. Kiểm tra bản sao trống đăng ký, bài, điểm và kết quả. (SRS §3, BR-08) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-12 | Update Contest Configuration | Sửa thông tin, hạn nộp và thể lệ khi cuộc thi chưa đóng. Từ chối lịch sai thứ tự: mở đăng ký, hạn nộp, bắt đầu chấm, kết thúc chấm, công bố. (BR-08) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-13 | Manage Contest Categories | Organizer thêm, sửa, kích hoạt/vô hiệu hóa hạng mục. Kiểm tra Participant chỉ đăng ký được hạng mục hợp lệ. (SRS §2.2–3) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-14 | Configure Judging Criteria | Lưu tiêu chí và trọng số theo hạng mục. Chấp nhận tổng đúng 100% và báo MSG007 khi tổng sai. (BR-15) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-15 | Manage Judging Rounds | Cấu hình một hoặc nhiều vòng chấm, thời hạn từng vòng và số bài đi tiếp. Mở lại để kiểm tra cấu hình đã lưu. (SRS §2.2, BR-14) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-16 | Assign Judges to Categories | Phân công theo hạng mục/vòng, bảo đảm ít nhất một Judge hoạt động. Thử tài khoản có xung đột với vai trò Participant trong cùng cuộc thi. (BR-20/21) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-17 | View Participant Registrations | Tìm và lọc đăng ký theo cuộc thi, hạng mục và trạng thái nộp. Kiểm tra phạm vi quyền Organizer. (SRS §2.2–3, CR-03) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng contest-registration.test.ts (FPC-087). |
| UC-34 | Browse & Register for Contests | Tìm cuộc thi đang mở, xem và chấp nhận thể lệ, đăng ký hạng mục hợp lệ. Thử đăng ký trùng, ngoài hạn và xung đột vai trò. (SRS §3, BR-08/21) | PARTIAL (Backend DONE, Web DONE, Mobile DONE) |  |  | Backend đã kiểm thử bằng contest-registration.test.ts; Web & Mobile hoàn thành đăng ký và lưu trạng thái (FPC-087, FPC-088, FPC-089). |

### M04 Film Logbook

Quản lý cuộn phim cá nhân và metadata của từng khung hình. 0/2 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-35 | Manage Film Roll Log | Tạo và quản lý cuộn của mình với tên phim, khổ, ISO, máy, ngày lắp và Lab. Kiểm tra tài khoản khác bị chặn truy cập. (SRS §2.2–3, CR-03) | PARTIAL |  |  |  |
| UC-36 | Manage Frame Metadata | Lưu ống kính, địa điểm, phơi sáng nếu có. Từ chối số frame không nguyên dương hoặc trùng trong cuộn; chấp nhận số hợp lệ theo BR-23. (SRS §2.2, BR-23) | PARTIAL |  |  |  |

### M05 Submission & Proof

Nhận bài dự thi, kiểm duyệt, xác minh đối chứng và theo dõi trạng thái. 3/8 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-18 | View Submission Queue | Mở hàng đợi cuộc thi thuộc quyền. Đối chiếu danh sách bài, trạng thái kiểm duyệt và nhãn cảnh báo AI. (SRS §2.2, CR-03) | DONE |  |  |  |
| UC-21 | Request Negative / Contact Sheet Proof | Organizer gửi yêu cầu âm bản hoặc contact sheet với hạn do mình đặt. Kiểm tra thí sinh thấy hạn đúng và Organizer xử lý thủ công khi quá hạn. (BR-06/19) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-22 | Verify & Approve Submission | Duyệt bài đạt chuẩn kỹ thuật vào danh sách chấm. Thử bài yêu cầu đối chứng và xác nhận hệ thống chỉ cho duyệt sau xác minh. (BR-06/07/09) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-23 | Disqualify / Reject Submission | Organizer loại bài vi phạm. Thiếu lý do thì bị chặn; khi thành công kiểm tra trạng thái và AuditLog. (BR-18, CR-04) | DONE |  |  |  |
| UC-37 | Submit Film Photograph | Nộp ảnh đúng chuẩn, đủ metadata/tuyên ngôn, gắn đăng ký và cuộn/frame thuộc quyền. Thử quá hạn, quá số bài, trùng cuộn/frame và thiếu đối chứng bắt buộc. (BR-05–08/22–24) | PARTIAL (Backend DONE, Web DONE, Mobile DONE) |  |  | Dương Nguyễn hoàn thành FPC-096, FPC-097, FPC-098. |
| UC-38 | Upload Negative / Contact Sheet Proof | Tải âm bản hoặc contact sheet cho bài của mình. Kiểm tra Organizer có quyền xem đúng bằng chứng. Quá hạn do Organizer xử lý thủ công. (BR-06/19, CR-03) | PARTIAL |  |  |  |
| UC-39 | Edit / Withdraw Submission | Sửa thông số hoặc rút bài khi còn hạn và chưa vào chấm. Thử cả hai điều kiện chặn. Nếu thay ảnh, bài trở lại kiểm duyệt. (SRS §3, BR-08/24) | DONE |  |  | Backend test pass 50/50; Web modal và Mobile bottom sheet hoàn thành (FPC-096, FPC-097, FPC-098). |
| UC-40 | Track Submission Status | Mở và làm mới bài của mình sau thay đổi kiểm duyệt. Đối chiếu trạng thái mới với dữ liệu lưu và thử truy cập bài người khác. (SRS §2.2–3, CR-03) | DONE |  |  |  |

Chuẩn ảnh theo thể lệ (BR-07): JPG/JPEG, TIFF tùy chọn, mặc định tối đa 25 MB và cạnh ngắn tối thiểu 2000 px. Chấm ẩn danh yêu cầu ảnh không có dấu hiệu định danh.

Metadata đối chiếu theo BR-22: Film Stock, Film Format, ISO, Camera Body, Lens, số frame, Developing Lab hoặc Home Development, thông số scan và địa điểm. Lens, thông số scan và địa điểm có thể ghi không rõ hoặc không áp dụng nếu thể lệ cho phép.

### M06 AI Verification

Sàng lọc ảnh bằng AI và hỗ trợ Organizer đối chiếu, ra quyết định. 0/3 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-09 | Configure AI Thresholds | Admin cấu hình ngưỡng cảnh báo ảnh tạo sinh và tương đồng. Dùng ảnh đại diện kiểm tra kết quả hai phía của ngưỡng. (BR-09/10) | PARTIAL |  |  |  |
| UC-19 | Trigger AI Verification Scan | Organizer kích hoạt quét từng bài và hàng loạt. Kiểm tra xử lý nền cho trùng ảnh, ảnh AI và gợi ý thẻ. (BR-09–11, SRS §5) | PARTIAL |  |  |  |
| UC-20 | Review AI Flagged Submissions | Xem điểm AI, điểm tương đồng và ảnh khớp theo quyền. Đối chiếu ảnh thi với bằng chứng cạnh nhau. Organizer quyết định và ghi lý do khi gỡ cờ. (BR-09/10/18) | PARTIAL |  |  |  |

### M07 Blind Judging

Phân phối bài ẩn danh, chấm độc lập, khóa phiếu và chốt vòng. 0/7 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-24 | Monitor Judging Progress | Theo từng vòng và Judge, đối chiếu số bài được giao, số bài đã chấm và trạng thái xác nhận điểm. (SRS §2.2) | PARTIAL (Backend DONE) |  |  | Đã sửa owner và tách tiến độ theo vòng, regression 2026-11-26 đạt. |
| UC-25 | Finalize Judging Round | Thử chốt khi còn phiếu bắt buộc chưa xác nhận. Khi đủ, khóa vòng, xếp theo điểm trung bình có trọng số và chọn đúng số bài đi tiếp. (BR-14/25) | PARTIAL |  |  | Chốt/chuyển vòng và transaction đã sửa, regression đạt. Còn hợp đồng xác nhận đồng điểm tại ranh giới đi tiếp. |
| UC-29 | View Assigned Submissions | Judge chỉ thấy bài được giao. Kiểm tra cả UI lẫn phản hồi API đều ẩn tên, email, avatar, ID và dữ liệu định danh tác giả. (BR-12, CR-03) | PARTIAL |  |  |  |
| UC-30 | Inspect High-Res Image & Film Metadata | Judge phóng to ảnh scan độ phân giải cao và xem metadata chụp/tráng/scan. Kiểm tra ảnh và dữ liệu giữ ẩn danh. (SRS §2.2–3, BR-12) | PARTIAL (Backend DONE) |  |  |  |
| UC-31 | Score & Comment on Submission | Chấm theo từng tiêu chí và lưu nhận xét. Đối chiếu tổng điểm có trọng số. Thử xem điểm/nhận xét của Judge khác trước khi vòng kết thúc. (BR-13/15) | PARTIAL |  |  |  |
| UC-32 | Update Evaluation Score | Sửa điểm và nhận xét trước khi khóa, kiểm tra lưu vết cập nhật. Thử sửa lại sau khóa và xác nhận bị từ chối. (SRS §2.2, CR-04) | PARTIAL |  |  |  |
| UC-33 | Lock & Confirm Final Evaluations | Judge xác nhận hoàn tất và khóa phiếu cá nhân cho vòng được giao. Kiểm tra trạng thái đã khóa và chặn thay đổi tiếp theo. (SRS §2.2–3) | PARTIAL |  |  |  |

### M08 Archive & Exhibition

Công bố kết quả, tổng hợp portfolio và trưng bày tác phẩm. 0/5 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | Công bố thứ hạng và giải từ vòng cuối đã chốt với đủ đối chứng theo thể lệ. Làm tròn hai chữ số, ghi lý do khi đồng điểm và thử sửa sau công bố. (BR-06/16/25) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-27 | Manage Digital Archive & Exhibition | Chọn tác phẩm đưa vào triển lãm. Kiểm tra bản công khai tối ưu có bản quyền và bản gốc độ phân giải cao vẫn riêng tư. (BR-17) | PARTIAL (Backend DONE) |  |  | Backend đã kiểm thử ngày 2026-11-26 bằng organizer-usecases.integration.test.ts. |
| UC-41 | View Contest Results & Judge Feedback | Participant xem kết quả chung cuộc, điểm trung bình và nhận xét cho bài của mình sau công bố. Thử truy cập phản hồi của tài khoản khác. (SRS §2.2–3, CR-03) | DONE |  |  | Backend đã kiểm thử ngày 2026-11-26; Mobile (FPC-120) & Web (FPC-119) hoàn thành kết quả và feedback giám khảo. |
| UC-42 | Manage Personal Film Portfolio | Mở portfolio cá nhân và đối chiếu tác phẩm với lịch sử nộp bài, kết quả tương ứng. Kiểm tra phạm vi tài khoản. (SRS §2.2–3, CR-03) | PARTIAL (Backend DONE, Mobile DONE) |  |  | Backend đã kiểm thử bằng portfolio.test.ts; Mobile hoàn thành màn hình Portfolio & Giải thưởng cá nhân (FPC-101/FPC-123). |
| UC-43 | Explore Digital Archive & Gallery | Khách xem kho ảnh đã công bố và lọc theo phim, máy, năm. Kiểm tra bài chưa công bố và ảnh gốc được bảo vệ. (SRS §2.2–3, BR-17) | DONE |  |  | Backend API + filters + index (FPC-112/114/115) test pass; Mobile Digital Archive (FPC-124) hoàn thành. |

### M09 Shared API Contracts

Chuẩn hóa API và dữ liệu trao đổi cho các nền tảng. UC riêng: N/A · PARTIAL

Các mục kiểm tra được trình bày ở phần 3.

### M10 Database Schema & Cloud Storage

Bảo toàn dữ liệu nghiệp vụ, phân quyền ảnh gốc và ảnh công khai. UC riêng: N/A · PARTIAL

Các mục kiểm tra được trình bày ở phần 3.

### M11 Cross-Cutting Services

Tra cứu nhật ký, gửi thông báo và cung cấp báo cáo cuộc thi. 0/2 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-10 | View System Audit Logs | Admin tra cứu nhật ký thao tác nhạy cảm. Kiểm tra người thực hiện, thời điểm, hành động, dữ liệu cũ/mới và lý do. (BR-18, CR-04) | PARTIAL |  |  |  |
| UC-28 | Export Contest Analytics Report | Organizer xem thống kê DB theo cuộc thi/hạng mục và xuất báo cáo. Kiểm tra AI chỉ nhận số liệu tổng hợp không định danh và số liệu/xuất vẫn dùng được khi AI lỗi. (SRS §3) | PARTIAL (Backend DONE) |  |  |  |

## 3. Technical Acceptance Checklist

M09, M10, M11 · Các hàng dưới đây kiểm tra yêu cầu dùng chung. Khi tổng kết 43 UC, kết quả UC-10 và UC-28 lấy từ bảng chức năng M11.

| Hạng mục | Tiêu chí nghiệm thu | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- |
| M09 · API và OpenAPI | Đối chiếu API hoạt động với OpenAPI. Thử luồng client theo hợp đồng đang hoạt động, ghi nhận khoảng trống ở hợp đồng dự kiến. (SRS §5, M09) |  |  |  |
| M09 · Kiểm tra dữ liệu | Thử trường bắt buộc trên Web/Mobile và Server, chuẩn hóa email và thời gian theo múi giờ cuộc thi. Đối chiếu mã lỗi SRS, không trả stack trace. (CR-01/02/06) |  |  |  |
| M09 · Bảo mật API | Thử JWT access/refresh, RBAC, quyền tài nguyên và tài khoản khóa. Kiểm tra phản hồi Judge ẩn định danh và truy cập khách chỉ tới nội dung công khai. (BR-04/12, CR-03) |  |  |  |
| M09 · Hiệu năng | Đo API nghiệp vụ thông thường theo mục tiêu dưới 500 ms, ghi môi trường và kết quả. Tách tải ảnh và xử lý AI khỏi phép đo. (SRS §5) |  |  |  |
| M10 · Toàn vẹn dữ liệu | Kiểm tra xóa mềm giữ lịch sử, mã CON/SUB/ROLL duy nhất, khóa kết quả đã công bố và ràng buộc cuộn/frame. (BR-03/05/16/23, CR-05) |  |  |  |
| M10 · Transaction và đồng thời | Thử nhiều Organizer duyệt cùng bài hoặc tổng hợp hạng song song. Kiểm tra kiểm soát phiên bản tránh ghi đè và không mất dữ liệu khi thất bại. (SRS §5, CR-07) |  |  |  |
| M10 · Cloud Storage | Thử tải và đọc bằng liên kết có thời hạn, kiểm tra chủ tệp và truy cập trái quyền. Ảnh scan gốc/bằng chứng riêng tư. Preview tối ưu có bản quyền chỉ công khai sau xuất bản. (BR-17, SRS §5) |  |  |  |
| M11 · AuditLog tập trung | Đối chiếu tạo, cập nhật, duyệt, loại bài và chốt giải trên thực thể cốt lõi. Kiểm tra người, giờ, thao tác, dữ liệu cũ/mới và lý do. (BR-18, CR-04) |  |  |  |
| M11 · Email và thông báo trong ứng dụng | Kiểm tra gửi đúng người nhận khi đổi trạng thái bài, yêu cầu bằng chứng và công bố kết quả. Đối chiếu hạn đối chứng trong thông báo với hạn do Organizer đặt. Push tùy chọn. (BR-19, SRS §5) |  |  |  |

Điểm còn mở theo hồ sơ nhóm: M09 còn hợp đồng nghiệp vụ dự kiến, M10 cần xác nhận luồng liên kết tải ảnh có thời hạn và preview công khai, M11 cần nghiệm thu SMTP thật, độ phủ audit toàn hệ thống và thông báo nghiệp vụ.

## 4. AI Acceptance Checklist

Sàng lọc AI và báo cáo đã có thành phần triển khai. Chạy các ca dưới đây với dữ liệu đại diện và ghi rõ khi dùng dịch vụ hoặc dữ liệu giả lập.

| Hạng mục | Triển khai và giới hạn | Tiêu chí nghiệm thu | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| Duplicate Detection | Có pHash, lưu liên kết nghi trùng và API đối sánh. Chưa nghiệm thu ngưỡng với ảnh thật và quyền xem xuyên phạm vi; nhánh vector còn mở, SRS cho phép pHash và/hoặc vector. | Thử ảnh trùng, gần trùng và khác nhau ở hai phía của ngưỡng. Kiểm tra cờ, liên kết ảnh và quyền xem. (BR-10) |  |  |  |
| AI-generated Image Detection | Đã kết nối mô hình, webhook và lưu cờ/điểm khi có. Còn nghiệm thu mô hình và cấu hình ngưỡng trên ảnh đại diện. | Dùng mẫu hai phía của ngưỡng, đối chiếu điểm và cờ nghi vấn. Kiểm tra quyết định cuối do Organizer thực hiện. (BR-09) |  |  |  |
| Auto-tagging | Có phân loại và gợi ý thẻ, webhook giới hạn 5 thẻ. Cảnh báo lệch hạng mục và luồng điều chỉnh chưa được nghiệm thu. | Kiểm tra tối đa 5 từ khóa, gợi ý hạng mục và Organizer có thể sửa. Bài khác hạng mục vẫn chờ Organizer xử lý. (BR-11) |  |  |  |
| AI Analytics | API thống kê/xuất JSON đã có; Backend UC-28 đã nghiệm thu với AI giả lập. Chưa nghiệm thu xuất báo cáo trên Web và nhà cung cấp AI thật. | So số liệu với DB theo cuộc thi/hạng mục. Kiểm tra payload AI chỉ gồm tổng hợp không định danh. Thử AI lỗi, số liệu và xuất cơ bản vẫn dùng được. (SRS §3, M11) |  |  |  |
| Background Worker | Có worker, webhook và hàng đợi PostgreSQL. Quét theo yêu cầu từng bài/hàng loạt và phục hồi lỗi còn cần nghiệm thu. | Xác nhận tác vụ chạy nền, không chặn người dùng. Gây lỗi tác vụ, thử phục hồi và đối chiếu kết quả sau xử lý. (SRS §5) |  |  |  |
| Human-in-the-loop Verification | Web có màn đối sánh; UC-20 vẫn PARTIAL, demo dùng dữ liệu giả lập. Còn nghiệm thu ảnh/bằng chứng thật, quyền, và luồng duyệt/gỡ cờ. | Organizer xem điểm, ảnh khớp và đối chứng cạnh nhau. Bài cần bằng chứng chỉ được duyệt sau xác minh. Gỡ cờ/loại bài phải có lý do và audit. (BR-06/09/18–19) |  |  |  |

Hồ sơ hiện hành chưa cung cấp kết quả định lượng Precision, Recall, F1-score hoặc Accuracy để nghiệm thu.

## 5. Tổng kết nghiệm thu

Chỉ cộng các hàng UC ở phần 2. Tổng số UC đạt, chưa đạt và chưa kiểm tra phải bằng 43.

| Kết quả kiểm tra | Số Use Case |
| --- | --- |
| Đạt |  |
| Chưa đạt |  |
| Chưa kiểm tra |  |

### Nhận xét chung

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

### Các yêu cầu cần bổ sung

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

### Kết luận nghiệm thu

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

### Ngày kiểm tra và chữ ký

| Ngày kiểm tra | Chữ ký giảng viên |
| --- | --- |
| …… / …… / ………… |  |


## FPC-130 · Checklist hợp đồng cho 11 UC của Nam

Phạm vi UC-11,12,13,14,15,16,21,22,26,27,41. FPC-109 và FPC-113 hoàn thành phần Backend trên cùng nhánh theo xác nhận của chủ sở hữu. Trạng thái công việc độc lập với kết quả nghiệm thu toàn luồng của GV.

| Test | Kết quả hiện tại | Bằng chứng / phần cần kiểm tra |
| --- | --- | --- |
| N130-01 | Đã sửa sai lệch đã phát hiện | PATCH/DELETE /exhibitions/{id}, bổ sung alias feedback/result trong OpenAPI. Cần đối chiếu toàn bộ route từng UC. |
| N130-02 | Chưa nghiệm thu | Cần request hợp lệ, HTTP status và body riêng từng endpoint. |
| N130-03 | Chưa nghiệm thu | Bỏ từng field bắt buộc, null và chuỗi rỗng, so DB. |
| N130-04 | Chưa nghiệm thu | Sai type/enum/miền giá trị/timestamp từng endpoint. |
| N130-05 | PARTIAL | Test JWT chung đạt. Cần thiếu/sai/hết hạn token tại từng route bảo vệ. |
| N130-06 | Chưa nghiệm thu | Participant/Judge gọi từng route Organizer. |
| N130-07 | Chưa nghiệm thu | O2 dùng tài nguyên O1, so DB trước/sau. |
| N130-08 | Chưa nghiệm thu | UUID không tồn tại và ID sai định dạng tại từng route. |
| N130-09 | Chưa nghiệm thu | Ghi UTC+7, đọc lại client và DB. |
| N130-10 | Chưa nghiệm thu | Phân trang/bộ lọc/empty và cách ly C1/C2. |
| N130-11 | Chưa nghiệm thu | Gây lỗi có kiểm soát trong DB test, kiểm tra body/log. |
| N130-12 | Chưa nghiệm thu | Mutation lỗi giữ DB nhất quán. |
| N130-13 | Chưa đạt | Web phân công/mời Judge đang gọi route chưa mount. Cần tích hợp client thật. |
| N130-14 | PARTIAL | OpenAPI đã sửa path/alias. Cần schema response chi tiết và validation tài liệu. |

Kiểm tra nền đã đạt 39 test API, TypeScript và git diff --check. API khởi động được với DB nghiệm thu. Chưa đánh dấu PASS toàn bộ FPC-130 từ các kiểm tra nền này.

### Bằng chứng Backend cho 11 UC của Nam ngày 2026-11-26

Bộ test apps/api/tests/organizer-usecases.integration.test.ts gọi Hono route thật và PostgreSQL cinegen_acceptance_test. Kết quả 13/13 test, 60 assertions đạt. TypeScript đạt. Dữ liệu mutation tạo riêng và được dọn sau test. Fixture nghiệm thu có sẵn dùng cho kiểm tra kết quả 8.50 và hai nhận xét.

| UC | Bằng chứng Backend đạt |
| --- | --- |
| UC-11 | Tạo DRAFT với năm mốc, UTC+7 đúng, chặn trọng số sai/RBAC; sao chép hạng mục và vòng chấm, bỏ phân công. Đã sửa thiếu sao chép vòng chấm thực tế. |
| UC-12 | Owner sửa được, O2 bị chặn, lịch sai thứ tự bị chặn, sửa sau công bố bị chặn. |
| UC-13 | Tạo và đổi tên hạng mục, chặn Organizer khác. |
| UC-14 | Lưu trọng số 0.6/0.4, chặn tổng 0.5 và giữ bộ tiêu chí cũ. |
| UC-15 | Tạo vòng cuối, chặn cấu hình chồng thứ tự và owner khác. |
| UC-16 | Phân Judge hoạt động, retry giữ cùng ID, chặn Participant làm Judge. |
| UC-21 | Gửi yêu cầu có hạn, chặn hạn quá khứ và owner khác, Participant nhận thông báo. |
| UC-22 | Chặn duyệt khi chưa xác minh proof, xác minh rồi duyệt thành APPROVED với ảnh đạt BR-07. |
| UC-26 | Chặn công bố sớm, tính điểm cuối 8.55 từ phiếu thật, snapshot bất biến khi retry, chặn owner khác. |
| UC-27 | Chặn watermark false/cuộc thi chưa công bố/owner khác; tạo preview WebP bỏ EXIF, bảo vệ master key, xóa mềm ẩn khỏi public. |
| UC-41 | Đọc đúng 8.50 và hai nhận xét, chặn Participant khác, đọc danh sách kết quả cá nhân. |

Backend DONE ghi nhận phạm vi Backend của người thực hiện. Cột GV đạt/chưa đạt giữ cho nghiệm thu của GV. FPC-130 tiếp tục để sau theo yêu cầu chủ sở hữu. Bộ test này bao phủ các tình huống nêu trong bảng, chưa phải toàn bộ tổ hợp lỗi và concurrency.

### Hồ sơ rà soát FPC-130 ngày 2026-11-26


Phạm vi đã xác nhận gồm UC-11–16, UC-21–22, UC-26–27 và UC-41. Kiểm tra trên commit cfebeea của nhánh feature/FPC-109-FPC-113-m08-archive-results, theo SRS, Sprint 5 và MEMBER_WORKFLOW.

Đã chạy bun --filter api test với 39 test đạt và bun --filter api check-types đạt. API đã khởi động được với PostgreSQL cinegen_acceptance_test và fixture nghiệm thu. Chưa đủ bằng chứng để đánh dấu PASS N130-02–13 theo từng endpoint.

N130-01 phát hiện PATCH/DELETE triển lãm bị tài liệu hóa dưới /api/v1/exhibitions/{id}/status trong khi Hono mount tại /api/v1/exhibitions/{id}. Đã sửa OpenAPI và bổ sung GET /result cùng các alias /organizer/submissions/{id}/feedback và /result.

N130-13 còn sai lệch client Web. Trang phân công gọi POST /contests/{id}/judges/assignments, trong khi API mount POST /contests/{id}/judges. Trang mời Judge gọi /judges/invite chưa mount. Hai luồng này chưa đạt nghiệm thu tích hợp.

N130-02–04,06–12 còn cần request/response và kiểm tra DB riêng từng route. N130-05 có test JWT chung đạt, còn cần kiểm tra từng route bảo vệ. N130-14 còn thiếu schema response chi tiết tại nhiều endpoint M08. Các mục này giữ trạng thái chưa nghiệm thu.

Theo xác nhận của chủ sở hữu, nhánh gộp FPC-109/FPC-113 bàn giao cả hai công việc. Đánh giá hoàn thành riêng theo deliverable của mỗi mã. FPC-130 trong sprints.md là mã hiện hành, mã trùng trong technical-evidence.md thuộc hồ sơ cũ.


Backend 11 UC đã có bằng chứng 13 test integration đạt ngày 2026-11-26, xem bảng bằng chứng trong checklist. FPC-130 để sau theo quyết định chủ sở hữu.

### Review tích hợp develop theo SRS ngày 2026-11-26

Kiểm tra trên commit 9a30725. Bộ 13 test cho 11 UC của Nam chưa bao phủ route UC-24/25 được đưa vào từ develop. Các phát hiện bên dưới đã được sửa trong phiên tiếp theo, xem kết quả xác minh sau bảng.

| Mức độ | Phạm vi | Phát hiện và căn cứ |
| --- | --- | --- |
| Cao | UC-24, BR-02, CR-03 | GET /contests/{id}/judging-progress chỉ kiểm tra permission chung. getJudgingProgress không nhận actor và không kiểm tra createdBy nên Organizer khác có thể đọc tiến độ và danh tính Judge của cuộc thi. |
| Cao | UC-25/26, BR-06/14/16/25 | closeJudgingRound ghi contests.status=PUBLISHED trực tiếp, bỏ qua publishContestResults. Không khóa judgingRounds, không chọn bài đi tiếp, không lưu snapshot kết quả, không kiểm tra hạn công bố và proof. Có thể làm luồng publish-results bị chặn do trạng thái đã đổi. |
| Cao | UC-24/25, BR-14/25 | getJudgingProgress gom assignment, bài APPROVED và evaluation toàn cuộc thi, không lọc roundId. Cuộc thi nhiều vòng có thể đếm lặp điểm vòng cũ, sai số bài được giao và trạng thái hoàn tất. |
| Vừa | UC-25, BR-14 | closeJudgingRound yêu cầu xử lý DISCREPANCY_CONFLICT theo thiết kế lịch sử. SRS hiện hành và Module 07 mục Phạm vi theo SRS dùng chốt/chuyển vòng, không yêu cầu quy trình phúc khảo độ lệch. |
| Cao | UC-25, SRS §5 | Kiểm tra phiếu và cập nhật trạng thái trong closeJudgingRound chạy ngoài transaction/row lock nên có khoảng trống đồng thời giữa kiểm tra và ghi. |

Kết quả sau sửa: tiến độ và chốt vòng kiểm tra owner, nhận roundId tùy chọn, mặc định chọn vòng đang chạy hoặc vòng cuối. Chỉ đếm entry/evaluation của vòng, kiểm tra đủ tiêu chí và phiếu xác nhận. Chốt vòng và chọn bài đi tiếp chạy trong một transaction với row lock cuộc thi. Vòng cuối chỉ khóa judgingRounds, không đổi cuộc thi sang PUBLISHED và không tạo snapshot. API UC-26 tiếp tục chịu trách nhiệm công bố, hạn công bố và proof. Đã bỏ điều kiện DISCREPANCY_CONFLICT khỏi chốt vòng.

Regression đạt 14/14 integration test với 77 assertions, 39 test hiện có, TypeScript và git diff --check. Test xác nhận O2 bị chặn ở cả hai route, chặn phiếu chưa xác nhận, retry chốt vòng giữ nguyên, không công bố sớm, chọn đúng bài điểm cao nhất và vòng tiếp theo không đếm điểm vòng cũ.

UC-24 ghi Backend DONE trong phạm vi test này. UC-25 giữ PARTIAL vì trường hợp đồng điểm ngay ranh giới đi tiếp đang trả 409 để Organizer xử lý, còn thiếu hợp đồng xác nhận thứ hạng kèm lý do cho ranh giới này. Không tự chọn ngẫu nhiên bài đồng điểm. FPC-130 để sau theo yêu cầu chủ sở hữu.


## FPC-132 · Email, Notification, Audit · 2026-11-26

Nhánh feature/FPC-132-email-notification-audit bao gồm sửa chốt vòng chưa push và dịch vụ dùng chung. Migration 0006 thêm AuditLog, outbox email và trigger cùng transaction. Middleware ghi actor cho request xác thực; webhook/worker AI có actor hệ thống null. SMTP dùng cấu hình hiện có, worker trong API tự xử lý và retry, không cần lệnh gửi riêng.

| Test | Kết quả | Bằng chứng |
| --- | --- | --- |
| N132-01 | PASS SMTP thật | Gửi đến hnamhocit@gmail.com theo cho phép của chủ sở hữu. Gmail Inbox có message 1a2181114edc720b lúc 2026-11-26 13:35 UTC. Đúng bài 39524ad4-1a3a-4a3d-a95d-4765e0d476ff, contact_sheet, hạn 2026-11-27T13:35:00.550Z. Fixture riêng dùng hạn tương lai thay ngày ví dụ trong checklist ảnh. |
| N132-02 | PASS Backend | API đọc thông báo của P1 có đúng submissionId và hạn đã lưu; đọc chi tiết bài theo ID có kiểm tra owner. |
| N132-03 | PASS | P2 không nhận notification riêng của P1; tài khoản Judge bị 403 khi gọi endpoint Participant. |
| N132-04 | PASS | O2 bị 404, deadline quá khứ bị 400; không có notification/outbox thành công cho request bị từ chối. |
| N132-05 | PASS | Đẩy deadline fixture về quá khứ, API trả OVERDUE và vẫn PROOF_REQUESTED. Không tự tạo sự kiện DISQUALIFIED. |
| N132-06 | PASS | Duyệt và loại có notification SUBMISSION_STATUS đúng P1, trạng thái đã lưu và lý do loại. |
| N132-07 | PASS Backend | Công bố snapshot 8.55 từ điểm thật, notification chỉ có P1 trong vòng cuối của C1; retry snapshot không tạo thêm sự kiện. |
| N132-08 | PASS | Sender lỗi có kiểm soát lưu FAILED với last_error cố định, không chứa chuỗi secret từ provider; nghiệp vụ và notification vẫn đã lưu. |
| N132-09 | PASS | Retry chuyển FAILED sang SENT; lượt sau không gửi lại và không tạo thêm notification. SMTP crash sau khi nhận nhưng trước commit có thể gửi email lặp, đã mô tả rõ cơ chế at-least-once. |
| N132-10 | PASS | Audit INSERT/UPDATE Contest đúng O1, old name UC integration và new name updated. |
| N132-11 | PASS | Audit đổi trạng thái proof, xác minh và duyệt đúng actor; moderation log có reason và trạng thái trước/sau. |
| N132-12 | PASS | Loại thiếu lý do trả 422 đúng OpenAPI và không thêm audit thành công. Loại hợp lệ lưu Missing requested proof trong AuditLog và notification. |
| N132-13 | PASS | Audit contest_publications đúng O1, C1 và entries[0].finalScore=8.55. Snapshot lưu tie_breaks cho quyết định đồng điểm theo UC-26. |
| N132-14 | PASS tích hợp | Gọi API AI webhook thật bằng secret test và API Judge chấm điểm. Trigger AuditLog ghi phân tích AI và phiếu Judge đúng nội dung, Judge có actor J1. Không viết lại API của owner khác. |
| N132-15 | PASS | Request sai owner bị chặn và không có audit mutation thành công của O2; rollback request lỗi giữ dữ liệu nhất quán. |
| N132-16 | PARTIAL | Notification kiểm tra RBAC/recipient; audit_safe_json loại khóa bí mật đệ quy, lỗi SMTP không lộ secret. Nghiệm thu quyền HTTP đọc AuditLog chờ UC-10/FPC-125 vì route tra cứu thuộc công việc khác. |

Bộ regression cuối đạt 16 test, 120 assertions, 1 ca live SMTP bỏ qua mặc định để tránh gửi lại thư. Ca SMTP thật đã chạy riêng thành công trong lượt có LIVE_SMTP_TO. 39 test API hiện có, TypeScript, db:check và git diff --check đạt. Migration đã áp dụng trên cinegen_acceptance_test. Đã xác nhận Inbox bằng Gmail connector, không chỉ dựa vào kết quả SMTP.

FPC-132 Backend đã triển khai các kênh email/in-app và audit ghi dùng chung. Giữ PARTIAL nghiệm thu do N132-16 cần tích hợp route UC-10 của FPC-125. Push notification không bắt buộc. FPC-130 để sau theo quyết định chủ sở hữu.


## FPC-134 · Seed demo và smoke test API · 2026-11-26

Nhánh feature/FPC-134-acceptance-seed. Đã sửa seed v2 và luồng vận hành theo yêu cầu chủ sở hữu. Đồng bộ DB bằng bun --filter api db:migrate sẽ tự seed; API tự kiểm tra seed khi khởi động. Đã bỏ script seed riêng và script gửi notification. Worker trong API tự gửi/retry. Ảnh fixture nằm chung dưới uploads/acceptance/<database>/, gồm submissions, proofs và exhibitions.

| Test | Kết quả | Bằng chứng |
| --- | --- | --- |
| N134-01 | PASS | Migrate và tự seed trên DB local mới cinegen_acceptance_verify_fpc134d/e. Guard từ chối production, host remote và cấu hình R2. |
| N134-02 | PASS | A/O1/O2/P1/P2/J1/J2 đăng nhập bằng API thật, đúng role, kiểm tra hash mật khẩu. Seed không in mật khẩu. |
| N134-03 | PASS | API đọc C1/C2/C3 và K1/K2/K3/K4 đúng owner; code CON duy nhất và FK được PostgreSQL kiểm soát. |
| N134-04 | PASS | Năm mốc tăng dần, trọng số mỗi hạng mục đúng 1.0; R1/R2 và assignment đúng vòng/hạng mục, đã xác nhận; cơ cấu GOLD/SILVER hợp lệ. |
| N134-05 | PARTIAL / phụ thuộc | ROLL1/ROLL2 là bản ghi thật đúng Participant. Metadata có roll ID và frame 1/2 riêng, không trùng tuple. Registration và Frame chưa có schema/API tương ứng để tạo/đọc bằng API thật; không dựng bảng giả trong seed thay phần việc UC-17/34/35/36. |
| N134-06 | PASS | Scan JPEG 3000x2000, proof tồn tại; preview WebP qua API, master không có trong payload công khai; P1 đọc proof được, P2 bị chặn. Ảnh mới gom theo DB trong acceptance/. |
| N134-07 | PASS | Hai Judge, hai tiêu chí 0.5/0.5, điểm S1/S3=8.50 và S2/S4=7.50 tính từ evaluation_scores. Đã bỏ tiêu chí mặc định khiến tổng K1 thành 200% trong seed cũ. |
| N134-08 | PASS | C1 công bố bằng service nghiệp vụ thật và có hai feedback mỗi bài; C3 trước công bố không lộ kết quả. Seed không tạo response mock. |
| N134-09 | PASS | Test tạm mở khóa phiếu hoặc bỏ xác minh proof trong C3, API công bố trả 409, sau đó khôi phục trong finally. O2 bị 403. Không chèn dữ liệu vi phạm constraint để tạo lỗi. |
| N134-10 | PASS | Chạy lại seed giữ dữ liệu và trạng thái hiện tại, không tạo trùng fixture. Có advisory lock tránh hai lượt seed chạy chồng. |
| N134-11 | PASS | Smoke test API từ đăng nhập đến contest, category, bài, proof, preview, kết quả và feedback. Request proof thông thường được worker tự xử lý mà không chạy lệnh gửi. |
| N134-12 | PASS | Alias UUID xuất trong acceptanceIds; hướng dẫn môi trường tại README API. Đã tạo lại fixture trên nhiều DB verify riêng, không dùng secret thật trong tài liệu. |

Sprints đã đồng bộ FPC-083, FPC-085, FPC-093, FPC-108 thành DONE theo bằng chứng Backend của các UC tương ứng. FPC-134 giữ IN REVIEW do phụ thuộc N134-05. FPC-132 giữ IN REVIEW do quyền HTTP tra cứu AuditLog còn phụ thuộc UC-10/FPC-125.

Database fixture v1 được giữ nguyên. Seed từ chối ghi đè v1 đã có kết quả và hướng dẫn dùng một DB verify mới cho v2. Lịch tương đối được tạo tại lần seed đầu, sau đó đọc bằng API và giữ nguyên khi seed lại. Bộ smoke test khôi phục các lỗi tạm thời để C3 tiếp tục dùng được trước công bố.

Kết quả kiểm chứng cuối FPC-134: 9 smoke test đạt với 91 assertions, 1 ca registration/Frame được skip có lý do; regression 11 UC/audit đạt 16 test với 120 assertions và 1 ca SMTP thật không gửi lại. 39 test hiện có, TypeScript, db:check và diff check đạt. Hai DB verify mới đã được migrate và tự seed; lượt seed tiếp theo không tăng số bản ghi hay sinh thêm file.
