// backend/routes/prioritasKompetensi.js
// Endpoint isian Prioritas Kompetensi pegawai (Mutlak / Perlu / Penting).
//
// Baris data = pasangan pegawai x kompetensi standar pegawai tersebut
// (kompetensi_mapping yang cocok dengan jabatan + jenjang + peran pegawai).
// Isian prioritas disimpan di kepegawaian.user_kompetensi_prioritas.
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUsername } = require('../middleware/keycloakAuth');
const { getUserNipFromToken, isAdminTambunRaya } = require('../utils/keycloakHelpers');

const PRIORITAS_VALUES = ['Mutlak', 'Perlu', 'Penting'];
const MAX_BULK_ITEMS = 500;

// Query pasangan (pegawai, kompetensi standar) tanpa duplikasi.
const PAIRS_SUBQUERY = `
    SELECT u.id AS id_user, km.id_kompetensi AS id_kompetensi
    FROM kepegawaian.user u
    JOIN kepegawaian.kompetensi_mapping km
        ON km.id_jabatan = u.id_jabatan
       AND km.id_jenjang = u.id_jenjang
       AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
    JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
    JOIN kepegawaian.peran p ON p.id = km.id_peran
    WHERE u.is_active = 1
      AND (mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)
`;

/**
 * Ambil ID pegawai (kepegawaian.user.id) milik user yang login.
 */
async function getOwnPegawaiId(req) {
    const nip = getUserNipFromToken(req.user);
    const cleanNip = String(nip || '').replace(/\s/g, '');
    if (!cleanNip) return null;

    const [rows] = await db.query(
        'SELECT id FROM kepegawaian.user WHERE nip IN (?, ?) LIMIT 1',
        [cleanNip, String(nip || '')]
    );

    return rows.length > 0 ? rows[0].id : null;
}

/**
 * Pastikan kompetensi memang bagian dari standar kompetensi pegawai.
 */
async function isStandardKompetensi(idUser, idKompetensi) {
    const [rows] = await db.query(`
        SELECT 1 AS ok
        FROM kepegawaian.kompetensi_mapping km
        JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
        JOIN kepegawaian.peran p ON p.id = km.id_peran
        JOIN kepegawaian.user u ON u.id = ?
        WHERE km.id_jabatan = u.id_jabatan
          AND km.id_jenjang = u.id_jenjang
          AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
          AND (mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)
          AND km.id_kompetensi = ?
        LIMIT 1
    `, [idUser, idKompetensi]);

    return rows.length > 0;
}

/**
 * GET /api/prioritas-kompetensi
 * Daftar prioritas kompetensi + filter nama pegawai, jabatan, jenjang, fungsi,
 * dan status pengisian prioritas. Mendukung pagination server-side.
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    console.log(`📊 ${username} mengakses prioritas kompetensi`);

    const {
        search = '',
        id_jabatan,
        id_jenjang,
        id_fungsi,
        prioritas,
        page = 1,
        pageSize = 25
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 200);
    const offset = (currentPage - 1) * limit;

    try {
        // ===== Kondisi cakupan (role + filter, tanpa filter prioritas) =====
        const scopeConditions = ['u.is_active = 1'];
        const scopeParams = [];

        if (!isAdmin) {
            const ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            scopeConditions.push('u.id = ?');
            scopeParams.push(ownId);
        }

        const searchTerm = String(search || '').trim();
        if (searchTerm) {
            scopeConditions.push('(u.nama LIKE ? OR u.nip LIKE ?)');
            scopeParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (id_jabatan) {
            scopeConditions.push('u.id_jabatan = ?');
            scopeParams.push(parseInt(id_jabatan, 10));
        }

        if (id_jenjang) {
            scopeConditions.push('u.id_jenjang = ?');
            scopeParams.push(parseInt(id_jenjang, 10));
        }

        if (id_fungsi) {
            scopeConditions.push('u.id_fungsi = ?');
            scopeParams.push(parseInt(id_fungsi, 10));
        }

        // ===== Filter prioritas (hanya untuk data & total) =====
        const dataConditions = [...scopeConditions];
        const dataParams = [...scopeParams];

        // Samakan dengan definisi standar kompetensi pegawai (fungsi sendiri
        // atau peran lintas fungsi).
        dataConditions.push('(mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)');

        if (prioritas === 'belum') {
            dataConditions.push('ukp.prioritas IS NULL');
        } else if (PRIORITAS_VALUES.includes(prioritas)) {
            dataConditions.push('ukp.prioritas = ?');
            dataParams.push(prioritas);
        }

        // ===== Ringkasan (mengikuti filter cakupan saja) =====
        const [summaryRows] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN ukp.prioritas = 'Mutlak' THEN 1 ELSE 0 END) AS mutlak,
                SUM(CASE WHEN ukp.prioritas = 'Perlu' THEN 1 ELSE 0 END) AS perlu,
                SUM(CASE WHEN ukp.prioritas = 'Penting' THEN 1 ELSE 0 END) AS penting,
                SUM(CASE WHEN ukp.prioritas IS NULL THEN 1 ELSE 0 END) AS belum_diisi
            FROM (${PAIRS_SUBQUERY} AND ${scopeConditions.join(' AND ')}
                  GROUP BY u.id, km.id_kompetensi) s
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = s.id_user AND ukp.id_kompetensi = s.id_kompetensi
        `, scopeParams);

        const summaryRow = summaryRows[0] || {};
        const summary = {
            total: Number(summaryRow.total || 0),
            mutlak: Number(summaryRow.mutlak || 0),
            perlu: Number(summaryRow.perlu || 0),
            penting: Number(summaryRow.penting || 0),
            belum_diisi: Number(summaryRow.belum_diisi || 0)
        };

        // ===== Total baris sesuai filter prioritas =====
        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM (
                SELECT u.id, km.id_kompetensi
                FROM kepegawaian.user u
                JOIN kepegawaian.kompetensi_mapping km
                    ON km.id_jabatan = u.id_jabatan
                   AND km.id_jenjang = u.id_jenjang
                   AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
                JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
                JOIN kepegawaian.peran p ON p.id = km.id_peran
                LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                    ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
                WHERE ${dataConditions.join(' AND ')}
                GROUP BY u.id, km.id_kompetensi
            ) t
        `, dataParams);

        const total = Number(countRows[0]?.total || 0);

        // ===== Data halaman aktif =====
        const [rows] = await db.query(`
            SELECT
                u.id AS id_user,
                u.nip,
                u.nama AS nama_pegawai,
                u.id_jabatan,
                j.nama_jabatan,
                u.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat AS tingkat_jenjang,
                u.id_fungsi,
                f.nama_fungsi,
                mk.id AS id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi AS deskripsi_kompetensi,
                GROUP_CONCAT(DISTINCT p.nama_peran ORDER BY p.nama_peran SEPARATOR ', ') AS nama_peran,
                MAX(km.is_mandatory) AS is_mandatory,
                MAX(ukp.prioritas) AS prioritas,
                MAX(ukp.diisi_oleh) AS diisi_oleh,
                DATE_FORMAT(MAX(ukp.updated_at), '%Y-%m-%d %H:%i:%s') AS prioritas_updated_at
            FROM kepegawaian.user u
            JOIN kepegawaian.kompetensi_mapping km
                ON km.id_jabatan = u.id_jabatan
               AND km.id_jenjang = u.id_jenjang
               AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
            JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
            JOIN kepegawaian.fungsi f ON f.id = mk.id_fungsi
            JOIN kepegawaian.peran p ON p.id = km.id_peran
            JOIN kepegawaian.jabatan j ON j.id = u.id_jabatan
            JOIN kepegawaian.jenjang jg ON jg.id = u.id_jenjang
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
            WHERE ${dataConditions.join(' AND ')}
            GROUP BY
                u.id, u.nip, u.nama, u.id_jabatan, j.nama_jabatan,
                u.id_jenjang, jg.nama_jenjang, jg.tingkat,
                u.id_fungsi, f.nama_fungsi,
                mk.id, mk.kode_kompetensi, mk.nama_kompetensi, mk.deskripsi
            ORDER BY u.nama ASC, mk.kode_kompetensi ASC
            LIMIT ? OFFSET ?
        `, [...dataParams, limit, offset]);

        res.status(200).json({
            success: true,
            message: 'Data prioritas kompetensi berhasil diambil',
            data: rows,
            total,
            page: currentPage,
            pageSize: limit,
            summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching prioritas kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/prioritas-kompetensi/rekap
 * Rekap prioritas per kompetensi + jenjang: jumlah pegawai untuk setiap
 * prioritas (Mutlak/Perlu/Penting) dan yang belum diisi.
 * Filter status_isi: 'belum' (masih ada yang kosong) / 'lengkap'.
 */
router.get('/rekap', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    console.log(`📊 ${username} mengakses rekap prioritas kompetensi`);

    const {
        search = '',
        search_kompetensi = '',
        id_jabatan,
        id_jenjang,
        id_fungsi,
        status_isi,
        page = 1,
        pageSize = 25
    } = req.query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 200);
    const offset = (currentPage - 1) * limit;

    try {
        const conditions = [
            'u.is_active = 1',
            '(mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)'
        ];
        const params = [];

        if (!isAdmin) {
            const ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            conditions.push('u.id = ?');
            params.push(ownId);
        }

        const searchTerm = String(search || '').trim();
        if (searchTerm) {
            conditions.push('(u.nama LIKE ? OR u.nip LIKE ?)');
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (id_jabatan) {
            conditions.push('u.id_jabatan = ?');
            params.push(parseInt(id_jabatan, 10));
        }

        if (id_jenjang) {
            conditions.push('u.id_jenjang = ?');
            params.push(parseInt(id_jenjang, 10));
        }

        if (id_fungsi) {
            conditions.push('u.id_fungsi = ?');
            params.push(parseInt(id_fungsi, 10));
        }

        const searchKompetensi = String(search_kompetensi || '').trim();
        if (searchKompetensi) {
            conditions.push('(mk.kode_kompetensi LIKE ? OR mk.nama_kompetensi LIKE ?)');
            params.push(`%${searchKompetensi}%`, `%${searchKompetensi}%`);
        }

        const whereClause = conditions.join(' AND ');

        // Filter status isian (agregat jumlah pegawai yang belum diisi)
        const belumExpr = "COUNT(DISTINCT CASE WHEN ukp.prioritas IS NULL THEN u.id END)";
        let havingClause = '';
        if (status_isi === 'belum') {
            havingClause = `HAVING ${belumExpr} > 0`;
        } else if (status_isi === 'lengkap') {
            havingClause = `HAVING ${belumExpr} = 0`;
        }

        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM (
                SELECT mk.id AS id_kompetensi, jg.id AS id_jenjang
                FROM kepegawaian.user u
                JOIN kepegawaian.kompetensi_mapping km
                    ON km.id_jabatan = u.id_jabatan
                   AND km.id_jenjang = u.id_jenjang
                   AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
                JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
                JOIN kepegawaian.peran p ON p.id = km.id_peran
                JOIN kepegawaian.jenjang jg ON jg.id = u.id_jenjang
                LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                    ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
                WHERE ${whereClause}
                GROUP BY mk.id, jg.id
                ${havingClause}
            ) t
        `, params);

        const [rows] = await db.query(`
            SELECT
                mk.id AS id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                GROUP_CONCAT(DISTINCT p.nama_peran ORDER BY p.nama_peran SEPARATOR ', ') AS nama_peran,
                jg.id AS id_jenjang,
                jg.nama_jenjang,
                jg.tingkat AS tingkat_jenjang,
                COUNT(DISTINCT u.id) AS total_pegawai,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Mutlak' THEN u.id END) AS jumlah_mutlak,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Perlu' THEN u.id END) AS jumlah_perlu,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Penting' THEN u.id END) AS jumlah_penting,
                COUNT(DISTINCT CASE WHEN ukp.prioritas IS NULL THEN u.id END) AS jumlah_belum
            FROM kepegawaian.user u
            JOIN kepegawaian.kompetensi_mapping km
                ON km.id_jabatan = u.id_jabatan
               AND km.id_jenjang = u.id_jenjang
               AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
            JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
            JOIN kepegawaian.peran p ON p.id = km.id_peran
            JOIN kepegawaian.jenjang jg ON jg.id = u.id_jenjang
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
            WHERE ${whereClause}
            GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi, jg.id, jg.nama_jenjang, jg.tingkat
            ${havingClause}
            ORDER BY mk.nama_kompetensi ASC, jg.tingkat ASC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.status(200).json({
            success: true,
            message: 'Rekap prioritas kompetensi berhasil diambil',
            data: rows,
            total: Number(countRows[0]?.total || 0),
            page: currentPage,
            pageSize: limit,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching rekap prioritas kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/prioritas-kompetensi/detail?id_kompetensi=&id_jenjang=
 * Daftar pegawai (beserta prioritasnya) untuk satu kombinasi kompetensi + jenjang.
 * Dipakai oleh modal daftar nama pegawai pada tab Rekap.
 */
router.get('/detail', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const { id_kompetensi, id_jenjang, search = '' } = req.query;

    const idKompetensi = parseInt(id_kompetensi, 10);
    const idJenjang = parseInt(id_jenjang, 10);

    if (!idKompetensi || !idJenjang) {
        return res.status(400).json({
            success: false,
            message: 'id_kompetensi dan id_jenjang wajib diisi'
        });
    }

    try {
        const conditions = [
            'u.is_active = 1',
            '(mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)',
            'mk.id = ?',
            'jg.id = ?'
        ];
        const params = [idKompetensi, idJenjang];

        let ownId = null;
        if (!isAdmin) {
            ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            conditions.push('u.id = ?');
            params.push(ownId);
        }

        const searchTerm = String(search || '').trim();
        if (searchTerm) {
            conditions.push('(u.nama LIKE ? OR u.nip LIKE ?)');
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        const [rows] = await db.query(`
            SELECT
                u.id AS id_user,
                u.nip,
                u.nama AS nama_pegawai,
                j.nama_jabatan,
                f.nama_fungsi,
                ukp.prioritas,
                ukp.diisi_oleh,
                DATE_FORMAT(ukp.updated_at, '%Y-%m-%d %H:%i:%s') AS prioritas_updated_at
            FROM kepegawaian.user u
            JOIN kepegawaian.kompetensi_mapping km
                ON km.id_jabatan = u.id_jabatan
               AND km.id_jenjang = u.id_jenjang
               AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
            JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
            JOIN kepegawaian.peran p ON p.id = km.id_peran
            JOIN kepegawaian.jenjang jg ON jg.id = u.id_jenjang
            LEFT JOIN kepegawaian.jabatan j ON j.id = u.id_jabatan
            LEFT JOIN kepegawaian.fungsi f ON f.id = u.id_fungsi
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
            WHERE ${conditions.join(' AND ')}
            GROUP BY u.id, u.nip, u.nama, j.nama_jabatan, f.nama_fungsi,
                     ukp.prioritas, ukp.diisi_oleh, ukp.updated_at
            ORDER BY u.nama ASC
        `, params);

        const data = rows.map(row => ({
            ...row,
            id_kompetensi: idKompetensi,
            can_edit: isAdmin || row.id_user === ownId
        }));

        res.status(200).json({
            success: true,
            message: 'Daftar pegawai berhasil diambil',
            data,
            count: data.length
        });
    } catch (error) {
        console.error('❌ Error fetching detail prioritas kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/prioritas-kompetensi/rekap-pegawai
 * Rekap prioritas per pegawai: jumlah kompetensi untuk setiap prioritas
 * (Mutlak/Perlu/Penting) dan yang belum diisi.
 * Filter status_isi: 'belum' (masih ada yang kosong) / 'lengkap'.
 */
router.get('/rekap-pegawai', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    console.log(`📊 ${username} mengakses rekap prioritas per pegawai`);

    const { search = '', id_jabatan, id_jenjang, id_fungsi, status_isi, page = 1, pageSize = 25 } = req.query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 200);
    const offset = (currentPage - 1) * limit;

    try {
        const conditions = [
            'u.is_active = 1',
            '(mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)'
        ];
        const params = [];

        if (!isAdmin) {
            const ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            conditions.push('u.id = ?');
            params.push(ownId);
        }

        const searchTerm = String(search || '').trim();
        if (searchTerm) {
            conditions.push('(u.nama LIKE ? OR u.nip LIKE ?)');
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (id_jabatan) {
            conditions.push('u.id_jabatan = ?');
            params.push(parseInt(id_jabatan, 10));
        }

        if (id_jenjang) {
            conditions.push('u.id_jenjang = ?');
            params.push(parseInt(id_jenjang, 10));
        }

        if (id_fungsi) {
            conditions.push('u.id_fungsi = ?');
            params.push(parseInt(id_fungsi, 10));
        }

        const whereClause = conditions.join(' AND ');

        // Filter status isian (agregat jumlah kompetensi yang belum diisi)
        const belumExpr = "COUNT(DISTINCT CASE WHEN ukp.prioritas IS NULL THEN mk.id END)";
        let havingClause = '';
        if (status_isi === 'belum') {
            havingClause = `HAVING ${belumExpr} > 0`;
        } else if (status_isi === 'lengkap') {
            havingClause = `HAVING ${belumExpr} = 0`;
        }

        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM (
                SELECT u.id
                FROM kepegawaian.user u
                JOIN kepegawaian.kompetensi_mapping km
                    ON km.id_jabatan = u.id_jabatan
                   AND km.id_jenjang = u.id_jenjang
                   AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
                JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
                JOIN kepegawaian.peran p ON p.id = km.id_peran
                LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                    ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
                WHERE ${whereClause}
                GROUP BY u.id
                ${havingClause}
            ) t
        `, params);

        const [rows] = await db.query(`
            SELECT
                u.id AS id_user,
                u.nip,
                u.nama AS nama_pegawai,
                u.id_jabatan,
                j.nama_jabatan,
                u.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat AS tingkat_jenjang,
                u.id_fungsi,
                f.nama_fungsi,
                COUNT(DISTINCT mk.id) AS total_kompetensi,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Mutlak' THEN mk.id END) AS jumlah_mutlak,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Perlu' THEN mk.id END) AS jumlah_perlu,
                COUNT(DISTINCT CASE WHEN ukp.prioritas = 'Penting' THEN mk.id END) AS jumlah_penting,
                COUNT(DISTINCT CASE WHEN ukp.prioritas IS NULL THEN mk.id END) AS jumlah_belum
            FROM kepegawaian.user u
            JOIN kepegawaian.kompetensi_mapping km
                ON km.id_jabatan = u.id_jabatan
               AND km.id_jenjang = u.id_jenjang
               AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
            JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
            JOIN kepegawaian.peran p ON p.id = km.id_peran
            LEFT JOIN kepegawaian.jabatan j ON j.id = u.id_jabatan
            LEFT JOIN kepegawaian.jenjang jg ON jg.id = u.id_jenjang
            LEFT JOIN kepegawaian.fungsi f ON f.id = u.id_fungsi
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
            WHERE ${whereClause}
            GROUP BY u.id, u.nip, u.nama, u.id_jabatan, j.nama_jabatan,
                     u.id_jenjang, jg.nama_jenjang, jg.tingkat, u.id_fungsi, f.nama_fungsi
            ${havingClause}
            ORDER BY u.nama ASC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.status(200).json({
            success: true,
            message: 'Rekap prioritas per pegawai berhasil diambil',
            data: rows,
            total: Number(countRows[0]?.total || 0),
            page: currentPage,
            pageSize: limit,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching rekap prioritas per pegawai:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/prioritas-kompetensi/detail-pegawai?id_user=
 * Daftar kompetensi standar (beserta prioritasnya) milik satu pegawai.
 * Dipakai oleh modal daftar kompetensi pada tab Rekap per Pegawai.
 */
router.get('/detail-pegawai', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const { id_user, search = '' } = req.query;

    const idUser = parseInt(id_user, 10);

    if (!idUser) {
        return res.status(400).json({
            success: false,
            message: 'id_user wajib diisi'
        });
    }

    try {
        let ownId = null;
        if (!isAdmin) {
            ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            if (ownId !== idUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda hanya dapat melihat prioritas kompetensi milik sendiri'
                });
            }
        }

        const conditions = [
            'u.id = ?',
            'u.is_active = 1',
            '(mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)'
        ];
        const params = [idUser];

        const searchTerm = String(search || '').trim();
        if (searchTerm) {
            conditions.push('(mk.kode_kompetensi LIKE ? OR mk.nama_kompetensi LIKE ?)');
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        const [rows] = await db.query(`
            SELECT
                mk.id AS id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                GROUP_CONCAT(DISTINCT p.nama_peran ORDER BY p.nama_peran SEPARATOR ', ') AS nama_peran,
                MAX(km.is_mandatory) AS is_mandatory,
                MAX(ukp.prioritas) AS prioritas,
                MAX(ukp.diisi_oleh) AS diisi_oleh,
                DATE_FORMAT(MAX(ukp.updated_at), '%Y-%m-%d %H:%i:%s') AS prioritas_updated_at
            FROM kepegawaian.user u
            JOIN kepegawaian.kompetensi_mapping km
                ON km.id_jabatan = u.id_jabatan
               AND km.id_jenjang = u.id_jenjang
               AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
            JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
            JOIN kepegawaian.peran p ON p.id = km.id_peran
            LEFT JOIN kepegawaian.user_kompetensi_prioritas ukp
                ON ukp.id_user = u.id AND ukp.id_kompetensi = mk.id
            WHERE ${conditions.join(' AND ')}
            GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi
            ORDER BY mk.kode_kompetensi ASC
        `, params);

        const canEdit = isAdmin || idUser === ownId;

        const data = rows.map(row => ({
            ...row,
            id_user: idUser,
            can_edit: canEdit
        }));

        res.status(200).json({
            success: true,
            message: 'Daftar kompetensi pegawai berhasil diambil',
            data,
            count: data.length
        });
    } catch (error) {
        console.error('❌ Error fetching detail prioritas pegawai:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * PUT /api/prioritas-kompetensi
 * Simpan satu isian prioritas. Kirim prioritas null untuk menghapus isian.
 */
router.put('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    const { id_user, id_kompetensi, prioritas } = req.body || {};

    const idUser = parseInt(id_user, 10);
    const idKompetensi = parseInt(id_kompetensi, 10);

    if (!idUser || !idKompetensi) {
        return res.status(400).json({
            success: false,
            message: 'id_user dan id_kompetensi wajib diisi'
        });
    }

    const isClearing = prioritas === null || prioritas === undefined || prioritas === '';

    if (!isClearing && !PRIORITAS_VALUES.includes(prioritas)) {
        return res.status(400).json({
            success: false,
            message: `Prioritas harus salah satu dari: ${PRIORITAS_VALUES.join(', ')}`
        });
    }

    try {
        if (!isAdmin) {
            const ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            if (ownId !== idUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda hanya dapat mengisi prioritas kompetensi milik sendiri'
                });
            }
        }

        const isStandard = await isStandardKompetensi(idUser, idKompetensi);
        if (!isStandard) {
            return res.status(400).json({
                success: false,
                message: 'Kompetensi tersebut bukan bagian dari standar kompetensi pegawai'
            });
        }

        if (isClearing) {
            const [result] = await db.query(
                `DELETE FROM kepegawaian.user_kompetensi_prioritas
                 WHERE id_user = ? AND id_kompetensi = ?`,
                [idUser, idKompetensi]
            );

            return res.status(200).json({
                success: true,
                message: result.affectedRows > 0
                    ? 'Prioritas berhasil dihapus'
                    : 'Belum ada prioritas yang tersimpan',
                data: {
                    id_user: idUser,
                    id_kompetensi: idKompetensi,
                    prioritas: null
                }
            });
        }

        const pengisi = req.user?.name || username;

        await db.query(`
            INSERT INTO kepegawaian.user_kompetensi_prioritas
                (id_user, id_kompetensi, prioritas, diisi_oleh)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                prioritas = VALUES(prioritas),
                diisi_oleh = VALUES(diisi_oleh)
        `, [idUser, idKompetensi, prioritas, pengisi]);

        res.status(200).json({
            success: true,
            message: `Prioritas "${prioritas}" berhasil disimpan`,
            data: {
                id_user: idUser,
                id_kompetensi: idKompetensi,
                prioritas,
                diisi_oleh: pengisi
            }
        });
    } catch (error) {
        console.error('❌ Error saving prioritas kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * PUT /api/prioritas-kompetensi/bulk
 * Simpan prioritas untuk banyak baris sekaligus.
 * Body: { items: [{ id_user, id_kompetensi }], prioritas }
 */
router.put('/bulk', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    const { items, prioritas } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Pilih minimal satu baris untuk diisi prioritasnya'
        });
    }

    if (items.length > MAX_BULK_ITEMS) {
        return res.status(400).json({
            success: false,
            message: `Maksimal ${MAX_BULK_ITEMS} baris sekali simpan`
        });
    }

    if (!PRIORITAS_VALUES.includes(prioritas)) {
        return res.status(400).json({
            success: false,
            message: `Prioritas harus salah satu dari: ${PRIORITAS_VALUES.join(', ')}`
        });
    }

    // Normalisasi + buang duplikat
    const pairMap = new Map();
    for (const item of items) {
        const idUser = parseInt(item?.id_user, 10);
        const idKompetensi = parseInt(item?.id_kompetensi, 10);
        if (!idUser || !idKompetensi) continue;
        pairMap.set(`${idUser}-${idKompetensi}`, { idUser, idKompetensi });
    }

    const pairs = [...pairMap.values()];
    if (pairs.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Data baris yang dipilih tidak valid'
        });
    }

    let connection;
    try {
        if (!isAdmin) {
            const ownId = await getOwnPegawaiId(req);
            if (!ownId) {
                return res.status(404).json({
                    success: false,
                    message: 'Data pegawai Anda tidak ditemukan'
                });
            }
            if (pairs.some(p => p.idUser !== ownId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda hanya dapat mengisi prioritas kompetensi milik sendiri'
                });
            }
        }

        // Kelompokkan per pegawai agar validasi standar kompetensi cukup 1 query/pegawai
        const byUser = new Map();
        for (const pair of pairs) {
            if (!byUser.has(pair.idUser)) byUser.set(pair.idUser, []);
            byUser.get(pair.idUser).push(pair.idKompetensi);
        }

        let validCount = 0;
        const skipped = [];

        connection = await db.getConnection();
        await connection.beginTransaction();

        for (const [idUser, idKompetensiList] of byUser.entries()) {
            const [standardRows] = await connection.query(`
                SELECT DISTINCT km.id_kompetensi
                FROM kepegawaian.kompetensi_mapping km
                JOIN kepegawaian.master_kompetensi mk ON mk.id = km.id_kompetensi
                JOIN kepegawaian.peran p ON p.id = km.id_peran
                JOIN kepegawaian.user u ON u.id = ?
                WHERE km.id_jabatan = u.id_jabatan
                  AND km.id_jenjang = u.id_jenjang
                  AND FIND_IN_SET(km.id_peran, u.id_peran) > 0
                  AND (mk.id_fungsi = u.id_fungsi OR p.is_lintas_fungsi = 1)
                  AND km.id_kompetensi IN (${idKompetensiList.map(() => '?').join(',')})
            `, [idUser, ...idKompetensiList]);

            const allowed = new Set(standardRows.map(r => r.id_kompetensi));

            for (const idKompetensi of idKompetensiList) {
                if (!allowed.has(idKompetensi)) {
                    skipped.push({ id_user: idUser, id_kompetensi: idKompetensi });
                    continue;
                }

                await connection.query(`
                    INSERT INTO kepegawaian.user_kompetensi_prioritas
                        (id_user, id_kompetensi, prioritas, diisi_oleh)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        prioritas = VALUES(prioritas),
                        diisi_oleh = VALUES(diisi_oleh)
                `, [idUser, idKompetensi, prioritas, req.user?.name || username]);

                validCount += 1;
            }
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `${validCount} baris berhasil diisi prioritas "${prioritas}"` +
                (skipped.length > 0 ? `, ${skipped.length} baris dilewati (bukan standar kompetensi pegawai)` : ''),
            updated: validCount,
            skipped
        });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (rollbackError) {
                console.error('Gagal rollback:', rollbackError);
            }
        }

        console.error('❌ Error bulk prioritas kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
