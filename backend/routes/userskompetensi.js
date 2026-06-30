// backend/routes/userskompetensi.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');
const { getUserNipFromToken, isAdminTambunRaya, isKatim } = require('../utils/keycloakHelpers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== KONFIGURASI MULTER UNTUK UPLOAD FILE ==========

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Folder uploads dibuat: ${uploadDir}`);
}

// Konfigurasi storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sertifikat-' + uniqueSuffix + ext);
    }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file PDF, JPG, atau PNG yang diperbolehkan'), false);
    }
};

// Konfigurasi upload
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ========== CRUD USER KOMPETENSI ==========

/**
 * GET /api/userskompetensi
 * Mendapatkan semua data user kompetensi
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    console.log(`📊 ${username} (${isAdmin ? 'Admin' : isKatimRole ? 'Katim' : 'User'}) mengakses data user kompetensi`);

    try {
        let query = `
            SELECT 
                uk.id,
                uk.id_user,
                u.nip as user_nip,
                u.nama as user_nama,
                f.nama_fungsi as user_fungsi,
                f.id as user_fungsi_id,
                uk.id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                DATE_FORMAT(uk.tanggal_dipenuhi, '%Y-%m-%d') as tanggal_dipenuhi,
                uk.bukti,
                uk.nilai,
                uk.status,
                uk.hasil_verif,
                uk.keterangan,
                uk.verified_by,
                v.nama as verified_by_nama,
                DATE_FORMAT(uk.verified_at, '%Y-%m-%d %H:%i:%s') as verified_at,
                DATE_FORMAT(uk.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
        `;
        
        const params = [];
        
        // Filter berdasarkan role
        if (!isAdmin && !isKatimRole) {
            // User biasa: hanya melihat data sendiri
            const cleanNip = String(userNip || '').replace(/\s/g, '');
            query += ` WHERE REPLACE(u.nip, ' ', '') = ?`;
            params.push(cleanNip);
        }
        
        query += ` ORDER BY uk.created_at DESC`;
        
        console.log('📝 Query:', query);
        console.log('📝 Params:', params);
        
        const [rows] = await db.query(query, params);
        
        console.log(`✅ Data berhasil diambil, ${rows.length} records untuk user ${username}`);
        
        res.status(200).json({
            success: true,
            message: 'Data user kompetensi berhasil diambil',
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('❌ Error fetching user kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/userskompetensi/:id
 * Mendapatkan detail user kompetensi by ID
 */
router.get('/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    console.log(`📊 Mengakses detail user kompetensi ID: ${id}`);

    try {
        const query = `
            SELECT 
                uk.*,
                u.nip as user_nip,
                u.nama as user_nama,
                u.email as user_email,
                f.nama_fungsi as user_fungsi,
                j.nama_jabatan as user_jabatan,
                jg.nama_jenjang as user_jenjang,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi as kompetensi_deskripsi,
                mk.id_fungsi as kompetensi_fungsi_id,
                kf.nama_fungsi as kompetensi_fungsi,
                v.nama as verified_by_nama
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.fungsi kf ON mk.id_fungsi = kf.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
            WHERE uk.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        console.log('📤 Data detail dikirim:', {
            id: rows[0].id,
            hasil_verif: rows[0].hasil_verif,
            keterangan: rows[0].keterangan,
            verified_by: rows[0].verified_by,
            verified_at: rows[0].verified_at
        });

        res.status(200).json({
            success: true,
            message: 'Detail user kompetensi berhasil diambil',
            data: rows[0]
        });
    } catch (error) {
        console.error('❌ Error fetching detail:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});


// backend/routes/userskompetensi.js

// Tambahkan endpoint ini setelah route GET /user/:userId

/**
 * GET /api/userskompetensi/cek/:userId/:kompetensiId
 * Cek apakah user memiliki kompetensi tertentu (dengan status Lulus dan hasil_verif Valid)
 */
router.get('/cek/:userId/:kompetensiId', keycloakAuth, async (req, res) => {
    const { userId, kompetensiId } = req.params;
    console.log(`🔍 Cek kompetensi user ${userId} untuk kompetensi ID: ${kompetensiId}`);

    try {
        const query = `
            SELECT 
                uk.id,
                uk.id_user,
                uk.id_kompetensi,
                uk.tanggal_dipenuhi,
                uk.bukti,
                uk.nilai,
                uk.status,
                uk.hasil_verif,
                uk.keterangan,
                uk.verified_by,
                uk.verified_at,
                mk.kode_kompetensi,
                mk.nama_kompetensi
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            WHERE uk.id_user = ? AND uk.id_kompetensi = ?
        `;

        const [rows] = await db.query(query, [userId, kompetensiId]);
        
        let sudahMemenuhi = false;
        let detail = null;
        
        if (rows.length > 0) {
            detail = rows[0];
            // Cek apakah kompetensi dianggap MEMENUHI:
            // 1. Status = 'Lulus'
            // 2. hasil_verif = 'Valid'
            sudahMemenuhi = (detail.status === 'Lulus' && detail.hasil_verif === 'Valid');
        }
        
        console.log(`📊 User ${userId} - Kompetensi ${kompetensiId}: ${sudahMemenuhi ? 'SUDAH MEMENUHI' : 'BELUM MEMENUHI'}`);
        
        res.status(200).json({
            success: true,
            data: {
                sudah_memenuhi: sudahMemenuhi,
                detail: detail ? {
                    id: detail.id,
                    status: detail.status,
                    hasil_verif: detail.hasil_verif,
                    tanggal_dipenuhi: detail.tanggal_dipenuhi,
                    nilai: detail.nilai,
                    keterangan: detail.keterangan,
                    verified_by: detail.verified_by,
                    verified_at: detail.verified_at
                } : null
            }
        });
        
    } catch (error) {
        console.error('❌ Error checking user competency:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/userskompetensi/check-bulk
 * Cek multiple user untuk kompetensi tertentu (optimized)
 */
router.get('/check-bulk', keycloakAuth, async (req, res) => {
    const { kompetensiId, userIds } = req.query;
    
    if (!kompetensiId) {
        return res.status(400).json({
            success: false,
            message: 'kompetensiId harus diisi'
        });
    }
    
    let userIdsArray = [];
    if (userIds) {
        userIdsArray = userIds.split(',').map(id => parseInt(id));
    }
    
    console.log(`🔍 Bulk check kompetensi ${kompetensiId} untuk ${userIdsArray.length} user`);
    
    try {
        let query = `
            SELECT 
                uk.id_user,
                uk.id_kompetensi,
                uk.status,
                uk.hasil_verif,
                uk.tanggal_dipenuhi,
                uk.nilai,
                uk.keterangan,
                uk.verified_by,
                uk.verified_at
            FROM kepegawaian.user_kompetensi uk
            WHERE uk.id_kompetensi = ?
        `;
        
        const params = [kompetensiId];
        
        if (userIdsArray.length > 0) {
            query += ` AND uk.id_user IN (${userIdsArray.map(() => '?').join(',')})`;
            params.push(...userIdsArray);
        }
        
        const [rows] = await db.query(query, params);
        
        // Buat map hasil
        const resultMap = {};
        rows.forEach(row => {
            const sudahMemenuhi = (row.status === 'Lulus' && row.hasil_verif === 'Valid');
            resultMap[row.id_user] = {
                sudah_memenuhi: sudahMemenuhi,
                status: row.status,
                hasil_verif: row.hasil_verif,
                tanggal_dipenuhi: row.tanggal_dipenuhi,
                nilai: row.nilai,
                keterangan: row.keterangan
            };
        });
        
        res.status(200).json({
            success: true,
            data: resultMap
        });
        
    } catch (error) {
        console.error('❌ Error bulk checking competencies:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * GET /api/userskompetensi/statistics/kompetensi/:kompetensiId
 * Statistik pemenuhan kompetensi untuk kompetensi tertentu
 */
router.get('/statistics/kompetensi/:kompetensiId', keycloakAuth, async (req, res) => {
    const { kompetensiId } = req.params;
    
    try {
        // Total pegawai aktif
        const [totalPegawai] = await db.query(`
            SELECT COUNT(*) as total 
            FROM kepegawaian.user 
            WHERE is_active = 1
        `);
        
        // Pegawai yang sudah memenuhi kompetensi ini (Lulus + Valid)
        const [sudahMemenuhi] = await db.query(`
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Lulus' 
                AND uk.hasil_verif = 'Valid'
        `, [kompetensiId]);
        
        // Pegawai yang memiliki data tapi belum valid
        const [menungguVerifikasi] = await db.query(`
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Lulus' 
                AND (uk.hasil_verif IS NULL OR uk.hasil_verif != 'Valid')
        `, [kompetensiId]);
        
        // Pegawai yang tidak lulus
        const [tidakLulus] = await db.query(`
            SELECT COUNT(DISTINCT uk.id_user) as total
            FROM kepegawaian.user_kompetensi uk
            WHERE uk.id_kompetensi = ? 
                AND uk.status = 'Tidak Lulus'
        `, [kompetensiId]);
        
        const total = totalPegawai[0]?.total || 0;
        const sudah = sudahMemenuhi[0]?.total || 0;
        const menunggu = menungguVerifikasi[0]?.total || 0;
        const tidak = tidakLulus[0]?.total || 0;
        const belum = total - sudah - menunggu - tidak;
        
        res.status(200).json({
            success: true,
            data: {
                total_pegawai: total,
                sudah_memenuhi: sudah,
                menunggu_verifikasi: menunggu,
                tidak_lulus: tidak,
                belum_mengikuti: belum > 0 ? belum : 0,
                persentase: total > 0 ? Math.round((sudah / total) * 100) : 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting competency statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});
/**
 * GET /api/userskompetensi/user/:userId
 * Mendapatkan kompetensi untuk user tertentu
 */
// backend/routes/userskompetensi.js - Perbaiki route GET /user/:userId

/**
 * GET /api/userskompetensi/user/:userId
 * Mendapatkan kompetensi untuk user tertentu (dengan informasi verifikasi lengkap)
 */
router.get('/user/:userId', keycloakAuth, async (req, res) => {
    const { userId } = req.params;
    console.log(`📊 Mengakses kompetensi untuk user ID: ${userId}`);

    try {
        const query = `
            SELECT 
                uk.id,
                uk.id_user,
                uk.id_kompetensi,
                DATE_FORMAT(uk.tanggal_dipenuhi, '%Y-%m-%d') as tanggal_dipenuhi,
                uk.bukti,
                uk.nilai,
                uk.status,
                uk.hasil_verif,
                uk.keterangan,
                uk.verified_by,
                DATE_FORMAT(uk.verified_at, '%Y-%m-%d %H:%i:%s') as verified_at,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                f.nama_fungsi as kompetensi_fungsi,
                v.nama as verified_by_nama
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
            WHERE uk.id_user = ?
            ORDER BY mk.kode_kompetensi
        `;

        const [rows] = await db.query(query, [userId]);
        
        console.log(`📊 Data kompetensi user ${userId} berhasil diambil, ${rows.length} records`);
        
        // Log untuk debugging verifikasi
        rows.forEach(row => {
            console.log(`  - ${row.kode_kompetensi}: status=${row.status}, hasil_verif=${row.hasil_verif}, verified_by=${row.verified_by_nama || row.verified_by}`);
        });

        res.status(200).json({
            success: true,
            message: 'Data kompetensi user berhasil diambil',
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('❌ Error fetching user competencies:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * POST /api/userskompetensi
 * Menambahkan data user kompetensi baru dengan upload file
 */
router.post('/', keycloakAuth, upload.single('bukti'), async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    console.log(`📝 ${username} menambah user kompetensi`);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    let { 
        id_user, 
        id_kompetensi, 
        tanggal_dipenuhi, 
        nilai, 
        status 
    } = req.body;

    // Dapatkan nama file jika ada
    const bukti = req.file ? req.file.filename : null;

    try {
        // Dapatkan role user
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);

        // Jika user bukan admin, gunakan id_user dari session
        if (!isAdmin) {
            // Normalisasi NIP: hapus spasi untuk pencarian
            const cleanNip = String(userNip || '').replace(/\s/g, '');
            const [userData] = await db.query(
                `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
                [cleanNip]
            );

            if (userData.length === 0) {
                // Hapus file jika ada
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    success: false,
                    message: 'Data user tidak ditemukan dalam database'
                });
            }

            id_user = userData[0].id;
            console.log(`📌 Menggunakan id_user dari session: ${id_user}`);
        }

        // Validasi
        if (!id_user) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'id_user harus diisi'
            });
        }
        
        if (!id_kompetensi) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'id_kompetensi harus diisi'
            });
        }
        
        if (!tanggal_dipenuhi) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'tanggal_dipenuhi harus diisi'
            });
        }

        // Cek unique constraint
        const [existing] = await db.query(
            'SELECT id FROM kepegawaian.user_kompetensi WHERE id_user = ? AND id_kompetensi = ?',
            [id_user, id_kompetensi]
        );

        if (existing.length > 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'User sudah memiliki kompetensi ini'
            });
        }

        const query = `
            INSERT INTO kepegawaian.user_kompetensi 
            (id_user, id_kompetensi, tanggal_dipenuhi, bukti, nilai, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            parseInt(id_user),
            parseInt(id_kompetensi),
            tanggal_dipenuhi,
            bukti,
            nilai ? parseFloat(nilai) : null,
            status || 'Dalam Proses'
        ]);

        // Ambil data yang baru ditambahkan
        const [newData] = await db.query(`
            SELECT 
                uk.*,
                u.nama as user_nama,
                u.nip as user_nip,
                mk.kode_kompetensi,
                mk.nama_kompetensi
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            WHERE uk.id = ?
        `, [result.insertId]);

        console.log(`✅ Data berhasil ditambahkan dengan ID: ${result.insertId}, File: ${bukti || 'tidak ada'}`);

        res.status(201).json({
            success: true,
            message: 'Data berhasil ditambahkan',
            data: newData[0]
        });
    } catch (error) {
        console.error('Error:', error);
        
        // Hapus file jika ada error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`🗑️ File dihapus karena error: ${req.file.filename}`);
            } catch (unlinkError) {
                console.error('Gagal menghapus file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * PUT /api/userskompetensi/:id
 * Mengupdate data user kompetensi dengan upload file
 */
// backend/routes/userskompetensi.js

/**
 * PUT /api/userskompetensi/:id
 * Mengupdate data user kompetensi dengan upload file dan reset verifikasi jika perlu
 */
router.put('/:id', keycloakAuth, upload.single('bukti'), async (req, res) => {
    const { id } = req.params;
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    
    console.log(`📝 ${username} mengupdate user kompetensi ID: ${id}`);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { 
        id_user, 
        id_kompetensi, 
        tanggal_dipenuhi, 
        nilai, 
        status 
    } = req.body;

    // Dapatkan nama file baru jika ada
    const buktiBaru = req.file ? req.file.filename : null;

    try {
        // Ambil data lama untuk mendapatkan informasi verifikasi dan file lama
        const [oldData] = await db.query(
            'SELECT bukti, verified_by, hasil_verif FROM kepegawaian.user_kompetensi WHERE id = ?',
            [id]
        );

        if (oldData.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        // Cek apakah user yang mengupdate adalah pemilik data atau admin
        const isAdmin = isAdminTambunRaya(req.user);
        
        // Ambil data user yang mengupdate
        const cleanNip = String(userNip || '').replace(/\s/g, '');
        const [updater] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE REPLACE(nip, \' \', \'\') = ?',
            [cleanNip]
        );

        if (updater.length === 0 && !isAdmin) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengupdate data ini'
            });
        }

        const updaterId = updater.length > 0 ? updater[0].id : null;

        // Tentukan apakah perlu reset verifikasi
        // Reset verifikasi jika:
        // 1. Data sebelumnya sudah diverifikasi (verified_by tidak null)
        // 2. Hasil verifikasi sebelumnya adalah 'Tidak Valid' atau 'Perlu Revisi'
        // 3. Yang mengupdate adalah user biasa (bukan admin)
        const shouldResetVerification = oldData[0].verified_by && 
            (oldData[0].hasil_verif === 'Tidak Valid' || oldData[0].hasil_verif === 'Perlu Revisi') &&
            !isAdmin;

        // Tentukan nama file final
        let buktiFinal = oldData[0].bukti; // default: file lama
        if (buktiBaru) {
            buktiFinal = buktiBaru; // pakai file baru
            // Hapus file lama jika ada
            if (oldData[0].bukti) {
                const oldFilePath = path.join(uploadDir, oldData[0].bukti);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`🗑️ File lama dihapus: ${oldData[0].bukti}`);
                }
            }
        }

        let query;
        let params;

        if (shouldResetVerification) {
            // Jika reset verifikasi, set verified_by, verified_at, hasil_verif, keterangan menjadi NULL
            console.log('🔄 Mereset status verifikasi karena user melakukan revisi');
            query = `
                UPDATE kepegawaian.user_kompetensi
                SET id_user = ?, 
                    id_kompetensi = ?, 
                    tanggal_dipenuhi = ?, 
                    bukti = ?, 
                    nilai = ?, 
                    status = ?,
                    verified_by = NULL,
                    verified_at = NULL,
                    hasil_verif = NULL,
                    keterangan = NULL
                WHERE id = ?
            `;
            params = [
                parseInt(id_user),
                parseInt(id_kompetensi),
                tanggal_dipenuhi,
                buktiFinal,
                nilai ? parseFloat(nilai) : null,
                status || 'Dalam Proses',
                id
            ];
        } else {
            // Update biasa tanpa reset verifikasi
            query = `
                UPDATE kepegawaian.user_kompetensi
                SET id_user = ?, 
                    id_kompetensi = ?, 
                    tanggal_dipenuhi = ?, 
                    bukti = ?, 
                    nilai = ?, 
                    status = ?
                WHERE id = ?
            `;
            params = [
                parseInt(id_user),
                parseInt(id_kompetensi),
                tanggal_dipenuhi,
                buktiFinal,
                nilai ? parseFloat(nilai) : null,
                status || 'Dalam Proses',
                id
            ];
        }

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        // Ambil data yang sudah diupdate
        const [updatedData] = await db.query(`
            SELECT 
                uk.*,
                u.nama as user_nama,
                u.nip as user_nip,
                mk.kode_kompetensi,
                mk.nama_kompetensi
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            WHERE uk.id = ?
        `, [id]);

        console.log(`✅ Data berhasil diupdate, Reset verifikasi: ${shouldResetVerification}`);

        res.status(200).json({
            success: true,
            message: shouldResetVerification ? 
                'Data berhasil direvisi dan menunggu verifikasi ulang' : 
                'Data berhasil diupdate',
            data: updatedData[0]
        });

    } catch (error) {
        console.error('Error:', error);
        
        // Hapus file baru jika ada error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`🗑️ File baru dihapus karena error: ${req.file.filename}`);
            } catch (unlinkError) {
                console.error('Gagal menghapus file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

/**
 * DELETE /api/userskompetensi/:id
 * Menghapus data user kompetensi
 */
router.delete('/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);

        // Hanya admin/katim yang bisa menghapus
        if (!isAdmin && !isKatimRole) {
            return res.status(403).json({
                success: false,
                message: 'Hanya admin_tambun_raya atau katim yang dapat menghapus data kompetensi'
            });
        }

        // Ambil data untuk mendapatkan nama file
        const [data] = await db.query(
            'SELECT bukti FROM kepegawaian.user_kompetensi WHERE id = ?',
            [id]
        );
        
        // Hapus file jika ada
        if (data.length > 0 && data[0].bukti) {
            const filePath = path.join(uploadDir, data[0].bukti);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ File dihapus: ${data[0].bukti}`);
            }
        }
        
        // Hapus data dari database
        const [result] = await db.query(
            'DELETE FROM kepegawaian.user_kompetensi WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Data berhasil dihapus'
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
 * PATCH /api/userskompetensi/:id/verify
 * Verifikasi data user kompetensi
 */
// backend/routes/userskompetensi.js

/**
 * PATCH /api/userskompetensi/:id/verify
 * Verifikasi data user kompetensi
 */
// backend/routes/userskompetensi.js

/**
 * PATCH /api/userskompetensi/:id/verify
 * Verifikasi data user kompetensi
 */
// backend/routes/userskompetensi.js

/**
 * PATCH /api/userskompetensi/:id/verify
 * Verifikasi data user kompetensi
 */
// backend/routes/userskompetensi.js - PATCH /:id/verify

router.patch('/:id/verify', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const { status, hasil_verif, keterangan } = req.body;
    
    console.log(`✅ Verifikasi user kompetensi ID: ${id}`);
    console.log(`📝 Data verifikasi:`, { status, hasil_verif, keterangan });
    
    // Validasi input
    if (!status || !['Lulus', 'Tidak Lulus', 'Dalam Proses'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status harus Lulus, Tidak Lulus, atau Dalam Proses'
        });
    }
    
    if (!hasil_verif || !['Valid', 'Tidak Valid', 'Perlu Revisi'].includes(hasil_verif)) {
        return res.status(400).json({
            success: false,
            message: 'Hasil verifikasi harus Valid, Tidak Valid, atau Perlu Revisi'
        });
    }
    
    try {
        // verified_by menyimpan nama user yang melakukan verifikasi
        const verifierName = req.user?.name || 'Admin';

        const query = `
            UPDATE kepegawaian.user_kompetensi
            SET status = ?, 
                hasil_verif = ?,
                keterangan = ?,
                verified_by = ?,
                verified_at = NOW()
            WHERE id = ?
        `;

        const [result] = await db.query(query, [
            status, 
            hasil_verif, 
            keterangan || null, 
            verifierName,
            id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data user kompetensi tidak ditemukan'
            });
        }
        
        console.log(`✅ Data berhasil diverifikasi oleh: ${verifierName}`);
        
        res.status(200).json({
            success: true,
            message: `Data berhasil diverifikasi oleh ${verifierName}`,
            data: {
                id: parseInt(id),
                verified_by: verifierName,
                verified_at: new Date().toISOString(),
                hasil_verif: hasil_verif,
                status: status
            }
        });
        
    } catch (error) {
        console.error('❌ Error verifying user kompetensi:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/userskompetensi/options/all
 * Mendapatkan data untuk dropdown (user dan kompetensi)
 */
router.get('/options/all', keycloakAuth, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id, 
                u.nip, 
                u.nama,
                f.nama_fungsi
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            ORDER BY u.nama
        `);

        const [kompetensi] = await db.query(`
            SELECT 
                mk.id, 
                mk.kode_kompetensi, 
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            ORDER BY mk.kode_kompetensi
        `);

        const statusOptions = ['Lulus', 'Tidak Lulus', 'Dalam Proses'];

        res.status(200).json({
            success: true,
            data: {
                users,
                kompetensi,
                status_options: statusOptions
            }
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
 * GET /api/userskompetensi/statistics/summary
 * Mendapatkan ringkasan statistik kompetensi
 */
router.get('/statistics/summary', keycloakAuth, async (req, res) => {
    try {
        const [total] = await db.query(
            'SELECT COUNT(*) as total FROM kepegawaian.user_kompetensi'
        );

        const [statusCount] = await db.query(`
            SELECT status, COUNT(*) as jumlah
            FROM kepegawaian.user_kompetensi
            GROUP BY status
        `);

        const [topUsers] = await db.query(`
            SELECT 
                u.id,
                u.nip,
                u.nama,
                COUNT(uk.id) as jumlah_kompetensi
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.user_kompetensi uk ON u.id = uk.id_user
            GROUP BY u.id, u.nip, u.nama
            ORDER BY jumlah_kompetensi DESC
            LIMIT 10
        `);

        const [topKompetensi] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                COUNT(uk.id_user) as jumlah_user
            FROM kepegawaian.master_kompetensi mk
            LEFT JOIN kepegawaian.user_kompetensi uk ON mk.id = uk.id_kompetensi
            GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi
            ORDER BY jumlah_user DESC
            LIMIT 10
        `);

        const [avgNilai] = await db.query(`
            SELECT 
                AVG(nilai) as rata_rata_nilai,
                MIN(nilai) as nilai_min,
                MAX(nilai) as nilai_max
            FROM kepegawaian.user_kompetensi
            WHERE nilai IS NOT NULL
        `);

        const statusObj = {
            Lulus: 0,
            'Tidak Lulus': 0,
            'Dalam Proses': 0
        };
        
        statusCount.forEach(item => {
            statusObj[item.status] = item.jumlah;
        });

        res.status(200).json({
            success: true,
            message: 'Statistik berhasil diambil',
            data: {
                total_kompetensi: total[0]?.total || 0,
                by_status: statusObj,
                rata_rata_nilai: avgNilai[0]?.rata_rata_nilai || 0,
                nilai_min: avgNilai[0]?.nilai_min || 0,
                nilai_max: avgNilai[0]?.nilai_max || 0,
                top_users: topUsers,
                top_kompetensi: topKompetensi
            }
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