# API Documentation - Uploads

This document describes file upload endpoints in LACEBO API v2.

## Overview
- **Base URL:** `/api/uploads`
- **Static Files:** Uploaded files are served from `/uploads`.
- **Authentication:** Required for upload endpoints.

---

## 1. Upload Image
- **Endpoint:** `POST /api/uploads/images`
- **Authentication:** Required.
- **Content Type:** `multipart/form-data`
- **Form Fields:**
  - `image`: Required image file. The server accepts MIME types beginning with `image/`.
- **Limits:**
  - Maximum file size: 5 MB.
- **Response (201 Created):**
  ```json
  {
    "url": "/uploads/images/1717760000000-123456789.png",
    "filename": "1717760000000-123456789.png",
    "mimetype": "image/png",
    "size": 1024
  }
  ```
- **Errors:**
  - `400 Bad Request` when the file is missing, too large, or not an image.
  - `401 Unauthorized` when the token is missing or invalid.

The returned `url` can be stored as a user `avatar`, post `image_url`, or world image value in follow-up API calls.
