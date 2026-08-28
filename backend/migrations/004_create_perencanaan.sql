-- Migration: Membuat tabel perencanaan
-- Deskripsi: Menyimpan dokumen perencanaan (PDF) yang diunggah oleh admin/katim/kabag_tu
-- Semua user bisa melihat daftar dan membuka file

CREATE TABLE IF NOT EXISTS kepegawaian.perencanaan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_file VARCHAR(255) NOT NULL COMMENT 'Nama file asli yang ditampilkan ke user',
    file_name VARCHAR(255) NOT NULL COMMENT 'Nama file tersimpan di server (unik)',
    ukuran_file BIGINT DEFAULT 0 COMMENT 'Ukuran file dalam bytes',
    uploaded_by VARCHAR(100) NOT NULL COMMENT 'Username/NIP yang mengunggah',
    uploaded_by_name VARCHAR(255) DEFAULT NULL COMMENT 'Nama lengkap yang mengunggah',
    nip VARCHAR(50) DEFAULT NULL COMMENT 'NIP pengunggah',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal diunggah'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dokumen perencanaan yang diunggah';
