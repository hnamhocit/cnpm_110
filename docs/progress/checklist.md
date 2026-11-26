# Checklist nghiệm thu CINEGEN

## 1. Trạng thái nghiệm thu

Cập nhật ngày 2026-11-26 theo SRS và bằng chứng kiểm thử bên dưới. DONE ở cột Backend ghi nhận nghiệm thu API/nghiệp vụ. DONE ở cột Toàn luồng yêu cầu các client áp dụng đã được nghiệm thu cùng Backend. PARTIAL còn phần chưa hoàn tất hoặc chưa kiểm thử. TODO chưa có triển khai trong phạm vi đó. Giảng viên đánh dấu GV đạt/GV chưa đạt sau khi kiểm tra.

| Phạm vi | Đã đạt | PARTIAL | TODO |
| --- | --- | --- | --- |
| Backend | 22/43 | 16 | 5 |
| Toàn luồng | 8/43 | 34 | 1 |

| FR | Nhóm chức năng | Backend đạt | Toàn luồng đạt |
| --- | --- | --- | --- |
| FR-01 | Xác thực và phân quyền | 5/5 | 5/5 |
| FR-02 | Quản trị và danh mục | 0/5 | 0/5 |
| FR-03 | Cấu hình cuộc thi | 5/5 | 0/5 |
| FR-04 | Phân công và đăng ký | 1/3 | 0/3 |
| FR-05 | Film Roll và Frame | 0/2 | 0/2 |
| FR-06 | Nộp và theo dõi bài | 1/4 | 1/4 |
| FR-07 | Thẩm định và kiểm duyệt | 4/4 | 2/4 |
| FR-08 | AI và phân tích | 1/3 | 0/3 |
| FR-09 | Chấm và chốt vòng | 2/7 | 0/7 |
| FR-10 | Kết quả và triển lãm | 3/5 | 0/5 |

### Bằng chứng kiểm thử

| Mã | Bằng chứng | Kết quả gần nhất |
| --- | --- | --- |
| E1 | [Integration Backend và audit](../../apps/api/tests/organizer-usecases.integration.test.ts) | 16 test, 120 assertions đạt. Ca gửi SMTP thật chạy riêng. |
| E2 | [Seed và API smoke test](../../apps/api/tests/acceptance-seed.integration.test.ts) | 9 test, 91 assertions đạt. Registration/Frame chưa thể nghiệm thu. |
| E3 | SMTP thật và luồng tự gửi | Email proof đã xác nhận trong hộp thư test. Worker tự xử lý request proof và retry, không cần lệnh gửi. |

39 test API hiện có, TypeScript API/Web, kiểm tra migration và diff đã đạt. E1/E2 bao phủ các ca ghi trong checklist, chưa xác nhận toàn bộ tổ hợp lỗi và concurrency. Những UC DONE từ trước giữ theo hồ sơ nghiệm thu nhóm.

## 2. Functional Acceptance Checklist

### M01 Authentication & RBAC

Xác thực email, quản lý phiên, hồ sơ và phân quyền theo vai trò.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Register / Login / Logout | Đăng ký Participant bằng email duy nhất, xác minh email rồi đăng nhập bằng JWT. Từ chối email trùng và token phiên đã đăng xuất. (BR-01/04) | DONE | DONE |  |  |  |
| UC-02 | Recover Password | Yêu cầu khôi phục qua email, mở liên kết và đặt mật khẩu mới. Kiểm tra mật khẩu cũ bị từ chối. (SRS §2.2) | DONE | DONE |  |  |  |
| UC-03 | View & Update Profile | Xem và sửa hồ sơ, ảnh đại diện, mật khẩu của chính mình. Tải lại để kiểm tra dữ liệu đã lưu. (SRS §2.2, CR-01/03) | DONE | DONE |  |  |  |
| UC-04 | Manage User Accounts | Admin tạo, xem, khóa và mở khóa tài khoản. API bảo vệ từ chối tài khoản bị khóa. Kiểm tra phiên cũ vẫn bị thu hồi sau mở khóa. (BR-02/04, M01) | DONE | DONE |  |  |  |
| UC-05 | Manage Roles & Permissions | Admin gán một trong 4 vai trò cố định. Kiểm tra quyền mới trên màn hình và API, kể cả thu hồi phiên cũ khi đổi vai trò. (BR-02, CR-03, M01) | DONE | DONE |  |  |  |

### M02 Analog Master Data

Chuẩn hóa danh mục phim, thân máy, ống kính và phòng Lab.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-06 | Manage Film Stock Catalog | Admin tạo/sửa Film Stock với hãng, tên, ISO và loại phim. Vô hiệu hóa vẫn giữ dữ liệu lịch sử. (BR-02/03) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |
| UC-07 | Manage Camera & Lens Catalog | Admin tạo/sửa và tra cứu thân máy, ống kính. Kiểm tra dữ liệu dùng được khi khai báo thông số ảnh. (BR-02/22) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |
| UC-08 | Manage Film Lab Directory | Admin tạo/sửa và tra cứu Lab tráng/quét phim. Kiểm tra Lab chọn được trong metadata. (BR-02/22) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |

### M03 Contest Lifecycle

Cấu hình, đăng ký và vận hành cuộc thi theo lịch, hạng mục và vòng chấm.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-11 | Create / Duplicate Contest | Tạo cuộc thi với năm mốc hợp lệ. Sao chép hạng mục, tiêu chí, vòng, thể lệ và giải sang DRAFT có lịch mới. Kiểm tra bản sao trống đăng ký, bài, điểm và kết quả. (SRS §3, BR-08) | DONE | PARTIAL |  |  | Backend E1/E2 đạt. Web đã tích hợp cấu hình, còn nghiệm thu toàn luồng tạo/sao chép. |
| UC-12 | Update Contest Configuration | Sửa thông tin, hạn nộp và thể lệ khi cuộc thi chưa đóng. Từ chối lịch sai thứ tự: mở đăng ký, hạn nộp, bắt đầu chấm, kết thúc chấm, công bố. (BR-08) | DONE | PARTIAL |  |  | Backend E1 đạt. Còn nghiệm thu luồng sửa trên Web. |
| UC-13 | Manage Contest Categories | Organizer thêm, sửa, kích hoạt/vô hiệu hóa hạng mục. Kiểm tra Participant chỉ đăng ký được hạng mục hợp lệ. (SRS §2.2–3) | DONE | PARTIAL |  |  | Backend quản lý hạng mục đạt E1. Đăng ký Participant còn phụ thuộc UC-34. |
| UC-14 | Configure Judging Criteria | Lưu tiêu chí và trọng số theo hạng mục. Chấp nhận tổng đúng 100% và báo MSG007 khi tổng sai. (BR-15) | DONE | PARTIAL |  |  | Backend trọng số và rollback đạt E1. Còn nghiệm thu Web với dữ liệu thật. |
| UC-15 | Manage Judging Rounds | Cấu hình một hoặc nhiều vòng chấm, thời hạn từng vòng và số bài đi tiếp. Mở lại để kiểm tra cấu hình đã lưu. (SRS §2.2, BR-14) | DONE | PARTIAL |  |  | Backend vòng chấm đạt E1. Còn nghiệm thu giao diện cấu hình vòng. |
| UC-16 | Assign Judges to Categories | Phân công theo hạng mục/vòng, bảo đảm ít nhất một Judge hoạt động. Thử tài khoản có xung đột với vai trò Participant trong cùng cuộc thi. (BR-20/21) | DONE | PARTIAL |  |  | Backend phân công đạt E1. Còn nối và nghiệm thu Web theo hạng mục/vòng. |
| UC-17 | View Participant Registrations | Tìm và lọc đăng ký theo cuộc thi, hạng mục và trạng thái nộp. Kiểm tra phạm vi quyền Organizer. (SRS §2.2–3, CR-03) | TODO | TODO |  |  | Thiếu schema/API đăng ký để nghiệm thu danh sách Organizer. |
| UC-34 | Browse & Register for Contests | Tìm cuộc thi đang mở, xem và chấp nhận thể lệ, đăng ký hạng mục hợp lệ. Thử đăng ký trùng, ngoài hạn và xung đột vai trò. (SRS §3, BR-08/21) | PARTIAL | PARTIAL |  |  | Có giao diện duyệt cuộc thi. Thiếu schema/API đăng ký hạng mục. |

### M04 Film Logbook

Quản lý cuộn phim cá nhân và metadata của từng khung hình.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-35 | Manage Film Roll Log | Tạo và quản lý cuộn của mình với tên phim, khổ, ISO, máy, ngày lắp và Lab. Kiểm tra tài khoản khác bị chặn truy cập. (SRS §2.2–3, CR-03) | PARTIAL | PARTIAL |  |  | Có bảng Film Roll. Còn API và luồng Logbook theo SRS. |
| UC-36 | Manage Frame Metadata | Lưu ống kính, địa điểm, phơi sáng nếu có. Từ chối số frame không nguyên dương hoặc trùng trong cuộn; chấp nhận số hợp lệ theo BR-23. (SRS §2.2, BR-23) | PARTIAL | PARTIAL |  |  | Thiếu schema/API Frame và liên kết frame chuẩn hóa. |

### M05 Submission & Proof

Nhận bài dự thi, kiểm duyệt, xác minh đối chứng và theo dõi trạng thái.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-18 | View Submission Queue | Mở hàng đợi cuộc thi thuộc quyền. Đối chiếu danh sách bài, trạng thái kiểm duyệt và nhãn cảnh báo AI. (SRS §2.2, CR-03) | DONE | DONE |  |  |  |
| UC-21 | Request Negative / Contact Sheet Proof | Organizer gửi yêu cầu âm bản hoặc contact sheet với hạn do mình đặt. Kiểm tra thí sinh thấy hạn đúng và Organizer xử lý thủ công khi quá hạn. (BR-06/19) | DONE | PARTIAL |  |  | Backend thông báo, deadline và SMTP thật đạt E1/E3. Còn nghiệm thu màn Participant. |
| UC-22 | Verify & Approve Submission | Duyệt bài đạt chuẩn kỹ thuật vào danh sách chấm. Thử bài yêu cầu đối chứng và xác nhận hệ thống chỉ cho duyệt sau xác minh. (BR-06/07/09) | DONE | PARTIAL |  |  | Backend chặn duyệt trước xác minh proof đạt E1. Còn nghiệm thu toàn luồng. |
| UC-23 | Disqualify / Reject Submission | Organizer loại bài vi phạm. Thiếu lý do thì bị chặn; khi thành công kiểm tra trạng thái và AuditLog. (BR-18, CR-04) | DONE | DONE |  |  |  |
| UC-37 | Submit Film Photograph | Nộp ảnh đúng chuẩn, đủ metadata/tuyên ngôn, gắn đăng ký và cuộn/frame thuộc quyền. Thử quá hạn, quá số bài, trùng cuộn/frame và thiếu đối chứng bắt buộc. (BR-05–08/22–24) | PARTIAL | PARTIAL |  |  | Còn đăng ký hạng mục và liên kết Roll/Frame theo SRS. |
| UC-38 | Upload Negative / Contact Sheet Proof | Tải âm bản hoặc contact sheet cho bài của mình. Kiểm tra Organizer có quyền xem đúng bằng chứng. Quá hạn do Organizer xử lý thủ công. (BR-06/19, CR-03) | PARTIAL | PARTIAL |  |  | Còn nghiệm thu API upload proof và giao diện với tệp thật. |
| UC-39 | Edit / Withdraw Submission | Sửa thông số hoặc rút bài khi còn hạn và chưa vào chấm. Thử cả hai điều kiện chặn. Nếu thay ảnh, bài trở lại kiểm duyệt. (SRS §3, BR-08/24) | TODO | PARTIAL |  |  | Chưa có route Backend sửa/rút bài, còn tích hợp client theo BR-08/24. |
| UC-40 | Track Submission Status | Mở và làm mới bài của mình sau thay đổi kiểm duyệt. Đối chiếu trạng thái mới với dữ liệu lưu và thử truy cập bài người khác. (SRS §2.2–3, CR-03) | DONE | DONE |  |  |  |

Chuẩn ảnh theo thể lệ (BR-07): JPG/JPEG, TIFF tùy chọn, mặc định tối đa 25 MB và cạnh ngắn tối thiểu 2000 px. Chấm ẩn danh yêu cầu ảnh không có dấu hiệu định danh.

Metadata đối chiếu theo BR-22: Film Stock, Film Format, ISO, Camera Body, Lens, số frame, Developing Lab hoặc Home Development, thông số scan và địa điểm. Lens, thông số scan và địa điểm có thể ghi không rõ hoặc không áp dụng nếu thể lệ cho phép.

### M06 AI Verification

Sàng lọc ảnh bằng AI và hỗ trợ Organizer đối chiếu, ra quyết định.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-09 | Configure AI Thresholds | Admin cấu hình ngưỡng cảnh báo ảnh tạo sinh và tương đồng. Dùng ảnh đại diện kiểm tra kết quả hai phía của ngưỡng. (BR-09/10) | PARTIAL | PARTIAL |  |  |  |
| UC-19 | Trigger AI Verification Scan | Organizer kích hoạt quét từng bài và hàng loạt. Kiểm tra xử lý nền cho trùng ảnh, ảnh AI và gợi ý thẻ. (BR-09–11, SRS §5) | PARTIAL | PARTIAL |  |  |  |
| UC-20 | Review AI Flagged Submissions | Xem điểm AI, điểm tương đồng và ảnh khớp theo quyền. Đối chiếu ảnh thi với bằng chứng cạnh nhau. Organizer quyết định và ghi lý do khi gỡ cờ. (BR-09/10/18) | PARTIAL | PARTIAL |  |  |  |

### M07 Blind Judging

Phân phối bài ẩn danh, chấm độc lập, khóa phiếu và chốt vòng.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-24 | Monitor Judging Progress | Theo từng vòng và Judge, đối chiếu số bài được giao, số bài đã chấm và trạng thái xác nhận điểm. (SRS §2.2) | DONE | PARTIAL |  |  | Backend owner và tiến độ riêng từng vòng đạt E1. Còn nghiệm thu Web. |
| UC-25 | Finalize Judging Round | Thử chốt khi còn phiếu bắt buộc chưa xác nhận. Khi đủ, khóa vòng, xếp theo điểm trung bình có trọng số và chọn đúng số bài đi tiếp. (BR-14/25) | PARTIAL | PARTIAL |  |  | Chốt/chuyển vòng, transaction và tách công bố đạt E1. Còn xác nhận đồng điểm tại ranh giới đi tiếp. |
| UC-29 | View Assigned Submissions | Judge chỉ thấy bài được giao. Kiểm tra cả UI lẫn phản hồi API đều ẩn tên, email, avatar, ID và dữ liệu định danh tác giả. (BR-12, CR-03) | PARTIAL | PARTIAL |  |  |  |
| UC-30 | Inspect High-Res Image & Film Metadata | Judge phóng to ảnh scan độ phân giải cao và xem metadata chụp/tráng/scan. Kiểm tra ảnh và dữ liệu giữ ẩn danh. (SRS §2.2–3, BR-12) | DONE | PARTIAL |  |  |  |
| UC-31 | Score & Comment on Submission | Chấm theo từng tiêu chí và lưu nhận xét. Đối chiếu tổng điểm có trọng số. Thử xem điểm/nhận xét của Judge khác trước khi vòng kết thúc. (BR-13/15) | PARTIAL | PARTIAL |  |  |  |
| UC-32 | Update Evaluation Score | Sửa điểm và nhận xét trước khi khóa, kiểm tra lưu vết cập nhật. Thử sửa lại sau khóa và xác nhận bị từ chối. (SRS §2.2, CR-04) | PARTIAL | PARTIAL |  |  |  |
| UC-33 | Lock & Confirm Final Evaluations | Judge xác nhận hoàn tất và khóa phiếu cá nhân cho vòng được giao. Kiểm tra trạng thái đã khóa và chặn thay đổi tiếp theo. (SRS §2.2–3) | PARTIAL | PARTIAL |  |  |  |

### M08 Archive & Exhibition

Công bố kết quả, tổng hợp portfolio và trưng bày tác phẩm.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | Công bố thứ hạng và giải từ vòng cuối đã chốt với đủ đối chứng theo thể lệ. Làm tròn hai chữ số, ghi lý do khi đồng điểm và thử sửa sau công bố. (BR-06/16/25) | DONE | PARTIAL |  |  | Backend công bố, snapshot và điều kiện proof đạt E1/E2. Còn ca đồng điểm và nghiệm thu giao diện. |
| UC-27 | Manage Digital Archive & Exhibition | Chọn tác phẩm đưa vào triển lãm. Kiểm tra bản công khai tối ưu có bản quyền và bản gốc độ phân giải cao vẫn riêng tư. (BR-17) | DONE | PARTIAL |  |  | Backend preview WebP, bảo vệ master và xóa mềm đạt E1/E2. Còn nghiệm thu Web. |
| UC-41 | View Contest Results & Judge Feedback | Participant xem kết quả chung cuộc, điểm trung bình và nhận xét cho bài của mình sau công bố. Thử truy cập phản hồi của tài khoản khác. (SRS §2.2–3, CR-03) | DONE | PARTIAL |  |  | Backend điểm và feedback đúng Participant đạt E1/E2. Còn nghiệm thu client. |
| UC-42 | Manage Personal Film Portfolio | Mở portfolio cá nhân và đối chiếu tác phẩm với lịch sử nộp bài, kết quả tương ứng. Kiểm tra phạm vi tài khoản. (SRS §2.2–3, CR-03) | PARTIAL | PARTIAL |  |  |  |
| UC-43 | Explore Digital Archive & Gallery | Khách xem kho ảnh đã công bố và lọc theo phim, máy, năm. Kiểm tra bài chưa công bố và ảnh gốc được bảo vệ. (SRS §2.2–3, BR-17) | PARTIAL | PARTIAL |  |  |  |

### M09 Shared API Contracts

Chuẩn hóa API và dữ liệu trao đổi cho các nền tảng. UC riêng: N/A · PARTIAL

Nghiệm thu tại phần 3.

### M10 Database Schema & Cloud Storage

Bảo toàn dữ liệu nghiệp vụ, phân quyền ảnh gốc và ảnh công khai. UC riêng: N/A · PARTIAL

Nghiệm thu tại phần 3.

### M11 Cross-Cutting Services

Tra cứu nhật ký, gửi thông báo và cung cấp báo cáo cuộc thi.

| UC ID | Chức năng | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-10 | View System Audit Logs | Admin tra cứu nhật ký thao tác nhạy cảm. Kiểm tra người thực hiện, thời điểm, hành động, dữ liệu cũ/mới và lý do. (BR-18, CR-04) | PARTIAL | PARTIAL |  |  | Audit ghi dùng chung đã có. Thiếu API/UI tra cứu và kiểm tra quyền đọc UC-10. |
| UC-28 | Export Contest Analytics Report | Organizer xem thống kê DB theo cuộc thi/hạng mục và xuất báo cáo. Kiểm tra AI chỉ nhận số liệu tổng hợp không định danh và số liệu/xuất vẫn dùng được khi AI lỗi. (SRS §3) | DONE | PARTIAL |  |  | Backend đã nghiệm thu theo hồ sơ trước. Còn Web xuất báo cáo và nhà cung cấp AI thật. |


## 3. Nghiệm thu kỹ thuật dùng chung

| Hạng mục | Tiêu chí nghiệm thu | Kết quả hiện tại | Còn cần nghiệm thu | GV đạt | GV chưa đạt |
| --- | --- | --- | --- | --- | --- |
| M09 · API/OpenAPI | Method, path, status và DTO khớp API/client. | PARTIAL | FPC-130 chưa nghiệm thu toàn bộ endpoint. | | |
| M09 · Validation | Bắt buộc, type, enum, miền giá trị, email và múi giờ. | PARTIAL | Có ca Backend đạt E1/E2, còn ma trận đầy đủ theo endpoint và client. | | |
| M09 · Bảo mật | JWT, RBAC, owner, thu hồi phiên, blind judging và dữ liệu public. | PARTIAL | Hồi quy đủ route và các client theo FPC-130. | | |
| M09 · Hiệu năng | API nghiệp vụ thông thường dưới 500 ms trong môi trường được ghi nhận. | Chưa kiểm tra | Đo riêng tải ảnh và AI. | | |
| M10 · Toàn vẹn dữ liệu | Xóa mềm, mã duy nhất, khóa kết quả, liên kết Roll/Frame. | PARTIAL | Khóa kết quả/xóa mềm đạt E1, seed đạt E2. Còn registration/Frame. | | |
| M10 · Transaction/đồng thời | Thất bại rollback, thao tác cạnh tranh giữ trạng thái nhất quán. | PARTIAL | Transaction chốt vòng và audit đã kiểm tra, còn stress/concurrency. | | |
| M10 · Storage | Original/proof riêng tư, link có hạn, preview công khai đúng quyền. | PARTIAL | Local proof/preview đạt E1/E2, còn nghiệm thu storage cloud. | | |
| M11 · Audit | Actor, thời gian, action, old/new và reason khớp thay đổi đã lưu. | PARTIAL | Ghi audit đạt E1, quyền HTTP đọc chờ UC-10/FPC-125. | | |
| M11 · Email/in-app | Đúng người, sự kiện, deadline và trạng thái gửi/retry thực tế. | Backend đạt | E1/E3 đạt, còn nghiệm thu hiển thị trên client. | | |

### FPC-130 · Hợp đồng API

Chưa nghiệm thu tổng thể. Áp dụng từng ca cho từng endpoint thuộc UC-11–16, UC-21–22, UC-26–27 và UC-41.

| Test | Ca cần kiểm tra | Kết quả |
| --- | --- | --- |
| N130-01 | Method/path, quyền và schema, đối chiếu OpenAPI với Hono. | PARTIAL, đã sửa path triển lãm và alias feedback/result. |
| N130-02 | Request hợp lệ, HTTP status và response schema. | PARTIAL theo E1/E2. |
| N130-03 | Thiếu field bắt buộc, null và chuỗi rỗng. | Chưa đủ từng endpoint. |
| N130-04 | Sai type, enum, miền giá trị và timestamp. | Chưa đủ từng endpoint. |
| N130-05 | Thiếu token, sai chữ ký và hết hạn trên mọi route bảo vệ. | Test JWT chung đạt, chưa đủ từng route. |
| N130-06 | Participant/Judge gọi route Organizer. | Có ca E1, chưa đủ từng route. |
| N130-07 | O2 truy cập tài nguyên O1, kiểm tra dữ liệu trước/sau. | Có ca E1/E2, chưa đủ từng route. |
| N130-08 | ID không tồn tại và ID sai định dạng. | Chưa đủ từng endpoint. |
| N130-09 | UTC+7 qua request, response, DB và client. | Backend đạt E1, còn client. |
| N130-10 | Phân trang, bộ lọc, empty và cách ly cuộc thi. | Chưa đủ từng endpoint. |
| N130-11 | Lỗi có kiểm soát, response/log không lộ bí mật. | Chưa đủ từng endpoint. |
| N130-12 | Mutation lỗi không lưu dở dang hoặc đổi dữ liệu ngoài phạm vi. | Có ca E1, còn hồi quy đầy đủ. |
| N130-13 | Client thật dùng đúng method, URL, field, enum và status. | Chưa nghiệm thu toàn bộ client. |
| N130-14 | OpenAPI, ví dụ và client đồng bộ sau thay đổi. | PARTIAL, còn schema chi tiết và validation toàn tài liệu. |

### FPC-132 · Email, Notification, Audit

| Test | Nội dung nghiệm thu | Kết quả | Còn lại |
| --- | --- | --- | --- |
| N132-01 | Email proof đúng người, bài, loại và hạn qua SMTP thật. | PASS E3 | |
| N132-02 | P1 đọc thông báo và truy cập đúng bài/hạn. | PASS Backend E1 | Hiển thị client. |
| N132-03 | P2 không đọc thông báo/resource riêng của P1. | PASS E1 | |
| N132-04 | Sai owner/deadline không tạo sự kiện thành công. | PASS E1 | |
| N132-05 | Proof quá hạn giữ trạng thái chờ quyết định thủ công. | PASS E1 | |
| N132-06 | Duyệt/loại thông báo đúng Participant, trạng thái và lý do. | PASS E1 | |
| N132-07 | Công bố gửi đúng Participant của cuộc thi. | PASS Backend E1 | |
| N132-08 | Lỗi gửi lưu FAILED, giữ nghiệp vụ, không lộ secret. | PASS E1 | |
| N132-09 | Worker tự retry, lưu SENT và không tạo notification nghiệp vụ trùng. | PASS E1/E2 | Email có thể lặp nếu process dừng sau SMTP nhận, trước commit SENT. |
| N132-10 | Audit tạo/sửa Contest đúng actor và old/new. | PASS E1 | |
| N132-11 | Audit request proof, xác minh và duyệt khớp trạng thái/lý do. | PASS E1 | |
| N132-12 | Thiếu lý do bị chặn, quyết định hợp lệ có audit lý do. | PASS E1 | |
| N132-13 | Audit công bố khớp snapshot kết quả và lý do đồng điểm khi áp dụng. | PARTIAL | Audit công bố đạt E1, còn ca đồng điểm có lý do. |
| N132-14 | API AI và Judge ghi audit đúng thay đổi. | PASS tích hợp E1 | |
| N132-15 | Sai owner không có audit mutation thành công. | PASS E1 | |
| N132-16 | Quyền đọc audit/notification và loại bí mật khỏi log. | PARTIAL | Quyền đọc AuditLog chờ UC-10/FPC-125. |

### FPC-134 · Dữ liệu demo và API smoke test

| Test | Nội dung nghiệm thu | Kết quả | Còn lại |
| --- | --- | --- | --- |
| N134-01 | Migrate tự seed DB test mới, từ chối production/R2 thật. | PASS E2 | |
| N134-02 | Bảy tài khoản đăng nhập API thật, đúng role, lưu hash. | PASS E2 | |
| N134-03 | Contest/category đúng owner, mã duy nhất và FK hợp lệ. | PASS E2 | |
| N134-04 | Lịch, tiêu chí 100%, vòng, giải và assignment hợp lệ. | PASS E2 | |
| N134-05 | Registration, Roll/Frame và bài liên kết đúng Participant. | PARTIAL | Roll và metadata đạt, registration/Frame thiếu schema/API. |
| N134-06 | Scan/proof/preview tồn tại, đúng định dạng và quyền. | PASS E2 | |
| N134-07 | Điểm cuối 8.50/7.50 khớp phiếu và trọng số thật. | PASS E2 | |
| N134-08 | Fixture trước/sau công bố riêng, feedback đúng người. | PASS E2 | |
| N134-09 | Ca sai owner, thiếu proof và phiếu chưa khóa được cách ly. | PASS E2 | |
| N134-10 | Seed lặp không tăng bản ghi/file hoặc đổi trạng thái hiện tại. | PASS E2 | |
| N134-11 | Đăng nhập và đọc contest, bài, proof, preview, kết quả bằng API. | PASS E2 | |
| N134-12 | Alias, môi trường và quy trình tái tạo rõ, không chứa secret. | PASS E2 | [Hướng dẫn fixture](../../apps/api/README.md#fixture-nghiệm-thu). |

## 4. Nghiệm thu AI

| Hạng mục | Ca nghiệm thu | Kết quả hiện tại | GV đạt | GV chưa đạt |
| --- | --- | --- | --- | --- |
| Phát hiện ảnh trùng | Ảnh trùng/gần trùng/khác nhau, ngưỡng và quyền xem đối sánh. (BR-10) | PARTIAL, còn bộ ảnh thật và kiểm tra phạm vi. | | |
| Phát hiện ảnh AI | Mẫu hai phía ngưỡng, điểm/cờ và quyết định Organizer. (BR-09) | PARTIAL, còn model thật và cấu hình ngưỡng. | | |
| Gợi ý từ khóa/hạng mục | Tối đa 5 thẻ, điều chỉnh bởi Organizer, không tự loại bài. (BR-11) | PARTIAL, còn luồng điều chỉnh và ảnh thật. | | |
| AI Analytics | Số liệu đúng DB, payload không định danh, vẫn xuất khi AI lỗi. | Backend đạt theo hồ sơ trước, còn Web và provider thật. | | |
| Worker AI | Quét đơn/hàng loạt bất đồng bộ, phục hồi lỗi, đối chiếu kết quả. | PARTIAL, còn nghiệm thu toàn luồng và hiệu năng. | | |
| Quyết định kiểm duyệt | Đối sánh thật, proof đã xác minh, lý do/audit khi loại hoặc gỡ cờ. | Backend proof/audit đạt E1, còn AI và client toàn luồng. | | |

Precision, Recall, F1-score và Accuracy chưa có kết quả nghiệm thu.

## 5. Kết quả kiểm tra của giảng viên

Chỉ cộng 43 hàng UC ở phần 2. Các mục kỹ thuật không cộng thêm vào tổng UC.

| Đạt | Chưa đạt | Chưa kiểm tra | Tổng |
| --- | --- | --- | --- |
| | | | 43 |

| Nội dung | Ghi nhận |
| --- | --- |
| Nhận xét và yêu cầu bổ sung | |
| Kết luận nghiệm thu | |
| Ngày kiểm tra | |
| Chữ ký giảng viên | |
