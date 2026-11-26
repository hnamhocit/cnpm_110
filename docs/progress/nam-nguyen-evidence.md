# CINEGEN — Hồ sơ đóng góp Nam Nguyễn (hnamhocit)

### Phần của Nam Nguyễn (`hnamhocit`) · cập nhật ngày 2026-11-26

Đối chiếu các commit **do `hnamhocit@gmail.com` làm tác giả**, với hai tên Git `Hoang Nam` và `NGUYEN HOANG NAM`, cùng task và hồ sơ nghiệm thu. Không tính thao tác merge code của người khác thành phần tự triển khai. Phạm vi dưới đây gồm triển khai, sửa lỗi và kiểm thử qua nhiều sprint, không giới hạn ở M03/M09 hoặc Sprint 5.

| UC / phạm vi | Phần Nam đã thực hiện | Bằng chứng commit | Mức ghi nhận / còn lại |
| --- | --- | --- | --- |
| UC-01–05 · chung cả nhóm | Hoàn thiện Backend Auth/RBAC, phiên và quản trị tài khoản; cập nhật đăng nhập, hồ sơ trên Web/Mobile. | [28c674c](https://github.com/hnamhocit/cnpm_110/commit/28c674c), [d1fd5b2](https://github.com/hnamhocit/cnpm_110/commit/d1fd5b2), [32b397f](https://github.com/hnamhocit/cnpm_110/commit/32b397f) | UC chung đã DONE theo hồ sơ. Ghi nhận đóng góp Nam, vẫn để 5 UC chung cho cả nhóm. |
| UC-11–14 | API tạo/sao chép cuộc thi, lịch, hạng mục và tiêu chí; sửa sao chép vòng chấm; kiểm thử tích hợp. | [ddee40e](https://github.com/hnamhocit/cnpm_110/commit/ddee40e), [dc13d6d](https://github.com/hnamhocit/cnpm_110/commit/dc13d6d) | Backend DONE; client còn cần nghiệm thu. Không chỉ là vai trò điều phối module. |
| UC-15–16 | Backend cấu hình vòng chấm và phân công giám khảo theo hạng mục/vòng. | [7157fd0](https://github.com/hnamhocit/cnpm_110/commit/7157fd0) | Backend DONE; còn nghiệm thu tích hợp Web. |
| UC-18 | API danh sách bài Organizer với bộ lọc trạng thái và cờ AI. | [f028185](https://github.com/hnamhocit/cnpm_110/commit/f028185) | UC đã DONE theo hồ sơ; ghi nhận phần Backend của Nam. |
| UC-20 | API đối sánh bài nghi vấn với bài gốc; sửa hiển thị so sánh ảnh trên Web và dữ liệu demo. | [37144de](https://github.com/hnamhocit/cnpm_110/commit/37144de), [8459977](https://github.com/hnamhocit/cnpm_110/commit/8459977) | Có triển khai và sửa lỗi; UC còn PARTIAL, chưa ghi DONE AI toàn luồng. |
| UC-21–22 | API yêu cầu proof, deadline, xác minh và chặn duyệt trước xác minh; kiểm thử. | [4f4ef69](https://github.com/hnamhocit/cnpm_110/commit/4f4ef69), [dc13d6d](https://github.com/hnamhocit/cnpm_110/commit/dc13d6d) | Backend DONE; client còn cần nghiệm thu. |
| UC-23 | API duyệt/từ chối bài; lý do bắt buộc và audit khi loại bài. | [24baa31](https://github.com/hnamhocit/cnpm_110/commit/24baa31) | UC đã DONE theo hồ sơ; ghi nhận phần Backend của Nam. |
| UC-29–33 · đóng góp chấm thi | Sửa blind judging, tính điểm, khóa phiếu và các bất biến chấm; sửa hồi quy Web Judge và bổ sung kiểm thử. | [56c2576](https://github.com/hnamhocit/cnpm_110/commit/56c2576), [f06e312](https://github.com/hnamhocit/cnpm_110/commit/f06e312) | Ghi nhận sửa lỗi/kiểm thử; không nhận toàn bộ workspace Judge. Trạng thái từng UC xem phần 2, chưa hoàn tất cả nhóm UC. |
| UC-26 | Backend công bố kết quả từ vòng cuối, snapshot và khóa kết quả. | [91cc58f](https://github.com/hnamhocit/cnpm_110/commit/91cc58f) | Backend DONE; còn ca đồng điểm và nghiệm thu giao diện. |
| UC-27 | Backend quản lý triển lãm, preview công khai, bảo vệ ảnh gốc và xóa mềm. | [3cb12ad](https://github.com/hnamhocit/cnpm_110/commit/3cb12ad), [cfebeea](https://github.com/hnamhocit/cnpm_110/commit/cfebeea) | Backend DONE; còn nghiệm thu Web. |
| UC-41 | Backend kết quả, điểm và feedback đúng chủ bài sau công bố. | [1e31cf7](https://github.com/hnamhocit/cnpm_110/commit/1e31cf7) | Backend DONE; còn nghiệm thu client. |
| UC-37/40 · đóng góp luồng bài thi | Sửa validation/phân quyền bài thi, phản hồi dữ liệu, dữ liệu demo và kiểm chứng theo dõi trạng thái. | [f06e312](https://github.com/hnamhocit/cnpm_110/commit/f06e312), [8459977](https://github.com/hnamhocit/cnpm_110/commit/8459977) | Ghi nhận sửa lỗi và hỗ trợ nghiệm thu. UC-37 còn PARTIAL; UC-40 DONE theo hồ sơ, không nhận toàn bộ triển khai client. |
| M09 · FPC-130 | Đồng bộ tài liệu API/OpenAPI với hành vi route và cập nhật hợp đồng khi triển khai. | [1ac6dae](https://github.com/hnamhocit/cnpm_110/commit/1ac6dae), [dc13d6d](https://github.com/hnamhocit/cnpm_110/commit/dc13d6d) | Đã có đóng góp; task còn TODO trong bảng sprint vì chưa nghiệm thu toàn bộ endpoint. Không hiểu TODO là chưa làm gì. |
| M11 · FPC-132 | Email/thông báo nghiệp vụ, worker/retry, audit transaction; phục vụ proof, kiểm duyệt và công bố. | [3051f57](https://github.com/hnamhocit/cnpm_110/commit/3051f57) | IN REVIEW; E1/E3 đạt các ca đã ghi ở phần 3, còn nghiệm thu client và tra cứu audit UC-10. |
| Dữ liệu, tích hợp và kiểm thử · FPC-134 | Seed demo/nghiệm thu, kiểm chứng API, cấu hình/vòng/proof/preview/kết quả và hồi quy quyền. | [ffcc2bc](https://github.com/hnamhocit/cnpm_110/commit/ffcc2bc), [617297c](https://github.com/hnamhocit/cnpm_110/commit/617297c), [dc13d6d](https://github.com/hnamhocit/cnpm_110/commit/dc13d6d) | IN REVIEW; E1/E2 ghi nhận kiểm thử đã đạt, còn registration/Frame. Không cộng seed thành UC riêng. |

**Cách đọc số lượng:** riêng 6 task triển khai Backend DONE trong Sprint 5 (FPC-083/085/093/108/109/113) đã bao phủ **11 UC khác nhau: UC-11–16, UC-21–22, UC-26–27, UC-41**. Ngoài ra Nam còn triển khai UC-18/20/23 từ sprint trước, đóng góp UC-29–33, UC-37/40, 5 UC chung và các việc kỹ thuật trong bảng. Vì vậy **6/9 task Sprint 5 không phải tổng UC hoặc tỷ lệ hoàn thành toàn bộ phần Nam**. Các hàng đóng góp/sửa lỗi không tự động được tính là UC hoàn tất; trạng thái nghiệm thu chức năng vẫn xem phần 2.

### Bằng chứng kiểm thử

| Mã | Bằng chứng | Kết quả gần nhất |
| --- | --- | --- |
| E1 | [Integration Backend và audit](../../apps/api/tests/organizer-usecases.integration.test.ts) | 16 test, 120 assertions đạt. Ca gửi SMTP thật chạy riêng. |
| E2 | [Seed và API smoke test](../../apps/api/tests/acceptance-seed.integration.test.ts) | 9 test, 91 assertions đạt. Registration/Frame chưa thể nghiệm thu. |
| E3 | SMTP thật và luồng tự gửi | Email proof đã xác nhận trong hộp thư test. Worker tự xử lý request proof và retry, không cần lệnh gửi. |

39 test API hiện có, TypeScript API/Web, kiểm tra migration và diff đã đạt. E1/E2 bao phủ các ca ghi trong checklist, chưa xác nhận toàn bộ tổ hợp lỗi và concurrency. Những UC DONE từ trước giữ theo hồ sơ nghiệm thu nhóm.

## Chi tiết kiểm thử kỹ thuật cá nhân

### FPC-130 · Hợp đồng API

Chưa nghiệm thu tổng thể. Áp dụng từng ca cho từng endpoint thuộc UC-11–16, UC-21–22, UC-26–27 và UC-41.

| Test | Ca cần kiểm tra | Kết quả |
| --- | --- | --- |
| N130-01 | Method/path, quyền và schema, đối chiếu OpenAPI với Hono. | PARTIAL, đã sửa path triển lãm và alias feedback/result. |
| N130-02 | Request hợp lệ, HTTP status và response schema. | PARTIAL theo E1/E2. |
| N130-03 | Thiếu field bắt buộc, null và chuỗi rỗng. | Chưa đủ từng endpoint. |
| N130-04 | Sai type, enum, miền giá trị và timestamp. | Chưa đủ từng endpoint. |
| N130-05 | Thiếu token, sai chữ ký và hết hạn trên mọi route bảo vệ. | Test JWT chung đạt, chưa đủ từng route. |
| N130-06 | Participant/Judge gọi route Organizer. | Có ca E1, chưa đủ từng route. |
| N130-07 | O2 truy cập tài nguyên O1, kiểm tra dữ liệu trước/sau. | Có ca E1/E2, chưa đủ từng route. |
| N130-08 | ID không tồn tại và ID sai định dạng. | Chưa đủ từng endpoint. |
| N130-09 | UTC+7 qua request, response, DB và client. | Backend đạt E1, còn client. |
| N130-10 | Phân trang, bộ lọc, empty và cách ly cuộc thi. | Chưa đủ từng endpoint. |
| N130-11 | Lỗi có kiểm soát, response/log không lộ bí mật. | Chưa đủ từng endpoint. |
| N130-12 | Mutation lỗi không lưu dở dang hoặc đổi dữ liệu ngoài phạm vi. | Có ca E1, còn hồi quy đầy đủ. |
| N130-13 | Client thật dùng đúng method, URL, field, enum và status. | Chưa nghiệm thu toàn bộ client. |
| N130-14 | OpenAPI, ví dụ và client đồng bộ sau thay đổi. | PARTIAL, còn schema chi tiết và validation toàn tài liệu. |

### FPC-132 · Email, Notification, Audit

| Test | Nội dung nghiệm thu | Kết quả | Còn lại |
| --- | --- | --- | --- |
| N132-01 | Email proof đúng người, bài, loại và hạn qua SMTP thật. | PASS E3 | |
| N132-02 | P1 đọc thông báo và truy cập đúng bài/hạn. | PASS Backend E1 | Hiển thị client. |
| N132-03 | P2 không đọc thông báo/resource riêng của P1. | PASS E1 | |
| N132-04 | Sai owner/deadline không tạo sự kiện thành công. | PASS E1 | |
| N132-05 | Proof quá hạn giữ trạng thái chờ quyết định thủ công. | PASS E1 | |
| N132-06 | Duyệt/loại thông báo đúng Participant, trạng thái và lý do. | PASS E1 | |
| N132-07 | Công bố gửi đúng Participant của cuộc thi. | PASS Backend E1 | |
| N132-08 | Lỗi gửi lưu FAILED, giữ nghiệp vụ, không lộ secret. | PASS E1 | |
| N132-09 | Worker tự retry, lưu SENT và không tạo notification nghiệp vụ trùng. | PASS E1/E2 | Email có thể lặp nếu process dừng sau SMTP nhận, trước commit SENT. |
| N132-10 | Audit tạo/sửa Contest đúng actor và old/new. | PASS E1 | |
| N132-11 | Audit request proof, xác minh và duyệt khớp trạng thái/lý do. | PASS E1 | |
| N132-12 | Thiếu lý do bị chặn, quyết định hợp lệ có audit lý do. | PASS E1 | |
| N132-13 | Audit công bố khớp snapshot kết quả và lý do đồng điểm khi áp dụng. | PARTIAL | Audit công bố đạt E1, còn ca đồng điểm có lý do. |
| N132-14 | API AI và Judge ghi audit đúng thay đổi. | PASS tích hợp E1 | |
| N132-15 | Sai owner không có audit mutation thành công. | PASS E1 | |
| N132-16 | Quyền đọc audit/notification và loại bí mật khỏi log. | PARTIAL | Quyền đọc AuditLog chờ UC-10/FPC-125. |

### FPC-134 · Dữ liệu demo và API smoke test

| Test | Nội dung nghiệm thu | Kết quả | Còn lại |
| --- | --- | --- | --- |
| N134-01 | Migrate tự seed DB test mới, từ chối production/R2 thật. | PASS E2 | |
| N134-02 | Bảy tài khoản đăng nhập API thật, đúng role, lưu hash. | PASS E2 | |
| N134-03 | Contest/category đúng owner, mã duy nhất và FK hợp lệ. | PASS E2 | |
| N134-04 | Lịch, tiêu chí 100%, vòng, giải và assignment hợp lệ. | PASS E2 | |
| N134-05 | Registration, Roll/Frame và bài liên kết đúng Participant. | PARTIAL | Roll và metadata đạt, registration/Frame thiếu schema/API. |
| N134-06 | Scan/proof/preview tồn tại, đúng định dạng và quyền. | PASS E2 | |
| N134-07 | Điểm cuối 8.50/7.50 khớp phiếu và trọng số thật. | PASS E2 | |
| N134-08 | Fixture trước/sau công bố riêng, feedback đúng người. | PASS E2 | |
| N134-09 | Ca sai owner, thiếu proof và phiếu chưa khóa được cách ly. | PASS E2 | |
| N134-10 | Seed lặp không tăng bản ghi/file hoặc đổi trạng thái hiện tại. | PASS E2 | |
| N134-11 | Đăng nhập và đọc contest, bài, proof, preview, kết quả bằng API. | PASS E2 | |
| N134-12 | Alias, môi trường và quy trình tái tạo rõ, không chứa secret. | PASS E2 | [Hướng dẫn fixture](../../apps/api/README.md#fixture-nghiệm-thu). |
