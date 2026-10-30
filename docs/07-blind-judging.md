# Module Spec: 07 - Blind Judging (Chấm thi ẩn danh)

## 1. Domain Entities & Database Mapping

Module Blind Judging liên quan đến các nhóm dữ liệu:

- **Submission:** Bài dự thi được phân công cho Giám khảo.
- **Judge:** Giám khảo được phép chấm bài.
- **Judge Assignment:** Quan hệ phân công Giám khảo với bài dự thi.
- **Scorecard:** Phiếu chấm điểm và nhận xét của từng Giám khảo.
- **Final Score:** Kết quả tổng hợp điểm từ các Giám khảo được phân công.

### 1.1 Yêu cầu bảo vệ dữ liệu

- Phản hồi API dành cho Giám khảo phải loại bỏ thông tin nhận dạng của thí sinh.
- Không cung cấp tên, email, ảnh đại diện hoặc trường dữ liệu có thể trực tiếp nhận dạng thí sinh.
- Chỉ cung cấp dữ liệu cần thiết để chấm thi, như mã bài dự thi, ảnh, tiêu đề, lời giới thiệu tác phẩm và metadata kỹ thuật phù hợp.

### 1.2 Database Mapping

Tên bảng, khóa ngoại, ràng buộc và chỉ mục cần đối chiếu với schema chính thức của dự án.

Không tự giả định tên bảng hoặc cấu trúc cột khi chưa có đặc tả.

---

## 2. Business Rules & Logic Ràng Buộc

### 2.1 Trích xuất Business Rules từ SRS

- **BR-12 (Chấm thi ẩn danh kép - Double-Blind Judging):**
  - Phải bảo vệ danh tính thí sinh trong suốt giai đoạn chấm thi.
  - Backend phải loại bỏ tên, email, avatar và các thông tin trực tiếp nhận dạng thí sinh trước khi trả dữ liệu cho Giám khảo.
  - Giám khảo chỉ nhận thông tin cần thiết để đánh giá tác phẩm.
  - Bảo vệ danh tính phải được thực hiện tại tầng Backend Response/DTO; chỉ ẩn thông tin trên UI là không đủ.

- **BR-13 (Tính độc lập của Giám khảo - Judge Independence):**
  - Giám khảo phải đánh giá bài thi độc lập.
  - Khi vòng chấm chưa đóng, Giám khảo không được xem điểm số hoặc nhận xét của Giám khảo khác đối với cùng bài thi.
  - Backend phải kiểm soát quyền truy cập và dữ liệu trả về.
  - Điểm số và nhận xét của Giám khảo khác chỉ được phép hiển thị sau khi vòng chấm chính thức kết thúc, theo BR-13.

- **BR-14 (Phát hiện chênh lệch điểm - Score Discrepancy Detection):**
  - Hệ thống so sánh tổng điểm cao nhất và thấp nhất do các Giám khảo chấm cho cùng một bài thi.
  - Gọi:
    - `S_max`: Tổng điểm cao nhất.
    - `S_min`: Tổng điểm thấp nhất.
    - `S_scale`: Tổng điểm tối đa theo thang chấm.
  - Công thức:

    `Delta_S = S_max - S_min`

  - Gắn cờ `DISCREPANCY_CONFLICT` nếu:

    `Delta_S > 0.30 * S_scale`

  - Khi vượt ngưỡng:
    - Đánh dấu bài thi có chênh lệch điểm.
    - Thông báo cho Ban tổ chức hoặc Trưởng Ban Giám khảo.
    - Yêu cầu xử lý chênh lệch trước khi xác nhận kết quả cuối cùng.
  - Nếu chênh lệch đúng bằng 30% thang điểm thì không kích hoạt quy tắc này.

- **BR-25 (Tổng hợp điểm cuối cùng - Final Scoring):**
  - Điểm cuối cùng bằng trung bình cộng tổng điểm của các Giám khảo được phân công.
  - Làm tròn kết quả đến hai chữ số thập phân.
  - Với `n` Giám khảo:

    `S_final = round((S_1 + S_2 + ... + S_n) / n, 2)`

  - `S_j` là tổng điểm do Giám khảo thứ `j` nộp.
  - Vòng chấm phải đóng trước khi Giám khảo được xem điểm và nhận xét của Giám khảo khác.
  - Mọi chênh lệch điểm được gắn cờ theo BR-14 phải được xử lý trước khi xác nhận kết quả cuối cùng.

### 2.2 Nội dung cần xác nhận với nhóm

- Thao tác nào được coi là khóa phiếu chấm điểm của một Giám khảo?
- Phiếu chấm đã nộp có được mở lại để chỉnh sửa không?
- Ai có thẩm quyền giải quyết `DISCREPANCY_CONFLICT` và quy trình giải quyết cụ thể là gì?

---

## 3. State Machine & Lifecycle

### 3.1 Quy trình chấm thi ẩn danh

1. **Phân công bài thi**
   - Bài thi được phân công cho các Giám khảo theo quy trình của cuộc thi.
   - Backend chuẩn bị dữ liệu bài thi đã loại bỏ thông tin nhận dạng thí sinh.

2. **Chấm điểm độc lập**
   - Mỗi Giám khảo đánh giá và ghi nhận điểm số, nhận xét của mình.
   - Không được xem điểm hoặc nhận xét của Giám khảo khác khi vòng chấm còn mở.

3. **Tổng hợp điểm**
   - Hệ thống tính điểm trung bình từ các tổng điểm hợp lệ của Giám khảo được phân công.
   - Làm tròn kết quả đến hai chữ số thập phân.

4. **Kiểm tra chênh lệch**
   - Hệ thống so sánh tổng điểm cao nhất và thấp nhất.
   - Nếu chênh lệch vượt 30% thang điểm, gắn cờ `DISCREPANCY_CONFLICT`.
   - Chênh lệch phải được xử lý trước khi xác nhận kết quả cuối cùng.

5. **Kết thúc vòng chấm**
   - Vòng chấm được đóng chính thức.
   - Việc cho phép xem điểm và nhận xét của Giám khảo khác tuân theo BR-13.

### 3.2 Phân quyền

- **Judge:** Chấm các bài được phân công; không xem dữ liệu nhận dạng thí sinh hoặc điểm của Giám khảo khác khi vòng chấm còn mở.
- **Organizer / Head Judge:** Nhận cảnh báo chênh lệch điểm và phối hợp xử lý theo quyền được cấp.
- **System:** Ẩn danh dữ liệu, kiểm soát quyền truy cập, tính điểm và phát hiện chênh lệch.

---

## 4. Shared API Contracts (Dùng chung cho Web & Mobile)

### 4.1 API lấy danh sách bài được phân công

- Chỉ trả dữ liệu bài thi mà Giám khảo được phép xem.
- Không trả thông tin nhận dạng thí sinh.
- Tên endpoint, phương thức HTTP và JSON response cần xác nhận với API contract chính thức.

### 4.2 API nộp điểm và nhận xét

- Chỉ cho phép Giám khảo được phân công gửi điểm và nhận xét theo quy định của vòng chấm.
- Không làm lộ điểm hoặc nhận xét của Giám khảo khác.
- Cần xác nhận endpoint, cấu trúc request và điều kiện khóa phiếu chấm.

### 4.3 API tổng hợp kết quả và phát hiện chênh lệch

- Tính điểm trung bình và làm tròn hai chữ số thập phân.
- Kiểm tra ngưỡng chênh lệch theo BR-14.
- Không xác nhận kết quả cuối cùng khi còn chênh lệch chưa được xử lý.
- Cần xác nhận quyền gọi API và định dạng response.

---

## 5. UI/UX Functional Requirements

### 5.1 Giao diện Giám khảo

- Hiển thị các bài dự thi được phân công.
- Chỉ hiển thị dữ liệu cần thiết để đánh giá tác phẩm.
- Không hiển thị tên, email, avatar hoặc thông tin trực tiếp nhận dạng thí sinh.
- Có khu vực nhập điểm và nhận xét.
- Không hiển thị điểm hoặc nhận xét của Giám khảo khác khi vòng chấm còn mở.

### 5.2 Giao diện Ban tổ chức / Trưởng Ban Giám khảo

- Hiển thị các trường hợp có cờ `DISCREPANCY_CONFLICT`.
- Cung cấp thông tin cần thiết để phối hợp xử lý chênh lệch điểm.
- Không cho xác nhận kết quả cuối cùng khi còn chênh lệch chưa được giải quyết.

### 5.3 Trạng thái và thông báo

- Hiển thị trạng thái chấm thi phù hợp với quyền người dùng.
- Thông báo khi phát hiện chênh lệch vượt ngưỡng.
- Không để dữ liệu nhạy cảm bị lộ qua giao diện hoặc API.
