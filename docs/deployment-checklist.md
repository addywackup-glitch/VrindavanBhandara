# Deployment Checklist

## 0. Prerequisites
- [ ] `npm install`
- [ ] `npx prisma generate`

## 1. Environment (see `.env.example`)
- [ ] `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED` for migrations) — Neon Postgres
- [ ] `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] `RESEND_API_KEY` (+ from address)
- [ ] Cloudflare R2 keys (media)
- [ ] WhatsApp Cloud API tokens (optional; dev-logs without them)
- [ ] `UPSTASH_REDIS_REST_URL` / `_TOKEN` (production rate limiting)

## 2. Database
- [ ] `npx prisma validate`
- [ ] `npx prisma migrate deploy` (review the Phase 2 index/enum migration)
- [ ] Seed if first deploy: `npm run db:seed`

## 3. Quality gates (CI)
- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## 4. Payments
- [ ] Razorpay webhook configured → `POST /api/payment/webhook`, secret matches `RAZORPAY_WEBHOOK_SECRET`
- [ ] Webhook events enabled: `payment.captured`, `payment.failed`, `refund.processed`, `refund.created`
- [ ] Verify a test payment end-to-end (order → checkout → verify → webhook)

## 5. Security
- [ ] Confirm rate limiting active (Upstash in prod)
- [ ] HTTPS / HSTS / security headers (Next config / platform)
- [ ] Rotate `SEED_ADMIN_PASSWORD` after first login
- [ ] Confirm Sentry DSN set; errors reporting

## 6. Post-deploy smoke
- [ ] `GET /api/openapi` returns the spec; `GET /api/docs` renders
- [ ] `GET /api/services`, `/api/packages` return data
- [ ] Register + login + create booking + create order on staging
- [ ] Admin dashboard stats load
