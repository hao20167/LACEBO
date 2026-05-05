# LACEBO — Nền Tảng Mạng Xã Hội Roleplay

LACEBO là một nền tảng mạng xã hội cho phép người dùng tạo và tham gia vào các thế giới ảo (roleplay), nơi họ có thể tương tác, chia sẻ và xây dựng cộng đồng theo cách thức đơn giản nhưng sâu sắc.

**Mục tiêu:** Cầu nối giữa mạng xã hội truyền thống và Metaverse — cung cấp trải nghiệm roleplay thuận tiện mà không cần công nghệ phức tạp như game 3D hay VR.

---

## Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Chạy Tests](#chạy-tests)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Hướng Dẫn Phát Triển](#hướng-dẫn-phát-triển)

---

## Yêu Cầu Hệ Thống

| Thành Phần | Phiên Bản | Ghi Chú |
|-----------|----------|--------|
| Java | 21+ | Bắt buộc cho Spring Boot backend |
| Node.js | 18+ | Cho frontend build tools |
| npm | 9+ | Quản lý dependencies frontend |
| PostgreSQL | 12+ | Cơ sở dữ liệu (H2 cho testing) |
| Git | 2.0+ | Version control |
| Maven | 3.6+ | Build tool backend |

---

## Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/hao20167/LACEBO.git
cd LACEBO
```

### 2. Cài Đặt Backend (Spring Boot)

```bash
cd server

# Cài đặt dependencies và build
mvn clean install

cd ..
```

**Lưu ý:**
- Đảm bảo Java 21 đã được cài đặt: `java -version`
- Nếu chưa có Maven, có thể dùng `mvnw` (Maven wrapper) được kèm theo

### 3. Cài Đặt Frontend (React + Vite)

```bash
cd client

# Cài đặt dependencies
npm install

cd ..
```

**Ghi chú:**
- Nếu gặp lỗi `EPERM` khi cài npm trên Windows, hãy chạy:
  ```bash
  npm install --cache D:/Git/LACEBO/.npm-cache
  ```

### 4. Cấu Hình Cơ Sở Dữ Liệu (Tùy Chọn)

Nếu muốn sử dụng PostgreSQL thay vì H2 (mặc định cho testing):

1. Đảm bảo PostgreSQL đang chạy
2. Chỉnh sửa `server/src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/lacebo
       username: postgres
       password: your_password
   ```

---

## Chạy Ứng Dụng

### Backend (Spring Boot)

```bash
cd server
mvn spring-boot:run
```

- Backend sẽ chạy tại: `http://localhost:8080`
- Kiểm tra health: `curl http://localhost:8080/api/health`

### Frontend (React + Vite)

Mở terminal **khác** (giữ backend chạy):

```bash
cd client
npm run dev
```

- Frontend sẽ chạy tại: `http://localhost:5173`
- Tự động mở trình duyệt hoặc vào URL trên

### Sử Dụng Ứng Dụng

1. Mở `http://localhost:5173`
2. Đăng ký hoặc đăng nhập
3. Tạo hoặc tham gia thế giới roleplay
4. Khám phá các tính năng: tạo sự kiện, đăng bài, tương tác, xem bảng xếp hạng, v.v.

---

## Chạy Tests

### Backend Tests

```bash
cd server

# Chạy toàn bộ tests
mvn test

# Chỉ chạy unit tests
mvn test -Dtest=*ServiceTest

# Chỉ chạy integration tests
mvn test -Dtest=*IntegrationTest

# Xem coverage report (nếu JaCoCo đã cấu hình)
mvn test jacoco:report
```

### Frontend Tests

```bash
cd client

# Chạy tests (yêu cầu thêm test script vào package.json)
npm run test

# Chế độ watch (tự động chạy lại khi code thay đổi)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Lưu ý:** Frontend tests yêu cầu Vitest + React Testing Library được cài đặt đầy đủ.

---

## Cấu Trúc Dự Án

```
LACEBO/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # Tái sử dụng UI components
│   │   ├── pages/                   # Trang chính (Auth, Worlds, Events, v.v.)
│   │   ├── contexts/                # React Context (AuthContext)
│   │   ├── services/                # API client (Axios instance)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Entry point
│   ├── package.json                 # Dependencies & scripts
│   ├── vite.config.js               # Vite configuration
│   └── tailwind.config.js           # TailwindCSS configuration
│
├── server/                          # Java Spring Boot Backend
│   ├── src/main/java/com/lacebo/
│   │   ├── auth/                    # Authentication logic
│   │   ├── user/                    # User management
│   │   ├── world/                   # World CRUD & features
│   │   ├── event/                   # Event management
│   │   ├── post/                    # Posts, comments, likes
│   │   └── config/                  # Spring configs (Security, CORS, etc.)
│   ├── src/test/java/               # Unit & integration tests
│   ├── pom.xml                      # Maven dependencies & build config
│   └── target/                      # Build output (auto-generated)
│
├── docs/                            # Documentation
│   ├── TEST_PLAN.md                 # Chi tiết test cases & tiêu chí chấp nhận
│   ├── project-structure.tex        # Tài liệu kiến trúc chi tiết
│   └── api-docs.md                  # (Tương lai) API reference docs
│
└── README.md                        # Tài liệu này
```

---

## Hướng Dẫn Phát Triển

### Git Workflow

1. **Tạo nhánh tính năng:**
   ```bash
   git checkout -b feature/task-id-description
   ```

2. **Commit với tin nhắn có format:**
   ```bash
   git commit -m "[TASK-ID] Mô tả ngắn gọn"
   ```
   Ví dụ: `[E1.1] Add Jest setup for backend tests`

3. **Đẩy lên và tạo Pull Request:**
   ```bash
   git push origin feature/task-id-description
   ```

4. **Code Review:**
   - Yêu cầu tối thiểu 1 reviewer trước khi merge
   - Đảm bảo toàn bộ CI checks pass (tests, lint)

5. **Merge vào main:**
   - Sau khi approved, merge và delete nhánh

### Code Style

**Frontend:**
- ESLint: `npx eslint src/`
- Prettier: `npx prettier --write src/`

**Backend:**
- Kiểm tra style: `mvn checkstyle:check`
- Format code: `mvn spotless:apply` (nếu cấu hình)

### Yêu Cầu Trước Khi Merge

- [ ] Toàn bộ tests pass (`mvn test` + `npm run test`)
- [ ] Không có lỗi lint (`npx eslint` + `mvn checkstyle:check`)
- [ ] Code coverage tối thiểu: Backend ≥ 80%, Frontend ≥ 70%
- [ ] Documentation được cập nhật nếu cần
- [ ] PR được review và approve
