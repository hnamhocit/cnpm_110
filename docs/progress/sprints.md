# Bảng công việc theo sprint

Mã FPC là mã công việc nội bộ, đánh số liên tục; không phải Jira issue đang hoạt động.

**Cập nhật ngày 26/11/2026:** Theo xác nhận trưởng nhóm, toàn bộ 16 task IN REVIEW của Sprint 1–4 được chuyển sang DONE. Giữ nguyên task IN PROGRESS/TODO và Sprint 5–6; trạng thái nghiệm thu UC theo checklist riêng.

## Sprint 1 · Nền tảng và xác thực

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-001 | Backend | Thiết lập Backend theo lớp và kết nối PostgreSQL | Nam Nguyễn | DONE |
| FPC-002 | Backend | Thiết kế schema Users, Roles và Permissions | Nam Nguyễn | DONE |
| FPC-003 | Backend | API Register/Login cấp JWT access token và refresh token | Nam Nguyễn | DONE |
| FPC-004 | Backend | Tích hợp SDK Cloud Storage và thử upload ảnh lớn | Hà Đức Bình | DONE |
| FPC-005 | Backend | Middleware RBAC cho Admin, Organizer, Judge và Participant | Hà Đức Bình | DONE |
| FPC-006 | Backend | Unit test và integration test xác thực và refresh token | Hà Đức Bình | DONE |
| FPC-007 | Web | Thiết lập Next.js, Tailwind CSS và Shadcn UI | Vĩ Nguyễn | DONE |
| FPC-008 | Web | Giao diện Login và Register cho Admin và Organizer | Vĩ Nguyễn | DONE |
| FPC-009 | Web | HTTP client Axios/Fetch và interceptor tự refresh token | Vĩ Nguyễn | DONE |
| FPC-010 | Web | Layout Portal chung gồm sidebar, header và profile menu | Phạm Tiến Thành Nhân | DONE |
| FPC-011 | Web | Màn đăng nhập Judge bằng mã mời hoặc email | Phạm Tiến Thành Nhân | DONE |
| FPC-012 | Web | Router guard kiểm tra quyền theo vai trò | Phạm Tiến Thành Nhân | DONE |
| FPC-013 | Mobile | Thiết lập Flutter và state management | Hoài Bảo Từ | DONE |
| FPC-014 | Mobile | Màn Splash, Login và Register cho Participant | Hoài Bảo Từ | DONE |
| FPC-015 | Mobile | Lưu Access/Refresh Token bằng Flutter Secure Storage | Hoài Bảo Từ | DONE |
| FPC-016 | Mobile | Dio client và interceptor xử lý lỗi, refresh token | Huỳnh Trần Gia Bảo | DONE |
| FPC-017 | Mobile | UI components chung cho button, input và loading dialog | Huỳnh Trần Gia Bảo | DONE |
| FPC-018 | Mobile | Bottom navigation và màn hình hồ sơ cá nhân | Huỳnh Trần Gia Bảo | DONE |
| FPC-019 | Lead | Thiết lập GitHub, bảo vệ nhánh main/develop và CI/CD cơ bản | Nam Nguyễn | DONE |
| FPC-020 | Lead | Viết đặc tả API Swagger/Postman cho Web và Mobile | Nam Nguyễn | DONE |

## Sprint 2 · Cuộc thi và nộp bài

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-021 | Backend | Schema Contests, Categories và Scoring Criteria | Nam Nguyễn | DONE |
| FPC-022 | Backend | CRUD cuộc thi gồm tiêu chí, hạn nộp, thể lệ và cơ cấu giải | Nam Nguyễn | IN PROGRESS |
| FPC-023 | Backend | API danh sách cuộc thi đang mở và tìm kiếm | Nam Nguyễn | DONE |
| FPC-024 | Backend | Schema Submissions, FilmRolls và FilmMetadata | Hà Đức Bình | DONE |
| FPC-025 | Backend | API nộp bài bằng multipart cho ảnh scan độ phân giải cao | Hà Đức Bình | DONE |
| FPC-026 | Backend | Validate TIFF/JPEG, dung lượng và kích thước tối thiểu | Hà Đức Bình | DONE |
| FPC-027 | Web | Dashboard danh sách cuộc thi của Organizer | Vĩ Nguyễn | DONE |
| FPC-028 | Web | Form tạo cuộc thi có chủ đề và lịch nộp, chấm | Vĩ Nguyễn | DONE |
| FPC-029 | Web | Giao diện tiêu chí động và trọng số | Vĩ Nguyễn | DONE |
| FPC-030 | Web | Trang chủ hiển thị các cuộc thi đang diễn ra | Phạm Tiến Thành Nhân | DONE |
| FPC-031 | Web | Trang chi tiết cuộc thi gồm thể lệ, giám khảo và giải thưởng | Phạm Tiến Thành Nhân | DONE |
| FPC-032 | Web | Giao diện thông tin cho người muốn đăng ký | Phạm Tiến Thành Nhân | DONE |
| FPC-033 | Mobile | Danh sách cuộc thi và lọc theo trạng thái | Hoài Bảo Từ | DONE |
| FPC-034 | Mobile | Chi tiết cuộc thi và nút đăng ký | Hoài Bảo Từ | DONE |
| FPC-035 | Mobile | Kiểm tra điều kiện và lưu trạng thái tham gia | Hoài Bảo Từ | IN PROGRESS |
| FPC-036 | Mobile | Form thông số chụp gồm máy, ống kính, phim, ISO và frame | Huỳnh Trần Gia Bảo | DONE |
| FPC-037 | Mobile | Form tráng và scan gồm lab, thiết bị và độ phân giải | Huỳnh Trần Gia Bảo | DONE |
| FPC-038 | Mobile | Image picker và preview ảnh scan, đính kèm đối chứng | Huỳnh Trần Gia Bảo | DONE |
| FPC-039 | Lead | Đo hiệu năng upload ảnh lớn và xây luồng sinh thumbnail | Nam Nguyễn | DONE |
| FPC-040 | Lead | Đặc tả Contest và Submission trên Postman/Swagger | Nam Nguyễn | DONE |

## Sprint 3 · Kiểm duyệt và thẩm định AI

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-041 | Backend | API danh sách bài cho Organizer với bộ lọc trạng thái và cờ AI | Nam Nguyễn | DONE |
| FPC-042 | Backend | API duyệt hoặc từ chối bài kèm lý do | Nam Nguyễn | DONE |
| FPC-043 | Backend | API chi tiết đối sánh bài nghi vấn với bài gốc | Nam Nguyễn | DONE |
| FPC-044 | Backend | Webhook nhận và lưu pHash, xác suất AI và auto-tags | Hà Đức Bình | DONE |
| FPC-045 | Backend | Phát hiện ảnh trùng bằng perceptual hash hoặc vector embeddings | Hà Đức Bình | DONE |
| FPC-046 | Backend | Kết nối model nhận diện ảnh AI và gán mức tin cậy | Hà Đức Bình | DONE |
| FPC-047 | Backend | Lưu kết quả phân tích và phân loại Verified/Suspicious/Flagged | Hà Đức Bình | DONE |
| FPC-048 | Web | Bảng quản lý, duyệt bài và hiển thị cờ AI | Vĩ Nguyễn | DONE |
| FPC-049 | Web | Modal so sánh hai ảnh nghi trùng | Vĩ Nguyễn | DONE |
| FPC-050 | Web | Thao tác duyệt hoặc từ chối hàng loạt | Vĩ Nguyễn | DONE |
| FPC-051 | Web | Màn hình quản lý danh sách giám khảo được mời | Phạm Tiến Thành Nhân | DONE |
| FPC-052 | Web | Giao diện phân giám khảo theo hạng mục hoặc vòng | Phạm Tiến Thành Nhân | DONE |
| FPC-053 | Web | Bảng theo dõi số bài phân cho từng giám khảo | Phạm Tiến Thành Nhân | DONE |
| FPC-054 | Mobile | Màn Bài thi của tôi | Dương Nguyễn | DONE |
| FPC-055 | Mobile | Hiển thị cập nhật trạng thái kiểm duyệt bài | Dương Nguyễn | DONE |
| FPC-056 | Mobile | Hiển thị lý do từ chối và hướng dẫn bổ sung | Dương Nguyễn | DONE |
| FPC-057 | Mobile | Màn chỉnh sửa metadata khi có yêu cầu bổ sung | Dương Nguyễn | DONE |
| FPC-058 | Mobile | Tối ưu cache ảnh danh sách với CachedNetworkImage | Dương Nguyễn | DONE |
| FPC-059 | Mobile | Nén ảnh trên client trước khi upload | Dương Nguyễn | DONE |
| FPC-060 | Lead | Đánh giá Precision, Recall và F1 của model AI | Nam Nguyễn | DONE |
| FPC-061 | Lead | Review xử lý bất đồng bộ và background job | Nam Nguyễn | DONE |

## Sprint 4 · Chấm thi

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-062 | Backend | API danh sách bài được phân công cho giám khảo | Nam Nguyễn | DONE |
| FPC-063 | Backend | API nộp điểm theo tiêu chí | Nam Nguyễn | DONE |
| FPC-064 | Backend | API khóa bảng điểm khi kết thúc vòng | Nam Nguyễn | DONE |
| FPC-065 | Backend | Thuật toán tổng hợp điểm từ nhiều giám khảo | Hà Đức Bình | DONE |
| FPC-066 | Backend | API bảng xếp hạng theo điểm | Hà Đức Bình | DONE |
| FPC-067 | Backend | Xử lý đồng điểm | Hà Đức Bình | DONE |
| FPC-068 | Web | Màn theo dõi tiến độ chấm của từng giám khảo | Vĩ Nguyễn | DONE |
| FPC-069 | Web | Bảng điểm tổng hợp cập nhật cho Organizer | Vĩ Nguyễn | DONE |
| FPC-070 | Web | Nhắc giám khảo sắp trễ hạn qua email | Vĩ Nguyễn | TODO |
| FPC-071 | Web | Giao diện chấm toàn màn hình | Phạm Tiến Thành Nhân | DONE |
| FPC-072 | Web | Trình xem ảnh chất lượng cao có zoom và metadata | Phạm Tiến Thành Nhân | DONE |
| FPC-073 | Web | Thanh trượt chấm từng tiêu chí và nhập nhận xét | Phạm Tiến Thành Nhân | DONE |
| FPC-074 | Mobile | Thông báo khi bài được đưa vào vòng chấm | Dương Nguyễn | DONE |
| FPC-075 | Mobile | Hiển thị trạng thái đang trong vòng chấm | Dương Nguyễn | DONE |
| FPC-076 | Mobile | Cache ảnh bài thi | Huỳnh Trần Gia Bảo | DONE |
| FPC-077 | Mobile | Chuyển trang và skeleton loading danh sách ảnh lớn | Huỳnh Trần Gia Bảo | DONE |
| FPC-078 | Lead | Review thuật toán tính điểm và kiểm tra xử lý đồng thời | Nam Nguyễn | DONE |
| FPC-079 | Lead | Cập nhật Swagger/Postman cho Judging | Nam Nguyễn | DONE |

## Sprint 5 · Feature Complete

**Mục tiêu:** Hoàn thành 35 UC còn lại, nghiệm thu 43/43 UC và 5/5 Core Business Flows. Feature Freeze cuối sprint. M09–11 thực hiện song song theo phụ thuộc.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-080 | Backend | M02 · UC-06–08: Hoàn thiện CRUD và API tra cứu Film Stock, Camera/Lens, Film Lab | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-081 | Web | M02 · UC-06–08: Quản trị Master Data; cài đặt hệ thống theo SRS | Vĩ Nguyễn | DONE |
| FPC-082 | Mobile | M02 · UC-06–08: Tích hợp danh mục vào form Participant | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-083 | Backend | M03 · UC-11–14: Tạo/sao chép cuộc thi, timeline, hạng mục, tiêu chí | Nam Nguyễn | DONE |
| FPC-084 | Web | M03 · UC-11–14: Hoàn thiện và tích hợp form cấu hình | Vĩ Nguyễn | DONE |
| FPC-085 | Backend | M03 · UC-15–16: Vòng chấm và phân công Judge | Nam Nguyễn | DONE |
| FPC-086 | Web | M03 · UC-15–17: Vòng chấm, phân công Judge, danh sách đăng ký | Phạm Tiến Thành Nhân | DONE |
| FPC-087 | Backend | M03 · UC-17,34: API đăng ký hạng mục và danh sách đăng ký | Dương Nguyễn | DONE |
| FPC-088 | Web | M03 · UC-34: Tìm kiếm, chi tiết và đăng ký cuộc thi | Dương Nguyễn | DONE |
| FPC-089 | Mobile | M03 · UC-34: Hoàn thiện đăng ký và lưu trạng thái | Dương Nguyễn | DONE |
| FPC-090 | Backend | M04 · UC-35–36: CRUD cuộn phim, frame, metadata và quyền sở hữu | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-091 | Web | M04 · UC-35–36: Tích hợp Film Logbook nếu áp dụng theo SRS | Huỳnh Trần Gia Bảo | TODO |
| FPC-092 | Mobile | M04 · UC-35–36: Quản lý cuộn/frame, nối danh mục | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-093 | Backend | M05 · UC-21–22: Yêu cầu đối chứng có hạn, xác minh và duyệt bài | Nam Nguyễn | DONE |
| FPC-094 | Web | M05 · UC-21–22: Tích hợp yêu cầu đối chứng và duyệt bài | Vĩ Nguyễn | DONE |
| FPC-095 | Mobile | M05 · UC-21: Hiển thị yêu cầu đối chứng và deadline | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-096 | Backend | M05 · UC-37,39: Nộp ảnh, liên kết đăng ký/cuộn/frame, chỉnh sửa và rút bài | Dương Nguyễn | DONE |
| FPC-097 | Web | M05 · UC-37,39: Tích hợp nộp, sửa và rút bài nếu áp dụng theo SRS | Dương Nguyễn | DONE |
| FPC-098 | Mobile | M05 · UC-37,39: Hoàn thiện nộp, sửa và rút bài | Dương Nguyễn | DONE |
| FPC-099 | Backend | M05 · UC-38: API upload đối chứng và kiểm tra quyền | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-100 | Web | M05 · UC-38: Upload đối chứng nếu áp dụng theo SRS | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-101 | Mobile | M05 · UC-38: Upload âm bản/contact sheet | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-102 | Backend/AI | M06 · UC-09,19,20: Ngưỡng, quét đơn/hàng loạt, đối sánh, gỡ cờ, worker | Hà Đức Bình | DONE |
| FPC-103 | Web | M06 · UC-09,19,20: Cấu hình và tích hợp AI thật | Vĩ Nguyễn | DONE |
| FPC-104 | Backend | M07 · UC-24–25: Tiến độ, chốt/chuyển vòng và xử lý đồng điểm | Hà Đức Bình | DONE |
| FPC-105 | Web | M07 · UC-24–25: Tích hợp dashboard tiến độ và chốt vòng | Phạm Tiến Thành Nhân | DONE |
| FPC-106 | Backend | M07 · UC-29,31–33: Kiểm chứng API hiện có, bổ sung logic theo vòng và khóa phiếu | Hà Đức Bình | IN REVIEW |
| FPC-107 | Web | M07 · UC-29–33: Nối workspace Judge, viewer UC-30 và gửi/sửa/khóa phiếu | Phạm Tiến Thành Nhân | DONE |
| FPC-108 | Backend | M08 · UC-26: API công bố kết quả và vinh danh người thắng | Nam Nguyễn | DONE |
| FPC-109 | Backend | M08 · UC-27: Quản lý triển lãm và preview công khai | Nam Nguyễn | DONE |
| FPC-110 | Web | M08 · UC-26: Chốt và công bố kết quả theo SRS | Vĩ Nguyễn | DONE |
| FPC-111 | Web | M08 · UC-27: Quản lý triển lãm và tác phẩm công khai | Vĩ Nguyễn | TODO |
| FPC-112 | Backend | M08 · UC-43: API Public Digital Archive, chi tiết tác phẩm công khai và phân trang | Dương Nguyễn | DONE |
| FPC-113 | Backend | M08 · UC-41: API kết quả, điểm và nhận xét cá nhân | Nam Nguyễn | DONE |
| FPC-114 | Backend | M08 · UC-43: Bộ lọc Archive theo film stock, camera và năm | Dương Nguyễn | DONE |
| FPC-115 | Backend | M08 · UC-43: Index truy vấn kho ảnh | Dương Nguyễn | DONE |
| FPC-116 | Web | M08 · UC-43: Tích hợp Digital Archive dạng masonry | Phạm Tiến Thành Nhân | DONE |
| FPC-117 | Web | M08 · UC-43: Tích hợp chi tiết tác phẩm đạt giải | Phạm Tiến Thành Nhân | DONE |
| FPC-118 | Web | M08 · UC-43: Bộ lọc kho ảnh theo phim, định dạng và năm | Phạm Tiến Thành Nhân | DONE |
| FPC-119 | Web | M08 · UC-41: Kết quả và feedback cá nhân nếu áp dụng theo SRS | Dương Nguyễn | DONE |
| FPC-120 | Mobile | M08 · UC-41: Hoàn thiện bảng vàng, kết quả và feedback thật | Dương Nguyễn | DONE |
| FPC-121 | Backend | M08 · UC-42: API portfolio và lịch sử giải thưởng | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-122 | Web | M08 · UC-42: Portfolio nếu áp dụng theo SRS | Huỳnh Trần Gia Bảo | TODO |
| FPC-123 | Mobile | M08 · UC-42: Tích hợp portfolio cá nhân và lịch sử giải thưởng | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-124 | Mobile | M08 · UC-43: Tích hợp Digital Archive và bộ lọc | Dương Nguyễn | DONE |
| FPC-125 | Backend | M11 · UC-10: API tra cứu Audit Log | Huỳnh Trần Gia Bảo | IN REVIEW |
| FPC-126 | Web | M11 · UC-10: Giao diện tra cứu Audit Log | Vĩ Nguyễn | TODO |
| FPC-127 | Backend/AI | M11 · UC-28: Kiểm chứng thống kê phim, ISO, lab theo phạm vi SRS; không viết lại Backend đã nghiệm thu | Hà Đức Bình | DONE |
| FPC-128 | Web | M11 · UC-28: Tích hợp dashboard thống kê và xuất báo cáo | Vĩ Nguyễn | TODO |
| FPC-129 | AI | M06/M11 · UC-09,19,20,28: Kiểm thử ảnh thật, AI Analytics thật và xử lý lỗi | Hà Đức Bình | IN REVIEW |
| FPC-130 | Lead | M09: Đồng bộ OpenAPI và kiểm soát thay đổi hợp đồng | Nam Nguyễn | TODO |
| FPC-131 | Backend | M10: Hoàn thiện schema, migration, storage và quyền truy cập theo UC | Hà Đức Bình | IN REVIEW |
| FPC-132 | Backend | M11: Hoàn thiện email/thông báo và audit dùng chung theo SRS | Nam Nguyễn | DONE |
| FPC-133 | Integration | Nghiệm thu toàn bộ 35 UC còn lại và hồi quy 8 UC đã đạt; Feature Freeze | Cả nhóm | TODO |
| FPC-134 | Backend | Chuẩn bị và kiểm chứng dữ liệu mẫu phục vụ demo (seed, không dùng mock thay API) | Nam Nguyễn | DONE |

### Module Owner

| Thành viên | Module chịu trách nhiệm chính |
| --- | --- |
| Nam Nguyễn | M01, M03, M09 |
| Hà Đức Bình | M06, M10 |
| Vĩ Nguyễn | M11 |
| Phạm Tiến Thành Nhân | M07, M08 |
| Dương Nguyễn | M05 |
| Huỳnh Trần Gia Bảo | M02, M04 |

Ưu tiên M03 → M02/M04 → M05/M06 → M07 → M08; các việc độc lập triển khai song song. Bàn giao theo checklist nghiệm thu riêng.

## Sprint 6 · Stabilization, Testing, Deployment & Release

**Mục tiêu:** Sửa lỗi, kiểm thử hồi quy, tối ưu, bảo mật, triển khai và bàn giao. Không lên kế hoạch triển khai mới chức năng bắt buộc.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái |
| --- | --- | --- | --- | --- |
| FPC-135 | Mobile | Kiểm tra Dark Mode và Light Mode | Huỳnh Trần Gia Bảo | TODO |
| FPC-136 | Lead | Stress test tải đồng thời nhiều ảnh từ Cloud Storage | Nam Nguyễn | TODO |
| FPC-137 | Lead | Rà soát bảo mật và quyền truy cập dữ liệu | Nam Nguyễn | TODO |
| FPC-138 | Backend | Sửa lỗi phát hiện qua kiểm thử E2E | Nam Nguyễn | TODO |
| FPC-139 | Backend | CORS, rate limiting, logging và bảo vệ endpoint nhạy cảm | Nam Nguyễn | TODO |
| FPC-140 | Backend | Triển khai Backend production | Hà Đức Bình | TODO |
| FPC-141 | Backend | Tên miền, SSL và reverse proxy | Hà Đức Bình | TODO |
| FPC-142 | Backend | Sao lưu PostgreSQL tự động | Hà Đức Bình | TODO |
| FPC-143 | Web | Kiểm tra responsive Admin và Organizer Portal | Vĩ Nguyễn | TODO |
| FPC-144 | Web | Triển khai Web Portal | Vĩ Nguyễn | TODO |
| FPC-145 | Web | Sửa UI/UX và tối ưu thời gian tải | Vĩ Nguyễn | TODO |
| FPC-146 | Web | Kiểm tra responsive Public Contest và Digital Archive | Phạm Tiến Thành Nhân | IN REVIEW |
| FPC-147 | Web | Tối ưu SEO và OpenGraph metadata | Phạm Tiến Thành Nhân | IN REVIEW |
| FPC-148 | Web | Empty state và trang lỗi 404/500 | Phạm Tiến Thành Nhân | IN REVIEW |
| FPC-149 | Mobile | Bản phát hành Android APK và iOS TestFlight theo điều kiện phát hành | Dương Nguyễn | TODO |
| FPC-150 | Mobile | Kiểm thử Mobile trên thiết bị thật | Dương Nguyễn | TODO |
| FPC-151 | Mobile | Màn thông báo mất kết nối Internet | Huỳnh Trần Gia Bảo | TODO |
| FPC-152 | Mobile | Rà soát luồng Mobile từ đăng ký, nộp bài đến xem kết quả | Huỳnh Trần Gia Bảo | TODO |
| FPC-153 | Lead | Tổng hợp tiến độ và kết quả các sprint từ hồ sơ công việc | Nam Nguyễn | TODO |
| FPC-154 | Lead | Hoàn thiện phần báo cáo thực nghiệm AI của Capstone (Bình cung cấp kết quả) | Nam Nguyễn | TODO |
| FPC-155 | Lead | Kịch bản demo và video dự phòng | Nam Nguyễn | TODO |
| FPC-156 | Backend/AI | Regression AI, concurrency, worker recovery và hiệu năng | Hà Đức Bình | TODO |
| FPC-157 | Integration | Regression 43 UC trên nền tảng áp dụng, sửa lỗi và kiểm tra sau triển khai | Cả nhóm | TODO |
| FPC-158 | Lead | Code Freeze, kiểm tra điều kiện release và bàn giao | Nam Nguyễn | TODO |

Kết thúc Sprint 6: Code Freeze và release khi đạt điều kiện nghiệm thu.
