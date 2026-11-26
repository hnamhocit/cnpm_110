# Module 11 · Nhật ký kiểm toán, thông báo và báo cáo

## Phạm vi theo SRS hiện hành

**UC-10/28, CR-04.** Ghi AuditLog cho các thay đổi nghiệp vụ, kèm người thực hiện, thời gian, thao tác, dữ liệu cũ/mới và lý do. Email và thông báo trong ứng dụng cho trạng thái bài, yêu cầu đối chứng và kết quả. Push là tùy chọn.

Báo cáo theo cuộc thi/hạng mục chỉ truy cập theo quyền. Dùng truy vấn DB để tổng hợp số liệu, cung cấp xuất báo cáo cơ bản và gửi cho AI tập số liệu tổng hợp không chứa thông tin định danh. Khi AI lỗi, số liệu và xuất báo cáo cơ bản vẫn khả dụng.

## Thiết kế trước lần cập nhật SRS

> Tham chiếu lịch sử để truy vết thiết kế và các hợp đồng cũ. Yêu cầu nghiệp vụ hiện hành nằm trong [SRS](../srs.md) và mục trên.

Module dùng chung cho Auth, cuộc thi, nộp bài, AI, chấm thi và công bố. Phạm vi lấy từ [SRS](../srs.md), gồm UC-10, UC-28, BR-18, CR-04 và yêu cầu SMTP/FCM ở §5.1.2.

## Nhật ký kiểm toán · UC-10, BR-18, CR-04

- Ghi vết các thao tác tạo, sửa, duyệt, loại và chốt điểm trên thực thể nhạy cảm. Bản ghi tra cứu gồm người thực hiện, IP, hành động, đối tượng, thời điểm, giá trị trước/sau và lý do khi áp dụng.
- Yêu cầu lý do cụ thể khi loại bài, gỡ cờ AI hoặc chỉnh điểm. Nghiệm thu cả trường hợp thiếu lý do và trường hợp thao tác thành công. Chỉ ghi sự kiện thành công khi thay đổi tương ứng được lưu. Ẩn mật khẩu, token và bí mật cấu hình khỏi dữ liệu trước/sau.
- Admin tra cứu nhật ký toàn hệ thống từ SCR-ADM-09. Kiểm tra API từ chối các vai trò khác và bộ lọc trả đúng bản ghi với đúng lý do.
- `audit_logs` lưu `actor_id`, `resource_type`, `resource_id`, `action`, `old_value`, `new_value`, `reason`, `created_at`. Trigger theo dõi Contest, Category, Criteria, JudgingRound, Submission, ModerationLog, AIVerificationLog, JudgeEvaluation, EvaluationScore, ContestPublication và ExhibitionImage. Dữ liệu giải nằm trong snapshot `contest_publications.entries` và cấu hình `contests.awards`.
- Middleware xác thực đặt actor bằng transaction-local PostgreSQL setting trong transaction của request. ORM dùng cùng transaction qua AsyncLocalStorage. Request lỗi rollback cả nghiệp vụ, audit và thông báo. Worker/webhook hệ thống có actor null; không giả danh người dùng. Các service giữ transaction/savepoint hiện có.
- Hàm `audit_safe_json` loại khóa password, token, secret, credential, authorization và API key đệ quy trước khi lưu old/new. Quyền đọc HTTP AuditLog thực hiện tại UC-10/FPC-125; FPC-132 không mở route đọc audit công khai.

## Thông báo · SRS §5.1.2

- SMTP phục vụ email xác thực/khôi phục mật khẩu và sự kiện nghiệp vụ. Push là tùy chọn theo SRS hiện hành.
- Khi gửi yêu cầu đối chứng, dùng loại proof và hạn do Organizer đặt đã lưu ở Backend (BR-19). Khi công bố, dùng sự kiện sau khi snapshot đã được lưu. Việc gửi lại không gia hạn đối chứng hoặc công bố lại.
- `contest_notifications` là thông báo trong ứng dụng, giới hạn theo `recipient_id` khi đọc. Sự kiện `PROOF_REQUESTED` chứa submissionId, proofType, proofDeadlineAt, reason. `SUBMISSION_STATUS` chứa submissionId, status, reason. `RESULTS_PUBLISHED` chứa contestId và gửi cho các Participant trong snapshot vòng cuối.
- Trigger tạo một `notification_emails` cho mỗi notification trong cùng transaction. Cột `notification_id` unique, `status` là PENDING/FAILED/SENT, kèm attempts, last_error và sent_at. Chỉ đánh SENT sau khi SMTP trả thành công. Lỗi lưu thông báo cố định không chứa nội dung lỗi provider.
- API xử lý hàng đợi mỗi 30 giây, không chạy hai lượt chồng nhau trong cùng process. Worker khóa bản ghi bằng FOR UPDATE SKIP LOCKED để nhiều process không gửi đồng thời cùng một bản ghi. Lệnh `bun --filter api notifications:deliver` xử lý thủ công/retry PENDING và FAILED. SENT không gửi lại. Retry không tạo thêm notification nghiệp vụ.
- SMTP và PostgreSQL không có transaction chung. Nếu SMTP đã nhận thư nhưng process dừng trước khi lưu SENT, retry có thể gửi email lại. Thông báo trong ứng dụng vẫn duy nhất theo sự kiện đã lưu. Không tuyên bố exactly-once cho email.

## Báo cáo cuộc thi · UC-28

- Organizer xuất báo cáo của cuộc thi thuộc phạm vi quản lý. Dữ liệu gồm xu hướng phim, máy ảnh, phòng Lab và tỷ lệ cảnh báo AI.
- Nghiệm thu bằng fixture có số liệu kỳ vọng, có bài chưa được phân tích và có dữ liệu ở cuộc thi khác. Kết quả xuất cần thể hiện phạm vi thống kê và mẫu số của tỷ lệ để đối chiếu với dữ liệu nguồn.
- Chưa thấy route xuất báo cáo UC-28 trong Hono. API đối sánh bài của Module 06 phục vụ kiểm duyệt từng bài.

## Quyết định cần chốt trước khi triển khai

Chính sách thời hạn lưu audit và hợp đồng tra cứu UC-10 do module owner xác định. Hợp đồng xác nhận thứ hạng khi đồng điểm tại ranh giới đi tiếp thuộc UC-25. Mọi thay đổi method/path/DTO phải cập nhật Module 09 và OpenAPI theo SRS.

## Hợp đồng UC-28

`GET /api/v1/contests/{id}/analytics` trả thống kê tổng thể và theo hạng mục cho Organizer sở hữu cuộc thi. `POST` cùng đường dẫn tạo nhận xét AI theo yêu cầu và trả số liệu gốc kèm nhận xét. Nếu dịch vụ AI chưa cấu hình hoặc không trả kết quả hợp lệ, nhận xét để trống và số liệu vẫn khả dụng. Web xuất thống kê và nhận xét hiện có thành JSON.

Dịch vụ tại `AI_ANALYTICS_URL` nhận tổng số bài, số bài được cảnh báo và phân bố trạng thái; mỗi hạng mục dùng chỉ số thứ tự và số đếm. Không truyền UUID, tên, metadata tự do, URL ảnh hoặc thông tin thí sinh. Dịch vụ trả JSON `{ "report": "..." }`.
