# StackLink Backend

Express + TypeScript backend untuk StackLink. Backend ini menangani autentikasi, profile, links, publishing, analytics, QR code, billing foundation, admin moderation, dan public profile API.

Panduan production lebih detail tersedia di `PRODUCTION.md`.

## Fitur

- JWT authentication dengan session storage.
- Email verification dan password reset.
- Account settings, change password, logout semua perangkat, dan delete account.
- Profile dan theme management.
- Link management dengan reorder, schedule, status aktif, plan limit, dan rich content blocks.
- Public profile via username dan custom domain.
- SEO/publishing settings, DNS diagnostics, pixel diagnostics, dan production readiness checks.
- QR code profile dan link.
- Analytics click tracking, realtime events, CSV export, country/browser/OS dimensions, custom date range, retention, dan IP hashing.
- Billing foundation: plan Free/Pro, link limit, checkout URL handoff.
- Admin moderation: role admin, suspend user, abuse reports, resolve reports.
- Healthcheck `/api/health` dan readiness `/api/ready`.

## Tech Stack

- Node.js
- Express 5
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcryptjs
- Nodemailer
- Supabase Storage optional
- Sentry Node optional
- WebSocket analytics fallback
- Vitest

## Setup Lokal

```bash
npm install
cp .env.example .env
npm run prisma:migrate:dev
npm run dev
```

Server berjalan di:

```txt
http://localhost:5000
```

Minimal `.env` lokal:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=1d
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stacklink
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/stacklink
ANALYTICS_IP_SALT=change-this-to-an-independent-random-secret
ANALYTICS_RETENTION_DAYS=90
FREE_LINK_LIMIT=5
ADMIN_EMAILS=admin@example.com
```

## Environment Variables

| Variable | Fungsi |
| --- | --- |
| `PORT` | Port backend lokal. |
| `FRONTEND_URL` | Origin frontend yang diizinkan CORS. Bisa dipisahkan koma. |
| `JWT_SECRET` | Secret JWT panjang dan acak. |
| `JWT_EXPIRES_IN` | Masa berlaku JWT. |
| `DATABASE_URL` | PostgreSQL runtime connection string. |
| `DIRECT_URL` | PostgreSQL direct URL untuk Prisma migration. |
| `PUBLIC_APP_URL` | URL frontend publik. |
| `PUBLIC_API_URL` | URL backend publik. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Email verification dan password reset. |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_AVATAR_BUCKET` | Supabase Storage dan realtime server-side. |
| `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` | Monitoring backend. |
| `CUSTOM_DOMAIN_TARGET` | Host frontend canonical untuk custom domain diagnostics. |
| `ANALYTICS_IP_SALT` | Salt HMAC untuk anonimisasi IP click. |
| `ANALYTICS_RETENTION_DAYS` | Retensi analytics. Default 90 hari. |
| `FREE_LINK_LIMIT` | Batas link paket Free. |
| `BILLING_CHECKOUT_URL` | URL checkout provider pembayaran. |
| `ADMIN_EMAILS` | Email admin, dipisahkan koma. |

## Script

```bash
npm run dev
npm run build
npm test
npm run test:integration
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
```

## API Ringkas

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/resend-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Profile:

- `GET /api/profiles/me`
- `PATCH /api/profiles/me`
- `GET /api/profiles/preview`
- `PUT /api/profiles/theme`
- `PUT /api/profiles/publishing`
- `GET /api/profiles/publishing/diagnostics`

Links:

- `GET /api/links`
- `POST /api/links`
- `PUT /api/links/:id`
- `DELETE /api/links/:id`
- `PATCH /api/links/reorder`

Analytics:

- `GET /api/analytics/summary`
- `GET /api/analytics/export.csv`
- `GET /api/analytics/links/:id`
- `GET /api/analytics/stream`
- WebSocket `/api/analytics/socket`

Public:

- `GET /u/:username`
- `GET /u/domain/:domain`
- `GET /u/:username/links/:id`
- `POST /u/:username/links/:id/click`
- `POST /u/:username/report`

Billing:

- `GET /api/billing/status`
- `POST /api/billing/checkout`

Admin:

- `GET /api/admin/overview`
- `PATCH /api/admin/users/:id`
- `PATCH /api/admin/reports/:id/resolve`

QR:

- `GET /api/qr/profile`
- `GET /api/qr/links/:id`

## Deployment

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run prisma:migrate:deploy && npm start
```

Set production environment, lalu cek:

```txt
GET /api/health
GET /api/ready
```

## Testing

```bash
npm test
npm run build
npm run test:integration
```

Gunakan database test terpisah untuk integration test.

## Catatan Keamanan

- Jangan commit `.env`.
- Gunakan `JWT_SECRET` dan `ANALYTICS_IP_SALT` yang panjang, acak, dan berbeda.
- Click IP disimpan sebagai hash satu arah.
- User suspended tidak bisa login dan public profile tidak tampil.
- Baca `PRODUCTION.md` untuk backup, monitoring, dan incident response.
