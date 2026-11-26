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

## 1.1. Thành viên, phân công và tiến độ cá nhân

Danh sách hiện tại gồm **6 thành viên**, theo [phân công Sprint 5](sprints.md#sprint-5--feature-complete). Hoài Bảo Từ có công việc trong Sprint 1–2; giữ nguyên lịch sử đó, không tính vào danh sách phân công hiện tại.

**UC-01–05 dùng chung cho cả nhóm**: 5/5 Backend DONE, 5/5 toàn luồng DONE theo hồ sơ hiện có. Ghi nhận đóng góp cụ thể của từng người bằng task/PR; không cộng 5 UC này sáu lần vào tổng dự án.

“Đầu mối module” trong từng hàng UC là người điều phối nghiệm thu module theo bảng Module Owner, không có nghĩa người đó làm toàn bộ Backend/Web/Mobile. Phần triển khai của từng người giữ theo task đã chia bên dưới, gồm cả việc hỗ trợ module khác. Đặc biệt UC-17/34 do Nam làm đầu mối M03, Dương triển khai đăng ký; UC-26/27/41 do Nhân làm đầu mối M08, Nam phụ trách API.

### Tổng hợp để giảng viên đối chiếu

Số UC dưới đây tính theo **module phụ trách**, chỉ cộng DONE, không quy PARTIAL thành phần trăm. Đây là mức nghiệm thu chức năng, không phải điểm cá nhân. Khối lượng cá nhân tính theo task Sprint 5; DONE task không đồng nghĩa toàn bộ UC đã đạt.

| Thành viên | Module chính/phối hợp | Mảng triển khai được giao | UC riêng theo module | Backend DONE | Toàn luồng DONE | Task Sprint 5 DONE / được giao |
| --- | --- | --- | --- | --- | --- | --- |
| Nam Nguyễn | M03, M09; phối hợp M05/M08/M11 | Backend cấu hình cuộc thi, kết quả/triển lãm/feedback; Lead, API/OpenAPI, email/audit và seed | UC-11, UC-12, UC-13, UC-14, UC-15, UC-16, UC-17, UC-34 | 6/8 | 0/8 | 6/9 |
| Hà Đức Bình | M06, M10; phối hợp M07/M11 | Backend/AI: kiểm chứng ảnh, chấm/chốt vòng, thống kê; schema và storage | UC-09, UC-19, UC-20 | 0/3 | 0/3 | 0/6 |
| Vĩ Nguyễn | M11; tích hợp Web M02/M03/M05/M06/M08 | Web Admin/Organizer: danh mục, cấu hình, kiểm duyệt, AI, kết quả và báo cáo | UC-10, UC-28 | 1/2 | 0/2 | 0/8 |
| Phạm Tiến Thành Nhân | M07, M08 | Web: phân công/vòng chấm, workspace Judge và kho ảnh công khai | UC-24, UC-25, UC-26, UC-27, UC-29, UC-30, UC-31, UC-32, UC-33, UC-41, UC-42, UC-43 | 5/12 | 0/12 | 0/6 |
| Dương Nguyễn | M05; phối hợp M03/M08 | Backend/Web/Mobile: đăng ký, nộp/sửa/rút bài, kết quả; Backend kho ảnh | UC-18, UC-21, UC-22, UC-23, UC-37, UC-38, UC-39, UC-40 | 5/8 | 3/8 | 0/12 |
| Huỳnh Trần Gia Bảo | M02, M04; phối hợp M05/M08/M11 | Backend/Web/Mobile: danh mục, Logbook, upload proof, portfolio; Backend Audit Log | UC-06, UC-07, UC-08, UC-35, UC-36 | 0/5 | 0/5 | 0/13 |

38 UC riêng + 5 UC chung = 43 UC. Các task phối hợp liên quan cùng UC chỉ tính UC một lần. FPC-133 (nghiệm thu tích hợp) giao cả nhóm, không cộng vào mẫu số task cá nhân.

### Phần của Nam Nguyễn · cập nhật ngày 2026-11-26

Chỉ ghi nhận phạm vi Backend/Lead theo hồ sơ và bằng chứng hiện có; các client còn cần thành viên phụ trách nghiệm thu.

| Task | Mảng / UC và công việc | Tiến độ phần Nam | Bằng chứng / việc còn lại |
| --- | --- | --- | --- |
| FPC-083 | Backend · M03 · UC-11–14: Tạo/sao chép cuộc thi, timeline, hạng mục, tiêu chí | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-085 | Backend · M03 · UC-15–16: Vòng chấm và phân công Judge | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-093 | Backend · M05 · UC-21–22: Yêu cầu đối chứng có hạn, xác minh và duyệt bài | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-108 | Backend · M08 · UC-26: API công bố kết quả và vinh danh người thắng | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-109 | Backend · M08 · UC-27: Quản lý triển lãm và preview công khai | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-113 | Backend · M08 · UC-41: API kết quả, điểm và nhận xét cá nhân | DONE | Backend đạt E1/E2; xem hàng UC tương ứng ở phần 2. |
| FPC-130 | Lead · M09: Đồng bộ OpenAPI và kiểm soát thay đổi hợp đồng | TODO | Còn đối chiếu toàn bộ endpoint/DTO và hồi quy quyền theo phần 3. |
| FPC-132 | Backend · M11: Hoàn thiện email/thông báo và audit dùng chung theo SRS | IN REVIEW | E1/E3: proof, deadline, SMTP thật, worker/retry và audit đã kiểm tra; còn nghiệm thu client và quyền đọc audit UC-10. |
| FPC-134 | Backend · Chuẩn bị và kiểm chứng dữ liệu mẫu phục vụ demo (seed, không dùng mock thay API) | IN REVIEW | E2: seed/smoke test đạt; registration/Frame còn thiếu, giữ IN REVIEW. |

Nam: **6/9 task Sprint 5 DONE (66,7%)**, 2 IN REVIEW, 1 TODO. Các UC riêng của M03 có Backend 6/8 DONE, toàn luồng 0/8 DONE; phần API UC-21/22/26/27/41 được ghi nhận thêm theo task phối hợp, không chuyển quyền đầu mối module.

### Mỗi thành viên tự cập nhật phần được giao

Các số liệu tổng hợp phía trên lấy từ hồ sơ hiện tại. Các ô dưới đây chờ chính thành viên cập nhật, không mặc định là 0% hoặc đã hoàn tất. Khi bàn giao, ghi theo từng task: trạng thái TODO/IN PROGRESS/IN REVIEW/DONE, phần đã làm, phần còn lại và link PR/commit/kiểm thử; cập nhật hàng task tương ứng trong [bảng sprint](sprints.md). Chỉ sửa trạng thái nghiệm thu UC khi có bằng chứng đủ phạm vi ở phần 2.

| Thành viên tự cập nhật | Task Sprint 5 được giao | Đã làm / còn lại | Tiến độ tự báo cáo | PR/commit/kiểm thử | Ngày cập nhật |
| --- | --- | --- | --- | --- | --- |
| Nam Nguyễn | FPC-083, FPC-085, FPC-093, FPC-108, FPC-109, FPC-113, FPC-130, FPC-132, FPC-134 | Xem phần Nam phía trên. | 6 DONE, 2 IN REVIEW, 1 TODO | E1/E2/E3; chi tiết phần 2–3 | 2026-11-26 |
| Hà Đức Bình | FPC-102, FPC-104, FPC-106, FPC-127, FPC-129, FPC-131 | Chờ thành viên tự cập nhật theo từng task. | Chưa tự báo cáo | Chờ bổ sung | — |
| Vĩ Nguyễn | FPC-081, FPC-084, FPC-094, FPC-103, FPC-110, FPC-111, FPC-126, FPC-128 | Chờ thành viên tự cập nhật theo từng task. | Chưa tự báo cáo | Chờ bổ sung | — |
| Phạm Tiến Thành Nhân | FPC-086, FPC-105, FPC-107, FPC-116, FPC-117, FPC-118 | Chờ thành viên tự cập nhật theo từng task. | Chưa tự báo cáo | Chờ bổ sung | — |
| Dương Nguyễn | FPC-087, FPC-088, FPC-089, FPC-096, FPC-097, FPC-098, FPC-112, FPC-114, FPC-115, FPC-119, FPC-120, FPC-124 | Chờ thành viên tự cập nhật theo từng task. | Chưa tự báo cáo | Chờ bổ sung | — |
| Huỳnh Trần Gia Bảo | FPC-080, FPC-082, FPC-090, FPC-091, FPC-092, FPC-095, FPC-099, FPC-100, FPC-101, FPC-121, FPC-122, FPC-123, FPC-125 | Chờ thành viên tự cập nhật theo từng task. | Chưa tự báo cáo | Chờ bổ sung | — |

Giảng viên đối chiếu đóng góp cá nhân bằng task và bằng chứng, sau đó đánh dấu GV đạt/GV chưa đạt tại UC liên quan. Mỗi thành viên tự cập nhật tiến độ của mình trước buổi kiểm tra; phần dùng chung ghi rõ ai đóng góp gì trong cùng hàng hoặc liên kết bằng chứng.

## 2. Functional Acceptance Checklist

### M01 Authentication & RBAC

Xác thực email, quản lý phiên, hồ sơ và phân quyền theo vai trò.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Register / Login / Logout | Cả nhóm | Đăng ký Participant bằng email duy nhất, xác minh email rồi đăng nhập bằng JWT. Từ chối email trùng và token phiên đã đăng xuất. (BR-01/04) | DONE | DONE |  |  |  |
| UC-02 | Recover Password | Cả nhóm | Yêu cầu khôi phục qua email, mở liên kết và đặt mật khẩu mới. Kiểm tra mật khẩu cũ bị từ chối. (SRS §2.2) | DONE | DONE |  |  |  |
| UC-03 | View & Update Profile | Cả nhóm | Xem và sửa hồ sơ, ảnh đại diện, mật khẩu của chính mình. Tải lại để kiểm tra dữ liệu đã lưu. (SRS §2.2, CR-01/03) | DONE | DONE |  |  |  |
| UC-04 | Manage User Accounts | Cả nhóm | Admin tạo, xem, khóa và mở khóa tài khoản. API bảo vệ từ chối tài khoản bị khóa. Kiểm tra phiên cũ vẫn bị thu hồi sau mở khóa. (BR-02/04, M01) | DONE | DONE |  |  |  |
| UC-05 | Manage Roles & Permissions | Cả nhóm | Admin gán một trong 4 vai trò cố định. Kiểm tra quyền mới trên màn hình và API, kể cả thu hồi phiên cũ khi đổi vai trò. (BR-02, CR-03, M01) | DONE | DONE |  |  |  |

### M02 Analog Master Data

Chuẩn hóa danh mục phim, thân máy, ống kính và phòng Lab.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-06 | Manage Film Stock Catalog | Huỳnh Trần Gia Bảo | Admin tạo/sửa Film Stock với hãng, tên, ISO và loại phim. Vô hiệu hóa vẫn giữ dữ liệu lịch sử. (BR-02/03) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |
| UC-07 | Manage Camera & Lens Catalog | Huỳnh Trần Gia Bảo | Admin tạo/sửa và tra cứu thân máy, ống kính. Kiểm tra dữ liệu dùng được khi khai báo thông số ảnh. (BR-02/22) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |
| UC-08 | Manage Film Lab Directory | Huỳnh Trần Gia Bảo | Admin tạo/sửa và tra cứu Lab tráng/quét phim. Kiểm tra Lab chọn được trong metadata. (BR-02/22) | TODO | PARTIAL |  |  | Web quản trị đã có. Cần Backend CRUD/tra cứu và nghiệm thu tích hợp. |

### M03 Contest Lifecycle

Cấu hình, đăng ký và vận hành cuộc thi theo lịch, hạng mục và vòng chấm.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-11 | Create / Duplicate Contest | Nam Nguyễn | Tạo cuộc thi với năm mốc hợp lệ. Sao chép hạng mục, tiêu chí, vòng, thể lệ và giải sang DRAFT có lịch mới. Kiểm tra bản sao trống đăng ký, bài, điểm và kết quả. (SRS §3, BR-08) | DONE | PARTIAL |  |  | Backend E1/E2 đạt. Web đã tích hợp cấu hình, còn nghiệm thu toàn luồng tạo/sao chép. |
| UC-12 | Update Contest Configuration | Nam Nguyễn | Sửa thông tin, hạn nộp và thể lệ khi cuộc thi chưa đóng. Từ chối lịch sai thứ tự: mở đăng ký, hạn nộp, bắt đầu chấm, kết thúc chấm, công bố. (BR-08) | DONE | PARTIAL |  |  | Backend E1 đạt. Còn nghiệm thu luồng sửa trên Web. |
| UC-13 | Manage Contest Categories | Nam Nguyễn | Organizer thêm, sửa, kích hoạt/vô hiệu hóa hạng mục. Kiểm tra Participant chỉ đăng ký được hạng mục hợp lệ. (SRS §2.2–3) | DONE | PARTIAL |  |  | Backend quản lý hạng mục đạt E1. Đăng ký Participant còn phụ thuộc UC-34. |
| UC-14 | Configure Judging Criteria | Nam Nguyễn | Lưu tiêu chí và trọng số theo hạng mục. Chấp nhận tổng đúng 100% và báo MSG007 khi tổng sai. (BR-15) | DONE | PARTIAL |  |  | Backend trọng số và rollback đạt E1. Còn nghiệm thu Web với dữ liệu thật. |
| UC-15 | Manage Judging Rounds | Nam Nguyễn | Cấu hình một hoặc nhiều vòng chấm, thời hạn từng vòng và số bài đi tiếp. Mở lại để kiểm tra cấu hình đã lưu. (SRS §2.2, BR-14) | DONE | PARTIAL |  |  | Backend vòng chấm đạt E1. Còn nghiệm thu giao diện cấu hình vòng. |
| UC-16 | Assign Judges to Categories | Nam Nguyễn | Phân công theo hạng mục/vòng, bảo đảm ít nhất một Judge hoạt động. Thử tài khoản có xung đột với vai trò Participant trong cùng cuộc thi. (BR-20/21) | DONE | PARTIAL |  |  | Backend phân công đạt E1. Còn nối và nghiệm thu Web theo hạng mục/vòng. |
| UC-17 | View Participant Registrations | Nam Nguyễn | Tìm và lọc đăng ký theo cuộc thi, hạng mục và trạng thái nộp. Kiểm tra phạm vi quyền Organizer. (SRS §2.2–3, CR-03) | TODO | TODO |  |  | Thiếu schema/API đăng ký để nghiệm thu danh sách Organizer. |
| UC-34 | Browse & Register for Contests | Nam Nguyễn | Tìm cuộc thi đang mở, xem và chấp nhận thể lệ, đăng ký hạng mục hợp lệ. Thử đăng ký trùng, ngoài hạn và xung đột vai trò. (SRS §3, BR-08/21) | PARTIAL | PARTIAL |  |  | Có giao diện duyệt cuộc thi. Thiếu schema/API đăng ký hạng mục. |

### M04 Film Logbook

Quản lý cuộn phim cá nhân và metadata của từng khung hình.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-35 | Manage Film Roll Log | Huỳnh Trần Gia Bảo | Tạo và quản lý cuộn của mình với tên phim, khổ, ISO, máy, ngày lắp và Lab. Kiểm tra tài khoản khác bị chặn truy cập. (SRS §2.2–3, CR-03) | PARTIAL | PARTIAL |  |  | Có bảng Film Roll. Còn API và luồng Logbook theo SRS. |
| UC-36 | Manage Frame Metadata | Huỳnh Trần Gia Bảo | Lưu ống kính, địa điểm, phơi sáng nếu có. Từ chối số frame không nguyên dương hoặc trùng trong cuộn; chấp nhận số hợp lệ theo BR-23. (SRS §2.2, BR-23) | PARTIAL | PARTIAL |  |  | Thiếu schema/API Frame và liên kết frame chuẩn hóa. |

### M05 Submission & Proof

Nhận bài dự thi, kiểm duyệt, xác minh đối chứng và theo dõi trạng thái.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-18 | View Submission Queue | Dương Nguyễn | Mở hàng đợi cuộc thi thuộc quyền. Đối chiếu danh sách bài, trạng thái kiểm duyệt và nhãn cảnh báo AI. (SRS §2.2, CR-03) | DONE | DONE |  |  |  |
| UC-21 | Request Negative / Contact Sheet Proof | Dương Nguyễn | Organizer gửi yêu cầu âm bản hoặc contact sheet với hạn do mình đặt. Kiểm tra thí sinh thấy hạn đúng và Organizer xử lý thủ công khi quá hạn. (BR-06/19) | DONE | PARTIAL |  |  | Backend thông báo, deadline và SMTP thật đạt E1/E3. Còn nghiệm thu màn Participant. |
| UC-22 | Verify & Approve Submission | Dương Nguyễn | Duyệt bài đạt chuẩn kỹ thuật vào danh sách chấm. Thử bài yêu cầu đối chứng và xác nhận hệ thống chỉ cho duyệt sau xác minh. (BR-06/07/09) | DONE | PARTIAL |  |  | Backend chặn duyệt trước xác minh proof đạt E1. Còn nghiệm thu toàn luồng. |
| UC-23 | Disqualify / Reject Submission | Dương Nguyễn | Organizer loại bài vi phạm. Thiếu lý do thì bị chặn; khi thành công kiểm tra trạng thái và AuditLog. (BR-18, CR-04) | DONE | DONE |  |  |  |
| UC-37 | Submit Film Photograph | Dương Nguyễn | Nộp ảnh đúng chuẩn, đủ metadata/tuyên ngôn, gắn đăng ký và cuộn/frame thuộc quyền. Thử quá hạn, quá số bài, trùng cuộn/frame và thiếu đối chứng bắt buộc. (BR-05–08/22–24) | PARTIAL | PARTIAL |  |  | Còn đăng ký hạng mục và liên kết Roll/Frame theo SRS. |
| UC-38 | Upload Negative / Contact Sheet Proof | Dương Nguyễn | Tải âm bản hoặc contact sheet cho bài của mình. Kiểm tra Organizer có quyền xem đúng bằng chứng. Quá hạn do Organizer xử lý thủ công. (BR-06/19, CR-03) | PARTIAL | PARTIAL |  |  | Còn nghiệm thu API upload proof và giao diện với tệp thật. |
| UC-39 | Edit / Withdraw Submission | Dương Nguyễn | Sửa thông số hoặc rút bài khi còn hạn và chưa vào chấm. Thử cả hai điều kiện chặn. Nếu thay ảnh, bài trở lại kiểm duyệt. (SRS §3, BR-08/24) | TODO | PARTIAL |  |  | Chưa có route Backend sửa/rút bài, còn tích hợp client theo BR-08/24. |
| UC-40 | Track Submission Status | Dương Nguyễn | Mở và làm mới bài của mình sau thay đổi kiểm duyệt. Đối chiếu trạng thái mới với dữ liệu lưu và thử truy cập bài người khác. (SRS §2.2–3, CR-03) | DONE | DONE |  |  |  |

Chuẩn ảnh theo thể lệ (BR-07): JPG/JPEG, TIFF tùy chọn, mặc định tối đa 25 MB và cạnh ngắn tối thiểu 2000 px. Chấm ẩn danh yêu cầu ảnh không có dấu hiệu định danh.

Metadata đối chiếu theo BR-22: Film Stock, Film Format, ISO, Camera Body, Lens, số frame, Developing Lab hoặc Home Development, thông số scan và địa điểm. Lens, thông số scan và địa điểm có thể ghi không rõ hoặc không áp dụng nếu thể lệ cho phép.

### M06 AI Verification

Sàng lọc ảnh bằng AI và hỗ trợ Organizer đối chiếu, ra quyết định.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-09 | Configure AI Thresholds | Hà Đức Bình | Admin cấu hình ngưỡng cảnh báo ảnh tạo sinh và tương đồng. Dùng ảnh đại diện kiểm tra kết quả hai phía của ngưỡng. (BR-09/10) | PARTIAL | PARTIAL |  |  |  |
| UC-19 | Trigger AI Verification Scan | Hà Đức Bình | Organizer kích hoạt quét từng bài và hàng loạt. Kiểm tra xử lý nền cho trùng ảnh, ảnh AI và gợi ý thẻ. (BR-09–11, SRS §5) | PARTIAL | PARTIAL |  |  |  |
| UC-20 | Review AI Flagged Submissions | Hà Đức Bình | Xem điểm AI, điểm tương đồng và ảnh khớp theo quyền. Đối chiếu ảnh thi với bằng chứng cạnh nhau. Organizer quyết định và ghi lý do khi gỡ cờ. (BR-09/10/18) | PARTIAL | PARTIAL |  |  |  |

### M07 Blind Judging

Phân phối bài ẩn danh, chấm độc lập, khóa phiếu và chốt vòng.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-24 | Monitor Judging Progress | Phạm Tiến Thành Nhân | Theo từng vòng và Judge, đối chiếu số bài được giao, số bài đã chấm và trạng thái xác nhận điểm. (SRS §2.2) | DONE | PARTIAL |  |  | Backend owner và tiến độ riêng từng vòng đạt E1. Còn nghiệm thu Web. |
| UC-25 | Finalize Judging Round | Phạm Tiến Thành Nhân | Thử chốt khi còn phiếu bắt buộc chưa xác nhận. Khi đủ, khóa vòng, xếp theo điểm trung bình có trọng số và chọn đúng số bài đi tiếp. (BR-14/25) | PARTIAL | PARTIAL |  |  | Chốt/chuyển vòng, transaction và tách công bố đạt E1. Còn xác nhận đồng điểm tại ranh giới đi tiếp. |
| UC-29 | View Assigned Submissions | Phạm Tiến Thành Nhân | Judge chỉ thấy bài được giao. Kiểm tra cả UI lẫn phản hồi API đều ẩn tên, email, avatar, ID và dữ liệu định danh tác giả. (BR-12, CR-03) | PARTIAL | PARTIAL |  |  |  |
| UC-30 | Inspect High-Res Image & Film Metadata | Phạm Tiến Thành Nhân | Judge phóng to ảnh scan độ phân giải cao và xem metadata chụp/tráng/scan. Kiểm tra ảnh và dữ liệu giữ ẩn danh. (SRS §2.2–3, BR-12) | DONE | PARTIAL |  |  |  |
| UC-31 | Score & Comment on Submission | Phạm Tiến Thành Nhân | Chấm theo từng tiêu chí và lưu nhận xét. Đối chiếu tổng điểm có trọng số. Thử xem điểm/nhận xét của Judge khác trước khi vòng kết thúc. (BR-13/15) | PARTIAL | PARTIAL |  |  |  |
| UC-32 | Update Evaluation Score | Phạm Tiến Thành Nhân | Sửa điểm và nhận xét trước khi khóa, kiểm tra lưu vết cập nhật. Thử sửa lại sau khóa và xác nhận bị từ chối. (SRS §2.2, CR-04) | PARTIAL | PARTIAL |  |  |  |
| UC-33 | Lock & Confirm Final Evaluations | Phạm Tiến Thành Nhân | Judge xác nhận hoàn tất và khóa phiếu cá nhân cho vòng được giao. Kiểm tra trạng thái đã khóa và chặn thay đổi tiếp theo. (SRS §2.2–3) | PARTIAL | PARTIAL |  |  |  |

### M08 Archive & Exhibition

Công bố kết quả, tổng hợp portfolio và trưng bày tác phẩm.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | Phạm Tiến Thành Nhân | Công bố thứ hạng và giải từ vòng cuối đã chốt với đủ đối chứng theo thể lệ. Làm tròn hai chữ số, ghi lý do khi đồng điểm và thử sửa sau công bố. (BR-06/16/25) | DONE | PARTIAL |  |  | Backend công bố, snapshot và điều kiện proof đạt E1/E2. Còn ca đồng điểm và nghiệm thu giao diện. |
| UC-27 | Manage Digital Archive & Exhibition | Phạm Tiến Thành Nhân | Chọn tác phẩm đưa vào triển lãm. Kiểm tra bản công khai tối ưu có bản quyền và bản gốc độ phân giải cao vẫn riêng tư. (BR-17) | DONE | PARTIAL |  |  | Backend preview WebP, bảo vệ master và xóa mềm đạt E1/E2. Còn nghiệm thu Web. |
| UC-41 | View Contest Results & Judge Feedback | Phạm Tiến Thành Nhân | Participant xem kết quả chung cuộc, điểm trung bình và nhận xét cho bài của mình sau công bố. Thử truy cập phản hồi của tài khoản khác. (SRS §2.2–3, CR-03) | DONE | PARTIAL |  |  | Backend điểm và feedback đúng Participant đạt E1/E2. Còn nghiệm thu client. |
| UC-42 | Manage Personal Film Portfolio | Phạm Tiến Thành Nhân | Mở portfolio cá nhân và đối chiếu tác phẩm với lịch sử nộp bài, kết quả tương ứng. Kiểm tra phạm vi tài khoản. (SRS §2.2–3, CR-03) | PARTIAL | PARTIAL |  |  |  |
| UC-43 | Explore Digital Archive & Gallery | Phạm Tiến Thành Nhân | Khách xem kho ảnh đã công bố và lọc theo phim, máy, năm. Kiểm tra bài chưa công bố và ảnh gốc được bảo vệ. (SRS §2.2–3, BR-17) | PARTIAL | PARTIAL |  |  |  |

### M09 Shared API Contracts

Chuẩn hóa API và dữ liệu trao đổi cho các nền tảng. UC riêng: N/A · PARTIAL

Nghiệm thu tại phần 3.

### M10 Database Schema & Cloud Storage

Bảo toàn dữ liệu nghiệp vụ, phân quyền ảnh gốc và ảnh công khai. UC riêng: N/A · PARTIAL

Nghiệm thu tại phần 3.

### M11 Cross-Cutting Services

Tra cứu nhật ký, gửi thông báo và cung cấp báo cáo cuộc thi.

| UC ID | Chức năng | Đầu mối module | Tiêu chí nghiệm thu | Backend | Toàn luồng | GV đạt | GV chưa đạt | Còn cần nghiệm thu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-10 | View System Audit Logs | Vĩ Nguyễn | Admin tra cứu nhật ký thao tác nhạy cảm. Kiểm tra người thực hiện, thời điểm, hành động, dữ liệu cũ/mới và lý do. (BR-18, CR-04) | PARTIAL | PARTIAL |  |  | Audit ghi dùng chung đã có. Thiếu API/UI tra cứu và kiểm tra quyền đọc UC-10. |
| UC-28 | Export Contest Analytics Report | Vĩ Nguyễn | Organizer xem thống kê DB theo cuộc thi/hạng mục và xuất báo cáo. Kiểm tra AI chỉ nhận số liệu tổng hợp không định danh và số liệu/xuất vẫn dùng được khi AI lỗi. (SRS §3) | DONE | PARTIAL |  |  | Backend đã nghiệm thu theo hồ sơ trước. Còn Web xuất báo cáo và nhà cung cấp AI thật. |


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
