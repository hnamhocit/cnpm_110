# Software Requirements Specification (SRS) — CINEGEN

Bản Markdown phục vụ triển khai trong repository. Tài liệu SRS, sơ đồ và mô tả màn hình chi tiết được quản lý tại [Confluence của dự án](https://hnamhocit.atlassian.net/wiki/x/BAAF).

## 1. Product Overview

- Web phục vụ Administrator, Contest Organizer, Judge, Participant và khách tham quan. Mobile phục vụ Participant, gồm sổ tay cuộn phim và theo dõi cuộc thi.
- Năm luồng chính gồm cấu hình cuộc thi, nộp bài và metadata, thẩm định bài thi, chấm điểm và công bố kết quả/kho lưu trữ số.
- AI chạy bất đồng bộ để phát hiện ảnh nghi trùng/tương tự, cảnh báo ảnh tạo sinh, gợi ý hạng mục/từ khóa và hỗ trợ phân tích số liệu cuộc thi. Contest Organizer quyết định duyệt hoặc loại bài.
- PostgreSQL, lưu trữ đối tượng đám mây và email hỗ trợ các luồng nghiệp vụ. Redis, pgvector, Docker và push notification tùy phương án triển khai.

## 2. User Requirements

### 2.1. Vai trò và quyền

| Tác nhân | Phạm vi |
| --- | --- |
| Administrator | Quản trị tài khoản, gán vai trò cố định, danh mục phim và thiết bị, ngưỡng AI và nhật ký kiểm toán. |
| Contest Organizer | Quản lý cuộc thi thuộc quyền, đăng ký, kiểm duyệt, phân công, chốt vòng chấm, công bố, triển lãm và thống kê. |
| Judge | Chấm độc lập và ẩn danh cho hạng mục/vòng được giao. |
| Participant | Tự đăng ký tài khoản, đăng ký hạng mục, quản lý Film Roll/Frame, nộp bài và xem lịch sử/kết quả cá nhân. |
| Public Visitor | Xem nội dung công khai. |

### 2.2. Use Case Catalog

| ID | Use Case | Actors | Mô tả |
| --- | --- | --- | --- |
| UC-01 | Register / Login / Logout | All Actors | Cho phép Participant tự đăng ký bằng email duy nhất và mật khẩu, xác minh email; các vai trò nội bộ do Admin cấp. Đăng nhập nhận JWT và đăng xuất an toàn. |
| UC-02 | Recover Password | All Actors | Cho phép người dùng đặt lại mật khẩu thông qua liên kết xác thực gửi qua email. |
| UC-03 | View & Update Profile | All Actors | Hiển thị và cho phép cập nhật thông tin hồ sơ cá nhân, ảnh đại diện và mật khẩu. |
| UC-04 | Manage User Accounts | Admin | Quản lý vòng đời tài khoản người dùng (tạo mới, xem chi tiết, khóa/mở khóa tài khoản). |
| UC-05 | Manage Roles & Permissions | Admin | Gán một trong bốn vai trò hệ thống cố định và áp dụng quyền RBAC tương ứng; không yêu cầu tạo vai trò hoặc permission động. |
| UC-06 | Manage Film Stock Catalog | Admin | Quản lý danh mục các loại phim chuẩn (Hãng phim, Tên film stock, ISO danh định, Loại phim màu/đen trắng/dương bản). |
| UC-07 | Manage Camera & Lens Catalog | Admin | Quản lý danh mục thiết bị thân máy ảnh phim (Camera Bodies) và ống kính (Lenses). |
| UC-08 | Manage Film Lab Directory | Admin | Quản lý danh sách các phòng Lab tráng và quét phim để chuẩn hóa metadata. |
| UC-09 | Configure AI Thresholds | Admin được kiểm thử; không giao diện tinh chỉnh chuyên sâu. | Quản lý ngưỡng cảnh báo AI và độ tương đồng ảnh theo cấu hình yêu cầu mô hình |
| UC-10 | View System Audit Logs | Admin | Tra cứu lịch sử thao tác nhạy cảm trên toàn hệ thống (Ai làm gì, khi nào, giá trị cũ/mới). |
| UC-11 | Create / Duplicate Contest | Organizer | Tạo cuộc thi mới hoặc sao chép cấu hình cuộc thi thuộc quyền quản lý làm template (hạng mục, tiêu chí, vòng chấm, thể lệ, giải thưởng); không sao chép đăng ký, bài thi, điểm hay kết quả. |
| UC-12 | Update Contest Configuration | Organizer | Chỉnh sửa thông tin cuộc thi, điều chỉnh thời hạn nộp bài hoặc quy định khi cuộc thi chưa đóng. |
| UC-13 | Manage Contest Categories | Organizer | Thêm, sửa, xóa hoặc kích hoạt/vô hiệu hóa các bảng thi/hạng mục (VD: Đường phố 35mm, Chân dung Medium Format). |
| UC-14 | Configure Judging Criteria | Organizer | Thiết lập các tiêu chí chấm điểm và tỷ trọng phần trăm (Weights) cho từng hạng mục thi. |
| UC-15 | Manage Judging Rounds | Organizer | Cấu hình một hoặc nhiều vòng chấm (ví dụ sơ khảo và chung khảo), số bài đi tiếp và thời hạn từng vòng. |
| UC-16 | Assign Judges to Categories | Organizer | Phân công giám khảo phụ trách chấm điểm cho từng hạng mục và vòng thi cụ thể. |
| UC-17 | View Participant Registrations | Organizer | Xem, tìm kiếm và lọc danh sách thí sinh đã đăng ký theo cuộc thi, hạng mục và trạng thái nộp bài. |
| UC-18 | View Submission Queue | Organizer | Xem danh sách toàn bộ tác phẩm dự thi kèm trạng thái kiểm duyệt và nhãn cảnh báo từ AI. |
| UC-19 | Trigger AI Verification Scan | Organizer | Kích hoạt quét AI hàng loạt hoặc từng bài để kiểm tra trùng lặp, phát hiện ảnh AI và tự động gán thẻ. |
| UC-20 | Review AI Flagged Submissions | Organizer | Kiểm tra bài thi bị gắn cờ, đối chiếu ảnh tương tự và điểm rủi ro AI; kết luận do Organizer đưa ra. |
| UC-21 | Request Negative / Contact Sheet Proof | Organizer | Yêu cầu thí sinh bổ sung ảnh âm bản hoặc contact sheet nếu thể lệ yêu cầu hoặc cần xác minh. |
| UC-22 | Verify & Approve Submission | Organizer | Phê duyệt bài thi hợp lệ (đạt chuẩn kỹ thuật và xác thực) để đưa vào danh sách chấm của giám khảo. |
| UC-23 | Disqualify / Reject Submission | Organizer | Loại bỏ bài thi vi phạm quy chế (ảnh số giả phim, ảnh AI, đạo nhái) kèm lý do bắt buộc. |
| UC-24 | Monitor Judging Progress | Organizer | Theo dõi số lượng bài được giao, số bài đã chấm và trạng thái xác nhận điểm của từng giám khảo theo vòng. |
| UC-25 | Finalize Judging Round | Organizer | Khóa vòng chấm sau khi hoàn tất đánh giá; tổng hợp điểm và chọn bài đủ điều kiện vào vòng tiếp theo theo cấu hình. |
| UC-26 | Approve & Publish Results | Organizer | Chốt bảng xếp hạng cuối cùng, gán giải thưởng và công bố kết quả chính thức của cuộc thi. |
| UC-27 | Manage Digital Archive & Exhibition | Organizer | Chọn lọc các tác phẩm đạt giải và xuất sắc đưa vào Kho lưu trữ số và phòng triển lãm trực tuyến. |
| UC-28 | Export Contest Analytics Report | Organizer | Xem thống kê cuộc thi, xuất báo cáo và tạo nhận xét phân tích bằng AI từ dữ liệu tổng hợp. |
| UC-29 | View Assigned Submissions | Judge | Xem danh sách các tác phẩm được phân công chấm trong chế độ ẩn danh tác giả (Blind Mode). |
| UC-30 | Inspect High-Res Image & Film Metadata | Judge | Phóng to kiểm tra chi tiết hạt phim (grain), dải sắc độ và xem thông số kỹ thuật chụp/tráng/scan của bức ảnh. |
| UC-31 | Score & Comment on Submission | Judge | Chấm điểm theo từng tiêu chí thành phần trên thanh trượt và nhập nhận xét chuyên môn cho tác phẩm. |
| UC-32 | Update Evaluation Score | Judge | Chỉnh sửa lại điểm số và nhận xét của các bài đã chấm khi vòng chấm chưa bị khóa. |
| UC-33 | Lock & Confirm Final Evaluations | Judge | Xác nhận hoàn tất và khóa bảng điểm cá nhân cho vòng thi được giao. |
| UC-34 | Browse & Register for Contests | Participant | Tìm kiếm cuộc thi đang mở, xem thể lệ chi tiết và đăng ký tham gia hạng mục. |
| UC-35 | Manage Film Roll Log | Participant | Tạo và quản lý nhật ký các cuộn phim cá nhân (Tên phim, khổ phim, ISO, máy sử dụng, ngày lắp phim, lab tráng). |
| UC-36 | Manage Frame Metadata | Participant | Ghi chép thông số từng khung hình: số frame, ống kính, địa điểm và thông số phơi sáng nếu có. |
| UC-37 | Submit Film Photograph | Participant | Nộp bài dự thi (Tải ảnh scan + Liên kết hoặc nhập thông số kỹ thuật phim/máy/lab + Tuyên ngôn tác phẩm). |
| UC-38 | Upload Negative / Contact Sheet Proof | Participant | Tải ảnh chụp dải phim âm bản hoặc contact sheet để hỗ trợ đối chiếu tác phẩm. |
| UC-39 | Edit / Withdraw Submission | Participant | Cập nhật thông tin hoặc rút lại bài dự thi khi vẫn còn trong thời hạn nhận bài. |
| UC-40 | Track Submission Status | Participant | Theo dõi trạng thái bài thi và cập nhật khi mở hoặc làm mới trang. |
| UC-41 | View Contest Results & Judge Feedback | Participant | Xem kết quả chung cuộc, điểm số trung bình và nhận xét từ hội đồng giám khảo cho bài thi của mình. |
| UC-42 | Manage Personal Film Portfolio | Participant | Xem portfolio cá nhân được tổng hợp từ lịch sử tác phẩm đã nộp và kết quả cuộc thi. |
| UC-43 | Explore Digital Archive & Gallery | All Actors | Tham quan kho lưu trữ tác phẩm đạt giải, lọc tác phẩm theo loại phim (VD: Kodak Portra, Ilford HP5), máy ảnh hoặc năm thi. |

### 2.3. Phân cấp yêu cầu và truy vết chức năng

| Cấp | Vai trò trong đặc tả |
| --- | --- |
| Project Proposal | Xác lập phạm vi và mục tiêu ban đầu, gồm 4 vai trò hệ thống, 5 luồng nghiệp vụ cốt lõi, 4 ứng dụng AI và 4 nhóm yêu cầu phi chức năng cấp cao. |
| Core Business Flows (CF) | 5 quy trình nghiệp vụ chính, ánh xạ tại §3.1. |
| High-level Functional Requirements (FR) | 10 nhóm yêu cầu chức năng cấp cao được tổng hợp từ phân tích phạm vi và SRS. |
| Use Cases (UC) | 43 đặc tả chi tiết về tác nhân, hành vi và kết quả, liệt kê tại §2.2. |
| Implementation Modules (M) | 11 module nghiệp vụ và kỹ thuật tổ chức triển khai, liệt kê tại §4. |
| Business Rules (BR) | Điều kiện và giới hạn nghiệp vụ áp dụng cho các UC, liệt kê tại §6.1. |
| Non-Functional Requirements (NFR) | Yêu cầu chất lượng và kỹ thuật. Bốn nhóm cấp cao thuộc phạm vi đề xuất, được cụ thể hóa trong SRS §5. |

Proposal chưa đánh số 10 FR. Các mã FR dưới đây dùng để truy vết và tổng hợp nghiệm thu trong phạm vi đã có. Bốn vai trò có phân quyền là Administrator, Contest Organizer, Judge và Participant. Public Visitor là tác nhân truy cập công khai. Bốn ứng dụng AI gồm phát hiện ảnh trùng/tương tự, cảnh báo ảnh tạo sinh, gợi ý từ khóa/hạng mục và phân tích số liệu cuộc thi.

#### Ma trận FR → Use Case chính

| FR ID | Functional Requirement | Related Use Cases |
| --- | --- | --- |
| FR-01 | Authentication & Access Control | UC-01–05 |
| FR-02 | System Administration & Master Data | UC-06–10 |
| FR-03 | Contest Planning & Configuration | UC-11–15 |
| FR-04 | Judge Assignment & Participant Registration | UC-16, UC-17, UC-34 |
| FR-05 | Film Roll & Frame Management | UC-35–36 |
| FR-06 | Film Submission & Tracking | UC-37–40 |
| FR-07 | Submission Verification & Moderation | UC-18, UC-21–23 |
| FR-08 | AI-assisted Verification & Analytics | UC-19, UC-20, UC-28 |
| FR-09 | Judging & Evaluation Management | UC-24, UC-25, UC-29–33 |
| FR-10 | Result Publication & Digital Archive | UC-26, UC-27, UC-41–43 |

Mỗi UC có đúng một FR chính khi tính tiến độ. UC-09 (cấu hình ngưỡng AI) thuộc FR-02 và hỗ trợ FR-08. UC-28 (báo cáo phân tích) thuộc FR-08 và hỗ trợ nhiều luồng, gồm công bố kết quả. Liên kết phụ chỉ dùng để truy vết phụ thuộc. Mã module chỉ nơi triển khai; FR và module có thể ánh xạ nhiều-nhiều.

Một FR là DONE khi mọi UC chính có Overall DONE. PARTIAL áp dụng khi đã có UC DONE hoặc PARTIAL nhưng nhóm chưa hoàn tất. TODO áp dụng khi mọi UC chính là TODO. Độ phủ Backend và nghiệm thu toàn luồng được tổng hợp riêng từ bảng Use Case. Tỷ lệ FR hoặc UC là tỷ lệ theo số mục, không quy đổi thành phần trăm khối lượng kỹ thuật.

## 3. System Functional Architecture & Screen Flows

- **Tài khoản và quản trị** (UC-01–10). Participant tự đăng ký bằng email duy nhất và xác minh email. Administrator tạo hoặc gán vai trò nội bộ, khóa/mở khóa tài khoản và quản lý Film Stock, Camera, Lens, Film Lab, ngưỡng AI và AuditLog.
- **Cấu hình và đăng ký** (UC-11–17, UC-34). Organizer cấu hình năm mốc BR-08, thể lệ, hạng mục, số bài, đối chứng, tiêu chí, vòng chấm và giải. Sao chép cấu hình thuộc quyền tạo cuộc thi DRAFT với lịch mới. Đăng ký yêu cầu hạng mục hợp lệ, chấp nhận thể lệ, đúng thời gian, không trùng và không xung đột vai trò. Organizer tìm kiếm và lọc đăng ký theo hạng mục/trạng thái nộp.
- **Vòng đời**. DRAFT → SCHEDULED → OPEN → VERIFYING → IN_JUDGING → RESULTS_PUBLISHED → ARCHIVED. Cuộc thi đã đến mốc mở có thể chuyển từ DRAFT sang OPEN khi xuất bản.
- **Logbook và nộp bài** (UC-35–40). Liên kết đăng ký với cuộn và frame thuộc quyền, giữ metadata BR-22, kiểm tra BR-05/06/07/08/23/24. Thay đổi ảnh đưa bài về kiểm duyệt. Theo dõi qua tải hoặc làm mới dữ liệu.
- **Thẩm định** (UC-18–23, UC-38). Organizer xem điểm AI, điểm tương đồng, ảnh khớp theo quyền, thẻ gợi ý và ảnh bài thi/bằng chứng cạnh nhau. Organizer đặt hạn bổ sung và xử lý thủ công khi quá hạn. Bài cần đối chứng phải được xác minh theo BR-06.
- **Chấm ẩn danh** (UC-14–16, UC-24–25, UC-29–33). Dùng trình xem ảnh có zoom và metadata kỹ thuật. Tổng hợp điểm đã xác nhận, khóa vòng và chọn bài đi tiếp theo cấu hình. Kết quả dùng điểm vòng cuối; xử lý đồng điểm theo thể lệ và lưu lý do.
- **Kết quả và phân tích** (UC-26–28, UC-41–43). Công bố khi đã chốt điểm và hoàn tất điều kiện đối chứng. Lưu riêng ảnh gốc và công khai ảnh xem trước tối ưu. Portfolio tổng hợp từ lịch sử bài thi và kết quả. Báo cáo cơ bản lấy số liệu tổng hợp từ cơ sở dữ liệu, có thể xuất và vẫn truy cập khi AI lỗi. AI chỉ nhận số liệu tổng hợp không chứa thông tin định danh.

### 3.1. Truy vết luồng nghiệp vụ cốt lõi

| Flow ID | Core Business Flow | FR chính |
| --- | --- | --- |
| CF-01 | Contest Planning and Configuration | FR-03, FR-04 |
| CF-02 | Film Submission and Metadata Management | FR-05, FR-06 |
| CF-03 | Submission Verification | FR-07, FR-08 |
| CF-04 | Judging and Evaluation Management | FR-09 |
| CF-05 | Result Publication and Digital Archive | FR-10 |

FR-01 và FR-02 hỗ trợ xuyên suốt các luồng. AI Analytics thuộc FR-08 và hỗ trợ nhiều luồng, gồm báo cáo ở CF-05. UC-28 chỉ được tính một lần trong FR-08.

## 4. Module Specifications Mapping (Chỉ mục Ánh xạ Module Chi tiết)

Các module dưới đây mô tả thiết kế kỹ thuật. Khi có khác biệt về nghiệp vụ, áp dụng BR và UC trong SRS. Xem [danh mục endpoint](ai/09-api-contracts.md#6-danh-mục-endpoint) để kiểm tra trạng thái triển khai.

1.  [`docs/ai/01-auth-and-rbac.md`](ai/01-auth-and-rbac.md): Quản lý Định danh, Phân quyền RBAC, Phiên làm việc JWT & Quản trị Người dùng.
2.  [`docs/ai/02-analog-master-data.md`](ai/02-analog-master-data.md): Quản lý Danh mục Dữ liệu dùng chung Nhiếp ảnh Phim (Film Stocks, Cameras, Lenses, Labs).
3.  [`docs/ai/03-contest-lifecycle.md`](ai/03-contest-lifecycle.md): Vòng đời Cuộc thi, Hạng mục, Bộ tiêu chí Chấm điểm & Cơ cấu Giải thưởng.
4.  [`docs/ai/04-film-logbook.md`](ai/04-film-logbook.md): Sổ tay Quản lý Cuộn phim (Film Rolls) & Siêu dữ liệu Khung hình (Frame Logging).
5.  [`docs/ai/05-submission-and-proof.md`](ai/05-submission-and-proof.md): Quy trình Nộp bài thi, Đối chứng Bằng chứng Âm bản & Kiểm duyệt Ban tổ chức.
6.  [`docs/ai/06-ai-verification.md`](ai/06-ai-verification.md): Thẩm định Trí tuệ Nhân tạo (Phát hiện Trùng lặp pHash, Xác suất Ảnh AI tạo sinh & Gán thẻ).
7.  [`docs/ai/07-blind-judging.md`](ai/07-blind-judging.md): Không gian Chấm thi Ẩn danh kép (Double-Blind), Chấm điểm Tiêu chí & Chốt và chuyển vòng chấm.
8.  [`docs/ai/08-archive-and-exhibition.md`](ai/08-archive-and-exhibition.md): Kho Lưu trữ Di sản Số, Bảo vệ Tác quyền, Ảnh xem trước công khai & Phòng Triển lãm.
9.  [`docs/ai/09-api-contracts.md`](ai/09-api-contracts.md): Chuẩn hóa Data Transfer Objects (DTO) và Hợp đồng API dùng chung đa nền tảng.
10. [`docs/ai/10-database-and-storage.md`](ai/10-database-and-storage.md): Lược đồ PostgreSQL, Lưu trữ dữ liệu AI & Quản lý Tệp Lưu trữ Đám mây S3/R2.
11. [`docs/ai/11-cross-cutting-services.md`](ai/11-cross-cutting-services.md): Đặc tả bổ sung cho Nhật ký Kiểm toán, Thông báo và Báo cáo (UC-10, UC-28, CR-04, §5).

---

## 5. Non-Functional Requirements

- Kiến trúc modular và AI worker bất đồng bộ. Tài liệu hóa REST API bằng OpenAPI. Email và thông báo trong ứng dụng phục vụ các sự kiện nghiệp vụ.
- JWT access/refresh token, RBAC, kiểm tra quyền tài nguyên, DTO Judge ẩn danh. Ảnh gốc và bằng chứng lưu riêng tư, dùng liên kết có thời hạn.
- Transaction, kiểm soát ghi đồng thời, xử lý lỗi, phục hồi tác vụ AI và audit. Hỗ trợ nhiều cuộc thi và nhiều giám khảo thao tác song song.
- API nghiệp vụ thông thường có mục tiêu dưới 500 ms trong điều kiện kiểm thử được ghi nhận, ngoài thao tác tải ảnh và xử lý AI.

## 6. Requirement Appendix

### 6.1. Business Rules

| ID | Quy tắc |
| --- | --- |
| BR-01 | Mỗi người dùng có tài khoản định danh bằng email duy nhất đã xác minh. Số điện thoại tùy chọn, không yêu cầu SMS OTP. |
| BR-02 | Người dùng chỉ được phép truy cập các màn hình, menu và API tương ứng với Role và Permission đã được cấp phát. |
| BR-03 | Dữ liệu quan trọng (Cuộc thi, Bài dự thi, Danh mục Film Stock, Lịch sử chấm điểm) không bao giờ bị xóa vật lý khỏi cơ sở dữ liệu mà chỉ chuyển trạng thái sang Inactive hoặc Archived (Soft Delete). |
| BR-04 | Tất cả vai trò dùng JWT. Tài khoản bị khóa không được truy cập API bảo vệ; không yêu cầu quản lý giới hạn thiết bị. |
| BR-05 | Trong cùng một cuộc thi, một thí sinh không được phép nộp hai tác phẩm có trùng đồng thời cả Mã cuộn phim (FilmRollId) và Số thứ tự khung hình (FrameNumber). |
| BR-06 | Negative Proof hoặc Contact Sheet là tùy chọn, trừ khi thể lệ cuộc thi hoặc Organizer yêu cầu. Bài có yêu cầu bằng chứng phải được Organizer xác minh trước khi duyệt hoặc công bố giải theo thể lệ. |
| BR-07 | Tệp ảnh dự thi hỗ trợ JPG/JPEG; TIFF tùy chọn. Giới hạn mặc định 25 MB và cạnh ngắn tối thiểu 2000 px, áp dụng theo cấu hình thể lệ. Không chấp nhận dấu hiệu định danh tác giả nếu cuộc thi chấm ẩn danh. |
| BR-08 | Mốc thời gian của cuộc thi phải tuân thủ nghiêm ngặt thứ tự: Registration Start < Submission Deadline < Judging Start < Judging End < Result Publication. Khi quá Submission Deadline, hệ thống tự động khóa mọi thao tác nộp mới hoặc chỉnh sửa bài thi. |
| BR-09 | Mô-đun phát hiện ảnh AI gắn cờ AI_FLAGGED khi điểm nghi vấn vượt ngưỡng đã cấu hình và kiểm thử. Organizer xem xét thủ công trước khi duyệt hoặc loại; AI không tự kết luận nguồn gốc ảnh. |
| BR-10 | pHash và/hoặc độ tương đồng vector được dùng để gắn cờ ảnh nghi trùng khi vượt ngưỡng đã cấu hình và kiểm thử. Lưu liên kết ảnh nghi trùng để Organizer đối chiếu theo quyền. |
| BR-11 | AI gợi ý tối đa 5 từ khóa và hạng mục phù hợp. Organizer có thể điều chỉnh; không tự động loại bài vì sai hạng mục. |
| BR-12 | Blind Judging: Trong giai đoạn chấm, API và giao diện dành cho Judge không cung cấp tên, email, ảnh đại diện, ID tài khoản hay dữ liệu nhận dạng thí sinh. |
| BR-13 | Tính độc lập của Giám khảo: Một giám khảo không được phép xem điểm số hoặc nhận xét của các giám khảo khác đối với cùng một tác phẩm cho đến khi vòng chấm chính thức khép lại. |
| BR-14 | Khóa vòng chấm: Chỉ khóa khi tất cả đánh giá bắt buộc của vòng đã được xác nhận. Organizer chọn bài đi tiếp theo thứ hạng và số lượng cấu hình; không yêu cầu quy trình phúc khảo độ lệch điểm. |
| BR-15 | Tổng trọng số (Weights) của tất cả các tiêu chí chấm điểm trong một hạng mục bắt buộc phải bằng đúng 100% (1.0). Điểm của một giám khảo cho bài thi được tính bằng tổng tích số giữa điểm từng tiêu chí và trọng số tương ứng. |
| BR-16 | Tính bất biến của kết quả: Khi cuộc thi chuyển RESULTS_PUBLISHED, điểm, thứ hạng và giải thưởng chính thức được khóa; không cho sửa qua quy trình thông thường. |
| BR-17 | Mọi tác phẩm đưa vào Kho lưu trữ số (Digital Archive) phải được lưu thành 2 bản: Bản gốc độ phân giải cao lưu ở vùng bảo mật (Private Bucket) và Bản hiển thị công khai đã được nén tối ưu kèm thông tin bản quyền cuộc thi. |
| BR-18 | Mọi quyết định loại bài hoặc gỡ cờ AI phải nhập lý do và ghi AuditLog. |
| BR-19 | Organizer quy định thời hạn bổ sung bằng chứng; nếu quá hạn, Organizer xem xét và quyết định thủ công theo thể lệ, không tự động loại. |
| BR-20 | Mỗi hạng mục/vòng chấm phải có ít nhất một giám khảo được phân công và hoạt động; Organizer cấu hình số lượng phù hợp. |
| BR-21 | Xung đột lợi ích (Conflict of Interest): Một người dùng đã được gán vai trò Judge hoặc Organizer trong một cuộc thi thì bị hệ thống chặn không cho phép đăng ký làm Participant (nộp bài thi) trong chính cuộc thi đó. |
| BR-22 | Bài thi khai báo Film Stock, Film Format, ISO, Camera Body, Lens, Frame Number, Developing Lab hoặc Home Development, thông số scan và địa điểm chụp. Cho phép giá trị không rõ/không áp dụng đối với Lens, thông số scan và địa điểm khi thể lệ cho phép. Bài thi liên kết một Film Roll và Frame. |
| BR-23 | Frame Number là số nguyên dương, duy nhất trong cùng Film Roll; không áp đặt giới hạn vật lý cố định theo khổ phim. |
| BR-24 | Thí sinh chỉ được phép chỉnh sửa thông số hoặc rút bài dự thi khi cuộc thi vẫn đang trong thời hạn nhận bài (Current Time < Submission Deadline) và bài thi chưa chuyển sang trạng thái đang chấm. |
| BR-25 | Điểm mỗi vòng là trung bình cộng điểm có trọng số của các giám khảo được phân công chấm bài ở vòng đó; kết quả cuối dùng điểm vòng cuối, làm tròn 2 chữ số thập phân. Nếu đồng điểm, Organizer xác nhận thứ hạng theo thể lệ và ghi lý do. |

### 6.2. Common Requirements

| ID | Requirement | Mô tả |
| --- | --- | --- |
| CR-01 | Data Validation | Toàn bộ các trường bắt buộc (đánh dấu *) trên biểu mẫu Web và Mobile phải được kiểm tra hợp lệ ở cả Client-side và Server-side trước khi xử lý. |
| CR-02 | Data Format Validation | Chuẩn hóa email; số điện thoại nếu có phải hợp lệ; lưu thời gian nhất quán và hiển thị theo múi giờ cuộc thi. Mã tự sinh CON-YYYY-XX, SUB-YYYY-XXXX. |
| CR-03 | Authorization & Blind Guard | API và route được bảo vệ phải kiểm tra JWT, RBAC và quyền trên tài nguyên; loại bỏ dữ liệu định danh trong luồng Judge. Đăng ký, đăng nhập, quên mật khẩu và nội dung công khai không yêu cầu JWT. |
| CR-04 | Audit Logging | Mọi thao tác Tạo, Cập nhật, Duyệt, Loại bài, Chốt giải trên các thực thể cốt lõi (Contest, Submission, AIVerificationLog, JudgeEvaluation, Award) đều phải lưu vết vào bảng AuditLog (User ID, Timestamp, Action, Old Value, New Value, Reason). |
| CR-05 | Unique Code Generation | Hệ thống tự động sinh mã định danh duy nhất, dễ đọc cho Cuộc thi (CON-...), Bài dự thi (SUB-...), và Cuộn phim (ROLL-...). |
| CR-06 | Error Handling | Hiển thị thông báo lỗi thân thiện, rõ ràng cho người dùng theo danh mục mã thông báo chuẩn, tuyệt đối không trả raw stack trace ra giao diện. |
| CR-07 | Concurrency Control | Sử dụng cơ chế khóa lạc quan (Optimistic Locking / Versioning) khi nhiều Ban tổ chức cùng duyệt một bài thi hoặc khi tính toán tổng hợp bảng xếp hạng. |

### 6.3. Application Messages

| Mã | Loại | Ngữ cảnh | Nội dung |
| --- | --- | --- | --- |
| MSG001 | Inline | Search Empty | Không tìm thấy kết quả phù hợp. / No matching records found. |
| MSG002 | Inline (Red) | Form Validation | Trường {field_name} là bắt buộc. / The {field_name} field is required. |
| MSG003 | Toast (Success) | Auth | Đăng nhập thành công. Chào mừng {username}! |
| MSG004 | Inline (Red) | Auth | Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại. |
| MSG005 | Toast (Error) | Permission | Bạn không có quyền thực hiện thao tác này. / Access denied. |
| MSG006 | Toast (Success) | Contest Setup | Khởi tạo cuộc thi "{contest_name}" thành công. |
| MSG007 | Inline (Red) | Criteria Validation | Tổng tỷ trọng các tiêu chí chấm điểm phải bằng đúng 100% (Hiện tại: {current_weight}%). |
| MSG008 | Inline (Red) | Timeline Validation | Thời hạn nộp bài phải diễn ra trước thời gian bắt đầu chấm thi. |
| MSG009 | Toast (Success) | Film Roll Log | Đã lưu thông tin cuộn phim "{roll_code}" vào sổ tay cá nhân. |
| MSG010 | Inline (Red) | Frame Validation | Số thứ tự khung hình phải là số nguyên dương và chưa tồn tại trong cuộn phim. |
| MSG011 | Toast (Error) | File Upload | Tệp ảnh không đáp ứng giới hạn dung lượng, độ phân giải hoặc định dạng của cuộc thi. |
| MSG012 | Toast (Error) | Duplicate Frame | Khung hình số {frame_no} thuộc cuộn phim này đã được nộp trong cuộc thi. |
| MSG013 | Toast (Error) | Submission Limit | Bạn đã đạt giới hạn tối đa {max_entries} bài dự thi cho hạng mục này. |
| MSG014 | Toast (Error) | Deadline Passed | Cổng nhận bài cho cuộc thi này đã chính thức đóng. |
| MSG015 | Toast (Success) | Submission | Nộp tác phẩm thành công! Mã bài dự thi của bạn là {submission_code}. |
| MSG016 | Toast (Warning) | AI Verification | Cảnh báo AI: Bài thi có điểm nghi vấn {ai_prob}% và cần Ban tổ chức xem xét. |
| MSG017 | Toast (Warning) | AI Similarity | Cảnh báo trùng lặp: Tác phẩm có độ tương đồng {similarity}% với bài dự thi {target_code}. |
| MSG018 | Toast (Info) | Proof Request | Đã gửi yêu cầu bổ sung bằng chứng cho thí sinh (Hạn chót: {proof_deadline}). |
| MSG019 | Toast (Success) | Proof Upload | Tải lên ảnh chụp dải phim âm bản đối chứng thành công. |
| MSG020 | Toast (Success) | Moderation | Đã phê duyệt tác phẩm {submission_code} vào danh sách chấm thi chính thức. |
| MSG021 | Toast (Error) | Moderation | Vui lòng nhập lý do cụ thể trước khi loại (Disqualify) tác phẩm dự thi. |
| MSG022 | Toast (Error) | Conflict of Interest | Không thể phân công giám khảo này vì tài khoản đang có bài dự thi trong cùng cuộc thi. |
| MSG023 | Toast (Success) | Judging | Đã lưu điểm chấm và nhận xét cho tác phẩm {submission_code}. |
| MSG024 | Toast (Warning) | Judging Round Finalization | Chưa thể khóa vòng chấm vì còn đánh giá bắt buộc chưa được xác nhận. |
| MSG025 | Toast (Success) | Judging Lock | Bạn đã xác nhận và khóa bảng điểm thành công cho vòng thi này. |
| MSG026 | Toast (Error) | Publish Validation | Không thể công bố: Tác phẩm {submission_code} còn thiếu xác minh bằng chứng theo thể lệ. |
| MSG027 | Toast (Success) | Result Publish | Công bố kết quả cuộc thi thành công! Toàn bộ bảng điểm đã được khóa bất biến. |
| MSG028 | Toast (Success) | Digital Archive | Đã xuất bản tác phẩm vào Kho lưu trữ số và Phòng triển lãm trực tuyến. |
