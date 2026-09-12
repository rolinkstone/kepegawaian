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

Catatan: kode backend memuat `dotenv` dari `.env.local`, tetapi dotenv
**tidak menimpa** variabel yang sudah diset Docker. Jadi nilai dari `.env`
selalu yang menang.

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
