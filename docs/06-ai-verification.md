# Module Spec: 06 - AI Verification & Automated Screening (Thẩm định & Giám định Trí tuệ Nhân tạo)

## 1. Domain Entities & Database Mapping

### 1.1 Bảng `ai_verification_jobs` (Hàng đợi tác vụ kiểm tra AI)

Lưu trữ thông tin và trạng thái xử lý của từng job quét AI cho mỗi bài dự thi (`submission`).

| Tên trường (Column) | Kiểu dữ liệu (Data Type) | Ràng buộc (Constraints) | Ý nghĩa / Ghi chú |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Khóa chính của job |
| `submission_id` | `UUID` | `NOT NULL`, `FOREIGN KEY REFERENCES submissions(id) ON DELETE CASCADE` | Mã bài nộp cần thẩm định |
| `status` | `VARCHAR(30)` | `NOT NULL`, `DEFAULT 'PENDING'` | ENUM: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETRYING` |
| `attempt_count` | `INT` | `NOT NULL`, `DEFAULT 0` | Số lần thử lại tối đa (Max Retry: 3) |
| `error_message` | `TEXT` | `NULL` | Chi tiết mã lỗi hoặc exception nếu xử lý thất bại |
| `started_at` | `TIMESTAMPTZ` | `NULL` | Thời điểm bắt đầu chạy job |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Thời điểm hoàn thành xong toàn bộ tác vụ AI |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Thời gian tạo tác vụ |

- **Chỉ mục (Indexes):**
  - `idx_ai_jobs_submission_id` ON (`submission_id`)
  - `idx_ai_jobs_status` ON (`status`)

---

### 1.2 Bảng `submission_ai_analyses` (Kết quả phân tích AI chi tiết)
Chứa các chỉ số đo lường quang học, điểm phán đoán AI-generated, băm thị giác (pHash) và vector đặc trưng.

| Tên trường (Column) | Kiểu dữ liệu (Data Type) | Ràng buộc (Constraints) | Ý nghĩa / Ghi chú |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Khóa chính kết quả phân tích |
| `submission_id` | `UUID` | `NOT NULL`, `UNIQUE`, `FOREIGN KEY REFERENCES submissions(id) ON DELETE CASCADE` | 1-1 với bài nộp |
| `phash_hex` | `VARCHAR(16)` | `NOT NULL` | Khóa chuỗi Perceptual Hash 64-bit dạng Hex (16 ký tự) |
| `feature_vector` | `vector(512)` | `NULL` | Vector nhúng đặc trưng thị giác (CLIP/ResNet50) phục vụ so khớp pgvector |
| `ai_generated_probability` | `DECIMAL(5,4)` | `NOT NULL`, `CHECK (ai_generated_probability >= 0 AND ai_generated_probability <= 1)` | Xác suất ảnh được tạo bởi AI ($P_{AI} \in [0.0000, 1.0000]$) |
| `is_ai_flagged` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Cờ cảnh báo vi phạm AI ($P_{AI} \ge 0.75$) |
| `duplicate_suspect_id` | `UUID` | `NULL`, `FOREIGN KEY REFERENCES submissions(id) ON DELETE SET NULL` | ID bài thi bị nghi ngờ trùng lặp gần nhất |
| `duplicate_similarity_score` | `DECIMAL(5,4)` | `NULL` | Điểm số tương đồng cao nhất (Cosine Similarity hoặc $1 - \frac{\text{Hamming}}{64}$) |
| `film_grain_score` | `DECIMAL(5,4)` | `NULL` | Điểm đánh giá mật độ và cấu trúc hạt grain analog (Laplacian Variance / Frequency analysis) |
| `predicted_tags` | `JSONB` | `NOT NULL`, `DEFAULT '[]'::jsonb` | Danh sách 5 tags tự động nhận diện từ Vision Model |
| `raw_metadata_extracted` | `JSONB` | `NOT NULL`, `DEFAULT '{}'::jsonb` | Metadata Exif/IPTC trích xuất từ file scan gốc |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Thời điểm phân tích |

- **Chỉ mục (Indexes):**
  - `idx_ai_analyses_phash` ON (`phash_hex`)
  - `idx_ai_analyses_vector` USING hnsw (`feature_vector` vector_cosine_ops)
  - `idx_ai_analyses_flagged` ON (`is_ai_flagged`) WHERE `is_ai_flagged` IS TRUE

---


## 2. Business Rules & Logic Ràng Buộc

### 2.1 Trích xuất Business Rules từ SRS

Các quy tắc nghiệp vụ của module AI Verification bao gồm:

- **BR-09 (Phát hiện ảnh tạo bởi AI - AI-Generated Detection):**
  - AI Worker phân tích ảnh scan độ phân giải đầy đủ thông qua mô hình Deep Learning (EfficientNet/ViT Fine-tuned detector).
  - Nếu xác suất `P_AI >= 0.75` (75%):
    - Tự động gán nhãn `AI_FLAGGED_HIGH_RISK` cho bài thi.
    - Trạng thái thẩm định chuyển thành `FLAGGED`.
    - **Chặn tuyệt đối** việc phân bổ bài nộp vào danh sách chấm của Ban Giám khảo.
    - Đưa vào hàng đợi xác minh thủ công (Manual Review Queue) dành cho Trưởng BTC (Organizer Lead).

- **BR-10 (Phát hiện trùng lặp tác phẩm - Duplicate / Near-duplicate Detection):**
  - Tính toán mã băm tri giác **pHash 64-bit** dựa trên biến đổi cosine rời rạc (DCT) trên ảnh grayscale `32 x 32`.
  - So sánh khoảng cách Hamming (`d_H`) giữa bài thi mới và toàn bộ bài thi đã nộp trong cùng cuộc thi hoặc các kỳ trước:
    - Nếu `d_H <= 5` bit: Đánh dấu cờ `DUPLICATE_SUSPECT`.
  - Đồng thời tính Cosine Distance trên `feature_vector` (CLIP 512-dim) qua `pgvector`:
    - Nếu `Similarity >= 92%` (0.92): Đánh dấu cờ `DUPLICATE_SUSPECT`.
  - Ghi nhận `duplicate_suspect_id` trỏ tới bài thi trùng nguyên bản.

- **BR-11 (Tự động gán thẻ phân loại nội dung - Auto-Tagging):**
  - Trích xuất đặc trưng hình ảnh và phân lớp đa nhãn (Multi-label classification).
  - Trả về chính xác **5 thẻ** có độ tin cậy (Confidence Score) cao nhất trong các nhóm:
    - Chân dung (Portrait)
    - Đường phố (Streetlife)
    - Phong cảnh (Landscape)
    - Đời thường (Documentary)
    - Kiến trúc (Architecture)
    - Đen trắng (Monochrome)
    - Macro và các nhóm khác.
  - Thí sinh và Giám khảo có thể xem tags này để tra cứu/lọc dữ liệu trong kho lưu trữ (Digital Archive).

- **Quy định kỹ thuật bổ sung (Xác thực cấu trúc hạt Analog & Worker QoS):**
  - Phân tích biến sai Fourier/Laplace để kiểm tra sự tồn tại của hạt grain đặc trưng phim, phục vụ đối chứng khi nghi ngờ ảnh số được chèn texture giả lập.
  - Mọi thao tác xử lý AI phải chạy hoàn toàn **bất đồng bộ (Asynchronous Background Worker)** qua hàng đợi Redis Queue / Celery / BullMQ.
  - Phải trả kết quả hoặc timeout trong vòng tối đa **120 giây** tính từ khi bài thi kích hoạt sự kiện `SUBMITTED`.


## 3. State Machine & Lifecycle



### 3.1 Quy trình vòng đời thẩm định AI (AI Verification Lifecycle)

1. **SUBMITTED (Đã nộp bài)**
   - Thí sinh hoàn tất nộp tác phẩm.
   - Hệ thống lưu bài thi và đưa sự kiện vào hàng đợi xử lý AI.

2. **AI VERIFICATION (Thẩm định tự động)**
   - AI Worker nhận tác vụ xử lý bất đồng bộ.
   - Tính pHash và so sánh ảnh trùng lặp.
   - Phân tích xác suất ảnh tạo sinh bởi AI (`P_AI`).
   - Gợi ý tối đa 5 thẻ phân loại nội dung.
   - Cảnh báo nếu nội dung ảnh không phù hợp hạng mục dự thi.

3. **AI_CLEAN / AI_FLAGGED (Kết quả kiểm tra)**
   - `AI_CLEAN`: Chưa phát hiện dấu hiệu bất thường theo các ngưỡng kiểm tra.
   - `AI_FLAGGED`: Phát hiện dấu hiệu cần kiểm tra thêm.
   - Nếu `P_AI >= 0.75`, gắn cờ `AI_FLAGGED_HIGH_RISK`.
   - Nếu Hamming Distance `<= 5` hoặc Cosine Similarity `>= 0.92`, gắn cờ `DUPLICATE_SUSPECT`.
   - Bài bị gắn cờ rủi ro cao không được chuyển cho Giám khảo trước khi được Ban tổ chức kiểm tra và gỡ cờ.

4. **ORGANIZER REVIEW (Ban tổ chức kiểm duyệt)**
   - Organizer xem báo cáo AI, ảnh dự thi, siêu dữ liệu và bằng chứng âm bản.
   - AI chỉ hỗ trợ phát hiện nghi vấn; quyết định xử lý cuối cùng thuộc Ban tổ chức.

5. **APPROVED_FOR_JUDGING (Được duyệt chấm)**
   - Organizer xác nhận bài thi hợp lệ.
   - Bài thi đủ điều kiện đưa vào danh sách chấm của Giám khảo.

6. **PROOF_REQUESTED (Yêu cầu bổ sung âm bản)**
   - Organizer yêu cầu thí sinh bổ sung bằng chứng âm bản.
   - Hệ thống gửi thông báo với thời hạn 48 giờ.
   - Sau khi thí sinh bổ sung, Ban tổ chức tiếp tục thẩm định.

7. **DISQUALIFIED (Bị loại)**
   - Organizer xác nhận bài thi vi phạm.
   - Bắt buộc ghi lý do loại bài.
   - Hệ thống lưu quyết định vào Audit Log.





### 3.2 Ma trận phân quyền kích hoạt (Access Control)

- **Hệ thống (System / AI Worker):**
  - Tự động thực hiện các tác vụ phân tích AI.
  - Cập nhật trạng thái xử lý job từ `PENDING` sang `PROCESSING` và `COMPLETED` hoặc `FAILED`.
  - Ghi nhận kết quả kiểm tra `AI_CLEAN` hoặc `AI_FLAGGED`.
  - Không tự quyết định phê duyệt hoặc loại bài thi.

- **Ban tổ chức (Contest Organizer):**
  - Xem báo cáo và các cảnh báo do AI tạo ra.
  - Kích hoạt quét lại bài thi khi cần thiết.
  - Kiểm tra bằng chứng và đưa ra quyết định:
    - `APPROVED_FOR_JUDGING`: Phê duyệt bài thi.
    - `PROOF_REQUESTED`: Yêu cầu bổ sung âm bản.
    - `DISQUALIFIED`: Loại bài thi và ghi rõ lý do.

- **Quản trị viên (Administrator):**
  - Quản lý cấu hình và ngưỡng cảnh báo AI theo quyền hệ thống.
  - Xem thông tin giám sát AI theo phân quyền được cấp.

- **Thí sinh (Participant):**
  - Theo dõi trạng thái thẩm định bài thi của mình.
  - Bổ sung bằng chứng khi Ban tổ chức yêu cầu.
  - Không được chỉnh sửa kết quả AI.

- **Giám khảo (Judge):**
  - Chỉ truy cập các bài thi đã được phê duyệt và phân công.
  - Không được thay đổi kết quả thẩm định AI.



## 4. Shared API Contracts (Dùng chung cho Web & Mobile)

### 4.1 Endpoint 1: Kích hoạt quét AI thủ công (Re-scan / Trigger)
Dành cho Ban tổ chức khi cần kiểm tra lại bài thi nghi vấn.

- **URL:** `POST /api/v1/organizer/submissions/{submissionId}/ai-scan`
- **Headers:** `Authorization: Bearer <JWT_ORGANIZER>`
- **Request Payload:**
```json
{
  "forceRecheck": true,
  "priority": "HIGH"
}
```
- **Response Payload (202 Accepted):**
```json
{
  "success": true,
  "message": "AI verification job enqueued successfully.",
  "data": {
    "jobId": "e2b3c4d5-6789-4abc-9def-0123456789ab",
    "submissionId": "f1a2b3c4-1111-2222-3333-444455556666",
    "status": "PENDING",
    "estimatedTimeSeconds": 15
  }
}
```

---

### 4.2 Endpoint 2: Lấy kết quả phân tích AI chi tiết (Get AI Audit Details)
Dùng cho màn hình Admin/Organizer Review bài nộp.

- **URL:** `GET /api/v1/organizer/submissions/{submissionId}/ai-analysis`
- **Headers:** `Authorization: Bearer <JWT_ORGANIZER>`
- **Response Payload Thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissionId": "f1a2b3c4-1111-2222-3333-444455556666",
    "status": "FLAGGED",
    "isAiFlagged": true,
    "aiGeneratedProbability": 0.8845,
    "phashHex": "d8e3b2a19c4f7082",
    "duplicateCheck": {
      "isSuspect": true,
      "suspectSubmissionId": "99aa88bb-4444-5555-6666-777788889999",
      "hammingDistance": 3,
      "similarityScore": 0.9531
    },
    "grainAnalysis": {
      "filmGrainScore": 0.3200,
      "assessment": "WEAK_ANALOG_TEXTURE"
    },
    "predictedTags": [
      { "tag": "Streetlife", "confidence": 0.94 },
      { "tag": "Monochrome", "confidence": 0.89 },
      { "tag": "Architecture", "confidence": 0.76 },
      { "tag": "Shadow", "confidence": 0.68 },
      { "tag": "Urban", "confidence": 0.61 }
    ],
    "flagReasons": [
      "AI-Generated probability exceeds 75% threshold (88.45%)",
      "Near-duplicate found with submission #FPC-42 (Hamming distance = 3)"
    ],
    "analyzedAt": "2026-10-27T16:20:00Z"
  }
}
```

- **Response Payload Lỗi (404 Not Found / 422 Unprocessed):**
```json
{
  "success": false,
  "errorCode": "AI_JOB_NOT_FOUND_OR_PENDING",
  "message": "Kết quả AI chưa sẵn sàng hoặc đang trong hàng đợi xử lý.",
  "errors": []
}
```

---

## 5. UI/UX Functional Requirements

### 5.1 Luồng thao tác người dùng (User Flows)
1. **Phía Thí sinh (Web & Mobile):**
   - Sau khi ấn nộp bài, màn hình bài nộp hiển thị huy hiệu trạng thái: *"Hệ thống đang thẩm định kỹ thuật..."* kèm icon loading xoay nhẹ.
   - Thí sinh không nhìn thấy chi tiết điểm $P_{AI}$ hay mã hash để tránh hành vi chỉnh sửa vượt rào kỹ thuật (Black-box security).
2. **Phía Ban tổ chức (Organizer Web Portal):**
   - Truy cập tab **"Thẩm định bài thi (Verification Queue)"**.
   - Có bộ lọc nhanh: `Tất cả`, `AI không phát hiện nghi vấn (AI_CLEAN)`, `Nghi vấn AI (AI Flagged)`, `Nghi vấn trùng lặp (Duplicate Suspect)`.
   - Khi nhấp vào bài nộp bị gắn cờ: Mở **Modal Đối chứng 2 cột (Side-by-side View)**:
     - *Cột trái:* Tác phẩm hiện tại kèm biểu đồ phân bổ xác suất AI và radar hạt grain.
     - *Cột phải:* Ảnh đối chứng trùng lặp (nếu vi phạm $d_H \le 5$) kèm nút xem file âm bản (Negative sheet).
   - Nút hành động: `Chấp nhận bài thi (Ghi đè)`, `Yêu cầu bổ sung Contact Sheet`, `Loại bài thi (Disqualify)`.

### 5.2 Trạng thái hiển thị & Xử lý sự cố (States & Fallback Handling)
- **Loading State:** Khi ảnh đang quét, hiển thị trạng thái đang xử lý (Skeleton loader). Không hiển thị thời gian hoàn tất cố định khi chưa có SLA được nhóm xác nhận.
- **WebSocket / SSE:** Nhận thông báo thời gian thực ngay khi AI Worker hoàn thành để cập nhật giao diện mà không cần F5 trình duyệt.
- **Fault Tolerance:** Trường hợp GPU worker bị lỗi (OOM hoặc mất kết nối mạng), hệ thống tự động đưa bài nộp vào trạng thái `PENDING_RETRY` và bắn notification tới Kỹ thuật viên hệ thống, tuyệt đối không làm đơ giao diện thí sinh.
