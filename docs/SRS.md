# Software Requirements Specification (SRS)
## Nền tảng Mạng xã hội Nhập vai LACEBO (Version 1.0)

---

## 1. Introduction

### 1.1. Document Purpose
Tài liệu này xác định các yêu cầu chức năng và phi chức năng cho hệ thống **Nền tảng Mạng xã hội Nhập vai LACEBO (Version 1.0)**. Tài liệu bao gồm toàn bộ phạm vi quản lý thế giới nhập vai (World), xây dựng cốt truyện (Lore), tổ chức sự kiện (Event), quản lý tương tác cộng đồng và hệ thống điểm công dân (Credits). Đối tượng hướng tới là đội ngũ phát triển phần mềm, kiểm thử viên và giảng viên hướng dẫn để theo dõi tiến độ và kiểm tra tính đúng đắn của hệ thống.

### 1.2. Product Scope
LACEBO là một hệ thống mạng xã hội đóng vai trò bước đệm trung gian giữa các mô hình mạng xã hội truyền thống và không gian Metaverse. Hệ thống tập trung cung cấp các công cụ hỗ trợ nhập vai thông qua văn bản (text-based) và hình ảnh mà không yêu cầu cấu hình phần cứng phức tạp. 

* **Bao gồm:** Tạo và quản lý World, quản lý dòng thời gian Lore, tổ chức các Event nhập vai, đăng tải bài viết và duyệt bài, tích lũy điểm Credits dựa trên hoạt động của Player để xếp hạng.
* **Không bao gồm:** Các tính năng tương tác 3D thời gian thực, VR/AR, hoặc hệ thống giao dịch tiền tệ thực (Real-money trading).

### 1.3. Intended Audience and Document Overview
Tài liệu này dành cho:
* **Giảng viên & Hội đồng chuyên môn:** Đánh giá tính khả thi và logic cấu trúc phần mềm.
* **Đội ngũ phát triển (Dev & QC):** Làm căn cứ thiết kế kiến trúc, cơ sở dữ liệu, lập trình giao diện (UI/UX), API và viết kịch bản kiểm thử (Test Case).

### 1.4. Definitions, Acronyms and Abbreviations

| Thuật ngữ | Định nghĩa |
| :--- | :--- |
| **LACEBO** | Tên nền tảng mạng xã hội nhập vai. |
| **SRS** | Software Requirements Specification – Tài liệu đặc tả yêu cầu phần mềm. |
| **World** | Một không gian nhập vai riêng biệt do Dev tạo ra, có quy tắc và bối cảnh (Lore) riêng. |
| **Dev** | Người sở hữu và quản lý thế giới; có quyền phê duyệt sự kiện, bài đăng và thiết lập quy tắc trong World đó. |
| **Player** | Người chơi tham gia vào World, tạo nhân vật và đăng bài viết nhập vai. |
| **Lore** | Hệ thống các sự kiện theo dòng thời gian, tạo nên lịch sử và tiến trình phát triển của một thế giới ảo. |
| **Event** | Hoạt động nhập vai có thời hạn được tổ chức trong World (bao gồm Big Event từ Dev và Proposed Event từ Player). |
| **Credits** | Đơn vị điểm thưởng tích lũy dựa trên hoạt động của Player, dùng để xếp hạng và xác định vị thế trong một World. |
| **Announcement**| Thông báo chính thức từ Dev gửi đến toàn bộ Player trong một thế giới. |
| **Post** | Nội dung nhập vai (văn bản, hình ảnh) do người dùng tải lên trong phạm vi một World/Event. |

### 1.5. Document Conventions
* Mọi yêu cầu chức năng đều được định danh rõ ràng để phục vụ việc truy vết (Traceability).
* Ngôn ngữ giao diện chính hiển thị: Tiếng Anh. Ngôn ngữ nội dung: Linh hoạt theo người dùng (ưu tiên Tiếng Việt).

### 1.6. References and Acknowledgments
* **Tài liệu gốc (Định dạng `.docx`):** [LACEBO_SRS_v1.0.docx](https://docs.google.com/document/d/1Ewz5Ir_wV8Nm5Lxz2Aopx4txM9JqLNC3/edit?usp=drive_link&ouid=101300263171778238096&rtpof=true&sd=true)
* *Node.js, Express documentation* (https://nodejs.org/, https://expressjs.com/)
* *React, Vite, Tailwind CSS documentation* (https://reactjs.org/, https://tailwindcss.com/)
* *SQLite / better-sqlite3 docs* (https://www.sqlite.org/)
* **Lời cảm ơn:** Giảng viên hướng dẫn TS. Nguyễn Quốc Tuấn cùng nỗ lực nghiên cứu của tập thể thành viên Nhóm 01.

---

## 2. Overall Description

### 2.1. Product Overview
LACEBO hoạt động theo mô hình Client-Server. Hệ thống chia tách rõ ràng giữa giao diện người dùng (React/Tailwind) và hệ thống xử lý nghiệp vụ, lưu trữ dữ liệu (Node.js/Express/SQLite). 

### 2.2. Product Perspective
Hệ thống bao gồm các thành phần giao tiếp cốt lõi:
* **System Interfaces:** Kết nối API RESTful, định dạng dữ liệu JSON. Xác thực sử dụng JSON Web Token (JWT) đặt trong header `Authorization: Bearer <token>`. Cấu hình CORS linh hoạt qua biến môi trường.
* **User Interfaces:** Thiết kế Responsive (Desktop & Mobile). Bao gồm các trang: Login/Register, Home (Khám phá World), World Detail, Event Detail, Create/Manage World, My Worlds và thanh điều hướng chung (Navbar).
* **Hardware Interfaces:** Server chạy Linux x86_64 hoặc Windows Server (Tối thiểu 1 vCPU, 512MB RAM). Client chỉ cần thiết bị đầu cuối chạy được trình duyệt web hiện đại.
* **Software Interfaces:** Node.js (v18+), SQLite (thông qua thư viện `better-sqlite3`).
* **Communications Interfaces:** Giao thức HTTP/HTTPS đảm bảo an toàn dữ liệu đường truyền.

### 2.3. Product Functionality
Hệ thống cung cấp 4 nhóm chức năng cốt lõi:
1.  **Nhóm Xác thực & Tài khoản:** Đăng ký, đăng nhập, phân quyền tự động giữa các vai trò Guest, User, Player, Dev.
2.  **Nhóm Quản trị World & Cốt truyện:** Cho phép khởi tạo World, cập nhật dòng thời gian Lore, đăng thông báo (Announcement), phê duyệt bài đăng của người chơi.
3.  **Nhóm Tương tác & Nhập vai:** Player tham gia World, đề xuất Event, đăng bài viết nhập vai kèm hình ảnh, tương tác Like/Comment.
4.  **Nhóm Thống kê & Xếp hạng:** Hệ thống tự động tính điểm Credits dựa trên tương tác và hiển thị Leaderboard theo từng World.

### 2.4. User Characteristics
* **Guest:** Người dùng chưa đăng nhập, chỉ có thể xem danh sách World công khai.
* **User:** Người dùng đã có tài khoản hệ thống nhưng chưa tham gia vào World cụ thể hoặc đang ở trang tổng quan.
* **Player:** Người dùng đã tham gia vào một World cụ thể, chịu sự quản lý bởi các quy tắc của World đó.
* **Dev:** Chủ sở hữu thế giới (World Creator), có toàn quyền quản trị nội dung trong phạm vi thế giới của mình.

### 2.5. Design and Implementation Constraints
* Hệ thống phải sử dụng SQLite làm cơ sở dữ liệu gọn nhẹ, dễ triển khai tại chỗ.
* Mã nguồn phía Backend viết hoàn toàn bằng Javascript/Node.js để tối ưu hóa hiệu năng bất đồng bộ.

### 2.6. Assumptions and Dependencies
* Giả định rằng người dùng luôn duy trì kết nối Internet ổn định trong quá trình gửi yêu cầu nhập vai.
* Hệ thống phụ thuộc vào tính toàn vẹn của tệp tin cơ sở dữ liệu SQLite cục bộ trên server.

---

## 3. Specific Requirements

### 3.1. External Interface Requirements
Giao diện người dùng sử dụng hệ màu tối (Dark mode) hoặc giao diện hiện đại phù hợp với phong cách gaming/nhập vai. Các API endpoint tuân thủ nghiêm ngặt chuẩn thiết kế:
* `POST /api/auth/register` - Đăng ký tài khoản.
* `POST /api/auth/login` - Đăng nhập nhận JWT.
* `GET /api/worlds` - Lấy danh sách thế giới.
* `POST /api/worlds` - Tạo thế giới mới.

### 3.2. Functional Requirements

#### 3.2.1. Phân quyền Dev / Player
* **Yêu cầu:** Hệ thống phải tự động chuyển đổi vai trò linh hoạt. Một `User A` có thể là **Dev** của `World 1` nhưng đồng thời là **Player** của `World 2`.
* **Logic xử lý:** Phân quyền dựa trên bảng trung gian liên kết giữa `User_ID` và `World_ID`.

#### 3.2.2. Quản lý tài khoản
* **Yêu cầu:** Cho phép người dùng đăng ký tài khoản mới bằng Email trường học (`@sis.hust.edu.vn` hoặc định dạng email hợp lệ) và mật khẩu tối thiểu 6 ký tự.

#### 3.2.3. Quản lý Worlds
* **Yêu cầu:** Dev có quyền khởi tạo World với các trường dữ liệu: Tên World, Mô tả bối cảnh (Lore), Quy tắc ứng xử. Hệ thống cung cấp tính năng "Duyệt thành viên" nếu World ở trạng thái thiết lập riêng tư.

#### 3.2.4. Quản lý Events
* **Yêu cầu:** Đảm bảo hiển thị tiến trình sự kiện trực quan.
    * **Big Event:** Do Dev tạo, tự động chuyển trạng thái Active khi tới thời gian thiết lập.
    * **Proposed Event:** Do Player đề xuất, phải trải qua trạng thái `Proposed` trước khi được Dev phê duyệt thành `Open`.

#### 3.2.5. Quản lý bài viết và tương tác
* **Yêu cầu:** Mọi bài đăng nhập vai của Player trong World phải được đưa vào hàng đợi (Queue) ở trạng thái `Pending`. Chỉ khi Dev nhấn phê duyệt (`Approved`), bài viết mới hiển thị trên bảng tin chung của World. Thành viên trong World có thể tương tác Thả tim (Like) và Bình luận (Comment).

#### 3.2.6. Hệ thống credits và xếp hạng
* **Yêu cầu:** Hệ thống tự động tính điểm dựa trên hành vi:
    * Mỗi bài viết được duyệt: `+10 Credits`.
    * Mỗi lượt Like nhận được: `+2 Credits`.
    * Mỗi bình luận đóng góp: `+1 Credit`.
    * Bảng xếp hạng (Leaderboard) cập nhật theo thời gian thực (Real-time update) hoặc mỗi khi có thay đổi dữ liệu trong bảng điểm.

---

### 3.3. Use Case Model

Hệ thống được chia thành 4 nhóm Use Case chính như sau: