# Tổng quan tiến độ Film Contest

**Mốc rà soát:** 2026-11-23, mã nguồn trên `develop` tại `ba35117`. Bảng dựa trên route, lớp dữ liệu, màn hình và commit hiện có. Các luồng chưa được chạy đầu cuối trong lần rà soát này.

- **Đặc tả:** Có đủ **10/10** tài liệu module. OpenAPI và Postman có **33 cặp method/path đang mount**, gồm các alias, và **36 endpoint dự kiến**. [Danh mục API](../ai/09-api-contracts.md#6-danh-mục-endpoint)
- **Nghiệp vụ có ít nhất một luồng nối API hoặc xử lý thật trong mã:** Web **4/8** module, Backend **5/8**, Mobile **4/8**. Mẫu số là module 01–08. Module 09–10 được đánh giá riêng vì dùng chung cho nhiều luồng.
- **Hoàn tất trọn module theo SRS:** Chưa xác nhận module nào đạt đầy đủ. Các tỷ lệ trên đo độ phủ tối thiểu theo module và không quy đổi thành phần trăm hoàn thành dự án.
- **Việc của @hnamhocit đã phục dựng:** **8 DONE, 1 REVIEW** theo phạm vi mỗi task. Đây là số liệu của [bảng công việc](tasks.md), dùng commit trực tiếp làm bằng chứng và không tính PR chỉ do bạn merge.

## Độ phủ theo module

`Có luồng` nghĩa là có ít nhất một chức năng đầu cuối phía client gọi route hiện có, hoặc có route/worker thực thi chức năng phía Backend. `Một phần` nghĩa là mới có schema, màn hình mẫu hoặc tích hợp còn thiếu route tương ứng. Ô `—` nghĩa là chưa thấy luồng riêng trên nền tảng đó trong lượt rà soát.

| Module | Web | Backend | Mobile | Khoảng trống chính |
| --- | --- | --- | --- | --- |
| [01 Auth & RBAC](../ai/01-auth-and-rbac.md) | Có luồng · Đăng nhập, đăng ký, phiên | Có luồng · JWT, refresh, logout, hồ sơ hiện tại | Có luồng · Đăng nhập, đăng ký, lưu phiên | Thiếu route khôi phục mật khẩu, chỉnh hồ sơ/mật khẩu và quản trị tài khoản. Mobile có màn hình gọi một số route chưa mount. |
| [02 Danh mục ảnh phim](../ai/02-analog-master-data.md) | — | — | — | Chưa thấy luồng CRUD hoặc tra cứu danh mục phim, máy, ống kính và lab tập trung. |
| [03 Vòng đời cuộc thi](../ai/03-contest-lifecycle.md) | Có luồng · Danh sách, chi tiết, tạo cuộc thi và cập nhật trạng thái | Có luồng · CRUD cuộc thi, đọc hạng mục | Có luồng · Danh sách và chi tiết | Chưa đủ 5 mốc, đăng ký tham gia, cấu hình tiêu chí, phân công giám khảo và kiểm tra đủ số giám khảo. |
| [04 Sổ tay cuộn phim](../ai/04-film-logbook.md) | — | Một phần · Có schema cuộn phim | Một phần · Có form thông số phim trong luồng nộp | Thiếu quản lý cuộn phim và frame riêng, tích hợp API và đồng bộ offline. |
| [05 Nộp bài & đối chứng](../ai/05-submission-and-proof.md) | Có luồng · Nộp ảnh, hàng đợi, kiểm duyệt | Có luồng · Nộp và liệt kê bài, duyệt/loại và yêu cầu đối chứng qua kiểm duyệt | Có luồng · Nộp ảnh, danh sách bài, giao diện trạng thái | Mobile gọi route upload đối chứng và sửa metadata chưa mount. Chưa xác nhận hết hạn 48 giờ tự động hoặc rút bài. |
| [06 Thẩm định AI](../ai/06-ai-verification.md) | Có luồng · Gọi API đối sánh bài | Có luồng · Worker, webhook, phân loại và pHash | — | Chưa thấy API quét lại theo yêu cầu và nhánh tương đồng vector 92% trong mã hiện tại. |
| [07 Chấm ẩn danh](../ai/07-blind-judging.md) | Một phần · Màn phân công, tiến độ và bảng điểm dùng dữ liệu mẫu hoặc thiếu API | — | Một phần · Hiển thị trạng thái bài vào vòng chấm | Thiếu workspace chấm ẩn danh nối API, DTO cho Judge, ghi/khóa điểm và điều phối lệch điểm. |
| [08 Kết quả & triển lãm](../ai/08-archive-and-exhibition.md) | Một phần · Triển lãm dùng dữ liệu mẫu | Có luồng · Có route kết quả và portfolio, một số điểm/giải lấy từ mẫu | Có luồng · Gọi API bảng vàng và portfolio | Thiếu công bố kết quả chính thức, dữ liệu điểm/giải từ chấm thi và xuất bản ảnh triển lãm. |
| [09 Hợp đồng API](../ai/09-api-contracts.md) | Có tích hợp một số API chuẩn | Có envelope và danh mục route | Có tích hợp một số API chuẩn | Một số màn hình còn gọi route dự kiến hoặc phụ thuộc DTO khác hợp đồng đích. |
| [10 CSDL & lưu trữ](../ai/10-database-and-storage.md) | Tải multipart qua Backend | Có PostgreSQL/Drizzle và lưu R2 hoặc local | Tải multipart qua Backend | Thiếu contract presigned upload/confirm; chưa thấy đầy đủ luồng hai bản ảnh và lưu trữ vector. |

## Luồng còn thiếu để nối xuyên hệ thống

1. **Đăng ký và nộp bài.** Nối đăng ký cuộc thi, kiểm tra lịch trình 5 mốc, bổ sung route đối chứng và xử lý hết hạn 48 giờ.
2. **Chấm thi.** Nối phân công, danh sách ẩn danh, chấm/khóa điểm, tính điểm và xử lý lệch điểm.
3. **Công bố và triển lãm.** Dùng điểm và giải thật sau khi đủ điều kiện công bố, sau đó nối kho triển lãm Web với ảnh công khai đã xử lý.
4. **Danh mục và logbook.** Nối CRUD danh mục và cuộn phim/frame với luồng nộp bài, giữ mô hình dữ liệu nhất quán giữa các nền tảng.

## Điểm đối chiếu trong mã

- Backend: [đăng ký route](../../apps/api/src/index.ts), [contest](../../apps/api/src/services/contest.service.ts), [submission](../../apps/api/src/routes/submissions.route.ts), [AI worker](../../apps/api/src/ai-worker.ts), [schema](../../apps/api/src/db/schema.ts) và [R2](../../apps/api/src/r2.ts).
- Web: [đăng nhập](../../apps/web/src/components/auth/login-form.tsx), [nộp bài](../../apps/web/src/components/contest/contest-cta-button.tsx), [kiểm duyệt](../../apps/web/src/components/submission/submission-table.tsx), [đối sánh AI](../../apps/web/src/components/submission/image-comparison-modal.tsx), [bảng điểm](../../apps/web/src/app/portal/contests/scoreboard/page.tsx) và [triển lãm](../../apps/web/src/components/archive/archive-client-view.tsx).
- Mobile: [Auth](../../apps/mobile/lib/core/network/auth_service.dart), [cuộc thi và bảng vàng](../../apps/mobile/lib/core/data/contest_repository.dart), [nộp bài](../../apps/mobile/lib/core/data/submission_repository.dart), [portfolio](../../apps/mobile/lib/core/data/portfolio_repository.dart) và [hồ sơ](../../apps/mobile/lib/screens/profile/edit_profile_screen.dart).
