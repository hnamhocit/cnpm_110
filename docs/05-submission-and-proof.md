# Module Spec: Nộp bài và Đối chứng âm bản (Submission & Proof)

## 1. Domain Entities & Database Mapping

### 1.1 Bảng `Submission` (Bài dự thi)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Khóa chính |
| `submission_code` | String | Unique, Not Null | Mã bài thi (Auto-gen: `SUB-YYYY-XXXX`) |
| `contest_id` | UUID | FK (Contest), Not Null | Thuộc cuộc thi nào |
| `category_id` | UUID | FK (ContestCategory), Not Null | Thuộc hạng mục/bảng thi nào |
| `user_id` | UUID | FK (User), Not Null | Thí sinh nộp |
| `roll_id` | UUID | FK (FilmRoll), Not Null | Liên kết cuộn phim |
| `frame_number` | Integer | Not Null | Khung hình được chọn |
| `title` | String | Not Null | Tên tác phẩm |
| `artist_statement` | Text | Nullable | Tuyên ngôn sáng tác / Thông điệp |
| `image_url` | String | Not Null | Link ảnh scan (S3/R2) |
| `status` | ENUM | Default 'SUBMITTED' | `SUBMITTED`, `PROOF_REQUESTED`, `PROOF_SUBMITTED`, `APPROVED_FOR_JUDGING`, `DISQUALIFIED` |
| `proof_requested_at`| Timestamp | Nullable | Thời điểm BTC yêu cầu nộp âm bản (Dùng để tính hạn 48h) |
| `submitted_at` | Timestamp | Not Null | Thời điểm nộp |

### 1.2 Bảng `SubmissionProof` (Ảnh đối chứng âm bản)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Khóa chính |
| `submission_id` | UUID | FK (Submission), Not Null | Thuộc bài thi nào |
| `proof_image_urls`| JSON Array | Not Null | Danh sách link ảnh dải âm bản (1-3 ảnh) |
| `uploaded_at` | Timestamp | Not Null | Thời điểm upload |

---

## 2. Business Rules & Logic Ràng Buộc

*   **BR-07 (Chuẩn ảnh dự thi):** API từ chối nếu ảnh không phải JPG/TIFF, dung lượng > 25MB, cạnh ngắn < 2000px. Đối với quy tắc "Cấm watermark", hệ thống sẽ dùng AI để nhận diện sơ bộ, nếu nghi vấn sẽ gắn cờ để Organizer kiểm tra thủ công.
*   **BR-05 (Chống trùng lặp):** Khi tạo Submission, hệ thống kiểm tra cặp (`roll_id`, `frame_number`) đã tồn tại trong bất kỳ `Submission` nào khác của cùng `contest_id` chưa. Nếu có, trả về lỗi `MSG-12`.
*   **BR-19 (Hạn chót đối chứng):** Khi Organizer gửi yêu cầu (`PROOF_REQUESTED`), hệ thống lưu `proof_requested_at`. Khi Participant upload, kiểm tra `current_time - proof_requested_at <= 48 giờ`. Quá hạn -> Từ chối, chuyển trạng thái `DISQUALIFIED_NO_PROOF`.
*   **BR-06 (Điều kiện xét giải):** Chỉ những bài thi có trạng thái `APPROVED_FOR_JUDGING` và đã có `SubmissionProof` hợp lệ (đã được Organizer duyệt thủ công) mới được phép chuyển sang vòng chấm điểm/đạt giải.
*   **Quy tắc phê duyệt (Review Proof):** Khi thí sinh nộp ảnh âm bản (`PROOF_SUBMITTED`), Organizer phải đối chiếu thủ công (so khớp dải âm bản với ảnh scan). Nếu khớp -> `APPROVED_FOR_JUDGING`. Nếu không khớp (ảnh giả, ảnh AI) -> `DISQUALIFIED`.

---

## 3. State Machine & Lifecycle

**Lifecycle của Bài dự thi (`Submission`):**
*   `SUBMITTED` (Đã nộp) -> `APPROVED_FOR_JUDGING` (Duyệt vào chấm thi - nếu không cần đối chứng).
*   `SUBMITTED` -> `PROOF_REQUESTED` (Yêu cầu bổ sung âm bản) -> `PROOF_SUBMITTED` (Đã nộp âm bản) -> `APPROVED_FOR_JUDGING` (Nếu âm bản hợp lệ).
*   `PROOF_SUBMITTED` -> `DISQUALIFIED` (Nếu âm bản không khớp / giả mạo).
*   `PROOF_REQUESTED` -> `DISQUALIFIED_NO_PROOF` (Quá 48h không nộp âm bản).

**Quyền chuyển đổi trạng thái:**
*   **Participant:** Tạo `SUBMITTED`, upload `PROOF_SUBMITTED`.
*   **Organizer:** Gửi yêu cầu `PROOF_REQUESTED`, phê duyệt `APPROVED_FOR_JUDGING` hoặc loại `DISQUALIFIED`.

---

## 4. Shared API Contracts (Dùng chung cho Web & Mobile)

### 4.1. Nộp bài (`POST /api/v1/submissions`)
*   **Request Payload:**
    ```json
    {
      "contestId": "uuid-contest-1",
      "categoryId": "uuid-category-1",
      "rollId": "uuid-roll-123",
      "frameNumber": 12,
      "title": "Góc phố mùa thu",
      "artistStatement": "Bức ảnh chụp vào lúc 5h chiều...",
      "imageUrl": "https://r2.cloud.../scan_12.jpg"
    }
    ```
*   **Response Payload (400 Bad Request - Vi phạm BR-05):**
    ```json
    {
      "status": "error",
      "code": "MSG-12",
      "message": "Khung hình số 12 thuộc cuộn phim này đã được nộp trong cuộc thi."
    }
    ```

### 4.2. Organizer Yêu cầu đối chứng (`PUT /api/v1/submissions/{id}/request-proof`)
*   **Request Payload:** `{}`
*   **Response Payload (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "submissionId": "uuid-sub-1",
        "status": "PROOF_REQUESTED",
        "deadline": "2026-10-28T23:59:59Z"
      }
    }
    ```

### 4.3. Participant Upload đối chứng (`POST /api/v1/submissions/{id}/proof`)
*   **Request Payload:**
    ```json
    {
      "proofImageUrls": [
        "https://r2.cloud.../negative_strip_1.jpg",
        "https://r2.cloud.../negative_strip_2.jpg"
      ]
    }
    ```
*   **Response Payload (400 Bad Request - Vi phạm BR-19):**
    ```json
    {
      "status": "error",
      "code": "MSG-19",
      "message": "Đã quá hạn 48 giờ nộp ảnh đối chứng âm bản."
    }
    ```

---

## 5. UI/UX Functional Requirements

### 5.1 Submission Wizard (Web/Mobile)
*   **Bước 1 (Upload ảnh):** Kéo thả ảnh. **Client-side Validation:** Kiểm tra dung lượng (<25MB) và định dạng. Nếu sai hiển thị viền đỏ.
*   **Bước 2 (Chọn từ Logbook):** Hiển thị danh sách các Frame chưa được nộp trong cuộc thi này (Gọi API check trước).
*   **Bước 3 (Điền thông tin):** Nhập Tên tác phẩm (Bắt buộc), Tuyên ngôn (Tùy chọn).
*   **Thành công:** Hiển thị Modal "Nộp thành công" kèm mã bài thi (`SUB-2026-01`).

### 5.2 Negative Proof Upload
*   **Màn hình trạng thái:** Nếu bài thi ở `PROOF_REQUESTED`, hiển thị banner vàng kèm **Đồng hồ đếm ngược 48h**. 
*   **Form Upload:** Cho phép chọn tối đa 3 ảnh chụp dải âm bản.
*   **Xử lý lỗi:** Nếu đồng hồ về 0, UI tự động disable nút Upload và hiện thông báo "Đã quá hạn đối chứng, bài thi sẽ bị loại".