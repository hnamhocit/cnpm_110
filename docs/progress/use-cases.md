# Theo dõi Use Case CINEGEN

Tên và phạm vi lấy từ [SRS](../srs.md). Dùng [ánh xạ module chính](../ai/09-api-contracts.md#7-truy-vết-srs-theo-module) để tính mỗi UC một lần. [Dashboard](overview.md) tổng hợp tiến độ. [Bằng chứng kỹ thuật](technical-evidence.md) lưu kết quả đối chiếu.

| Trạng thái | Ý nghĩa |
| --- | --- |
| DONE | Đã hoàn thành và nghiệm thu. Project Lead xác nhận M01, gồm UC-01–05 trên các nền tảng áp dụng. |
| PARTIAL | Có triển khai hoặc tích hợp một phần. |
| DOING | Có xác nhận đang thực hiện. |
| BLOCKED | Phụ thuộc cụ thể đang cản tích hợp hoặc nghiệm thu. |
| TODO | Còn phải triển khai hoặc kết nối. |
| UNVERIFIED | Chưa đủ căn cứ xác minh hiện trạng hoặc nghiệm thu. |
| N/A | Nền tảng không áp dụng hoặc module không có UC riêng. |

**Integration** là mức xác nhận xuyên các thành phần áp dụng. **Owner** ghi **Chờ chốt** nếu Project Lead chưa phân công, và dấu **—** nếu UC đã đóng. Phân công Jira theo task nằm trong lịch sử sprint.

## M01 Authentication & RBAC

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Register / Login / Logout | DONE | DONE | DONE | DONE | DONE | — | — |
| UC-02 | Recover Password | DONE | DONE | DONE | DONE | DONE | — | — |
| UC-03 | View & Update Profile | DONE | DONE | DONE | DONE | DONE | — | — |
| UC-04 | Manage User Accounts | DONE | DONE | N/A | DONE | DONE | — | — |
| UC-05 | Manage Roles & Permissions | DONE | DONE | N/A | DONE | DONE | — | — |

## M03 Contest Lifecycle

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-11 | Create / Duplicate Contest | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Lưu đủ cấu hình, năm mốc và sao chép sang DRAFT. | Chờ chốt |
| UC-12 | Update Contest Configuration | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Chuẩn hóa năm mốc, trạng thái và sửa thể lệ đúng hạn. | Chờ chốt |
| UC-13 | Manage Contest Categories | PARTIAL | UNVERIFIED | N/A | TODO | PARTIAL | Thêm, sửa và vô hiệu hóa hạng mục qua API và Web. | Chờ chốt |
| UC-14 | Configure Judging Criteria | PARTIAL | PARTIAL | N/A | TODO | PARTIAL | Lưu tiêu chí từ Web và kiểm tra tổng trọng số 100%. | Chờ chốt |
| UC-15 | Manage Judging Rounds | TODO | UNVERIFIED | N/A | TODO | TODO | Cấu hình vòng, thời hạn và giới hạn bài đi tiếp. | Chờ chốt |
| UC-16 | Assign Judges to Categories | PARTIAL | PARTIAL | N/A | TODO | PARTIAL | Lưu phân công hạng mục/vòng và kiểm tra xung đột. | Chờ chốt |
| UC-17 | View Participant Registrations | TODO | UNVERIFIED | N/A | BLOCKED | TODO | Có đăng ký hạng mục trước khi nối danh sách và bộ lọc. | Chờ chốt |
| UC-34 | Browse & Register for Contests | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Lưu đăng ký đúng hạng mục, thời gian và xác nhận thể lệ. | Chờ chốt |

## M02 Analog Master Data

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-06 | Manage Film Stock Catalog | TODO | TODO | UNVERIFIED | TODO | TODO | Quản trị Film Stock và nối danh mục tra cứu. | Chờ chốt |
| UC-07 | Manage Camera & Lens Catalog | TODO | TODO | UNVERIFIED | TODO | TODO | Quản trị Camera/Lens và nối danh mục tra cứu. | Chờ chốt |
| UC-08 | Manage Film Lab Directory | TODO | TODO | UNVERIFIED | TODO | TODO | Quản trị Film Lab và nối danh mục tra cứu. | Chờ chốt |

## M04 Film Logbook

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-35 | Manage Film Roll Log | PARTIAL | UNVERIFIED | PARTIAL | TODO | PARTIAL | Nối CRUD Film Roll với dữ liệu thật và quyền sở hữu. | Chờ chốt |
| UC-36 | Manage Frame Metadata | PARTIAL | UNVERIFIED | PARTIAL | TODO | PARTIAL | Lưu Film Frame theo cuộn và kiểm tra số frame duy nhất. | Chờ chốt |

## M05 Submission & Proof

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-18 | View Submission Queue | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nghiệm thu hàng đợi, bộ lọc và quyền theo cuộc thi. | Chờ chốt |
| UC-21 | Request Negative / Contact Sheet Proof | PARTIAL | TODO | N/A | BLOCKED | PARTIAL | Lưu trạng thái yêu cầu, hạn cấu hình và thông báo. | Chờ chốt |
| UC-22 | Verify & Approve Submission | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Kiểm tra đối chứng bắt buộc trước khi duyệt. | Chờ chốt |
| UC-23 | Disqualify / Reject Submission | PARTIAL | PARTIAL | N/A | UNVERIFIED | PARTIAL | Nghiệm thu loại bài thủ công, lý do và nhật ký. | Chờ chốt |
| UC-37 | Submit Film Photograph | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Gắn đăng ký hợp lệ, cuộn/frame và đối chứng theo thể lệ. | Chờ chốt |
| UC-38 | Upload Negative / Contact Sheet Proof | PARTIAL | UNVERIFIED | PARTIAL | BLOCKED | PARTIAL | Nối upload/xác minh sau khi lưu được yêu cầu đối chứng. | Chờ chốt |
| UC-39 | Edit / Withdraw Submission | TODO | UNVERIFIED | PARTIAL | BLOCKED | PARTIAL | Nối sửa metadata và rút bài trước hạn, khóa sửa sau đó. | Chờ chốt |
| UC-40 | Track Submission Status | PARTIAL | UNVERIFIED | PARTIAL | PARTIAL | PARTIAL | Nghiệm thu trạng thái thật, lý do và làm mới thông tin. | Chờ chốt |

## M06 AI Verification

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-09 | Configure AI Thresholds | PARTIAL | N/A | N/A | UNVERIFIED | PARTIAL | Nghiệm thu quản trị ngưỡng và kết quả trên ảnh đại diện. | Chờ chốt |
| UC-19 | Trigger AI Verification Scan | PARTIAL | TODO | N/A | TODO | PARTIAL | Kích hoạt quét từng bài hoặc hàng loạt. | Chờ chốt |
| UC-20 | Review AI Flagged Submissions | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nghiệm thu quyền đối sánh, ảnh/bằng chứng và quyết định. | Chờ chốt |

## M07 Blind Judging

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-24 | Monitor Judging Progress | PARTIAL | PARTIAL | N/A | TODO | PARTIAL | Nối phân công, tiến độ và xác nhận theo vòng với dữ liệu thật. | Chờ chốt |
| UC-25 | Finalize Judging Round | PARTIAL | TODO | N/A | BLOCKED | PARTIAL | Chốt vòng, lưu danh sách đi tiếp và lý do đồng điểm. | Chờ chốt |
| UC-29 | View Assigned Submissions | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nối danh sách bài với Web Judge và nghiệm thu ẩn danh. | Chờ chốt |
| UC-30 | Inspect High-Res Image & Film Metadata | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nối ảnh scan theo quyền và metadata thật vào viewer. | Chờ chốt |
| UC-31 | Score & Comment on Submission | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nối form chấm với API và nghiệm thu theo vòng. | Chờ chốt |
| UC-32 | Update Evaluation Score | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nối cập nhật phiếu và kiểm tra khóa sửa theo vòng. | Chờ chốt |
| UC-33 | Lock & Confirm Final Evaluations | PARTIAL | UNVERIFIED | N/A | PARTIAL | PARTIAL | Nối xác nhận phiếu trên Web và nghiệm thu đủ bài theo vòng. | Chờ chốt |

## M08 Archive & Exhibition

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | PARTIAL | PARTIAL | N/A | BLOCKED | PARTIAL | Chốt giải từ vòng cuối và khóa kết quả chính thức. | Chờ chốt |
| UC-27 | Manage Digital Archive & Exhibition | TODO | PARTIAL | N/A | BLOCKED | PARTIAL | Chọn tác phẩm và công khai ảnh xem trước từ kết quả thật. | Chờ chốt |
| UC-41 | View Contest Results & Judge Feedback | PARTIAL | UNVERIFIED | PARTIAL | BLOCKED | PARTIAL | Hiển thị điểm và phản hồi thật từ kết quả vòng cuối. | Chờ chốt |
| UC-42 | Manage Personal Film Portfolio | PARTIAL | UNVERIFIED | PARTIAL | PARTIAL | PARTIAL | Tổng hợp portfolio từ lịch sử và giải đã công bố. | Chờ chốt |
| UC-43 | Explore Digital Archive & Gallery | TODO | PARTIAL | UNVERIFIED | BLOCKED | PARTIAL | Nối archive và bộ lọc với tác phẩm đã công bố. | Chờ chốt |

## M09 Shared API Contracts

**N/A** · Module hỗ trợ xuyên suốt, không có UC riêng trong danh mục.

## M10 Database Schema & Cloud Storage

**N/A** · Module hỗ trợ xuyên suốt, không có UC riêng trong danh mục.

## M11 Cross-Cutting Services

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-10 | View System Audit Logs | PARTIAL | TODO | N/A | TODO | PARTIAL | Bổ sung màn tra cứu audit và đủ sự kiện nghiệp vụ. | Chờ chốt |
| UC-28 | Export Contest Analytics Report | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Nghiệm thu báo cáo, xuất JSON và dịch vụ AI thực tế. | Chờ chốt |
