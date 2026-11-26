# CINEGEN

## Functional Acceptance Checklist

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
| UC-11 | Create / Duplicate Contest | Tạo cuộc thi với năm mốc hợp lệ. Sao chép hạng mục, tiêu chí, vòng, thể lệ và giải sang DRAFT có lịch mới. Kiểm tra bản sao trống đăng ký, bài, điểm và kết quả. (SRS §3, BR-08) | PARTIAL |  |  |  |
| UC-12 | Update Contest Configuration | Sửa thông tin, hạn nộp và thể lệ khi cuộc thi chưa đóng. Từ chối lịch sai thứ tự: mở đăng ký, hạn nộp, bắt đầu chấm, kết thúc chấm, công bố. (BR-08) | PARTIAL |  |  |  |
| UC-13 | Manage Contest Categories | Organizer thêm, sửa, kích hoạt/vô hiệu hóa hạng mục. Kiểm tra Participant chỉ đăng ký được hạng mục hợp lệ. (SRS §2.2–3) | PARTIAL |  |  |  |
| UC-14 | Configure Judging Criteria | Lưu tiêu chí và trọng số theo hạng mục. Chấp nhận tổng đúng 100% và báo MSG007 khi tổng sai. (BR-15) | PARTIAL |  |  |  |
| UC-15 | Manage Judging Rounds | Cấu hình một hoặc nhiều vòng chấm, thời hạn từng vòng và số bài đi tiếp. Mở lại để kiểm tra cấu hình đã lưu. (SRS §2.2, BR-14) | TODO |  |  |  |
| UC-16 | Assign Judges to Categories | Phân công theo hạng mục/vòng, bảo đảm ít nhất một Judge hoạt động. Thử tài khoản có xung đột với vai trò Participant trong cùng cuộc thi. (BR-20/21) | PARTIAL |  |  |  |
| UC-17 | View Participant Registrations | Tìm và lọc đăng ký theo cuộc thi, hạng mục và trạng thái nộp. Kiểm tra phạm vi quyền Organizer. (SRS §2.2–3, CR-03) | TODO |  |  |  |
| UC-34 | Browse & Register for Contests | Tìm cuộc thi đang mở, xem và chấp nhận thể lệ, đăng ký hạng mục hợp lệ. Thử đăng ký trùng, ngoài hạn và xung đột vai trò. (SRS §3, BR-08/21) | PARTIAL |  |  |  |

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
| UC-21 | Request Negative / Contact Sheet Proof | Organizer gửi yêu cầu âm bản hoặc contact sheet với hạn do mình đặt. Kiểm tra thí sinh thấy hạn đúng và Organizer xử lý thủ công khi quá hạn. (BR-06/19) | PARTIAL |  |  |  |
| UC-22 | Verify & Approve Submission | Duyệt bài đạt chuẩn kỹ thuật vào danh sách chấm. Thử bài yêu cầu đối chứng và xác nhận hệ thống chỉ cho duyệt sau xác minh. (BR-06/07/09) | PARTIAL |  |  |  |
| UC-23 | Disqualify / Reject Submission | Organizer loại bài vi phạm. Thiếu lý do thì bị chặn; khi thành công kiểm tra trạng thái và AuditLog. (BR-18, CR-04) | DONE |  |  |  |
| UC-37 | Submit Film Photograph | Nộp ảnh đúng chuẩn, đủ metadata/tuyên ngôn, gắn đăng ký và cuộn/frame thuộc quyền. Thử quá hạn, quá số bài, trùng cuộn/frame và thiếu đối chứng bắt buộc. (BR-05–08/22–24) | PARTIAL |  |  |  |
| UC-38 | Upload Negative / Contact Sheet Proof | Tải âm bản hoặc contact sheet cho bài của mình. Kiểm tra Organizer có quyền xem đúng bằng chứng. Quá hạn do Organizer xử lý thủ công. (BR-06/19, CR-03) | PARTIAL |  |  |  |
| UC-39 | Edit / Withdraw Submission | Sửa thông số hoặc rút bài khi còn hạn và chưa vào chấm. Thử cả hai điều kiện chặn. Nếu thay ảnh, bài trở lại kiểm duyệt. (SRS §3, BR-08/24) | PARTIAL |  |  |  |
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
| UC-24 | Monitor Judging Progress | Theo từng vòng và Judge, đối chiếu số bài được giao, số bài đã chấm và trạng thái xác nhận điểm. (SRS §2.2) | PARTIAL |  |  |  |
| UC-25 | Finalize Judging Round | Thử chốt khi còn phiếu bắt buộc chưa xác nhận. Khi đủ, khóa vòng, xếp theo điểm trung bình có trọng số và chọn đúng số bài đi tiếp. (BR-14/25) | PARTIAL |  |  |  |
| UC-29 | View Assigned Submissions | Judge chỉ thấy bài được giao. Kiểm tra cả UI lẫn phản hồi API đều ẩn tên, email, avatar, ID và dữ liệu định danh tác giả. (BR-12, CR-03) | PARTIAL |  |  |  |
| UC-30 | Inspect High-Res Image & Film Metadata | Judge phóng to ảnh scan độ phân giải cao và xem metadata chụp/tráng/scan. Kiểm tra ảnh và dữ liệu giữ ẩn danh. (SRS §2.2–3, BR-12) | PARTIAL (Backend DONE) |  |  |  |
| UC-31 | Score & Comment on Submission | Chấm theo từng tiêu chí và lưu nhận xét. Đối chiếu tổng điểm có trọng số. Thử xem điểm/nhận xét của Judge khác trước khi vòng kết thúc. (BR-13/15) | PARTIAL |  |  |  |
| UC-32 | Update Evaluation Score | Sửa điểm và nhận xét trước khi khóa, kiểm tra lưu vết cập nhật. Thử sửa lại sau khóa và xác nhận bị từ chối. (SRS §2.2, CR-04) | PARTIAL |  |  |  |
| UC-33 | Lock & Confirm Final Evaluations | Judge xác nhận hoàn tất và khóa phiếu cá nhân cho vòng được giao. Kiểm tra trạng thái đã khóa và chặn thay đổi tiếp theo. (SRS §2.2–3) | PARTIAL |  |  |  |

### M08 Archive & Exhibition

Công bố kết quả, tổng hợp portfolio và trưng bày tác phẩm. 0/5 UC hoàn thành · PARTIAL

| UC ID | Chức năng | Tiêu chí nghiệm thu | Trạng thái nhóm | GV đạt | GV chưa đạt | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | Công bố thứ hạng và giải từ vòng cuối đã chốt với đủ đối chứng theo thể lệ. Làm tròn hai chữ số, ghi lý do khi đồng điểm và thử sửa sau công bố. (BR-06/16/25) | PARTIAL |  |  |  |
| UC-27 | Manage Digital Archive & Exhibition | Chọn tác phẩm đưa vào triển lãm. Kiểm tra bản công khai tối ưu có bản quyền và bản gốc độ phân giải cao vẫn riêng tư. (BR-17) | PARTIAL |  |  |  |
| UC-41 | View Contest Results & Judge Feedback | Participant xem kết quả chung cuộc, điểm trung bình và nhận xét cho bài của mình sau công bố. Thử truy cập phản hồi của tài khoản khác. (SRS §2.2–3, CR-03) | PARTIAL |  |  |  |
| UC-42 | Manage Personal Film Portfolio | Mở portfolio cá nhân và đối chiếu tác phẩm với lịch sử nộp bài, kết quả tương ứng. Kiểm tra phạm vi tài khoản. (SRS §2.2–3, CR-03) | PARTIAL |  |  |  |
| UC-43 | Explore Digital Archive & Gallery | Khách xem kho ảnh đã công bố và lọc theo phim, máy, năm. Kiểm tra bài chưa công bố và ảnh gốc được bảo vệ. (SRS §2.2–3, BR-17) | PARTIAL |  |  |  |

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
