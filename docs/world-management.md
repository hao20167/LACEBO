# World Management — Hướng dẫn người dùng theo chức năng hiện có

Tài liệu này mô tả chức năng quản lý World đang được triển khai trong dự án LACEBO: tạo world, duyệt thành viên, post, sự kiện và quản lý world ở cấp độ dev/player.

## Tổng quan
- Trong ứng dụng, một World là không gian cộng đồng nơi người dùng có thể tham gia, đăng bài và tham gia sự kiện.
- Người tạo World được gán vai trò `dev` và có quyền quản lý chính.
- Người tham gia khác vào World sẽ có vai trò `player` và cần được duyệt nếu chưa là thành viên.
- Quy trình hiện tại không hỗ trợ nhiều vai trò phức tạp hơn; chỉ có `dev`và `player`.

## Khám phá và danh sách World
- Người dùng có thể tìm kiếm theo tiêu đề world qua trường `search`.
- Trang `My Worlds` hiển thị các world mà người dùng đã tham gia với trạng thái `approved`.

## Tạo World
- Trang tạo world: `Create World`.
- Form tạo world yêu cầu:
  - `title`: bắt buộc
  - `description`: không bắt buộc
- Creator mặc định trở thành `dev` của World và được duyệt ngay.

## Chi tiết World
- Mỗi world hiển thị:
  - tiêu đề và mô tả World
  - số lượng thành viên đã được duyệt
  - trạng thái thành viên hiện tại của người dùng (dev/player/pending)
  - danh sách sự kiện lore theo timeline
  - thông báo (announcements)
  - bảng xếp hạng credits
- Những người chưa là thành viên có thể nhấn `Join World` để gửi yêu cầu vào World.
- Người dùng đăng ký sẽ vào trạng thái `pending` và chờ dev duyệt.

## Quyền hạn người dùng
- `dev` trong World:
  - được cấp khi tạo World
  - có quyền duyệt thành viên pending
  - có quyền duyệt bài viết pending
  - có quyền duyệt và mở/sửa trạng thái event proposed
  - có thể đăng announcements
  - có thể truy cập trang quản lý 
- `player` trong World:
  - là thành viên đã được duyệt
  - có thể xem nội dung World
  - có thể đăng post vào event `open`
  - có thể đề xuất small event
  - có thể comment, like bài viết
- `pending`:
  - là người đã gửi yêu cầu tham gia nhưng chưa được duyệt
  - không thể đăng bài hoặc tạo event

## Quản lý World (WorldManage)
- Giao diện quản lý chỉ mở cho dev đã được duyệt.
- Giao diện quản lý có 3 tab:
  - Pending Members: duyệt hoặc từ chối yêu cầu tham gia
  - Pending Posts: duyệt hoặc từ chối bài viết chờ duyệt
  - Proposed Events: duyệt hoặc từ chối đề xuất small event

## Tạo và quản lý sự kiện
- Người dùng dev có thể tạo event:
  - `big` event: mở thẳng trạng thái `open`
  - `small` event: nếu dev tạo thì trạng thái `approved`
- Người chơi bình thường chỉ có thể đề xuất `small` event với trạng thái `proposed`.
- Events trong world được hiển thị trên trang chi tiết World theo lịch mở và trạng thái.
- Dev có thể thay đổi trạng thái event bằng API patch.

## Thông báo (Announcements)
- Chỉ `dev` mới có thể tạo announcement cho World.
- Announcement xuất hiện trong tab `announcements` của trang World.

## Post, comment và credits
- Post được tạo trong event phải có `content`.
- Nếu người dùng là dev, post được phê duyệt tự động.
- Nếu người dùng là player, post được tạo với `status = pending` và cần đợi dev duyệt.
- Bài viết được duyệt sẽ cộng credits cho người tạo.
- Người chơi cũng có thể bình luận, và mỗi comment ghi nhận credits.
- Like/unlike post bằng API `/posts/:postId/like` sẽ cộng/trừ credits cho tác giả.

## Leaderboard
- Leaderboard world lấy credit từ bảng `world_members` và sắp xếp giảm dần.
- Trang chi tiết world hiển thị leaderboard với thông tin tên người dùng và credits.

## Giới hạn hiện tại
- Hiện không có chức năng chỉnh sửa world sau khi tạo.
- Không có xóa world trong frontend.
- Không có import/export dữ liệu world trong code hiện tại.
- Quyền chỉ đơn giản `dev` và `player`; chưa hỗ trợ nhiều cấp quản lý hơn.

## Hướng dẫn ngắn
1. Tạo World từ `/worlds/create`.
2. Dùng `/worlds` để duyệt world công khai.
3. Vào `/worlds/:id` để xem chi tiết và join.
4. Sau khi trở thành dev, vào `/worlds/:id/manage` để duyệt thành viên, bài viết và sự kiện đề xuất.
5. Dùng tab `leaderboard` để kiểm tra credits của thành viên.
