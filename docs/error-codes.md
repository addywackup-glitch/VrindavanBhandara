# Error Codes

All failures return `{ success: false, error, code, issues? }`. The `code` is stable and client-safe; `error` is a human-readable message; `issues` is present for validation failures.

| Code | HTTP | Thrown by (domain error) | Meaning |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 422 | `ValidationError` | Input failed Zod validation; see `issues[]` |
| `UNAUTHORIZED` | 401 | `AuthenticationError` | No / invalid session |
| `FORBIDDEN` | 403 | `AuthorizationError` | Authenticated but lacks role/permission/ownership |
| `NOT_FOUND` | 404 | `NotFoundError` | Resource does not exist |
| `CONFLICT` | 409 | `ConflictError`, `BookingConflictError` | State conflict (e.g. invalid transition, duplicate slug, unique constraint) |
| `RATE_LIMITED` | 429 | `RateLimitError` | Too many requests |
| `PAYMENT_ERROR` | 402 | `PaymentError`, `RefundError` | Payment/refund could not be processed (e.g. invalid signature) |
| `INTERNAL_ERROR` | 500 | (fallback) | Unexpected error; details are logged, never leaked |

## Mapping internals
- Domain errors (`lib/errors`) extend `ServiceError` and carry their own `code`.
- `lib/api/service.ts#toServiceFailure` also maps Prisma `P2002 → CONFLICT` and `P2025 → NOT_FOUND`, and everything else → `INTERNAL_ERROR`.
- `lib/api/http.ts#statusForCode` maps `code → HTTP status` (table above).

## Adding a new error
1. Add (or reuse) a class in `lib/errors/index.ts` extending `ServiceError` with an existing `ErrorCode`.
2. If a brand-new code is needed, extend `ErrorCode` in `lib/api/result.ts` **and** `STATUS_BY_CODE` in `lib/api/http.ts` (and the `ApiError` enum in `lib/openapi/spec.ts`).
