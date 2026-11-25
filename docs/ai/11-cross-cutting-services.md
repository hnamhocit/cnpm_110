# Module 11 · Nhật ký kiểm toán, thông báo và báo cáo

Module dùng chung cho Auth, cuộc thi, nộp bài, AI, chấm thi và công bố. Phạm vi lấy từ [SRS](../srs.md), gồm UC-10, UC-28, BR-18, CR-04 và yêu cầu SMTP/FCM ở §5.1.2.

## Nhật ký kiểm toán · UC-10, BR-18, CR-04

- Ghi vết các thao tác tạo, sửa, duyệt, loại và chốt điểm trên thực thể nhạy cảm. Bản ghi tra cứu gồm người thực hiện, IP, hành động, đối tượng, thời điểm, giá trị trước/sau và lý do khi áp dụng.
- Yêu cầu lý do cụ thể khi loại bài, gỡ cờ AI hoặc chỉnh điểm. Nghiệm thu cả trường hợp thiếu lý do và trường hợp thao tác thành công. Chỉ ghi sự kiện thành công khi thay đổi tương ứng được lưu. Ẩn mật khẩu, token và bí mật cấu hình khỏi dữ liệu trước/sau.
- Admin tra cứu nhật ký toàn hệ thống từ SCR-ADM-09. Kiểm tra API từ chối các vai trò khác và bộ lọc trả đúng bản ghi với đúng lý do.
- Hiện có log kiểm duyệt riêng cho bài thi. Chưa thấy bảng `audit_logs` dùng chung hoặc route tra cứu hệ thống trong [schema](../../apps/api/src/db/schema.ts) và [đăng ký Hono](../../apps/api/src/index.ts).

## Thông báo · SRS §5.1.2

- SMTP phục vụ email, gồm khôi phục mật khẩu theo UC-02. FCM phục vụ thông báo đẩy. Luồng đối chứng và công bố cần áp dụng các sự kiện từ Module 05 và 08.
- Khi gửi yêu cầu đối chứng, lấy hạn 48 giờ từ dữ liệu đã lưu ở Backend. Khi công bố, lấy kết quả từ dữ liệu đã chốt. Việc gửi lại thông báo không được gia hạn đối chứng hoặc công bố lại.
- Nghiệm thu bằng người nhận hợp lệ, thời hạn hiển thị khớp Backend, kết quả gửi được quan sát khi kênh gửi lỗi hoặc thử lại. Chưa xác nhận tích hợp SMTP/FCM chạy xuyên suốt trong repo.

## Báo cáo cuộc thi · UC-28

- Organizer xuất báo cáo của cuộc thi thuộc phạm vi quản lý. Dữ liệu gồm xu hướng phim, máy ảnh, phòng Lab và tỷ lệ cảnh báo AI.
- Nghiệm thu bằng fixture có số liệu kỳ vọng, có bài chưa được phân tích và có dữ liệu ở cuộc thi khác. Kết quả xuất cần thể hiện phạm vi thống kê và mẫu số của tỷ lệ để đối chiếu với dữ liệu nguồn.
- Chưa thấy route xuất báo cáo UC-28 trong Hono. API đối sánh bài của Module 06 phục vụ kiểm duyệt từng bài.

## Quyết định cần chốt trước khi triển khai

Thống nhất cấu trúc sự kiện audit, chính sách lưu và trường cần ẩn, kênh gửi theo sự kiện, và phạm vi/mẫu số/định dạng xuất báo cáo. Sau khi chốt, ghi DTO và quyền truy cập vào [Module 09](09-api-contracts.md), cập nhật OpenAPI và kiểm thử bằng route thực tế. Thứ tự triển khai nằm trong [overview](../progress/overview.md#thứ-tự-triển-khai).
