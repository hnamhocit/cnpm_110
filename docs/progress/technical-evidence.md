# Bằng chứng kỹ thuật CINEGEN

Các ghi nhận và trạng thái Jira phản ánh thời điểm rà soát. Xem [dashboard](overview.md) để biết trạng thái nghiệm thu hiện hành.

## Tổng quan trước khi tổ chức lại

Đối chiếu với [SRS PDF mới](../SRS_Film_Photography_Contest_Platform_Full.pdf) và [SRS Markdown](../srs.md).

| Phân loại | Kết quả rà soát |
| --- | --- |
| KEEP | JWT, thu hồi phiên, kiểm tra chủ sở hữu, metadata phim, chống nộp trùng frame trong cùng cuộc thi, worker AI PostgreSQL, chấm ẩn danh và tính điểm trọng số. |
| REMOVE | Backend đã bỏ xác minh SMS/Twilio và giới hạn frame theo khổ phim. Đã bỏ API sửa grant, cờ lệch điểm và chặn công bố vì lệch điểm. |
| SIMPLIFY | Backend kích hoạt tài khoản bằng mã email; số điện thoại tùy chọn. Web và Mobile hỗ trợ nhập và gửi lại mã. Giữ viewer có zoom, REST và làm mới dữ liệu thông thường. |
| UPDATE | API đã hạ mức tối thiểu xuống một Judge cho mỗi hạng mục ở luồng mở chấm hiện có. Cần kiểm tra theo vòng, đồng bộ năm mốc/trạng thái, đối chứng và quyền xuất bản. Worker và webhook đọc ngưỡng AI/pHash từ cấu hình. UC-28 đọc thống kê DB, xuất JSON và gọi dịch vụ AI với số liệu tổng hợp. |
| IMPLEMENT | Còn thiếu luồng hoàn chỉnh sao chép cuộc thi, đăng ký hạng mục, chốt/chuyển vòng, logbook và kho ảnh công khai tách bản gốc. |

[Module 09](../ai/09-api-contracts.md) và [OpenAPI](../openapi.yaml) ghi hợp đồng và trạng thái API. [Các sprint](sprints.md) lưu lịch sử Jira.

## UC-03–05 · Hồ sơ và quản trị tài khoản

Web có màn Hồ sơ cá nhân và Quản lý tài khoản dành cho Admin. Mobile có cập nhật họ tên, URL ảnh đại diện và đổi mật khẩu. API chỉ cho Admin gán vai trò cố định cho tài khoản khác; phiên cũ bị thu hồi và thao tác được ghi audit. 17 ca tích hợp Auth đạt trên PostgreSQL tạm, gồm tạo tài khoản, khóa/mở khóa, sửa hồ sơ, đổi mật khẩu và kiểm tra quyền sau khi đổi vai trò.

## Điều kiện còn thiếu để nghiệm thu

- **UC-11, UC-15/25.** Lược đồ hiện có lưu hai mốc và phân công theo hạng mục. Cần mô hình năm mốc, thể lệ, giải và vòng chấm để sao chép đủ cấu hình và khóa/chuyển vòng. Cần xử lý đồng điểm và lưu lý do trước khi xây bảng kết quả chính thức từ vòng cuối.
- **UC-17/34, UC-35/36.** Cần đăng ký theo hạng mục, lưu xác nhận thể lệ và liên kết bài với đăng ký, Film Roll và Film Frame. Các bài lịch sử cần phương án tương thích khi bổ sung liên kết bắt buộc.
- **UC-21/38/39.** Ràng buộc DB hiện chưa cho phép lưu `PROOF_REQUESTED`. Cần lưu hạn do Organizer đặt, tải/xác minh bằng chứng, sửa/rút bài, và áp dụng điều kiện đối chứng tại duyệt/công bố.
- **UC-26/27/41–43.** API kết quả còn dữ liệu mẫu. Cần chốt thứ hạng và giải từ dữ liệu chấm, đưa ảnh xem trước vào kho công khai và nghiệm thu năm luồng xuyên Web/Mobile.
- **UC-05/09, CR-04.** Cần hoàn thiện quản trị ngưỡng AI, tra cứu audit và thông báo nghiệp vụ. Cấu hình SMTP và dịch vụ AI phân tích báo cáo thực tế vẫn cần xác minh.

## Lịch sử rà soát trước lần cập nhật SRS

Các số liệu và nhận định dưới đây áp dụng tại thời điểm rà soát tương ứng.

## Rà soát 4 PR Web của Phạm Tiến Thành Nhân · 2026-11-23

Cả bốn PR đã được duyệt và merge vào `develop`. Diff của ba merge commit #147–#149 rỗng vì #150 đã đưa các thay đổi đó vào trước.

| PR | Phần đã có trong mã |
| --- | --- |
| [#147](https://github.com/hnamhocit/cnpm_110/pull/147) · FPC-79 | Focus Mode tại `/judge/evaluations/[id]`, có nút toàn màn hình và hiển thị mã bài. Trang dùng bài và tiêu chí mẫu. Chưa có luồng từ danh sách phân công hoặc kiểm tra quyền Judge trên trang. |
| [#148](https://github.com/hnamhocit/cnpm_110/pull/148) · FPC-80 | Trình xem có zoom tới 350%, kéo ảnh và bảng metadata phim/máy. Ảnh và thông số dùng để demo. |
| [#149](https://github.com/hnamhocit/cnpm_110/pull/149) · FPC-81 | Slider theo tiêu chí, ô nhận xét, kiểm tra đầu vào và tính điểm theo trọng số. Nút gửi chỉ hiện thông báo thành công sau khi giả lập chờ, chưa lưu phiếu chấm. |
| [#150](https://github.com/hnamhocit/cnpm_110/pull/150) · Tích hợp Web | Đưa ba tính năng chấm vào `develop`, thêm fallback đọc role từ JWT khi API RBAC trả 404 và khai báo nguồn ảnh HTTPS. Danh sách Portal vẫn đọc `data.items` từ phản hồi phân trang, nhưng bỏ bộ lọc `createdBy` của Organizer. |

- **Kiểm tra:** `bun --filter web test` qua **59/59**. TypeScript báo trùng khóa `images` trong `next.config.ts`, trùng hàm `generateMetadata` ở trang chi tiết cuộc thi và thiếu các kiểu dữ liệu mà màn tiến độ chấm FPC-76 dùng. Hai job CI Web/API và Mobile đều báo thất bại trên cả bốn PR. Chưa chạy luồng E2E.
- **Phân quyền:** Fallback 404 đọc role từ JWT mà không xác minh chữ ký. Cần kiểm tra lại phạm vi danh sách Organizer sau khi bỏ `createdBy`. Các yêu cầu BR-12/13 còn phụ thuộc kiểm soát quyền và DTO từ Backend.
- **Sau review:** `f06e312` sửa lỗi TypeScript, bỏ fallback quyền từ JWT chưa xác minh và hiển thị rõ phiếu chấm thử chưa lưu. Lượt kiểm tra trên `develop` qua TypeScript và 60 unit test Web. FPC-79–81 hoàn tất phạm vi UI. API FPC-70–72 đã tích hợp và còn cần nối vào luồng chấm Web. [Sprint 4](sprints.md#sprint-4--chấm-thi)

## Rà soát nghiệm thu Backend · 2026-11-23

Đối chiếu SRS, module liên quan, OpenAPI và route Hono tại `6154028`. Cột **Trạng thái** chuyển 9 task từ `DONE` sang `REVIEW`. FPC-29 giữ `DOING`. Các task có tiêu đề hẹp như viết test, kiểm tra định dạng ảnh hoặc triển khai pHash giữ trạng thái theo phạm vi Jira.

| Task | Kết quả đối chiếu |
| --- | --- |
| FPC-9, FPC-12 · Xác thực và RBAC | Đăng ký cấp token ngay, thiếu bước xác thực định danh theo BR-01. Middleware xác minh chữ ký và hạn JWT, nhưng không kiểm tra trạng thái tài khoản hoặc phiên bản token nên chưa thu hồi access token tức thì theo BR-04. Refresh từ chối tài khoản đang `is_active = FALSE`, chưa có route khóa tài khoản để thu hồi toàn bộ phiên. [Auth service](../../apps/api/src/services/auth.service.ts) · [Middleware](../../apps/api/src/middlewares/auth.ts) |
| FPC-28, FPC-29 · Schema và vòng đời cuộc thi | Chỉ có `startAt` và `endAt` thay vì 5 mốc BR-08. Cột trọng số có hai chữ số thập phân và chưa có kiểm tra tổng 1.0000 (BR-15). Route sửa/xóa không xác minh chủ cuộc thi với Organizer. Đường cập nhật trạng thái chung chưa kiểm tra đủ 3 giám khảo khi mở chấm hoặc xác minh âm bản trước công bố (BR-02/06/20). [Schema](../../apps/api/src/db/schema.ts) · [Controller](../../apps/api/src/controllers/contest.controller.ts) · [Service](../../apps/api/src/services/contest.service.ts) |
| FPC-32 · Nộp bài | Có kiểm tra thời gian theo hai mốc nhưng không dùng trạng thái cuộc thi để chặn nộp. `frameNumber` chỉ cần là chuỗi có nội dung, chưa kiểm tra giới hạn theo khổ (BR-23). Lab và quy trình tráng đều tùy chọn (BR-22). Kiểm tra trùng cuộn–frame chạy trước transaction ghi bài, chưa có ràng buộc chống hai yêu cầu đồng thời (BR-05). [Controller](../../apps/api/src/controllers/submission.controller.ts) · [Service](../../apps/api/src/services/submission.service.ts) |
| FPC-49–51 · Danh sách, kiểm duyệt và đối sánh | Các route kiểm tra vai trò Organizer nhưng thiếu phạm vi cuộc thi. Kiểm duyệt có lý do loại bài và log, nhưng vẫn có thể đổi trạng thái bài sau công bố hoặc duyệt bài rủi ro AI chưa có âm bản được xác minh (BR-09/16/18). Yêu cầu đối chứng chỉ đổi trạng thái, chưa ghi hạn 48 giờ hoặc tự động loại (BR-19). Đối sánh trả xác suất và pHash mẫu khi thiếu phân tích. [Routes](../../apps/api/src/routes/submissions.route.ts) · [Service](../../apps/api/src/services/submission.service.ts) |
| FPC-52, FPC-55 · Webhook và phân loại AI | Webhook cho lưu đến 50 tags và chưa thấy cảnh báo lệch hạng mục (BR-11). Phân loại dùng ngưỡng 75% nhưng ghi `FLAGGED` thay vì `AI_FLAGGED_HIGH_RISK`; liên kết trùng pHash được lưu, nhưng trạng thái dùng `SUSPICIOUS` thay vì `DUPLICATE_SUSPECT` khi chỉ phát hiện trùng (BR-09/10). FPC-53 có nhánh pHash, còn thiếu nhánh cosine 92%. FPC-54 có client và worker gọi model, chưa xác minh với dịch vụ model đang triển khai. [Webhook](../../apps/api/src/controllers/ai-webhook.controller.ts) · [Phân loại](../../apps/api/src/services/ai/ai-result-classification.ts) |
| FPC-33 · Kiểm tra ảnh | Đúng phạm vi Jira về JPEG/TIFF, 25 MiB và cạnh ngắn từ 2000 px. Chưa thấy bước kiểm tra watermark cá nhân theo BR-07. [Validator](../../apps/api/src/utils/validate-image.ts) |

`bun --filter api check-types` qua. `bun --filter api test` có **36 pass, 3 fail**. Cả ba lỗi thuộc bộ test kết quả cuộc thi FPC-100, với HTTP 500 trong test thay cho 404, 400 và 200 mong đợi. Chưa chạy integration với PostgreSQL hoặc xác minh trên môi trường triển khai. [Bộ test kết quả](../../apps/api/tests/contest-results.test.ts)

## Sửa lỗi sau rà soát

Hành vi API sau sửa đã được ghi trong [OpenAPI](../openapi.yaml) và [hợp đồng API](../ai/09-api-contracts.md).

- Web đã khôi phục cấu hình và kiểu dữ liệu để qua TypeScript, dùng phản hồi đã xác thực từ Backend để mở Portal và khôi phục bộ lọc danh sách Organizer. Focus Mode báo rõ phiếu chấm thử chưa được lưu.
- Backend đã kiểm tra tài khoản còn hoạt động khi dùng access token, giới hạn quyền Organizer theo cuộc thi, kiểm tra trạng thái nhận bài, frame và Lab/quy trình tráng. Ghi bài khóa theo cuộn–frame trong transaction. Kiểm duyệt chặn đổi bài sau công bố và duyệt bài AI rủi ro cao khi chưa có luồng xác minh âm bản. Đối sánh trả giá trị thiếu thay cho số liệu mẫu. Webhook giới hạn 5 tags.
- Các task giữ REVIEW cho đến khi nghiệm thu các luồng còn thiếu gồm xác thực định danh, lịch 5 mốc, đối chứng 48 giờ, phân loại AI theo SRS và chấm điểm qua API.

## Đối chiếu Jira cũ với hiện trạng

[Bảng công việc theo 6 sprint](sprints.md) lưu mã, người phụ trách và trạng thái từng task đọc được từ ảnh Jira.

Trạng thái bên dưới lấy từ tám ảnh Jira. Người phụ trách là assignee trong ảnh. Mỗi nhận định áp dụng cho phạm vi nhìn thấy của task. Những kết quả có thể nằm ngoài repo được ghi là chưa xác minh.

| Task Jira đánh dấu Done | Người phụ trách trong Jira | Đối chiếu với mã nguồn |
| --- | --- | --- |
| FPC-42 · Kiểm tra điều kiện và lưu trạng thái tham gia | Hoài Bảo Từ | **Thiếu phần lưu.** Mobile kiểm tra đăng nhập, vai trò, thời gian rồi mở form nộp. Chưa có route đăng ký hoặc trạng thái tham gia được lưu. FPC-41 có màn chi tiết và nút theo phạm vi UI. [Mobile](../../apps/mobile/lib/screens/contest/contest_detail_screen.dart) · [API cuộc thi](../../apps/api/src/routes/contests.route.ts) |
| FPC-29 · CRUD cuộc thi gồm tiêu chí, hạn, thể lệ, giải | Nam Nguyễn | **Phạm vi còn thiếu.** Có CRUD thông tin cơ bản; controller nhận `name`, `description`, `startAt`, `endAt` và `status`. Chưa có route lưu tiêu chí hay cơ cấu giải. FPC-35 có form nhập lịch trình, nhưng API chưa lưu đủ các mốc từ form. FPC-36 có UI và kiểm tra tổng 100%, nhưng tiêu chí mẫu và route lưu còn thiếu. [Controller](../../apps/api/src/controllers/contest.controller.ts) · [Form tạo](../../apps/web/src/app/portal/contests/create/page.tsx) · [Tiêu chí](../../apps/web/src/app/portal/contests/criteria/page.tsx) |
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

## Điểm đối chiếu trong mã

- Backend: [đăng ký route](../../apps/api/src/index.ts), [contest](../../apps/api/src/services/contest.service.ts), [submission](../../apps/api/src/routes/submissions.route.ts), [AI worker](../../apps/api/src/ai-worker.ts), [schema](../../apps/api/src/db/schema.ts) và [R2](../../apps/api/src/r2.ts).
- Web: [đăng nhập](../../apps/web/src/components/auth/login-form.tsx), [nộp bài](../../apps/web/src/components/contest/contest-cta-button.tsx), [kiểm duyệt](../../apps/web/src/components/submission/submission-table.tsx), [đối sánh AI](../../apps/web/src/components/submission/image-comparison-modal.tsx), [bảng điểm](../../apps/web/src/app/portal/contests/scoreboard/page.tsx) và [triển lãm](../../apps/web/src/components/archive/archive-client-view.tsx).
- Mobile: [Auth](../../apps/mobile/lib/core/network/auth_service.dart), [cuộc thi và bảng vàng](../../apps/mobile/lib/core/data/contest_repository.dart), [nộp bài](../../apps/mobile/lib/core/data/submission_repository.dart), [portfolio](../../apps/mobile/lib/core/data/portfolio_repository.dart) và [hồ sơ](../../apps/mobile/lib/screens/profile/edit_profile_screen.dart).


## Review FPC-86

Đối chiếu Module 07 và SRS với nhánh `origin/feature/FPC-75-tie-ranking` tại `c73275a`, chứa các thay đổi FPC-70–75. Bun chạy hai bộ unit test tính điểm và xếp hạng với **14 pass, 0 fail**. Sau khi áp dụng migration trên PostgreSQL 18 tạm, bộ Judge và Scoreboard đạt **21 pass, 0 fail**. Bản chạy tạm bỏ phần xóa bản ghi fixture và bổ sung một ca kiểm tra đồng thời.

| Phát hiện | Kết quả |
| --- | --- |
| BR-25 · Làm tròn điểm chung cuộc | Hàm làm tròn điểm từng giám khảo trước khi tính trung bình. Đã tái hiện với hai tiêu chí trọng số 0,5 và ba giám khảo có tổng điểm chưa làm tròn là 0, 0,005 và 0,005. Hàm trả 0,01, trong khi trung bình làm tròn một lần cho kết quả 0,00. |
| BR-14 · Chênh lệch điểm | Phép so sánh ngưỡng dùng điểm đã làm tròn. Bảng điểm bỏ cờ `DISCREPANCY_CONFLICT` do hàm tính ra, nên Organizer chưa thấy cờ từ endpoint này. |
| BR-16 và UC-32–33 · Khóa ghi điểm | Gửi điểm và khóa phiếu đều giữ khóa `SELECT FOR UPDATE` trên cùng hàng phân công trong transaction. Nếu khóa phiếu commit trước, lần gửi sau đọc thấy `lockedAt` và trả 409. Nhánh chưa kiểm tra trạng thái cuộc thi khi ghi điểm, nên khóa hàng phân công chưa bảo vệ được khi cuộc thi đóng hoặc công bố. |
| Đồng thời trên PostgreSQL | Hai lần gửi đồng thời dùng chung một phiếu, với nhận xét và điểm cùng một lần ghi. Khi kết nối thứ nhất giữ khóa và ghi `locked_at`, lần gửi từ kết nối thứ hai chờ khóa rồi trả 409 sau khi kết nối thứ nhất commit. Ca gửi giữ khóa trước và ca đóng vòng hoặc công bố đồng thời chưa được chạy. |


### Kết quả tích hợp FPC-70–75

Ảnh chấm thi dùng URL chứa mã bài, kiểm tra phân công và bỏ metadata. Ghi điểm và khóa phiếu yêu cầu trạng thái `JUDGING` và dùng khóa hàng cuộc thi để đồng bộ với cập nhật trạng thái. Điểm chung cuộc làm tròn sau khi lấy trung bình, trọng số được lưu với bốn chữ số thập phân, và bảng điểm gắn cờ chênh lệch trước khi công bố. PostgreSQL 18 tạm áp dụng migration thành công và **25 ca integration đạt**. **15 unit test** tính điểm và xếp hạng đạt.


## Rà soát schema và actor Backend

Đối chiếu trực tiếp các controller, route, middleware, service và Drizzle schema với SRS. Với quyền tạo và sửa cuộc thi, SRS UC-11/12 giao cho Organizer trong khi hợp đồng thiết kế Module 03 liệt kê thêm Admin. Backend áp dụng SRS. Admin giữ quyền đọc báo cáo AI theo Module 01 và quyền vào cổng quản trị. Organizer thao tác trên cuộc thi của mình. Participant xem bài và portfolio của mình. Judge chỉ dùng ảnh ẩn danh trong cuộc thi đang chấm và theo phân công còn hiệu lực. AI webhook dùng secret riêng.

Migration kiểm tra hạng mục thuộc đúng cuộc thi cho bài nộp và phân công, giới hạn trọng số từng tiêu chí và yêu cầu điểm tối đa dương. Tổng trọng số được kiểm tra khi mở chấm. Backend đối chiếu role trong JWT với phân quyền hiện tại trong DB, và kiểm tra BR-21 khi nộp bài.

Các phần còn thiếu theo SRS gồm lịch năm mốc và dữ liệu backfill, route phân công và cấu hình tiêu chí, kiểm chứng âm bản trước công bố, quy trình 48 giờ, dữ liệu điểm và giải đã chốt, thu hồi phiên đầy đủ khi khóa tại thời điểm rà soát, cùng các bảng danh mục, logbook và tài sản số theo Module 02/04/10. Tại thời điểm rà soát, schema auth chưa có số điện thoại xác minh và phiên bản token. Xem mục nghiệm thu Module 01 phía trên để biết thay đổi sau đó. Film metadata hiện lưu mã cuộn dạng chuỗi. `REQUEST_PROOF` hiện vướng ràng buộc trạng thái trong DB và cần triển khai thống nhất với deadline, nộp đối chứng và xử lý quá hạn.

Migration sửa schema áp dụng thành công trên PostgreSQL 18 tạm. API type check qua. Các bộ API hiện có đạt **39 unit test**; tích hợp Judging, scoreboard và submission đạt **32 ca PostgreSQL**. Test submission trước đó dùng mã khổ phim sai chuẩn, đã sửa fixture thành `135` để khớp BR-23. Chưa kiểm chứng migration/backfill trên database triển khai.

## Kế hoạch Jira trước khi tổ chức lại Sprint 5–6

## Sprint 5 · Kết quả, triển lãm và kiểm thử

**Cập nhật theo SRS mới (2026-11-25).** UC-28 dùng thống kê DB, xuất JSON và trả thống kê khi AI lỗi. Tích hợp xác nhận chỉ gửi dữ liệu tổng hợp cho AI. Còn công bố kết quả từ vòng cuối, ảnh xem trước công khai và nghiệm thu kho lưu trữ.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-88 | Backend | API công bố kết quả và vinh danh người thắng | Nam Nguyễn | TODO | Route đọc kết quả hiện có. API công bố chính thức còn thiếu. |
| FPC-89 | Backend | API Public Digital Archive có phân trang và bộ lọc | Nam Nguyễn | TODO | — |
| FPC-90 | Backend | API chi tiết tác phẩm lưu trữ kèm điểm và nhận xét | Nam Nguyễn | TODO | — |
| FPC-91 | Backend | API thống kê phim, ISO và lab | Hà Đức Bình | TODO | — |
| FPC-92 | Backend | Bộ lọc nâng cao cho Archive theo film stock và camera | Hà Đức Bình | TODO | — |
| FPC-93 | Backend | Index cho truy vấn tìm kiếm kho ảnh | Hà Đức Bình | TODO | — |
| FPC-94 | Web | Dashboard biểu đồ thống kê cuộc thi | Vĩ Nguyễn | TODO | — |
| FPC-95 | Web | Chốt và công bố kết quả với xác nhận nhiều bước | Vĩ Nguyễn | TODO | — |
| FPC-96 | Web | Quản trị cài đặt hệ thống và Master Data | Vĩ Nguyễn | TODO | — |
| FPC-97 | Web | Giao diện Digital Archive dạng masonry | Phạm Tiến Thành Nhân | REVIEW | Archive Web dùng dữ liệu mẫu, phụ thuộc FPC-89. Commit `212cef4` trên develop. |
| FPC-98 | Web | Modal chi tiết tác phẩm đạt giải | Phạm Tiến Thành Nhân | REVIEW | Modal có UI, phụ thuộc FPC-90 để lấy dữ liệu thật. Commit `7a4e551` trên develop. |
| FPC-99 | Web | Bộ lọc kho ảnh theo film stock, định dạng và năm | Phạm Tiến Thành Nhân | REVIEW | Lọc dữ liệu mẫu phía client; tích hợp Backend phụ thuộc FPC-89/92. Commit `eee91f0` trên develop. |
| FPC-100 | Mobile | Màn Bảng vàng vinh danh | Dương Nguyễn | REVIEW | Đã gọi API kết quả. Backend còn điểm và giải mẫu. Commit `4c85926` trên develop. |
| FPC-101 | Mobile | Portfolio cá nhân có lịch sử giải thưởng | Dương Nguyễn | REVIEW | Đã gọi API portfolio. Backend còn dữ liệu giải mẫu. Commit `f952350` trên develop. |
| FPC-102 | Mobile | Chia sẻ tác phẩm đạt giải lên mạng xã hội | Huỳnh Trần Gia Bảo | TODO | — |
| FPC-103 | Mobile | Kiểm tra Dark Mode và Light Mode trên Mobile | Huỳnh Trần Gia Bảo | TODO | — |
| FPC-104 | Lead | Stress test tải đồng thời nhiều ảnh từ Cloud Storage | Nam Nguyễn | TODO | — |
| FPC-105 | Lead | Rà soát bảo mật và quyền truy cập dữ liệu | Nam Nguyễn | TODO | — |
| FPC-106 | Backend | Sửa lỗi phát hiện qua kiểm thử E2E | Nam Nguyễn | TODO | — |
| FPC-107 | Backend | CORS, rate limiting, logging và bảo vệ endpoint nhạy cảm | Nam Nguyễn | TODO | — |
| FPC-108 | Backend | Dữ liệu mẫu phục vụ demo | Nam Nguyễn | REVIEW | Repo có mã seed. Cần chạy và kiểm tra bộ mẫu đủ cho demo. |

## Sprint 6 · Triển khai, phát hành và bàn giao

**Cập nhật theo SRS mới (2026-11-25).** Web production build qua Webpack và Flutter web build đạt. Web 57 test đạt, API toàn suite 145 đạt/19 lỗi, Mobile 189 đạt/2 lỗi. Migration hiện có chỉ chạy trên PostgreSQL tạm. Chưa nghiệm thu triển khai hay build APK/iOS.

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-110 | Backend | Triển khai Backend production | Hà Đức Bình | TODO | — |
| FPC-111 | Backend | Tên miền, SSL và reverse proxy | Hà Đức Bình | TODO | — |
| FPC-112 | Backend | Sao lưu PostgreSQL tự động | Hà Đức Bình | TODO | — |
| FPC-113 | Web | Kiểm tra responsive Admin và Organizer Portal | Vĩ Nguyễn | TODO | — |
| FPC-114 | Web | Triển khai Web Portal | Vĩ Nguyễn | TODO | — |
| FPC-115 | Web | Sửa UI/UX và tối ưu thời gian tải | Vĩ Nguyễn | TODO | — |
| FPC-116 | Web | Kiểm tra responsive Public Contest và Digital Archive | Phạm Tiến Thành Nhân | REVIEW | Commit `8848894` trên develop. Cần xác nhận nghiệm thu. |
| FPC-117 | Web | Tối ưu SEO và OpenGraph metadata | Phạm Tiến Thành Nhân | REVIEW | Commit `78a18d1` trên develop. Cần xác nhận nghiệm thu. |
| FPC-118 | Web | Empty state và trang lỗi 404/500 | Phạm Tiến Thành Nhân | REVIEW | Commit `f4e96f7` trên develop. Cần xác nhận nghiệm thu. |
| FPC-119 | Mobile | Bản phát hành Android APK và iOS TestFlight | Dương Nguyễn | TODO | — |
| FPC-120 | Mobile | Kiểm thử Mobile trên thiết bị thật | Dương Nguyễn | TODO | — |
| FPC-121 | Mobile | Màn thông báo mất kết nối Internet | Huỳnh Trần Gia Bảo | TODO | — |
| FPC-122 | Mobile | Rà soát luồng Mobile từ đăng ký, nộp bài đến xem kết quả | Huỳnh Trần Gia Bảo | TODO | — |
| FPC-123 | Lead | Tổng hợp Burndown và Velocity từ Jira | Nam Nguyễn | TODO | Ảnh Jira chỉ có trạng thái chụp tại một thời điểm. Burndown và Velocity cần lịch sử sprint hoặc dữ liệu thay thế có ghi phương pháp. |
| FPC-124 | Lead | Hoàn thiện phần báo cáo thực nghiệm AI của Capstone | Nam Nguyễn | TODO | — |
| FPC-125 | Lead | Kịch bản demo và video dự phòng | Nam Nguyễn | TODO | — |

## Đặc tả liên sprint

| Mã | Phạm vi | Công việc | Người phụ trách | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| FPC-126 | Tài liệu | Module 01 Auth & RBAC | Huỳnh Trần Gia Bảo | DONE | Đã đồng bộ tài liệu với Backend và biến môi trường SMTP/Twilio. |
| FPC-127 | Tài liệu | Module 02 Analog Master Data | Huỳnh Trần Gia Bảo | DONE | Đã có đặc tả. Theo dõi phần quản trị và tra cứu danh mục tại [overview](overview.md#độ-phủ-theo-module). |
| FPC-128 | Tài liệu | Module 03 Contest Lifecycle | Dương Nguyễn | DONE | — |
| FPC-129 | Tài liệu | Module 07 Blind Judging | Dương Nguyễn | DONE | — |
| FPC-130 | Tài liệu | Module 04 Film Logbook | Vĩ Nguyễn | DONE | — |
| FPC-131 | Tài liệu | Module 05 Submission & Proof | Vĩ Nguyễn | DONE | — |
| FPC-132 | Tài liệu | Module 06 AI Verification | Phạm Tiến Thành Nhân | DONE | — |
| FPC-133 | Tài liệu | Module 10 Database & Storage | Phạm Tiến Thành Nhân | DONE | — |
| FPC-134 | Tài liệu | Module 08 Archive & Exhibition | Hà Đức Bình | DONE | — |
| FPC-135 | Tài liệu | Module 09 Shared API Contracts | Hà Đức Bình | DONE | — |
| FPC-136 | Backend | Chuẩn hóa tài liệu 06–10 theo mẫu dành cho AI | Hà Đức Bình | DONE | — |
| FPC-137 | Backend | Bổ sung các phần còn lại của module 01–05 và mục 4–5 của SRS | Nam Nguyễn | DONE | — |
