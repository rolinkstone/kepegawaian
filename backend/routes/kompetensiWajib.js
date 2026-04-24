// backend/routes/kompetensiWajib.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// ========== HELPER FUNCTIONS ==========

function getUserNipFromToken(user) {
    if (!user) return null;
    return user.preferred_username || user.username;
}

function isAdminTambunRaya(user) {
    if (!user) return false;
    const roles = user.extractedRoles || user.roles || [];
    return roles.includes('admin_tambun_raya');
}

// ========== KOMPETENSI WAJIB CRUD ==========

/**
 * GET /api/kompetensi-wajib
 * Mendapatkan semua kompetensi wajib (bisa diakses semua user)
 */
router.get('/', async (req, res) => {
    const { tahun } = req.query;
    
    try {
        let query = `
            SELECT 
                kw.id,
                kw.id_kompetensi,
                kw.nama_kompetensi,
                kw.tahun,
                kw.created_at,
                kw.created_by,
                mk.kode_kompetensi,
                mk.nama_kompetensi as kompetensi_original,
                mk.id_peran as kompetensi_peran_id,
                f.nama_fungsi
            FROM kepegawaian.kompetensi_wajib kw
            JOIN kepegawaian.master_kompetensi mk ON kw.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (tahun) {
            query += ` AND kw.tahun = ?`;
            params.push(tahun);
        }
        
        query += ` ORDER BY kw.tahun DESC, mk.kode_kompetensi`;
        
        const [rows] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-wajib/tahun/:tahun
 * Mendapatkan kompetensi wajib berdasarkan tahun
 */
router.get('/tahun/:tahun', async (req, res) => {
    const { tahun } = req.params;
    
    try {
        const [rows] = await db.query(`
            SELECT 
                kw.id,
                kw.id_kompetensi,
                kw.nama_kompetensi,
                kw.tahun,
                mk.kode_kompetensi,
                mk.nama_kompetensi as kompetensi_original,
                mk.id_peran as kompetensi_peran_id,
                f.nama_fungsi
            FROM kepegawaian.kompetensi_wajib kw
            JOIN kepegawaian.master_kompetensi mk ON kw.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE kw.tahun = ?
            ORDER BY mk.kode_kompetensi
        `, [tahun]);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-wajib/tahun-options
 * Mendapatkan daftar tahun yang tersedia
 */
router.get('/tahun-options', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT tahun 
            FROM kepegawaian.kompetensi_wajib 
            ORDER BY tahun DESC
        `);
        
        const tahunOptions = rows.map(row => row.tahun);
        
        res.status(200).json({
            success: true,
            data: tahunOptions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * POST /api/kompetensi-wajib
 * Menambah kompetensi wajib baru (hanya admin)
 */
router.post('/', async (req, res) => {
    // Hanya admin yang bisa menambah kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menambah kompetensi wajib'
        });
    }
    
    const userNip = getUserNipFromToken(req.user);
    const { id_kompetensi, nama_kompetensi, tahun } = req.body;
    
    console.log('📥 POST /kompetensi-wajib - User:', userNip);
    console.log('📥 Request body:', req.body);
    
    // Validasi
    if (!id_kompetensi || !tahun) {
        return res.status(400).json({
            success: false,
            message: 'Kompetensi dan tahun harus diisi'
        });
    }
    
    // Validasi tahun (4 digit)
    if (!/^\d{4}$/.test(tahun)) {
        return res.status(400).json({
            success: false,
            message: 'Tahun harus berupa 4 digit angka'
        });
    }
    
    try {
        // Cek duplikasi
        const [existing] = await db.query(
            'SELECT id FROM kepegawaian.kompetensi_wajib WHERE id_kompetensi = ? AND tahun = ?',
            [id_kompetensi, tahun]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Kompetensi sudah ditetapkan sebagai wajib untuk tahun ini'
            });
        }
        
        // Insert kompetensi wajib
        const [result] = await db.query(`
            INSERT INTO kepegawaian.kompetensi_wajib 
            (id_kompetensi, nama_kompetensi, tahun, created_by)
            VALUES (?, ?, ?, ?)
        `, [id_kompetensi, nama_kompetensi, tahun, userNip]);
        
        console.log(`✅ ${userNip} menambah kompetensi wajib: ${id_kompetensi} untuk tahun ${tahun}`);
        
        res.status(201).json({
            success: true,
            message: 'Kompetensi wajib berhasil ditambahkan',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error detail:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kompetensi sudah ditetapkan sebagai wajib untuk tahun ini'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server: ' + error.message,
            error: error.message
        });
    }
});

/**
 * POST /api/kompetensi-wajib/bulk
 * Menambah multiple kompetensi wajib sekaligus (hanya admin)
 */
router.post('/bulk', async (req, res) => {
    // Hanya admin yang bisa menambah kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menambah kompetensi wajib'
        });
    }
    
    const userNip = getUserNipFromToken(req.user);
    const { kompetensi_ids, tahun } = req.body;
    
    console.log('📥 POST /kompetensi-wajib/bulk - User:', userNip);
    console.log('📥 Request body:', req.body);
    
    // Validasi
    if (!kompetensi_ids || !kompetensi_ids.length || !tahun) {
        return res.status(400).json({
            success: false,
            message: 'Kompetensi dan tahun harus diisi'
        });
    }
    
    // Validasi tahun (4 digit)
    if (!/^\d{4}$/.test(tahun)) {
        return res.status(400).json({
            success: false,
            message: 'Tahun harus berupa 4 digit angka'
        });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Ambil data kompetensi
        const [kompetensiList] = await connection.query(
            'SELECT id, kode_kompetensi, nama_kompetensi FROM kepegawaian.master_kompetensi WHERE id IN (?)',
            [kompetensi_ids]
        );
        
        const kompetensiMap = new Map();
        kompetensiList.forEach(k => kompetensiMap.set(k.id, k));
        
        let inserted = 0;
        let skipped = 0;
        
        for (const idKompetensi of kompetensi_ids) {
            const kompetensi = kompetensiMap.get(idKompetensi);
            if (!kompetensi) continue;
            
            try {
                await connection.query(`
                    INSERT INTO kepegawaian.kompetensi_wajib 
                    (id_kompetensi, nama_kompetensi, tahun, created_by)
                    VALUES (?, ?, ?, ?)
                `, [idKompetensi, kompetensi.nama_kompetensi, tahun, userNip]);
                inserted++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    skipped++;
                    console.log(`⚠️ Duplikat: ${kompetensi.kode_kompetensi} untuk tahun ${tahun}`);
                } else {
                    throw err;
                }
            }
        }
        
        await connection.commit();
        
        console.log(`✅ ${userNip} menambah ${inserted} kompetensi wajib untuk tahun ${tahun} (skipped: ${skipped})`);
        
        res.status(201).json({
            success: true,
            message: `${inserted} kompetensi wajib berhasil ditambahkan${skipped > 0 ? ` (${skipped} duplikat diabaikan)` : ''}`,
            data: { inserted, skipped }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error detail:', error);
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server: ' + error.message,
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /api/kompetensi-wajib/:id
 * Menghapus kompetensi wajib (hanya admin)
 */
router.delete('/:id', async (req, res) => {
    // Hanya admin yang bisa menghapus kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menghapus kompetensi wajib'
        });
    }
    
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    
    try {
        // Cek apakah data ada
        const [existing] = await db.query(
            'SELECT * FROM kepegawaian.kompetensi_wajib WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data kompetensi wajib tidak ditemukan'
            });
        }
        
        await db.query('DELETE FROM kepegawaian.kompetensi_wajib WHERE id = ?', [id]);
        
        console.log(`✅ ${userNip} menghapus kompetensi wajib ID: ${id}`);
        
        res.status(200).json({
            success: true,
            message: 'Kompetensi wajib berhasil dihapus'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * DELETE /api/kompetensi-wajib/tahun/:tahun
 * Menghapus semua kompetensi wajib untuk tahun tertentu (hanya admin)
 */
router.delete('/tahun/:tahun', async (req, res) => {
    // Hanya admin yang bisa menghapus kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menghapus kompetensi wajib'
        });
    }
    
    const { tahun } = req.params;
    const userNip = getUserNipFromToken(req.user);
    
    try {
        const [result] = await db.query(
            'DELETE FROM kepegawaian.kompetensi_wajib WHERE tahun = ?',
            [tahun]
        );
        
        console.log(`✅ ${userNip} menghapus ${result.affectedRows} kompetensi wajib untuk tahun ${tahun}`);
        
        res.status(200).json({
            success: true,
            message: `${result.affectedRows} kompetensi wajib untuk tahun ${tahun} berhasil dihapus`
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-wajib/options/kompetensi
 * Mendapatkan daftar kompetensi yang belum menjadi wajib untuk tahun tertentu
 */
router.get('/options/kompetensi', async (req, res) => {
    const { tahun } = req.query;
    
    try {
        let query = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.id_peran,
                f.nama_fungsi
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
        `;
        
        const params = [];
        
        if (tahun) {
            query += `
                WHERE mk.id NOT IN (
                    SELECT id_kompetensi 
                    FROM kepegawaian.kompetensi_wajib 
                    WHERE tahun = ?
                )
            `;
            params.push(tahun);
        }
        
        query += ` ORDER BY mk.kode_kompetensi`;
        
        const [rows] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

// ========== ENDPOINT BARU UNTUK MENDAPATKAN PEGAWAI BERDASARKAN PERAN KOMPETENSI ==========

/**
 * GET /api/kompetensi-wajib/:id/pegawai-belum-memenuhi
 * Mendapatkan daftar pegawai yang belum memenuhi kompetensi tertentu
 * Hanya menampilkan pegawai yang memiliki peran yang sesuai dengan kompetensi
 */
router.get('/:id/pegawai-belum-memenuhi', async (req, res) => {
    const { id } = req.params;
    const { search, id_fungsi } = req.query;
    
    console.log(`🔍 Mencari pegawai yang belum memenuhi kompetensi ID: ${id}`);
    
    try {
        // 1. Ambil informasi kompetensi untuk mengetahui peran yang dibutuhkan
        const [kompetensiInfo] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.id_peran as required_peran_id,
                p.nama_peran as required_peran_nama,
                p.id_fungsi as required_peran_fungsi_id,
                f.nama_fungsi as required_peran_fungsi
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.peran p ON mk.id_peran = p.id
            LEFT JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            WHERE mk.id = ?
        `, [id]);
        
        if (kompetensiInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        const requiredPeranId = kompetensiInfo[0].required_peran_id;
        const requiredPeranNama = kompetensiInfo[0].required_peran_nama;
        
        console.log(`📌 Kompetensi ${kompetensiInfo[0].kode_kompetensi} membutuhkan peran: ${requiredPeranNama} (ID: ${requiredPeranId})`);
        
        // 2. Cari pegawai yang memiliki peran tersebut
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
                u.id_peran,
                (
                    SELECT GROUP_CONCAT(p.nama_peran SEPARATOR ', ')
                    FROM kepegawaian.peran p
                    WHERE FIND_IN_SET(p.id, u.id_peran)
                ) as daftar_peran,
                (
                    SELECT GROUP_CONCAT(p.id) 
                    FROM kepegawaian.peran p
                    WHERE FIND_IN_SET(p.id, u.id_peran)
                ) as peran_ids
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            WHERE u.is_active = 1
        `;
        
        const params = [];
        const conditions = [];
        
        // Filter berdasarkan peran yang dibutuhkan
        if (requiredPeranId) {
            conditions.push(`FIND_IN_SET(?, u.id_peran)`);
            params.push(requiredPeranId);
        }
        
        // Filter berdasarkan fungsi
        if (id_fungsi && id_fungsi !== '') {
            conditions.push(`u.id_fungsi = ?`);
            params.push(parseInt(id_fungsi));
        }
        
        // Filter pencarian
        if (search && search !== '') {
            conditions.push(`(u.nip LIKE ? OR u.nama LIKE ? OR u.email LIKE ? OR f.nama_fungsi LIKE ?)`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }
        
        if (conditions.length > 0) {
            pegawaiQuery += ` AND ${conditions.join(' AND ')}`;
        }
        
        pegawaiQuery += ` ORDER BY u.nama ASC`;
        
        console.log('📝 Query pegawai:', pegawaiQuery);
        console.log('📝 Params:', params);
        
        const [pegawaiList] = await db.query(pegawaiQuery, params);
        
        console.log(`📊 Ditemukan ${pegawaiList.length} pegawai dengan peran ${requiredPeranNama}`);
        
        // 3. Untuk setiap pegawai, cek apakah sudah memiliki kompetensi ini
        const pegawaiWithStatus = await Promise.all(
            pegawaiList.map(async (pegawai) => {
                // Cek kompetensi pegawai
                const [kompetensiPegawai] = await db.query(`
                    SELECT 
                        uk.id,
                        uk.status,
                        uk.hasil_verif,
                        uk.tanggal_dipenuhi,
                        uk.nilai,
                        uk.keterangan,
                        uk.verified_by,
                        uk.verified_at,
                        v.nama as verified_by_nama
                    FROM kepegawaian.user_kompetensi uk
                    LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
                    WHERE uk.id_user = ? AND uk.id_kompetensi = ?
                `, [pegawai.id, id]);
                
                let sudahMemenuhi = false;
                let detail = null;
                
                if (kompetensiPegawai.length > 0) {
                    detail = kompetensiPegawai[0];
                    // Dianggap MEMENUHI jika: status Lulus DAN hasil_verif = 'Valid'
                    sudahMemenuhi = (detail.status === 'Lulus' && detail.hasil_verif === 'Valid');
                }
                
                return {
                    ...pegawai,
                    sudah_memenuhi: sudahMemenuhi,
                    kompetensi_detail: detail,
                    daftar_peran_array: pegawai.daftar_peran ? pegawai.daftar_peran.split(', ') : [],
                    peran_ids_array: pegawai.peran_ids ? pegawai.peran_ids.split(',').map(p => parseInt(p)) : []
                };
            })
        );
        
        // Filter hanya yang belum memenuhi
        const belumMemenuhi = pegawaiWithStatus.filter(p => !p.sudah_memenuhi);
        
        // Hitung statistik
        const totalPegawai = pegawaiList.length;
        const sudahMemenuhiCount = pegawaiWithStatus.filter(p => p.sudah_memenuhi).length;
        const belumMemenuhiCount = belumMemenuhi.length;
        
        // Kelompokkan berdasarkan fungsi
        const fungsiGroups = {};
        belumMemenuhi.forEach(p => {
            if (!fungsiGroups[p.nama_fungsi]) {
                fungsiGroups[p.nama_fungsi] = [];
            }
            fungsiGroups[p.nama_fungsi].push(p);
        });
        
        const fungsiOptions = Object.keys(fungsiGroups);
        
        console.log(`📊 Statistik: Total=${totalPegawai}, Sudah=${sudahMemenuhiCount}, Belum=${belumMemenuhiCount}`);
        
        res.status(200).json({
            success: true,
            message: 'Data pegawai berhasil diambil',
            data: {
                kompetensi: {
                    id: kompetensiInfo[0].id,
                    kode: kompetensiInfo[0].kode_kompetensi,
                    nama: kompetensiInfo[0].nama_kompetensi,
                    required_peran_id: requiredPeranId,
                    required_peran_nama: requiredPeranNama,
                    required_peran_fungsi: kompetensiInfo[0].required_peran_fungsi
                },
                statistik: {
                    total_pegawai_dengan_peran: totalPegawai,
                    sudah_memenuhi: sudahMemenuhiCount,
                    belum_memenuhi: belumMemenuhiCount,
                    persentase_pemenuhan: totalPegawai > 0 ? Math.round((sudahMemenuhiCount / totalPegawai) * 100) : 0
                },
                pegawai: belumMemenuhi,
                fungsi_options: fungsiOptions,
                fungsi_groups: fungsiGroups
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-wajib/:id/statistik-pemenuhan
 * Mendapatkan statistik pemenuhan kompetensi berdasarkan peran
 */
router.get('/:id/statistik-pemenuhan', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Ambil informasi kompetensi
        const [kompetensiInfo] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.id_peran as required_peran_id,
                p.nama_peran as required_peran_nama
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.peran p ON mk.id_peran = p.id
            WHERE mk.id = ?
        `, [id]);
        
        if (kompetensiInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        const requiredPeranId = kompetensiInfo[0].required_peran_id;
        
        // Hitung total pegawai dengan peran tersebut
        let totalQuery = `
            SELECT COUNT(*) as total 
            FROM kepegawaian.user u
            WHERE u.is_active = 1
        `;
        const totalParams = [];
        
        if (requiredPeranId) {
            totalQuery += ` AND FIND_IN_SET(?, u.id_peran)`;
            totalParams.push(requiredPeranId);
        }
        
        const [totalResult] = await db.query(totalQuery, totalParams);
        const totalPegawai = totalResult[0]?.total || 0;
        
        // Hitung pegawai yang sudah memenuhi
        const sudahQuery = `
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Lulus' 
                AND uk.hasil_verif = 'Valid'
                AND u.is_active = 1
                ${requiredPeranId ? 'AND FIND_IN_SET(?, u.id_peran)' : ''}
        `;
        
        const sudahParams = [id];
        if (requiredPeranId) sudahParams.push(requiredPeranId);
        
        const [sudahResult] = await db.query(sudahQuery, sudahParams);
        const sudahMemenuhi = sudahResult[0]?.total || 0;
        
        // Hitung pegawai yang menunggu verifikasi
        const menungguQuery = `
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Lulus' 
                AND (uk.hasil_verif IS NULL OR uk.hasil_verif != 'Valid')
                AND u.is_active = 1
                ${requiredPeranId ? 'AND FIND_IN_SET(?, u.id_peran)' : ''}
        `;
        
        const menungguParams = [id];
        if (requiredPeranId) menungguParams.push(requiredPeranId);
        
        const [menungguResult] = await db.query(menungguQuery, menungguParams);
        const menungguVerifikasi = menungguResult[0]?.total || 0;
        
        // Hitung pegawai yang tidak lulus
        const tidakLulusQuery = `
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Tidak Lulus'
                AND u.is_active = 1
                ${requiredPeranId ? 'AND FIND_IN_SET(?, u.id_peran)' : ''}
        `;
        
        const tidakLulusParams = [id];
        if (requiredPeranId) tidakLulusParams.push(requiredPeranId);
        
        const [tidakLulusResult] = await db.query(tidakLulusQuery, tidakLulusParams);
        const tidakLulus = tidakLulusResult[0]?.total || 0;
        
        const belumMengikuti = totalPegawai - sudahMemenuhi - menungguVerifikasi - tidakLulus;
        
        res.status(200).json({
            success: true,
            data: {
                kompetensi: kompetensiInfo[0],
                total_pegawai_dengan_peran: totalPegawai,
                sudah_memenuhi: sudahMemenuhi,
                menunggu_verifikasi: menungguVerifikasi,
                tidak_lulus: tidakLulus,
                belum_mengikuti: belumMengikuti > 0 ? belumMengikuti : 0,
                persentase_pemenuhan: totalPegawai > 0 ? Math.round((sudahMemenuhi / totalPegawai) * 100) : 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/kompetensi-wajib/:id/peran-info
 * Mendapatkan informasi peran yang dibutuhkan untuk kompetensi
 */
router.get('/:id/peran-info', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [kompetensiInfo] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.id_peran as required_peran_id,
                p.nama_peran as required_peran_nama,
                p.id_fungsi as peran_fungsi_id,
                f.nama_fungsi as peran_fungsi_nama
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.peran p ON mk.id_peran = p.id
            LEFT JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            WHERE mk.id = ?
        `, [id]);
        
        if (kompetensiInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            data: kompetensiInfo[0]
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

module.exports = router;