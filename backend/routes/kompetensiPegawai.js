// backend/routes/kompetensiPegawai.js
// Endpoint untuk melihat rekap pegawai berdasarkan kompetensi/sertifikat yang dimiliki.
// Contoh: kompetensi PPNS → siapa saja yang punya sertifikat PPNS,
//         kompetensi PBJ  → siapa saja yang punya sertifikat PBJ, dst.
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUsername } = require('../middleware/keycloakAuth');

/**
 * GET /api/kompetensi-pegawai/rekap
 * Rekapitulasi SEMUA kompetensi beserta jumlah pegawai pemilik sertifikat.
 * Pemilik sertifikat = user_kompetensi dengan status 'Lulus' & hasil_verif 'Valid'.
 */
router.get('/rekap', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses rekap kompetensi pegawai`);

    try {
        const [rows] = await db.query(`
            SELECT
                mk.id AS kompetensi_id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi,
                p.nama_peran,
                COUNT(DISTINCT uk.id_user) AS total_tercatat,
                COUNT(DISTINCT CASE
                    WHEN uk.status = 'Lulus' AND uk.hasil_verif = 'Valid' THEN uk.id_user
                END) AS pemilik_sertifikat
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_kompetensi = mk.id
            GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi, mk.deskripsi, f.nama_fungsi, p.nama_peran
            ORDER BY mk.kode_kompetensi ASC
        `);

        const data = rows.map(r => ({
            ...r,
            total_tercatat: Number(r.total_tercatat) || 0,
            pemilik_sertifikat: Number(r.pemilik_sertifikat) || 0
        }));

        const totalKompetensi = data.length;
        const totalPemilik = data.reduce((sum, r) => sum + r.pemilik_sertifikat, 0);
        const denganPemilik = data.filter(r => r.pemilik_sertifikat > 0).length;

        res.status(200).json({
            success: true,
            message: 'Rekap kompetensi pegawai berhasil diambil',
            data: data,
            statistik: {
                total_kompetensi: totalKompetensi,
                total_tercatat: data.reduce((sum, r) => sum + r.total_tercatat, 0),
                total_pemilik_sertifikat: totalPemilik,
                kompetensi_dengan_pemilik: denganPemilik
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching rekap kompetensi pegawai:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-pegawai/:kompetensiId/pegawai
 * Detail daftar pegawai yang MEMILIKI sertifikat kompetensi tertentu
 * (status 'Lulus' & hasil_verif 'Valid').
 *
 * Query params:
 *  - search : pencarian berdasarkan NIP / nama / email / jabatan
 */
router.get('/:kompetensiId/pegawai', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { kompetensiId } = req.params;
    const { search } = req.query;

    console.log(`📊 ${username} mengakses pemilik sertifikat kompetensi ID: ${kompetensiId}`);

    try {
        // 1. Informasi kompetensi
        const [kompetensiInfo] = await db.query(`
            SELECT
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi,
                p.nama_peran
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            WHERE mk.id = ?
        `, [kompetensiId]);

        if (kompetensiInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }

        // 2. Pegawai pemilik sertifikat kompetensi ini
        let pegawaiQuery = `
            SELECT
                u.id AS user_id,
                u.nip,
                u.nama,
                u.email,
                u.id_fungsi,
                f.nama_fungsi,
                u.id_jabatan,
                j.nama_jabatan,
                u.id_jenjang,
                jg.nama_jenjang,
                (
                    SELECT GROUP_CONCAT(p.nama_peran SEPARATOR ', ')
                    FROM kepegawaian.peran p
                    WHERE FIND_IN_SET(p.id, u.id_peran)
                ) AS daftar_peran,
                uk.id AS uk_id,
                DATE_FORMAT(uk.tanggal_dipenuhi, '%Y-%m-%d') AS tanggal_dipenuhi,
                uk.bukti,
                uk.nilai,
                uk.status,
                uk.hasil_verif,
                uk.keterangan,
                uk.verified_by,
                v.nama AS verified_by_nama,
                DATE_FORMAT(uk.verified_at, '%Y-%m-%d %H:%i:%s') AS verified_at
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
            WHERE uk.id_kompetensi = ?
              AND uk.status = 'Lulus'
              AND uk.hasil_verif = 'Valid'
        `;

        const params = [kompetensiId];

        if (search && search !== '') {
            pegawaiQuery += ` AND (u.nama LIKE ? OR REPLACE(u.nip, ' ', '') LIKE ? OR u.email LIKE ? OR j.nama_jabatan LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        pegawaiQuery += ` ORDER BY u.nama ASC`;

        const [pegawai] = await db.query(pegawaiQuery, params);

        res.status(200).json({
            success: true,
            message: 'Data pemilik sertifikat kompetensi berhasil diambil',
            kompetensi: kompetensiInfo[0],
            data: pegawai,
            statistik: {
                total_pemilik: pegawai.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching pemilik sertifikat kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

module.exports = router;
