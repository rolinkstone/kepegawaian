// backend/routes/pelatihan.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');
const { getUserNipFromToken, isAdminTambunRaya, isKatim } = require('../utils/keycloakHelpers');

// ========== HELPER: NORMALISASI NIP & RESOLVE USER ==========
// NIP di DB bisa tersimpan dengan spasi ('XXXXXXXX XXXXXX X XXX'), sedangkan
// preferred_username di token Keycloak tanpa spasi. Normalisasi saat membandingkan.
function normalizeNip(nip) {
    return String(nip || '').replace(/\s/g, '');
}

/**
 * Mencari baris user berdasarkan NIP dari token (dengan normalisasi spasi).
 * Menerima executor query (db atau connection) yang punya metode .query.
 * Mengembalikan array baris [{ id, nama, nip }] — kosong jika tidak ditemukan.
 */
async function findUserByNip(executor, userNip, username) {
    const cleanNip = normalizeNip(userNip);
    const run = async (sql, params) => {
        const [rows] = await executor.query(sql, params);
        return rows;
    };

    let rows = await run(
        `SELECT id, nama, nip FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
        [cleanNip]
    );

    // Jika tidak ditemukan, coba cari berdasarkan username
    if (rows.length === 0 && username) {
        console.log('🔍 Mencari user berdasarkan username:', username);
        rows = await run(
            `SELECT id, nama, nip FROM kepegawaian.user WHERE REPLACE(nama, ' ', '') = ? OR REPLACE(nip, ' ', '') = ?`,
            [username, username]
        );
    }

    // Fallback: gunakan user pertama jika diizinkan via env (khusus testing)
    if (rows.length === 0 && process.env.ALLOW_TESTING_FALLBACK === 'true') {
        console.log('⚠️ TESTING FALLBACK: Menggunakan user pertama');
        rows = await run('SELECT id, nama, nip FROM kepegawaian.user LIMIT 1');
    }

    return rows;
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
        // CEK USER BERDASARKAN NIP (normalisasi: NIP di DB bisa berformat dengan spasi)
        const userRows = await findUserByNip(connection, userNip, username);

        // Admin (admin_tambun_raya) bisa merupakan akun sistem yang tidak terdaftar
        // sebagai pegawai di tabel user → tetap diizinkan, created_by diisi NULL (kolom nullable).
        if (userRows.length === 0 && !isAdmin) {
            throw new Error('User tidak ditemukan dalam database');
        }

        const userRecord = userRows.length > 0 ? userRows[0] : null;
        const userId = userRecord ? userRecord.id : null;
        console.log('👤 User ditemukan:', userRecord ? userRecord.nama : '(Admin — tidak terdaftar di tabel user)', 'ID:', userId);
        
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
        
        const actorName = userRecord ? userRecord.nama : username;
        console.log(`✅ ${actorName} (${isAdmin ? 'Admin' : 'Katim'}) menambah master pelatihan: ${kode_pelatihan}`);
        
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
        // Dapatkan ID user (normalisasi NIP)
        const [user] = await db.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
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
            // User biasa: hanya melihat jadwal yang SUDAH DIPUBLIKASIKAN & mengundang mereka
            // (jadwal Draft disembunyikan walau user sudah masuk daftar undangan)
            console.log('👤 User biasa: filter jadwal yang diundang (non-Draft)');
            query += ` AND jp.status <> 'Draft'
                AND EXISTS (
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
        // Dapatkan ID user (normalisasi NIP)
        const [user] = await db.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
        );
        
        if (user.length === 0 && !isAdmin && !isKatimRole) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        const userId = user.length > 0 ? user[0].id : null;
        
        // Cek akses: user biasa hanya bisa lihat jika diundang DAN jadwal sudah dipublikasikan
        if (!isAdmin && !isKatimRole) {
            const [cekUndangan] = await db.query(`
                SELECT pp.id
                FROM kepegawaian.peserta_pelatihan pp
                JOIN kepegawaian.jadwal_pelatihan jp ON pp.id_jadwal = jp.id
                WHERE pp.id_jadwal = ? AND pp.id_user = ? AND jp.status <> 'Draft'
            `, [id, userId]);
            
            if (cekUndangan.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke jadwal ini (jadwal belum dipublikasikan atau Anda tidak diundang)'
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
        // CEK USER BERDASARKAN NIP (normalisasi: NIP di DB bisa berformat dengan spasi)
        const userRows = await findUserByNip(connection, userNip, username);

        let penyelenggaraId;   // id_penyelenggara (FK ke tabel user, NOT NULL)
        let penyelenggaraName = null;
        let createdById = null; // created_by: nullable, diisi user bila pembuat terdaftar

        if (userRows.length > 0) {
            // Pembuat terdaftar sebagai pegawai → dialah penyelenggara jadwal.
            penyelenggaraId = userRows[0].id;
            penyelenggaraName = userRows[0].nama;
            createdById = penyelenggaraId;
            console.log('👤 User ditemukan:', penyelenggaraName, 'ID:', penyelenggaraId);
        } else if (isAdmin) {
            // Admin (admin_tambun_raya) yang akunnya bukan pegawai di database tetap boleh
            // membuat jadwal, asalkan memilih penyelenggara (pegawai) yang terdaftar.
            const chosenId = parseInt(req.body.id_penyelenggara, 10);
            if (!chosenId) {
                return res.status(400).json({
                    success: false,
                    message: 'Akun admin tidak terdaftar sebagai pegawai. Silakan pilih penyelenggara (pegawai) untuk jadwal ini.'
                });
            }
            const [penyelenggara] = await connection.query(
                'SELECT id, nama FROM kepegawaian.user WHERE id = ?',
                [chosenId]
            );
            if (penyelenggara.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Penyelenggara yang dipilih tidak ditemukan. Silakan pilih penyelenggara yang valid.'
                });
            }
            penyelenggaraId = penyelenggara[0].id;
            penyelenggaraName = penyelenggara[0].nama;
            console.log('👤 Admin (bukan pegawai) memilih penyelenggara:', penyelenggaraName, 'ID:', penyelenggaraId);
        } else {
            throw new Error('User tidak ditemukan dalam database');
        }
        
        // Insert jadwal
        const [result] = await connection.query(`
            INSERT INTO kepegawaian.jadwal_pelatihan 
            (id_pelatihan, id_penyelenggara, nama_penyelenggara, tanggal_mulai, tanggal_selesai, 
             waktu_mulai, waktu_selesai, lokasi, metode, kuota, deskripsi, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
        `, [
            id_pelatihan, penyelenggaraId, nama_penyelenggara || null, tanggal_mulai, tanggal_selesai,
            waktu_mulai || null, waktu_selesai || null, lokasi || null, metode || 'Offline', 
            kuota || null, deskripsi || null, createdById
        ]);
        
        const jadwalId = result.insertId;
        console.log('✅ Jadwal inserted, ID:', jadwalId);
        
        // Insert peserta jika ada
        if (peserta_ids && Array.isArray(peserta_ids) && peserta_ids.length > 0) {
            console.log('📥 Inserting peserta_ids:', peserta_ids);
            
            const pesertaValues = peserta_ids.map(idPeserta => [
                jadwalId, idPeserta, 'Pending', createdById
            ]);
            
            await connection.query(
                'INSERT INTO kepegawaian.peserta_pelatihan (id_jadwal, id_user, status_undangan, created_by) VALUES ?',
                [pesertaValues]
            );
            
            console.log(`✅ ${peserta_ids.length} peserta inserted`);
        }
        
        await connection.commit();
        
        console.log(`✅ ${penyelenggaraName} berhasil membuat jadwal pelatihan ID: ${jadwalId}`);
        
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
        // Cek kepemilikan jadwal (pembuat_nip dinormalisasi agar sebanding dengan token tanpa spasi)
        const [jadwal] = await db.query(`
            SELECT jp.*, REPLACE(u.nip, ' ', '') as pembuat_nip
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
 * Hapus jadwal pelatihan. Admin boleh menghapus jadwal status apa pun;
 * selain admin (katim) hanya bisa menghapus jadwal Draft miliknya sendiri.
 */
router.delete('/jadwal/:id', keycloakAuth, async (req, res) => {
    const { id } = req.params;
    const userNip = getUserNipFromToken(req.user);
    const isAdmin = isAdminTambunRaya(req.user);
    
    try {
        // Cek jadwal (LEFT JOIN karena created_by bisa NULL utk jadwal buatan akun admin sistem)
        const [jadwal] = await db.query(`
            SELECT jp.*, REPLACE(u.nip, ' ', '') as pembuat_nip
            FROM kepegawaian.jadwal_pelatihan jp
            LEFT JOIN kepegawaian.user u ON jp.created_by = u.id
            WHERE jp.id = ?
        `, [id]);
        
        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        // Non-admin (katim): hanya pembuat dan hanya jadwal berstatus Draft
        if (!isAdmin) {
            if (jadwal[0].pembuat_nip !== userNip) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki izin untuk menghapus jadwal ini'
                });
            }
            if (jadwal[0].status !== 'Draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Hanya jadwal dengan status Draft yang dapat dihapus'
                });
            }
        }
        // Admin: boleh menghapus jadwal status apa pun
        
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

/**
 * PUT /api/pelatihan/jadwal/:id/status
 * Mengubah status jadwal (Berlangsung / Selesai / Dibatalkan) — khusus katim/admin.
 * Transisi yang diizinkan:
 *   Draft      → Publik, Dibatalkan
 *   Publik     → Berlangsung, Dibatalkan
 *   Berlangsung → Selesai, Dibatalkan
 *   Selesai    → (terkunci)
 */
router.put('/jadwal/:id/status', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);

    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya katim dan admin yang dapat mengubah status jadwal'
        });
    }

    const { id } = req.params;
    const { status } = req.body;

    const transitions = {
        'Draft': ['Publik', 'Dibatalkan'],
        'Publik': ['Berlangsung', 'Dibatalkan'],
        'Berlangsung': ['Selesai', 'Dibatalkan'],
        'Selesai': []
    };

    if (!status || !['Berlangsung', 'Selesai', 'Dibatalkan', 'Publik'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status tujuan tidak valid'
        });
    }

    try {
        const [jadwal] = await db.query(
            'SELECT id, status FROM kepegawaian.jadwal_pelatihan WHERE id = ?',
            [id]
        );

        if (jadwal.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }

        const current = jadwal[0].status;
        if (!(transitions[current] || []).includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Tidak dapat mengubah status dari "${current}" menjadi "${status}"`
            });
        }

        await db.query(
            'UPDATE kepegawaian.jadwal_pelatihan SET status = ? WHERE id = ?',
            [status, id]
        );

        res.status(200).json({
            success: true,
            message: `Status jadwal berhasil diubah menjadi ${status}`,
            data: { id: Number(id), status }
        });
    } catch (error) {
        console.error('Error mengubah status jadwal:', error);
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
        // Dapatkan ID user yang menambah (normalisasi NIP)
        const [user] = await connection.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
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
        // Dapatkan ID verifikator (normalisasi NIP)
        const [verifier] = await connection.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
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

// ========== MONITORING SERTIFIKAT PESERTA ==========

/**
 * GET /api/pelatihan/monitor/sertifikat
 * Monitoring peserta yang SUDAH/BELUM upload sertifikat ke Riwayat Pelatihan (user_kompetensi),
 * berdasarkan kompetensi yang terkait dengan pelatihan (pelatihan_kompetensi dari master_pelatihan
 * yang dipilih saat membuat jadwal). Bisa dimonitor per nama pelatihan.
 *
 * Default: jadwal berstatus 'Selesai' & peserta dengan undangan 'Diterima'.
 * Query params: ?status=Selesai (opsional) & search= (cari nama/kode pelatihan / nama peserta)
 */
router.get('/monitor/sertifikat', keycloakAuth, async (req, res) => {
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);

    // Hanya katim dan admin yang boleh melihat
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya katim dan admin yang dapat melihat monitoring sertifikat'
        });
    }

    const { status = 'Selesai', search, jadwal_id } = req.query;

    try {
        let where = `jp.status = ? AND pp.status_undangan = 'Diterima'`;
        const params = [status];
        if (jadwal_id) {
            where += ` AND jp.id = ?`;
            params.push(jadwal_id);
        }
        if (search) {
            where += ` AND (mp.nama_pelatihan LIKE ? OR mp.kode_pelatihan LIKE ? OR u.nama LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        const query = `
            SELECT
                jp.id as jadwal_id,
                jp.status as jadwal_status,
                jp.tanggal_mulai,
                jp.tanggal_selesai,
                jp.lokasi,
                mp.id as id_pelatihan,
                mp.kode_pelatihan,
                mp.nama_pelatihan,
                pp.id as peserta_id,
                pp.id_user,
                pp.status_undangan,
                pp.status_kehadiran,
                pp.nilai,
                u.nama as user_nama,
                u.nip as user_nip,
                f.nama_fungsi,
                jb.nama_jabatan,
                uk.id as uk_id,
                uk.id_kompetensi,
                uk.tanggal_dipenuhi,
                uk.bukti,
                uk.nilai as uk_nilai,
                uk.status as uk_status,
                uk.hasil_verif,
                uk.verified_at,
                mk.kode_kompetensi,
                mk.nama_kompetensi
            FROM kepegawaian.peserta_pelatihan pp
            JOIN kepegawaian.jadwal_pelatihan jp ON pp.id_jadwal = jp.id
            JOIN kepegawaian.master_pelatihan mp ON jp.id_pelatihan = mp.id
            JOIN kepegawaian.user u ON pp.id_user = u.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.jabatan jb ON u.id_jabatan = jb.id
            LEFT JOIN kepegawaian.pelatihan_kompetensi pk ON pk.id_pelatihan = mp.id
            LEFT JOIN kepegawaian.master_kompetensi mk ON pk.id_kompetensi = mk.id
            LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_user = pp.id_user
                AND uk.id_kompetensi = pk.id_kompetensi
                AND uk.bukti IS NOT NULL AND uk.bukti <> ''
            WHERE ${where}
            ORDER BY mp.nama_pelatihan ASC, jp.tanggal_mulai DESC, u.nama ASC
        `;

        const [rows] = await db.query(query, params);

        // Kelompokkan: jadwal -> peserta -> kompetensi[] (status upload per kompetensi).
        // Jika pelatihan punya >1 kompetensi terkait, masing-masing kompetensi dipantau sendiri.
        const jadwalMap = new Map();
        let totalPeserta = 0;

        for (const r of rows) {
            let jadwal = jadwalMap.get(r.jadwal_id);
            if (!jadwal) {
                jadwal = {
                    jadwal_id: r.jadwal_id,
                    status: r.jadwal_status,
                    tanggal_mulai: r.tanggal_mulai,
                    tanggal_selesai: r.tanggal_selesai,
                    lokasi: r.lokasi,
                    id_pelatihan: r.id_pelatihan,
                    kode_pelatihan: r.kode_pelatihan,
                    nama_pelatihan: r.nama_pelatihan,
                    kompetensi_pelatihan: [],
                    peserta: new Map()
                };
                jadwalMap.set(r.jadwal_id, jadwal);
            }

            // Kompetensi yang dicakup pelatihan ini (untuk info)
            if (r.kode_kompetensi && !jadwal.kompetensi_pelatihan.some(k => k.kode === r.kode_kompetensi)) {
                jadwal.kompetensi_pelatihan.push({
                    kode: r.kode_kompetensi,
                    nama: r.nama_kompetensi
                });
            }

            let p = jadwal.peserta.get(r.peserta_id);
            if (!p) {
                totalPeserta++;
                p = {
                    peserta_id: r.peserta_id,
                    id_user: r.id_user,
                    user_nama: r.user_nama,
                    user_nip: r.user_nip,
                    nama_fungsi: r.nama_fungsi,
                    nama_jabatan: r.nama_jabatan,
                    status_undangan: r.status_undangan,
                    status_kehadiran: r.status_kehadiran,
                    kompetensi: []
                };
                jadwal.peserta.set(r.peserta_id, p);
            }

            // Satu baris per kompetensi pelatihan — catat status upload utk kompetensi tsb
            if (r.kode_kompetensi && !p.kompetensi.some(k => k.id_kompetensi === r.id_kompetensi)) {
                p.kompetensi.push({
                    id_kompetensi: r.id_kompetensi,
                    kode: r.kode_kompetensi,
                    nama: r.nama_kompetensi,
                    sudah: !!r.uk_id,
                    sertifikat: r.uk_id ? {
                        uk_id: r.uk_id,
                        tanggal_dipenuhi: r.tanggal_dipenuhi,
                        bukti: r.bukti,
                        nilai: r.uk_nilai,
                        status: r.uk_status,
                        hasil_verif: r.hasil_verif,
                        verified_at: r.verified_at
                    } : null
                });
            }
        }

        // Finalisasi: hitung per peserta & ringkasan (level peserta & level kompetensi)
        let totalKompetensi = 0;
        let sudahKompetensi = 0;
        let pesertaLengkap = 0;

        const jadwalList = [];
        for (const jadwal of jadwalMap.values()) {
            const pesertaList = [];
            for (const p of jadwal.peserta.values()) {
                p.jumlah_kompetensi = p.kompetensi.length;
                p.sudah_kompetensi = p.kompetensi.filter(k => k.sudah).length;
                // Peserta dianggap "lengkap" bila SEMUA kompetensi terkait sudah di-upload sertifikatnya
                p.sudah_upload = p.jumlah_kompetensi > 0 && p.sudah_kompetensi === p.jumlah_kompetensi;
                totalKompetensi += p.jumlah_kompetensi;
                sudahKompetensi += p.sudah_kompetensi;
                if (p.sudah_upload) pesertaLengkap++;
                pesertaList.push(p);
            }
            jadwal.peserta = pesertaList;
            jadwalList.push(jadwal);
        }

        res.status(200).json({
            success: true,
            data: {
                ringkasan: {
                    total_jadwal: jadwalList.length,
                    total_peserta: totalPeserta,
                    // Peserta yang sudah upload SEMUA kompetensi / belum lengkap
                    sudah_upload: pesertaLengkap,
                    belum_upload: totalPeserta - pesertaLengkap,
                    // Level kompetensi (relevan jika 1 pelatihan punya banyak kompetensi)
                    total_kompetensi: totalKompetensi,
                    sudah_kompetensi: sudahKompetensi,
                    belum_kompetensi: totalKompetensi - sudahKompetensi
                },
                jadwal: jadwalList
            }
        });
    } catch (error) {
        console.error('❌ Error monitoring sertifikat:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
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
        // Dapatkan ID user (normalisasi NIP)
        const [user] = await db.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
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
            WHERE pp.id_user = ? AND jp.status <> 'Draft'
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
        const [peserta] = await db.query(`
            SELECT pp.id_user, jp.status, jp.id as jadwal_id
            FROM kepegawaian.peserta_pelatihan pp
            JOIN kepegawaian.jadwal_pelatihan jp ON pp.id_jadwal = jp.id
            WHERE pp.id = ?
        `, [id]);

        if (peserta.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Undangan tidak ditemukan'
            });
        }

        // Undangan pada jadwal Draft belum bisa dikonfirmasi (tunggu dipublikasikan)
        if (peserta[0].status === 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Undangan belum dapat dikonfirmasi karena jadwal masih berstatus Draft. Tunggu hingga jadwal dipublikasikan.'
            });
        }

        // Hanya user yang diundang yang boleh merespon undangannya
        const userNip = getUserNipFromToken(req.user);
        const [user] = await db.query(
            `SELECT id FROM kepegawaian.user WHERE REPLACE(nip, ' ', '') = ?`,
            [normalizeNip(userNip)]
        );
        if (user.length === 0 || user[0].id !== peserta[0].id_user) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak berhak merespon undangan ini'
            });
        }

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

module.exports = router;