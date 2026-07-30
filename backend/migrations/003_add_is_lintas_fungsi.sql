-- Migration: Menambahkan kolom is_lintas_fungsi pada tabel peran
-- Deskripsi: Untuk menandai peran yang bisa muncul lintas fungsi (cross-function)

ALTER TABLE kepegawaian.peran 
ADD COLUMN is_lintas_fungsi TINYINT(1) NOT NULL DEFAULT 0 
COMMENT '1 = peran muncul di semua fungsi, 0 = peran hanya muncul di fungsi terkait';
