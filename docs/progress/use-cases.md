# Theo dõi Use Case CINEGEN

Tên và phạm vi lấy từ [SRS](../srs.md). Dùng [ánh xạ module chính](../ai/09-api-contracts.md#7-truy-vết-srs-theo-module) để tính mỗi UC một lần. [Dashboard](overview.md) tổng hợp tiến độ. [Bằng chứng kỹ thuật](technical-evidence.md) lưu kết quả đối chiếu.

| Trạng thái | Ý nghĩa |
| --- | --- |
| DONE | Đã hoàn thành và nghiệm thu. Project Lead xác nhận M01. Checklist người dùng xác nhận PASS cho UC-18, UC-23 và UC-40. |
| PARTIAL | Có triển khai hoặc tích hợp một phần. |
| DOING | Có xác nhận đang thực hiện. |
| BLOCKED | Phụ thuộc cụ thể đang cản tích hợp hoặc nghiệm thu. |
| TODO | Còn phải triển khai hoặc kết nối. |
| UNVERIFIED | Chưa đủ căn cứ xác minh hiện trạng hoặc nghiệm thu. |
| N/A | Nền tảng không áp dụng hoặc module không có UC riêng. |

**Integration** là mức xác nhận xuyên các thành phần áp dụng. DONE ở Backend chỉ tính cho phần Backend của UC. Một task DONE hoặc PR đã merge vẫn được ghi nhận ở [bảng đối chiếu Sprint → PR → UC](technical-evidence.md#đối-chiếu-task-sprint-với-pr-và-use-case) nếu phạm vi nghiệm thu của UC còn thiếu. **Owner** ghi **Chờ chốt** nếu Project Lead chưa phân công, và dấu **—** nếu UC đã đóng. Phân công Jira theo task nằm trong lịch sử sprint.

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
| UC-16 | Assign Judges to Categories | PARTIAL | PARTIAL | N/A | BLOCKED | PARTIAL | Màn phân công đã merge. Cần route lưu theo hạng mục/vòng và kiểm tra xung đột. | Chờ chốt |
| UC-17 | View Participant Registrations | TODO | UNVERIFIED | N/A | BLOCKED | TODO | Có đăng ký hạng mục trước khi nối danh sách và bộ lọc. | Chờ chốt |
| UC-34 | Browse & Register for Contests | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Web/Mobile có danh sách và chi tiết. Cần lưu đăng ký hạng mục và xác nhận thể lệ. | Chờ chốt |

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
| UC-18 | View Submission Queue | DONE | DONE | N/A | DONE | DONE | — | — |
| UC-21 | Request Negative / Contact Sheet Proof | PARTIAL | TODO | N/A | BLOCKED | PARTIAL | Lưu trạng thái yêu cầu, hạn cấu hình và thông báo. | Chờ chốt |
| UC-22 | Verify & Approve Submission | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Kiểm tra đối chứng bắt buộc trước khi duyệt. | Chờ chốt |
| UC-23 | Disqualify / Reject Submission | DONE | DONE | N/A | DONE | DONE | — | — |
| UC-37 | Submit Film Photograph | PARTIAL | PARTIAL | PARTIAL | BLOCKED | PARTIAL | Form Web đã merge. Sửa payload và liên kết đăng ký, cuộn/frame, đối chứng. | Chờ chốt |
| UC-38 | Upload Negative / Contact Sheet Proof | PARTIAL | PARTIAL | PARTIAL | BLOCKED | PARTIAL | Modal Web đã merge. Cần mount route lưu bằng chứng và nối yêu cầu đối chứng. | Chờ chốt |
| UC-39 | Edit / Withdraw Submission | TODO | UNVERIFIED | PARTIAL | BLOCKED | PARTIAL | Nối sửa metadata và rút bài trước hạn, khóa sửa sau đó. | Chờ chốt |
| UC-40 | Track Submission Status | DONE | DONE | DONE | DONE | DONE | — | — |

## M06 AI Verification

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-09 | Configure AI Thresholds | PARTIAL | N/A | N/A | UNVERIFIED | PARTIAL | Nghiệm thu quản trị ngưỡng và kết quả trên ảnh đại diện. | Chờ chốt |
| UC-19 | Trigger AI Verification Scan | PARTIAL | TODO | N/A | TODO | PARTIAL | Kích hoạt quét từng bài hoặc hàng loạt. | Chờ chốt |
| UC-20 | Review AI Flagged Submissions | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | Modal đã gọi API đối sánh. Cần nghiệm thu ảnh, bằng chứng và quyền xem. | Chờ chốt |

## M07 Blind Judging

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-24 | Monitor Judging Progress | PARTIAL | PARTIAL | N/A | BLOCKED | PARTIAL | Màn tiến độ và bảng điểm đã merge. Cần nối dữ liệu thật theo vòng. | Chờ chốt |
| UC-25 | Finalize Judging Round | PARTIAL | TODO | N/A | BLOCKED | PARTIAL | Chốt vòng, lưu danh sách đi tiếp và lý do đồng điểm. | Chờ chốt |
| UC-29 | View Assigned Submissions | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | API ẩn danh theo phân công đã qua test. Cần nối danh sách thật trên Web và theo vòng. | Chờ chốt |
| UC-30 | Inspect High-Res Image & Film Metadata | DONE | PARTIAL | N/A | PARTIAL | PARTIAL | API ảnh ẩn danh đã qua test. Viewer đã merge và cần nối ảnh scan, metadata thật. | Chờ chốt |
| UC-31 | Score & Comment on Submission | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | API lưu điểm và nhận xét đã qua test. Nối form Web với phiếu thật theo vòng. | Chờ chốt |
| UC-32 | Update Evaluation Score | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | API sửa điểm và chặn sau khóa đã qua test. Cần nối UI sửa phiếu theo vòng. | Chờ chốt |
| UC-33 | Lock & Confirm Final Evaluations | PARTIAL | UNVERIFIED | N/A | PARTIAL | PARTIAL | API khóa phiếu đủ bài đã qua test. Cần nối Web và xác nhận riêng từng vòng. | Chờ chốt |

## M08 Archive & Exhibition

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-26 | Approve & Publish Results | PARTIAL | PARTIAL | N/A | BLOCKED | PARTIAL | Chốt giải từ vòng cuối và khóa kết quả chính thức. | Chờ chốt |
| UC-27 | Manage Digital Archive & Exhibition | TODO | PARTIAL | N/A | BLOCKED | PARTIAL | Chọn tác phẩm và công khai ảnh xem trước từ kết quả thật. | Chờ chốt |
| UC-41 | View Contest Results & Judge Feedback | PARTIAL | UNVERIFIED | PARTIAL | PARTIAL | PARTIAL | Bảng vàng Mobile đã gọi API. Cần điểm và phản hồi thật từ vòng cuối. | Chờ chốt |
| UC-42 | Manage Personal Film Portfolio | PARTIAL | UNVERIFIED | PARTIAL | PARTIAL | PARTIAL | Portfolio Mobile đã gọi API. Cần dữ liệu giải và tác phẩm đã công bố thật. | Chờ chốt |
| UC-43 | Explore Digital Archive & Gallery | TODO | PARTIAL | UNVERIFIED | BLOCKED | PARTIAL | Archive và bộ lọc Web đã merge. Cần nối tác phẩm đã công bố từ API. | Chờ chốt |

## M09 Shared API Contracts

**N/A** · Module hỗ trợ xuyên suốt, không có UC riêng trong danh mục.

## M10 Database Schema & Cloud Storage

**N/A** · Module hỗ trợ xuyên suốt, không có UC riêng trong danh mục.

## M11 Cross-Cutting Services

| UC ID | Use Case | Backend | Web | Mobile | Integration | Overall Status | Remaining Work | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UC-10 | View System Audit Logs | PARTIAL | TODO | N/A | TODO | PARTIAL | Bổ sung màn tra cứu audit và đủ sự kiện nghiệp vụ. | Chờ chốt |
| UC-28 | Export Contest Analytics Report | DONE | PARTIAL | N/A | PARTIAL | PARTIAL | Backend đã kiểm thử bằng AI giả lập. Cần nghiệm thu xuất JSON trên Web và AI thật. | Chờ chốt |
