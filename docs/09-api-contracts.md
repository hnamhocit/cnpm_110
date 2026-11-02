# Module Spec: 09 - Shared API Contracts

## 1. Domain Entities & Database Mapping

### 1.1 Tổng quan

Tài liệu định nghĩa các DTO và hợp đồng API dùng chung
cho Backend, Web Next.js và Mobile Flutter.

### 1.2 Các nhóm DTO

- Authentication DTOs
- Contest DTOs
- Submission DTOs
- Archive & Exhibition DTOs
- Common Response DTO
- Pagination DTO

### 1.3 Database Mapping

Tài liệu API Contracts không trực tiếp định nghĩa
cấu trúc bảng database.

Việc ánh xạ giữa DTO và database cần đối chiếu
với schema chính thức của Backend.


## 2. Business Rules & Logic Ràng Buộc

### 2.1. API Response Standardization

- Các API cần sử dụng cấu trúc Response thống nhất giữa Backend, Web và Mobile.
- Chuẩn Response đề xuất gồm ba trường: `code`, `message`, `data`.
- HTTP Status phải phản ánh đúng kết quả xử lý.
- Không trả về mật khẩu, token hoặc dữ liệu bí mật trong thông báo lỗi.

### 2.2. DTO Validation Rules

- Backend phải kiểm tra các trường bắt buộc.
- UUID, email và DateTime phải đúng định dạng.
- Các trường số và chuỗi phải tuân thủ giới hạn đã định nghĩa.
- Web và Mobile sử dụng chung các DTO đã được nhóm thống nhất.

### 2.3. Error Handling Rules

- Các lỗi cần được ánh xạ sang HTTP Status phù hợp.
- Danh mục `MSG001–MSG028` hiện là đề xuất, cần được nhóm xác nhận.
- Không trả về stack trace hoặc thông tin nội bộ trong Response.
- Client không nên phụ thuộc vào chuỗi `message` để phân loại lỗi.

### 2.4. Implementation Notes

- OpenAPI hiện tại chưa hoàn toàn thống nhất với cấu trúc `{ code, message, data }`.
- Việc thay đổi hợp đồng API cần được nhóm thống nhất trước khi triển khai.


## 3. State Machine & Lifecycle

### 3.1. API Request Lifecycle

Quy trình xử lý một yêu cầu API:

1. **Receive Request:** Backend tiếp nhận HTTP Request từ Web hoặc Mobile.
2. **Validate Input:** Kiểm tra dữ liệu đầu vào theo Request DTO.
3. **Authenticate & Authorize:** Kiểm tra JWT và quyền RBAC đối với API yêu cầu xác thực.
4. **Process Request:** Thực hiện xử lý nghiệp vụ và truy cập dữ liệu khi cần.
5. **Generate Response:** Trả về HTTP Status và Response DTO tương ứng.

### 3.2. Error Handling Lifecycle

1. Backend phát hiện lỗi validation, xác thực, phân quyền hoặc nghiệp vụ.
2. Xác định HTTP Status phù hợp.
3. Ánh xạ mã MSG001–MSG028 nếu danh mục đã được nhóm phê duyệt.
4. Trả về thông báo lỗi theo API Contract đã thống nhất.
5. Web và Mobile hiển thị thông báo phù hợp.

### 3.3. Lifecycle Notes

- Đây là quy trình xử lý API ở mức tài liệu, không phải các trạng thái được lưu trong database.
- Không phải API nào cũng yêu cầu JWT hoặc RBAC.
- Cấu trúc Response và mã MSG cần được thống nhất với OpenAPI và backend trước khi triển khai.


## 4. Shared API Contracts

### 4.1. Standard Success Response

Tất cả API thuộc phạm vi chuẩn hóa sử dụng cấu trúc JSON thống nhất:

```json

{

  "code": 200,

  "message": "Success",

  "data": {}

}

```

**Field Definitions**

| Field | Data Type | Description |

|---|---|---|

| `code` | Integer | Mã trạng thái của kết quả xử lý |

| `message` | String | Thông báo mô tả kết quả |

| `data` | Object / Array / Null | Dữ liệu trả về từ API |

### 4.2. Success Response Example

Ví dụ API lấy thông tin cuộc thi:

```json

{

  "code": 200,

  "message": "Contest retrieved successfully",

  "data": {

    "id": "550e8400-e29b-41d4-a716-446655440000",

    "name": "Film Photography Contest",

    "status": "published"

  }

}

```

### 4.3. Error Response Example

Đề xuất cấu trúc phản hồi lỗi:

```json

{

  "code": 400,

  "message": "Invalid request data",

  "data": null

}

```

### 4.4. HTTP Status Codes

| HTTP Status | Description |

|---|---|

| 200 | OK – Yêu cầu thành công |

| 201 | Created – Tạo dữ liệu thành công |

| 400 | Bad Request – Dữ liệu không hợp lệ |

| 401 | Unauthorized – Chưa xác thực |

| 403 | Forbidden – Không có quyền |

| 404 | Not Found – Không tìm thấy dữ liệu |

| 409 | Conflict – Xung đột trạng thái dữ liệu |

| 500 | Internal Server Error – Lỗi máy chủ |

**Implementation Note:** Đây là chuẩn Response theo yêu cầu Jira. OpenAPI hiện tại vẫn có những cấu trúc Response khác, vì vậy cần được nhóm thống nhất trước khi áp dụng trên toàn bộ backend.

### 4.5 Common DTO Definitions

#### 4.5.1. DTO Overview

Data Transfer Object (DTO) là cấu trúc dữ liệu dùng để trao đổi thông tin giữa Client (Web Next.js, Mobile Flutter) và Backend API.

DTO được chia thành hai loại chính:

- **Request DTO:** Định nghĩa dữ liệu mà Client gửi đến Backend.

- **Response DTO:** Định nghĩa dữ liệu mà Backend trả về cho Client.

Mục tiêu của việc chuẩn hóa DTO là đảm bảo Web và Mobile sử dụng thống nhất tên trường, kiểu dữ liệu và cấu trúc JSON.

#### 4.5.2. Common Response DTO

Tất cả API thuộc phạm vi chuẩn hóa sử dụng cấu trúc Response chung:

```json

{

  "code": 200,

  "message": "Success",

  "data": {}

}

```

| Field | Data Type | Required | Description |

|---|---|---|---|

| `code` | Integer | Yes | Mã trạng thái phản hồi |

| `message` | String | Yes | Thông báo kết quả xử lý |

| `data` | Object / Array / Null | Yes | Dữ liệu trả về |

#### 4.5.3. Pagination DTO

Pagination DTO được sử dụng cho các API trả về danh sách dữ liệu có phân trang, ví dụ danh sách cuộc thi hoặc tác phẩm triển lãm.

**Pagination Response Example:**

```json

{

  "page": 1,

  "limit": 10,

  "total": 50,

  "totalPages": 5

}

```

| Field | Data Type | Description |

|---|---|---|

| `page` | Integer | Trang hiện tại |

| `limit` | Integer | Số bản ghi tối đa mỗi trang |

| `total` | Integer | Tổng số bản ghi |

| `totalPages` | Integer | Tổng số trang |

#### 4.5.4. Common Data Types

| Data Type | Description | Example |

|---|---|---|

| String | Chuỗi ký tự | `"Film Contest"` |

| Integer | Số nguyên | `200` |

| Number | Giá trị số | `9.5` |

| Boolean | Đúng hoặc sai | `true` |

| UUID | Định danh duy nhất | `"550e8400-e29b-41d4-a716-446655440000"` |

| DateTime | Ngày giờ theo ISO 8601 | `"2026-10-27T08:00:00Z"` |

| Array | Danh sách dữ liệu | `[]` |

| Object | Đối tượng JSON | `{}` |

| Null | Không có giá trị | `null` |

#### 4.5.5. DTO Validation Rules

- Các trường bắt buộc phải được kiểm tra trước khi xử lý.

- UUID phải đúng định dạng.

- Email phải có định dạng hợp lệ.

- Các trường số phải tuân thủ giới hạn quy định.

- Ngày giờ được biểu diễn theo chuẩn ISO 8601.

- Không trả về mật khẩu hoặc thông tin bí mật trong Response DTO.

- Backend phải kiểm tra dữ liệu đầu vào, không chỉ dựa vào validation của Web hoặc Mobile.

#### 4.5.6. Naming Convention

- Sử dụng `camelCase` cho tên trường JSON, ví dụ: `contestId`, `participantId`, `createdAt`.

- Tên trường trong Request và Response phải được thống nhất giữa Backend, Web và Mobile.

- Khi có sự khác biệt giữa tên cột database và tên trường JSON, Backend chịu trách nhiệm ánh xạ dữ liệu.

**Implementation Note:** Các quy ước DTO trong tài liệu này là đề xuất chuẩn hóa theo yêu cầu Jira. Một số API hiện tại có thể sử dụng tên trường hoặc cấu trúc Response khác, cần thống nhất với nhóm trước khi áp dụng.

### 4.6. Authentication DTOs

#### 4.6.1. Authentication DTO Overview

Authentication DTOs định nghĩa cấu trúc dữ liệu trao đổi giữa Client (Web Next.js, Mobile Flutter) và Backend trong quá trình xác thực người dùng.

Các chức năng bao gồm:

- Register – Đăng ký tài khoản.

- Login – Đăng nhập hệ thống.

- Refresh Token – Cấp lại Access Token.

- Logout – Đăng xuất hệ thống.

Các endpoint hiện được khai báo trong OpenAPI gồm `/auth/register`, `/auth/login`, `/auth/refresh` và `/auth/logout`.

#### 4.6.2. Register Request DTO

**Endpoint:** `POST /auth/register`

**Purpose:** Cho phép người dùng tạo tài khoản mới với vai trò Participant.

**Request JSON:**

```json

{

  "fullName": "Nguyen Van A",

  "email": "participant@example.com",

  "password": "SecurePass123!"

}

```

**Field Definitions:**

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `fullName` | String | Yes | Tối đa 100 ký tự |

| `email` | String | Yes | Đúng định dạng email, tối đa 255 ký tự |

| `password` | String | Yes | Từ 8 đến 128 ký tự |

**Validation Rules:**

- Không được bỏ trống các trường bắt buộc.

- Email phải đúng định dạng.

- Email không được trùng với tài khoản đã đăng ký.

- Password phải đáp ứng giới hạn độ dài.

- Không cho phép Client tự cấp quyền Admin hoặc Organizer khi đăng ký thông thường.

#### 4.6.3. Register Response DTO

**HTTP Status:** `201 Created`

**Proposed Standard Response:**

```json

{

  "code": 201,

  "message": "Registration successful",

  "data": {

    "user": {

      "id": "550e8400-e29b-41d4-a716-446655440000",

      "fullName": "Nguyen Van A",

      "email": "participant@example.com",

      "role": "Participant"

    },

    "accessToken": "example-access-token",

    "refreshToken": "example-refresh-token"

  }

}

```

**Response Rules:**

- Trả về thông tin người dùng đã đăng ký.

- Không trả về password hoặc password hash.

- Access Token được dùng để xác thực các yêu cầu API tiếp theo.

- Cách truyền và lưu Refresh Token phải tuân thủ chính sách bảo mật được nhóm thống nhất.

#### 4.6.4. Login Request DTO

**Endpoint:** `POST /auth/login`

**Purpose:** Xác thực người dùng bằng email và password.

**Request JSON:**

```json

{

  "email": "participant@example.com",

  "password": "SecurePass123!"

}

```

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `email` | String | Yes | Email hợp lệ |

| `password` | String | Yes | Không được để trống |

**Validation Rules:**

- Email và password là các trường bắt buộc.

- Backend kiểm tra thông tin đăng nhập.

- Tài khoản bị khóa không được phép đăng nhập.

#### 4.6.5. Login Response DTO

**HTTP Status:** `200 OK`

**Proposed Standard Response:**

```json

{

  "code": 200,

  "message": "Login successful",

  "data": {

    "user": {

      "id": "550e8400-e29b-41d4-a716-446655440000",

      "fullName": "Nguyen Van A",

      "email": "participant@example.com",

      "role": "Participant"

    },

    "accessToken": "example-access-token",

    "refreshToken": "example-refresh-token"

  }

}

```

**Response Rules:**

- Trả về thông tin người dùng và thông tin xác thực cần thiết.

- Không trả về password.

- Client sử dụng Access Token để gọi các API yêu cầu xác thực.

- Refresh Token phải được bảo vệ và không ghi vào log.

#### 4.6.6. Refresh Token Request DTO

**Endpoint:** `POST /auth/refresh`

**Purpose:** Cấp Access Token mới khi Access Token hiện tại hết hạn.

**Request JSON theo OpenAPI hiện tại:**

```json

{

  "refreshToken": "example-refresh-token"

}

```

| Field | Data Type | Required | Description |

|---|---|---|---|

| `refreshToken` | String | Yes | Refresh Token hợp lệ |

**Validation Rules:**

- Refresh Token phải hợp lệ và chưa hết hạn.

- Token đã bị thu hồi không được sử dụng.

- Backend thực hiện Token Rotation theo cơ chế xác thực của hệ thống.

#### 4.6.7. Refresh Token Response DTO

**HTTP Status:** `200 OK`

**Proposed Standard Response:**

```json

{

  "code": 200,

  "message": "Token refreshed successfully",

  "data": {

    "accessToken": "new-example-access-token",

    "refreshToken": "new-example-refresh-token"

  }

}

```

**Response Rules:**

- Trả về Access Token mới.

- Refresh Token được thay thế theo cơ chế Token Rotation.

- Không công khai token trong log hoặc thông báo lỗi.

#### 4.6.8. Logout Request DTO

**Endpoint:** `POST /auth/logout`

**Purpose:** Đăng xuất và thu hồi Refresh Token.

**Request JSON theo OpenAPI hiện tại:**

```json

{

  "refreshToken": "example-refresh-token"

}

```

| Field | Data Type | Required | Description |

|---|---|---|---|

| `refreshToken` | String | Yes | Token cần thu hồi |

#### 4.6.9. Logout Response DTO

**HTTP Status:** `200 OK`

**Proposed Standard Response:**

```json

{

  "code": 200,

  "message": "Logout successful",

  "data": null

}

```

**Response Rules:**

- Backend thu hồi Refresh Token tương ứng.

- Client xóa Access Token đang lưu giữ.

- Không cho phép sử dụng lại Refresh Token đã bị thu hồi.

#### 4.6.10. Authentication Error Handling

| HTTP Status | Error Scenario | Description |

|---|---|---|

| 400 | Invalid Request | Thiếu trường hoặc dữ liệu không hợp lệ |

| 401 | Invalid Credentials | Email hoặc password không đúng |

| 401 | Invalid Refresh Token | Refresh Token không hợp lệ hoặc hết hạn |

| 403 | Account Locked | Tài khoản bị khóa |

| 409 | Email Already Exists | Email đã được đăng ký |

**Proposed Error Response:**

```json

{

  "code": 401,

  "message": "Invalid email or password",

  "data": null

}

```

Các trường hợp lỗi sẽ được ánh xạ với mã thông báo `MSG001–MSG028` sau khi danh mục mã được thống nhất.

#### 4.6.11. Security Requirements

- Sử dụng HTTPS khi triển khai môi trường production.

- Không trả về password hoặc password hash trong API Response.

- Access Token được gửi trong header `Authorization: Bearer <token>` khi gọi API cần xác thực.

- Refresh Token phải được lưu trữ an toàn.

- Theo chính sách bảo mật dự án, ưu tiên truyền Refresh Token qua cookie `HttpOnly`, `Secure`, `SameSite=Strict`; OpenAPI hiện tại vẫn mô tả Refresh Token trong JSON body/response, nên cần thống nhất lại với nhóm.

- Backend kiểm tra quyền truy cập bằng JWT và RBAC.

- Không ghi token hoặc dữ liệu xác thực nhạy cảm vào log.

**Implementation Note:** Tên trường Request dựa trên OpenAPI hiện tại. Các Response đã được bọc trong cấu trúc `{ code, message, data }` theo yêu cầu Jira nên là hợp đồng chuẩn hóa đề xuất, chưa phải phản hồi đã được xác nhận từ backend.

### 4.7. Contest DTOs

#### 4.7.1. Contest DTO Overview

Contest DTOs định nghĩa cấu trúc dữ liệu trao đổi giữa Web Next.js, Mobile Flutter và Backend trong quá trình quản lý cuộc thi nhiếp ảnh phim.

Các chức năng bao gồm:

- Create Contest – Tạo cuộc thi mới.

- Get Contest List – Lấy danh sách cuộc thi.

- Get Contest Detail – Xem chi tiết cuộc thi.

- Update Contest – Cập nhật thông tin cuộc thi.

- Delete Contest – Xóa cuộc thi.

Các endpoint hiện được khai báo trong OpenAPI gồm `/contests` và `/contests/{id}`.

#### 4.7.2. Create Contest Request DTO

**Endpoint:** `POST /contests`

**Purpose:** Cho phép người dùng có quyền tạo cuộc thi mới.

**Request JSON:**

```json

{

  "name": "Film Photography Contest 2026",

  "description": "Annual film photography competition",

  "startAt": "2026-11-01T00:00:00Z",

  "endAt": "2026-12-01T23:59:59Z",

  "status": "draft"

}

```

**Field Definitions:**

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `name` | String | Theo quy tắc backend | Tối đa 150 ký tự |

| `description` | String / Null | No | Mô tả cuộc thi |

| `startAt` | DateTime / Null | No | Định dạng ISO 8601 |

| `endAt` | DateTime / Null | No | Định dạng ISO 8601 |

| `status` | String | No | Mặc định `draft` |

**Validation Rules:**

- Tên cuộc thi không được vượt quá 150 ký tự.

- `startAt` và `endAt` phải đúng định dạng ngày giờ.

- Đề xuất kiểm tra `endAt` lớn hơn `startAt` khi cả hai được cung cấp.

- Backend phải kiểm tra quyền tạo cuộc thi.

- Trạng thái cuộc thi phải thuộc danh sách được hỗ trợ.

**Allowed Status Values theo OpenAPI hiện tại:**

`draft`, `published`, `ongoing`, `completed`, `cancelled`.

#### 4.7.3. Create Contest Response DTO

**HTTP Status:** `201 Created`

**Proposed Standard Response:**

```json

{

  "code": 201,

  "message": "Contest created successfully",

  "data": {

    "id": "550e8400-e29b-41d4-a716-446655440000",

    "name": "Film Photography Contest 2026",

    "description": "Annual film photography competition",

    "start_at": "2026-11-01T00:00:00Z",

    "end_at": "2026-12-01T23:59:59Z",

    "status": "draft",

    "created_by": "650e8400-e29b-41d4-a716-446655440001",

    "created_at": "2026-10-27T08:00:00Z",

    "updated_at": "2026-10-27T08:00:00Z"

  }

}

```

**Response Rules:**

- Trả về thông tin cuộc thi đã được tạo.

- `id` là UUID của cuộc thi.

- `created_by` xác định người tạo cuộc thi.

- Không trả về dữ liệu nhạy cảm không cần thiết.

#### 4.7.4. Get Contest List Request DTO

**Endpoint:** `GET /contests`

**Purpose:** Lấy danh sách cuộc thi có hỗ trợ tìm kiếm, lọc trạng thái và phân trang.

**Query Parameters:**

| Parameter | Data Type | Required | Validation |

|---|---|---|---|

| `search` | String | No | Tìm kiếm theo tên |

| `status` | String | No | `published` hoặc `ongoing` |

| `page` | Integer | No | Tối thiểu 1, mặc định 1 |

| `limit` | Integer | No | 1–100, mặc định 10 |

**Request Example:**

```http

GET /contests?status=published&page=1&limit=10

```

#### 4.7.5. Get Contest List Response DTO

**HTTP Status:** `200 OK`

**Proposed Standard Response:**

```json

{

  "code": 200,

  "message": "Contests retrieved successfully",

  "data": {

    "items": [

      {

        "id": "550e8400-e29b-41d4-a716-446655440000",

        "name": "Film Photography Contest 2026",

        "status": "published"

      }

    ],

    "pagination": {

      "page": 1,

      "limit": 10,

      "total": 1,

      "totalPages": 1

    }

  }

}

```

**Response Rules:**

- `items` chứa danh sách cuộc thi.

- `pagination` chứa thông tin phân trang.

- Nếu không có cuộc thi phù hợp, trả về `items` là mảng rỗng.

- Không trả về thông tin ngoài phạm vi cho phép.

**Implementation Note:** OpenAPI hiện tại sử dụng `data` là mảng cuộc thi và `pagination` nằm ngoài `data`. Cấu trúc `data.items` và `data.pagination` ở ví dụ trên là đề xuất chuẩn hóa, cần được nhóm xác nhận.

#### 4.7.6. Get Contest Detail DTO

**Endpoint:** `GET /contests/{id}`

**Purpose:** Lấy thông tin chi tiết của một cuộc thi.

**Path Parameter:**

| Parameter | Data Type | Required | Validation |

|---|---|---|---|

| `id` | UUID | Yes | UUID hợp lệ |

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Contest retrieved successfully",

  "data": {

    "id": "550e8400-e29b-41d4-a716-446655440000",

    "name": "Film Photography Contest 2026",

    "description": "Annual film photography competition",

    "start_at": "2026-11-01T00:00:00Z",

    "end_at": "2026-12-01T23:59:59Z",

    "status": "published"

  }

}

```

**Validation Rules:**

- `id` phải là UUID hợp lệ.

- Cuộc thi phải tồn tại.

- Nếu không tìm thấy, trả về HTTP 404.

#### 4.7.7. Update Contest Request DTO

**Endpoint:** `PUT /contests/{id}`

**Purpose:** Cập nhật thông tin cuộc thi.

**Request JSON:**

```json

{

  "name": "Updated Film Photography Contest 2026",

  "description": "Updated contest description"

}

```

**Field Definitions:**

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `name` | String | No | Tối đa 150 ký tự |

| `description` | String / Null | No | Mô tả cuộc thi |

| `startAt` | DateTime / Null | No | ISO 8601 |

| `endAt` | DateTime / Null | No | ISO 8601 |

| `status` | String | No | Giá trị trạng thái hợp lệ |

**Validation Rules:**

- `id` phải là UUID hợp lệ.

- Người dùng phải có quyền cập nhật cuộc thi.

- Các trường được gửi phải hợp lệ.

- Đề xuất yêu cầu ít nhất một trường cần cập nhật.

- Không cho phép cập nhật dữ liệu kết quả đã khóa trái với BR-16.

#### 4.7.8. Update Contest Response DTO

**HTTP Status:** `200 OK`

**Proposed Standard Response:**

```json

{

  "code": 200,

  "message": "Contest updated successfully",

  "data": {

    "id": "550e8400-e29b-41d4-a716-446655440000",

    "name": "Updated Film Photography Contest 2026",

    "description": "Updated contest description",

    "status": "draft"

  }

}

```

**Response Rules:**

- Trả về dữ liệu cuộc thi sau khi cập nhật.

- Không cho phép thao tác cập nhật vượt quá quyền được cấp.

- Các thay đổi phải tuân thủ quy tắc nghiệp vụ của cuộc thi.

#### 4.7.9. Delete Contest DTO

**Endpoint:** `DELETE /contests/{id}`

**Purpose:** Xóa cuộc thi theo quyền được cấp.

**Request:** Không có JSON body.

**Path Parameter:** `id` – UUID của cuộc thi.

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Contest deleted successfully",

  "data": null

}

```

**Validation Rules:**

- Cuộc thi phải tồn tại.

- Người dùng phải có quyền xóa cuộc thi.

- Đề xuất sử dụng Soft Delete theo BR-03 thay vì xóa vật lý đối với dữ liệu cần lưu trữ.

- Không được làm mất dữ liệu kết quả đã công bố hoặc vi phạm yêu cầu lưu trữ.

**Implementation Note:** OpenAPI hiện tại có endpoint DELETE nhưng chưa xác định rõ cơ chế Soft Delete. Cần thống nhất cách triển khai với nhóm.

#### 4.7.10. Contest Error Handling

| HTTP Status | Error Scenario | Description |

|---|---|---|

| 400 | Invalid Contest Data | Dữ liệu cuộc thi không hợp lệ |

| 401 | Unauthorized | Chưa xác thực |

| 403 | Forbidden | Không có quyền quản lý |

| 404 | Contest Not Found | Không tìm thấy cuộc thi |

| 409 | Invalid Contest State | Trạng thái cuộc thi không cho phép thao tác |

**Proposed Error Response:**

```json

{

  "code": 404,

  "message": "Contest not found",

  "data": null

}

```

Các trường hợp lỗi cần được ánh xạ với danh mục `MSG001–MSG028` sau khi nhóm thống nhất nội dung từng mã.

#### 4.7.11. Security & Integration Requirements

- Các API tạo, cập nhật và xóa cuộc thi yêu cầu JWT Access Token.

- Backend áp dụng RBAC để kiểm tra quyền quản lý cuộc thi.

- Web và Mobile sử dụng chung các DTO đã thống nhất.

- Không cho phép sửa điểm số, giải thưởng hoặc kết quả đã khóa theo BR-16.

- Không tự động cho phép thay đổi trạng thái cuộc thi nếu chưa đáp ứng quy tắc nghiệp vụ.

- Không trả về thông tin nhạy cảm trong Response.

**Implementation Note:** Các Request DTO và endpoint dựa trên OpenAPI hiện tại. Response được chuẩn hóa theo cấu trúc `{ code, message, data }` của Jira và chưa phải hợp đồng đã triển khai. OpenAPI hiện dùng `snake_case` trong một số trường Contest Response, trong khi Request sử dụng `camelCase`; việc thống nhất tên trường cần được nhóm quyết định.

### 4.8. Submission DTOs

#### 4.8.1. Submission DTO Overview

Submission DTOs định nghĩa cấu trúc dữ liệu trao đổi giữa Client (Web Next.js, Mobile Flutter) và Backend khi người tham gia gửi tác phẩm dự thi nhiếp ảnh phim.

Các thông tin bao gồm:

- Thông tin cuộc thi và hạng mục.

- Tên tác phẩm và mô tả.

- Thông số kỹ thuật phim (Film Metadata).

- File ảnh dự thi (Original Image).

- Bằng chứng âm bản (Negative Proof).

Theo OpenAPI hiện tại, chức năng nộp bài sử dụng endpoint:

`POST /api/v1/submissions`

Request sử dụng `multipart/form-data` để gửi dữ liệu và file ảnh, không phải JSON thuần túy.

#### 4.8.2. Create Submission Request DTO

**Endpoint:** `POST /api/v1/submissions`

**Content-Type:** `multipart/form-data`

**Purpose:** Cho phép Participant gửi tác phẩm tham gia cuộc thi.

**Form Data Example:**

| Field | Example Value |

|---|---|

| `contestId` | `550e8400-e29b-41d4-a716-446655440000` |

| `categoryId` | `650e8400-e29b-41d4-a716-446655440001` |

| `title` | `Sunset on Film` |

| `description` | `A sunset captured using analog film` |

| `filmBrand` | `Kodak` |

| `filmStock` | `Kodak Portra 400` |

| `filmFormat` | `35mm` |

| `isoRated` | `400` |

| `isoShot` | `400` |

| `cameraBody` | `Canon AE-1` |

| `lens` | `50mm f/1.8` |

| `image` | `sunset.jpg` |

| `negativeProof` | `negative-proof.jpg` |

**Field Definitions:**

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `contestId` | UUID | Yes | UUID hợp lệ |

| `categoryId` | UUID | Yes | UUID hợp lệ |

| `title` | String | Yes | Tối đa 255 ký tự |

| `description` | String | No | Tối đa 5000 ký tự |

| `filmBrand` | String | Yes | Tối đa 100 ký tự |

| `filmStock` | String | Yes | Tối đa 150 ký tự |

| `filmFormat` | String | Yes | Tối đa 50 ký tự |

| `isoRated` | Integer | Yes | Lớn hơn hoặc bằng 1 |

| `isoShot` | Integer | Yes | Lớn hơn hoặc bằng 1 |

| `cameraBody` | String | Yes | Tối đa 150 ký tự |

| `lens` | String | No | Tối đa 150 ký tự |

| `rollId` | String | No | Tối đa 100 ký tự |

| `frameNumber` | String | No | Tối đa 20 ký tự |

| `devLabName` | String | No | Tối đa 150 ký tự |

| `devChemistry` | String | No | Tối đa 50 ký tự |

| `scannerModel` | String | No | Tối đa 150 ký tự |

| `image` | Binary File | Yes | Tối đa 100 MiB, tối thiểu 1000 × 1000 pixel |

| `negativeProof` | Binary File | No | Tối đa 20 MiB |

**Validation Rules:**

- Các trường bắt buộc không được bỏ trống.

- `contestId` và `categoryId` phải có định dạng UUID hợp lệ.

- `isoRated` và `isoShot` phải là số nguyên dương.

- File ảnh phải đáp ứng giới hạn kích thước và độ phân giải.

- Backend phải kiểm tra quyền nộp bài.

- Hạng mục được chọn phải thuộc cuộc thi tương ứng.

#### 4.8.3. Film Metadata DTO

Film Metadata DTO lưu thông tin kỹ thuật liên quan đến ảnh phim.

**Metadata Example:**

```json

{

  "filmBrand": "Kodak",

  "filmStock": "Kodak Portra 400",

  "filmFormat": "35mm",

  "isoRated": 400,

  "isoShot": 400,

  "cameraBody": "Canon AE-1",

  "lens": "50mm f/1.8",

  "rollId": "ROLL001",

  "frameNumber": "12",

  "devLabName": "Film Lab",

  "devChemistry": "C-41",

  "scannerModel": "Epson V600"

}

```

**Field Definitions:**

| Field | Data Type | Description |

|---|---|---|

| `filmBrand` | String | Thương hiệu phim |

| `filmStock` | String | Loại phim sử dụng |

| `filmFormat` | String | Khổ phim |

| `isoRated` | Integer | ISO danh định của phim |

| `isoShot` | Integer | ISO sử dụng khi chụp |

| `cameraBody` | String | Tên máy ảnh |

| `lens` | String | Ống kính |

| `rollId` | String | Mã cuộn phim |

| `frameNumber` | String | Số khung hình |

| `devLabName` | String | Phòng lab tráng phim |

| `devChemistry` | String | Hóa chất/quy trình tráng phim |

| `scannerModel` | String | Thiết bị scan phim |

**Implementation Note:** JSON trên chỉ minh họa nhóm trường metadata. Khi gửi `POST /api/v1/submissions`, các trường được truyền trực tiếp trong `multipart/form-data`, không gửi một đối tượng JSON `filmMetadata` riêng trừ khi API được thay đổi.

#### 4.8.4. Submission Response DTO

**HTTP Status:** `201 Created`

**Proposed Standard Response:**

```json

{

  "code": 201,

  "message": "Submission created successfully",

  "data": {

    "id": "750e8400-e29b-41d4-a716-446655440002",

    "contestId": "550e8400-e29b-41d4-a716-446655440000",

    "categoryId": "650e8400-e29b-41d4-a716-446655440001",

    "participantId": "850e8400-e29b-41d4-a716-446655440003",

    "title": "Sunset on Film",

    "status": "PENDING_AI",

    "fileSizeBytes": 2048576,

    "width": 3000,

    "height": 2000

  }

}

```

**Response Rules:**

- Trả về UUID của bài dự thi vừa được tạo.

- Trả về thông tin cần thiết để Client hiển thị trạng thái nộp bài.

- Không trả về thông tin xác thực hoặc khóa truy cập Cloudflare R2.

- Không công khai đường dẫn ảnh Master hoặc Negative Proof cho người dùng không có quyền.

**Implementation Note:** OpenAPI hiện tại trả về `success` và `data` cho endpoint nộp bài. Ví dụ trên là cấu trúc Response đề xuất theo chuẩn Jira.

#### 4.8.5. Submission Status

Theo database schema hiện tại, trường `submissions.status` hỗ trợ các trạng thái:

| Status | Description |

|---|---|

| `PENDING_AI` | Bài dự thi đang chờ xử lý hoặc kiểm tra AI |

| `FLAGGED` | Bài dự thi được đánh dấu để kiểm tra |

| `APPROVED` | Bài dự thi đã được phê duyệt |

| `DISQUALIFIED` | Bài dự thi bị loại |

**Validation Rules:**

- Trạng thái bài dự thi phải thuộc danh sách được hỗ trợ.

- Client không được tự ý thay đổi trạng thái bằng Request nộp bài.

- Việc chuyển trạng thái phải được Backend kiểm tra theo quyền và quy tắc nghiệp vụ.

- Khi kết quả cuộc thi đã công bố, thông tin bài thi đạt giải phải tuân thủ BR-16.

#### 4.8.6. Image & Negative Proof DTO

**Image File:**

| Field | Data Type | Required | Description |

|---|---|---|---|

| `image` | Binary File | Yes | Ảnh chính của bài dự thi |

| `negativeProof` | Binary File | No | Ảnh bằng chứng âm bản |

**Business Rules:**

- Ảnh chính phải đáp ứng giới hạn kích thước và độ phân giải.

- Negative Proof có thể không bắt buộc khi nộp bài ban đầu.

- Tác phẩm đạt giải phải có bằng chứng âm bản đã được xác minh trước khi công bố kết quả theo BR-06.

- Ảnh Master và Negative Proof phải được bảo vệ trong Private Storage.

- Ảnh công khai cho triển lãm phải sử dụng bản WebP đã xử lý và có watermark theo BR-17.

#### 4.8.7. Submission Error Handling

| HTTP Status | Error Scenario | Description |

|---|---|---|

| 400 | Invalid Submission Data | Dữ liệu bài dự thi không hợp lệ |

| 401 | Unauthorized | Người dùng chưa xác thực |

| 403 | Forbidden | Không có quyền nộp bài |

| 413 | File Too Large | File hoặc request vượt giới hạn |

| 415 | Unsupported Media Type | Content-Type không phải `multipart/form-data` |

**Proposed Standard Error Response:**

```json

{

  "code": 400,

  "message": "Invalid submission data",

  "data": null

}

```

Các trường hợp lỗi cần được ánh xạ với danh mục `MSG001–MSG028` sau khi nhóm thống nhất nội dung từng mã.

#### 4.8.8. Security & Integration Requirements

- API nộp bài yêu cầu JWT Access Token.

- Backend xác định người nộp bài từ thông tin xác thực, không tin tưởng `participantId` do Client tự cung cấp.

- Backend kiểm tra quyền truy cập và dữ liệu đầu vào.

- Không trả về khóa truy cập Private Bucket.

- Web Next.js và Mobile Flutter sử dụng chung tên trường Form Data.

- File ảnh phải được gửi bằng `multipart/form-data`.

- Không ghi nội dung file, token hoặc dữ liệu nhạy cảm vào log.

- Việc truy cập ảnh Master và Negative Proof phải tuân thủ chính sách bảo mật của hệ thống.

**Implementation Note:** Request DTO và giới hạn dữ liệu dựa trên OpenAPI hiện tại. Response DTO được chuẩn hóa theo `{ code, message, data }` theo yêu cầu Jira và cần được nhóm xác nhận trước khi áp dụng vào Backend.

### 4.9. Archive & Exhibition DTOs

#### 4.9.1. Archive & Exhibition DTO Overview

Archive & Exhibition DTOs định nghĩa cấu trúc dữ liệu trao đổi giữa Web Next.js, Mobile Flutter và Backend trong quá trình công bố kết quả, lưu trữ tác phẩm và tổ chức triển lãm ảnh trực tuyến.

Các chức năng chính bao gồm:

- Publish Official Results – Công bố kết quả chính thức.

- Archive Contest Results – Lưu trữ tác phẩm đạt giải và vào chung kết.

- Get Published Results – Xem kết quả đã công bố.

- Get Exhibition Gallery – Xem và tìm kiếm tác phẩm triển lãm.

- Get Exhibition Detail – Xem thông tin chi tiết tác phẩm.

- Process Exhibition Image – Tạo ảnh WebP và đóng watermark.

- Get Processing Status – Kiểm tra trạng thái xử lý ảnh.

**Implementation Status:** Các endpoint trong mục này là đề xuất dựa trên SRS và tài liệu `08-archive-and-exhibition.md`. Chúng chưa được khai báo trong OpenAPI hiện tại và cần được nhóm thống nhất trước khi triển khai.

#### 4.9.2. Publish Official Results DTO

**Endpoint:** `POST /api/v1/contests/{contestId}/publish-results`

**Purpose:** Công bố kết quả cuộc thi và khóa dữ liệu theo BR-16.

**Authorization:** Organizer được phân quyền quản lý cuộc thi.

**Request DTO:**

```json

{

  "confirm": true

}

```

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `confirm` | Boolean | Yes | Phải bằng `true` |

**Path Parameter:** `contestId` – UUID của cuộc thi.

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Official results published successfully",

  "data": {

    "contestId": "550e8400-e29b-41d4-a716-446655440000",

    "status": "published",

    "resultsLocked": true

  }

}

```

**Validation Rules:**

- Người gọi phải có quyền công bố kết quả.

- Tất cả giám khảo phải hoàn thành và khóa điểm.

- Tác phẩm đạt giải phải có Negative Proof đã được xác minh theo BR-06.

- Sau khi công bố, điểm số, thứ hạng và giải thưởng không được chỉnh sửa theo BR-16.

- Backend phải từ chối mọi yêu cầu thay đổi dữ liệu kết quả đã khóa.

**Status Note:** SRS sử dụng `PUBLISHED`, trong khi OpenAPI hiện tại sử dụng `published`. Ví dụ Response dùng chữ thường để phù hợp OpenAPI; nhóm cần thống nhất cách biểu diễn trước khi triển khai.

#### 4.9.3. Archive Contest Results DTO

**Endpoint:** `POST /api/v1/contests/{contestId}/archive`

**Purpose:** Khởi tạo lưu trữ các tác phẩm đạt giải và vào chung kết.

**Authorization:** Organizer được phân quyền.

**Request DTO:**

```json

{

  "includeFinalists": true,

  "generateWebp": true,

  "applyWatermark": true

}

```

| Field | Data Type | Required | Description |

|---|---|---|---|

| `includeFinalists` | Boolean | Theo thiết kế đề xuất | Bao gồm tác phẩm vào chung kết |

| `generateWebp` | Boolean | Theo thiết kế đề xuất | Tạo ảnh WebP |

| `applyWatermark` | Boolean | Theo thiết kế đề xuất | Đóng watermark bản quyền |

**Proposed Standard Response – 202 Accepted:**

```json

{

  "code": 202,

  "message": "Archive processing started",

  "data": {

    "contestId": "550e8400-e29b-41d4-a716-446655440000",

    "archiveStatus": "PROCESSING"

  }

}

```

**Validation Rules:**

- Cuộc thi phải được công bố kết quả trước khi lưu trữ.

- Chỉ lưu trữ tác phẩm đủ điều kiện.

- Ảnh Master phải tồn tại trong Private Storage.

- Không tạo bản ghi lưu trữ trùng cho cùng một tác phẩm.

- Không thay đổi dữ liệu kết quả đã khóa.

- Không công khai ảnh khi quá trình tạo WebP hoặc watermark chưa hoàn thành.

#### 4.9.4. Get Published Contest Results DTO

**Endpoint:** `GET /api/v1/contests/{contestId}/results`

**Purpose:** Lấy kết quả chính thức đã công bố của cuộc thi.

**Request:** Không có JSON body.

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Published results retrieved successfully",

  "data": {

    "contestId": "550e8400-e29b-41d4-a716-446655440000",

    "status": "published",

    "resultsLocked": true,

    "winners": [

      {

        "submissionId": "650e8400-e29b-41d4-a716-446655440001",

        "title": "Sunset on Film",

        "award": "First Prize",

        "finalScore": 9.5

      }

    ]

  }

}

```

**Response Rules:**

- Chỉ trả về kết quả được phép công khai.

- Điểm số và giải thưởng đã công bố phải là dữ liệu Read-Only.

- Không trả về thông tin bí mật của giám khảo hoặc tài nguyên riêng tư.

- API này không cho phép thay đổi dữ liệu kết quả.

#### 4.9.5. Exhibition Gallery & Faceted Search DTO

**Endpoint:** `GET /api/v1/exhibitions`

**Purpose:** Lấy danh sách tác phẩm triển lãm và hỗ trợ tìm kiếm theo nhiều tiêu chí.

**Query Parameters:**

| Parameter | Data Type | Required | Description |

|---|---|---|---|

| `contestId` | UUID | No | Lọc theo cuộc thi |

| `year` | Integer | No | Lọc theo năm tổ chức |

| `award` | String | No | Lọc theo giải thưởng |

| `filmStock` | String | No | Lọc theo loại phim |

| `camera` | String | No | Lọc theo máy ảnh |

| `filmFormat` | String | No | Lọc theo khổ phim |

| `aiTag` | String | No | Lọc theo thẻ chủ đề AI |

| `page` | Integer | No | Trang hiện tại, tối thiểu 1 |

| `limit` | Integer | No | Số kết quả mỗi trang, đề xuất 1–100 |

**Request Example:**

```http

GET /api/v1/exhibitions?filmStock=Portra&filmFormat=35mm&year=2026&page=1&limit=10

```

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Exhibitions retrieved successfully",

  "data": {

    "items": [

      {

        "id": "750e8400-e29b-41d4-a716-446655440002",

        "title": "Sunset on Film",

        "filmStock": "Kodak Portra 400",

        "camera": "Canon AE-1",

        "filmFormat": "35mm",

        "year": 2026,

        "award": "First Prize",

        "imageUrl": "https://example.com/exhibition/sunset.webp"

      }

    ],

    "pagination": {

      "page": 1,

      "limit": 10,

      "total": 1,

      "totalPages": 1

    }

  }

}

```

**Validation Rules:**

- Cho phép kết hợp nhiều bộ lọc.

- Chỉ trả về tác phẩm đã được công khai.

- Không trả về đường dẫn ảnh Master hoặc Negative Proof.

- Khi không có kết quả, trả về `items` là mảng rỗng.

- Hỗ trợ phân trang.

#### 4.9.6. Exhibition Detail DTO

**Endpoint:** `GET /api/v1/exhibitions/{id}`

**Purpose:** Lấy thông tin chi tiết của một tác phẩm triển lãm.

**Path Parameter:** `id` – UUID của tác phẩm triển lãm.

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Exhibition detail retrieved successfully",

  "data": {

    "id": "750e8400-e29b-41d4-a716-446655440002",

    "title": "Sunset on Film",

    "author": "Nguyen Van A",

    "filmStock": "Kodak Portra 400",

    "iso": 400,

    "camera": "Canon AE-1",

    "lens": "50mm f/1.8",

    "filmFormat": "35mm",

    "lab": "Film Lab",

    "award": "First Prize",

    "imageUrl": "https://example.com/exhibition/sunset.webp",

    "watermarked": true

  }

}

```

**Response Rules:**

- Tác phẩm phải tồn tại và được phép công khai.

- Chỉ cung cấp URL ảnh triển lãm WebP có watermark.

- Không trả về khóa truy cập Private Storage.

- Metadata phải phù hợp với thông tin đã được xác nhận.

- Nếu không tìm thấy tác phẩm, trả về HTTP 404.

#### 4.9.7. Process Exhibition Image DTO

**Endpoint:** `POST /api/v1/exhibitions/{id}/process`

**Purpose:** Yêu cầu xử lý ảnh triển lãm theo BR-17.

**Authorization:** Organizer được phân quyền.

**Request DTO:**

```json

{

  "generateWebp": true,

  "applyWatermark": true

}

```

| Field | Data Type | Required | Validation |

|---|---|---|---|

| `generateWebp` | Boolean | Theo thiết kế đề xuất | Phải tạo WebP khi xử lý ảnh công khai |

| `applyWatermark` | Boolean | Theo thiết kế đề xuất | Không được bỏ qua watermark |

**Proposed Standard Response – 202 Accepted:**

```json

{

  "code": 202,

  "message": "Image processing started",

  "data": {

    "exhibitionId": "750e8400-e29b-41d4-a716-446655440002",

    "status": "PROCESSING"

  }

}

```

**Validation Rules:**

- Ảnh Master phải tồn tại.

- Tác phẩm phải đủ điều kiện triển lãm.

- Không được chỉnh sửa ảnh Master.

- Không được bỏ qua watermark.

- Yêu cầu xử lý lặp lại phải được kiểm soát để tránh tạo dữ liệu trùng.

#### 4.9.8. Exhibition Processing Status DTO

**Endpoint:** `GET /api/v1/exhibitions/{id}/status`

**Purpose:** Kiểm tra trạng thái xử lý ảnh triển lãm.

**Authorization:** Organizer được phân quyền.

**Proposed Standard Response – 200 OK:**

```json

{

  "code": 200,

  "message": "Processing status retrieved successfully",

  "data": {

    "exhibitionId": "750e8400-e29b-41d4-a716-446655440002",

    "status": "READY",

    "watermarked": true

  }

}

```

**Proposed Processing Status Values:**

| Status | Description |

|---|---|

| `PENDING` | Chờ xử lý |

| `PROCESSING` | Đang xử lý |

| `READY` | Đã xử lý thành công |

| `FAILED` | Xử lý thất bại |

| `PUBLISHED` | Đã công khai |

Các trạng thái trên là đề xuất của module Archive & Exhibition, chưa được khai báo đầy đủ trong database hiện tại.

#### 4.9.9. Archive & Exhibition Error Handling

| HTTP Status | Error Scenario | Description |

|---|---|---|

| 400 | Invalid Filter | Tham số tìm kiếm không hợp lệ |

| 401 | Unauthorized | Chưa xác thực |

| 403 | Forbidden | Không có quyền quản lý |

| 404 | Exhibition Not Found | Không tìm thấy tác phẩm |

| 404 | Master Image Not Found | Không tìm thấy ảnh Master |

| 409 | Results Locked | Kết quả đã khóa |

| 409 | Invalid Contest State | Trạng thái cuộc thi không hợp lệ |

| 409 | Proof Not Verified | Bằng chứng âm bản chưa xác minh |

| 500 | Image Processing Failed | Xử lý ảnh thất bại |

**Proposed Standard Error Response:**

```json

{

  "code": 409,

  "message": "Contest is not ready to publish results",

  "data": null

}

```

Các trường hợp lỗi sẽ được ánh xạ với danh mục `MSG001–MSG028` sau khi nhóm thống nhất mã thông báo.

#### 4.9.10. Security & Integration Requirements

- Các API quản lý yêu cầu JWT Access Token và RBAC.

- Organizer chỉ được quản lý các cuộc thi thuộc phạm vi quyền hạn.

- Sau khi công bố kết quả, Backend phải thực thi BR-16 và từ chối cập nhật điểm số, thứ hạng hoặc giải thưởng.

- Ảnh Master và Negative Proof phải được bảo vệ trong Private Storage.

- Chỉ cung cấp ảnh WebP đã tối ưu và có watermark cho người xem công khai.

- Sử dụng Signed URL có thời hạn khi cần truy cập tài nguyên riêng tư.

- Không đưa thông tin bí mật hoặc khóa truy cập Cloudflare R2 vào Response.

- Web Next.js và Mobile Flutter phải sử dụng thống nhất Request DTO và Response DTO.

**Implementation Note:** Các API và DTO Archive & Exhibition trong mục này là thiết kế đề xuất, không phải các endpoint đã được xác nhận triển khai. Một số dữ liệu như giải thưởng, điểm số, AI tags và trạng thái xử lý ảnh cần được hỗ trợ bởi schema hoặc logic backend tương ứng.

## 5. UI/UX Functional Requirements

### 5.1. Message Code Catalog (MSG001–MSG028)

#### 5.1.1. Message Code Overview

Message Code Catalog định nghĩa danh mục mã thông báo dùng chung cho Backend, Web Next.js và Mobile Flutter.

Mỗi mã `MSGxxx` đại diện cho một kết quả xử lý hoặc một trường hợp lỗi nghiệp vụ cụ thể.

Mục tiêu:

- Thống nhất cách nhận biết kết quả API.

- Giúp Web và Mobile hiển thị thông báo phù hợp.

- Hạn chế việc Client phụ thuộc trực tiếp vào nội dung chuỗi thông báo.

- Hỗ trợ quản lý và mở rộng danh mục lỗi.

**Catalog Status:** Proposed – Pending Team Approval.

Danh mục `MSG001–MSG028` dưới đây là đề xuất cho dự án, chưa được xác nhận là danh mục mã chính thức của nhóm.

#### 5.1.2. Message Code Catalog

| Message Code | HTTP Status | Message | Description |

|---|---|---|---|

| `MSG001` | 200 | Success | Yêu cầu được xử lý thành công |

| `MSG002` | 201 | Created successfully | Tạo dữ liệu thành công |

| `MSG003` | 200 | Updated successfully | Cập nhật dữ liệu thành công |

| `MSG004` | 200 | Deleted successfully | Xóa dữ liệu thành công |

| `MSG005` | 400 | Invalid request data | Dữ liệu yêu cầu không hợp lệ |

| `MSG006` | 400 | Missing required fields | Thiếu trường bắt buộc |

| `MSG007` | 400 | Invalid data format | Sai định dạng dữ liệu |

| `MSG008` | 401 | Unauthorized | Người dùng chưa xác thực |

| `MSG009` | 401 | Invalid credentials | Email hoặc mật khẩu không đúng |

| `MSG010` | 401 | Token expired | Token đã hết hạn |

| `MSG011` | 401 | Invalid token | Token không hợp lệ |

| `MSG012` | 403 | Forbidden | Người dùng không có quyền thực hiện |

| `MSG013` | 403 | Account locked | Tài khoản đã bị khóa |

| `MSG014` | 404 | Resource not found | Không tìm thấy tài nguyên |

| `MSG015` | 409 | Email already exists | Email đã được đăng ký |

| `MSG016` | 409 | Duplicate resource | Dữ liệu đã tồn tại |

| `MSG017` | 400 | Invalid contest data | Thông tin cuộc thi không hợp lệ |

| `MSG018` | 404 | Contest not found | Không tìm thấy cuộc thi |

| `MSG019` | 409 | Invalid contest state | Trạng thái cuộc thi không cho phép thao tác |

| `MSG020` | 400 | Invalid submission data | Dữ liệu bài dự thi không hợp lệ |

| `MSG021` | 413 | File too large | File vượt quá giới hạn kích thước |

| `MSG022` | 415 | Unsupported file type | Định dạng file không được hỗ trợ |

| `MSG023` | 404 | Submission not found | Không tìm thấy bài dự thi |

| `MSG024` | 409 | Results already locked | Kết quả cuộc thi đã bị khóa |

| `MSG025` | 409 | Negative proof not verified | Bằng chứng âm bản chưa được xác minh |

| `MSG026` | 404 | Exhibition not found | Không tìm thấy tác phẩm triển lãm |

| `MSG027` | 500 | Image processing failed | Quá trình xử lý ảnh thất bại |

| `MSG028` | 500 | Internal server error | Lỗi máy chủ nội bộ |

#### 5.1.3. Message Code Usage

Để Client nhận biết mã thông báo một cách ổn định, đề xuất bổ sung trường `messageCode` vào cấu trúc Response.

**Proposed Extended Response:**

```json

{

  "code": 400,

  "messageCode": "MSG005",

  "message": "Invalid request data",

  "data": null

}

```

| Field | Data Type | Required | Description |

|---|---|---|---|

| `code` | Integer | Yes | Mã HTTP Status |

| `messageCode` | String | Theo đề xuất | Mã thông báo nghiệp vụ |

| `message` | String | Yes | Nội dung thông báo |

| `data` | Object / Array / Null | Yes | Dữ liệu phản hồi |

**Compatibility Note:** Jira hiện yêu cầu cấu trúc `{ code, message, data }` và danh mục `MSG001–MSG028`, nhưng chưa xác định mã MSG được truyền qua trường riêng hay nằm trong `message`.

Do đó, trường `messageCode` ở trên chỉ là phương án mở rộng đề xuất. Nếu nhóm yêu cầu giữ đúng ba trường Response, có thể dùng danh mục MSG trong logic Backend hoặc thống nhất phương án khác.

#### 5.1.4. Authentication Message Examples

**Invalid Credentials:**

```json

{

  "code": 401,

  "messageCode": "MSG009",

  "message": "Invalid credentials",

  "data": null

}

```

**Email Already Exists:**

```json

{

  "code": 409,

  "messageCode": "MSG015",

  "message": "Email already exists",

  "data": null

}

```

#### 5.1.5. Contest Message Examples

**Contest Not Found:**

```json

{

  "code": 404,

  "messageCode": "MSG018",

  "message": "Contest not found",

  "data": null

}

```

**Invalid Contest State:**

```json

{

  "code": 409,

  "messageCode": "MSG019",

  "message": "Invalid contest state",

  "data": null

}

```

#### 5.1.6. Submission Message Examples

**File Too Large:**

```json

{

  "code": 413,

  "messageCode": "MSG021",

  "message": "File too large",

  "data": null

}

```

**Negative Proof Not Verified:**

```json

{

  "code": 409,

  "messageCode": "MSG025",

  "message": "Negative proof not verified",

  "data": null

}

```

#### 5.1.7. Archive & Exhibition Message Examples

**Results Already Locked:**

```json

{

  "code": 409,

  "messageCode": "MSG024",

  "message": "Results already locked",

  "data": null

}

```

**Image Processing Failed:**

```json

{

  "code": 500,

  "messageCode": "MSG027",

  "message": "Image processing failed",

  "data": null

}

```

#### 5.1.8. Message Code Management Rules

- Mỗi mã MSG phải có ý nghĩa duy nhất.

- Không sử dụng cùng một mã MSG cho các trường hợp lỗi không liên quan.

- Backend chịu trách nhiệm xác định mã MSG tương ứng với kết quả xử lý.

- Web và Mobile không nên dựa vào nội dung `message` để phân loại lỗi.

- Nội dung thông báo có thể được dịch sang ngôn ngữ khác mà không làm thay đổi mã MSG.

- Không được trả về thông tin bí mật, mật khẩu, token hoặc chi tiết hệ thống trong thông báo lỗi.

- Các mã đã được sử dụng chính thức không nên bị thay đổi ý nghĩa.

- Khi cần thêm mã mới, phải cập nhật tài liệu API Contracts và thông báo cho nhóm.

#### 5.1.9. Integration Requirements

**Backend:**

- Ánh xạ lỗi và kết quả xử lý sang HTTP Status phù hợp.

- Trả về thông báo nhất quán.

- Không để lộ stack trace hoặc thông tin nhạy cảm.

- Sử dụng danh mục mã MSG sau khi được nhóm phê duyệt.

**Web Next.js:**

- Xử lý lỗi dựa trên HTTP Status và mã MSG nếu được hỗ trợ.

- Hiển thị thông báo dễ hiểu cho người dùng.

- Không phụ thuộc vào việc so sánh chuỗi thông báo tiếng Anh.

**Mobile Flutter:**

- Sử dụng cùng danh mục MSG với Web.

- Xử lý các lỗi xác thực, phân quyền và validation một cách thống nhất.

- Hỗ trợ hiển thị thông báo phù hợp trên giao diện Mobile.

**Implementation Note:** Danh mục `MSG001–MSG028`, cách ánh xạ HTTP Status và trường `messageCode` trong mục này đều là đề xuất. Trước khi áp dụng, nhóm cần đối chiếu với SRS, các tài liệu nghiệp vụ và hợp đồng API đã thống nhất.

### 5.2. Validation & Error Handling

#### 5.2.1. Validation & Error Handling Overview

Validation & Error Handling định nghĩa các quy tắc kiểm tra dữ liệu đầu vào và cách xử lý lỗi thống nhất giữa Backend, Web Next.js và Mobile Flutter.

Mục tiêu:

- Đảm bảo dữ liệu Request hợp lệ trước khi xử lý.

- Ngăn chặn dữ liệu không đúng định dạng hoặc thiếu thông tin.

- Chuẩn hóa cấu trúc phản hồi lỗi.

- Giúp Web và Mobile hiển thị thông báo dễ hiểu.

- Đảm bảo an toàn và bảo mật thông tin hệ thống.

Backend chịu trách nhiệm kiểm tra dữ liệu đầu vào ngay cả khi Client đã thực hiện validation.

#### 5.2.2. General Validation Rules

Các Request DTO phải tuân thủ những quy tắc sau:

| Validation Rule | Description | Example |

|---|---|---|

| Required Field | Không được thiếu trường bắt buộc | `email` |

| Data Type | Kiểu dữ liệu phải hợp lệ | `isoRated` là Integer |

| String Length | Độ dài chuỗi phải nằm trong giới hạn | `name` tối đa 150 ký tự |

| Email Format | Email phải đúng định dạng | `user@example.com` |

| UUID Format | Định danh phải đúng định dạng UUID | `550e8400-e29b-41d4-a716-446655440000` |

| DateTime Format | Ngày giờ theo ISO 8601 | `2026-11-01T00:00:00Z` |

| Numeric Range | Giá trị số phải nằm trong giới hạn | `isoRated` lớn hơn 0 |

| Enum Value | Giá trị phải thuộc danh sách cho phép | `status = draft` |

| File Validation | File phải đáp ứng quy định | Kích thước và định dạng ảnh |

| Business Rule | Dữ liệu phải phù hợp nghiệp vụ | Hạng mục thuộc đúng cuộc thi |

**Validation Requirements:**

- Kiểm tra trường bắt buộc.

- Kiểm tra kiểu dữ liệu và định dạng.

- Kiểm tra giới hạn độ dài và giá trị.

- Kiểm tra tính tồn tại của tài nguyên liên quan.

- Kiểm tra quyền thực hiện thao tác.

- Kiểm tra các điều kiện nghiệp vụ trước khi lưu dữ liệu.

#### 5.2.3. Standard Error Response

Các API thuộc phạm vi chuẩn hóa sử dụng cấu trúc phản hồi lỗi:

```json

{

  "code": 400,

  "message": "Invalid request data",

  "data": null

}

```

**Field Definitions:**

| Field | Data Type | Required | Description |

|---|---|---|---|

| `code` | Integer | Yes | Mã HTTP Status |

| `message` | String | Yes | Thông báo mô tả lỗi |

| `data` | Object / Array / Null | Yes | Thông tin bổ sung nếu được phép |

**Response Rules:**

- `code` phải phù hợp với HTTP Status của Response.

- `message` phải ngắn gọn, dễ hiểu.

- `data` có thể là `null` khi không có thông tin bổ sung.

- Không trả về mật khẩu, token, stack trace hoặc thông tin hệ thống nhạy cảm.

- Không trả về HTTP 200 cho một yêu cầu thực sự thất bại.

#### 5.2.4. Field Validation Error DTO

Đề xuất sử dụng `data.errors` để mô tả các trường không hợp lệ khi cần hiển thị lỗi chi tiết trên Web hoặc Mobile.

**Proposed Validation Error Response:**

```json

{

  "code": 400,

  "message": "Validation failed",

  "data": {

    "errors": [

      {

        "field": "email",

        "message": "Invalid email format"

      },

      {

        "field": "password",

        "message": "Password must contain at least 8 characters"

      }

    ]

  }

}

```

**Field Error Definitions:**

| Field | Data Type | Description |

|---|---|---|

| `field` | String | Tên trường không hợp lệ |

| `message` | String | Nội dung lỗi của trường |

**Validation Rules:**

- Mỗi lỗi phải xác định được trường liên quan nếu có.

- Client có thể hiển thị lỗi bên dưới ô nhập liệu.

- Không đưa dữ liệu nhạy cảm vào thông báo lỗi.

- Cấu trúc `data.errors` là đề xuất mở rộng, cần được nhóm xác nhận.

#### 5.2.5. HTTP Error Status Mapping

| HTTP Status | Error Type | Description |

|---|---|---|

| 400 | Bad Request | Dữ liệu không hợp lệ |

| 401 | Unauthorized | Chưa xác thực hoặc token không hợp lệ |

| 403 | Forbidden | Không có quyền thực hiện |

| 404 | Not Found | Không tìm thấy tài nguyên |

| 409 | Conflict | Xung đột dữ liệu hoặc trạng thái |

| 413 | Payload Too Large | File hoặc request quá lớn |

| 415 | Unsupported Media Type | Định dạng nội dung không hỗ trợ |

| 500 | Internal Server Error | Lỗi máy chủ |

Backend phải trả về HTTP Status phù hợp với kết quả xử lý thực tế.

#### 5.2.6. Authentication Error Handling

Các API Authentication phải xử lý những trường hợp lỗi sau:

| Scenario | HTTP Status | Proposed Message Code |

|---|---|---|

| Email hoặc mật khẩu không đúng | 401 | `MSG009` |

| Access Token hết hạn | 401 | `MSG010` |

| Token không hợp lệ | 401 | `MSG011` |

| Người dùng không có quyền | 403 | `MSG012` |

| Tài khoản bị khóa | 403 | `MSG013` |

| Email đã được đăng ký | 409 | `MSG015` |

**Example:**

```json

{

  "code": 401,

  "message": "Invalid credentials",

  "data": null

}

```

**Security Rules:**

- Không trả về mật khẩu hoặc password hash.

- Không ghi Access Token hoặc Refresh Token vào log.

- Không tiết lộ chi tiết xác thực không cần thiết.

- Backend phải kiểm tra JWT và quyền truy cập trước khi thực hiện thao tác được bảo vệ.

#### 5.2.7. Contest Error Handling

Các API Contest phải kiểm tra dữ liệu và trạng thái cuộc thi.

| Scenario | HTTP Status | Proposed Message Code |

|---|---|---|

| Dữ liệu cuộc thi không hợp lệ | 400 | `MSG017` |

| Không tìm thấy cuộc thi | 404 | `MSG018` |

| Trạng thái cuộc thi không cho phép thao tác | 409 | `MSG019` |

| Người dùng không có quyền quản lý | 403 | `MSG012` |

**Example:**

```json

{

  "code": 404,

  "message": "Contest not found",

  "data": null

}

```

**Business Rules:**

- Không cho phép cập nhật cuộc thi nếu người dùng không có quyền.

- Kiểm tra thời gian bắt đầu và kết thúc cuộc thi.

- Kiểm tra trạng thái trước khi thực hiện thao tác.

- Không cho phép sửa kết quả đã khóa theo BR-16.

#### 5.2.8. Submission Error Handling

Các API Submission phải kiểm tra dữ liệu bài dự thi và file được tải lên.

| Scenario | HTTP Status | Proposed Message Code |

|---|---|---|

| Dữ liệu bài dự thi không hợp lệ | 400 | `MSG020` |

| File vượt giới hạn kích thước | 413 | `MSG021` |

| Định dạng file không hỗ trợ | 415 | `MSG022` |

| Không tìm thấy bài dự thi | 404 | `MSG023` |

| Người dùng không có quyền nộp bài | 403 | `MSG012` |

**Example:**

```json

{

  "code": 413,

  "message": "File too large",

  "data": null

}

```

**Validation Rules:**

- Kiểm tra các trường bắt buộc của Submission DTO.

- Kiểm tra định dạng và kích thước file.

- Kiểm tra `contestId` và `categoryId`.

- Kiểm tra hạng mục có thuộc cuộc thi hay không.

- Kiểm tra quyền của Participant.

- Không tin tưởng `participantId` do Client tự cung cấp.

#### 5.2.9. Archive & Exhibition Error Handling

Các API Archive & Exhibition phải kiểm tra điều kiện công bố kết quả và quyền truy cập tài nguyên.

| Scenario | HTTP Status | Proposed Message Code |

|---|---|---|

| Kết quả đã khóa | 409 | `MSG024` |

| Negative Proof chưa xác minh | 409 | `MSG025` |

| Không tìm thấy tác phẩm triển lãm | 404 | `MSG026` |

| Xử lý ảnh thất bại | 500 | `MSG027` |

| Người dùng không có quyền quản lý | 403 | `MSG012` |

**Example:**

```json

{

  "code": 409,

  "message": "Results already locked",

  "data": null

}

```

**Business Rules:**

- Không cho phép sửa điểm số, thứ hạng hoặc giải thưởng sau khi công bố theo BR-16.

- Tác phẩm đạt giải phải có Negative Proof được xác minh theo BR-06.

- Không công khai ảnh Master hoặc Negative Proof.

- Ảnh triển lãm công khai phải tuân thủ BR-17.

- Chỉ cho phép người có quyền thực hiện thao tác quản lý.

#### 5.2.10. Backend Error Handling Requirements

Backend phải thực hiện các yêu cầu sau:

- Validation Request trước khi xử lý nghiệp vụ.

- Trả về HTTP Status phù hợp.

- Sử dụng cấu trúc Response thống nhất.

- Ánh xạ lỗi sang danh mục MSG sau khi được nhóm phê duyệt.

- Ghi log lỗi phục vụ kiểm tra và bảo trì.

- Không ghi mật khẩu, token hoặc dữ liệu nhạy cảm vào log.

- Không trả về stack trace hoặc thông tin nội bộ cho Client.

- Xử lý lỗi không mong muốn bằng HTTP 500.

- Đảm bảo lỗi không làm thay đổi dữ liệu một cách không nhất quán.

#### 5.2.11. Web & Mobile Error Handling Requirements

**Web Next.js:**

- Kiểm tra HTTP Status và cấu trúc Response.

- Hiển thị thông báo lỗi phù hợp.

- Hiển thị lỗi validation tại các trường nhập liệu.

- Điều hướng đến màn hình đăng nhập khi cần xác thực lại.

- Không hiển thị thông tin kỹ thuật nhạy cảm cho người dùng.

**Mobile Flutter:**

- Sử dụng cùng cấu trúc Response và danh mục lỗi với Web.

- Hiển thị thông báo lỗi phù hợp trên giao diện Mobile.

- Xử lý các lỗi kết nối và lỗi API.

- Hỗ trợ hiển thị lỗi validation.

- Xử lý trường hợp Access Token hết hạn theo cơ chế xác thực đã thống nhất.

#### 5.2.12. Error Handling Implementation Notes

- Cấu trúc `{ code, message, data }` là chuẩn Response theo yêu cầu Jira.

- Danh mục `MSG001–MSG028` ở mục 8 hiện là đề xuất, chưa được xác nhận chính thức.

- Trường `messageCode` là phương án mở rộng tùy chọn, không bắt buộc khi nhóm chưa phê duyệt.

- Cấu trúc `data.errors` là đề xuất cho trường hợp validation nhiều trường.

- OpenAPI hiện tại vẫn sử dụng một số cấu trúc lỗi khác như `{ error: "..." }` và `{ success: false, message: "..." }`.

- Backend, Web và Mobile cần thống nhất hợp đồng API trước khi thay đổi cách xử lý lỗi trong mã nguồn.

### 5.3. Web & Mobile Integration

#### 5.3.1. Integration Overview

Web & Mobile Integration Requirements định nghĩa các quy tắc tích hợp API dùng chung giữa Backend, Web Next.js và Mobile Flutter.

Mục tiêu:

- Đảm bảo Web và Mobile sử dụng cùng cấu trúc Request DTO và Response DTO.

- Thống nhất cách xử lý dữ liệu JSON.

- Chuẩn hóa cơ chế xác thực và phân quyền.

- Thống nhất cách xử lý lỗi và mã thông báo.

- Hạn chế sự khác biệt trong quá trình phát triển các ứng dụng Client.

Các yêu cầu trong mục này là hợp đồng tích hợp đề xuất, cần được nhóm thống nhất trước khi áp dụng trên toàn bộ hệ thống.

#### 5.3.2. Shared API Response Structure

Web và Mobile phải xử lý cấu trúc Response chuẩn theo yêu cầu Jira:

```json

{

  "code": 200,

  "message": "Success",

  "data": {}

}

```

**Field Definitions:**

| Field | Data Type | Description |

|---|---|---|

| `code` | Integer | Mã trạng thái HTTP |

| `message` | String | Thông báo kết quả |

| `data` | Object / Array / Null | Dữ liệu API trả về |

**Integration Rules:**

- Web và Mobile phải đọc dữ liệu từ trường `data`.

- Trường `data` có thể chứa Object, Array hoặc `null`.

- Không giả định mọi API đều trả về cùng một loại dữ liệu.

- Client phải kiểm tra HTTP Status trước khi xử lý kết quả.

- Không tự ý thay đổi tên trường DTO giữa Web và Mobile.

- Khi Backend thay đổi hợp đồng API, tài liệu phải được cập nhật tương ứng.

#### 5.3.3. Web Next.js Integration Requirements

Web Next.js sử dụng các API Backend để thực hiện chức năng đăng ký, đăng nhập, quản lý cuộc thi, nộp bài và xem triển lãm.

**Requirements:**

- Sử dụng Request DTO và Response DTO đã thống nhất.

- Sử dụng JSON cho các API thông thường.

- Sử dụng `multipart/form-data` cho chức năng tải ảnh dự thi.

- Gửi Access Token khi gọi API yêu cầu xác thực.

- Kiểm tra quyền truy cập và xử lý HTTP Status.

- Hiển thị thông báo lỗi phù hợp với người dùng.

- Hỗ trợ phân trang, tìm kiếm và lọc dữ liệu.

- Không đưa Refresh Token hoặc thông tin bí mật vào log.

**Example – Get Contest List:**

```http

GET /contests?page=1&limit=10

```

**Proposed Response:**

```json

{

  "code": 200,

  "message": "Contests retrieved successfully",

  "data": {

    "items": [

      {

        "id": "550e8400-e29b-41d4-a716-446655440000",

        "name": "Film Photography Contest 2026",

        "status": "published"

      }

    ],

    "pagination": {

      "page": 1,

      "limit": 10,

      "total": 1,

      "totalPages": 1

    }

  }

}

```

#### 5.3.4. Mobile Flutter Integration Requirements

Mobile Flutter sử dụng cùng Backend API với Web Next.js.

**Requirements:**

- Sử dụng cùng Request DTO và Response DTO.

- Thống nhất tên trường JSON và kiểu dữ liệu.

- Xử lý HTTP Status và lỗi API.

- Sử dụng Access Token cho các API yêu cầu xác thực.

- Hỗ trợ gửi file ảnh bằng `multipart/form-data`.

- Hỗ trợ phân trang và lọc danh sách.

- Xử lý các trường hợp mất kết nối hoặc kết nối không ổn định.

- Không lưu trữ token hoặc thông tin nhạy cảm theo cách không an toàn.

**Example – Login Request:**

```json

{

  "email": "participant@example.com",

  "password": "SecurePass123!"

}

```

**Proposed Response:**

```json

{

  "code": 200,

  "message": "Login successful",

  "data": {

    "user": {

      "id": "550e8400-e29b-41d4-a716-446655440000",

      "fullName": "Nguyen Van A",

      "email": "participant@example.com",

      "role": "Participant"

    },

    "accessToken": "example-access-token"

  }

}

```

**Implementation Note:** Cách truyền Refresh Token trên Mobile cần được nhóm thống nhất riêng với cơ chế cookie `HttpOnly` của Web và chính sách bảo mật Backend.

#### 5.3.5. Authentication & Authorization Integration

Web và Mobile sử dụng JWT Access Token để gọi các API yêu cầu xác thực.

**Authorization Header:**

```http

Authorization: Bearer <access_token>

```

**Integration Rules:**

- Backend xác thực JWT trước khi xử lý các API được bảo vệ.

- Backend kiểm tra quyền truy cập bằng RBAC.

- Client không được tự xác định quyền truy cập thay cho Backend.

- Khi Access Token hết hạn, Client thực hiện quy trình Refresh Token theo hợp đồng đã thống nhất.

- Khi Refresh Token không còn hợp lệ, Client yêu cầu người dùng đăng nhập lại.

- Không đưa Access Token hoặc Refresh Token vào URL.

- Không ghi token vào log.

**Supported Roles:**

| Role | Description |

|---|---|

| Admin | Quản trị hệ thống |

| Organizer | Quản lý và tổ chức cuộc thi |

| Judge | Chấm điểm tác phẩm |

| Participant | Tham gia cuộc thi và gửi bài dự thi |

#### 5.3.6. Request Content-Type Requirements

| API Category | Content-Type | Description |

|---|---|---|

| Authentication | `application/json` | Đăng ký, đăng nhập và xác thực |

| Contest Management | `application/json` | Tạo và cập nhật cuộc thi |

| Submission Upload | `multipart/form-data` | Gửi bài dự thi và file ảnh |

| Archive Management | `application/json` | Quản lý lưu trữ và công bố kết quả |

| Exhibition Search | Không yêu cầu Request Body | Tìm kiếm và lọc qua Query Parameters |

**Integration Rules:**

- Client phải gửi Content-Type phù hợp.

- Với `multipart/form-data`, Client phải để thư viện HTTP tạo boundary phù hợp.

- Backend kiểm tra định dạng Request trước khi xử lý.

- Các API GET thông thường không yêu cầu JSON body.

#### 5.3.7. Message Code Integration

Web và Mobile sử dụng chung danh mục mã thông báo `MSG001–MSG028` sau khi được nhóm phê duyệt.

**Integration Rules:**

- Backend xác định mã thông báo tương ứng với kết quả xử lý.

- Client sử dụng mã thông báo để lựa chọn nội dung hiển thị nếu hợp đồng API có hỗ trợ.

- Không phân loại lỗi bằng cách so sánh trực tiếp chuỗi tiếng Anh trong `message`.

- Web và Mobile có thể hiển thị thông báo bằng ngôn ngữ khác nhau.

- Không thay đổi ý nghĩa của các mã MSG đã được phê duyệt.

**Implementation Note:** Trường `messageCode` chưa nằm trong cấu trúc ba trường bắt buộc của Jira. Việc truyền mã MSG qua trường riêng cần được nhóm xác nhận.

#### 5.3.8. Pagination & Filtering Integration

Các API trả về danh sách cần hỗ trợ phân trang và lọc dữ liệu khi phù hợp.

**Proposed Query Parameters:**

| Parameter | Data Type | Description |

|---|---|---|

| `page` | Integer | Trang hiện tại |

| `limit` | Integer | Số bản ghi mỗi trang |

| `search` | String | Từ khóa tìm kiếm |

| `status` | String | Lọc theo trạng thái |

Các API chuyên biệt có thể bổ sung tham số khác, ví dụ `filmStock`, `filmFormat`, `year` và `award` đối với triển lãm.

**Integration Rules:**

- Web và Mobile phải gửi đúng tên tham số.

- Backend kiểm tra giá trị phân trang.

- Client xử lý danh sách rỗng.

- Cấu trúc phân trang phải thống nhất giữa các ứng dụng.

#### 5.3.9. DateTime & Naming Convention

**DateTime Rules:**

- Sử dụng ISO 8601 cho dữ liệu ngày giờ.

- Ưu tiên trao đổi thời gian dưới dạng UTC.

- Client chuyển đổi sang múi giờ địa phương khi hiển thị.

- Không sử dụng chuỗi ngày giờ không có quy ước rõ ràng.

**Naming Rules:**

- Đề xuất sử dụng `camelCase` cho các trường JSON.

- Ví dụ: `contestId`, `participantId`, `createdAt`, `filmStock`.

- Không tự ý đổi tên trường giữa các ứng dụng.

- Backend chịu trách nhiệm ánh xạ dữ liệu từ database sang DTO.

**Compatibility Note:** OpenAPI hiện tại còn sử dụng `snake_case` ở một số Contest Response. Cần thống nhất tên trường trước khi triển khai đồng bộ Web và Mobile.

#### 5.3.10. API Contract Versioning

Các thay đổi đối với API Contract phải được quản lý để tránh làm hỏng ứng dụng Web hoặc Mobile.

**Requirements:**

- Thay đổi DTO phải được cập nhật trong tài liệu.

- Các thay đổi không tương thích cần được thông báo cho nhóm.

- Không tự ý xóa hoặc đổi tên trường đang được Client sử dụng.

- Cần thống nhất cách quản lý phiên bản API.

- OpenAPI phải được cập nhật khi hợp đồng API được phê duyệt.

**Implementation Note:** OpenAPI hiện tại sử dụng các đường dẫn API chưa hoàn toàn thống nhất tiền tố `/api/v1`. Nhóm cần xác nhận quy ước endpoint trước khi phát triển đồng bộ.

#### 5.3.11. API Integration Testing Requirements

Các nhóm Backend, Web và Mobile cần kiểm tra khả năng tích hợp theo hợp đồng API.

**Suggested Test Cases:**

| Test Case | Expected Result |

|---|---|

| Register với dữ liệu hợp lệ | HTTP 201 |

| Login với thông tin hợp lệ | HTTP 200 |

| Login sai mật khẩu | HTTP 401 |

| Gọi API được bảo vệ khi thiếu token | HTTP 401 |

| Truy cập API không đủ quyền | HTTP 403 |

| Lấy cuộc thi không tồn tại | HTTP 404 |

| Tạo cuộc thi với dữ liệu hợp lệ | HTTP 201 |

| Nộp bài với file hợp lệ | HTTP 201 |

| Nộp file vượt giới hạn | HTTP 413 theo hợp đồng được thống nhất |

| Lấy danh sách cuộc thi | HTTP 200 và dữ liệu phân trang |

| Tìm kiếm triển lãm | HTTP 200 và kết quả phù hợp khi API được triển khai |

**Testing Requirements:**

- Kiểm tra HTTP Status.

- Kiểm tra cấu trúc Response.

- Kiểm tra kiểu dữ liệu của các trường.

- Kiểm tra các trường hợp lỗi.

- Kiểm tra quyền truy cập.

- Kiểm tra dữ liệu giữa Web, Mobile và Backend có thống nhất hay không.

#### 5.3.12. Final Integration Notes

Tài liệu `09-api-contracts.md` đóng vai trò là bản đặc tả DTO và hợp đồng API dùng chung cho Backend, Web Next.js và Mobile Flutter.

Các nội dung cần được nhóm xác nhận trước khi triển khai chính thức:

1. Cấu trúc Response `{ code, message, data }`.

2. Danh mục và ý nghĩa chính thức của `MSG001–MSG028`.

3. Có sử dụng trường `messageCode` hay không.

4. Quy ước `camelCase` và `snake_case`.

5. Cấu trúc Pagination DTO.

6. Cơ chế truyền và lưu Refresh Token trên Web và Mobile.

7. Các endpoint Archive & Exhibition còn ở mức đề xuất.

8. Quy ước tiền tố và phiên bản API.

Sau khi được phê duyệt, tài liệu cần được đồng bộ với OpenAPI và mã nguồn Backend để đảm bảo các Client sử dụng cùng một hợp đồng API.