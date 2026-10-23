-- Migration: Menambahkan kolom link_pelatihan pada tabel jadwal_pelatihan
-- Deskripsi: Menyimpan URL pelatihan daring (Zoom, Google Meet, dsb.) sehingga
--            peserta dapat langsung membuka link dari detail jadwal.

ALTER TABLE kepegawaian.jadwal_pelatihan
    ADD COLUMN link_pelatihan VARCHAR(500) DEFAULT NULL
        COMMENT 'URL/link pelatihan online yang dapat diakses peserta'
        AFTER lokasi;
