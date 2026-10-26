# Panduan Deploy / Rebuild di Server

Dokumen ini menjelaskan cara men-deploy ulang aplikasi setelah kredensial
dipindahkan dari `docker-compose.yml` ke file `.env`.

---

## 1. Struktur Konfigurasi

Seluruh konfigurasi ada di **satu file**: `.env` di root project.

| File | Isi | Status git |
|---|---|---|
| `.env.example` | template lengkap + keterangan tiap variabel | **dilacak** |
| `.env` | nilai sebenarnya (password & secret) | diabaikan git |
| `docker-compose.yml` | hanya konfigurasi non-rahasia | **dilacak** |

`docker-compose.yml` memetakan variabel dari `.env` ke container backend dan
frontend. Jadi **tidak perlu** mengisi `backend/.env` atau `frontend/.env`.

> File lama `backend/.env`, `backend/.env.local`, `backend/.env.production`,
> dan `frontend/.env` sudah tidak dipakai Docker dan boleh dihapus. Simpan saja
> bila Anda masih menjalankan aplikasi tanpa Docker.

Catatan: kode backend memuat `dotenv` dari `backend/.env` lalu `backend/.env.local`
(`.env.local` menimpa `.env`), tetapi dotenv **tidak menimpa** variabel yang sudah
diset Docker. Jadi nilai dari `.env` di root selalu yang menang saat memakai Docker.

---

## 2. Ambil Perubahan di Server

Riwayat git sudah **ditulis ulang** (force push), jadi `git pull` biasa akan gagal.
Gunakan `reset --hard`:

```bash
cd /path/ke/folder/kepegawaian

# file .env di root TIDAK ter-track git, jadi aman dari reset --hard
cp -a .env .env.bak 2>/dev/null || true

git fetch origin
git reset --hard origin/main
```

Setelah `reset --hard`, folder `backend/node_modules` **akan ikut terhapus** —
ini normal. Dependency akan diambil ulang dari image Docker saat rebuild.

---

## 3. Siapkan File `.env`

```bash
cp .env.example .env
nano .env          # isi semua nilai
chmod 600 .env
```

Nilai yang wajib diganti ditandai `GANTI_...`. Cari dengan:

```bash
grep -n 'GANTI_' .env
```

Generate nilai untuk `NEXTAUTH_SECRET` dan `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Verifikasi `.env` **tidak** terbaca git:

```bash
git status --short        # .env TIDAK boleh muncul
git check-ignore -v .env
```

---

## 4. Build & Jalankan

```bash
# cek dulu konfigurasi sudah terbaca benar
docker compose config

docker compose down
docker compose up -d --build

# lihat log
docker compose logs -f backend
docker compose logs -f frontend
```

Cek cepat:

```bash
curl -I http://127.0.0.1:5001/api/dashboard    # backend
curl -I http://127.0.0.1:3002                  # frontend
```

---

## 5. WAJIB: Rotasi Kredensial

Kredensial berikut pernah ter-commit ke repositori publik dan **harus dianggap
sudah bocor**. Ganti semuanya di sisi server Keycloak / MySQL, lalu samakan
nilainya di `.env`:

| Kredensial | Di mana diganti | Variabel |
|---|---|---|
| Password user MySQL `raya` | MySQL | `DB_PASSWORD` |
| Password admin Keycloak | Keycloak Admin Console | `KEYCLOAK_ADMIN_PASSWORD` |
| Client secret Keycloak (frontend) | Keycloak → Clients → `kepegawaian` → Credentials | `FRONTEND_KEYCLOAK_CLIENT_SECRET` |
| Client secret Keycloak (backend) | Keycloak → Clients → `nextjs-local` → Credentials | `BACKEND_KEYCLOAK_CLIENT_SECRET` |
| NextAuth secret | generate sendiri | `NEXTAUTH_SECRET` |
| Session secret | generate sendiri | `SESSION_SECRET` |

Generate secret baru:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> Mengganti `NEXTAUTH_SECRET` membuat **semua sesi login lama logout**.
> Ini memang diharapkan; minta user login ulang.

---

## 6. Sisa Pembersihan di GitHub

Force push sudah menghapus secret dari semua commit yang aktif, **tetapi**:

1. GitHub masih menyimpan objek lama (dangling) dan bisa diakses lewat URL
   commit lama sampai proses garbage collection berjalan. Untuk memastikan
   langsung hilang, ajukan permintaan ke
   [GitHub Support](https://support.github.com/request) dengan judul
   *"Request to purge cached views of sensitive data"* dan sebutkan
   repository + commit SHA lama berikut:
   - `7ff6699` — commit pertama, berisi seluruh kredensial
   - `1320266` — HEAD `main` sebelum riwayat ditulis ulang
   - Semua SHA di antaranya (total 38 commit lama)
2. Kalau repository ini pernah di-**fork**, fork tersebut masih menyimpan
   seluruh commit lama. Hapus fork atau minta pemiliknya sync ulang.
3. Kredensial itu sempat publik → rotasi di langkah 5 tetap wajib.

---

## 7. Catatan `NEXT_PUBLIC_*`

Variabel `NEXT_PUBLIC_*` **ditanam saat build time**, bukan runtime.
Kalau nilainya diubah, image frontend harus di-build ulang:

```bash
docker compose up -d --build frontend
```

Nilainya diambil dari variabel `NEXT_PUBLIC_*` di `.env` dan **wajib diisi** —
`docker compose config` akan berhenti bila masih kosong.

---

## 8. Token Tidak Lagi Dikirim ke Browser (proxy `/api/backend`)

Sejak perbaikan keamanan ini:

- Token Keycloak (access + id token) **hanya** disimpan di cookie sesi NextAuth
  yang `HttpOnly` + terenkripsi, dan hanya dibaca di sisi server.
- Browser memanggil backend lewat proxy internal `frontend/pages/api/backend/[...path].js`
  (`NEXT_PUBLIC_API_URL=/api/backend`), dan proxy itulah yang menambahkan
  `Authorization: Bearer ...`.

### Variabel baru yang WAJIB diisi di `.env`

```bash
# Alamat backend DILIHAT DARI container frontend (bukan dari browser).
# Backend memakai network_mode: host, jadi dijangkau lewat gateway host.
BACKEND_INTERNAL_URL=http://host.docker.internal:5001
```

`docker-compose.yml` menambahkan `extra_hosts: host.docker.internal:host-gateway`
pada service frontend; `docker compose config` akan gagal bila variabel ini kosong.

`NEXT_PUBLIC_API_URL` sekarang berisi **path relatif** `/api/backend`, bukan URL
backend publik. Karena itu **frontend wajib di-build ulang**:

```bash
docker compose up -d --build frontend backend
```

### Verifikasi setelah deploy

```bash
# 0. Pastikan paket frontend TIDAK lagi memuat URL backend publik.
#    Kalau perintah ini mengeluarkan URL, artinya frontend belum di-build ulang
#    dengan NEXT_PUBLIC_API_URL=/api/backend.
#    Gejala di browser: "Failed to fetch" (request diblokir CSP connect-src 'self').
curl -s https://tambun-raya.bbpompky.id/login | grep -o 'https://api-tambun[^"]*' \
  || echo 'OK: tidak ada URL backend publik di HTML'

# 0b. Proxy harus bisa menjangkau backend dari dalam container frontend.
#     Kalau gagal: 502 "Tidak dapat menghubungi server backend" dari /api/backend/*.
#     Solusi: samakan BACKEND_INTERNAL_URL dengan alamat backend yang bisa
#     dijangkau container (mis. http://172.17.0.1:5001 bila host-gateway tidak tersedia).
docker compose exec frontend wget -qO- http://host.docker.internal:5001/api/health

# 1. HTML halaman berproteksi tidak boleh memuat JWT (cari "eyJhbGciOi" -> harus kosong)
curl -s -b "next-auth.session-token=<cookie-anda>" https://tambun-raya.bbpompky.id/kegiatan | grep -c 'eyJhbGciOi'

# 2. Proxy tanpa sesi harus membalas 401 JSON (bukan redirect)
curl -s -o /dev/null -w '%{http_code}\n' https://tambun-raya.bbpompky.id/api/backend/health

# 3. Log backend harus menolak token palsu
docker compose logs backend | grep 'Token ditolak'
```

Catatan perilaku:

- Rate limit & log backend tetap melihat IP pengguna asli (proxy meneruskan
  `X-Forwarded-For`).
- Logout ke Keycloak tidak lagi menaruh `id_token_hint` di URL. Bila setelah
  logout user masih otomatis masuk kembali (SSO cookie Keycloak tidak terhapus),
  jalur alternatifnya adalah membuat route server-side yang menyusun URL logout
  lengkap dengan `id_token_hint` dari cookie (token tetap di server).
- Backend sekarang **memverifikasi tanda tangan JWT** lewat JWKS Keycloak
  (`backend/utils/keycloakJwt.js`). Token yang dibuat sendiri (tanpa tanda tangan
  Keycloak) akan ditolak 401. Bila client Keycloak memakai audience mapper dan
  ingin audience diperiksa juga, isi `KEYCLOAK_AUDIENCES` (dipisah koma) di `.env`.

### Kalau muncul "Failed to fetch" di browser

Penyebab paling sering: **`.env` diisi URL backend publik lagi** (mis.
`NEXT_PUBLIC_API_URL=https://api-tambun.bbpompky.id/api`) lalu frontend di-build.
Akibatnya browser mencoba memanggil domain backend langsung, padahal:

1. CSP `connect-src 'self'` memblokirnya -> error `Failed to fetch`; dan
2. klien memang **tidak punya token** lagi (token hanya ada di cookie HttpOnly),
   jadi request langsung ke backend tetap akan ditolak 401.

Langkah perbaikan:

```bash
# 1. Pastikan tidak ada nilai absolute (nilai benar: /api/backend)
grep -n 'NEXT_PUBLIC_API_URL' .env            # tidak wajib ada; kalau ada harus /api/backend

# 2. Build ulang frontend (build akan GAGAL dengan pesan jelas bila nilainya salah)
docker compose up -d --build frontend

# 3. Pastikan paket baru sudah benar
curl -s https://tambun-raya.bbpompky.id/login | grep -o 'https://api-tambun[^"]*' \
  || echo 'OK: tidak ada URL backend publik di HTML'
```

### Diagnosa cepat lain

| Gejala | Artinya | Tindakan |
|---|---|---|
| `Failed to fetch` | Permintaan tidak pernah sampai (CSP/mixed content/DNS) | Cek langkah di atas; pastikan bundle memakai `/api/backend` |
| `502` + `Tidak dapat menghubungi server backend` | Proxy tidak bisa menjangkau backend | Cek `BACKEND_INTERNAL_URL` & langkah 0b |
| `401` + `Sesi tidak ditemukan` | Cookie sesi tidak terkirim / user belum login | Login ulang; pastikan domain & HTTPS benar |
| `401` + `Token tidak valid atau kadaluarsa` | Token ditolak backend (JWKS/iss/exp) | Cek `KEYCLOAK_SERVER_URL`/`KEYCLOAK_REALM` di backend & jam server |

---

## 9. Migration Index (Sekali Saja)

`backend/migrations/005_add_performance_indexes.sql` menambahkan 7 index untuk
menghilangkan full table scan pada query agregat & daftar. MySQL tidak punya
`ADD INDEX IF NOT EXISTS`, jadi jalankan **hanya sekali**:

```bash
docker compose exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  < backend/migrations/005_add_performance_indexes.sql
```

Kalau MySQL berjalan di host (bukan container), jalankan dari host:

```bash
mysql -u <user> -p <nama_db> < backend/migrations/005_add_performance_indexes.sql
```

Verifikasi (harus menampilkan 7 baris):

```sql
SELECT table_name, index_name FROM information_schema.statistics
WHERE table_schema = DATABASE() AND index_name LIKE 'idx_%'
GROUP BY table_name, index_name;
```

### 9b. Kolom Link Pelatihan (006)

`backend/migrations/006_add_link_pelatihan.sql` menambahkan kolom `link_pelatihan`
pada `jadwal_pelatihan` (dipakai form **Buat Jadwal Pelatihan** untuk pelatihan
online). Tanpa kolom ini, simpan jadwal akan gagal dengan error
`Unknown column 'link_pelatihan'`. Jalankan sekali:

```bash
docker compose exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  < backend/migrations/006_add_link_pelatihan.sql
```

Atau dari host:

```bash
mysql -u <user> -p <nama_db> < backend/migrations/006_add_link_pelatihan.sql
```

Verifikasi (harus menampilkan 1 baris):

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'jadwal_pelatihan'
  AND column_name = 'link_pelatihan';
```

