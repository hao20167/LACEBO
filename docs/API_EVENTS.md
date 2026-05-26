# API Documentation - Events Module

Tai lieu nay mo ta cac endpoint quan ly events trong he thong LACEBO.

## Tong quan
- Base URL: `/api/events`
- Auth: JWT Bearer token voi header `Authorization: Bearer <JWT_TOKEN>`
- Role:
  - `dev`: duoc tao big event, duyet/sua event
  - `player`: co the tao small event o trang thai de xuat

---

## A2.1 - Tao event
- Endpoint: `POST /api/events/world/:worldId`
- Auth: Bat buoc
- Request body:
  ```json
  {
    "title": "Moonfall Siege",
    "description": "Main story chapter",
    "event_type": "big",
    "start_date": "2026-06-01T09:00:00.000Z",
    "end_date": "2026-06-02T09:00:00.000Z"
  }
  ```
- Rule:
  - Dev tao `big` -> status `open`
  - Dev tao `small` -> status `approved`
  - Player chi duoc tao `small` -> status `proposed`
  - Player tao `big` -> `403 Forbidden`
- Response: `201 Created` voi event vua tao

---

## A2.2 - Lore timeline cua world
- Endpoint: `GET /api/events/world/:worldId`
- Auth: Khong bat buoc
- Mo ta: Tra ve events da duoc cong bo voi status trong tap `approved`, `open`, `closed`
- Response: `200 OK`
  ```json
  [
    {
      "id": 10,
      "world_id": 1,
      "title": "Moonfall Siege",
      "event_type": "big",
      "status": "open",
      "creator_name": "dev_user",
      "creator_display_name": "Lead Dev",
      "post_count": 12
    }
  ]
  ```

---

## A2.3 - Danh sach events cho duyet (dev only)
- Endpoint: `GET /api/events/world/:worldId/proposed`
- Auth: Bat buoc
- Quyen: Chi `dev` cua world duoc truy cap
- Response: `200 OK` danh sach events co status `proposed`
- Loi:
  - `403 Forbidden`: khong phai dev

---

## A2.4 - Chi tiet event
- Endpoint: `GET /api/events/:eventId`
- Auth: Khong bat buoc
- Response: `200 OK` voi thong tin event + creator
- Loi:
  - `404 Not Found`: event khong ton tai

---

## A2.5 - Cap nhat/duyet/mo/dong event
- Endpoint: `PATCH /api/events/:eventId`
- Auth: Bat buoc
- Quyen: Chi `dev` cua world
- Request body (gui mot hoac nhieu truong):
  ```json
  {
    "status": "approved",
    "title": "New Event Title",
    "description": "Updated description",
    "start_date": "2026-06-03T09:00:00.000Z",
    "end_date": "2026-06-03T18:00:00.000Z"
  }
  ```
- Response: `200 OK` voi event sau cap nhat
- Loi:
  - `403 Forbidden`: khong phai dev
  - `404 Not Found`: event khong ton tai

---

## Ma loi pho bien
- `400`: Du lieu dau vao thieu (vi du title)
- `401`: Thieu token hoac token khong hop le
- `403`: Khong du quyen thao tac
- `404`: Khong tim thay world/event

---

## Kiem thu de xuat
- `npm test -- src/test/events.integration.test.js`
- `npm test -- src/test/events.integration.test.js src/test/posts.integration.test.js`
