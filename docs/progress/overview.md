# Dashboard tiến độ CINEGEN

| Chỉ số | Hiện trạng |
| --- | --- |
| Module hoàn thành | **1/11** |
| Module nghiệp vụ hoàn thành | **1/8** |
| Use Case đã nghiệm thu | **5/43** |
| Sprint hiện tại | **Sprint 5 · Chuẩn bị triển khai** |
| Sprint còn lại | **2**, gồm Sprint 5 và Sprint 6 |

Project Lead xác nhận **M01 DONE**, gồm UC-01–05. Sprint 5 được lấy làm mốc kế tiếp sau Sprint 4. Ngày bắt đầu và người phụ trách vẫn chờ Project Lead chốt.

[Use Cases](use-cases.md) · [Tổng kết Sprint 4 và kế hoạch Sprint 5–6](sprints.md#tổng-kết-cuối-sprint-4) · [SRS](../srs.md) · <a id="review-fpc-86"></a>[Bằng chứng kỹ thuật](technical-evidence.md) ([Review FPC-86](technical-evidence.md#review-fpc-86))

<a id="độ-phủ-theo-module"></a>

## Thứ tự triển khai

| Module | Priority | Status | Completed UC / Total UC | Đã có | Còn thiếu | Người phụ trách | Công việc tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [M01 Authentication & RBAC](../ai/01-auth-and-rbac.md) | 1 | **DONE** | 5/5 | Xác thực email, hồ sơ, RBAC | — | Đã đóng | Duy trì hồi quy khi tích hợp |
| [M03 Contest Lifecycle](../ai/03-contest-lifecycle.md) | 2 | **PARTIAL** | 0/8 | CRUD cơ bản, danh sách và chi tiết | Năm mốc, đăng ký, cấu hình vòng | Chờ chốt | Chốt hợp đồng lịch và đăng ký |
| [M02 Analog Master Data](../ai/02-analog-master-data.md) | 3 | **TODO** | 0/3 | Đặc tả danh mục | Quản trị và tra cứu dữ liệu thật | Chờ chốt | Chốt dữ liệu và API danh mục |
| [M04 Film Logbook](../ai/04-film-logbook.md) | 4 | **PARTIAL** | 0/2 | Metadata và kiểm tra số frame | CRUD cuộn/frame và liên kết bài | Chờ chốt | Hoàn thiện cuộn/frame và quyền sở hữu |
| [M05 Submission & Proof](../ai/05-submission-and-proof.md) | 5 | **PARTIAL** | 0/8 | Nộp, theo dõi, duyệt và loại bài | Đối chứng theo thể lệ, sửa/rút bài | Chờ chốt | Kết nối đăng ký và làm luồng đối chứng |
| [M06 AI Verification](../ai/06-ai-verification.md) | 6 | **PARTIAL** | 0/3 | Worker, pHash, cảnh báo, thẻ | Quét theo yêu cầu, nghiệm thu đối sánh | Chờ chốt | Kiểm tra luồng Organizer với ảnh thật |
| [M07 Blind Judging](../ai/07-blind-judging.md) | 7 | **PARTIAL** | 0/7 | API đọc bài được giao, chấm và khóa phiếu | Nối Web Judge và chốt/chuyển vòng | Chờ chốt | Tích hợp màn chấm với API |
| [M08 Archive & Exhibition](../ai/08-archive-and-exhibition.md) | 8 | **PARTIAL** | 0/5 | API đọc kết quả và portfolio, UI archive | Kết quả chính thức và kho ảnh thật | Chờ chốt | Dùng dữ liệu vòng cuối đã khóa |
| [M09 Shared API Contracts](../ai/09-api-contracts.md) | Song song | **PARTIAL** | N/A | OpenAPI và danh mục route | Hợp đồng các UC còn thiếu | Chờ chốt | Đồng bộ hợp đồng theo từng UC |
| [M10 Database Schema & Cloud Storage](../ai/10-database-and-storage.md) | Song song | **PARTIAL** | N/A | PostgreSQL, R2 và hàng đợi | Liên kết dữ liệu và ảnh xem trước công khai | Chờ chốt | Chốt schema theo M03–05 và tài sản số |
| [M11 Cross-Cutting Services](../ai/11-cross-cutting-services.md) | Song song | **PARTIAL** | 0/2 | Audit từng luồng, thống kê và xuất JSON | Tra cứu audit, thông báo, nghiệm thu AI báo cáo | Chờ chốt | Hoàn thiện audit và thử dịch vụ AI thật |

M09 và M10 hỗ trợ xuyên module. M11 sở hữu UC-10 và UC-28 theo ánh xạ SRS.
