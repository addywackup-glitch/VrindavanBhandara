# Deployment Checklist

## 0. Prerequisites
- [ ] `npm install`
- [ ] `npx prisma generate`

## 1. Environment (see `.env.example`)

### Vercel bulk import
1. Copy `vercel.env.import` → `vercel.env.local` (do not commit the filled copy).
2. Replace every `REPLACE_*` value (Supabase DB + Auth keys, Vercel domain, secrets).
3. Follow `docs/supabase-setup.md` for Auth redirect URLs, Google provider, and storage buckets.
4. Leave Razorpay dummy/test keys until your Razorpay account is ready (site deploys; checkout fails until real keys are set).
5. Vercel → Project → Settings → Environment Variables → **Import .env** → upload `vercel.env.local`.
6. Set **Environments** to Production and Preview; keep **Sensitive** on.

- [ ] `DATABASE_URL` (Supabase pooler, port 6543) + `DATABASE_URL_UNPOOLED` (direct, port 5432)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] `RESEND_API_KEY` (+ from address)
- [ ] Cloudflare R2 keys (media)
- [ ] WhatsApp Cloud API tokens (optional; dev-logs without them)
- [ ] `UPSTASH_REDIS_REST_URL` / `_TOKEN` (production rate limiting)

## 2. Database (Supabase)
- [ ] `npx prisma validate`
- [ ] First deploy (no migrations folder): `DATABASE_URL="$DATABASE_URL_UNPOOLED" npm run db:push`
- [ ] Or with migrations: `DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma migrate deploy`
- [ ] Seed if first deploy: `npm run db:seed`

## 3. Quality gates (CI)
- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## 4. Payments
- [ ] Replace dummy Razorpay keys in Vercel when account is ready (`rzp_test_*` for staging, `rzp_live_*` for production)
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
