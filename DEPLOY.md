# Panduan Deploy / Rebuild di Server

Dokumen ini menjelaskan cara men-deploy ulang aplikasi setelah kredensial
dipindahkan dari `docker-compose.yml` ke file `.env`.

---

## 1. Struktur Konfigurasi (BARU)

| File | Isi | Status git |
|---|---|---|
| `docker-compose.yml` | hanya konfigurasi non-rahasia | **dilacak** |
| `backend/.env` | DB, Keycloak admin, client secret, session | diabaikan git |
| `frontend/.env` | NextAuth, Keycloak client, `NEXT_PUBLIC_*` | diabaikan git |
| `backend/.env.example` | template backend | dilacak |
| `frontend/.env.example` | template frontend | dilacak |

> `docker-compose.yml` **tidak boleh** lagi berisi password / secret apa pun.
> Semuanya dibaca lewat `env_file` dari dua file di atas.

---

## 2. Ambil Perubahan di Server

Riwayat git sudah **ditulis ulang** (force push), jadi `git pull` biasa akan gagal.
Gunakan `reset --hard`:

```bash
cd /path/ke/folder/kepegawaian

# cadangkan file .env lama (kalau ada)
cp -a backend/.env  backend/.env.bak  2>/dev/null || true
cp -a frontend/.env frontend/.env.bak 2>/dev/null || true

git fetch origin
git reset --hard origin/main
```

Setelah `reset --hard`, folder `backend/node_modules` **akan ikut terhapus** —
ini normal. Dependency akan diambil ulang dari image Docker saat rebuild.

---

## 3. Siapkan File `.env`

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Lalu isi keduanya dengan nilai sebenarnya. Kalau `.env` lama masih ada,
nilai-nilainya bisa dipindahkan dari `backend/.env.bak` / `frontend/.env.bak`.

Pastikan permission ketat:

```bash
chmod 600 backend/.env frontend/.env
```

Verifikasi file-file itu **tidak** terbaca git:

```bash
git status --short        # backend/.env & frontend/.env TIDAK boleh muncul
git check-ignore -v backend/.env frontend/.env
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
| Client secret Keycloak (frontend) | Keycloak → Clients → `kepegawaian` → Credentials | `KEYCLOAK_CLIENT_SECRET` (frontend) |
| Client secret Keycloak (backend) | Keycloak → Clients → `nextjs-local` → Credentials | `KEYCLOAK_CLIENT_SECRET` (backend) |
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

Nilai default-nya ada di `docker-compose.yml` dan bisa ditimpa lewat file
`.env` di root project (opsional).
