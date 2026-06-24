# StackLink Backend

Backend StackLink dibuat dengan Express, TypeScript, Prisma, dan PostgreSQL.

## Fitur

- Authentication
- Profile API
- Link API
- Public profile API
- Analytics
- QR code
- Admin moderation
- Billing foundation

## Setup

```bash
npm install
npm run prisma:migrate:dev
npm run dev
```

## Build

```bash
npm run build
```

## Environment

Copy `.env.example` menjadi `.env`, lalu isi konfigurasi database dan secret.

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
```

## Author

Adhytia Tri Putra
