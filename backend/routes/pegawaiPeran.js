// backend/routes/pegawaiPeran.js
// Endpoint untuk melihat pemenuhan kompetensi pegawai berdasarkan peran
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUsername } = require('../middleware/keycloakAuth');

/**
 * Helper: cek apakah pegawai sudah memenuhi SEMUA kompetensi wajib untuk sebuah peran
 */
async function cekPemenuhanPegawaiPerPeran(userId) {
    // Ambil semua user_kompetensi milik pegawai yang status-nya Lulus & Valid
    const [ukList] = await db.query(`
        SELECT uk.id, uk.id_kompetensi, uk.status, uk.hasil_verif,
               DATE_FORMAT(uk.tanggal_dipenuhi, '%Y-%m-%d') as tanggal_dipenuhi,
               uk.nilai, uk.keterangan
        FROM kepegawaian.user_kompetensi uk
        WHERE uk.id_user = ?
    `, [userId]);

    // Map id_kompetensi -> record yang dipenuhi
    const fulfilledMap = {};
    ukList.forEach(uk => {
        if (uk.status === 'Lulus' && uk.hasil_verif === 'Valid') {
            fulfilledMap[uk.id_kompetensi] = uk;
        }
    });

    return { ukList, fulfilledMap };
}

/**
 * GET /api/pegawai-peran/rekap
 * Rekapitulasi pemenuhan kompetensi untuk SEMUA peran.
 * Menampilkan jumlah pegawai per peran, berapa yang sudah memenuhi,
 * dan persentase pemenuhan.
 */
router.get('/rekap', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses rekap pemenuhan per peran`);

    try {
        // Semua peran + jumlah pegawai aktif yang memilikinya
        const [peranList] = await db.query(`
            SELECT
                p.id as peran_id,
                p.nama_peran,
                p.id_fungsi,
                f.nama_fungsi,
                p.is_lintas_fungsi,
                COUNT(DISTINCT u.id) as total_pegawai
            FROM kepegawaian.peran p
            JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            LEFT JOIN kepegawaian.user u ON FIND_IN_SET(p.id, u.id_peran) AND u.is_active = 1
            GROUP BY p.id, p.nama_peran, p.id_fungsi, f.nama_fungsi, p.is_lintas_fungsi
            ORDER BY f.nama_fungsi, p.nama_peran
        `);

        const result = [];

        for (const peran of peranList) {
            // Jumlah kompetensi wajib untuk peran ini
            const [kompetensi] = await db.query(`
                SELECT id FROM kepegawaian.master_kompetensi WHERE id_peran = ?
            `, [peran.peran_id]);
            const requiredCount = kompetensi.length;

            let sudahMemenuhi = 0;

            if (requiredCount > 0 && peran.total_pegawai > 0) {
                // Ambil semua pegawai yang punya peran ini
                const [pegawaiList] = await db.query(`
                    SELECT u.id
                    FROM kepegawaian.user u
                    WHERE u.is_active = 1 AND FIND_IN_SET(?, u.id_peran)
                `, [peran.peran_id]);

                for (const pegawai of pegawaiList) {
                    const { fulfilledMap } = await cekPemenuhanPegawaiPerPeran(pegawai.id);
                    const fulfilledCount = kompetensi.filter(k => fulfilledMap[k.id]).length;
                    if (fulfilledCount >= requiredCount) {
                        sudahMemenuhi++;
                    }
                }
            }

            const total = Number(peran.total_pegawai) || 0;
            result.push({
                peran_id: peran.peran_id,
                nama_peran: peran.nama_peran,
                id_fungsi: peran.id_fungsi,
                nama_fungsi: peran.nama_fungsi,
                is_lintas_fungsi: peran.is_lintas_fungsi,
                jumlah_kompetensi: requiredCount,
                total_pegawai: total,
                sudah_memenuhi: sudahMemenuhi,
                belum_memenuhi: Math.max(0, total - sudahMemenuhi),
                persentase: total > 0 ? Math.round((sudahMemenuhi / total) * 100) : 0
            });
        }

        // Statistik keseluruhan
        const totalPegawai = result.reduce((sum, r) => sum + r.total_pegawai, 0);
        const totalSudah = result.reduce((sum, r) => sum + r.sudah_memenuhi, 0);

        res.status(200).json({
            success: true,
            message: 'Rekap pemenuhan per peran berhasil diambil',
            data: result,
            statistik: {
                total_peran: result.length,
                total_pegawai: totalPegawai,
                total_sudah_memenuhi: totalSudah,
                persentase_keseluruhan: totalPegawai > 0 ? Math.round((totalSudah / totalPegawai) * 100) : 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching rekap peran:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/pegawai-peran/:peranId/pemenuhan
 * Detail pemenuhan pegawai untuk SATU peran tertentu.
 * Menampilkan daftar pegawai yang memiliki peran tersebut beserta
 * status pemenuhan terhadap seluruh kompetensi wajib peran.
 *
 * Query params:
 *  - search      : pencarian berdasarkan NIP / nama / email
 *  - id_fungsi   : filter fungsi
 */
router.get('/:peranId/pemenuhan', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { peranId } = req.params;
    const { search, id_fungsi } = req.query;

    console.log(`📊 ${username} mengakses pemenuhan peran ID: ${peranId}`);

    try {
        // 1. Informasi peran
        const [peranInfo] = await db.query(`
            SELECT
                p.id,
                p.nama_peran,
                p.id_fungsi,
                f.nama_fungsi,
                p.is_lintas_fungsi
            FROM kepegawaian.peran p
            JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            WHERE p.id = ?
        `, [peranId]);

        if (peranInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peran tidak ditemukan'
            });
        }

        // 2. Kompetensi wajib untuk peran ini
        const [kompetensiWajib] = await db.query(`
            SELECT
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi as kompetensi_fungsi
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE mk.id_peran = ?
            ORDER BY mk.kode_kompetensi
        `, [peranId]);

        // 3. Pegawai yang memiliki peran ini
        let pegawaiQuery = `
            SELECT
                u.id,
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
                ) as daftar_peran
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            WHERE u.is_active = 1 AND FIND_IN_SET(?, u.id_peran)
        `;
        const params = [peranId];
        const conditions = [];

        if (id_fungsi && id_fungsi !== '') {
            conditions.push('u.id_fungsi = ?');
            params.push(parseInt(id_fungsi));
        }

        if (search && search !== '') {
            conditions.push('(u.nip LIKE ? OR u.nama LIKE ? OR u.email LIKE ? OR j.nama_jabatan LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (conditions.length > 0) {
            pegawaiQuery += ` AND ${conditions.join(' AND ')}`;
        }

        pegawaiQuery += ` ORDER BY u.nama ASC`;

        const [pegawaiList] = await db.query(pegawaiQuery, params);

        // 4. Hitung pemenuhan setiap pegawai
        const pegawaiWithStatus = await Promise.all(pegawaiList.map(async (pegawai) => {
            const { fulfilledMap } = await cekPemenuhanPegawaiPerPeran(pegawai.id);

            const kompetensiDetail = kompetensiWajib.map(k => {
                const uk = fulfilledMap[k.id];
                return {
                    id: k.id,
                    kode_kompetensi: k.kode_kompetensi,
                    nama_kompetensi: k.nama_kompetensi,
                    kompetensi_fungsi: k.kompetensi_fungsi,
                    dipenuhi: !!uk,
                    status: uk?.status || null,
                    hasil_verif: uk?.hasil_verif || null,
                    tanggal_dipenuhi: uk?.tanggal_dipenuhi || null,
                    nilai: uk?.nilai || null,
                    keterangan: uk?.keterangan || null
                };
            });

            const jumlahDipenuhi = kompetensiDetail.filter(k => k.dipenuhi).length;
            const jumlahKompetensi = kompetensiWajib.length;

            return {
                ...pegawai,
                jumlah_kompetensi: jumlahKompetensi,
                jumlah_dipenuhi: jumlahDipenuhi,
                sudah_memenuhi: jumlahKompetensi > 0 && jumlahDipenuhi >= jumlahKompetensi,
                kompetensi_detail: kompetensiDetail
            };
        }));

        const total = pegawaiWithStatus.length;
        const sudahMemenuhi = pegawaiWithStatus.filter(p => p.sudah_memenuhi).length;

        res.status(200).json({
            success: true,
            message: 'Data pemenuhan pegawai per peran berhasil diambil',
            data: {
                peran: peranInfo[0],
                kompetensi_wajib: kompetensiWajib,
                statistik: {
                    total_pegawai: total,
                    sudah_memenuhi: sudahMemenuhi,
                    belum_memenuhi: Math.max(0, total - sudahMemenuhi),
                    persentase: total > 0 ? Math.round((sudahMemenuhi / total) * 100) : 0
                },
                pegawai: pegawaiWithStatus
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching pemenuhan peran:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

module.exports = router;
