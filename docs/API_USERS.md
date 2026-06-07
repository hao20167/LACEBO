# API Documentation - Users

This document describes user authentication and profile endpoints in LACEBO API v2.

## Overview
- **Base URL:** `/api/users`
- **Authentication:** Required only for private current-user endpoints.

---

## 1. Register
- **Endpoint:** `POST /api/users/register`
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "username": "player_one",
    "email": "player@example.com",
    "password": "Password123!",
    "display_name": "Player One"
  }
  ```
- **Response (201 Created):** Returns `{ "user": {...}, "token": "..." }`.

---

## 2. Login
- **Endpoint:** `POST /api/users/login`
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "username": "player_one",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):** Returns `{ "user": {...}, "token": "..." }`.

---

## 3. Get Current User
- **Endpoint:** `GET /api/users/me`
- **Authentication:** Required.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "username": "player_one",
    "email": "player@example.com",
    "display_name": "Player One",
    "avatar_url": null,
    "created_at": "2026-06-07 12:00:00"
  }
  ```

---

## 4. Get Public User Profile
- **Endpoint:** `GET /api/users/:id`
- **Authentication:** Not required.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "username": "player_one",
    "display_name": "Player One",
    "avatar_url": "/uploads/avatar.png",
    "created_at": "2026-06-07 12:00:00"
  }
  ```
- **Errors:**
  - `400 Bad Request` when `id` is not a positive integer.
  - `404 Not Found` when the user does not exist.
