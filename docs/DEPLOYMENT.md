# Dragonhold — Deployment & Operations Manual (Stage 1)

Panduan operasional dan penyebaran (deployment) mandiri untuk Dragonhold Stage 1 (Content Launch Ready). Panduan ini mencakup integrasi **Neon PostgreSQL**, **Koyeb Backend API**, dan **Vercel Frontend Web**, dengan konfigurasi custom domain dan keamanan cookie HttpOnly.

---

## 1. Neon PostgreSQL (Database Setup)

### A. Pembuatan Project Neon
1. Masuk ke dashboard [Neon Console](https://console.neon.tech).
2. Buat project baru bernama `dragonhold-production` (pastikan tidak mencampur dengan database project lain).
3. Pilih region yang **sama atau berdekatan** dengan lokasi Koyeb (misal: `eu-central-1` Frankfurt atau `ap-southeast-1` Singapore).
4. Pada dashboard project, salin connection string berlabel **Connection Pooling** (menggunakan port 5432 dan domain `-pooler.neon.tech`). Format:
   ```text
   postgres://[user]:[password]@[endpoint-id]-pooler.[region].neon.tech/neondb?sslmode=require
   ```

### B. Menjalankan Migrasi & Seed Database
> **PENTING**: Sesuai prinsip keandalan sistem, migrasi database **TIDAK** dijalankan otomatis pada setiap restart container aplikasi. Migrasi dan seed dijalankan secara terkontrol dari mesin lokal / CI sebelum rilis.

1. **Jalankan Migrasi Database**:
   ```bash
   DATABASE_URL="postgres://..." pnpm db:migrate
   ```
2. **Jalankan Seed Kerajaan & SUPER_ADMIN Pertama**:
   ```bash
   DATABASE_URL="postgres://..." \
   SEED_ADMIN_USERNAME="thecreator" \
   SEED_ADMIN_EMAIL="creator@dragonhold.my.id" \
   SEED_ADMIN_PASSWORD="ganti-dengan-password-sangat-kuat" \
   pnpm db:seed
   ```
   *Hasil: Kerajaan "Dragonhold" dibuat dengan status `NEWLY_ESTABLISHED`, dan akun SUPER_ADMIN dibuat dengan Citizen ID `DH-000001`.*

### C. Backup & Restore Prosedur
- **Neon Instant Point-in-Time Restore (PITR)**:
  Neon menyediakan fitur branching instan. Sebelum melakukan perubahan skema atau pengumuman besar, Anda dapat membuat branch snapshot di Neon UI (`Branches` -> `Create Branch`) sebagai titik pemulihan instan.
- **Manual Logical Backup (pg_dump)**:
  ```bash
  pg_dump "postgres://..." -Fc -f dragonhold_backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Manual Restore (pg_restore)**:
  ```bash
  pg_restore -d "postgres://..." -c dragonhold_backup_YYYYMMDD_HHMMSS.dump
  ```

---

## 2. Koyeb Eco-micro (Backend API Deployment)

Backend Dragonhold menggunakan Hono.js standalone yang dikemas dalam Dockerfile multi-stage.

### A. Konfigurasi Service di Koyeb
1. Buka [Koyeb Control Panel](https://app.koyeb.com) dan klik **Create App**.
2. Pilih sumber: **GitHub**.
3. Pilih repository: `Dragonhold`.
4. Pilih **Dockerfile** sebagai build method:
   - **Dockerfile location**: `Dockerfile` (di root repository).
   - **Context**: `/` (root monorepo agar dapat mengakses `packages/shared` dan `packages/db`).
5. Pilih tipe instance: **Eco-micro** (512 MB RAM, 0.25 vCPU).
6. **Port Configuration**:
   - Port: `8000` (atau sesuai `PORT` yang diberikan Koyeb).
   - Protocol: `HTTP`.
   - Path health check:
     - Liveness: `/health` (HTTP 200 OK)
     - Readiness: `/ready` (Memverifikasi koneksi database aktif)

### B. Environment Variables di Koyeb
Tambahkan variabel lingkungan berikut di tab **Environment Variables**:

| Variable | Nilai Rekomendasi | Deskripsi |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Mengaktifkan optimasi dan cookie secure |
| `DATABASE_URL` | *(Connection pooling URL dari Neon)* | Koneksi Postgres dengan SSL |
| `WEB_ORIGIN` | `https://dragonhold.my.id` | Origin yang diizinkan untuk CORS dan Origin-Guard |
| `COOKIE_DOMAIN` | `.dragonhold.my.id` | Domain wildcard agar cookie sesi dapat dibaca lintas subdomain (kosongkan jika single-domain Vercel `/api`) |
| `GOOGLE_CLIENT_ID` | `[GOOGLE_OAUTH_CLIENT_ID]` | OAuth 2.0 Client ID dari Google Cloud Console (server-side only) |
| `GOOGLE_CLIENT_SECRET` | `[GOOGLE_OAUTH_CLIENT_SECRET]` | OAuth 2.0 Client Secret (server-side only, JANGAN gunakan prefix `NEXT_PUBLIC_`) |
| `GOOGLE_REDIRECT_URI` | `https://dragonhold.my.id/api/auth/google/callback` | Exact Redirect URI yang terdaftar di Google Cloud Console |
| `TRUSTED_PROXY_HOPS`| `1` | Jumlah proxy di depan aplikasi untuk akurasi IP rate limit |

---

## 2B. Google OAuth 2.0 / OpenID Connect Setup (Google Cloud Console)

Dragonhold menggunakan **Google OAuth 2.0 (Authorization Code Flow + OpenID Connect + PKCE)** sebagai satu-satunya metode registrasi warga baru dan login warga reguler. Akun lama pra-OAuth dan `SUPER_ADMIN` (`DH-000001`) tetap dapat masuk dengan kata sandi lalu menautkan akun Google secara aman melalui Kingdom Hall (`/dashboard`).

1. Buka [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **OAuth consent screen**.
   - Pilih **External** dan lengkapi informasi aplikasi Dragonhold.
   - Tambahkan non-sensitive scopes wajib: `openid`, `email`, `profile`. Jangan menambahkan scope Google API lain.
2. Masuk ke **Credentials** -> **Create Credentials** -> **OAuth client ID** -> **Web application**.
3. Daftarkan **Authorized JavaScript origins** (tanpa trailing slash):
   - Local Development: `http://localhost:3000`
   - Production: `https://dragonhold.my.id` *(dan `https://www.dragonhold.my.id` jika dipakai)*
4. Daftarkan **Authorized redirect URIs** (harus sama persis dengan `GOOGLE_REDIRECT_URI`):
   - Local Development (via Next.js `/api`): `http://localhost:3000/api/auth/google/callback`
   - Local Development (jika menjalankan `apps/api` standalone langsung): `http://localhost:4000/auth/google/callback`
   - Production (Unified Vercel `/api`): `https://dragonhold.my.id/api/auth/google/callback`
   - Production (jika memisahkan `api.dragonhold.my.id` di Koyeb): `https://api.dragonhold.my.id/auth/google/callback`
5. Salin **Client ID** dan **Client Secret** ke server-side environment variables (`GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di Vercel/Koyeb dan `.env` lokal). Jangan pernah mengekspos `GOOGLE_CLIENT_SECRET` ke kode frontend atau commit ke Git.

> **Catatan Vercel Preview Deployments:** Google Cloud Console menolak wildcard redirect URI seperti `https://*-git-*.vercel.app`. Oleh karena itu, URL Preview dinamis per commit dari Vercel tidak akan diterima otomatis oleh Google OAuth kecuali Anda memetakan domain staging/branch tetap (mis. `https://staging.dragonhold.my.id`) dan mendaftarkan `https://staging.dragonhold.my.id/api/auth/google/callback` secara eksplisit di Google Cloud Console serta mengatur `GOOGLE_REDIRECT_URI` untuk environment Preview tersebut.

### C. Konfigurasi Custom Domain Backend
1. Di pengaturan service Koyeb, tambahkan domain: `api.dragonhold.my.id`.
2. Di DNS manager penyedia domain Anda, buat DNS Record:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Value**: Target CNAME yang diberikan oleh Koyeb (contoh: `[app-name].koyeb.app`).
   - **Proxy**: Nonaktifkan proxy Cloudflare (DNS only) saat inisialisasi SSL Koyeb.

---

## 3. Vercel (Frontend Web Deployment)

Frontend Dragonhold menggunakan Next.js App Router yang terpasang di `apps/web`.

### A. Konfigurasi Project di Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com) dan pilih **Add New... -> Project**.
2. Hubungkan repository GitHub `Dragonhold`.
3. Di bagian **Root Directory**, klik **Edit** dan pilih: `apps/web`.
4. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
5. Build and Output Settings: biarkan default (Vercel otomatis membaca `pnpm-lock.yaml` dan workspace dependencies `@dragonhold/shared`).

### B. Environment Variables di Vercel
Tambahkan variabel lingkungan berikut di tab **Environment Variables**:

| Variable | Nilai | Deskripsi |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.dragonhold.my.id` | Alamat API backend yang dipanggil oleh browser |

### C. Konfigurasi Custom Domain Frontend
1. Di Vercel project settings -> **Domains**, tambahkan `dragonhold.my.id` (dan `www.dragonhold.my.id`).
2. Di DNS manager penyedia domain Anda:
   - **Type**: `A`
   - **Name**: `@` (apex domain)
   - **Value**: `76.76.21.21` (Vercel A record IP)
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`

---

## 4. Checklist Verifikasi Pasca-Deployment (Content Launch Ready)

Setelah Vercel, Koyeb, dan DNS aktif:

1. **Uji Liveness & Readiness API**:
   - Buka `https://api.dragonhold.my.id/health` -> Menghasilkan `{"status":"ok"}`.
   - Buka `https://api.dragonhold.my.id/ready` -> Menghasilkan `{"status":"ready","database":"connected"}`.
2. **Uji Pengumuman Resmi**:
   - Buka `https://api.dragonhold.my.id/announcements` -> Menghasilkan maklumat berstatus `PUBLISHED`.
3. **Uji CORS & Origin Guard**:
   - Buka browser DevTools (F12) -> Tab Network di `https://dragonhold.my.id`.
   - Lakukan registrasi dengan kode beta yang benar.
   - Pastikan header response menyertakan `access-control-allow-origin: https://dragonhold.my.id` dan `access-control-allow-credentials: true`.
4. **Uji Keamanan Cookie**:
   - Di DevTools -> Application -> Cookies -> `https://api.dragonhold.my.id`:
   - Pastikan cookie `dh_session` memiliki atribut:
     - `HttpOnly`: **Centang (True)**
     - `Secure`: **Centang (True)**
     - `SameSite`: **Lax**
     - `Domain`: `.dragonhold.my.id`
5. **Uji Dashboard Warga**:
   - Setelah login/register, pastikan diarahkan ke `/dashboard`.
   - Citizen ID (format `DH-00000x`) dan Character Name tampil dengan presisi.
   - Klik "Sign out" -> Cookie sesi terhapus dari browser dan database, dan halaman diarahkan kembali ke beranda.
