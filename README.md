# LACEBO

LACEBO là một nền tảng mạng xã hội cho phép người dùng tạo và tham gia vào các thế giới ảo (roleplay), nơi họ có thể tương tác, chia sẻ và xây dựng cộng đồng theo cách đơn giản nhưng sâu sắc.

**Mục tiêu:** Cầu nối giữa mạng xã hội truyền thống và metaverse, cung cấp trải nghiệm roleplay thuận tiện mà không cần công nghệ phức tạp như game 3D hay VR.

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
| Node.js | 18+ | Chạy frontend và backend |
| npm | 9+ | Quản lý dependencies |
| Git | 2.0+ | Version control |
| Trình duyệt hiện đại | Mới nhất | Dùng để truy cập ứng dụng |

---

## Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/hao20167/LACEBO.git
cd LACEBO
```

### 2. Cài Đặt Backend

```bash
cd server
npm install
```

### 3. Cài Đặt Frontend

```bash
cd ../client
npm install
```

**Lưu ý:**
- Nếu gặp lỗi `EPERM` khi cài npm trên Windows, hãy dùng cache riêng:
  ```bash
  npm install --cache D:/Git/LACEBO/.npm-cache
  ```
- Backend dùng SQLite và sẽ tự khởi tạo dữ liệu khi chạy lần đầu.

### 4. Cấu Hình Môi Trường

Backend hỗ trợ các biến môi trường sau:

- `PORT`: cổng chạy server, mặc định `3001`
- `JWT_SECRET`: khóa ký JWT
- `CORS_ORIGIN`: nguồn được phép truy cập, mặc định `*`
- `DB_PATH`: đường dẫn SQLite tùy chỉnh

Frontend sẽ dùng `VITE_API_URL` nếu cần trỏ đến API khác:

```bash
VITE_API_URL=http://localhost:3001/api
```

---

## Chạy Ứng Dụng

Mở hai terminal riêng để chạy backend và frontend song song.

### Backend

```bash
cd server
npm run dev
```

- API mặc định chạy tại `http://localhost:3001`
- Kiểm tra nhanh: `http://localhost:3001/api/health`

### Frontend

```bash
cd client
npm run dev
```

- Giao diện mặc định chạy tại `http://localhost:5173`
- Nếu backend chạy ở cổng khác, cập nhật `VITE_API_URL`

---

## Chạy Kiểm Thử

### Unit Test

- Frontend unit test: viết trong [client/src](client/src) bên cạnh mã nguồn, file pattern `*.test.js` / `*.test.jsx`.
- Backend unit test: viết trong [server/src/test](server/src/test), file pattern `*.test.js`.
- Lệnh chạy frontend unit test:

```bash
cd client
npm test
```

- Lệnh chạy backend unit test:

```bash
cd server
npm test
```

### Component Test

- Component test (UI) viết trong [client/src](client/src), đặt cạnh component/page, file pattern `*.test.jsx`.
- Dùng React Testing Library + Vitest để kiểm thử hành vi người dùng.
- Lệnh chạy component test (chạy cùng bộ Vitest với unit test):

```bash
cd client
npm test
```

### Integration Test

- Integration test cho API viết trong [server/src/test](server/src/test), thường dùng suffix `*.integration.test.js`.
- Dùng Jest + Supertest để kiểm thử end-to-end request/response, status code và schema.
- Lệnh chạy integration test:

```bash
cd server
npm run test:integration
```

Lệnh hữu ích khác (backend):

```bash
npm run test:watch
npm run test:coverage
```

---

## Cấu Trúc Dự Án

```text
LACEBO/
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── data/
│   ├── test/
│   ├── package.json
│   └── jest.config.js
│
├── docs/
│   ├── TEST_PLAN.md
│   └── project-structure.tex
│
└── README.md
```

---

## Hướng Dẫn Phát Triển

### Git Workflow

1. Tạo nhánh mới cho từng task.
   ```bash
   git checkout -b feature/task-id-description
   ```

2. Commit ngắn gọn, rõ ràng.
   ```bash
   git commit -m "docs: E1.7 - Update README"
   ```

3. Đẩy nhánh và tạo pull request.
   ```bash
   git push origin feature/task-id-description
   ```

4. Link pull request với issue tương ứng.

### Code Style

#### Frontend

```bash
cd client
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

- ESLint dùng để phát hiện lỗi, import thừa, hook sai và các vấn đề về React.
- Prettier dùng cấu hình chung ở thư mục gốc để chuẩn hóa thụt lề, dấu nháy, khoảng trắng và định dạng JSX/CSS.

#### Backend

```bash
cd server
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

- ESLint dùng để giữ code Node.js/Express rõ ràng và phát hiện lỗi phổ biến sớm.
- Prettier dùng cấu hình chung ở thư mục gốc để đảm bảo format nhất quán cho toàn bộ file JavaScript phía backend.

- Khi sửa code style, ưu tiên chạy `npm run lint:fix` và `npm run format` trước khi commit.