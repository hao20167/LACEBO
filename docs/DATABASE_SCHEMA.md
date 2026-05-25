# LACEBO - Tài Liệu Mô Tả Cơ Sở Dữ Liệu

**Task E2.6 - Database Description Component**

Tài liệu này mô tả lược đồ cơ sở dữ liệu của LACEBO trên **SQLite**, tập trung vào 8 bảng lõi phục vụ luồng nghiệp vụ của một mạng xã hội roleplay cộng đồng: tạo thế giới, tham gia theo vai trò, tổ chức sự kiện, đăng bài, tương tác bằng lượt thích/bình luận và quản lý hệ thống credit.

## 1. Quy Ước Chung

- Hệ quản trị: SQLite.
- Kiểu dữ liệu chính được sử dụng: `INTEGER`, `TEXT`, `REAL`.
- `INTEGER PRIMARY KEY AUTOINCREMENT` được dùng cho khóa chính tăng tự động.
- Các cột quan hệ tham chiếu bảng khác được mô tả là `FK` (Foreign Key).
- Một số trường trạng thái được ràng buộc bằng `CHECK(...)` để giới hạn giá trị hợp lệ.

## 2. Bảng `users`

Lưu thông tin tài khoản của người dùng trên nền tảng.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh duy nhất cho từng tài khoản trong toàn bộ hệ thống LACEBO. |
| `username` | TEXT | NOT NULL, UNIQUE | Tên đăng nhập dùng để nhận diện người chơi hoặc quản trị viên khi xác thực. |
| `email` | TEXT | NOT NULL, UNIQUE | Địa chỉ email gắn với tài khoản, dùng cho đăng ký, khôi phục hoặc đối soát danh tính. |
| `password` | TEXT | NOT NULL | Mật khẩu đã băm, phục vụ quá trình đăng nhập an toàn thay vì lưu mật khẩu gốc. |
| `display_name` | TEXT | NOT NULL | Tên hiển thị trên giao diện, ví dụ tên nhân vật hoặc biệt danh cộng đồng. |
| `avatar_url` | TEXT | DEFAULT NULL | Đường dẫn ảnh đại diện cá nhân nếu người dùng có thiết lập hình nhận diện. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm tài khoản được tạo trong hệ thống. |

## 3. Bảng `worlds`

Lưu các thế giới/không gian roleplay mà cộng đồng có thể tạo và tham gia.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của mỗi thế giới roleplay. |
| `title` | TEXT | NOT NULL | Tên thế giới, thường là tên bối cảnh hoặc vũ trụ do cộng đồng xây dựng. |
| `description` | TEXT | NULL được phép | Mô tả khái quát về cốt truyện, quy tắc hoặc chủ đề của thế giới. |
| `cover_image` | TEXT | DEFAULT NULL | Đường dẫn ảnh bìa đại diện cho thế giới trên danh sách và trang chi tiết. |
| `is_public` | INTEGER | DEFAULT 1 | Cờ hiển thị cho biết thế giới mở công khai hay chỉ giới hạn theo quyền truy cập nội bộ. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm thế giới được khởi tạo. |

## 4. Bảng `world_members`

Quản lý quan hệ thành viên giữa người dùng và thế giới, bao gồm vai trò và credit cộng đồng.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã bản ghi thành viên trong một thế giới cụ thể. |
| `world_id` | INTEGER | NOT NULL, FK → `worlds(id)` ON DELETE CASCADE | Thế giới mà người dùng đang tham gia. Khi thế giới bị xóa, dữ liệu thành viên liên quan cũng bị xóa theo. |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Người dùng gắn với tư cách thành viên của thế giới đó. Khi tài khoản bị xóa, bản ghi tham gia cũng được dọn sạch. |
| `role` | TEXT | NOT NULL, CHECK(`role` IN ('dev', 'player')) | Vai trò trong thế giới: `dev` cho người điều phối, `player` cho người tham gia thường. |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK(`status` IN ('pending', 'approved', 'rejected')) | Trạng thái duyệt tư cách thành viên, phản ánh việc chấp nhận hay từ chối tham gia. |
| `credits` | INTEGER | DEFAULT 0 | Số credit hiện tại của người dùng trong phạm vi thế giới, dùng để thưởng cho tương tác và điều phối. |
| `joined_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm người dùng được ghi nhận là thành viên của thế giới. |

## 5. Bảng `events`

Lưu các sự kiện hoặc diễn biến theo cốt truyện trong một thế giới.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của sự kiện trong dòng thời gian của thế giới. |
| `world_id` | INTEGER | NOT NULL, FK → `worlds(id)` ON DELETE CASCADE | Thế giới sở hữu sự kiện này; khi thế giới bị xóa, mọi sự kiện con cũng bị xóa. |
| `title` | TEXT | NOT NULL | Tiêu đề sự kiện, dùng để người chơi nhận biết nhanh nội dung hoạt động. |
| `description` | TEXT | NULL được phép | Phần mô tả chi tiết bối cảnh, luật chơi hoặc nội dung nhiệm vụ của sự kiện. |
| `event_type` | TEXT | NOT NULL, CHECK(`event_type` IN ('big', 'small')) | Phân loại sự kiện theo mức độ; `big` thường mang tính điều phối cao hơn, `small` là luồng tương tác nhẹ. |
| `status` | TEXT | NOT NULL, DEFAULT 'proposed', CHECK(`status` IN ('proposed', 'approved', 'open', 'closed', 'rejected')) | Trạng thái vận hành của sự kiện, từ đề xuất đến mở, đóng hoặc bị từ chối. |
| `start_date` | DATETIME | NULL được phép | Mốc bắt đầu dự kiến hoặc chính thức của sự kiện. |
| `end_date` | DATETIME | NULL được phép | Mốc kết thúc dự kiến hoặc chính thức của sự kiện. |
| `created_by` | INTEGER | NOT NULL, FK → `users(id)` | Người tạo sự kiện; cột này xác định ai đã khởi tạo nội dung trong thế giới. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm sự kiện được tạo vào hệ thống. |

## 6. Bảng `posts`

Lưu nội dung bài đăng gắn với sự kiện, bao gồm bài của người chơi, bài của Dev và trạng thái duyệt.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của từng bài đăng trong sự kiện. |
| `event_id` | INTEGER | NULL được phép, FK → `events(id)` ON DELETE CASCADE | Sự kiện mà bài đăng thuộc về; nếu sự kiện bị xóa, bài đăng cũng bị xóa theo. |
| `world_id` | INTEGER | NOT NULL, FK → `worlds(id)` ON DELETE CASCADE | Thế giới chứa bài đăng, dùng cho việc lọc và tính credit trong phạm vi cộng đồng. |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` | Người đăng bài, là chủ thể nhận thưởng hoặc chịu ảnh hưởng bởi tương tác. |
| `content` | TEXT | NOT NULL | Nội dung bài viết của người dùng trong luồng roleplay hoặc thảo luận sự kiện. |
| `image_url` | TEXT | DEFAULT NULL | Đường dẫn hình ảnh đính kèm nếu bài đăng có minh họa. |
| `post_type` | TEXT | NOT NULL, DEFAULT 'normal', CHECK(`post_type` IN ('normal', 'announcement', 'event_description')) | Loại bài đăng, giúp phân biệt nội dung thường, thông báo hoặc mô tả sự kiện. |
| `status` | TEXT | NOT NULL, DEFAULT 'approved', CHECK(`status` IN ('pending', 'approved', 'rejected')) | Trạng thái duyệt của bài viết; luồng nghiệp vụ có thể đặt `pending` cho bài của Player và `approved` cho bài đã qua kiểm duyệt. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm bài đăng được ghi nhận. |

## 7. Bảng `comments`

Lưu bình luận được gắn vào từng bài đăng để hỗ trợ tương tác cộng đồng.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của một bình luận cụ thể. |
| `post_id` | INTEGER | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | Bài đăng mà bình luận đang phản hồi; khi bài đăng bị xóa, toàn bộ bình luận con cũng bị xóa. |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` | Người dùng đã viết bình luận, thường là thành viên đang tương tác với nội dung của sự kiện. |
| `content` | TEXT | NOT NULL | Nội dung trao đổi, phản hồi hoặc diễn đạt thêm cho bài đăng gốc. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm bình luận được đăng lên hệ thống. |

## 8. Bảng `likes`

Lưu hành vi thích nội dung, áp dụng cho bài đăng và mở rộng được cho bình luận.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của một hành vi thích trong hệ thống. |
| `post_id` | INTEGER | NULL được phép, FK → `posts(id)` ON DELETE CASCADE, UNIQUE(`post_id`, `user_id`) | Bài đăng được người dùng thích; cặp khóa duy nhất này ngăn một người thích cùng bài nhiều lần. |
| `comment_id` | INTEGER | NULL được phép, FK → `comments(id)` ON DELETE CASCADE, UNIQUE(`comment_id`, `user_id`) | Bình luận được đánh dấu thích; cột này hỗ trợ mở rộng tương tác ngoài bài viết. |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` | Người thực hiện hành động thích. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm lượt thích được ghi nhận. |

## 9. Bảng `announcements`

Lưu thông báo do Dev hoặc quản trị viên trong thế giới phát hành để truyền tải tin quan trọng.

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả ngữ cảnh |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Mã định danh của thông báo trong một thế giới. |
| `world_id` | INTEGER | NOT NULL, FK → `worlds(id)` ON DELETE CASCADE | Thế giới nhận thông báo; khi thế giới bị xóa, thông báo không còn hiệu lực. |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` | Người đăng thông báo, thường là Dev phụ trách điều phối cộng đồng. |
| `title` | TEXT | NOT NULL | Tiêu đề ngắn gọn để người đọc nhận diện mức độ quan trọng của tin tức. |
| `content` | TEXT | NOT NULL | Nội dung chi tiết của thông báo, ví dụ lịch bảo trì, quy tắc mới hoặc thông tin sự kiện. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời điểm thông báo được phát hành. |

## 10. Ghi Chú Nghiệp Vụ Quan Trọng

- Credit được quản lý theo từng thế giới thông qua bảng `world_members`, không phải ở cấp toàn cục của `users`.
- Trạng thái `events.status` và `posts.status` được dùng trực tiếp trong luồng duyệt nội dung và hiển thị dữ liệu trên API.
- Bảng `likes` được thiết kế linh hoạt cho cả bài đăng và bình luận, nhưng luồng hiện tại của ứng dụng chủ yếu sử dụng cho bài đăng.
- `ON DELETE CASCADE` chỉ xuất hiện ở một số quan hệ để đảm bảo dữ liệu con không bị mồ côi khi cha bị xóa.

## 11. Tóm Tắt Liên Kết Dữ Liệu

- `users` tham gia `worlds` thông qua `world_members`.
- `worlds` sở hữu `events`, `announcements` và thông qua `world_members` xác định Dev/Player.
- `events` sở hữu `posts`.
- `posts` sở hữu `comments` và có thể nhận `likes`.
- `comments` cũng có thể nhận `likes` trong thiết kế mở rộng của hệ thống.
