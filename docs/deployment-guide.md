# Hướng Dẫn Triển Khai LACEBO

> **Dự án:** LACEBO — Nền tảng mạng xã hội Roleplay

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Hướng Dẫn Triển Khai Backend](#2-hướng-dẫn-triển-khai-backend)
3. [Hướng Dẫn Triển Khai Frontend](#3-hướng-dẫn-triển-khai-frontend)
4. [Hướng Dẫn Phối Hợp Triển Khai (Integration)](#4-hướng-dẫn-phối-hợp-triển-khai-integration)
5. [Sự Cố Thường Gặp (Troubleshooting)](#5-sự-cố-thường-gặp-troubleshooting)

---

## 1. Tổng Quan

LACEBO được xây dựng theo kiến trúc **Client–Server** tách biệt:

| Thành phần | Công nghệ | Thư mục |
|-----------|-----------|---------|
| Frontend | React 18, Vite 5, TailwindCSS 3, Axios | `client/` |
| Backend | Node.js, Express 4, better-sqlite3, JWT | `server/` |
| Cơ sở dữ liệu | SQLite 3 (file-based) | `server/data/lacebo.db` |

### Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu | Ghi chú |
|-----------|---------------------|---------|
| **Node.js** | 18.x trở lên | Khuyến nghị LTS (20.x hoặc 22.x) |
| **npm** | 9.x trở lên | Đi kèm Node.js |
| **SQLite 3** | 3.x | Được nhúng sẵn qua package `better-sqlite3` |
| **Git** | 2.0+ | Clone và quản lý mã nguồn |
| **Trình duyệt** | Chrome / Firefox / Edge (bản mới) | Truy cập giao diện người dùng |

### Cấu trúc thư mục liên quan triển khai

```text
LACEBO/
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── services/api.js  # Axios client, đọc VITE_API_URL
│   │   └── ...
│   ├── vite.config.js       # Dev server + proxy /api
│   ├── package.json
│   └── dist/                # Thư mục build production (sau npm run build)
│
├── server/                  # Backend (Express + SQLite)
│   ├── src/
│   │   ├── config/index.js  # Đọc biến môi trường
│   │   ├── database/
│   │   │   ├── connection.js
│   │   │   └── schema.js    # Khởi tạo schema tự động
│   │   └── index.js         # Entry point
│   ├── data/                # File SQLite (gitignored)
│   │   └── lacebo.db
│   └── package.json
│
└── docs/                    # Tài liệu dự án
```

> **Lưu ý:** Dự án hiện **chưa có** file `.env.example` trong repository. Khi triển khai, tạo file `.env` thủ công theo hướng dẫn ở các mục bên dưới.

---

## 2. Hướng Dẫn Triển Khai Backend

### 2.1. Clone và cài đặt dependencies

```bash
git clone https://github.com/hao20167/LACEBO.git
cd LACEBO/server
npm install
```

#### Lưu ý về `better-sqlite3` và `node-gyp` trên Windows

Backend sử dụng **`better-sqlite3`** — một native addon cần biên dịch C++ khi cài đặt. Trên Windows, nếu `npm install` thất bại với lỗi liên quan đến `node-gyp`, `MSBuild` hoặc `gyp ERR!`, hãy cài đặt các công cụ build sau:

**Cách 1 — Visual Studio Build Tools (khuyến nghị):**

1. Tải [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. Trong installer, chọn workload **"Desktop development with C++"**.
3. Đảm bảo có các component: **MSVC**, **Windows SDK**, **C++ CMake tools**.
4. Cài đặt **Python 3.x** (node-gyp yêu cầu Python trên PATH).
5. Chạy lại:

```bash
cd server
npm install
```

**Cách 2 — Dùng npm cache riêng (khi gặp lỗi `EPERM` trên Windows):**

```bash
npm install --cache D:/Git/LACEBO/.npm-cache
```

**Cách 3 — Cài prebuilt binary (nếu phiên bản Node.js tương thích):**

```bash
npm install better-sqlite3 --build-from-source=false
```

### 2.2. Biến môi trường Backend

Tạo file `server/.env` (không commit file này lên Git):

```bash
# server/.env

# Cổng HTTP mà Express lắng nghe (mặc định: 3001)
PORT=3001

# Khóa bí mật ký JWT — BẮT BUỘC đổi trên production
JWT_SECRET=your-strong-random-secret-here

# Origin được phép gọi API (CORS)
# Development: có thể dùng * hoặc http://localhost:5173
# Production: đặt URL frontend cụ thể, ví dụ https://lacebo.example.com
CORS_ORIGIN=http://localhost:5173

# Đường dẫn tuyệt đối hoặc tương đối tới file SQLite
# Nếu không đặt, mặc định là server/data/lacebo.db
DB_PATH=./data/lacebo.db

# Môi trường chạy (production / development / test)
NODE_ENV=production
```

#### Bảng giải thích chi tiết

| Biến môi trường | Bắt buộc | Giá trị mặc định | Mô tả |
|----------------|----------|------------------|-------|
| `PORT` | Không | `3001` | Cổng server API. Đọc tại `server/src/config/index.js`. |
| `JWT_SECRET` | **Có** (production) | `lacebo-secret-key-change-in-production` | Khóa ký và xác minh JWT. Nếu không đổi, hệ thống dùng giá trị mặc định **không an toàn**. |
| `CORS_ORIGIN` | Không | `*` | Origin được phép gọi API. Express dùng `cors({ origin: config.corsOrigin })`. |
| `DB_PATH` | Không | `server/data/lacebo.db` | Đường dẫn file SQLite. Thư mục cha được tạo tự động nếu chưa tồn tại. |
| `NODE_ENV` | Không | *(không đặt)* | Khi đặt `test`, server **không** lắng nghe cổng (phục vụ Jest). Production nên đặt `production`. |

> **Quan trọng:** Dự án LACEBO **không** sử dụng biến `DATABASE_URL` (thường thấy ở PostgreSQL/MySQL). Thay vào đó, dùng `DB_PATH` trỏ tới file `.db` cục bộ.

#### Thời hạn JWT

Thời gian hết hạn token được cấu hình cố định trong code là **7 ngày** (`jwtExpiresIn: '7d'` tại `server/src/config/index.js`), không đọc từ biến môi trường.

### 2.3. Khởi tạo database và migration

LACEBO **không có** script migration riêng (không dùng Knex, Prisma Migrate, v.v.). Schema được khởi tạo **tự động** khi server khởi động:

1. `server/src/index.js` gọi `initDatabase()` ngay khi import.
2. `server/src/database/schema.js` thực thi `CREATE TABLE IF NOT EXISTS` cho 8 bảng: `users`, `worlds`, `world_members`, `events`, `posts`, `comments`, `likes`, `announcements`.
3. `server/src/database/connection.js` tạo thư mục `data/` nếu chưa có, mở file DB, bật **WAL mode** và **foreign keys**.

**Không cần chạy lệnh migration thủ công.** Chỉ cần khởi động server lần đầu:

```bash
cd server
npm run dev
```

Kiểm tra database đã được tạo:

```bash
# Windows PowerShell
Test-Path .\data\lacebo.db

# Linux / macOS
ls -la data/lacebo.db
```

### 2.4. Chạy server

#### Development (hot-reload với `--watch`)

```bash
cd server
npm run dev
```

- API chạy tại: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`
- Phản hồi kỳ vọng: `{"status":"ok"}`

#### Production

```bash
cd server
# Đặt biến môi trường (Linux/macOS)
export NODE_ENV=production
export JWT_SECRET="your-production-secret"
export CORS_ORIGIN="https://your-frontend-domain.com"
export PORT=3001

npm start
```

```powershell
# Windows PowerShell
$env:NODE_ENV = "production"
$env:JWT_SECRET = "your-production-secret"
$env:CORS_ORIGIN = "https://your-frontend-domain.com"
$env:PORT = "3001"

npm start
```

Trên production, khuyến nghị dùng process manager:

```bash
# Ví dụ với PM2
npm install -g pm2
cd server
pm2 start src/index.js --name lacebo-api
pm2 save
pm2 startup
```

#### Các API endpoint chính

| Prefix | Mô tả |
|--------|-------|
| `/api/health` | Kiểm tra trạng thái server |
| `/api/users` | Đăng ký, đăng nhập, profile |
| `/api/worlds` | CRUD world, thành viên, leaderboard |
| `/api/events` | Quản lý sự kiện |
| `/api/posts` | Bài viết, comment, like, announcement |

---

## 3. Hướng Dẫn Triển Khai Frontend

### 3.1. Cài đặt dependencies

```bash
cd LACEBO/client
npm install
```

Frontend **không** dùng native addon, nên `npm install` thường không gặp vấn đề `node-gyp`. Nếu gặp lỗi `EPERM` trên Windows:

```bash
npm install --cache D:/Git/LACEBO/.npm-cache
```

### 3.2. Biến môi trường Frontend

Tạo file `client/.env` hoặc `client/.env.local` (Vite tự đọc, không commit):

```bash
# client/.env

# URL gốc của Backend API (bao gồm prefix /api)
# Development: thường KHÔNG cần đặt — Vite proxy tự chuyển /api → localhost:3001
# Production: bắt buộc đặt URL backend thực tế
VITE_API_URL=http://localhost:3001/api
```

#### Bảng giải thích

| Biến | Bắt buộc | Giá trị mặc định | Mô tả |
|------|----------|------------------|-------|
| `VITE_API_URL` | Không (dev) / **Có** (prod) | `/api` | Base URL cho Axios tại `client/src/services/api.js`. Chỉ biến có prefix `VITE_` mới được expose ra client. |

**Cách hoạt động trong Development:**

`client/vite.config.js` cấu hình proxy:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

Khi `VITE_API_URL` không được đặt, frontend gọi `/api/...` — Vite dev server tự proxy sang backend `http://localhost:3001`.

**Cách hoạt động trong Production:**

Sau `npm run build`, không còn Vite dev server. Cần một trong hai:

- Đặt `VITE_API_URL` trỏ tới backend trước khi build, **hoặc**
- Cấu hình reverse proxy (Nginx) chuyển `/api` tới backend (xem mục 4).

### 3.3. Chạy Development

```bash
cd client
npm run dev
```

- Giao diện: `http://localhost:5173`
- Đảm bảo backend đang chạy tại `http://localhost:3001`

### 3.4. Build Production

```bash
cd client

# Đặt API URL trước khi build (production)
# Linux/macOS:
export VITE_API_URL=https://api.lacebo.example.com/api

# Windows PowerShell:
$env:VITE_API_URL = "https://api.lacebo.example.com/api"

npm run build
```

Kết quả build nằm tại `client/dist/`. Xem trước build local:

```bash
npm run preview
# Mặc định: http://localhost:4173
```

#### Phục vụ static files

Triển khai thư mục `dist/` bằng Nginx, Apache, hoặc dịch vụ static hosting (Vercel, Netlify, S3 + CloudFront, v.v.).

---

## 4. Hướng Dẫn Phối Hợp Triển Khai (Integration)

### 4.1. Kiến trúc triển khai đề xuất

```text
┌─────────────────┐         ┌──────────────────┐
│   Trình duyệt   │ ──────► │  Reverse Proxy   │
│   (User)        │         │  (Nginx / Caddy) │
└─────────────────┘         └────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                                 ▼
           ┌────────────────┐              ┌─────────────────┐
           │  Static Files  │              │  Node.js API    │
           │  client/dist/  │              │  server/ :3001  │
           │  (Frontend)    │              │  (Backend)      │
           └────────────────┘              └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │  SQLite DB      │
                                           │  lacebo.db      │
                                           └─────────────────┘
```

### 4.2. Cấu hình CORS

Backend đọc `CORS_ORIGIN` từ biến môi trường (`server/src/config/index.js`):

```javascript
corsOrigin: process.env.CORS_ORIGIN || '*',
```

| Môi trường | Giá trị `CORS_ORIGIN` khuyến nghị |
|-----------|-----------------------------------|
| Development | `http://localhost:5173` hoặc `*` |
| Production | URL chính xác của frontend, ví dụ `https://lacebo.example.com` |

**Không dùng `*` trên production** nếu frontend gửi cookie hoặc cần bảo mật chặt chẽ hơn.

### 4.3. Cấu hình Reverse Proxy (Nginx)

Ví dụ Nginx phục vụ frontend và proxy API — **khuyến nghị cho production**:

```nginx
server {
    listen 80;
    server_name lacebo.example.com;

    # Frontend — static files từ Vite build
    root /var/www/lacebo/client/dist;
    index index.html;

    # SPA fallback: mọi route không phải file tĩnh → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy tới Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Với cấu hình trên:

- Build frontend **không cần** đặt `VITE_API_URL` (mặc định `/api` hoạt động cùng domain).
- Đặt `CORS_ORIGIN=https://lacebo.example.com` trên backend.

### 4.4. Triển khai tách domain (Frontend và Backend khác origin)

Nếu frontend tại `https://app.lacebo.com` và API tại `https://api.lacebo.com`:

**Backend `.env`:**

```bash
CORS_ORIGIN=https://app.lacebo.com
```

**Frontend build:**

```bash
VITE_API_URL=https://api.lacebo.com/api npm run build
```

### 4.5. Quyền ghi cho SQLite trên môi trường deploy

SQLite lưu dữ liệu dưới dạng **file** trên đĩa. Backend cần quyền **đọc và ghi** trên:

| Đường dẫn | Mô tả |
|-----------|-------|
| `server/data/lacebo.db` | File database chính |
| `server/data/lacebo.db-wal` | Write-Ahead Log (tự tạo khi bật WAL mode) |
| `server/data/lacebo.db-shm` | Shared memory file (tự tạo) |
| Thư mục `server/data/` | Phải có quyền tạo file mới |

**Linux (ví dụ user `lacebo` chạy PM2):**

```bash
sudo mkdir -p /opt/lacebo/server/data
sudo chown -R lacebo:lacebo /opt/lacebo/server/data
sudo chmod 750 /opt/lacebo/server/data
```

**Kiểm tra quyền:**

```bash
ls -la /opt/lacebo/server/data/
# Phải thấy lacebo.db và user lacebo có quyền rw-
```

**Lưu ý quan trọng:**

- Không đặt file DB trên filesystem **read-only** (ví dụ: Docker image layer không có volume mount).
- Khi backup, **dừng server** hoặc dùng SQLite backup API để tránh file bị corrupt.
- Chỉ chạy **một instance** backend ghi vào cùng một file DB (tránh `SQLITE_BUSY`).

### 4.6. Checklist triển khai hoàn chỉnh

```bash
# 1. Backend
cd server
npm install
# Tạo .env với JWT_SECRET mạnh, CORS_ORIGIN đúng
npm start

# 2. Kiểm tra API
curl http://localhost:3001/api/health

# 3. Frontend
cd ../client
npm install
# Đặt VITE_API_URL nếu cần (hoặc dùng reverse proxy)
npm run build

# 4. Deploy dist/ + cấu hình reverse proxy
# 5. Xác nhận đăng ký / đăng nhập hoạt động end-to-end
```

---

## 5. Sự Cố Thường Gặp (Troubleshooting)

### 5.1. Lỗi `node-gyp` / `better-sqlite3` khi `npm install` (Windows)

**Triệu chứng:**

```text
gyp ERR! find VS
gyp ERR! stack Error: Could not find any Visual Studio installation to use
npm ERR! code 1
npm ERR! path .../node_modules/better-sqlite3
```

**Nguyên nhân:** `better-sqlite3` cần biên dịch native module, thiếu C++ build tools.

**Cách khắc phục:**

1. Cài **Visual Studio Build Tools** với workload **Desktop development with C++**.
2. Cài **Python 3.x**, thêm vào PATH.
3. Mở terminal mới (Developer Command Prompt nếu có).
4. Chạy lại:

```bash
cd server
npm rebuild better-sqlite3
# hoặc
npm install
```

5. Nếu vẫn lỗi, kiểm tra phiên bản Node.js tương thích:

```bash
node -v
npm -v
```

Đảm bảo Node.js ≥ 18. Tránh dùng phiên bản quá mới chưa có prebuilt binary cho `better-sqlite3`.

---

### 5.2. Lỗi API 401 (Unauthorized)

**Triệu chứng:** Request trả về `401` với body `{"error":"Authentication required"}` hoặc `{"error":"Invalid token"}`.

**Nguyên nhân và cách khắc phục:**

| Nguyên nhân | Cách khắc phục |
|-------------|----------------|
| Không gửi header `Authorization` | Frontend tự gắn token qua Axios interceptor (`client/src/services/api.js`). Đăng nhập lại để lấy token mới. |
| Token hết hạn (sau 7 ngày) | Đăng nhập lại. Token được lưu tại `localStorage` key `lacebo_token`. |
| `JWT_SECRET` khác nhau giữa các lần deploy | Đảm bảo `JWT_SECRET` **cố định** trên mọi instance backend. Đổi secret sẽ vô hiệu hóa toàn bộ token cũ. |
| Token bị xóa do interceptor 401 | Axios tự `clearStoredSession()` khi nhận 401. Kiểm tra Network tab: request có header `Bearer <token>` không. |

**Kiểm tra nhanh:**

```bash
# Đăng nhập lấy token
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"youruser","password":"yourpass"}'

# Gọi API có auth
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <token_từ_bước_trên>"
```

---

### 5.3. Lỗi CORS

**Triệu chứng (trên Console trình duyệt):**

```text
Access to XMLHttpRequest at 'http://localhost:3001/api/...' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**Nguyên nhân:** `CORS_ORIGIN` trên backend không khớp origin của frontend.

**Cách khắc phục:**

1. Đặt `CORS_ORIGIN` khớp chính xác origin frontend (bao gồm scheme và port):

```bash
# server/.env
CORS_ORIGIN=http://localhost:5173
```

2. Khởi động lại backend sau khi đổi `.env`.

3. **Development:** Dùng Vite proxy (mặc định `/api` → `localhost:3001`) để tránh CORS hoàn toàn — không gọi thẳng `http://localhost:3001` từ browser.

4. **Production:** Dùng reverse proxy cùng domain (mục 4.3) hoặc cấu hình `CORS_ORIGIN` đúng domain frontend.

---

### 5.4. Lỗi `SQLITE_BUSY` / database locked

**Triệu chứng:**

```text
SqliteError: database is locked
SQLITE_BUSY: database is locked
```

**Nguyên nhân:**

- Nhiều process/instance backend cùng ghi một file DB.
- Backup hoặc copy file DB khi server đang chạy.
- Filesystem/network share (NFS, SMB) không hỗ trợ file locking tốt.
- Thiếu quyền ghi trên thư mục `data/`.

**Cách khắc phục:**

1. Chỉ chạy **một** instance backend trên mỗi file DB:

```bash
pm2 list
# Đảm bảo chỉ có 1 process lacebo-api
```

2. Kiểm tra quyền thư mục `data/` (xem mục 4.5).

3. Dừng server trước khi backup:

```bash
pm2 stop lacebo-api
cp server/data/lacebo.db /backup/lacebo-$(date +%Y%m%d).db
pm2 start lacebo-api
```

4. Tránh đặt DB trên network drive. Dùng local disk hoặc volume mount dedicated.

5. LACEBO đã bật WAL mode (`db.pragma('journal_mode = WAL')`) — đảm bảo file `-wal` và `-shm` không bị xóa thủ công khi server đang chạy.

---

### 5.5. Frontend không kết nối được API (Network Error)

**Triệu chứng:** Axios timeout hoặc `Network Error`, không có response.

**Checklist:**

```bash
# Backend có chạy không?
curl http://localhost:3001/api/health

# VITE_API_URL có đúng không? (production)
# Phải kết thúc bằng /api, ví dụ: http://localhost:3001/api

# Firewall có chặn cổng 3001 không?
```

---

### 5.6. Lỗi `EPERM` khi `npm install` (Windows)

**Cách khắc phục:**

```bash
npm install --cache D:/Git/LACEBO/.npm-cache
```

Hoặc chạy terminal với quyền Administrator, tắt antivirus tạm thời nếu nó khóa thư mục `node_modules`.

---

## Phụ Lục

### A. Scripts npm tham khảo

| Thư mục | Lệnh | Mục đích |
|---------|------|----------|
| `server/` | `npm run dev` | Development với auto-reload |
| `server/` | `npm start` | Production |
| `server/` | `npm test` | Unit & integration test |
| `client/` | `npm run dev` | Vite dev server (:5173) |
| `client/` | `npm run build` | Build ra `dist/` |
| `client/` | `npm run preview` | Xem trước build production |

### B. Tài liệu liên quan

- [README.md](../README.md) — Hướng dẫn cài đặt và phát triển
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Schema cơ sở dữ liệu
- [TEST_PLAN.md](./TEST_PLAN.md) — Kế hoạch kiểm thử
- [API_WORLDS.md](./API_WORLDS.md), [API_EVENTS.md](./API_EVENTS.md), [API_POSTS.md](./API_POSTS.md) — Tài liệu API

---
