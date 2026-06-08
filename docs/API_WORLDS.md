# API Documentation - World Module

Tài liệu này mô tả chi tiết các endpoints cho module World trong hệ thống LACEBO.

## Tổng quan
- **Base URL:** `/api/worlds`
- **Xác thực:** Đa số các API yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

---

## 1. Liệt kê tất cả Worlds
Lấy danh sách các thế giới công khai (public).

- **Endpoint:** `GET /api/worlds`
- **Xác thực:** Không bắt buộc (Optional Auth).
- **Query Parameters:**
  - `search`: (string) Tìm kiếm theo tiêu đề.
  - `page`: (number) Trang hiện tại (mặc định: 1).
  - `limit`: (number) Số lượng kết quả mỗi trang (mặc định: 20).
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "Vương Quốc Ánh Sáng",
      "description": "...",
      "is_public": 1,
      "member_count": 10,
      "created_at": "..."
    }
  ]
  ```

---

## 2. Lấy Worlds của tôi
Lấy danh sách các thế giới mà người dùng hiện tại tham gia hoặc sở hữu.

- **Endpoint:** `GET /api/worlds/mine`
- **Xác thực:** Bắt buộc.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "...",
      "role": "dev",
      "credits": 100,
      "member_count": 5
    }
  ]
  ```

---

## 3. Tạo World mới
- **Endpoint:** `POST /api/worlds`
- **Xác thực:** Bắt buộc.
- **Request Body:**
  ```json
  {
    "title": "Tên Thế Giới",
    "description": "Mô tả chi tiết",
    "is_public": 1
  }
  ```
- **Response (201 Created):** Trả về đối tượng World vừa tạo. Người tạo sẽ mặc định có role `dev` và trạng thái `approved`.
  Người tạo cũng được lưu là `owner_id` của World.

---

## 4. Lấy chi tiết một World
- **Endpoint:** `GET /api/worlds/:id`
- **Xác thực:** Không bắt buộc. Nếu có token, trả về thêm thông tin membership của người dùng đó.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "title": "...",
    "membership": { "role": "player", "status": "approved" }
  }
  ```
- **Lỗi:** `404 Not Found` nếu không tồn tại world.

---

## 5. Chỉnh sửa World
Chỉ owner của World có quyền chỉnh sửa thông tin World.

- **Endpoint:** `PATCH /api/worlds/:id`
- **Xác thực:** Bắt buộc.
- **Request Body:** Cần ít nhất một trường.
  ```json
  {
    "title": "Tên mới",
    "description": "Mô tả mới",
    "cover_image": "/uploads/images/world.png",
    "is_public": false
  }
  ```
- **Response (200 OK):** Trả về đối tượng World sau khi cập nhật.
- **Lỗi:**
  - `403 Forbidden` nếu không phải owner.
  - `404 Not Found` nếu không tồn tại world.

---

## 6. Xóa World
Chỉ owner của World có quyền xóa World.

- **Endpoint:** `DELETE /api/worlds/:id`
- **Xác thực:** Bắt buộc.
- **Response (200 OK):**
  ```json
  { "success": true }
  ```
- **Lỗi:**
  - `403 Forbidden` nếu không phải owner.
  - `404 Not Found` nếu không tồn tại world.

---

## 7. Tham gia World
Gửi yêu cầu gia nhập một thế giới. Trạng thái mặc định sẽ là `pending`.

- **Endpoint:** `POST /api/worlds/:id/join`
- **Xác thực:** Bắt buộc.
- **Response (201 Created):** Trả về bản ghi membership mới.
- **Lỗi:** `409 Conflict` nếu đã là thành viên hoặc đang chờ duyệt.

---

## 8. Duyệt/Từ chối thành viên
Chỉ dành cho người dùng có quyền `dev`.

- **Endpoint:** `PATCH /api/worlds/:id/members/:memberId`
- **Xác thực:** Bắt buộc (Yêu cầu quyền Dev).
- **Request Body:**
  ```json
  { "status": "approved" } // hoặc "rejected"
  ```
- **Response (200 OK):** `{ "success": true }`
- **Lỗi:** `403 Forbidden` nếu không phải dev.

---

## 9. Danh sách thành viên chờ duyệt
- **Endpoint:** `GET /api/worlds/:id/members/pending`
- **Xác thực:** Bắt buộc (Yêu cầu quyền Dev).
- **Response (200 OK):** Danh sách các membership có status `pending` kèm thông tin user.

---

## 10. Danh sách tất cả thành viên
Lấy danh sách các thành viên chính thức của thế giới.

- **Endpoint:** `GET /api/worlds/:id/members`
- **Xác thực:** Không bắt buộc.
- **Response (200 OK):**
  ```json
  [
    {
      "user_id": 1,
      "username": "...",
      "role": "player",
      "status": "approved"
    }
  ]
  ```
