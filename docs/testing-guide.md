# Testing Guide

Tests run on **Vitest**. Pure business logic is unit-tested without a database.

## Commands
```bash
npm run test            # run once
npm run test:watch      # watch mode
npm run test:coverage   # coverage report
```
> Tests import `@prisma/client`, so run `npm install && npx prisma generate` first.

## Layout
```
tests/
  unit/
    razorpay.test.ts            # HMAC signature verification (incl. length-mismatch regression)
    validation.test.ts          # parseWith → ServiceResult
    pagination.test.ts          # parsePagination / paginated
    errors.test.ts              # domain error → code mapping
    booking-transitions.test.ts # canTransition lifecycle rules
    service-errors.test.ts      # toServiceFailure (ServiceError, Prisma P2002/P2025, unknown)
```

## What is covered now (no DB required)
- Payment signature verification + the crash regression fix.
- Validation bridge and field-issue extraction.
- Pagination math and clamping.
- Typed-error → API-code mapping.
- Booking status transition state machine.
- Prisma error normalization.

## Recommended next (DB-backed integration tests)
Use a disposable Postgres (Docker/Testcontainers or a Neon branch) + `prisma migrate deploy`, then test services end-to-end:
- `createBooking`: pricing, **coupon applicability/expiry/cap**, transactional coupon usage + timeline.
- `verifyPayment`: signature path, idempotency, CONFIRMED transition, notification dispatch (mock `features/notifications`).
- `processWebhookEvent` / `processRefundWebhook`: captured/failed/refund, idempotency, **refund lookup by `payment_id`**.
- `updateBookingStatus`: transition guard + timeline + notifications.
- Repository methods against real schema.

## Conventions
- Mock `features/notifications/*` and `features/payments/razorpay` network calls.
- Never hit live Razorpay/Resend/WhatsApp in tests.
- Keep unit tests free of Prisma where possible (test pure functions directly).
