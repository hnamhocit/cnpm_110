
# Git & Jira Team Workflow

## 1. Branch Strategy

Sử dụng `main` làm branch production và `develop` làm branch tích hợp.

```text
main
 │
 └── develop
      ├── feature/PROJ-123-login-api
      ├── feature/PROJ-124-user-profile
      ├── fix/PROJ-125-refresh-token
      └── refactor/PROJ-126-auth-service
```

### Branches

| Branch       | Purpose                     |
| ------------ | --------------------------- |
| `main`       | Production / stable         |
| `develop`    | Integration branch          |
| `feature/*`  | New feature                 |
| `fix/*`      | Bug fix                     |
| `refactor/*` | Refactoring                 |
| `chore/*`    | Tooling, config, dependency |
| `hotfix/*`   | Critical production fix     |

**Không commit trực tiếp vào `main` hoặc `develop`.**

---

# 2. Jira → Git

Mỗi task Jira phải có một branch riêng.

Ví dụ Jira:

```text
PROJ-123
Implement Google OAuth
```

Tạo branch:

```bash
git checkout develop
git pull origin develop

git checkout -b feature/PROJ-123-google-oauth
```

### Branch naming

```text
<type>/<JIRA-ID>-<short-description>
```

Examples:

```text
feature/PROJ-123-login
feature/PROJ-124-google-oauth
fix/PROJ-125-refresh-token
refactor/PROJ-126-auth-service
chore/PROJ-127-update-dependencies
```

Tên branch phải ngắn, rõ nghĩa và luôn chứa Jira issue ID.

---

# 3. Jira Issue Workflow

Mỗi issue đi theo flow:

```text
Backlog
   ↓
To Do
   ↓
In Progress
   ↓
Code Review
   ↓
Testing
   ↓
Done
```

### Quy tắc

**To Do**

Task đã được tạo và đủ thông tin để bắt đầu.

**In Progress**

Developer bắt đầu code.

**Code Review**

Đã tạo Pull Request và đang chờ review.

**Testing**

PR đã được approve và merge vào `develop`, đang được test.

**Done**

Feature/bug đã được verify và đáp ứng acceptance criteria.

---

# 4. Start Working on a Jira Task

Trước khi code:

```bash
git checkout develop
git pull origin develop
```

Tạo branch:

```bash
git checkout -b feature/PROJ-123-login
```

Sau đó chuyển Jira issue:

```text
To Do → In Progress
```

---

# 5. Commit Convention

Sử dụng Conventional Commits.

Format:

```text
<type>(<scope>): <description>
```

Types:

| Type       | Usage                       |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `refactor` | Code restructuring          |
| `docs`     | Documentation               |
| `test`     | Tests                       |
| `chore`    | Tooling/config/dependencies |
| `perf`     | Performance                 |
| `ci`       | CI/CD                       |
| `build`    | Build system                |

Examples:

```bash
git commit -m "feat(auth): add Google OAuth"
git commit -m "fix(auth): handle expired refresh token"
git commit -m "refactor(user): simplify profile service"
git commit -m "test(auth): add login integration tests"
git commit -m "chore(deps): update Prisma"
```

### Không dùng

```bash
git commit -m "update"
git commit -m "fix"
git commit -m "done"
git commit -m "test"
git commit -m "abc"
```

Commit message phải mô tả **thay đổi gì**, không phải trạng thái của developer.

---

# 6. Keep Your Branch Updated

Trong quá trình làm việc, `develop` có thể thay đổi.

Kiểm tra:

```bash
git fetch origin
```

Update branch:

```bash
git rebase origin/develop
```

Nếu có conflict:

```bash
# fix conflicts

git add .
git rebase --continue
```

Nếu muốn hủy:

```bash
git rebase --abort
```

### Quy tắc

Không merge `develop` liên tục vào feature branch bằng:

```bash
git merge develop
```

Ưu tiên:

```bash
git rebase origin/develop
```

để giữ history sạch.

---

# 7. Push Branch

Lần đầu:

```bash
git push -u origin feature/PROJ-123-login
```

Các lần sau:

```bash
git push
```

Nếu branch đã rebase:

```bash
git push --force-with-lease
```

**Không dùng:**

```bash
git push --force
```

---

# 8. Pull Request

Khi hoàn thành task:

```text
feature/PROJ-123-login
          ↓
       Pull Request
          ↓
       develop
```

PR title:

```text
[PROJ-123] Add login API
```

Hoặc:

```text
feat(auth): [PROJ-123] add login API
```

---

## PR Template

```md
## Jira

PROJ-123

## Description

Briefly describe what this PR does.

## Changes

- Add login endpoint
- Add JWT authentication
- Add validation
- Add login tests

## Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist

- [ ] Code follows project conventions
- [ ] No debug code / console.log
- [ ] Tests pass
- [ ] No unnecessary changes
- [ ] Documentation updated if necessary

## Screenshots

<!-- Add screenshots when UI changes -->
```

---

# 9. Pull Request Rules

Mỗi PR phải:

* Có Jira issue.
* Có description.
* Có reviewer.
* CI phải pass.
* Không có unresolved conflict.
* Không chứa unrelated changes.
* Không commit secrets.
* Không commit `.env`.
* Không bypass review để merge.

### Recommended

```text
1 Jira task
      ↓
1 branch
      ↓
1 PR
      ↓
1 logical change
```

Không gom nhiều task không liên quan vào một PR.

---

# 10. Code Review

Reviewer kiểm tra:

### Correctness

* Logic có đúng không?
* Có edge cases không?
* Error handling ổn không?

### Architecture

* Có đặt code đúng layer không?
* Có duplicate logic không?
* Có phá dependency boundary không?

### Security

* Có leak secret không?
* Input có được validate không?
* Authorization có đúng không?

### Performance

* Có query thừa không?
* Có N+1 không?
* Có unnecessary allocation / request không?

### Maintainability

* Naming rõ ràng?
* Function/class có quá lớn?
* Code có dễ test không?

---

# 11. Review Comments

Reviewer phân loại:

```text
BLOCKER
SUGGESTION
QUESTION
NIT
```

### BLOCKER

Phải sửa trước khi merge.

```text
BLOCKER: This endpoint does not verify ownership of the resource.
```

### SUGGESTION

Khuyến nghị cải thiện nhưng không nhất thiết block PR.

```text
SUGGESTION: This logic could be extracted into a helper.
```

### QUESTION

Cần clarification.

```text
QUESTION: Why do we need to query the database twice here?
```

### NIT

Minor style/readability issue.

```text
NIT: Could rename `data` to `user`.
```

Không biến code review thành tranh luận cá nhân.

---

# 12. Merge Strategy

Feature branch → `develop`

Prefer:

```text
Squash and merge
```

Mục tiêu:

```text
feature/PROJ-123-login
    ├── feat: add login schema
    ├── feat: add login service
    ├── fix: handle invalid token
    └── test: add login tests
              ↓
        squash
              ↓
feat(auth): [PROJ-123] add login
```

`develop` giữ history theo feature thay vì hàng loạt commit nhỏ.

---

# 13. After Merge

Sau khi PR được merge:

```bash
git checkout develop
git pull origin develop
```

Xóa local branch:

```bash
git branch -d feature/PROJ-123-login
```

Xóa remote branch nếu GitHub chưa tự xóa:

```bash
git push origin --delete feature/PROJ-123-login
```

Update Jira:

```text
Code Review
    ↓
Testing
```

Sau khi QA/tester verify:

```text
Testing
    ↓
Done
```

---

# 14. Release

Khi `develop` ổn định:

```text
develop
   ↓
release/v1.2.0
   ↓
   main
```

Release branch:

```bash
git checkout develop
git pull origin develop

git checkout -b release/v1.2.0
```

Sau khi testing:

```text
release/v1.2.0
       ↓
     main
```

Tag:

```bash
git checkout main
git pull origin main

git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

---

# 15. Hotfix Production

Production bug nghiêm trọng:

```text
main
 ↓
hotfix/PROJ-200-payment-crash
 ↓
main
 ↓
develop
```

Tạo branch:

```bash
git checkout main
git pull origin main

git checkout -b hotfix/PROJ-200-payment-crash
```

Fix → PR → `main`.

Sau đó phải đưa fix về `develop`:

```text
hotfix
  ├──→ main
  └──→ develop
```

Không để `main` và `develop` lệch nhau.

---

# 16. Daily Team Workflow

## Developer

```text
1. Open Jira
       ↓
2. Pick task
       ↓
3. Move → In Progress
       ↓
4. Create branch
       ↓
5. Code
       ↓
6. Commit
       ↓
7. Push
       ↓
8. Create PR
       ↓
9. Move → Code Review
       ↓
10. Fix review comments
       ↓
11. Merge
       ↓
12. Move → Testing
```

## Reviewer

```text
Open PR
   ↓
Check Jira
   ↓
Review code
   ↓
Run/test if necessary
   ↓
Approve / Request Changes
```

## Tester

```text
PR merged
   ↓
Testing
   ↓
Verify acceptance criteria
   ↓
Pass → Done
Fail → Reopen / create bug
```

---

# 17. Jira ↔ Git Relationship

Một task:

```text
Jira

PROJ-123
"Add Google OAuth"
        │
        │
        ▼
Git Branch

feature/PROJ-123-google-oauth
        │
        │
        ├── feat(auth): add Google OAuth config
        ├── feat(auth): add OAuth callback
        └── test(auth): add OAuth tests
        │
        ▼
Pull Request

[PROJ-123] Add Google OAuth
        │
        ▼
develop
        │
        ▼
Testing
        │
        ▼
Done
```

Jira là nơi quản lý **work**.

Git là nơi quản lý **code**.

PR là nơi kết nối **work ↔ code review ↔ merge**.

---

# 18. Rules — TL;DR

```text
1. Không push trực tiếp vào main/develop.

2. Mỗi Jira task = một branch.

3. Branch luôn chứa Jira ID.

4. Commit dùng Conventional Commits.

5. PR luôn reference Jira ticket.

6. Không merge PR nếu CI fail.

7. PR cần ít nhất 1 reviewer.

8. Feature branch rebase từ develop trước khi merge.

9. Prefer Squash & Merge.

10. Không commit secrets / .env.

11. Hotfix production phải được sync ngược về develop.

12. Jira phải được update theo trạng thái thực tế của code.
```

---

# 19. Quick Commands

### Start task

```bash
git checkout develop
git pull origin develop
git checkout -b feature/PROJ-123-task-name
```

### Commit

```bash
git add .
git commit -m "feat(scope): description"
```

### Push

```bash
git push -u origin feature/PROJ-123-task-name
```

### Update branch

```bash
git fetch origin
git rebase origin/develop
```

### Finish

```bash
git checkout develop
git pull origin develop
git branch -d feature/PROJ-123-task-name
```
