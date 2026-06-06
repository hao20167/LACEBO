# LACEBO API Security Documentation

## Authentication Flow

LACEBO uses **JWT (JSON Web Token)** Bearer token authentication.

### Token Lifecycle

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/users/register` | Create account; returns `{ user, token }` |
| 2 | `POST /api/users/login` | Authenticate; returns `{ user, token }` |
| 3 | All protected routes | Send token in `Authorization: Bearer <token>` header |

### Token Format

- **Algorithm:** HS256
- **Payload:** `{ id, username, iat, exp }`
- **Expiry:** 7 days
- **Secret:** Configured via `JWT_SECRET` environment variable (must be changed from default in production)

### Middleware Behaviour

| Middleware | Effect on missing/invalid token |
|---|---|
| `authMiddleware` | Returns `401 UNAUTHORIZED` |
| `optionalAuth` | Continues without `req.user`; silently ignores bad tokens |

---

## Rate Limits

All limits are per **IP address** using `express-rate-limit` with standard headers (`RateLimit-*`).

| Route | Window | Max Requests | Rationale |
|-------|--------|-------------|-----------|
| `POST /api/users/register` | 1 hour | 5 | Prevent mass account creation |
| `POST /api/users/login` | 15 minutes | 10 | Brute-force mitigation |
| All other API routes | 1 minute | 100 | General abuse prevention |

### Rate Limit Response (HTTP 429)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

Response headers include:
- `RateLimit-Limit` — maximum requests allowed in the window
- `RateLimit-Remaining` — requests remaining in the current window
- `RateLimit-Reset` — Unix timestamp when the window resets

---

## Input Validation Rules

Validation is enforced by `express-validator`. Failed validation returns:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Input validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### `POST /api/users/register`

| Field | Rules |
|-------|-------|
| `username` | Required, 3–30 chars, alphanumeric + undersscores only |
| `email` | Required, valid email format, normalised |
| `password` | Required, min 6 characters |
| `display_name` | Required, max 50 characters |

### `POST /api/users/login`

| Field | Rules |
|-------|-------|
| `username` | Required, non-empty |
| `password` | Required, non-empty |

### `POST /api/worlds`

| Field | Rules |
|-------|-------|
| `title` | Required, max 100 characters |
| `description` | Optional, max 1000 characters |
| `is_public` | Optional, boolean |

### `PATCH /api/worlds/:id/members/:memberId`

| Field | Rules |
|-------|-------|
| `status` | Required, `approved` or `rejected` |

### `POST /api/events/world/:worldId`

| Field | Rules |
|-------|-------|
| `title` | Required, max 100 characters |
| `description` | Optional, max 2000 characters |
| `event_type` | Optional, `big` or `small` |
| `start_date` | Optional, ISO 8601 date |
| `end_date` | Optional, ISO 8601 date |

### `PATCH /api/events/:eventId`

| Field | Rules |
|-------|-------|
| `status` | Optional, one of `proposed`, `approved`, `open`, `closed`, `rejected` |
| `title` | Optional, max 100 characters |

### `POST /api/posts/event/:eventId`

| Field | Rules |
|-------|-------|
| `content` | Required, max 5000 characters |
| `image_url` | Optional, valid URL |

### `PATCH /api/posts/:postId`

| Field | Rules |
|-------|-------|
| `content` | Required, max 5000 characters |

### `POST /api/posts/:postId/comments`

| Field | Rules |
|-------|-------|
| `content` | Required, max 2000 characters |

### `POST /api/posts/world/:worldId/announcements`

| Field | Rules |
|-------|-------|
| `title` | Required, max 150 characters |
| `content` | Required, max 5000 characters |

---

## Authorization & Access Control

### Role-Based Access (RBAC)

| Role | Who | Permissions |
|------|-----|-------------|
| `dev` | World creator / promoted member | Full world management: approve/reject members, posts, events |
| `player` | Approved member | Create posts (goes to pending), create small events (proposed), comment |
| Unauthenticated | Anonymous visitor | Read public worlds and approved posts only |

### Membership Status Flow

```
[Request to join] → pending → approved / rejected
```

Players must be `approved` before posting or commenting.

---

## Error Code Reference

| HTTP | Error Code | Meaning |
|------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Input failed validation rules |
| 400 | `EVENT_NOT_OPEN` | Cannot post to a non-open event |
| 400 | `POST_NOT_PENDING` | Post is not in pending state for approval |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 401 | `INVALID_CREDENTIALS` | Wrong username/password |
| 403 | `FORBIDDEN` | Authenticated but insufficient permissions |
| 403 | `DEV_ONLY` | Requires dev role in the world |
| 403 | `NOT_MEMBER` | User is not an approved member |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate resource (username, email, membership) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Production Security Checklist

- [ ] Set `JWT_SECRET` to a cryptographically random string (≥ 32 bytes)
- [ ] Set `NODE_ENV=production` to suppress stack traces in 500 responses
- [ ] Serve only over HTTPS (TLS termination at reverse proxy)
- [ ] Configure `CORS_ORIGIN` to the exact frontend domain (not `*`)
- [ ] Enable SQLite WAL mode (already configured)
- [ ] Rotate JWT secret periodically; existing sessions will be invalidated
- [ ] Monitor 429 spike alerts for auth endpoints as a brute-force signal
