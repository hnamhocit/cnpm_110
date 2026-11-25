# Bảng công việc theo sprint

> Các bảng giữ trạng thái Jira tại thời điểm rà soát. Ghi chú đầu mỗi sprint phản ánh thay đổi theo SRS mới. Xem [overview](overview.md) cho điều kiện nghiệm thu còn thiếu.

Bản phục dựng từ 8 ảnh Jira. Ảnh hiển thị mã, người phụ trách và trạng thái, không có tên hoặc ngày sprint. Sáu nhóm dưới đây được suy ra theo dải mã và chủ đề. Công việc đặc tả FPC-126–137 được ghi riêng vì ảnh không cho biết sprint gốc. Chỉ nhập hàng đọc được. Tên task được rút gọn theo phần chữ hiển thị.

Cột **Trạng thái** ghi tiến độ đã đối chiếu. Dấu `—` ở ghi chú nghĩa là chưa đối chiếu riêng. Với công việc chỉ giao UI, DONE áp dụng cho phần UI.

Dương Nguyễn và Huỳnh Trần Gia Bảo cùng phụ trách Mobile. Nam Nguyễn phụ trách các đầu việc Backend trước đây giao cho Dương Nguyễn.

[Tổng quan dự án và căn cứ đối chiếu](overview.md)

| Trạng thái | Số công việc |
| --- | ---: |
| TODO | 29 |
| DOING | 2 |
| REVIEW | 25 |
| DONE | 72 |
| **Tổng** | **128** |

## Sprint 1 · Nền tảng và xác thực

**Cập nhật theo SRS mới (2026-11-25).** Web và Mobile đã nối đăng ký, xác minh và khôi phục qua email. Backend bỏ SMS/Twilio và quyền động. Tích hợp Auth đạt với bộ gửi giả. Web có màn hồ sơ và quản trị tài khoản, Mobile cập nhật được ảnh đại diện qua URL HTTPS. Bộ tích hợp Auth chạy 17 ca đạt, gồm đổi vai trò, thu hồi phiên và kiểm tra quyền mới. Còn nghiệm thu SMTP thật.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-7 | Backend | Thiết lập Backend theo lớp và kết nối PostgreSQL | Nam Nguyễn | DONE | — |
| FPC-8 | Backend | Thiết kế schema Users, Roles và Permissions | Nam Nguyễn | DONE | Schema có số điện thoại xác thực, challenge OTP/reset, phiên bản token, định danh phiên, hồ sơ, audit tài khoản và cấu hình grant. |
| FPC-9 | Backend | API Register/Login cấp JWT access token và refresh token | Nam Nguyễn | REVIEW | Backend đăng ký chờ xác thực OTP email rồi SMS, sau đó mới cấp JWT qua login. Integration test dùng bộ gửi giả. Còn nghiệm thu nhà cung cấp thật và nối client. |
| FPC-11 | Backend | Tích hợp SDK Cloud Storage và thử upload ảnh lớn | Hà Đức Bình | REVIEW | Có tích hợp R2. Chưa xác minh thử upload lớn. |
| FPC-12 | Backend | Middleware RBAC cho Admin, Organizer, Judge và Participant | Hà Đức Bình | DONE | Middleware kiểm tra tài khoản, role, phiên và phiên bản token. Admin có thể chỉnh grant trong bốn role. Đã kiểm thử khóa và mở lại tài khoản không phục hồi token cũ. |
| FPC-13 | Backend | Unit test và integration test xác thực và refresh token | Hà Đức Bình | DONE | Integration Auth trên PostgreSQL 16 kiểm thử đăng ký, JWT/refresh, khóa/mở khóa, logout đồng thời với refresh, hồ sơ, đổi/reset mật khẩu và ma trận quyền. |
| FPC-14 | Web | Thiết lập Next.js, Tailwind CSS và Shadcn UI | Vĩ Nguyễn | DONE | — |
| FPC-15 | Web | Giao diện Login và Register cho Admin và Organizer | Vĩ Nguyễn | DONE | Phạm vi màn hiện có. Hợp đồng mới của đăng ký cần số điện thoại và OTP. Tài khoản nội bộ do Admin tạo qua API. |
| FPC-16 | Web | HTTP client Axios/Fetch và interceptor tự refresh token | Vĩ Nguyễn | DONE | — |
| FPC-17 | Web | Layout Portal chung gồm sidebar, header và profile menu | Phạm Tiến Thành Nhân | DONE | — |
| FPC-18 | Web | Màn đăng nhập Judge bằng mã mời hoặc email | Phạm Tiến Thành Nhân | DONE | — |
| FPC-19 | Web | Router guard kiểm tra quyền theo vai trò | Phạm Tiến Thành Nhân | DONE | Đã bỏ fallback đọc JWT chưa xác minh. Portal kiểm tra quyền qua Backend. |
| FPC-20 | Mobile | Thiết lập Flutter và state management | Hoài Bảo Từ | DONE | — |
| FPC-21 | Mobile | Màn Splash, Login và Register cho Participant | Hoài Bảo Từ | DONE | Đăng ký Mobile cần bổ sung số điện thoại và hai bước OTP trước khi đăng nhập. |
| FPC-22 | Mobile | Lưu Access/Refresh Token bằng Flutter Secure Storage | Hoài Bảo Từ | DONE | — |
| FPC-23 | Mobile | Dio client và interceptor xử lý lỗi, refresh token | Huỳnh Trần Gia Bảo | DONE | — |
| FPC-24 | Mobile | UI components chung cho button, input và loading dialog | Huỳnh Trần Gia Bảo | DONE | — |
| FPC-25 | Mobile | Bottom navigation và màn hình hồ sơ cá nhân | Huỳnh Trần Gia Bảo | DONE | Route đọc/sửa hồ sơ và đổi mật khẩu đã mount. Cần kiểm chứng Mobile bắt đăng nhập lại sau khi đổi mật khẩu. |
| FPC-26 | Lead | Thiết lập GitHub, bảo vệ nhánh main/develop và CI/CD cơ bản | Nam Nguyễn | DONE | — |
| FPC-27 | Lead | Viết đặc tả API Swagger/Postman cho Web và Mobile | Nam Nguyễn | DONE | — |

### Nghiệm thu Module 01

Các đầu việc dưới đây chưa có mã Jira riêng trong bảng phục dựng. Trạng thái áp dụng cho phạm vi trong cột nghiệm thu.

| Phạm vi | Trạng thái | Nghiệm thu |
| --- | --- | --- |
| Backend quản trị tài khoản, hồ sơ và mật khẩu | Đã kiểm thử | Admin tạo/liệt kê/khóa/mở tài khoản. Chủ tài khoản sửa hồ sơ, đổi/reset mật khẩu. Token cũ bị từ chối. |
| Backend ma trận quyền | Đã kiểm thử | Admin chỉnh grant trong bốn role hiện có. Request bị từ chối khi thiếu grant. Phiên thành viên bị thu hồi khi quyền thay đổi. |
| Tích hợp SMTP và Twilio Verify | REVIEW | Cấu hình SMTP và Verify Service SID `VA…` cùng API key. Xác nhận OTP email, OTP SMS và link reset đến tài khoản thử. |
| Web/Mobile hoàn thiện xác thực và quản trị | TODO | Nối đăng ký theo hợp đồng mới, OTP/gửi lại, quên/reset mật khẩu và giao diện Admin quản trị tài khoản/role. |

## Sprint 2 · Cuộc thi và nộp bài

**Cập nhật theo SRS mới (2026-11-25).** API và Mobile nhận số frame nguyên dương, bỏ giới hạn theo khổ. Test tích hợp chặn trùng frame giữa hai hạng mục. Còn thiếu năm mốc, trạng thái chuẩn, sao chép cuộc thi, đăng ký hạng mục và liên kết Film Roll/Frame.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-28 | Backend | Schema Contests, Categories và Scoring Criteria | Nam Nguyễn | REVIEW | Có cả ba bảng. Schema cuộc thi chỉ có hai mốc, weight lưu hai chữ số thập phân và chưa có kiểm tra tổng đúng 1.0000 theo BR-08/15. |
| FPC-29 | Backend | CRUD cuộc thi gồm tiêu chí, hạn nộp, thể lệ và cơ cấu giải | Nam Nguyễn | DOING | Có CRUD cơ bản và kiểm tra Organizer sở hữu cuộc thi khi sửa/xóa. Thiếu tiêu chí, giải, lịch 5 mốc và điều kiện chuyển trạng thái. |
| FPC-30 | Backend | API danh sách cuộc thi đang mở và tìm kiếm | Nam Nguyễn | DONE | Có tìm kiếm, phân trang và lọc theo trạng thái. Trạng thái hiện là bộ lọc tùy chọn, không xác định đang mở dựa trên hạn nộp. |
| FPC-31 | Backend | Schema Submissions, FilmRolls và FilmMetadata | Hà Đức Bình | DONE | Có cả ba bảng. Mã cuộn phim trong metadata là chuỗi, chưa liên kết khóa ngoại với FilmRolls. Xem quy tắc đầu vào ở FPC-32. |
| FPC-32 | Backend | API nộp bài bằng multipart cho ảnh scan độ phân giải cao | Hà Đức Bình | REVIEW | Đã kiểm tra trạng thái nhận bài, giới hạn frame và Lab/quy trình. Khóa theo cuộn–frame khi ghi bài. Chưa chạy tích hợp PostgreSQL. |
| FPC-33 | Backend | Validate TIFF/JPEG, dung lượng và kích thước tối thiểu | Hà Đức Bình | DONE | Test qua phần định dạng, dung lượng, kích thước theo phạm vi Jira. Chưa thấy bước kiểm tra watermark trong luồng nộp theo BR-07. |
| FPC-34 | Web | Dashboard danh sách cuộc thi của Organizer | Vĩ Nguyễn | DONE | Đã khôi phục bộ lọc `createdBy` cho danh sách Portal của Organizer. |
| FPC-35 | Web | Form tạo cuộc thi có chủ đề và lịch nộp, chấm | Vĩ Nguyễn | DONE | Phạm vi form đã có. Lưu đầy đủ lịch trình phụ thuộc FPC-29. |
| FPC-36 | Web | Giao diện tiêu chí động và trọng số | Vĩ Nguyễn | DONE | Phạm vi UI có. Chưa có API đọc/lưu tiêu chí. |
| FPC-37 | Web | Trang chủ hiển thị các cuộc thi đang diễn ra | Phạm Tiến Thành Nhân | DONE | — |
| FPC-38 | Web | Trang chi tiết cuộc thi gồm thể lệ, giám khảo và giải thưởng | Phạm Tiến Thành Nhân | DONE | — |
| FPC-39 | Web | Giao diện thông tin cho người muốn đăng ký | Phạm Tiến Thành Nhân | DONE | — |
| FPC-40 | Mobile | Danh sách cuộc thi và lọc theo trạng thái | Hoài Bảo Từ | DONE | — |
| FPC-41 | Mobile | Chi tiết cuộc thi và nút đăng ký | Hoài Bảo Từ | DONE | Có màn và nút. Nghiệm thu luồng đăng ký theo FPC-42. |
| FPC-42 | Mobile | Kiểm tra điều kiện và lưu trạng thái tham gia | Hoài Bảo Từ | DOING | Có kiểm tra trên Mobile. Thiếu lưu tham gia, hạng mục chưa được truyền vào form. Commit `ca22a0f` trên develop. |
| FPC-43 | Mobile | Form thông số chụp gồm máy, ống kính, phim, ISO và frame | Huỳnh Trần Gia Bảo | DONE | Merge PR #46. Đã nối vào luồng nộp bài mobile. |
| FPC-44 | Mobile | Form tráng và scan gồm lab, thiết bị và độ phân giải | Huỳnh Trần Gia Bảo | DONE | Merge PR #51. Đã nối vào luồng nộp bài mobile. |
| FPC-45 | Mobile | Image picker và preview ảnh scan, đính kèm đối chứng | Huỳnh Trần Gia Bảo | DONE | — |
| FPC-46 | Lead | Đo hiệu năng upload ảnh lớn và xây luồng sinh thumbnail | Nam Nguyễn | REVIEW | Chưa xác minh số đo upload lớn hoặc luồng sinh thumbnail. |
| FPC-47 | Lead | Đặc tả Contest và Submission trên Postman/Swagger | Nam Nguyễn | DONE | — |

## Sprint 3 · Kiểm duyệt và thẩm định AI

**Cập nhật theo SRS mới (2026-11-25).** Ngưỡng AI/pHash đọc từ cấu hình. Web hiển thị ảnh và đối chứng cạnh nhau khi có, điểm AI, ảnh tương tự và thẻ. Test webhook xác nhận AI chỉ gắn cờ. Còn luồng lưu hạn, tải và xác minh đối chứng.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-49 | Backend | API danh sách bài cho Organizer với bộ lọc trạng thái và cờ AI | Nam Nguyễn | REVIEW | Có lọc trạng thái, cờ AI và phạm vi cuộc thi của Organizer. Chưa chạy tích hợp PostgreSQL. |
| FPC-50 | Backend | API duyệt hoặc từ chối bài kèm lý do | Nam Nguyễn | REVIEW | Đã chặn Organizer ngoài phạm vi, bài sau công bố và duyệt bài AI rủi ro cao. Còn thiếu xác minh âm bản, gỡ cờ và hạn 48 giờ. |
| FPC-51 | Backend | API chi tiết đối sánh bài nghi vấn với bài gốc | Nam Nguyễn | REVIEW | Đã giới hạn phạm vi Organizer và bỏ số liệu đối sánh mẫu. Chưa chạy tích hợp PostgreSQL. |
| FPC-52 | Backend | Webhook nhận và lưu pHash, xác suất AI và auto-tags | Hà Đức Bình | REVIEW | Đã giới hạn 5 tags. Chưa có cảnh báo lệch hạng mục theo BR-11. |
| FPC-53 | Backend | Phát hiện ảnh trùng bằng perceptual hash hoặc vector embeddings | Hà Đức Bình | DONE | Có pHash theo phạm vi task. Vector 92% vẫn là khoảng trống theo SRS. |
| FPC-54 | Backend | Kết nối model nhận diện ảnh AI và gán mức tin cậy | Hà Đức Bình | DONE | — |
| FPC-55 | Backend | Lưu kết quả phân tích và phân loại Verified/Suspicious/Flagged | Hà Đức Bình | REVIEW | Có lưu phân tích và phân loại Verified/Suspicious/Flagged. Trạng thái rủi ro cao và trùng ảnh chưa khớp BR-09/10. Điều kiện giữ bài và gỡ cờ theo FPC-50 vẫn còn thiếu. |
| FPC-56 | Web | Bảng quản lý, duyệt bài và hiển thị cờ AI | Vĩ Nguyễn | DONE | — |
| FPC-57 | Web | Modal so sánh hai ảnh nghi trùng | Vĩ Nguyễn | DONE | — |
| FPC-58 | Web | Thao tác duyệt hoặc từ chối hàng loạt | Vĩ Nguyễn | DONE | — |
| FPC-59 | Web | Màn hình quản lý danh sách giám khảo được mời | Phạm Tiến Thành Nhân | DONE | Phạm vi màn hình có. Còn thiếu API mời/đọc danh sách thật. |
| FPC-60 | Web | Giao diện phân giám khảo theo hạng mục hoặc vòng | Phạm Tiến Thành Nhân | DONE | Phạm vi giao diện có. Còn thiếu API lưu phân công. |
| FPC-61 | Web | Bảng theo dõi số bài phân cho từng giám khảo | Phạm Tiến Thành Nhân | DONE | Phạm vi bảng có. Còn thiếu API số liệu workload. |
| FPC-62 | Mobile | Màn Bài thi của tôi | Dương Nguyễn | DONE | — |
| FPC-63 | Mobile | Hiển thị cập nhật trạng thái kiểm duyệt bài | Dương Nguyễn | DONE | — |
| FPC-64 | Mobile | Hiển thị lý do từ chối và hướng dẫn bổ sung | Dương Nguyễn | DONE | — |
| FPC-65 | Mobile | Màn chỉnh sửa metadata khi có yêu cầu bổ sung | Dương Nguyễn | DONE | Phạm vi màn hình có. API metadata chưa mount, nên chưa lưu được. Commit `40fca44` trên develop. |
| FPC-66 | Mobile | Tối ưu cache ảnh danh sách với CachedNetworkImage | Dương Nguyễn | DONE | — |
| FPC-67 | Mobile | Nén ảnh trên client trước khi upload | Dương Nguyễn | DONE | — |
| FPC-68 | Lead | Đánh giá Precision, Recall và F1 của model AI | Nam Nguyễn | REVIEW | Chưa tìm thấy báo cáo Precision/Recall/F1 trong repo. |
| FPC-69 | Lead | Review xử lý bất đồng bộ và background job | Nam Nguyễn | REVIEW | Có worker và test queue/retry. Chưa tìm thấy kết quả review. |

## Sprint 4 · Chấm thi

**Cập nhật theo SRS mới (2026-11-25).** Bỏ cờ lệch điểm 30%. Mở chấm hiện yêu cầu ít nhất một Judge hoạt động mỗi hạng mục. Tích hợp xác nhận chấm ẩn danh và chặn ghi điểm sau công bố. Còn chốt/chuyển vòng, giới hạn bài đi tiếp và xử lý đồng điểm.

Đối chiếu trên `develop`. Web qua kiểm tra TypeScript và 60 unit test. Trạng thái DONE của FPC-79–81 áp dụng cho phần UI đã review. Tiến độ chấm, bảng điểm và gửi phiếu thật vẫn cần tích hợp Web với Backend.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-70 | Backend | API danh sách bài được phân công cho giám khảo | Nam Nguyễn | DONE | Đã tích hợp `520148c`, sửa tại `56c2576`. Ảnh ẩn danh bỏ metadata và kiểm tra phân công. |
| FPC-71 | Backend | API nộp điểm theo tiêu chí | Nam Nguyễn | DONE | Đã tích hợp `14c5d66`, sửa tại `56c2576`. Chỉ ghi ở JUDGING, phải đủ tiêu chí và khóa hàng cuộc thi khi ghi. |
| FPC-72 | Backend | API khóa bảng điểm khi kết thúc vòng | Nam Nguyễn | DONE | Đã tích hợp `9190eeb`, sửa tại `56c2576`. Khóa phiếu đã chấm đủ bài, đồng bộ với ghi điểm và chuyển trạng thái. |
| FPC-73 | Backend | Thuật toán tổng hợp điểm từ nhiều giám khảo | Hà Đức Bình | DONE | Đã merge tại `e2adee1` và sửa tại `56c2576`. Điểm chung cuộc làm tròn sau khi lấy trung bình, trọng số có bốn chữ số thập phân. |
| FPC-74 | Backend | API bảng xếp hạng theo điểm | Hà Đức Bình | DONE | Đã tích hợp `ba4b828`, sửa tại `56c2576`. Bảng điểm trả cờ chênh lệch và chặn công bố khi còn cờ. |
| FPC-75 | Backend | Xử lý đồng điểm | Hà Đức Bình | DONE | Đã tích hợp `c73275a`. Xếp hạng đồng điểm theo kiểu 1, 1, 3 trong từng hạng mục. |
| FPC-76 | Web | Màn theo dõi tiến độ chấm của từng giám khảo | Vĩ Nguyễn | REVIEW | Đã merge PR #141. Bản sửa `f06e312` bổ sung kiểu dữ liệu chấm. TypeScript đã qua, màn tiến độ vẫn dùng dữ liệu mẫu. |
| FPC-77 | Web | Bảng điểm tổng hợp cập nhật cho Organizer | Vĩ Nguyễn | REVIEW | Đã merge PR #142. Test lọc và xếp hạng bảng điểm đã qua. Màn Organizer vẫn dùng dữ liệu mẫu dù API FPC-74 đã có. |
| FPC-78 | Web | Nhắc giám khảo sắp trễ hạn qua email | Vĩ Nguyễn | TODO | Chưa thấy luồng Web hoặc API gửi email nhắc giám khảo sắp trễ hạn. |
| FPC-79 | Web | Giao diện chấm toàn màn hình | Phạm Tiến Thành Nhân | DONE | Đã duyệt và merge PR #147 qua #150. UI toàn màn hình đã có trên trang demo; còn nối bài phân công và kiểm soát quyền Judge. |
| FPC-80 | Web | Trình xem ảnh chất lượng cao có zoom và metadata | Phạm Tiến Thành Nhân | DONE | Đã duyệt và merge PR #148 qua #150. UI hỗ trợ kéo ảnh, zoom 350% và xem metadata mẫu; chưa nghiệm thu với ảnh scan thật. |
| FPC-81 | Web | Thanh trượt chấm từng tiêu chí và nhập nhận xét | Phạm Tiến Thành Nhân | DONE | Đã duyệt và merge PR #149 qua #150. UI slider, nhận xét và tính điểm có unit test. Bản sửa `f06e312` hiện báo rõ phiếu thử chưa lưu; còn nối API FPC-71. |
| FPC-82 | Mobile | Thông báo khi bài được đưa vào vòng chấm | Dương Nguyễn | REVIEW | Đã merge PR #144. Banner trong app dựa vào trạng thái APPROVED và lưu dấu đã báo. Cần nghiệm thu theo sự kiện vào vòng chấm và xác nhận phạm vi thông báo khi app đóng. |
| FPC-83 | Mobile | Hiển thị trạng thái đang trong vòng chấm | Dương Nguyễn | REVIEW | Đã merge PR #145. Màn chi tiết hiển thị banner vòng chấm khi bài APPROVED. Cần đối chiếu trạng thái vòng chấm thực từ Backend. |
| FPC-84 | Mobile | Cache ảnh bài thi | Huỳnh Trần Gia Bảo | DONE | Đã merge PR #143. Danh sách và chi tiết bài dùng ảnh cache; có widget test trong repo. Chưa chạy lại trên Flutter trong lượt rà soát này. |
| FPC-85 | Mobile | Chuyển trang và skeleton loading danh sách ảnh lớn | Huỳnh Trần Gia Bảo | DONE | Đã merge PR #146. Có chuyển cảnh, skeleton danh sách bài và bảng vàng; có test trong repo. Chưa chạy lại trên Flutter trong lượt rà soát này. |
| FPC-86 | Lead | Review thuật toán tính điểm và kiểm tra xử lý đồng thời | Nam Nguyễn | DONE | Đã review và sửa tại `56c2576`. 15 unit test và 25 ca integration PostgreSQL đạt sau bản sửa. [Kết quả review](overview.md#review-fpc-86) |
| FPC-87 | Lead | Cập nhật Swagger/Postman cho Judging | Nam Nguyễn | DONE | Năm route Judging đã được cập nhật trong OpenAPI và collection tại `56c2576`. [Hợp đồng](../ai/09-api-contracts.md#61-hợp-đồng-judging) |

## Tổng kết cuối Sprint 4

| Nhóm | Kết quả chuyển giao |
| --- | --- |
| DONE | M01 Authentication & RBAC, theo xác nhận của Project Lead. |
| PARTIAL | M03 Contest Lifecycle, M04 Film Logbook, M05 Submission & Proof, M06 AI Verification, M07 Blind Judging, M08 Archive & Exhibition. M09, M10 và M11 tiếp tục hỗ trợ song song. |
| TODO | M02 Analog Master Data còn phần triển khai danh mục và tra cứu. |
| Chưa nghiệm thu | UC-06–43. Xem phần còn thiếu và trạng thái theo nền tảng trong [bảng Use Case](use-cases.md). |

Các task đã merge và phần còn thiếu theo UC được đối chiếu trong [bằng chứng kỹ thuật](technical-evidence.md#đối-chiếu-task-sprint-với-pr-và-use-case).

### Tồn đọng chuyển sang Sprint 5

| Module | UC liên quan | Việc chuyển tiếp |
| --- | --- | --- |
| M03 | UC-11–17, UC-34 | Chốt năm mốc và trạng thái. Hoàn thiện sao chép, đăng ký và cấu hình chấm theo vòng. Giữ các phần còn lại của FPC-29, FPC-35–36, FPC-42 và FPC-59–60 theo phạm vi SRS. |
| M02, M04 | UC-06–08, UC-35–36 | Hoàn thiện danh mục gốc, CRUD cuộn/frame và quyền sở hữu. |
| M05, M06 | UC-09, UC-18–23, UC-37–40 | Nối bài với đăng ký và cuộn/frame. Hoàn thiện yêu cầu đối chứng có hạn cấu hình, sửa/rút bài, quét theo yêu cầu và xác minh luồng Organizer. Chuyển phần còn thiếu của FPC-32, FPC-49–52 và FPC-65. Trên Web, sửa payload form #160, chuẩn hóa trạng thái #161 và nối modal #163 với API. |
| M07 | UC-24–25, UC-29–33 | Nối Web với API chấm, kiểm tra khóa phiếu và chốt/chuyển vòng. Chuyển phần tích hợp của FPC-76–77 và FPC-79–81. |
| M08 | UC-26–27, UC-41–43 | Hoàn thiện công bố theo kết quả vòng cuối và tích hợp kho ảnh/portfolio với dữ liệu thật. |
| M09–11 | UC-10, UC-28 và hợp đồng/dữ liệu dùng chung | Đồng bộ API và schema theo từng UC, hoàn thiện audit/thông báo và nghiệm thu báo cáo. |

### Công việc loại khỏi phạm vi bắt buộc

- Xác minh SMS/Twilio và chỉnh quyền động.
- Xác minh Verified Partner Lab và giới hạn số frame cố định theo khổ phim.
- Heatmap, phân tích hạt phim tổng hợp, giải thích bất thường quang học và công cụ đảo âm bản chuyên dụng.
- Hạn đối chứng cố định 48 giờ và tự loại bài quá hạn.
- Điều phối cờ lệch điểm 30%, phúc khảo/chỉnh điểm và yêu cầu tối thiểu ba giám khảo. Chỉ phần cờ và chặn theo lệch điểm của FPC-74 nằm ngoài phạm vi; giữ bảng xếp hạng. Giữ kiểm tra điểm và đồng thời trong FPC-86.
- Yêu cầu đồng bộ thời gian thực, watermark tự động và push bắt buộc. Watermark và push là tùy chọn theo SRS.

## Sprint 5 · Hoàn thiện module và Use Case

**Trạng thái kế hoạch** · Chờ Project Lead chốt phạm vi, người phụ trách và ngày bắt đầu.

**Nghiệm thu bổ sung sau Sprint 4** · Checklist demo xác nhận PASS cho UC-18, UC-23 và UC-40. M05 đạt 3/8 UC. UC-20 tiếp tục PARTIAL, dữ liệu đối sánh giả lập dùng để kiểm tra giao diện.

- Dùng [thứ tự ưu tiên module](overview.md#thứ-tự-triển-khai) và bảng tồn đọng Sprint 4 để chọn UC theo phụ thuộc. Triển khai M09–11 song song theo nhu cầu của các UC đã chọn.
- Quản lý từng UC trong [bảng Use Case](use-cases.md). Chốt phần còn thiếu và tiêu chí nghiệm thu từ SRS trước khi đánh dấu DONE.
- Giữ phân công Jira cũ làm căn cứ truy vết. Lịch sử Sprint 5–6 trước khi đổi cách theo dõi nằm trong [bằng chứng kỹ thuật](technical-evidence.md#kế-hoạch-jira-trước-khi-tổ-chức-lại-sprint-56).

## Sprint 6 · Integration, Testing, Deployment & Release

- [ ] Kiểm thử tích hợp các luồng chính từ đăng ký đến công bố và tra cứu kết quả trên các nền tảng áp dụng.
- [ ] Xác minh quyền, ẩn danh, khóa dữ liệu, lưu trữ và thông báo trên môi trường triển khai.
- [ ] Sửa lỗi tích hợp, chạy hồi quy và xác nhận các UC đạt tiêu chí SRS.
- [ ] Triển khai, kiểm tra sau triển khai và chốt bản phát hành.
