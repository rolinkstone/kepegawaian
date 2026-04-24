// backend/routes/pelatihan.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');

// ========== HELPER FUNCTIONS ==========

function getUserNipFromToken(user) {
    if (!user) return null;
    return user.preferred_username || user.username;
}

function isAdminTambunRaya(user) {
    if (!user) return false;
    const roles = user.extractedRoles || user.role || [];
    return roles.includes('admin_tambun_raya');
}

function isKatim(user) {
    if (!user) return false;
    const roles = user.extractedRoles || user.role || [];
    return roles.includes('katim');
}

// ========== MASTER PELATIHAN ==========

/**
 * GET /api/pelatihan/master
 * Mendapatkan semua master pelatihan
 */
// backend/routes/pelatihan.js

/**
 * GET /api/pelatihan/master
 * Mendapatkan semua master pelatihan (bisa diakses admin dan katim)
 */
router.get('/master', keycloakAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                mp.*,
                u.nama as created_by_nama
            FROM kepegawaian.master_pelatihan mp
            LEFT JOIN kepegawaian.user u ON mp.created_by = u.id
            WHERE mp.is_active = 1
            ORDER BY mp.nama_pelatihan
        `;
        
        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Data master pelatihan berhasil diambil',
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
 * GET /api/pelatihan/master/:id
 * Mendapatkan detail master pelatihan beserta kompetensinya (bisa diakses admin dan katim)
 */
router.get('/master/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Ambil data master pelatihan
        const [pelatihan] = await db.query(
            'SELECT * FROM kepegawaian.master_pelatihan WHERE id = ?',
            [id]
        );
        
        if (pelatihan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data pelatihan tidak ditemukan'
            });
        }
        
        // Ambil kompetensi yang terkait
        const [kompetensi] = await db.query(`
            SELECT 
                pk.*,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                f.nama_fungsi
            FROM kepegawaian.pelatihan_kompetensi pk
            JOIN kepegawaian.master_kompetensi mk ON pk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE pk.id_pelatihan = ?
        `, [id]);
        
        res.status(200).json({
            success: true,
            data: {
                ...pelatihan[0],
                kompetensi: kompetensi
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
 * POST /api/pelatihan/master
 * Menambah master pelatihan baru (bisa admin dan katim)
 */
// backend/routes/pelatihan.js

/**
 * POST /api/pelatihan/master
 * Menambah master pelatihan baru (bisa admin dan katim)
 */
// backend/routes/pelatihan.js

/**
 * POST /api/pelatihan/master
 * Menambah master pelatihan baru (bisa admin dan katim)
 */
router.post('/master', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    // Izinkan admin dan katim
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin dan katim yang dapat menambah master pelatihan'
        });
    }
    
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const { kode_pelatihan, nama_pelatihan, deskripsi, durasi, jenis_pelatihan, biaya, kompetensi_ids } = req.body;
    
    console.log('📥 Request body:', req.body);
    console.log('📥 User NIP dari token:', userNip);
    console.log('📥 Username:', username);
    
    // Validasi
    if (!kode_pelatihan || !nama_pelatihan) {
        return res.status(400).json({
            success: false,
            message: 'Kode dan nama pelatihan harus diisi'
        });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // CEK USER BERDASARKAN NIP
        let [user] = await connection.query(
            'SELECT id, nama, nip FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        // Jika tidak ditemukan, coba cari berdasarkan username
        if (user.length === 0 && username) {
            console.log('🔍 Mencari user berdasarkan username:', username);
            [user] = await connection.query(
                'SELECT id, nama, nip FROM kepegawaian.user WHERE nama LIKE ? OR nip LIKE ?',
                [`%${username}%`, `%${username}%`]
            );
        }
        
        // Jika masih tidak ditemukan, gunakan user pertama (untuk testing)
        if (user.length === 0) {
            console.log('⚠️ TESTING MODE: Menggunakan user pertama');
            [user] = await connection.query(
                'SELECT id, nama, nip FROM kepegawaian.user LIMIT 1'
            );
        }
        
        if (user.length === 0) {
            throw new Error('User tidak ditemukan dalam database');
        }
        
        const userId = user[0].id;
        console.log('👤 User ditemukan:', user[0].nama, 'ID:', userId);
        
        // Insert master pelatihan
        const [result] = await connection.query(`
            INSERT INTO kepegawaian.master_pelatihan 
            (kode_pelatihan, nama_pelatihan, deskripsi, durasi, jenis_pelatihan, biaya, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [kode_pelatihan, nama_pelatihan, deskripsi || null, durasi || null, jenis_pelatihan || 'Teknis', biaya || null, userId]);
        
        const pelatihanId = result.insertId;
        console.log('✅ Master pelatihan inserted, ID:', pelatihanId);
        
        // Insert kompetensi terkait jika ada
        if (kompetensi_ids && Array.isArray(kompetensi_ids) && kompetensi_ids.length > 0) {
            console.log('📥 Inserting kompetensi_ids:', kompetensi_ids);
            
            const kompetensiValues = kompetensi_ids.map(id => [pelatihanId, id]);
            await connection.query(
                'INSERT INTO kepegawaian.pelatihan_kompetensi (id_pelatihan, id_kompetensi) VALUES ?',
                [kompetensiValues]
            );
            console.log(`✅ ${kompetensi_ids.length} kompetensi inserted`);
        }
        
        await connection.commit();
        
        console.log(`✅ ${user[0].nama} (${isAdmin ? 'Admin' : 'Katim'}) menambah master pelatihan: ${kode_pelatihan}`);
        
        res.status(201).json({
            success: true,
            message: 'Master pelatihan berhasil ditambahkan',
            data: { id: pelatihanId }
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error detail:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kode pelatihan sudah ada'
            });
        }
        
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
 * PUT /api/pelatihan/master/:id
 * Update master pelatihan (bisa admin dan katim)
 */
router.put('/master/:id', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    // Izinkan admin dan katim
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin dan katim yang dapat mengupdate master pelatihan'
        });
    }
    
    const { id } = req.params;
    const { kode_pelatihan, nama_pelatihan, deskripsi, durasi, jenis_pelatihan, biaya, kompetensi_ids, is_active } = req.body;
    const username = getUsername(req.user);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Update master pelatihan
        await connection.query(`
            UPDATE kepegawaian.master_pelatihan
            SET kode_pelatihan = ?, nama_pelatihan = ?, deskripsi = ?, 
                durasi = ?, jenis_pelatihan = ?, biaya = ?, is_active = ?
            WHERE id = ?
        `, [kode_pelatihan, nama_pelatihan, deskripsi, durasi, jenis_pelatihan, biaya, is_active !== undefined ? is_active : 1, id]);
        
        // Hapus semua kompetensi lama
        await connection.query(
            'DELETE FROM kepegawaian.pelatihan_kompetensi WHERE id_pelatihan = ?',
            [id]
        );
        
        // Insert kompetensi baru
        if (kompetensi_ids && kompetensi_ids.length > 0) {
            const kompetensiValues = kompetensi_ids.map(komId => [id, komId]);
            await connection.query(
                'INSERT INTO kepegawaian.pelatihan_kompetensi (id_pelatihan, id_kompetensi) VALUES ?',
                [kompetensiValues]
            );
        }
        
        await connection.commit();
        
        console.log(`✅ ${username} (${isAdmin ? 'Admin' : 'Katim'}) mengupdate master pelatihan ID: ${id}`);
        
        res.status(200).json({
            success: true,
            message: 'Master pelatihan berhasil diupdate'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /api/pelatihan/master/:id
 * Hapus master pelatihan (hanya admin - soft delete)
 */
router.delete('/master/:id', keycloakAuth, async (req, res) => {
    // Hanya admin yang bisa menghapus master pelatihan
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menghapus master pelatihan'
        });
    }
    
    const { id } = req.params;
    const username = getUsername(req.user);
    
    try {
        // Soft delete (set is_active = 0)
        await db.query(
            'UPDATE kepegawaian.master_pelatihan SET is_active = 0 WHERE id = ?',
            [id]
        );
        
        console.log(`✅ ${username} (Admin) menghapus master pelatihan ID: ${id}`);
        
        res.status(200).json({
            success: true,
            message: 'Master pelatihan berhasil dihapus'
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

// ========== JADWAL PELATIHAN (UNTUK KATIM) ==========

/**
 * GET /api/pelatihan/jadwal
 * Mendapatkan semua jadwal pelatihan (dengan filter)
 */
// backend/routes/pelatihan.js

/**
 * GET /api/pelatihan/jadwal
 * Mendapatkan semua jadwal pelatihan (dengan filter)
 */
router.get('/jadwal', keycloakAuth, async (req, res) => {
    const { status, id_penyelenggara, search } = req.query;
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    console.log('📥 GET /jadwal - User NIP:', userNip);
    console.log('📥 isAdmin:', isAdmin);
    console.log('📥 isKatim:', isKatimRole);
    
    try {
        // Dapatkan ID user
        const [user] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        if (user.length === 0 && !isAdmin && !isKatimRole) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        const userId = user.length > 0 ? user[0].id : null;
        
        let query = `
            SELECT 
                jp.*,
                mp.kode_pelatihan,
                mp.nama_pelatihan,
                mp.durasi,
                mp.jenis_pelatihan,
                u.nama as penyelenggara_nama,
                u.nip as penyelenggara_nip,
                (
                    SELECT COUNT(*) FROM kepegawaian.peserta_pelatihan 
                    WHERE id_jadwal = jp.id
                ) as jumlah_peserta,
                (
                    SELECT COUNT(*) FROM kepegawaian.peserta_pelatihan 
                    WHERE id_jadwal = jp.id AND status_kehadiran = 'Hadir'
                ) as jumlah_hadir,
                (
                    SELECT status_undangan FROM kepegawaian.peserta_pelatihan 
                    WHERE id_jadwal = jp.id AND id_user = ?
                ) as status_undangan_saya
            FROM kepegawaian.jadwal_pelatihan jp
            JOIN kepegawaian.master_pelatihan mp ON jp.id_pelatihan = mp.id
            JOIN kepegawaian.user u ON jp.id_penyelenggara = u.id
            WHERE 1=1
        `;
        
        const params = [userId];
        
        // FILTER BERDASARKAN ROLE
        if (!isAdmin && !isKatimRole) {
            // User biasa: hanya melihat jadwal di mana mereka diundang
            console.log('👤 User biasa: filter jadwal yang diundang');
            query += ` AND EXISTS (
                SELECT 1 FROM kepegawaian.peserta_pelatihan 
                WHERE id_jadwal = jp.id AND id_user = ?
            )`;
            params.push(userId);
        } else if (isKatimRole && !isAdmin) {
            // Katim: melihat jadwal yang mereka buat (opsional, bisa ditambahkan filter lain)
            console.log('👥 Katim: filter jadwal yang dibuat');
            query += ` AND jp.id_penyelenggara = ?`;
            params.push(userId);
        }
        // Admin: melihat semua jadwal (tanpa filter tambahan)
        
        if (status) {
            query += ` AND jp.status = ?`;
            params.push(status);
        }
        
        if (id_penyelenggara) {
            query += ` AND jp.id_penyelenggara = ?`;
            params.push(id_penyelenggara);
        }
        
        if (search) {
            query += ` AND (mp.nama_pelatihan LIKE ? OR mp.kode_pelatihan LIKE ? OR jp.lokasi LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        query += ` ORDER BY jp.tanggal_mulai DESC`;
        
        console.log('📝 Query:', query);
        console.log('📝 Params:', params);
        
        const [rows] = await db.query(query, params);
        
        console.log(`✅ Ditemukan ${rows.length} jadwal pelatihan untuk user ${userNip}`);
        
        res.status(200).json({
            success: true,
            data: rows
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
 * GET /api/pelatihan/jadwal/:id
 * Mendapatkan detail jadwal pelatihan
 */
router.get('/jadwal/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    console.log(`📊 Mengakses detail jadwal ID: ${id} oleh user ${userNip}`);
    
    try {
        // Dapatkan ID user
        const [user] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        if (user.length === 0 && !isAdmin && !isKatimRole) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        const userId = user.length > 0 ? user[0].id : null;
        
        // Cek akses: user biasa hanya bisa lihat jika diundang
        if (!isAdmin && !isKatimRole) {
            const [cekUndangan] = await db.query(
                'SELECT id FROM kepegawaian.peserta_pelatihan WHERE id_jadwal = ? AND id_user = ?',
                [id, userId]
            );
            
            if (cekUndangan.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke jadwal ini'
                });
            }
        }
        
        // Data jadwal
        const [jadwal] = await db.query(`
            SELECT 
                jp.*,
                mp.kode_pelatihan,
                mp.nama_pelatihan,
                mp.deskripsi as deskripsi_pelatihan,
                mp.durasi,
                mp.jenis_pelatihan,
                u.nama as penyelenggara_nama
            FROM kepegawaian.jadwal_pelatihan jp
            JOIN kepegawaian.master_pelatihan mp ON jp.id_pelatihan = mp.id
            JOIN kepegawaian.user u ON jp.id_penyelenggara = u.id
            WHERE jp.id = ?
        `, [id]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        // Kompetensi yang terkait
        const [kompetensi] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                f.nama_fungsi
            FROM kepegawaian.pelatihan_kompetensi pk
            JOIN kepegawaian.master_kompetensi mk ON pk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE pk.id_pelatihan = ?
        `, [jadwal[0].id_pelatihan]);
        
        // Daftar peserta
        const [peserta] = await db.query(`
            SELECT 
                pp.*,
                u.nip as user_nip,
                u.nama as user_nama,
                u.email as user_email,
                f.nama_fungsi as user_fungsi,
                j.nama_jabatan as user_jabatan
            FROM kepegawaian.peserta_pelatihan pp
            JOIN kepegawaian.user u ON pp.id_user = u.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            WHERE pp.id_jadwal = ?
            ORDER BY u.nama
        `, [id]);
        
        res.status(200).json({
            success: true,
            data: {
                ...jadwal[0],
                kompetensi: kompetensi,
                peserta: peserta
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
 * GET /api/pelatihan/jadwal/:id
 * Mendapatkan detail jadwal pelatihan
 */
router.get('/jadwal/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Data jadwal
        const [jadwal] = await db.query(`
            SELECT 
                jp.*,
                mp.kode_pelatihan,
                mp.nama_pelatihan,
                mp.deskripsi as deskripsi_pelatihan,
                mp.durasi,
                mp.jenis_pelatihan,
                u.nama as penyelenggara_nama
            FROM kepegawaian.jadwal_pelatihan jp
            JOIN kepegawaian.master_pelatihan mp ON jp.id_pelatihan = mp.id
            JOIN kepegawaian.user u ON jp.id_penyelenggara = u.id
            WHERE jp.id = ?
        `, [id]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        // Kompetensi yang terkait dengan pelatihan ini
        const [kompetensi] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                f.nama_fungsi
            FROM kepegawaian.pelatihan_kompetensi pk
            JOIN kepegawaian.master_kompetensi mk ON pk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            WHERE pk.id_pelatihan = ?
        `, [jadwal[0].id_pelatihan]);
        
        // Daftar peserta
        const [peserta] = await db.query(`
            SELECT 
                pp.*,
                u.nip as user_nip,
                u.nama as user_nama,
                u.email as user_email,
                f.nama_fungsi as user_fungsi,
                j.nama_jabatan as user_jabatan
            FROM kepegawaian.peserta_pelatihan pp
            JOIN kepegawaian.user u ON pp.id_user = u.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            WHERE pp.id_jadwal = ?
            ORDER BY u.nama
        `, [id]);
        
        res.status(200).json({
            success: true,
            data: {
                ...jadwal[0],
                kompetensi: kompetensi,
                peserta: peserta
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
 * POST /api/pelatihan/jadwal
 * Membuat jadwal pelatihan baru (hanya katim/admin)
 */
// backend/routes/pelatihan.js

/**
 * POST /api/pelatihan/jadwal
 * Membuat jadwal pelatihan baru (hanya katim/admin)
 */
router.post('/jadwal', keycloakAuth, async (req, res) => {
    const userNip = getUserNipFromToken(req.user);
    const username = getUsername(req.user);
    const isKatimRole = isKatim(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    
    console.log('📥 POST /jadwal - User NIP:', userNip);
    console.log('📥 Username:', username);
    console.log('📥 Request body:', req.body);
    
    if (!isKatimRole && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Hanya katim dan admin yang dapat membuat jadwal pelatihan'
        });
    }
    
    const {
        id_pelatihan,
        nama_penyelenggara,
        tanggal_mulai,
        tanggal_selesai,
        waktu_mulai,
        waktu_selesai,
        lokasi,
        metode,
        kuota,
        deskripsi,
        peserta_ids
    } = req.body;
    
    // Validasi
    if (!id_pelatihan || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({
            success: false,
            message: 'Pelatihan, tanggal mulai, dan tanggal selesai harus diisi'
        });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // CEK USER BERDASARKAN NIP
        let [user] = await connection.query(
            'SELECT id, nama, nip FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        // Jika tidak ditemukan, coba cari berdasarkan username
        if (user.length === 0 && username) {
            console.log('🔍 Mencari user berdasarkan username:', username);
            [user] = await connection.query(
                'SELECT id, nama, nip FROM kepegawaian.user WHERE nama LIKE ? OR nip LIKE ?',
                [`%${username}%`, `%${username}%`]
            );
        }
        
        // Jika masih tidak ditemukan, gunakan user pertama (untuk testing)
        if (user.length === 0) {
            console.log('⚠️ TESTING MODE: Menggunakan user pertama');
            [user] = await connection.query(
                'SELECT id, nama, nip FROM kepegawaian.user LIMIT 1'
            );
        }
        
        if (user.length === 0) {
            throw new Error('User tidak ditemukan dalam database');
        }
        
        const userId = user[0].id;
        console.log('👤 User ditemukan:', user[0].nama, 'ID:', userId);
        
        // Insert jadwal
        const [result] = await connection.query(`
            INSERT INTO kepegawaian.jadwal_pelatihan 
            (id_pelatihan, id_penyelenggara, nama_penyelenggara, tanggal_mulai, tanggal_selesai, 
             waktu_mulai, waktu_selesai, lokasi, metode, kuota, deskripsi, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
        `, [
            id_pelatihan, userId, nama_penyelenggara || null, tanggal_mulai, tanggal_selesai,
            waktu_mulai || null, waktu_selesai || null, lokasi || null, metode || 'Offline', 
            kuota || null, deskripsi || null, userId
        ]);
        
        const jadwalId = result.insertId;
        console.log('✅ Jadwal inserted, ID:', jadwalId);
        
        // Insert peserta jika ada
        if (peserta_ids && Array.isArray(peserta_ids) && peserta_ids.length > 0) {
            console.log('📥 Inserting peserta_ids:', peserta_ids);
            
            const pesertaValues = peserta_ids.map(idPeserta => [
                jadwalId, idPeserta, 'Pending', userId
            ]);
            
            await connection.query(
                'INSERT INTO kepegawaian.peserta_pelatihan (id_jadwal, id_user, status_undangan, created_by) VALUES ?',
                [pesertaValues]
            );
            
            console.log(`✅ ${peserta_ids.length} peserta inserted`);
        }
        
        await connection.commit();
        
        console.log(`✅ ${user[0].nama} berhasil membuat jadwal pelatihan ID: ${jadwalId}`);
        
        res.status(201).json({
            success: true,
            message: 'Jadwal pelatihan berhasil dibuat',
            data: { id: jadwalId }
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error detail:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        
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
 * PUT /api/pelatihan/jadwal/:id
 * Update jadwal pelatihan
 */
router.put('/jadwal/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    
    const {
        id_pelatihan,
        nama_penyelenggara,
        tanggal_mulai,
        tanggal_selesai,
        waktu_mulai,
        waktu_selesai,
        lokasi,
        metode,
        kuota,
        deskripsi,
        status
    } = req.body;
    
    try {
        // Cek kepemilikan jadwal
        const [jadwal] = await db.query(`
            SELECT jp.*, u.nip as pembuat_nip
            FROM kepegawaian.jadwal_pelatihan jp
            JOIN kepegawaian.user u ON jp.created_by = u.id
            WHERE jp.id = ?
        `, [id]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        // Hanya pembuat atau admin yang bisa update
        if (jadwal[0].pembuat_nip !== userNip && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengupdate jadwal ini'
            });
        }
        
        await db.query(`
            UPDATE kepegawaian.jadwal_pelatihan
            SET id_pelatihan = ?, nama_penyelenggara = ?, tanggal_mulai = ?, 
                tanggal_selesai = ?, waktu_mulai = ?, waktu_selesai = ?, 
                lokasi = ?, metode = ?, kuota = ?, deskripsi = ?, status = ?
            WHERE id = ?
        `, [
            id_pelatihan, nama_penyelenggara, tanggal_mulai, tanggal_selesai,
            waktu_mulai, waktu_selesai, lokasi, metode, kuota, deskripsi, status, id
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Jadwal berhasil diupdate'
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
 * DELETE /api/pelatihan/jadwal/:id
 * Hapus jadwal pelatihan (hanya jika status masih Draft)
 */
router.delete('/jadwal/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    
    try {
        // Cek jadwal
        const [jadwal] = await db.query(`
            SELECT jp.*, u.nip as pembuat_nip
            FROM kepegawaian.jadwal_pelatihan jp
            JOIN kepegawaian.user u ON jp.created_by = u.id
            WHERE jp.id = ?
        `, [id]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        // Hanya pembuat atau admin yang bisa hapus
        if (jadwal[0].pembuat_nip !== userNip && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk menghapus jadwal ini'
            });
        }
        
        // Hanya bisa hapus jika status Draft
        if (jadwal[0].status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Hanya jadwal dengan status Draft yang dapat dihapus'
            });
        }
        
        await db.query('DELETE FROM kepegawaian.jadwal_pelatihan WHERE id = ?', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Jadwal berhasil dihapus'
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
 * POST /api/pelatihan/jadwal/:id/publikasi
 * Mempublikasikan jadwal (ubah status dari Draft ke Publik)
 */
router.post('/jadwal/:id/publikasi', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    
    try {
        const [jadwal] = await db.query(
            'SELECT * FROM kepegawaian.jadwal_pelatihan WHERE id = ?',
            [id]
        );
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        if (jadwal[0].status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Jadwal sudah dipublikasikan'
            });
        }
        
        await db.query(
            'UPDATE kepegawaian.jadwal_pelatihan SET status = "Publik" WHERE id = ?',
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Jadwal berhasil dipublikasikan'
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

// ========== PESERTA PELATIHAN ==========

/**
 * POST /api/pelatihan/jadwal/:id/tambah-peserta
 * Menambahkan peserta ke jadwal
 */
router.post('/jadwal/:id/tambah-peserta', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const { peserta_ids } = req.body;
    const userNip = getUserNipFromToken(req.user);
    
    if (!peserta_ids || !peserta_ids.length) {
        return res.status(400).json({
            success: false,
            message: 'Pilih minimal satu peserta'
        });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Dapatkan ID user yang menambah
        const [user] = await connection.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        if (user.length === 0) {
            throw new Error('User tidak ditemukan');
        }
        
        const userId = user[0].id;
        
        // Insert peserta (dengan pengecekan duplikat)
        for (const idPeserta of peserta_ids) {
            await connection.query(`
                INSERT IGNORE INTO kepegawaian.peserta_pelatihan 
                (id_jadwal, id_user, status_undangan, created_by)
                VALUES (?, ?, 'Pending', ?)
            `, [id, idPeserta, userId]);
        }
        
        await connection.commit();
        
        res.status(200).json({
            success: true,
            message: 'Peserta berhasil ditambahkan'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * PUT /api/pelatihan/peserta/:id
 * Update status peserta (kehadiran, nilai, dll)
 */
router.put('/peserta/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const { status_kehadiran, nilai, keterangan } = req.body;
    
    try {
        await db.query(`
            UPDATE kepegawaian.peserta_pelatihan
            SET status_kehadiran = ?, nilai = ?, keterangan = ?
            WHERE id = ?
        `, [status_kehadiran, nilai, keterangan, id]);
        
        res.status(200).json({
            success: true,
            message: 'Data peserta berhasil diupdate'
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
 * POST /api/pelatihan/peserta/:id/kompetensi-terpenuhi
 * Menandai kompetensi yang terpenuhi dari pelatihan untuk peserta
 */
router.post('/peserta/:id/kompetensi-terpenuhi', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const { kompetensi_ids } = req.body;
    const userNip = getUserNipFromToken(req.user);
    
    if (!kompetensi_ids || !kompetensi_ids.length) {
        return res.status(400).json({
            success: false,
            message: 'Pilih minimal satu kompetensi'
        });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Dapatkan ID verifikator
        const [verifier] = await connection.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        if (verifier.length === 0) {
            throw new Error('User tidak ditemukan');
        }
        
        const verifierId = verifier[0].id;
        
        // Hapus kompetensi lama
        await connection.query(
            'DELETE FROM kepegawaian.kompetensi_terpenuhi_pelatihan WHERE id_peserta = ?',
            [id]
        );
        
        // Insert kompetensi baru
        for (const idKompetensi of kompetensi_ids) {
            await connection.query(`
                INSERT INTO kepegawaian.kompetensi_terpenuhi_pelatihan 
                (id_peserta, id_kompetensi, status, verified_by, verified_at)
                VALUES (?, ?, 'Terpenuhi', ?, NOW())
            `, [id, idKompetensi, verifierId]);
        }
        
        await connection.commit();
        
        res.status(200).json({
            success: true,
            message: 'Kompetensi terpenuhi berhasil disimpan'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// ========== OPTIONS / DROPDOWN ==========

/**
 * GET /api/pelatihan/options/all
 * Mendapatkan data untuk dropdown
 */
// backend/routes/pelatihan.js

/**
 * GET /api/pelatihan/options/all
 * Mendapatkan data untuk dropdown
 */
// backend/routes/pelatihan.js

/**
 * GET /api/pelatihan/options/all
 * Mendapatkan data untuk dropdown
 */
router.get('/options/all', keycloakAuth, async (req, res) => {
    try {
        // Master pelatihan
        const [pelatihan] = await db.query(`
            SELECT id, kode_pelatihan, nama_pelatihan 
            FROM kepegawaian.master_pelatihan 
            WHERE is_active = 1
            ORDER BY nama_pelatihan
        `);
        
        // Semua user (pegawai)
        const [users] = await db.query(`
            SELECT u.id, u.nip, u.nama, f.nama_fungsi
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE u.is_active = 1
            ORDER BY u.nama
        `);
        
        // Ambil semua kompetensi - HAPUS WHERE is_active
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
        
        // Status options
        const statusOptions = ['Draft', 'Publik', 'Berlangsung', 'Selesai', 'Dibatalkan'];
        const metodeOptions = ['Offline', 'Online', 'Hybrid'];
        const statusUndanganOptions = ['Pending', 'Diterima', 'Ditolak'];
        const statusKehadiranOptions = ['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'];
        
        res.status(200).json({
            success: true,
            data: {
                pelatihan,
                users,
                kompetensi,
                status_options: statusOptions,
                metode_options: metodeOptions,
                status_undangan_options: statusUndanganOptions,
                status_kehadiran_options: statusKehadiranOptions
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


// backend/routes/pelatihan.js

/**
 * GET /api/pelatihan/undangan
 * Mendapatkan daftar undangan untuk user yang login
 */
router.get('/undangan', keycloakAuth, async (req, res) => {
    const userNip = getUserNipFromToken(req.user);
    
    try {
        // Dapatkan ID user
        const [user] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [userNip]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        const userId = user[0].id;
        
        const query = `
            SELECT 
                pp.*,
                jp.id as jadwal_id,
                jp.tanggal_mulai,
                jp.tanggal_selesai,
                jp.waktu_mulai,
                jp.waktu_selesai,
                jp.lokasi,
                jp.metode,
                mp.kode_pelatihan,
                mp.nama_pelatihan,
                u.nama as penyelenggara_nama
            FROM kepegawaian.peserta_pelatihan pp
            JOIN kepegawaian.jadwal_pelatihan jp ON pp.id_jadwal = jp.id
            JOIN kepegawaian.master_pelatihan mp ON jp.id_pelatihan = mp.id
            JOIN kepegawaian.user u ON jp.id_penyelenggara = u.id
            WHERE pp.id_user = ?
            ORDER BY jp.tanggal_mulai DESC
        `;
        
        const [rows] = await db.query(query, [userId]);
        
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
 * PUT /api/pelatihan/undangan/:id
 * Merespon undangan (terima/tolak)
 */
router.put('/undangan/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const { status_undangan } = req.body;
    
    if (!status_undangan || !['Diterima', 'Ditolak'].includes(status_undangan)) {
        return res.status(400).json({
            success: false,
            message: 'Status undangan harus Diterima atau Ditolak'
        });
    }
    
    try {
        await db.query(
            'UPDATE kepegawaian.peserta_pelatihan SET status_undangan = ? WHERE id = ?',
            [status_undangan, id]
        );
        
        res.status(200).json({
            success: true,
            message: `Undangan berhasil ${status_undangan === 'Diterima' ? 'diterima' : 'ditolak'}`
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


// ========== KOMPETENSI WAJIB ==========

/**
 * GET /api/pelatihan/kompetensi-wajib
 * Mendapatkan semua kompetensi wajib
 */
router.get('/kompetensi-wajib', keycloakAuth, async (req, res) => {
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
 * GET /api/pelatihan/kompetensi-wajib/tahun/:tahun
 * Mendapatkan kompetensi wajib berdasarkan tahun
 */
router.get('/kompetensi-wajib/tahun/:tahun', keycloakAuth, async (req, res) => {
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
 * GET /api/pelatihan/kompetensi-wajib/tahun-options
 * Mendapatkan daftar tahun yang tersedia
 */
router.get('/kompetensi-wajib/tahun-options', keycloakAuth, async (req, res) => {
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
 * POST /api/pelatihan/kompetensi-wajib
 * Menambah kompetensi wajib baru (hanya admin)
 */
router.post('/kompetensi-wajib', keycloakAuth, async (req, res) => {
    // Hanya admin yang bisa menambah kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menambah kompetensi wajib'
        });
    }
    
    const userNip = getUserNipFromToken(req.user);
    const { id_kompetensi, nama_kompetensi, tahun } = req.body;
    
    console.log('📥 POST /kompetensi-wajib - User NIP:', userNip);
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
 * POST /api/pelatihan/kompetensi-wajib/bulk
 * Menambah multiple kompetensi wajib sekaligus (hanya admin)
 */
router.post('/kompetensi-wajib/bulk', keycloakAuth, async (req, res) => {
    // Hanya admin yang bisa menambah kompetensi wajib
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Hanya admin yang dapat menambah kompetensi wajib'
        });
    }
    
    const userNip = getUserNipFromToken(req.user);
    const { kompetensi_ids, tahun } = req.body;
    
    console.log('📥 POST /kompetensi-wajib/bulk - User NIP:', userNip);
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
 * DELETE /api/pelatihan/kompetensi-wajib/:id
 * Menghapus kompetensi wajib (hanya admin)
 */
router.delete('/kompetensi-wajib/:id', keycloakAuth, async (req, res) => {
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
 * DELETE /api/pelatihan/kompetensi-wajib/tahun/:tahun
 * Menghapus semua kompetensi wajib untuk tahun tertentu (hanya admin)
 */
router.delete('/kompetensi-wajib/tahun/:tahun', keycloakAuth, async (req, res) => {
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
 * GET /api/pelatihan/kompetensi-wajib/options/kompetensi
 * Mendapatkan daftar kompetensi yang belum menjadi wajib untuk tahun tertentu
 */
router.get('/kompetensi-wajib/options/kompetensi', keycloakAuth, async (req, res) => {
    const { tahun } = req.query;
    
    try {
        let query = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
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

module.exports = router;
module.exports = router;