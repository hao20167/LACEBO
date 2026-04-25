# TEST PLAN - LACEBO

## 1. Sprint 1

### 1.1. Thông tin tài liệu

- Dự án: LACEBO - Mạng xã hội Roleplay
- Sprint: Sprint 1
- Phạm vi chính: Auth và World
- Công nghệ mục tiêu:
  - Frontend: React, Vite
  - Backend: Java Spring Boot
- Mục đích tài liệu: Xác định phạm vi kiểm thử, chiến lược kiểm thử, các test case quan trọng và tiêu chí chấp nhận để sẵn sàng merge vào nhánh `main`.

### 1.2. Mục tiêu kiểm thử

Mục tiêu của Sprint 1 là đảm bảo các luồng cốt lõi của hệ thống hoạt động ổn định trước khi tích hợp rộng hơn.

Cụ thể:

- Đảm bảo chức năng Auth hoạt động đúng, bao gồm Đăng ký và Đăng nhập.
- Đảm bảo chức năng World vận hành ổn định ở mức cơ bản, đặc biệt là tạo World mới.
- Phát hiện sớm lỗi logic ở UI, validation, xử lý trạng thái và giao tiếp API.
- Xác nhận các API quan trọng phản hồi đúng dữ liệu, đúng mã trạng thái và đúng ràng buộc nghiệp vụ.

### 1.3. Phạm vi kiểm thử

#### 1.3.1. Trong phạm vi

- Unit Test cho Frontend bằng Vitest.
- Component/interaction test cho UI bằng React Testing Library.
- Unit Test cho Backend bằng JUnit.
- Integration Test cho API bằng Postman và Rest Assured.
- Kiểm thử các luồng chính:
  - Đăng ký tài khoản
  - Đăng nhập
  - Tạo World
- Kiểm thử validation, thông báo lỗi, và phản hồi thành công/thất bại của API.

#### 1.3.2. Ngoài phạm vi

- Performance test, load test, stress test.
- Security penetration test chuyên sâu.
- Kiểm thử thiết bị thật và khả năng tương thích trình duyệt ở mức đầy đủ.
- Các module không liên quan trực tiếp đến Auth và World trong Sprint 1.

### 1.4. Chiến lược kiểm thử

#### 1.4.1. Frontend

- Dùng Vitest để kiểm thử logic thuần, helper, validation và các hàm xử lý dữ liệu.
- Dùng React Testing Library để kiểm thử hành vi người dùng trên component.
- Tập trung vào:
  - Render đúng trạng thái ban đầu.
  - Validation hiển thị đúng khi nhập sai.
  - Nút submit bị vô hiệu hóa hoặc xử lý đúng khi form không hợp lệ.
  - Gọi API đúng payload.
  - Hiển thị thông báo thành công/thất bại đúng.

#### 1.4.2. Backend

- Dùng JUnit để kiểm thử unit test ở cấp service, utility và validation rule của backend Spring Boot.
- Dùng Postman để kiểm thử nhanh các API theo bộ collection có thể chia sẻ với QA và dev.
- Dùng Rest Assured để tự động hóa integration test API, kiểm tra request/response một cách ổn định và có thể tích hợp vào pipeline.
- Tập trung vào:
  - HTTP status code.
  - Schema và nội dung response.
  - Validation input.
  - Xử lý lỗi nghiệp vụ.
  - Tính nhất quán dữ liệu khi tạo mới.

### 1.5. Công cụ kiểm thử

| Công cụ | Mục đích |
| --- | --- |
| Vitest | Chạy unit test và test logic frontend |
| React Testing Library | Kiểm thử component theo hành vi người dùng |
| Postman | Kiểm thử API thủ công và lưu collection |
| JUnit | Unit test cho backend Spring Boot |
| Rest Assured | Automation integration test cho API backend |
| jsdom | Môi trường giả lập DOM cho frontend test |

### 1.6. Test Cases quan trọng

#### 1.6.1. Login

| ID | Mục tiêu | Tiền điều kiện | Bước kiểm thử | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| AUTH-LOGIN-01 | Đăng nhập thành công với thông tin hợp lệ | Tài khoản đã tồn tại | Nhập email/username và mật khẩu hợp lệ, bấm Login | Người dùng đăng nhập thành công và được chuyển sang màn hình phù hợp |
| AUTH-LOGIN-02 | Hiển thị lỗi khi bỏ trống trường bắt buộc | Có form Login | Để trống một hoặc nhiều trường, bấm Login | Form hiển thị thông báo validation rõ ràng |
| AUTH-LOGIN-03 | Hiển thị lỗi khi mật khẩu sai | Tài khoản đã tồn tại | Nhập đúng email nhưng sai mật khẩu | API trả lỗi xác thực, UI hiển thị thông báo phù hợp |
| AUTH-LOGIN-04 | Hiển thị lỗi khi tài khoản không tồn tại | Chưa có tài khoản tương ứng | Nhập thông tin không hợp lệ theo dữ liệu hệ thống | UI hiển thị thông báo không tìm thấy tài khoản hoặc xác thực thất bại |
| AUTH-LOGIN-05 | Không cho submit khi form chưa hợp lệ | Có form Login | Nhập dữ liệu sai định dạng email hoặc mật khẩu quá ngắn | Nút submit bị chặn hoặc hiển thị lỗi trước khi gọi API |
| AUTH-LOGIN-06 | Xử lý lỗi mạng hoặc API timeout | API tạm thời không phản hồi | Gửi request đăng nhập trong điều kiện lỗi mạng | UI hiển thị thông báo lỗi thân thiện, không treo trang |
| AUTH-LOGIN-07 | Kiểm tra JWT Token được lưu thành công vào LocalStorage hoặc Cookie sau khi login | Đăng nhập hợp lệ và backend trả về JWT | Thực hiện login thành công, kiểm tra trạng thái lưu trữ phía trình duyệt | JWT Token được lưu đúng vào LocalStorage hoặc Cookie theo thiết kế, phục vụ xác thực cho các request tiếp theo |

#### 1.6.2. Create World

| ID | Mục tiêu | Tiền điều kiện | Bước kiểm thử | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| WORLD-CREATE-01 | Tạo World mới thành công với dữ liệu hợp lệ | Người dùng đã đăng nhập | Nhập đầy đủ tên World và thông tin bắt buộc, bấm Create | World được tạo thành công và hiển thị trong danh sách hoặc màn hình chi tiết |
| WORLD-CREATE-02 | Validate khi tên World bị trống | Người dùng đã đăng nhập | Bỏ trống tên World, bấm Create | Form hiển thị lỗi validation và không gọi API |
| WORLD-CREATE-03 | Validate khi tên World vượt giới hạn | Người dùng đã đăng nhập | Nhập tên World dài hơn giới hạn cho phép | Hệ thống từ chối dữ liệu và hiển thị thông báo phù hợp |
| WORLD-CREATE-04 | Không cho tạo World trùng tên nếu nghiệp vụ quy định duy nhất | Đã có World cùng tên | Nhập tên World trùng và submit | API trả lỗi nghiệp vụ, UI hiển thị thông báo rõ ràng |
| WORLD-CREATE-05 | Hiển thị lỗi khi payload không hợp lệ | Người dùng đã đăng nhập | Gửi request thiếu field bắt buộc | API trả mã lỗi validation, UI hoặc Postman ghi nhận đúng phản hồi |
| WORLD-CREATE-06 | Xử lý lỗi server khi tạo World | Backend gặp lỗi nội bộ | Gửi request create trong trạng thái server lỗi | UI hiển thị lỗi thân thiện và không mất dữ liệu người dùng nhập |
| WORLD-CREATE-07 | Tạo World với dữ liệu tối thiểu hợp lệ | Người dùng đã đăng nhập | Nhập các trường bắt buộc tối thiểu và submit | Hệ thống chấp nhận dữ liệu và tạo mới thành công |

### 1.7. Tiêu chí chấp nhận

Một hạng mục trong Sprint 1 chỉ được phép merge vào `main` khi thỏa các điều kiện sau:

- Toàn bộ test case trọng yếu của Auth và Create World đã được thực thi và pass.
- Không còn lỗi blocker hoặc critical liên quan đến đăng ký, đăng nhập, hoặc tạo World.
- Frontend unit test và component test quan trọng đều xanh trong Vitest.
- Các API integration test chính đều pass, bao gồm status code, schema và response validation.
- JUnit unit test cho backend và Rest Assured integration test cho API phải đạt trạng thái xanh trong bộ kiểm thử đã quy ước.
- Không có lỗi lint hoặc lỗi type/build làm ảnh hưởng đến khả năng merge.
- Các thay đổi phải được review tối thiểu bởi 1 thành viên kỹ thuật hoặc QA lead, nếu quy trình dự án yêu cầu.
- Không phát sinh regression ở các luồng đã kiểm thử trước đó.
- Các issue tồn đọng còn lại phải được ghi nhận rõ ràng, có mức độ ưu tiên thấp, và không ảnh hưởng đến mục tiêu Sprint 1.

### 1.8. Quy ước ghi nhận kết quả

- `Pass`: Test thực thi đúng kỳ vọng.
- `Fail`: Có sai lệch giữa kết quả thực tế và kỳ vọng.
- `Blocked`: Không thể thực thi do phụ thuộc môi trường, dữ liệu hoặc lỗi hạ tầng.
- `N/A`: Không áp dụng cho scope hiện tại.

### 1.9. Ghi chú cho Sprint 1

- Ưu tiên tự động hóa các test có giá trị lặp lại cao cho Auth và Create World.
- Khi backend Spring Boot chưa hoàn thiện, có thể dùng mock response ở frontend để kiểm thử sớm UI và luồng xử lý trạng thái.
- Bộ test phải được cập nhật đồng bộ khi đặc tả nghiệp vụ Auth hoặc World thay đổi.

## 2. Sprint 2

### 2.1. Thông tin tài liệu


### 2.2. Mục tiêu kiểm thử


### 2.3. Phạm vi kiểm thử


### 2.4. Chiến lược kiểm thử


### 2.5. Công cụ kiểm thử


### 2.6. Test Cases quan trọng


### 2.7. Tiêu chí chấp nhận


## 3. Sprint 3

### 3.1. Thông tin tài liệu


### 3.2. Mục tiêu kiểm thử


### 3.3. Phạm vi kiểm thử


### 3.4. Chiến lược kiểm thử


### 3.5. Công cụ kiểm thử


### 3.6. Test Cases quan trọng


### 3.7. Tiêu chí chấp nhận


