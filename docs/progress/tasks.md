# Bảng công việc

Trạng thái dùng chung gồm `TODO`, `DOING`, `BLOCKED`, `REVIEW`, `DONE`. Chuyển sang `DONE` khi đạt tiêu chí hoàn thành. Điền dấu `—` nếu chưa có hạn hoặc liên kết.

[Xem tổng quan Web, Backend và Mobile](overview.md).

Các dòng dưới đây được khôi phục từ commit trực tiếp của Hoàng Nam trên `develop`. `DONE` áp dụng cho phạm vi ghi ở từng dòng. Mã Jira được giữ theo commit, gồm cả cách ghi `FCP-137`. Các mã `FC-*` được đặt cho nhóm việc chưa tìm thấy mã Jira. Hạn và task Jira chưa có dấu vết Git cần bổ sung từ nhóm.

| Mã | Công việc | Người phụ trách | Hạn | Trạng thái | Tiêu chí hoàn thành | PR / kết quả / vướng mắc |
| --- | --- | --- | --- | --- | --- | --- |
| FPC-49 | Danh sách bài thi cho Organizer | @hnamhocit | — | DONE | API có lọc theo cuộc thi, hạng mục, trạng thái và cờ AI. | [`f028185`](https://github.com/hnamhocit/cnpm_110/commit/f028185b7ebcae23b9ed6648cb715b11a9ba1518) |
| FPC-50 | Duyệt và loại bài thi qua API | @hnamhocit | — | DONE | Có thao tác duyệt/loại, kiểm tra lý do loại và ghi nhật ký kiểm duyệt. | [`24baa31`](https://github.com/hnamhocit/cnpm_110/commit/24baa31af465f63ee5bbff5344948c0d39852936) |
| FPC-51 | API đối sánh ảnh bị gắn cờ | @hnamhocit | — | DONE | Có route đối sánh cung cấp dữ liệu ảnh và thông tin trùng lặp cho Organizer. | [`37144de`](https://github.com/hnamhocit/cnpm_110/commit/37144de5767326c294dfb29f17089da1dbe9efbb) |
| FCP-137 | Chuẩn hóa SRS, module 01–05 và hướng dẫn AI | @hnamhocit | — | DONE | SRS, đặc tả module và chỉ dẫn cho AI được cập nhật. | [`12436cf`](https://github.com/hnamhocit/cnpm_110/commit/12436cf776363dbcb33084b6081ef9845ca68dd3) |
| FC-001 | Chuẩn hóa route và phản hồi API cuộc thi | @hnamhocit | — | DONE | Có envelope, kiểm tra hai mốc hiện hành và xóa mềm. Lịch trình đủ 5 mốc được theo dõi riêng. | [`f4f37fd`](https://github.com/hnamhocit/cnpm_110/commit/f4f37fddc797e82e859b5a475b76db5c5a13b124), [`1fbd71d`](https://github.com/hnamhocit/cnpm_110/commit/1fbd71d8be2f63a35a509781eebd60c5742ef3a9), [`e59df3b`](https://github.com/hnamhocit/cnpm_110/commit/e59df3b469dd317bc4ee3ba812cf60dd4f34a1b5) |
| FC-002 | Tách route, controller và service Backend | @hnamhocit | — | DONE | Auth, contest, submission và AI webhook có các lớp riêng trong mã nguồn. | [`85705fc`](https://github.com/hnamhocit/cnpm_110/commit/85705fcf94d89a48cac96165c50a3cb820af9ead), [`083cce2`](https://github.com/hnamhocit/cnpm_110/commit/083cce2fe9f60b9a1c3139dd5db4de4f7d3538f9) |
| FC-003 | Điều chỉnh vòng đời DB trong kiểm thử tích hợp | @hnamhocit | — | DONE | Có helper tạo ứng dụng test và thay đổi xử lý pool/seed cho kiểm thử Auth và Submission. | [`8e0b61d`](https://github.com/hnamhocit/cnpm_110/commit/8e0b61da179fb1c081ecddf267186c702ef5e4ef), [`d5aa38e`](https://github.com/hnamhocit/cnpm_110/commit/d5aa38eb4baa421b45d926f6d63e07fbf2fdc5f4) |
| FC-004 | Đối chiếu SRS Word và đồng bộ danh mục API | @hnamhocit | — | DONE | SRS, 10 module, OpenAPI, Postman và chỉ dẫn AI được đối chiếu và cập nhật. | [`ba35117`](https://github.com/hnamhocit/cnpm_110/commit/ba351172cf850439b25a84c469f1e83e82546f93) |
| FC-005 | Sắp xếp docs AI và lập bảng theo dõi tiến độ | @hnamhocit | — | REVIEW | Module 01–10 ở docs/ai, có bảng giao việc, mẫu cập nhật và tổng quan độ phủ. | Đã kiểm tra trong workspace, chờ review |

Mẫu một dòng để thêm vào bảng:

```markdown
| FC-006 | <Việc cần làm> | @<github-handle> | YYYY-MM-DD | TODO | <Kết quả có thể kiểm tra được> | — |
```
