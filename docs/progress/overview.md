# Dashboard tiến độ CINEGEN

| Chỉ số | Hiện trạng |
| --- | --- |
| Nhóm yêu cầu chức năng cấp cao (FR) | 10 |
| Use Case (UC) | 43 |
| Module triển khai | 11 |
| Luồng nghiệp vụ cốt lõi (CF) | 5 |
| Vai trò hệ thống | 4 |
| Nhóm FR hoàn thành | **1/10** · FR-01 |
| Use Case hoàn thành (Overall DONE) | **8/43** |
| Use Case triển khai một phần (Overall PARTIAL) | **30/43** |
| Use Case chưa triển khai (Overall TODO) | **5/43** |
| Use Case đã có triển khai (DONE + PARTIAL) | **38/43** |
| Độ phủ nghiệm thu Backend (Backend DONE) | **10/43** · gồm 8 UC toàn luồng và Backend của UC-28, UC-30 |
| Độ phủ nghiệm thu toàn luồng (Integration và Overall DONE) | **8/43** |
| Module hoàn thành | **1/11** |
| Module nghiệp vụ hoàn thành | **1/8** |
| Sprint hiện tại | **Sprint 5 · Chuẩn bị triển khai** |
| Sprint còn lại | **2**, gồm Sprint 5 và Sprint 6 |

Số liệu lấy từ [bảng Use Case](use-cases.md). Overall TODO có 5 UC, còn cột Backend có 8 TODO. Tỷ lệ FR và UC phản ánh số mục đã đóng. Khối lượng kỹ thuật không được tính theo trọng số trong bảng này.

Project Lead xác nhận **M01 DONE**, gồm UC-01–05. Checklist demo xác nhận thêm **UC-18, UC-23 và UC-40**. Sprint 5 được lấy làm mốc kế tiếp sau Sprint 4. Ngày bắt đầu và người phụ trách vẫn chờ Project Lead chốt.

[Use Cases](use-cases.md) · [Tổng kết Sprint 4 và kế hoạch Sprint 5–6](sprints.md#tổng-kết-cuối-sprint-4) · [SRS](../srs.md) · <a id="review-fpc-86"></a>[Bằng chứng kỹ thuật](technical-evidence.md) ([Review FPC-86](technical-evidence.md#review-fpc-86))

## Tiến độ theo nhóm yêu cầu chức năng

Một FR chỉ DONE khi tất cả UC chính có Overall DONE. Các liên kết phụ và module triển khai được truy vết theo [SRS](../srs.md#23-phân-cấp-yêu-cầu-và-truy-vết-chức-năng).

| FR ID | Functional Requirement | Accepted UC / Total UC | Status |
| --- | --- | --- | --- |
| FR-01 | Authentication & Access Control | 5/5 | DONE |
| FR-02 | System Administration & Master Data | 0/5 | PARTIAL |
| FR-03 | Contest Planning & Configuration | 0/5 | PARTIAL |
| FR-04 | Judge Assignment & Participant Registration | 0/3 | PARTIAL |
| FR-05 | Film Roll & Frame Management | 0/2 | PARTIAL |
| FR-06 | Film Submission & Tracking | 1/4 | PARTIAL |
| FR-07 | Submission Verification & Moderation | 2/4 | PARTIAL |
| FR-08 | AI-assisted Verification & Analytics | 0/3 | PARTIAL |
| FR-09 | Judging & Evaluation Management | 0/7 | PARTIAL |
| FR-10 | Result Publication & Digital Archive | 0/5 | PARTIAL |

<a id="độ-phủ-theo-module"></a>

## Thứ tự triển khai

| Module | Priority | Status | Completed UC / Total UC | Đã có | Còn thiếu | Người phụ trách | Công việc tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [M01 Authentication & RBAC](../ai/01-auth-and-rbac.md) | 1 | **DONE** | 5/5 | Xác thực email, hồ sơ, RBAC | — | Đã đóng | Duy trì hồi quy khi tích hợp |
| [M03 Contest Lifecycle](../ai/03-contest-lifecycle.md) | 2 | **PARTIAL** | 0/8 | CRUD cơ bản, danh sách và chi tiết | Năm mốc, đăng ký, cấu hình vòng | Chờ chốt | Chốt hợp đồng lịch và đăng ký |
| [M02 Analog Master Data](../ai/02-analog-master-data.md) | 3 | **TODO** | 0/3 | Đặc tả danh mục | Quản trị và tra cứu dữ liệu thật | Chờ chốt | Chốt dữ liệu và API danh mục |
| [M04 Film Logbook](../ai/04-film-logbook.md) | 4 | **PARTIAL** | 0/2 | Metadata và kiểm tra số frame | CRUD cuộn/frame và liên kết bài | Chờ chốt | Hoàn thiện cuộn/frame và quyền sở hữu |
| [M05 Submission & Proof](../ai/05-submission-and-proof.md) | 5 | **PARTIAL** | 3/8 | Hàng đợi, loại bài và theo dõi trạng thái đã nghiệm thu | Nộp bài, duyệt theo điều kiện đối chứng và sửa/rút bài | Chờ chốt | Kết nối đăng ký và làm luồng đối chứng |
| [M06 AI Verification](../ai/06-ai-verification.md) | 6 | **PARTIAL** | 0/3 | Worker, pHash, cảnh báo, thẻ | Quét theo yêu cầu, nghiệm thu đối sánh | Chờ chốt | Kiểm tra luồng Organizer với ảnh thật |
| [M07 Blind Judging](../ai/07-blind-judging.md) | 7 | **PARTIAL** | 0/7 | API chấm và khóa phiếu đã qua test, UI Web đã merge | Nối Web Judge và chốt/chuyển vòng | Chờ chốt | Tích hợp màn chấm với API |
| [M08 Archive & Exhibition](../ai/08-archive-and-exhibition.md) | 8 | **PARTIAL** | 0/5 | API đọc kết quả và portfolio, UI archive | Kết quả chính thức và kho ảnh thật | Chờ chốt | Dùng dữ liệu vòng cuối đã khóa |
| [M09 Shared API Contracts](../ai/09-api-contracts.md) | Song song | **PARTIAL** | N/A | OpenAPI và danh mục route | Hợp đồng các UC còn thiếu | Chờ chốt | Đồng bộ hợp đồng theo từng UC |
| [M10 Database Schema & Cloud Storage](../ai/10-database-and-storage.md) | Song song | **PARTIAL** | N/A | PostgreSQL, R2 và hàng đợi | Liên kết dữ liệu và ảnh xem trước công khai | Chờ chốt | Chốt schema theo M03–05 và tài sản số |
| [M11 Cross-Cutting Services](../ai/11-cross-cutting-services.md) | Song song | **PARTIAL** | 0/2 | Audit từng luồng, thống kê Backend đã qua test và có xuất JSON | Tra cứu audit, thông báo, nghiệm thu AI báo cáo | Chờ chốt | Hoàn thiện audit và thử dịch vụ AI thật |

Số Backend DONE nằm trong tổng UC đã có triển khai. Cột Completed UC trong bảng module dùng trạng thái Overall của [Use Cases](use-cases.md).

M09 và M10 hỗ trợ xuyên module. M11 sở hữu UC-10 và UC-28 theo ánh xạ SRS.

**Việc tiếp theo** · Chốt lịch năm mốc, đăng ký hạng mục và cấu hình vòng chấm cho M03. Lược đồ khai báo hiện khớp baseline 20 bảng. Những phần dữ liệu còn thiếu theo SRS được ghi trong [đối chiếu schema](technical-evidence.md#đối-chiếu-schema-với-migration).
