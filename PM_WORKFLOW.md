
# PM Git & Jira Workflow

## 1. Jira

PM chịu trách nhiệm:

* Tạo và quản lý Jira tasks.
* Mỗi task có:

  * Title rõ ràng.
  * Description.
  * Assignee.
  * Priority.
  * Acceptance Criteria nếu cần.
* Theo dõi trạng thái task.

### Jira Flow

```text
To Do → In Progress → Review → Done
```

PM cập nhật Jira theo tiến độ thực tế.

---

## 2. Assign Task

Khi giao task cho member:

```text
Jira: PROJ-123
Task: Login API
Assignee: Member A
Status: To Do
```

Member sẽ tự tạo branch dựa trên Jira ID.

---

## 3. Pull Request

Member hoàn thành task → tạo PR vào `develop`.

PM:

1. Kiểm tra PR.
2. Review nếu cần.
3. Resolve các vấn đề cần sửa.
4. Merge PR.
5. Update Jira → `Done` khi task hoàn tất.

PR nên có format:

```text
[PROJ-123] Login API
```

---

## 4. Merge

PM là người chịu trách nhiệm merge code vào `develop` / `main`.

Member **không cần tự xử lý merge conflict**.

Nếu có conflict:

```text
Member → báo PM
PM → xử lý conflict
```

---

## 5. PM Daily Checklist

* [ ] Jira task đã có đầy đủ thông tin.
* [ ] Task đã assign đúng người.
* [ ] Member đã chuyển task sang `In Progress`.
* [ ] PR đã được tạo.
* [ ] PR đã được review.
* [ ] Code đã merge.
* [ ] Jira đã được update.

---

## 6. Nguyên tắc

```text
Jira = Quản lý công việc
Git = Quản lý code
PM = Quản lý task + PR + merge
Member = Làm task + tạo PR
```
