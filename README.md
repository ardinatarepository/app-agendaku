# AgendaKu — Aplikasi Manajemen Tugas

> Wiwid Ardinata — 231111041 | Program Studi Informatika, UNU Yogyakarta

Aplikasi manajemen tugas full-stack yang berjalan di **web** dan **Android/iOS** dengan codebase terpisah yang berbagi satu REST API backend.

---

## Stack Teknologi

| Layer     | Teknologi                                   |
|-----------|---------------------------------------------|
| Backend   | Node.js, Express.js, Prisma ORM             |
| Database  | MySQL 8.x                                   |
| Frontend Web | React 18, Vite, Tailwind CSS, React Query |
| Mobile    | Expo (React Native), React Navigation       |
| Auth      | JWT (jsonwebtoken), bcryptjs                |

---

## Struktur Proyek

```
agendaku/
├── backend/                 ← REST API (Express + Prisma)
│   ├── prisma/schema.prisma ← Skema database
│   ├── src/
│   │   ├── index.js         ← Entry point
│   │   ├── controllers/     ← auth, task, category
│   │   ├── routes/          ← auth, task, category routes
│   │   ├── middleware/       ← JWT auth, error handler
│   │   └── utils/prisma.js  ← Prisma singleton
│   └── .env.example
│
├── frontend-web/            ← React Web App
│   └── src/
│       ├── api/             ← Axios + API functions
│       ├── context/         ← AuthContext
│       ├── hooks/           ← React Query hooks
│       ├── pages/           ← Dashboard, Tasks, Categories
│       ├── components/      ← TaskCard, TaskForm, Layout
│       └── App.jsx          ← Router + Protected routes
│
└── mobile/                  ← Expo Mobile App
    ├── App.js               ← Navigator utama
    └── src/
        ├── api/             ← Axios + API functions
        ├── context/         ← AuthContext (AsyncStorage)
        ├── screens/auth/    ← Login, Register
        ├── screens/app/     ← Dashboard, TaskList, Profile
        ├── components/      ← TaskCard, UI components
        └── utils/           ← theme, helpers, notifications
```

---

## Setup & Instalasi

### Prasyarat

- Node.js v18+
- MySQL 8.x (bisa via XAMPP)
- npm atau yarn

---

### 1. Backend

```bash
cd agendaku/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL="mysql://root:password@localhost:3306/agendaku_db"
#   JWT_SECRET="ganti-dengan-string-acak-panjang"

# Buat database di MySQL (via phpMyAdmin atau CLI):
# CREATE DATABASE agendaku_db;

# Jalankan migrasi (buat tabel)
npx prisma migrate dev --name init

# Jalankan server (dev mode)
npm run dev
# → API berjalan di http://localhost:5000
```

**Test API:**
```
GET  http://localhost:5000/api/health
```

---

### 2. Frontend Web

```bash
cd agendaku/frontend-web

npm install
npm run dev
# → App berjalan di http://localhost:5173
```

> Vite sudah dikonfigurasi untuk proxy `/api` ke `localhost:5000`, jadi tidak ada CORS issue.

---

### 3. Mobile (Expo)

```bash
cd agendaku/mobile

npm install

# Edit src/api/axios.js — sesuaikan BASE_URL:
# - Android emulator: http://10.0.2.2:5000/api
# - Device fisik:     http://[IP-KOMPUTER-KAMU]:5000/api
# - iOS simulator:    http://localhost:5000/api

npx expo start
# Scan QR dengan Expo Go (Android/iOS)
# Tekan 'a' untuk Android emulator
```

---

## API Endpoints

### Auth
| Method | Endpoint            | Keterangan              |
|--------|---------------------|-------------------------|
| POST   | /api/auth/register  | Daftar akun baru        |
| POST   | /api/auth/login     | Login, dapat JWT token  |
| GET    | /api/auth/me        | Data user saat ini 🔒   |

### Tasks
| Method | Endpoint             | Keterangan                    |
|--------|----------------------|-------------------------------|
| GET    | /api/tasks/dashboard | Statistik + tugas mendesak 🔒 |
| GET    | /api/tasks           | Semua tugas (filter) 🔒       |
| POST   | /api/tasks           | Buat tugas baru 🔒            |
| PUT    | /api/tasks/:id       | Update tugas 🔒               |
| DELETE | /api/tasks/:id       | Hapus tugas 🔒                |

### Categories
| Method | Endpoint              | Keterangan        |
|--------|-----------------------|-------------------|
| GET    | /api/categories       | Semua kategori 🔒 |
| POST   | /api/categories       | Buat kategori 🔒  |
| PUT    | /api/categories/:id   | Update 🔒         |
| DELETE | /api/categories/:id   | Hapus 🔒          |

> 🔒 = Butuh header `Authorization: Bearer <token>`

---

## Fitur Utama

### Fitur Web
- [x] Autentikasi pengguna melalui register, login, dan logout
- [x] Dashboard untuk melihat ringkasan tugas dan statistik penting
- [x] CRUD tugas lengkap: tambah, lihat, edit, dan hapus
- [x] Pengelompokan tugas berdasarkan status, prioritas, dan kategori
- [x] Filter tugas berdasarkan status, prioritas, kategori, dan pencarian
- [x] Tampilan responsif untuk mendukung penggunaan di desktop maupun layar kecil
- [x] Pengelolaan kategori dengan warna kustom untuk mempermudah identifikasi

### Fitur Mobile
- [x] Akses login dan register yang sederhana dan cepat
- [x] Tampilan task list yang nyaman untuk penggunaan pada perangkat mobile
- [x] CRUD tugas secara praktis melalui antarmuka mobile
- [x] Notifikasi lokal sebelum deadline, seperti H-1 dan H-0
- [x] Dukungan tampilan yang ramah untuk perangkat Android dan iOS
- [x] Pengelolaan profil pengguna dan pengaturan akun yang mudah diakses

---

## Skema Database

```
users
  id, name, email, password, created_at, updated_at

categories
  id, name, color, user_id → users, created_at

tasks
  id, title, description, status (enum), priority (enum),
  deadline, user_id → users, category_id → categories,
  created_at, updated_at
```
