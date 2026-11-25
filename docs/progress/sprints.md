# Bảng công việc theo sprint

Bản phục dựng từ 8 ảnh Jira. Ảnh hiển thị mã, người phụ trách và trạng thái, không có tên hoặc ngày sprint. Sáu nhóm dưới đây được suy ra theo dải mã và chủ đề. Công việc đặc tả FPC-126–137 được ghi riêng vì ảnh không cho biết sprint gốc. Chỉ nhập hàng đọc được. Tên task được rút gọn theo phần chữ hiển thị.

Dùng cột **Hiện tại** để quản lý từ đây. Cột **Jira** giữ ảnh chụp ban đầu, với `Done → DONE`, `To Do → TODO`, `In Progress → DOING`, `In View → REVIEW`. Dấu `—` trong ghi chú nghĩa là giữ trạng thái ảnh và chưa đối chiếu riêng. Với task chỉ giao UI, trạng thái Done áp dụng cho UI; phần tích hợp còn thiếu nằm trong ghi chú. Hai cách ghi tên Duong Nguyen và Dương Nguyễn được giữ như trong ảnh vì chưa có căn cứ hợp nhất tài khoản.

[Tổng quan dự án và căn cứ đối chiếu](overview.md)

| Trạng thái | Jira | Hiện tại |
| --- | ---: | ---: |
| TODO | 37 | 29 |
| DOING | 1 | 2 |
| REVIEW | 17 | 30 |
| DONE | 73 | 67 |
| **Tổng** | **128** | **128** |

## Sprint 1 · Nền tảng và xác thực

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-7 | Backend | Thiết lập Backend theo lớp và kết nối PostgreSQL | Duong Nguyen | DONE | DONE | — |
| FPC-8 | Backend | Thiết kế schema Users, Roles và Permissions | Duong Nguyen | DONE | DONE | Schema có số điện thoại xác thực, challenge OTP/reset, phiên bản token, định danh phiên, hồ sơ, audit tài khoản và cấu hình grant. |
| FPC-9 | Backend | API Register/Login cấp JWT access token và refresh token | Duong Nguyen | DONE | REVIEW | Backend đăng ký chờ xác thực OTP email rồi SMS, sau đó mới cấp JWT qua login. Integration test dùng bộ gửi giả. Còn nghiệm thu nhà cung cấp thật và nối client. |
| FPC-11 | Backend | Tích hợp SDK Cloud Storage và thử upload ảnh lớn | Hà Đức Bình | DONE | REVIEW | Có tích hợp R2. Chưa xác minh thử upload lớn. |
| FPC-12 | Backend | Middleware RBAC cho Admin, Organizer, Judge và Participant | Hà Đức Bình | DONE | DONE | Middleware kiểm tra tài khoản, role, phiên và phiên bản token. Admin có thể chỉnh grant trong bốn role. Đã kiểm thử khóa và mở lại tài khoản không phục hồi token cũ. |
| FPC-13 | Backend | Unit test và integration test xác thực và refresh token | Hà Đức Bình | DONE | DONE | Integration Auth trên PostgreSQL 16 kiểm thử đăng ký, JWT/refresh, khóa/mở khóa, logout đồng thời với refresh, hồ sơ, đổi/reset mật khẩu và ma trận quyền. |
| FPC-14 | Web | Thiết lập Next.js, Tailwind CSS và Shadcn UI | Vĩ Nguyễn | DONE | DONE | — |
| FPC-15 | Web | Giao diện Login và Register cho Admin và Organizer | Vĩ Nguyễn | DONE | DONE | Phạm vi màn hiện có. Hợp đồng mới của đăng ký cần số điện thoại và OTP. Tài khoản nội bộ do Admin tạo qua API. |
| FPC-16 | Web | HTTP client Axios/Fetch và interceptor tự refresh token | Vĩ Nguyễn | DONE | DONE | — |
| FPC-17 | Web | Layout Portal chung gồm sidebar, header và profile menu | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-18 | Web | Màn đăng nhập Judge bằng mã mời hoặc email | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-19 | Web | Router guard kiểm tra quyền theo vai trò | Phạm Tiến Thành Nhân | DONE | DONE | Đã bỏ fallback đọc JWT chưa xác minh. Portal kiểm tra quyền qua Backend. |
| FPC-20 | Mobile | Thiết lập Flutter và state management | Hoài Bảo Từ | DONE | DONE | — |
| FPC-21 | Mobile | Màn Splash, Login và Register cho Participant | Hoài Bảo Từ | DONE | DONE | Đăng ký Mobile cần bổ sung số điện thoại và hai bước OTP trước khi đăng nhập. |
| FPC-22 | Mobile | Lưu Access/Refresh Token bằng Flutter Secure Storage | Hoài Bảo Từ | DONE | DONE | — |
| FPC-23 | Mobile | Dio client và interceptor xử lý lỗi, refresh token | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-24 | Mobile | UI components chung cho button, input và loading dialog | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-25 | Mobile | Bottom navigation và màn hình hồ sơ cá nhân | Huỳnh Trần Gia Bảo | DONE | DONE | Route đọc/sửa hồ sơ và đổi mật khẩu đã mount. Cần kiểm chứng Mobile bắt đăng nhập lại sau khi đổi mật khẩu. |
| FPC-26 | Lead | Thiết lập GitHub, bảo vệ nhánh main/develop và CI/CD cơ bản | Nam Nguyễn | DONE | DONE | — |
| FPC-27 | Lead | Viết đặc tả API Swagger/Postman cho Web và Mobile | Nam Nguyễn | DONE | DONE | — |

### Nghiệm thu Module 01

Các đầu việc dưới đây chưa có mã Jira riêng trong bảng phục dựng. Trạng thái áp dụng cho phạm vi trong cột nghiệm thu.

| Phạm vi | Trạng thái | Nghiệm thu |
| --- | --- | --- |
| Backend quản trị tài khoản, hồ sơ và mật khẩu | Đã kiểm thử | Admin tạo/liệt kê/khóa/mở tài khoản. Chủ tài khoản sửa hồ sơ, đổi/reset mật khẩu. Token cũ bị từ chối. |
| Backend ma trận quyền | Đã kiểm thử | Admin chỉnh grant trong bốn role hiện có. Request bị từ chối khi thiếu grant. Phiên thành viên bị thu hồi khi quyền thay đổi. |
| Tích hợp SMTP và Twilio Verify | REVIEW | Cấu hình SMTP và Verify Service SID `VA…` cùng API key. Xác nhận OTP email, OTP SMS và link reset đến tài khoản thử. |
| Web/Mobile hoàn thiện xác thực và quản trị | TODO | Nối đăng ký theo hợp đồng mới, OTP/gửi lại, quên/reset mật khẩu và giao diện Admin quản trị tài khoản/role. |

## Sprint 2 · Cuộc thi và nộp bài

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-28 | Backend | Schema Contests, Categories và Scoring Criteria | Duong Nguyen | DONE | REVIEW | Có cả ba bảng. Schema cuộc thi chỉ có hai mốc, weight lưu hai chữ số thập phân và chưa có kiểm tra tổng đúng 1.0000 theo BR-08/15. |
| FPC-29 | Backend | CRUD cuộc thi gồm tiêu chí, hạn nộp, thể lệ và cơ cấu giải | Duong Nguyen | DONE | DOING | Có CRUD cơ bản và kiểm tra Organizer sở hữu cuộc thi khi sửa/xóa. Thiếu tiêu chí, giải, lịch 5 mốc và điều kiện chuyển trạng thái. |
| FPC-30 | Backend | API danh sách cuộc thi đang mở và tìm kiếm | Duong Nguyen | DONE | DONE | Có tìm kiếm, phân trang và lọc theo trạng thái. Trạng thái hiện là bộ lọc tùy chọn, không xác định đang mở dựa trên hạn nộp. |
| FPC-31 | Backend | Schema Submissions, FilmRolls và FilmMetadata | Hà Đức Bình | DONE | DONE | Có cả ba bảng. Mã cuộn phim trong metadata là chuỗi, chưa liên kết khóa ngoại với FilmRolls. Xem quy tắc đầu vào ở FPC-32. |
| FPC-32 | Backend | API nộp bài bằng multipart cho ảnh scan độ phân giải cao | Hà Đức Bình | DONE | REVIEW | Đã kiểm tra trạng thái nhận bài, giới hạn frame và Lab/quy trình. Khóa theo cuộn–frame khi ghi bài. Chưa chạy tích hợp PostgreSQL. |
| FPC-33 | Backend | Validate TIFF/JPEG, dung lượng và kích thước tối thiểu | Hà Đức Bình | DONE | DONE | Test qua phần định dạng, dung lượng, kích thước theo phạm vi Jira. Chưa thấy bước kiểm tra watermark trong luồng nộp theo BR-07. |
| FPC-34 | Web | Dashboard danh sách cuộc thi của Organizer | Vĩ Nguyễn | DONE | DONE | Đã khôi phục bộ lọc `createdBy` cho danh sách Portal của Organizer. |
| FPC-35 | Web | Form tạo cuộc thi có chủ đề và lịch nộp, chấm | Vĩ Nguyễn | DONE | DONE | Phạm vi form đã có. Lưu đầy đủ lịch trình phụ thuộc FPC-29. |
| FPC-36 | Web | Giao diện tiêu chí động và trọng số | Vĩ Nguyễn | DONE | DONE | Phạm vi UI có. Chưa có API đọc/lưu tiêu chí. |
| FPC-37 | Web | Trang chủ hiển thị các cuộc thi đang diễn ra | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-38 | Web | Trang chi tiết cuộc thi gồm thể lệ, giám khảo và giải thưởng | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-39 | Web | Giao diện thông tin cho người muốn đăng ký | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-40 | Mobile | Danh sách cuộc thi và lọc theo trạng thái | Hoài Bảo Từ | DONE | DONE | — |
| FPC-41 | Mobile | Chi tiết cuộc thi và nút đăng ký | Hoài Bảo Từ | DONE | DONE | Có màn và nút. Nghiệm thu luồng đăng ký theo FPC-42. |
| FPC-42 | Mobile | Kiểm tra điều kiện và lưu trạng thái tham gia | Hoài Bảo Từ | DONE | DOING | Có kiểm tra trên Mobile. Thiếu lưu tham gia, hạng mục chưa được truyền vào form. Commit `ca22a0f` trên develop. |
| FPC-43 | Mobile | Form thông số chụp gồm máy, ống kính, phim, ISO và frame | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-44 | Mobile | Form tráng và scan gồm lab, thiết bị và độ phân giải | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-45 | Mobile | Image picker và preview ảnh scan, đính kèm đối chứng | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-46 | Lead | Đo hiệu năng upload ảnh lớn và xây luồng sinh thumbnail | Nam Nguyễn | DONE | REVIEW | Chưa xác minh số đo upload lớn hoặc luồng sinh thumbnail. |
| FPC-47 | Lead | Đặc tả Contest và Submission trên Postman/Swagger | Nam Nguyễn | DONE | DONE | — |

## Sprint 3 · Kiểm duyệt và thẩm định AI

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-49 | Backend | API danh sách bài cho Organizer với bộ lọc trạng thái và cờ AI | Nam Nguyễn | DONE | REVIEW | Có lọc trạng thái, cờ AI và phạm vi cuộc thi của Organizer. Chưa chạy tích hợp PostgreSQL. |
| FPC-50 | Backend | API duyệt hoặc từ chối bài kèm lý do | Nam Nguyễn | DONE | REVIEW | Đã chặn Organizer ngoài phạm vi, bài sau công bố và duyệt bài AI rủi ro cao. Còn thiếu xác minh âm bản, gỡ cờ và hạn 48 giờ. |
| FPC-51 | Backend | API chi tiết đối sánh bài nghi vấn với bài gốc | Nam Nguyễn | DONE | REVIEW | Đã giới hạn phạm vi Organizer và bỏ số liệu đối sánh mẫu. Chưa chạy tích hợp PostgreSQL. |
| FPC-52 | Backend | Webhook nhận và lưu pHash, xác suất AI và auto-tags | Hà Đức Bình | DONE | REVIEW | Đã giới hạn 5 tags. Chưa có cảnh báo lệch hạng mục theo BR-11. |
| FPC-53 | Backend | Phát hiện ảnh trùng bằng perceptual hash hoặc vector embeddings | Hà Đức Bình | DONE | DONE | Có pHash theo phạm vi task. Vector 92% vẫn là khoảng trống theo SRS. |
| FPC-54 | Backend | Kết nối model nhận diện ảnh AI và gán mức tin cậy | Hà Đức Bình | DONE | DONE | — |
| FPC-55 | Backend | Lưu kết quả phân tích và phân loại Verified/Suspicious/Flagged | Hà Đức Bình | DONE | REVIEW | Có lưu phân tích và phân loại Verified/Suspicious/Flagged. Trạng thái rủi ro cao và trùng ảnh chưa khớp BR-09/10. Điều kiện giữ bài và gỡ cờ theo FPC-50 vẫn còn thiếu. |
| FPC-56 | Web | Bảng quản lý, duyệt bài và hiển thị cờ AI | Vĩ Nguyễn | DONE | DONE | — |
| FPC-57 | Web | Modal so sánh hai ảnh nghi trùng | Vĩ Nguyễn | DONE | DONE | — |
| FPC-58 | Web | Thao tác duyệt hoặc từ chối hàng loạt | Vĩ Nguyễn | DONE | DONE | — |
| FPC-59 | Web | Màn hình quản lý danh sách giám khảo được mời | Phạm Tiến Thành Nhân | DONE | DONE | Phạm vi màn hình có. Còn thiếu API mời/đọc danh sách thật. |
| FPC-60 | Web | Giao diện phân giám khảo theo hạng mục hoặc vòng | Phạm Tiến Thành Nhân | DONE | DONE | Phạm vi giao diện có. Còn thiếu API lưu phân công. |
| FPC-61 | Web | Bảng theo dõi số bài phân cho từng giám khảo | Phạm Tiến Thành Nhân | DONE | DONE | Phạm vi bảng có. Còn thiếu API số liệu workload. |
| FPC-62 | Mobile | Màn Bài thi của tôi | Dương Nguyễn | DONE | DONE | — |
| FPC-63 | Mobile | Hiển thị cập nhật trạng thái kiểm duyệt bài | Dương Nguyễn | DONE | DONE | — |
| FPC-64 | Mobile | Hiển thị lý do từ chối và hướng dẫn bổ sung | Dương Nguyễn | DONE | DONE | — |
| FPC-65 | Mobile | Màn chỉnh sửa metadata khi có yêu cầu bổ sung | Dương Nguyễn | DONE | DONE | Phạm vi màn hình có. API metadata chưa mount, nên chưa lưu được. Commit `40fca44` trên develop. |
| FPC-66 | Mobile | Tối ưu cache ảnh danh sách với CachedNetworkImage | Dương Nguyễn | DONE | DONE | — |
| FPC-67 | Mobile | Nén ảnh trên client trước khi upload | Dương Nguyễn | DONE | DONE | — |
| FPC-68 | Lead | Đánh giá Precision, Recall và F1 của model AI | Nam Nguyễn | DONE | REVIEW | Chưa tìm thấy báo cáo Precision/Recall/F1 trong repo. |
| FPC-69 | Lead | Review xử lý bất đồng bộ và background job | Nam Nguyễn | DONE | REVIEW | Có worker và test queue/retry. Chưa tìm thấy kết quả review. |

## Sprint 4 · Chấm thi

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-70 | Backend | API danh sách bài được phân công cho giám khảo | Duong Nguyen | TODO | DONE | Ảnh tải bằng URL ẩn danh có kiểm tra phân công. |
| FPC-71 | Backend | API nộp điểm theo tiêu chí | Duong Nguyen | TODO | DONE | Chỉ ghi khi JUDGING và gửi đủ tiêu chí. |
| FPC-72 | Backend | API khóa bảng điểm khi kết thúc vòng | Duong Nguyen | TODO | DONE | Chỉ khóa phiếu đã chấm đủ bài. |
| FPC-73 | Backend | Thuật toán tổng hợp điểm từ nhiều giám khảo | Hà Đức Bình | DOING | DONE | Làm tròn sau khi tính trung bình và dùng trọng số bốn chữ số. |
| FPC-74 | Backend | API bảng xếp hạng theo điểm | Hà Đức Bình | TODO | DONE | Bảng điểm có cờ lệch điểm và chặn công bố khi còn cờ. |
| FPC-75 | Backend | Xử lý đồng điểm | Hà Đức Bình | TODO | DONE | Đồng điểm dùng hạng 1, 1, 3 riêng mỗi hạng mục. |
| FPC-76 | Web | Màn theo dõi tiến độ chấm của từng giám khảo | Vĩ Nguyễn | REVIEW | REVIEW | Có màn theo dõi với dữ liệu mẫu. Commit `0d5b809` trên develop. |
| FPC-77 | Web | Bảng điểm tổng hợp cập nhật cho Organizer | Vĩ Nguyễn | REVIEW | REVIEW | Có bảng điểm với dữ liệu mẫu. Commit `940d758` trên develop. |
| FPC-78 | Web | Nhắc giám khảo sắp trễ hạn qua email | Vĩ Nguyễn | TODO | TODO | — |
| FPC-79 | Web | Giao diện chấm toàn màn hình | Phạm Tiến Thành Nhân | REVIEW | REVIEW | [PR #147](https://github.com/hnamhocit/cnpm_110/pull/147), tích hợp qua #150. Có Focus Mode toàn màn hình trên trang demo dùng bài mẫu. Chưa nối danh sách phân công và kiểm soát quyền Judge. |
| FPC-80 | Web | Trình xem ảnh chất lượng cao có zoom và metadata | Phạm Tiến Thành Nhân | REVIEW | REVIEW | [PR #148](https://github.com/hnamhocit/cnpm_110/pull/148), tích hợp qua #150. Có zoom đến 350%, kéo ảnh và xem thông số phim/máy từ dữ liệu mẫu. Chưa thử với ảnh scan thật. |
| FPC-81 | Web | Thanh trượt chấm từng tiêu chí và nhập nhận xét | Phạm Tiến Thành Nhân | REVIEW | REVIEW | [PR #149](https://github.com/hnamhocit/cnpm_110/pull/149), tích hợp qua #150. Có slider, nhận xét, kiểm tra đầu vào và tính điểm theo trọng số. Nút gửi giả lập thành công, chưa lưu điểm. |
| FPC-82 | Mobile | Thông báo khi bài được đưa vào vòng chấm | Dương Nguyễn | REVIEW | REVIEW | Commit `90d6f07` trên develop. Cần xác nhận nghiệm thu. |
| FPC-83 | Mobile | Hiển thị trạng thái đang trong vòng chấm | Dương Nguyễn | REVIEW | REVIEW | Commit `f5eec7e` trên develop. Cần xác nhận nghiệm thu. |
| FPC-84 | Mobile | Cache ảnh bài thi | Huỳnh Trần Gia Bảo | REVIEW | REVIEW | Commit `260dd1f` trên develop. Cần xác nhận nghiệm thu. |
| FPC-85 | Mobile | Chuyển trang và skeleton loading danh sách ảnh lớn | Huỳnh Trần Gia Bảo | REVIEW | REVIEW | Commit `a628e31` trên develop. Cần xác nhận nghiệm thu. |
| FPC-86 | Lead | Review thuật toán tính điểm và kiểm tra xử lý đồng thời | Nam Nguyễn | TODO | DONE | Đã review và chạy 15 unit test, 25 ca integration PostgreSQL sau khi sửa. [Kết quả review](overview.md#review-fpc-86) |
| FPC-87 | Lead | Cập nhật Swagger/Postman cho Judging | Nam Nguyễn | TODO | DONE | Đã cập nhật năm route Judging đã đăng ký trong Swagger/Postman. [Hợp đồng](../ai/09-api-contracts.md#61-hợp-đồng-judging) |

## Sprint 5 · Kết quả, triển lãm và kiểm thử

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-88 | Backend | API công bố kết quả và vinh danh người thắng | Duong Nguyen | TODO | TODO | Route đọc kết quả hiện có. API công bố chính thức còn thiếu. |
| FPC-89 | Backend | API Public Digital Archive có phân trang và bộ lọc | Duong Nguyen | TODO | TODO | — |
| FPC-90 | Backend | API chi tiết tác phẩm lưu trữ kèm điểm và nhận xét | Duong Nguyen | TODO | TODO | — |
| FPC-91 | Backend | API thống kê phim, ISO và lab | Hà Đức Bình | TODO | TODO | — |
| FPC-92 | Backend | Bộ lọc nâng cao cho Archive theo film stock và camera | Hà Đức Bình | TODO | TODO | — |
| FPC-93 | Backend | Index cho truy vấn tìm kiếm kho ảnh | Hà Đức Bình | TODO | TODO | — |
| FPC-94 | Web | Dashboard biểu đồ thống kê cuộc thi | Vĩ Nguyễn | TODO | TODO | — |
| FPC-95 | Web | Chốt và công bố kết quả với xác nhận nhiều bước | Vĩ Nguyễn | TODO | TODO | — |
| FPC-96 | Web | Quản trị cài đặt hệ thống và Master Data | Vĩ Nguyễn | TODO | TODO | — |
| FPC-97 | Web | Giao diện Digital Archive dạng masonry | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Archive Web dùng dữ liệu mẫu, phụ thuộc FPC-89. Commit `212cef4` trên develop. |
| FPC-98 | Web | Modal chi tiết tác phẩm đạt giải | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Modal có UI, phụ thuộc FPC-90 để lấy dữ liệu thật. Commit `7a4e551` trên develop. |
| FPC-99 | Web | Bộ lọc kho ảnh theo film stock, định dạng và năm | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Lọc dữ liệu mẫu phía client; tích hợp Backend phụ thuộc FPC-89/92. Commit `eee91f0` trên develop. |
| FPC-100 | Mobile | Màn Bảng vàng vinh danh | Dương Nguyễn | REVIEW | REVIEW | Đã gọi API kết quả. Backend còn điểm và giải mẫu. Commit `4c85926` trên develop. |
| FPC-101 | Mobile | Portfolio cá nhân có lịch sử giải thưởng | Dương Nguyễn | REVIEW | REVIEW | Đã gọi API portfolio. Backend còn dữ liệu giải mẫu. Commit `f952350` trên develop. |
| FPC-102 | Mobile | Chia sẻ tác phẩm đạt giải lên mạng xã hội | Huỳnh Trần Gia Bảo | TODO | TODO | — |
| FPC-103 | Mobile | Kiểm tra Dark Mode và Light Mode trên Mobile | Huỳnh Trần Gia Bảo | TODO | TODO | — |
| FPC-104 | Lead | Stress test tải đồng thời nhiều ảnh từ Cloud Storage | Nam Nguyễn | TODO | TODO | — |
| FPC-105 | Lead | Rà soát bảo mật và quyền truy cập dữ liệu | Nam Nguyễn | TODO | TODO | — |
| FPC-106 | Backend | Sửa lỗi phát hiện qua kiểm thử E2E | Duong Nguyen | TODO | TODO | — |
| FPC-107 | Backend | CORS, rate limiting, logging và bảo vệ endpoint nhạy cảm | Duong Nguyen | TODO | TODO | — |
| FPC-108 | Backend | Dữ liệu mẫu phục vụ demo | Duong Nguyen | TODO | REVIEW | Repo có mã seed. Cần chạy và kiểm tra bộ mẫu đủ cho demo. |

## Sprint 6 · Triển khai, phát hành và bàn giao

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-110 | Backend | Triển khai Backend production | Hà Đức Bình | TODO | TODO | — |
| FPC-111 | Backend | Tên miền, SSL và reverse proxy | Hà Đức Bình | TODO | TODO | — |
| FPC-112 | Backend | Sao lưu PostgreSQL tự động | Hà Đức Bình | TODO | TODO | — |
| FPC-113 | Web | Kiểm tra responsive Admin và Organizer Portal | Vĩ Nguyễn | TODO | TODO | — |
| FPC-114 | Web | Triển khai Web Portal | Vĩ Nguyễn | TODO | TODO | — |
| FPC-115 | Web | Sửa UI/UX và tối ưu thời gian tải | Vĩ Nguyễn | TODO | TODO | — |
| FPC-116 | Web | Kiểm tra responsive Public Contest và Digital Archive | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Commit `8848894` trên develop. Cần xác nhận nghiệm thu. |
| FPC-117 | Web | Tối ưu SEO và OpenGraph metadata | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Commit `78a18d1` trên develop. Cần xác nhận nghiệm thu. |
| FPC-118 | Web | Empty state và trang lỗi 404/500 | Phạm Tiến Thành Nhân | REVIEW | REVIEW | Commit `f4e96f7` trên develop. Cần xác nhận nghiệm thu. |
| FPC-119 | Mobile | Bản phát hành Android APK và iOS TestFlight | Dương Nguyễn | TODO | TODO | — |
| FPC-120 | Mobile | Kiểm thử Mobile trên thiết bị thật | Dương Nguyễn | TODO | TODO | — |
| FPC-121 | Mobile | Màn thông báo mất kết nối Internet | Huỳnh Trần Gia Bảo | TODO | TODO | — |
| FPC-122 | Mobile | Rà soát luồng Mobile từ đăng ký, nộp bài đến xem kết quả | Huỳnh Trần Gia Bảo | TODO | TODO | — |
| FPC-123 | Lead | Tổng hợp Burndown và Velocity từ Jira | Nam Nguyễn | TODO | TODO | Ảnh Jira chỉ có trạng thái chụp tại một thời điểm. Burndown và Velocity cần lịch sử sprint hoặc dữ liệu thay thế có ghi phương pháp. |
| FPC-124 | Lead | Hoàn thiện phần báo cáo thực nghiệm AI của Capstone | Nam Nguyễn | TODO | TODO | — |
| FPC-125 | Lead | Kịch bản demo và video dự phòng | Nam Nguyễn | TODO | TODO | — |

## Đặc tả liên sprint

| Mã | Phạm vi | Công việc | Người phụ trách | Jira | Hiện tại | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-126 | Tài liệu | Module 01 Auth & RBAC | Huỳnh Trần Gia Bảo | DONE | DONE | Đã đồng bộ tài liệu với Backend và biến môi trường SMTP/Twilio. |
| FPC-127 | Tài liệu | Module 02 Analog Master Data | Huỳnh Trần Gia Bảo | DONE | DONE | — |
| FPC-128 | Tài liệu | Module 03 Contest Lifecycle | Duong Nguyen | DONE | DONE | — |
| FPC-129 | Tài liệu | Module 07 Blind Judging | Duong Nguyen | DONE | DONE | — |
| FPC-130 | Tài liệu | Module 04 Film Logbook | Vĩ Nguyễn | DONE | DONE | — |
| FPC-131 | Tài liệu | Module 05 Submission & Proof | Vĩ Nguyễn | DONE | DONE | — |
| FPC-132 | Tài liệu | Module 06 AI Verification | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-133 | Tài liệu | Module 10 Database & Storage | Phạm Tiến Thành Nhân | DONE | DONE | — |
| FPC-134 | Tài liệu | Module 08 Archive & Exhibition | Hà Đức Bình | DONE | DONE | — |
| FPC-135 | Tài liệu | Module 09 Shared API Contracts | Hà Đức Bình | DONE | DONE | — |
| FPC-136 | Backend | Chuẩn hóa tài liệu 06–10 theo mẫu dành cho AI | Hà Đức Bình | DONE | DONE | — |
| FPC-137 | Backend | Bổ sung các phần còn lại của module 01–05 và mục 4–5 của SRS | Nam Nguyễn | DONE | DONE | — |
