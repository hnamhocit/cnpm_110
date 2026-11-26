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
- Hiện có log kiểm duyệt riêng cho bài thi và `account_audit_logs` cho thao tác Module 01. Chưa thấy bảng `audit_logs` dùng chung hoặc route tra cứu hệ thống trong [schema](../../apps/api/src/db/schema.ts) và [đăng ký Hono](../../apps/api/src/index.ts).

## Thông báo · SRS §5.1.2

- SMTP phục vụ email, gồm khôi phục mật khẩu theo UC-02. FCM phục vụ thông báo đẩy. Luồng đối chứng và công bố cần áp dụng các sự kiện từ Module 05 và 08.
- Khi gửi yêu cầu đối chứng, lấy hạn 48 giờ từ dữ liệu đã lưu ở Backend. Khi công bố, lấy kết quả từ dữ liệu đã chốt. Việc gửi lại thông báo không được gia hạn đối chứng hoặc công bố lại.
- Nghiệm thu bằng người nhận hợp lệ, thời hạn hiển thị khớp Backend, kết quả gửi được quan sát khi kênh gửi lỗi hoặc thử lại. Module 01 đã có adapter SMTP và test bằng bộ gửi giả. Cần nghiệm thu SMTP thật và triển khai FCM cho các sự kiện cần thông báo đẩy.

## Báo cáo cuộc thi · UC-28

- Organizer xuất báo cáo của cuộc thi thuộc phạm vi quản lý. Dữ liệu gồm xu hướng phim, máy ảnh, phòng Lab và tỷ lệ cảnh báo AI.
- Nghiệm thu bằng fixture có số liệu kỳ vọng, có bài chưa được phân tích và có dữ liệu ở cuộc thi khác. Kết quả xuất cần thể hiện phạm vi thống kê và mẫu số của tỷ lệ để đối chiếu với dữ liệu nguồn.
- Chưa thấy route xuất báo cáo UC-28 trong Hono. API đối sánh bài của Module 06 phục vụ kiểm duyệt từng bài.

## Quyết định cần chốt trước khi triển khai

Thống nhất cấu trúc sự kiện audit, chính sách lưu và trường cần ẩn, kênh gửi theo sự kiện, và phạm vi/mẫu số/định dạng xuất báo cáo. Sau khi chốt, ghi DTO và quyền truy cập vào [Module 09](09-api-contracts.md), cập nhật OpenAPI và kiểm thử bằng route thực tế. Thứ tự triển khai nằm trong [kế hoạch Sprint 5](../progress/sprints.md#sprint-5--feature-complete).

## Hợp đồng UC-28

`GET /api/v1/contests/{id}/analytics` trả thống kê tổng thể và theo hạng mục cho Organizer sở hữu cuộc thi. `POST` cùng đường dẫn tạo nhận xét AI theo yêu cầu và trả số liệu gốc kèm nhận xét. Nếu dịch vụ AI chưa cấu hình hoặc không trả kết quả hợp lệ, nhận xét để trống và số liệu vẫn khả dụng. Web xuất thống kê và nhận xét hiện có thành JSON.

Dịch vụ tại `AI_ANALYTICS_URL` nhận tổng số bài, số bài được cảnh báo và phân bố trạng thái; mỗi hạng mục dùng chỉ số thứ tự và số đếm. Không truyền UUID, tên, metadata tự do, URL ảnh hoặc thông tin thí sinh. Dịch vụ trả JSON `{ "report": "..." }`.
