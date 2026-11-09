-- Migration: Membuat tabel prioritas kompetensi pegawai
-- Deskripsi: Menyimpan isian prioritas kebutuhan kompetensi per pegawai
--            yang diisi oleh admin_tambun_raya maupun pegawai sendiri.
-- Nilai prioritas: Mutlak, Perlu, Penting

CREATE TABLE IF NOT EXISTS kepegawaian.user_kompetensi_prioritas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL COMMENT 'ID pegawai (kepegawaian.user.id)',
    id_kompetensi INT NOT NULL COMMENT 'ID kompetensi (kepegawaian.master_kompetensi.id)',
    prioritas ENUM('Mutlak','Perlu','Penting') NOT NULL COMMENT 'Tingkat prioritas kebutuhan kompetensi',
    diisi_oleh VARCHAR(255) DEFAULT NULL COMMENT 'Nama pengisi terakhir',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ukp_user_kompetensi (id_user, id_kompetensi),
    KEY idx_ukp_user (id_user),
    KEY idx_ukp_kompetensi (id_kompetensi),
    KEY idx_ukp_prioritas (prioritas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Prioritas kebutuhan kompetensi per pegawai';
