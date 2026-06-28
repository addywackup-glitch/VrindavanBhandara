# Backend Architecture

The backend is a layered, framework-agnostic core wrapped by thin Next.js transport adapters. The goal is a single source of truth that can serve web, mobile, and future API clients without architectural change.

## Layers

```
HTTP Route Handler  ─┐
Server Action        ─┤→  Service  →  Repository  →  Prisma  →  PostgreSQL
(transport / RBAC)   ─┘   (business)   (persistence)
```

| Layer | Location | Responsibility | May import |
| --- | --- | --- | --- |
| Transport | `app/api/**/route.ts` | Parse request, rate-limit, resolve `Actor`, call a service, map result → HTTP envelope | `lib/api/http`, services |
| Server Actions | `app/actions/*.ts` | Same as transport, for the React Actions API | `lib/api/http`, services |
| Service | `lib/services/*.service.ts` | Business rules, validation, transactions, audit, notifications | repositories, `lib/api/*`, `lib/errors`, features |
| Repository | `lib/repositories/*.repository.ts` | **Only** Prisma access; transaction-aware via `DbClient` | `@/lib/prisma` |
| Domain primitives | `lib/errors`, `lib/api/result` | Typed errors + result envelope | — |

### Hard rules
- **Prisma is only imported inside `lib/repositories/`** (plus `lib/auth.ts` for the NextAuth adapter, which structurally requires the client).
- **No business logic in routes or Server Actions.** They are adapters.
- **No `any`.** `tsconfig` has `strict` + `noImplicitAny`.
- Every service method returns `ServiceResult<T>` (`{ ok: true, data } | { ok: false, code, error, issues? }`).
- Failures are thrown as **typed domain errors** (`lib/errors`) and normalized by `execute()`/`toServiceFailure()`.

## Request lifecycle (example: `POST /api/bookings`)
1. Route resolves the client IP, enforces `apiRateLimit`, and calls `requireActor()`.
2. Route calls `bookingService.createBooking(actor, body)`.
3. Service `validate()`s with Zod, loads the package via `packageRepository`, prices the coupon, and runs a `runTransaction` that writes the booking + coupon usage + timeline event atomically.
4. Service writes an audit log and returns `ok(booking)`.
5. Route `respond()`s, producing `{ success: true, data, message }` with HTTP 201.

## Transactions
Atomic multi-write operations use `runTransaction((tx) => …)` and pass `tx` to repository methods (every repo method accepts an optional `DbClient`). See `docs/repository-map.md`.

## Response envelope
All endpoints return the shape documented in `docs/api-reference.md` and the OpenAPI spec (`/api/openapi`, Swagger UI at `/api/docs`).

## Known remaining debt
- Server Components (`app/**/page.tsx`) and `app/sitemap.ts` still query Prisma directly. The read services (`content.service`, `analytics.service`, etc.) exist to migrate them; this is tracked in the readiness report.
- `CreateBookingSchema.sevaDate` minimum is evaluated at module load (should be a runtime refinement).
