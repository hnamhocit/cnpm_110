# Module Spec: Quản lý Nhật ký Cuộn phim (Film Logbook)

## 1. Domain Entities & Database Mapping

### 1.1 Bảng `FilmRoll` (Cuộn phim)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Khóa chính |
| `roll_code` | String | Unique, Not Null | Mã cuộn phim (Auto-gen: `ROLL-YYYY-XXXX`) |
| `user_id` | UUID | FK (User), Not Null | Thí sinh sở hữu cuộn phim |
| `film_stock_id` | UUID | FK (FilmStock), Not Null | Loại phim (VD: Kodak Portra 400) |
| `format` | ENUM | Not Null | Khổ phim: `135`, `120_645`, `120_66`, `4x5` |
| `iso` | Integer | Not Null, Check (> 0) | ISO thực tế khi chụp (Hỗ trợ Push/Pull) |
| `camera_body_id` | UUID | FK (CameraBody), Not Null | Thân máy ảnh sử dụng |
| `lab_id` | UUID | FK (Lab), Nullable | Phòng Lab tráng/scan |
| `load_date` | Date | Not Null | Ngày lắp phim |
| `status` | ENUM | Default 'SHOOTING' | Trạng thái: `SHOOTING`, `DEVELOPED`, `SCANNED` |
| `created_at` | Timestamp | Not Null | Thời điểm tạo |
| `deleted_at` | Timestamp | Nullable | Thời điểm xóa mềm (BR-03) |

### 1.2 Bảng `FilmFrame` (Khung hình)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Khóa chính |
| `roll_id` | UUID | FK (FilmRoll), Not Null | Thuộc cuộn phim nào |
| `frame_number` | Integer | Not Null, Unique (roll_id, frame_number) | Số thứ tự khung hình |
| `lens` | String | Nullable | Ống kính sử dụng (VD: 50mm f/1.4) |
| `aperture` | String | Nullable | Khẩu độ (VD: f/2.8) |
| `shutter_speed`| String | Nullable | Tốc độ màn trập (VD: 1/250) |
| `notes` | Text | Nullable | Địa điểm, ghi chú bối cảnh |

---

## 2. Business Rules & Logic Ràng Buộc

*   **BR-03 (Xóa mềm):** Tuyệt đối không xóa cứng (hard delete) dữ liệu khỏi Database. Khi người dùng xóa cuộn phim/khung hình, chỉ cập nhật `deleted_at = now()`.
*   **BR-23 (Giới hạn vật lý của Frame):** Hệ thống từ chối thao tác lưu nếu `frame_number` vượt quá giới hạn vật lý của khổ phim:
    *   Khổ `135` (35mm): Tối đa `39` frame.
    *   Khổ `120_645`: Tối đa `16` frame.
    *   Khổ `120_66`: Tối đa `12` frame.
*   **BR-05 (Liên kết nộp bài):** Một khung hình (cặp `roll_id` và `frame_number`) đã được dùng để nộp cho cuộc thi A, thì không được phép chọn để nộp cho bài thi khác trong cùng 1 cuộc thi.
*   **Quy tắc chống trùng lặp:** Cặp giá trị (`roll_id`, `frame_number`) là duy nhất trong bảng `FilmFrame`. Trả về lỗi `MSG-12` nếu vi phạm.
*   **Quy tắc phân quyền:** Chỉ chủ sở hữu (`user_id` trùng với ID người dùng đăng nhập) mới có quyền Xem/Sửa/Xóa `FilmRoll` và `FilmFrame` của mình.

---

## 3. State Machine & Lifecycle

**Lifecycle của Cuộn phim (`FilmRoll`):**
*   `SHOOTING` (Đang chụp) -> `DEVELOPED` (Đã tráng) -> `SCANNED` (Đã scan).
*   **Quy tắc:** Chỉ chủ sở hữu (Participant) mới có quyền chuyển đổi trạng thái. Không cho phép chuyển lùi trạng thái.

---

## 4. Shared API Contracts (Dùng chung cho Web & Mobile)

### 4.1. Tạo Cuộn phim (`POST /api/v1/film-rolls`)
*   **Request Payload:**
    ```json
    {
      "filmStockId": "uuid-fs-123",
      "format": "135",
      "iso": 800,
      "cameraBodyId": "uuid-cam-456",
      "loadDate": "2026-10-20"
    }
    ```
    *(Validate: `iso` > 0, `loadDate` <= ngày hiện tại)*
*   **Response Payload (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "uuid-roll-789",
        "rollCode": "ROLL-2026-01",
        "status": "SHOOTING"
      }
    }
    ```

### 4.2. Thêm Khung hình (`POST /api/v1/film-rolls/{rollId}/frames`)
*   **Request Payload:**
    ```json
    {
      "frameNumber": 12,
      "lens": "50mm",
      "aperture": "f/2.8",
      "shutterSpeed": "1/250",
      "notes": "Chụp tại Hồ Gươm"
    }
    ```
*   **Response Payload (400 Bad Request - Vi phạm BR-23):**
    ```json
    {
      "status": "error",
      "code": "MSG-10",
      "message": "Số thứ tự khung hình (40) vượt quá giới hạn vật lý của khổ phim (135)."
    }
    ```

---

## 5. UI/UX Functional Requirements

### 5.1 Màn hình "My Film Rolls" (Danh sách cuộn phim)
*   **Hiển thị:** Dạng Grid/Cards. Mỗi card gồm `roll_code`, Tên phim, Khổ phim, Tiến độ (VD: `12/36 frames`), Badge màu trạng thái.
*   **Xử lý lỗi:** Nếu API lỗi -> Hiển thị màn hình "Không thể tải dữ liệu" kèm nút "Thử lại".

### 5.2 Màn hình "Roll Details" (Chi tiết cuộn phim)
*   **Thao tác:** User chọn 1 card -> Chuyển sang màn hình chi tiết.
*   **Hiển thị:** Thông tin Header (Film, ISO, Camera). Danh sách các Frame.
*   **Hành động:** Nút "+ Thêm Khung hình".

### 5.3 Form "Log Frame Metadata" (Popup/Drawer)
*   **Client-side Validation:** Khi user nhập số `40` cho cuộn 135, viền ô input lập tức chuyển màu đỏ, hiển thị text cảnh báo `MSG-10` ngay bên dưới. Vô hiệu hóa nút "Lưu".
*   **Lưu thành công:** Hiển thị Toast `MSG-09`, cập nhật lại bộ đếm `12/36 -> 13/36` trên UI mà không cần load lại trang.s