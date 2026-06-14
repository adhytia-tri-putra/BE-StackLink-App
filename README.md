# InstaCard API Backend

Backend untuk aplikasi InstaCard (Linktree clone) menggunakan ExpressJS, Prisma, dan PostgreSQL.

## Tech Stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcryptjs
- qrcode

## 1. Environment Variables

1. Copy `.env.example` jadi `.env`
2. Isi variabel berikut:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
DATABASE_URL=postgresql://user:password@localhost:5432/instacard_db?schema=public
DIRECT_URL=postgresql://user:password@db.project-ref.supabase.co:5432/postgres
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000
```

Keterangan:

- `FRONTEND_URL` bisa diisi lebih dari satu origin, dipisahkan koma.
- `PUBLIC_APP_URL` dipakai untuk membentuk URL publik profil, terutama untuk QR profile.
- `PUBLIC_API_URL` opsional, dipakai untuk log/healthcheck URL publik backend.
- `BASE_URL` masih didukung sebagai fallback lama untuk `PUBLIC_APP_URL`.
- `JWT_SECRET` wajib diisi dengan secret acak yang panjang.
- `DATABASE_URL` dan `JWT_SECRET` divalidasi saat server startup. Kalau kosong, deploy akan gagal lebih awal.
- Jika memakai Supabase + Prisma, gunakan `DATABASE_URL` untuk pooled connection dan `DIRECT_URL` untuk Prisma CLI/migrations.
- Untuk analytics realtime via Supabase Broadcast, backend butuh `SUPABASE_URL` dan `SUPABASE_SECRET_KEY`.

## 2. Local Development

Jalankan:

```bash
npm install
npm run prisma:migrate:dev
npm run dev
```

Server jalan di `http://localhost:5000`

---

## 3. Deploy ke Railway

Project ini siap untuk Railway dengan alur berikut:

1. Buat service Node.js di Railway dan hubungkan repo.
2. Tambahkan PostgreSQL service atau set `DATABASE_URL` manual.
3. Set environment variables berikut di Railway:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-frontend-domain.com
PUBLIC_APP_URL=https://your-frontend-domain.com
PUBLIC_API_URL=https://your-backend-domain.up.railway.app
```

4. Gunakan command berikut:

```bash
Build command: npm install && npm run build
Start command: npm run prisma:migrate:deploy && npm start
```

Catatan:

- Railway akan menyediakan `PORT` otomatis, dan server ini sudah memakainya.
- Endpoint healthcheck tersedia di `/api/health`.
- WebSocket analytics tersedia di path `/api/analytics/socket`.
- Jika env Supabase tersedia, analytics page akan memakai Supabase Realtime Broadcast dan WebSocket custom menjadi fallback.
- Kalau memakai `railway.json`, command di atas sudah terpasang otomatis lewat config-as-code.

---

## 4. Endpoints

### Auth

| Method | Endpoint             | Deskripsi               |
| ------ | -------------------- | ----------------------- |
| POST   | `/api/auth/register` | Register user baru      |
| POST   | `/api/auth/login`    | Login, return JWT token |

#### `POST /api/auth/register`

Request:

```json
{
  "username": "Saeki",
  "name": "Saeki Amanda",
  "email": "saeki@gmail.com",
  "password": "admin1234"
}
```

Response:

```json
{
  "success": true,
  "message": "Register berhasil. Silakan login untuk mendapatkan token.",
  "data": {
    "user": {
      "id": 1,
      "username": "Saeki",
      "name": "Saeki Amanda",
      "email": "saeki@gmail.com",
      "createdAt": "2026-05-09T13:00:00.000Z"
    }
  }
}
```

#### `POST /api/auth/login`

Request:

```json
{
  "email": "saeki@gmail.com",
  "password": "admin1234"
}
```

Response:

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": 1,
      "username": "Saeki",
      "name": "Saeki Amanda",
      "email": "saeki@gmail.com",
      "createdAt": "2026-05-09T13:00:00.000Z"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

### Profile

> Semua endpoint profile butuh header `Authorization: Bearer <token>`

| Method | Endpoint              | Deskripsi           |
| ------ | --------------------- | ------------------- |
| GET    | `/api/profiles/me`    | Ambil profil user   |
| PATCH  | `/api/profiles/me`    | Update profil user  |
| PUT    | `/api/profiles/theme` | Update theme profil |

#### `GET /api/profiles/me`

Response:

```json
{
  "success": true,
  "message": "Profil berhasil diambil.",
  "data": {
    "id": 1,
    "username": "Saeki",
    "name": "Saeki Amanda",
    "email": "saeki@gmail.com",
    "bio": "Full Stack Developer",
    "avatar": "https://example.com/avatar.jpg",
    "headline": "Building cool things",
    "createdAt": "2026-05-09T13:00:00.000Z"
  }
}
```

#### `PATCH /api/profiles/me`

Request:

```json
{
  "name": "Saeki Amanda",
  "bio": "Full Stack Developer",
  "avatar": "https://example.com/avatar.jpg",
  "headline": "Building cool things"
}
```

Response:

```json
{
  "success": true,
  "message": "Profil berhasil diperbarui.",
  "data": {
    "id": 1,
    "username": "Saeki",
    "name": "Saeki Amanda",
    "email": "saeki@gmail.com",
    "bio": "Full Stack Developer",
    "avatar": "https://example.com/avatar.jpg",
    "headline": "Building cool things",
    "createdAt": "2026-05-09T13:00:00.000Z"
  }
}
```

#### `PUT /api/profiles/theme`

Request:

```json
{
  "bgType": "gradient",
  "bgGradientStart": "#6366f1",
  "bgGradientEnd": "#a855f7",
  "textColor": "#ffffff",
  "buttonColor": "#ffffff"
}
```

Response:

```json
{
  "success": true,
  "message": "Theme berhasil diupdate.",
  "data": {
    "bgType": "gradient",
    "bgColor": "#ffffff",
    "bgGradientStart": "#6366f1",
    "bgGradientEnd": "#a855f7",
    "textColor": "#ffffff",
    "buttonColor": "#ffffff"
  }
}
```

---

### Links

> Semua endpoint links butuh header `Authorization: Bearer <token>`

| Method | Endpoint             | Deskripsi                   |
| ------ | -------------------- | --------------------------- |
| GET    | `/api/links`         | Ambil semua link milik user |
| POST   | `/api/links`         | Buat link baru              |
| PUT    | `/api/links/:id`     | Update link                 |
| DELETE | `/api/links/:id`     | Hapus link                  |
| PATCH  | `/api/links/reorder` | Reorder posisi link         |

#### `GET /api/links`

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "cmoyfkubg0001u768fk13hk34",
      "userId": 1,
      "title": "Instagram saya",
      "url": "https://instagram.com/username",
      "icon": null,
      "position": 0,
      "isActive": true,
      "createdAt": "2026-05-09T14:20:02.812Z",
      "updatedAt": "2026-05-09T14:20:02.812Z"
    }
  ]
}
```

#### `POST /api/links`

Request:

```json
{
  "title": "Instagram saya",
  "url": "https://instagram.com/username",
  "icon": null
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "cmoyfkubg0001u768fk13hk34",
    "userId": 1,
    "title": "Instagram saya",
    "url": "https://instagram.com/username",
    "icon": null,
    "position": 3,
    "isActive": true,
    "createdAt": "2026-05-09T14:20:02.812Z",
    "updatedAt": "2026-05-09T14:20:02.812Z"
  }
}
```

#### `PUT /api/links/:id`

Request:

```json
{
  "title": "Instagram saya (updated)",
  "url": "https://instagram.com/username",
  "icon": "instagram",
  "isActive": true
}
```

Response:

```json
{
  "success": true,
  "message": "Link berhasil diperbarui.",
  "data": {
    "id": "cmoyfkubg0001u768fk13hk34",
    "title": "Instagram saya (updated)",
    "url": "https://instagram.com/username",
    "icon": "instagram",
    "isActive": true,
    "updatedAt": "2026-05-09T14:30:00.000Z"
  }
}
```

#### `DELETE /api/links/:id`

Response:

```json
{
  "success": true,
  "message": "Link berhasil dihapus."
}
```

#### `PATCH /api/links/reorder`

Request:

```json
{
  "links": [
    { "id": "cmoyfkubg0001u768fk13hk34", "position": 0 },
    { "id": "cmoyfkubg0002u768fk13hk35", "position": 1 },
    { "id": "cmoyfkubg0003u768fk13hk36", "position": 2 }
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Urutan link berhasil diperbarui."
}
```

---

### QR Code

> Butuh header `Authorization: Bearer <token>`

| Method | Endpoint            | Deskripsi                     |
| ------ | ------------------- | ----------------------------- |
| GET    | `/api/qr/profile`   | QR Code halaman profil publik |
| GET    | `/api/qr/links/:id` | QR Code untuk link tertentu   |

Query params (opsional):

| Param    | Default   | Deskripsi                                      |
| -------- | --------- | ---------------------------------------------- |
| `format` | `base64`  | `base64` atau `svg`                            |
| `width`  | `300`     | Ukuran QR dalam px                             |
| `dark`   | `#000000` | Warna gelap (hex)                              |
| `light`  | `#ffffff` | Warna terang (hex)                             |
| `raw`    | -         | `true` untuk return SVG langsung sebagai image |

Response:

```json
{
  "success": true,
  "message": "QR Code profil berhasil dibuat",
  "data": {
    "username": "Saeki",
    "profileUrl": "http://localhost:5000/u/Saeki",
    "format": "png/base64",
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

### Analitik

> Butuh header `Authorization: Bearer <token>`

| Method | Endpoint                   | Deskripsi             |
| ------ | -------------------------- | --------------------- |
| GET    | `/api/analytics/summary`   | Total klik semua link |
| GET    | `/api/analytics/links/:id` | Detail klik per link  |

#### `GET /api/analytics/summary`

Response:

```json
{
  "success": true,
  "message": "Summary analitik berhasil diambil.",
  "data": {
    "totalClicks": 42,
    "totalLinks": 5,
    "links": [
      {
        "id": "cmoyfkubg0001u768fk13hk34",
        "title": "Instagram saya",
        "url": "https://instagram.com/username",
        "totalClicks": 20,
        "lastClickedAt": "2026-05-09T10:00:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/analytics/links/:id`

Response:

```json
{
  "success": true,
  "message": "Analitik link berhasil diambil.",
  "data": {
    "id": "cmoyfkubg0001u768fk13hk34",
    "title": "Instagram saya",
    "url": "https://instagram.com/username",
    "totalClicks": 20,
    "clicks": [
      {
        "id": "clxxxxxx",
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "clickedAt": "2026-05-09T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Halaman Publik

> Tidak butuh autentikasi

| Method | Endpoint                       | Deskripsi                     |
| ------ | ------------------------------ | ----------------------------- |
| GET    | `/u/:username`                 | Halaman publik profil + links |
| GET    | `/u/:username/links/:id`       | Detail link publik            |
| POST   | `/u/:username/links/:id/click` | Record klik link              |

#### `GET /u/:username`

Response:

```json
{
  "success": true,
  "message": "Profil berhasil diambil.",
  "data": {
    "username": "Saeki",
    "name": "Saeki Amanda",
    "bio": "Full Stack Developer",
    "avatar": "https://example.com/avatar.jpg",
    "headline": "Building cool things",
    "bgType": "gradient",
    "bgColor": "#ffffff",
    "bgGradientStart": "#6366f1",
    "bgGradientEnd": "#a855f7",
    "textColor": "#ffffff",
    "buttonColor": "#ffffff",
    "links": [
      {
        "id": "cmoyfkubg0001u768fk13hk34",
        "title": "Instagram saya",
        "url": "https://instagram.com/username",
        "icon": null,
        "position": 0
      }
    ]
  }
}
```

#### `GET /u/:username/links/:id`

Response:

```json
{
  "success": true,
  "message": "Link berhasil diambil.",
  "data": {
    "id": "cmoyfkubg0001u768fk13hk34",
    "title": "Instagram saya",
    "url": "https://instagram.com/username",
    "icon": null,
    "position": 0,
    "createdAt": "2026-05-09T14:20:02.812Z",
    "user": {
      "username": "Saeki",
      "name": "Saeki Amanda",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

#### `POST /u/:username/links/:id/click`

Response:

```json
{
  "success": true,
  "message": "Klik berhasil direcord."
}
```

---

## 5. Contoh Integrasi Frontend

```js
// Login
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "saeki@gmail.com",
    password: "admin1234",
  }),
});
const result = await response.json();
if (result.success) {
  localStorage.setItem("token", result.data.token);
}

// Request dengan auth
const token = localStorage.getItem("token");
const profile = await fetch("http://localhost:5000/api/profiles/me", {
  headers: { Authorization: `Bearer ${token}` },
});

// Tambah link baru
await fetch("http://localhost:5000/api/links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Instagram saya",
    url: "https://instagram.com/username",
  }),
});

// Record klik link
await fetch(
  "http://localhost:5000/u/Saeki/links/cmoyfkubg0001u768fk13hk34/click",
  {
    method: "POST",
  },
);
```

---

## 6. Format Response

### Sukses

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "..."
}
```
