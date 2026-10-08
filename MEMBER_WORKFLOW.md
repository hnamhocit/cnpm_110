
# Member Git & Jira Workflow

## 1. Nhận Task

Vào Jira và xem task được assign.

```text
PROJ-123 - Login API
```

Chuyển task:

```text
To Do → In Progress
```

---

## 2. Tạo Branch

Luôn tạo branch từ `develop`.

```bash
git checkout develop
git pull
git checkout -b feature/PROJ-123-login
```

Format:

```text
feature/<JIRA-ID>-<short-name>
```

Ví dụ:

```text
feature/PROJ-123-login
feature/PROJ-124-user-profile
```

---

## 3. Code

Làm đúng phạm vi của Jira task.

Commit có thể dùng:

```bash
git add .
git commit -m "feat: add login API"
```

Không commit các file nhạy cảm như:

```text
.env
password
API keys
secrets
```

---

## 4. Push

```bash
git push -u origin feature/PROJ-123-login
```

---

## 5. Tạo Pull Request

Tạo PR:

```text
feature/PROJ-123-login → develop
```

Tên PR:

```text
[PROJ-123] Login API
```

Trong PR ghi ngắn gọn:

```text
## Changes
- Add login API
- Add validation

## Testing
- Tested login successfully
```

---

## 6. Sau Khi Tạo PR

Chuyển Jira:

```text
In Progress → Review
```

Sau đó chờ PM review và merge.

Nếu PM yêu cầu sửa:

```text
Sửa code
↓
commit
↓
push
↓
PR tự update
```

---

## 7. Nếu Có Merge Conflict

**Không cần tự xử lý.**

Báo PM:

```text
"PROJ-123 đang conflict, nhờ PM xử lý giúp."
```

---

## 8. Member Checklist

```text
Jira task
   ↓
In Progress
   ↓
Create branch
   ↓
Code
   ↓
Commit
   ↓
Push
   ↓
Create PR
   ↓
Review
   ↓
Fix nếu cần
   ↓
Done
```

### Chỉ cần nhớ

```text
1 Jira task = 1 branch = 1 PR
```
