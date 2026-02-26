// backend/routes/userskompetensi.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');
const multer = require('multer'); // Pastikan ini ada
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
        // Buat nama file unik: timestamp + random + ekstensi
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
    limits: { 
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter
});

// ========== HELPER FUNCTIONS UNTUK QUERY FILTER BERDASARKAN ROLE ==========

/**
 * Mendapatkan NIP dari token (preferred_username)
 */
function getUserNipFromToken(user) {
    if (!user) return null;
    const nip = user.preferred_username || user.username;
    return nip;
}

/**
 * Cek apakah user adalah admin_tambun_raya
 */
function isAdminTambunRaya(user) {
    if (!user) return false;
    const roles = user.extractedRoles || user.role || [];
    return roles.includes('admin_tambun_raya');
}

/**
 * Cek apakah user adalah katim
 */
function isKatim(user) {
    if (!user) return false;
    const roles = user.extractedRoles || user.role || [];
    return roles.includes('katim');
}

/**
 * Mendapatkan fungsi user berdasarkan NIP
 */
async function getUserFungsiByNip(nip) {
    if (!nip) return null;
    const [rows] = await db.query(
        'SELECT id_fungsi FROM kepegawaian.user WHERE nip = ?',
        [nip]
    );
    return rows.length > 0 ? rows[0] : null;
}

// ========== CRUD USER KOMPETENSI ==========

/**
 * GET /api/userskompetensi
 * Mendapatkan semua data user kompetensi
 */
// backend/routes/userskompetensi.js

/**
 * GET /api/userskompetensi
 * Mendapatkan semua data user kompetensi
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses data user kompetensi`);

    try {
        const query = `
            SELECT 
                uk.id,
                uk.id_user,
                u.nip as user_nip,
                u.nama as user_nama,
                f.nama_fungsi as user_fungsi,
                uk.id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
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
            ORDER BY uk.created_at DESC
        `;

        const [rows] = await db.query(query);
        
        console.log(`📊 Data berhasil diambil, ${rows.length} records`);
        if (rows.length > 0) {
            console.log('📤 Sample data:', {
                id: rows[0].id,
                hasil_verif: rows[0].hasil_verif,
                keterangan: rows[0].keterangan
            });
        }

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

/**
 * GET /api/userskompetensi/user/:userId
 * Mendapatkan kompetensi untuk user tertentu
 */
router.get('/user/:userId', keycloakAuth, async (req, res) => {
    const { userId } = req.params;
    console.log(`📊 Mengakses kompetensi untuk user ID: ${userId}`);

    try {
        const query = `
            SELECT 
                uk.*,
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
            const [userData] = await db.query(
                'SELECT id FROM kepegawaian.user WHERE nip = ?',
                [userNip]
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
        const [updater] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
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
router.patch('/:id/verify', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const { id } = req.params;
    const { status, hasil_verif, keterangan } = req.body;
    
    console.log(`✅ ${username} memverifikasi user kompetensi ID: ${id}`);
    console.log(`📝 Data verifikasi:`, { status, hasil_verif, keterangan });
    console.log(`🔍 User NIP dari token: ${userNip}`);
    
    // Validasi status
    if (!status || !['Lulus', 'Tidak Lulus', 'Dalam Proses'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status harus Lulus, Tidak Lulus, atau Dalam Proses'
        });
    }
    
    // Validasi hasil_verif
    if (!hasil_verif || !['Valid', 'Tidak Valid', 'Perlu Revisi'].includes(hasil_verif)) {
        return res.status(400).json({
            success: false,
            message: 'Hasil verifikasi harus Valid, Tidak Valid, atau Perlu Revisi'
        });
    }
    
    try {
        // CEK DUA KEMUNGKINAN:
        // 1. Cari berdasarkan NIP
        let [verifier] = await db.query(
            'SELECT id, nama, nip FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        // 2. Jika tidak ditemukan, coba cari berdasarkan username (preferred_username)
        if (verifier.length === 0) {
            console.log(`🔍 User dengan NIP ${userNip} tidak ditemukan, mencoba mencari berdasarkan username...`);
            
            // Ambil username dari token (bisa dari preferred_username atau username)
            const username_from_token = req.user.preferred_username || req.user.username;
            
            if (username_from_token && username_from_token !== userNip) {
                [verifier] = await db.query(
                    'SELECT id, nama, nip FROM kepegawaian.user WHERE nip = ? OR nama LIKE ?',
                    [username_from_token, `%${username_from_token}%`]
                );
            }
        }
        
        // 3. Jika masih tidak ditemukan, gunakan user pertama (untuk testing) - HAPUS DI PRODUCTION
        if (verifier.length === 0) {
            console.log('⚠️ TESTING MODE: Menggunakan user pertama sebagai verifikator');
            [verifier] = await db.query(
                'SELECT id, nama, nip FROM kepegawaian.user LIMIT 1'
            );
        }
        
        if (verifier.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data verifikator tidak ditemukan. Pastikan user Anda terdaftar di database.'
            });
        }
        
        const verifierId = verifier[0].id;
        console.log(`🔑 Verifikator ditemukan: ${verifier[0].nama} (NIP: ${verifier[0].nip}, ID: ${verifierId})`);
        
        // Update database dengan menambahkan hasil_verif dan keterangan
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
            verifierId, 
            id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data user kompetensi tidak ditemukan'
            });
        }
        
        // Ambil data yang sudah diverifikasi
        const [verifiedData] = await db.query(`
            SELECT 
                uk.*,
                u.nama as user_nama,
                u.nip as user_nip,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                v.nama as verified_by_nama
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.user u ON uk.id_user = u.id
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.user v ON uk.verified_by = v.id
            WHERE uk.id = ?
        `, [id]);
        
        console.log(`✅ Data berhasil diverifikasi oleh ${verifier[0].nama} (ID: ${verifierId})`);
        console.log(`📊 Hasil Verifikasi: ${hasil_verif}, Keterangan: ${keterangan || '-'}`);
        
        res.status(200).json({
            success: true,
            message: `Data user kompetensi berhasil diverifikasi`,
            data: verifiedData[0] || { id: parseInt(id) }
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