# API Documentation - Posts & Credit System

Tài liệu này mô tả chi tiết các endpoints cho module Posts (bài viết, bình luận, lượt thích) và hệ thống điểm thưởng (Credit System) trong hệ thống LACEBO.

## Tổng quan
- **Base URL:** `/api/posts`
- **Xác thực:** Đa số các API thao tác thêm/sửa yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

---

## I. Credit System (Hệ thống điểm thưởng)
Mỗi thành viên (người chơi và dev) đều có một quỹ điểm `credits` riêng rẽ trong mỗi Thế giới (World).
Điểm thưởng được trao đổi dựa trên các hoạt động tương tác với bài viết, cụ thể:

1. **Đăng bài viết mới:** Khi một bài viết được **duyệt thành công** (Approved), người đăng bài sẽ nhận được **+10 credits**.
   - Nếu Dev đăng bài: Bài viết tự động Approved và nhận ngay 10 credits.
   - Nếu Player đăng bài: Bài viết ở trạng thái Pending. Khi Dev duyệt bài, người đăng mới được cộng 10 credits.
2. **Nhận lượt thích (Like):** Mỗi khi một bài viết nhận được 1 lượt thích từ người dùng khác, **người tạo bài viết** sẽ nhận được **+1 credit**. Nếu bị bỏ thích (Unlike), người tạo sẽ bị trừ **-1 credit**.
3. **Bình luận (Comment):** Người dùng khi **đăng một bình luận** vào bất kỳ bài viết nào sẽ nhận được **+2 credits** cho bản thân.

---

## II. Posts API

### 1. Lấy danh sách bài viết của sự kiện
Lấy các bài viết đã được duyệt (`approved`) thuộc về một sự kiện nhất định.

- **Endpoint:** `GET /api/posts/event/:eventId`
- **Xác thực:** Không bắt buộc (Optional Auth). Nếu có token, API sẽ trả về thêm thuộc tính `liked` (boolean) cho biết user hiện tại đã like bài này hay chưa.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "content": "Nội dung bài viết...",
      "image_url": "...",
      "status": "approved",
      "username": "player1",
      "like_count": 5,
      "comment_count": 2,
      "liked": true // (Chỉ có khi truyền Token)
    }
  ]
  ```

### 2. Tạo bài viết mới
Tạo một bài viết trong một sự kiện. Yêu cầu event phải đang ở trạng thái `open` và user phải là thành viên (`approved`) của World.

- **Endpoint:** `POST /api/posts/event/:eventId`
- **Xác thực:** Bắt buộc.
- **Request Body:**
  ```json
  {
    "content": "Nội dung bài viết",
    "image_url": "https://example.com/image.png" // (Optional)
  }
  ```
- **Response (201 Created):** 
  - Nếu là Dev: Bài viết tự động duyệt (`status: 'approved'`), cộng 10 credits.
  - Nếu là Player: Bài viết chờ duyệt (`status: 'pending'`).
  - Trả về đối tượng Post vừa được tạo.

### 3. Lấy danh sách bài viết chờ duyệt (Dev Only)
- **Endpoint:** `GET /api/posts/world/:worldId/pending`
- **Xác thực:** Bắt buộc. Chỉ người dùng có role `dev` trong World mới có quyền truy cập.
- **Response (200 OK):** Danh sách các bài viết có `status: 'pending'`.

### 4. Duyệt bài viết (Dev Only)
Duyệt bài viết đang ở trạng thái pending. Sau khi duyệt, bài viết sẽ được hiển thị công khai và người tạo bài được cộng 10 credits.

- **Endpoint:** `PATCH /api/posts/:postId/approve`
- **Xác thực:** Bắt buộc (Yêu cầu quyền Dev của World tương ứng).
- **Response (200 OK):**
  ```json
  { "success": true }
  ```

---

## III. Likes & Comments API

### 5. Thích / Bỏ thích bài viết (Like / Unlike)
Chức năng toggle: Nếu chưa like sẽ thành like, nếu đã like rồi sẽ thành bỏ like.

- **Endpoint:** `POST /api/posts/:postId/like`
- **Xác thực:** Bắt buộc.
- **Response (200 OK):**
  ```json
  { "liked": true } // Hoặc false nếu vừa Unlike
  ```
  *(Hệ thống sẽ tự động cộng/trừ 1 credit cho tác giả bài viết)*

### 6. Lấy danh sách bình luận của bài viết
- **Endpoint:** `GET /api/posts/:postId/comments`
- **Xác thực:** Không bắt buộc.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "content": "Bình luận hay quá!",
      "username": "player_abc",
      "like_count": 0,
      "created_at": "..."
    }
  ]
  ```

### 7. Thêm bình luận vào bài viết
Yêu cầu người bình luận phải là thành viên (đã được duyệt) của World. Nhận +2 credits cho mỗi bình luận.

- **Endpoint:** `POST /api/posts/:postId/comments`
- **Xác thực:** Bắt buộc.
- **Request Body:**
  ```json
  {
    "content": "Nội dung bình luận"
  }
  ```
- **Response (201 Created):**
  Trả về đối tượng Comment vừa tạo kèm thông tin cơ bản của người bình luận (username, avatar...).
