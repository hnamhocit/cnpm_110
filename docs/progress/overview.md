# Tổng quan tiến độ Film Contest

**Mốc rà soát:** 2026-11-23, mã nguồn trên `develop` tại `a2ceb71`. Bảng dựa trên route, lớp dữ liệu, màn hình và commit hiện có. Các luồng chưa được chạy đầu cuối trong lần rà soát này.

- **Đặc tả:** Có đủ **10/10** tài liệu module. OpenAPI và Postman có **33 cặp method/path đang mount**, gồm các alias, và **36 endpoint dự kiến**. [Danh mục API](../ai/09-api-contracts.md#6-danh-mục-endpoint)
- **Nghiệp vụ có ít nhất một luồng nối API hoặc xử lý thật trong mã:** Web **4/8** module, Backend **5/8**, Mobile **4/8**. Mẫu số là module 01–08. Module 09–10 được đánh giá riêng vì dùng chung cho nhiều luồng.
- **Hoàn tất trọn module theo SRS:** Chưa xác nhận module nào đạt đầy đủ. Các tỷ lệ trên đo độ phủ tối thiểu theo module và không quy đổi thành phần trăm hoàn thành dự án.

## Độ phủ theo module

`Có luồng` nghĩa là có ít nhất một chức năng phía client gọi route hiện có, hoặc có route/worker thực thi chức năng phía Backend. `Một phần` nghĩa là mới có schema, màn hình mẫu hoặc tích hợp còn thiếu route tương ứng. Ô `—` nghĩa là chưa thấy luồng riêng trên nền tảng đó trong lượt rà soát.

| Module | Web | Backend | Mobile | Khoảng trống chính |
| --- | --- | --- | --- | --- |
| [01 Auth & RBAC](../ai/01-auth-and-rbac.md) | Có luồng · Đăng nhập, đăng ký, phiên | Có luồng · JWT, refresh, logout, hồ sơ hiện tại | Có luồng · Đăng nhập, đăng ký, lưu phiên | Thiếu route khôi phục mật khẩu, chỉnh hồ sơ/mật khẩu và quản trị tài khoản. Mobile có màn hình gọi một số route chưa mount. |
| [02 Danh mục ảnh phim](../ai/02-analog-master-data.md) | — | — | — | Chưa thấy luồng CRUD hoặc tra cứu danh mục phim, máy, ống kính và lab tập trung. |
| [03 Vòng đời cuộc thi](../ai/03-contest-lifecycle.md) | Có luồng · Danh sách, chi tiết, tạo cuộc thi và cập nhật trạng thái | Có luồng · CRUD cuộc thi, đọc hạng mục | Có luồng · Danh sách và chi tiết | Chưa đủ 5 mốc, đăng ký tham gia, cấu hình tiêu chí, phân công giám khảo và kiểm tra đủ số giám khảo. |
| [04 Sổ tay cuộn phim](../ai/04-film-logbook.md) | — | Một phần · Có schema cuộn phim | Một phần · Có form thông số phim trong luồng nộp | Thiếu quản lý cuộn phim và frame riêng, tích hợp API và đồng bộ offline. |
| [05 Nộp bài & đối chứng](../ai/05-submission-and-proof.md) | Có luồng · Nộp ảnh, hàng đợi, kiểm duyệt | Có luồng · Nộp và liệt kê bài, duyệt/loại và yêu cầu đối chứng qua kiểm duyệt | Có luồng · Danh sách bài và giao diện trạng thái, có màn nộp ảnh | Mobile thiếu hạng mục khi mở form nộp từ trang chi tiết. Route upload đối chứng và sửa metadata chưa mount. Chưa xác nhận hết hạn 48 giờ tự động hoặc rút bài. |
| [06 Thẩm định AI](../ai/06-ai-verification.md) | Có luồng · Gọi API đối sánh bài | Có luồng · Worker, webhook, phân loại và pHash | — | Chưa thấy API quét lại theo yêu cầu và nhánh tương đồng vector 92% trong mã hiện tại. |
| [07 Chấm ẩn danh](../ai/07-blind-judging.md) | Một phần · Màn phân công, tiến độ và bảng điểm dùng dữ liệu mẫu hoặc thiếu API | — | Một phần · Hiển thị trạng thái bài vào vòng chấm | Thiếu workspace chấm ẩn danh nối API, DTO cho Judge, ghi/khóa điểm và điều phối lệch điểm. |
| [08 Kết quả & triển lãm](../ai/08-archive-and-exhibition.md) | Một phần · Triển lãm dùng dữ liệu mẫu | Có luồng · Có route kết quả và portfolio, một số điểm/giải lấy từ mẫu | Có luồng · Gọi API bảng vàng và portfolio | Thiếu công bố kết quả chính thức, dữ liệu điểm/giải từ chấm thi và xuất bản ảnh triển lãm. |
| [09 Hợp đồng API](../ai/09-api-contracts.md) | Có tích hợp một số API chuẩn | Có envelope và danh mục route | Có tích hợp một số API chuẩn | Một số màn hình còn gọi route dự kiến hoặc phụ thuộc DTO khác hợp đồng đích. |
| [10 CSDL & lưu trữ](../ai/10-database-and-storage.md) | Tải multipart qua Backend | Có PostgreSQL/Drizzle và lưu R2 hoặc local | Tải multipart qua Backend | Thiếu contract presigned upload/confirm; chưa thấy đầy đủ luồng hai bản ảnh và lưu trữ vector. |

## Đối chiếu Jira cũ với hiện trạng

[Bảng công việc theo 6 sprint](sprints.md) lưu mã, người phụ trách và trạng thái từng task đọc được từ ảnh Jira.

Trạng thái bên dưới lấy từ tám ảnh Jira. Người phụ trách là assignee trong ảnh. Mỗi nhận định áp dụng cho phạm vi nhìn thấy của task. Những kết quả có thể nằm ngoài repo được ghi là chưa xác minh.

| Task Jira đánh dấu Done | Người phụ trách trong Jira | Đối chiếu với mã nguồn |
| --- | --- | --- |
| FPC-42 · Kiểm tra điều kiện và lưu trạng thái tham gia | Hoài Bảo Từ | **Thiếu phần lưu.** Mobile kiểm tra đăng nhập, vai trò, thời gian rồi mở form nộp. Chưa có route đăng ký hoặc trạng thái tham gia được lưu. FPC-41 có màn chi tiết và nút theo phạm vi UI. [Mobile](../../apps/mobile/lib/screens/contest/contest_detail_screen.dart) · [API cuộc thi](../../apps/api/src/routes/contests.route.ts) |
| FPC-29 · CRUD cuộc thi gồm tiêu chí, hạn, thể lệ, giải | Duong Nguyen | **Phạm vi còn thiếu.** Có CRUD thông tin cơ bản; controller nhận `name`, `description`, `startAt`, `endAt` và `status`. Chưa có route lưu tiêu chí hay cơ cấu giải. FPC-35 có form nhập lịch trình, nhưng API chưa lưu đủ các mốc từ form. FPC-36 có UI và kiểm tra tổng 100%, nhưng tiêu chí mẫu và route lưu còn thiếu. [Controller](../../apps/api/src/controllers/contest.controller.ts) · [Form tạo](../../apps/web/src/app/portal/contests/create/page.tsx) · [Tiêu chí](../../apps/web/src/app/portal/contests/criteria/page.tsx) |
| FPC-59–61 · Mời, phân công và theo dõi số bài theo giám khảo | Phạm Tiến Thành Nhân | **Có phần UI, còn thiếu tích hợp.** Các màn hiện có, nhưng Backend chưa mount route mời, phân công và đọc workload. Tiêu đề Jira chủ yếu giao màn hình nên phần tích hợp cần task Backend và tiêu chí nghiệm thu chung. [Mời giám khảo](../../apps/web/src/app/portal/contests/judges/page.tsx) · [Phân công](../../apps/web/src/app/portal/contests/assignments/page.tsx) · [Workload](../../apps/web/src/app/portal/contests/workloads/page.tsx) |
| FPC-65 · Màn chỉnh sửa metadata | Dương Nguyễn | **Có màn hình, còn thiếu lưu.** Repository gọi `/api/v1/submissions/{id}/metadata`, nhưng route chưa mount. Luồng upload đối chứng bổ sung gặp vấn đề tương tự với `/{id}/proof`. [Mobile repository](../../apps/mobile/lib/core/data/submission_repository.dart) · [API nộp bài](../../apps/api/src/routes/submissions.route.ts) |
| FPC-11 · Cloud Storage và thử upload lớn, FPC-46 · Đo hiệu năng upload và sinh thumbnail | Hà Đức Bình, Nam Nguyễn | **Có tích hợp R2, chưa xác minh phần nghiệm thu.** Có mã upload và lưu local dự phòng. Chưa tìm thấy kết quả đo upload lớn hoặc luồng sinh thumbnail phía máy chủ trong mã hiện tại. [R2](../../apps/api/src/r2.ts) |
| FPC-68 · Đánh giá Precision/Recall/F1, FPC-69 · Review xử lý bất đồng bộ | Nam Nguyễn | **Bằng chứng còn thiếu.** Repo có worker và integration test cho queue/retry. Chưa tìm thấy số đo đánh giá mô hình hoặc kết quả review để kiểm chứng trạng thái Jira. [AI worker](../../apps/api/src/ai-worker.ts) · [Integration test queue](../../apps/api/tests/ai-job-queue.integration.test.ts) |

Một số task Done có bằng chứng đúng phạm vi đang rà. FPC-16 có interceptor Web làm mới phiên khi gặp 401; FPC-58 có thao tác hàng loạt gọi API kiểm duyệt cho từng bài; FPC-62–63 có danh sách bài cá nhân và polling định kỳ trên Mobile. Đây là xác nhận từ mã nguồn. [HTTP client Web](../../apps/web/src/lib/http/client.ts) · [Kiểm duyệt Web](../../apps/web/src/components/submission/submission-table.tsx) · [Bài thi Mobile](../../apps/mobile/lib/screens/submission/my_submissions_screen.dart)

### Vì sao Web và Mobile lệch nhau

- **Phân vai hợp lý:** Web có Portal cho Organizer/Judge. Mobile tập trung Participant. Quản trị, phân công và chấm thi trên Web, cùng nhập thông số và theo dõi bài trên Mobile, phù hợp với phân vai của SRS. [SRS](../srs.md)
- **Thiếu giao việc xuyên nền tảng:** Web đã lấy hạng mục thật qua API khi nộp bài. Từ trang chi tiết Mobile, nút đăng ký chỉ truyền tên cuộc thi, router để `categoryId` rỗng và form chặn gửi. Đây là điểm đứt cụ thể giữa FPC-41/42 và luồng nộp, dù API hạng mục đã có. [Web chọn hạng mục](../../apps/web/src/components/contest/contest-cta-button.tsx) · [Mobile router](../../apps/mobile/lib/router/app_router.dart) · [Mobile upload](../../apps/mobile/lib/screens/submission/submission_upload_screen.dart)
- **Chấm và công bố phụ thuộc Backend:** Jira để FPC-70–72 và FPC-88–90 ở To Do. Các màn theo dõi, bảng điểm và triển lãm Web vẫn có dữ liệu mẫu. Bảng vàng Mobile đã gọi API, nhưng điểm và giải còn lấy từ mẫu tại Backend. Các task `In View` trong ảnh cần review theo phạm vi gốc. [Bảng điểm Web](../../apps/web/src/app/portal/contests/scoreboard/page.tsx) · [Kết quả Backend](../../apps/api/src/services/contest.service.ts)
- **Phạm vi nghiệm thu đang dừng ở từng màn hoặc từng route:** Khi tạo Jira mới, gom các task theo luồng và ghi phụ thuộc rõ. Với luồng chung cho Participant, nghiệm thu bằng một tài khoản thử đi qua đăng ký, chọn hạng mục, nộp, xem trạng thái và đối chứng giữa hai nền tảng. Luồng Organizer/Judge nghiệm thu từ phân công đến chấm, khóa điểm và công bố.

## Luồng còn thiếu để nối xuyên hệ thống

1. **Đăng ký và nộp bài.** Nối đăng ký cuộc thi, kiểm tra lịch trình 5 mốc, bổ sung route đối chứng và xử lý hết hạn 48 giờ.
2. **Chấm thi.** Nối phân công, danh sách ẩn danh, chấm/khóa điểm, tính điểm và xử lý lệch điểm.
3. **Công bố và triển lãm.** Dùng điểm và giải thật sau khi đủ điều kiện công bố, sau đó nối kho triển lãm Web với ảnh công khai đã xử lý.
4. **Danh mục và logbook.** Nối CRUD danh mục và cuộn phim/frame với luồng nộp bài, giữ mô hình dữ liệu nhất quán giữa các nền tảng.

## Điểm đối chiếu trong mã

- Backend: [đăng ký route](../../apps/api/src/index.ts), [contest](../../apps/api/src/services/contest.service.ts), [submission](../../apps/api/src/routes/submissions.route.ts), [AI worker](../../apps/api/src/ai-worker.ts), [schema](../../apps/api/src/db/schema.ts) và [R2](../../apps/api/src/r2.ts).
- Web: [đăng nhập](../../apps/web/src/components/auth/login-form.tsx), [nộp bài](../../apps/web/src/components/contest/contest-cta-button.tsx), [kiểm duyệt](../../apps/web/src/components/submission/submission-table.tsx), [đối sánh AI](../../apps/web/src/components/submission/image-comparison-modal.tsx), [bảng điểm](../../apps/web/src/app/portal/contests/scoreboard/page.tsx) và [triển lãm](../../apps/web/src/components/archive/archive-client-view.tsx).
- Mobile: [Auth](../../apps/mobile/lib/core/network/auth_service.dart), [cuộc thi và bảng vàng](../../apps/mobile/lib/core/data/contest_repository.dart), [nộp bài](../../apps/mobile/lib/core/data/submission_repository.dart), [portfolio](../../apps/mobile/lib/core/data/portfolio_repository.dart) và [hồ sơ](../../apps/mobile/lib/screens/profile/edit_profile_screen.dart).
