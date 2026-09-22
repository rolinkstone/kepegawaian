-- Migration: 005 — Index untuk query yang sebelumnya FULL TABLE SCAN
-- Dasar: hasil EXPLAIN atas 50 query yang benar-benar dieksekusi aplikasi
-- (query diambil dari kode backend + dijalankan lewat endpoint GET, lalu di-EXPLAIN
-- dengan parameter aslinya).
--
-- Ringkasan temuan sebelum migration:
--   * 4 query full scan di user_kompetensi (±600 baris, tumbuh terus)
--   * 6 query full scan di user (66 baris) — termasuk 11 pemakaian
--     REPLACE(nip, ' ', '') = ? yang membuat index unik `nip` tidak terpakai
--     (ini diperbaiki di KODE, bukan dengan index — lihat catatan bagian 2)
--   * ORDER BY created_at tanpa index (user_kompetensi, perencanaan)
--
-- Efektivitas tiap index diuji pada tabel tiruan 100.000 baris:
--   ORDER BY created_at DESC LIMIT 10 : ALL + filesort  -> index, backward index scan, rows=10
--   GROUP BY status                   : ALL + temporary -> index, "Using index"
--   WHERE tanggal >= NOW()-INTERVAL   : ALL             -> range
--
-- Catatan: MySQL 8 tidak mengenal "ADD INDEX IF NOT EXISTS", jadi migration ini
-- hanya boleh dijalankan SEKALI per database.

-- ============================================================
-- 1. user_kompetensi
-- ============================================================
ALTER TABLE kepegawaian.user_kompetensi
  -- 1a. Daftar "Riwayat Pelatihan" memakai ORDER BY uk.created_at DESC.
  --     Pada ±600 baris MySQL masih memilih full scan + filesort (wajar untuk tabel
  --     kecil), tetapi uji pada 100.000 baris menunjukkan index ini mengubah rencana
  --     menjadi "backward index scan, rows=10" begitu query memakai LIMIT.
  --     Catatan: endpoint daftar saat ini TIDAK memakai LIMIT (mengembalikan semua
  --     baris), jadi keuntungan penuhnya baru terasa setelah paginasi server-side.
  ADD INDEX idx_uk_created_at (created_at),

  -- 1b. Dashboard: SUM(CASE status/hasil_verif/verified_by ...) dan GROUP BY status
  --     -> sebelumnya: full table scan; dengan index ini cukup index-only scan
  ADD INDEX idx_uk_status_verif (status, hasil_verif, verified_by),

  -- 1c. Dashboard: AVG(nilai)/MIN(nilai)/MAX(nilai) WHERE nilai IS NOT NULL
  ADD INDEX idx_uk_nilai (nilai);

-- ============================================================
-- 2. user
-- ============================================================
ALTER TABLE kepegawaian.user
  -- WHERE is_active = 1 dan WHERE is_active = 1 ORDER BY nama
  ADD INDEX idx_user_active_nama (is_active, nama);

-- CATATAN PENTING (functional index DITOLAK, query-nya yang diperbaiki)
-- Index ekspresi ((REPLACE(nip, ' ', ''))) sudah dicoba dan DIBATALKAN:
-- diuji pada tabel 100.000 baris, optimizer tidak memakainya (possible_keys NULL,
-- tetap full scan index `nip`). Perbaikannya dilakukan di QUERY:
--   11 pemakaian `REPLACE(nip, ' ', '') = ?` di routes/pelatihan.js dan
--   routes/userskompetensi.js diganti `nip IN (?, ?)` (dua bentuk NIP) sehingga
--   index unik `nip` terpakai — EXPLAIN: type=range, key=nip, rows=1
--   (sebelumnya full scan seluruh index `nip`).
-- Sisa REPLACE(nip, ...) yang dibiarkan tidak berpengaruh pada index:
--   * pelatihan.js — hanya di SELECT list (alias pembuat_nip)
--   * kompetensiPegawai.js — di dalam LIKE '%...%' (leading wildcard, tidak bisa pakai index)

-- ============================================================
-- 3. jadwal_pelatihan
-- ============================================================
ALTER TABLE kepegawaian.jadwal_pelatihan
  -- 3a. Dashboard: GROUP BY status / SUM(CASE status = ...)
  ADD INDEX idx_jadwal_status (status),
  -- 3b. Dashboard: WHERE tanggal_mulai >= DATE_SUB(NOW(), INTERVAL n MONTH)
  ADD INDEX idx_jadwal_tanggal_mulai (tanggal_mulai);

-- ============================================================
-- 4. perencanaan
-- ============================================================
ALTER TABLE kepegawaian.perencanaan
  -- 4a. Daftar dokumen: ORDER BY created_at DESC
  ADD INDEX idx_perencanaan_created_at (created_at);

-- ============================================================
-- CATATAN: yang BELUM bisa dibereskan lewat index
-- ============================================================
-- Kolom user.id_peran berisi daftar id yang dipisah koma (mis. '1,5,9').
-- Padanan FIND_IN_SET(p.id, u.id_peran) TIDAK BISA memakai index apa pun,
-- sehingga query pegawai-peran / kompetensi-wajib selalu full scan pada `user`
-- (dan pada `peran` untuk subquery-nya). Perbaikannya bukan index, melainkan
-- normalisasi ke tabel penghubung:
--
--     CREATE TABLE user_peran (
--       id_user INT NOT NULL,
--       id_peran INT NOT NULL,
--       PRIMARY KEY (id_user, id_peran),
--       KEY idx_peran (id_peran),
--       CONSTRAINT fk_up_user  FOREIGN KEY (id_user)  REFERENCES user(id)  ON DELETE CASCADE,
--       CONSTRAINT fk_up_peran FOREIGN KEY (id_peran) REFERENCES peran(id) ON DELETE CASCADE
--     );
--
-- lalu FIND_IN_SET(p.id, u.id_peran) diganti EXISTS (SELECT 1 FROM user_peran up
-- WHERE up.id_user = u.id AND up.id_peran = p.id).
-- Dilakukan terpisah karena menyentuh jalur tulis user (CRUD pegawai) juga.
