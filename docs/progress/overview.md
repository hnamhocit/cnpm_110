# Tổng quan tiến độ Film Contest

**Mốc rà soát:** 2026-11-25, cập nhật sau khi triển khai Backend Module 01. Các mục rà soát theo commit bên dưới ghi kết quả tại thời điểm tương ứng.

- **Đặc tả:** Có đủ **10 module thiết kế gốc**, cùng Module 11 cho audit, thông báo và báo cáo. OpenAPI ghi **51 cặp method/path đang mount**, gồm alias, và **28 thao tác dự kiến**. [Danh mục API](../ai/09-api-contracts.md#6-danh-mục-endpoint)
- **Sprint 4:** Đã tích hợp FPC-70–75 và sửa các lỗi phát hiện trong FPC-86. Năm route Judging đã được đồng bộ với Swagger/Postman qua FPC-87. [Tracker](sprints.md#sprint-4--chấm-thi) · [Hợp đồng Judging](../ai/09-api-contracts.md#61-hợp-đồng-judging)
- **Nghiệp vụ có ít nhất một luồng nối API hoặc xử lý thật trong mã:** Web **4/8** module, Backend **6/8**, Mobile **4/8**. Mẫu số là module 01–08. Module 09–11 phục vụ các luồng dùng chung.
- **Hoàn tất trọn module theo SRS:** Chưa xác nhận module nào đạt đầy đủ. Các tỷ lệ trên đo độ phủ tối thiểu theo module và không quy đổi thành phần trăm hoàn thành dự án.

## Nghiệm thu Backend Module 01

Migration áp dụng trên PostgreSQL 16 tạm. Khóa tài khoản, logout, đổi/reset mật khẩu và đổi grant quyền đều thu hồi phiên tương ứng. Ca khóa hoặc logout đồng thời với refresh xác nhận phiên bị khóa không thể nhận token còn hiệu lực. Qua 16 ca tích hợp Auth, 24 ca hồi quy Judge/Submission và 39 test API. Các ca Auth dùng bộ gửi email và bộ kiểm tra Twilio Verify giả. Chưa nghiệm thu gửi/nhận OTP thật, chưa nối luồng đăng ký mới trên Web/Mobile. [Sprint 1](sprints.md#sprint-1--nền-tảng-và-xác-thực) · [Hợp đồng Auth](../ai/01-auth-and-rbac.md) · [Cấu hình dịch vụ gửi](../../apps/api/README.md#xác-thực-định-danh-và-khôi-phục-mật-khẩu)

## Thứ tự triển khai

SRS mục 2 và 6 quy định nghiệp vụ. Các chặng dưới đây là thứ tự triển khai đề xuất theo phụ thuộc. Với mỗi chặng, chốt hợp đồng trong Module 09, cập nhật OpenAPI, làm schema và Backend cần thiết, rồi nối Web/Mobile theo vai trò trong SRS. Có thể triển khai theo lát nhỏ và kiểm thử từng luồng trên dữ liệu thật.

| Chặng | Module và phụ thuộc | Nghiệm thu để chuyển chặng |
| --- | --- | --- |
| **1. Phiên, quyền và hạ tầng dùng chung** | 01 + phần cần thiết của 09, 10, 11. Danh mục 02 có thể bắt đầu song song ngay khi xác định quyền Admin và hợp đồng tra cứu. | Backend đã kiểm thử BR-04 và quyền role. Cần nối đăng ký/OTP trên client và xác minh gửi email/SMS thật. Có tải/đọc ảnh theo quyền và ghi vết cho các thao tác nhạy cảm đang triển khai. |
| **2. Mở cuộc thi và chuẩn bị dữ liệu phim** | 03 và nhánh 02 → 04 có thể làm song song. Hoàn thiện chọn hạng mục trên Mobile có thể bắt đầu bằng API danh sách hạng mục đang có. | Organizer lưu bản nháp, hạng mục, giới hạn và năm mốc. Participant đăng ký hợp lệ, bị chặn xung đột lợi ích và chọn đúng hạng mục. Tạo cuộn/frame theo BR-23, đồng bộ Mobile và dùng được frame khi nộp. |
| **3. Nộp bài, AI và đối chứng** | 05 + 06 dựa trên cuộc thi, hạng mục và Logbook ở chặng 2. Có thể sửa lỗi chuyển hạng mục trên Mobile và chuẩn bị luồng đối chứng ngay bằng cuộc thi thử. | Participant nộp, theo dõi, sửa/rút đúng hạn. Organizer kiểm duyệt, xem cờ AI/trùng lặp, yêu cầu và xác minh đối chứng. Hết 48 giờ mà chưa nộp thì tự động loại. Bài AI rủi ro cao chỉ vào chấm sau khi đối chứng hợp lệ và đã gỡ cờ có audit. |
| **4. Mở vòng và chấm ẩn danh** | Phần vòng chấm, tiêu chí, phân công của 03 → 07. Có thể phát triển song song với chặng 3 bằng bài đã duyệt trong fixture. Nghiệm thu xuyên luồng dùng đầu ra chặng 3. | Mỗi hạng mục có đủ giám khảo hoạt động và trọng số 1.0000. Judge chỉ thấy bài được giao, ảnh và DTO ẩn danh, lưu/sửa/khóa phiếu thật. Organizer xem tiến độ, xử lý lệch điểm và đối chiếu điểm chung cuộc. |
| **5. Công bố, triển lãm và báo cáo** | 08 + phần báo cáo/thông báo 11, dùng kết quả chặng 4 và đối chứng hợp lệ từ chặng 3. | Công bố với điểm/giải thật khi đủ điều kiện, kiểm tra khóa dữ liệu sau công bố, hiển thị kết quả/phản hồi và portfolio, xuất bản ảnh có watermark và xuất thống kê đúng cuộc thi. |

**Việc nên bắt đầu ngay** là nối chọn hạng mục thật trên Mobile và chốt hợp đồng đối chứng. Luồng đối chứng cần giải quyết đồng thời ràng buộc trạng thái DB, lưu hạn, upload/xác minh và tự động loại quá hạn. Có thể chạy thử bằng cuộc thi đã có trong môi trường test. Nghiệm thu UC-37 đầy đủ vẫn cần dữ liệu Logbook. [Module 05](../ai/05-submission-and-proof.md)

**Tiêu chí hoàn thành** là kiểm thử UC/BR liên quan trên nền tảng áp dụng, gồm quyền, lỗi và các mốc biên, đồng thời đo yêu cầu phi chức năng trong SRS §5. Với API còn thiếu method/path hoặc DTO, chốt hợp đồng trước khi nối client. Dùng [bảng truy vết](../ai/09-api-contracts.md#7-truy-vết-srs-theo-module) để rà soát phạm vi.

## Độ phủ theo module

`Có luồng` nghĩa là có ít nhất một chức năng phía client gọi route hiện có, hoặc có route/worker thực thi chức năng phía Backend. `Một phần` nghĩa là mới có schema, màn hình mẫu hoặc tích hợp còn thiếu route tương ứng. Ô `—` nghĩa là chưa thấy luồng riêng trên nền tảng đó trong lượt rà soát.

| Module | Web | Backend | Mobile | Khoảng trống chính |
| --- | --- | --- | --- | --- |
| [01 Auth & RBAC](../ai/01-auth-and-rbac.md) | Có luồng · Đăng nhập và phiên | Có luồng · Xác thực email/SMS, OTP và reset, hồ sơ/mật khẩu, quản trị tài khoản và ma trận quyền, thu hồi phiên bằng PostgreSQL | Có luồng · Đăng nhập, lưu phiên, màn sửa hồ sơ/mật khẩu đã có route | Đăng ký Web/Mobile cần số điện thoại và hai bước OTP. SMS đã dùng Twilio Verify (Service SID `VA…`). Cần nghiệm thu SMTP, Verify và URL reset với môi trường thật. |
| [02 Danh mục ảnh phim](../ai/02-analog-master-data.md) | — | — | Một phần · Luồng nộp bài có form thông số chụp (FPC-43) và tráng/scan (FPC-44), dùng giá trị nhập tay hoặc lựa chọn có sẵn trong app | Thiếu màn quản trị Web, bảng danh mục và API tra cứu tập trung cho phim, máy, ống kính và lab theo UC-06–08. |
| [03 Vòng đời cuộc thi](../ai/03-contest-lifecycle.md) | Có luồng · Danh sách, chi tiết, tạo cuộc thi và cập nhật trạng thái | Có luồng · CRUD cuộc thi, đọc hạng mục | Có luồng · Danh sách và chi tiết | Đã kiểm tra tổng trọng số và đủ giám khảo khi mở chấm. Còn thiếu 5 mốc, đăng ký tham gia, cấu hình tiêu chí, vòng chấm và luồng phân công. |
| [04 Sổ tay cuộn phim](../ai/04-film-logbook.md) | — | Một phần · Có schema cuộn phim | Một phần · Có form thông số phim trong luồng nộp | Thiếu quản lý cuộn phim và frame riêng, tích hợp API và đồng bộ offline. |
| [05 Nộp bài & đối chứng](../ai/05-submission-and-proof.md) | Có luồng · Nộp ảnh, hàng đợi, kiểm duyệt | Có luồng · Nộp và liệt kê bài, duyệt/loại. Có nhánh yêu cầu đối chứng trong kiểm duyệt | Có luồng · Danh sách bài và giao diện trạng thái, có màn nộp ảnh và hai form metadata FPC-43/FPC-44 | Mobile thiếu hạng mục khi mở form nộp từ trang chi tiết. Route upload đối chứng và sửa metadata chưa mount. DB chưa chấp nhận trạng thái `PROOF_REQUESTED`. Chưa lưu hạn 48 giờ, xử lý hết hạn tự động hoặc có route rút bài. |
| [06 Thẩm định AI](../ai/06-ai-verification.md) | Có luồng · Gọi API đối sánh bài | Có luồng · Worker, webhook, phân loại và pHash | — | Thiếu quét lại theo yêu cầu, nhánh cosine 92% và cảnh báo lệch hạng mục. Hàng đợi hiện dùng PostgreSQL, trong khi SRS mô tả Redis. |
| [07 Chấm ẩn danh](../ai/07-blind-judging.md) | Một phần · Có Focus Mode, zoom ảnh/metadata và form chấm điểm trên dữ liệu mẫu. Màn phân công, tiến độ và bảng điểm còn dùng dữ liệu mẫu | Có luồng · Phân công, ảnh ẩn danh, nộp và khóa điểm, bảng điểm | Một phần · Hiển thị trạng thái bài vào vòng chấm | Còn nối Web với API và triển khai quy trình điều phối lệch điểm. |
| [08 Kết quả & triển lãm](../ai/08-archive-and-exhibition.md) | Một phần · Triển lãm dùng dữ liệu mẫu | Có luồng · Có route kết quả và portfolio, một số điểm/giải lấy từ mẫu | Có luồng · Gọi API bảng vàng và portfolio | Thiếu công bố kết quả chính thức, dữ liệu điểm/giải từ chấm thi và xuất bản ảnh triển lãm. |
| [09 Hợp đồng API](../ai/09-api-contracts.md) | Có tích hợp một số API chuẩn | Có envelope và danh mục route | Có tích hợp một số API chuẩn | Một số màn hình còn gọi route dự kiến hoặc phụ thuộc DTO khác hợp đồng đích. |
| [10 CSDL & lưu trữ](../ai/10-database-and-storage.md) | Tải multipart qua Backend | Có PostgreSQL/Drizzle và lưu R2 hoặc local | Tải multipart qua Backend | Chưa mount presigned upload/confirm; chưa thấy đầy đủ luồng hai bản ảnh và lưu trữ vector. |
| [11 Audit, thông báo và báo cáo](../ai/11-cross-cutting-services.md) | — | Một phần · Audit tài khoản, log kiểm duyệt và SMTP trong Auth | — | Thiếu API tra audit toàn hệ thống, xuất thống kê cuộc thi và FCM. SMTP chưa nghiệm thu với nhà cung cấp thật. |

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
- **Sprint 4:** FPC-79–81 giữ `REVIEW`. FPC-70–72 vẫn là các phần phụ thuộc để lấy bài phân công, lưu và khóa phiếu chấm thật.

## Rà soát nghiệm thu Backend · 2026-11-23

Đối chiếu SRS, module liên quan, OpenAPI và route Hono tại `6154028`. Cột **Hiện tại** chuyển 9 task từ `DONE` sang `REVIEW`. FPC-29 giữ `DOING`. Các task có tiêu đề hẹp như viết test, kiểm tra định dạng ảnh hoặc triển khai pHash giữ trạng thái theo phạm vi Jira.

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
