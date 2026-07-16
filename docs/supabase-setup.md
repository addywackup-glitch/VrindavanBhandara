# Supabase setup (Auth + Storage + Postgres)

This app uses **one Supabase project** for:

| Concern | How |
|---------|-----|
| **Postgres** | Prisma via `DATABASE_URL` / `DATABASE_URL_UNPOOLED` |
| **Auth** | Supabase Auth (`@supabase/ssr`) — replaces NextAuth |
| **Storage** | Buckets `proofs`, `gallery`, `blog` — replaces Cloudflare R2 |

Prisma still owns app tables (`users`, `bookings`, …).  
`users.supabaseUserId` links each profile to `auth.users.id`.

---

## Vercel “Connect Supabase”

The integration injects `POSTGRES_*` and `SUPABASE_*` vars. This app auto-maps:

| Vercel injects | Used as |
|----------------|---------|
| `POSTGRES_PRISMA_URL` or `POSTGRES_URL` | `DATABASE_URL` |
| `POSTGRES_URL_NON_POOLING` | `DATABASE_URL_UNPOOLED` |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role |

No manual remapping needed after connecting. Still set Auth redirect URLs and run `db push` + seed once.

---

## 1. API keys (Settings → API Keys)

Add to Vercel / `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role or secret key>
```

Newer dashboard names also work:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (alias for anon)
- `SUPABASE_SECRET_KEY` (alias for service role)

**Never** expose the service role key to the browser.

---

## 2. Database connection (Settings → Database)

```env
DATABASE_URL=<Session pooler URI, port 6543, ?pgbouncer=true>
DATABASE_URL_UNPOOLED=<Direct URI, port 5432>
```

Push schema + seed:

```bash
DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma db push
npm run db:seed
```

Seed creates the super admin in **Supabase Auth + Prisma** when service role is set, and ensures storage buckets exist.

---

## 3. Auth URLs (Authentication → URL Configuration)

**Site URL:** your Vercel preview or production URL  

**Redirect URLs** (add all that apply):

```
http://localhost:3000/auth/callback
https://<your-preview>.vercel.app/auth/callback
https://vrindavanbhandara.com/auth/callback
```

### Email / password

Enable **Email** provider (default).  
For preview, disable “Confirm email” or use service-role `email_confirm: true` (already used on register/seed).

### Google OAuth

1. Supabase → Authentication → Providers → **Google** → enable  
2. Paste Google Client ID + Secret from Google Cloud Console  
3. Authorized redirect URI in Google Cloud:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

---

## 4. Storage buckets

Created automatically by `npm run db:seed` when service role is present, or call `ensureStorageBuckets()` once.

| Bucket | Public | Use |
|--------|--------|-----|
| `proofs` | yes | Admin booking proof media |
| `gallery` | yes | Gallery images |
| `blog` | yes | Blog images |

Upload API: `POST /api/storage/upload` (admin, `proofs:upload` permission).

---

## 5. Manual bucket create (SQL / Dashboard)

Supabase Dashboard → Storage → New bucket → name `proofs` / `gallery` / `blog` → **Public**.

Or run in SQL editor:

```sql
insert into storage.buckets (id, name, public)
values
  ('proofs', 'proofs', true),
  ('gallery', 'gallery', true),
  ('blog', 'blog', true)
on conflict (id) do nothing;
```

---

## 6. Auth routes in this app

| Route | Purpose |
|-------|---------|
| `POST /api/auth/register` | Create Auth + Prisma user |
| `POST /api/auth/login` | Email/password session |
| `POST /api/auth/logout` | Sign out |
| `GET /api/auth/session` | Client session for `useSession` |
| `GET /auth/callback` | OAuth PKCE callback |

---

## 7. Cutover notes

- NextAuth removed (`next-auth`, `@auth/prisma-adapter` uninstalled).
- Legacy bcrypt users: first successful login migrates them into Supabase Auth automatically.
- R2 env vars are no longer required; use Supabase Storage URLs in `MediaProof.url`.
