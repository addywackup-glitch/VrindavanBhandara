# API Reference

The machine-readable contract is the OpenAPI 3.1 document at **`GET /api/openapi`**, rendered as Swagger UI at **`GET /api/docs`**. This file is the human summary; the spec is the source of truth.

## Response envelope

Success:
```json
{ "success": true, "data": <T>, "message": "optional" }
```
Failure:
```json
{ "success": false, "error": "human message", "code": "ERROR_CODE", "issues": [{ "path": "field", "message": "…" }] }
```
List endpoints return a paginated `data`:
```json
{ "success": true, "data": { "data": [ … ], "total": 0, "page": 1, "pageSize": 20, "totalPages": 0 } }
```

See `docs/error-codes.md` for `code` → HTTP status mapping.

## Endpoints

### Auth
| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `RegisterRequest` |
| (login) | NextAuth `/api/auth/[...nextauth]` | public | credentials/OAuth |

### Bookings
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/bookings` | user | own bookings; admins see all; `?status&page&pageSize` |
| POST | `/api/bookings` | user | `CreateBookingRequest` → PENDING booking |
| GET | `/api/bookings/{id}` | owner/admin | full detail |
| PUT | `/api/bookings/{id}` | admin | `UpdateBookingStatusRequest` |

### Payments
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/payment/create-order` | user | Razorpay order (idempotent) |
| POST | `/api/payment/verify` | user | HMAC verify + confirm |
| POST | `/api/payment/webhook` | signature | captured / failed / refund |

### Public
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/services` | active service categories |
| GET | `/api/packages` | `?serviceType&serviceSlug` |
| GET | `/api/testimonials` | `?featured&limit` |
| GET | `/api/faqs` | active FAQs |
| GET | `/api/seva-stats` | visible statistics |

### Admin (RBAC enforced — see `docs/permission-matrix.md`)
| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/admin/bookings` | `bookings:read` |
| PATCH | `/api/admin/bookings/{id}/status` | `bookings:write` |
| GET/POST | `/api/admin/bookings/{id}/proof` | `bookings:read` / `proofs:upload` |
| GET/POST | `/api/admin/packages` | `packages:read` / `packages:write` |
| GET/PATCH/DELETE | `/api/admin/packages/{id}` | `packages:read/write/delete` |
| GET/POST | `/api/admin/blog` | `blogs:read` / `blogs:write` |
| GET/PATCH/DELETE | `/api/admin/blog/{id}` | `blogs:read/write/delete` |
| GET/POST | `/api/admin/gallery` | `gallery:write` |
| PATCH/DELETE | `/api/admin/gallery/{id}` | `gallery:write` |
| PATCH/DELETE | `/api/admin/testimonials/{id}` | `testimonials:approve` |
| PATCH/DELETE | `/api/admin/messages/{id}` | `bookings:read` / `bookings:write` |
| GET/POST | `/api/admin/settings` | `config:write` |
| GET | `/api/admin/stats` | `analytics:read` |

## Breaking changes in Phase 2
- Admin list endpoints now return a **paginated `data` object** (was `{ data, meta }`). The frontend (being rebuilt) must read `data.data` + `data.total/page/pageSize/totalPages`.
- All endpoints now use the unified `{ success, data, error, code }` envelope (some admin routes previously returned bare `{ error }`).
