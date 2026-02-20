// backend/routes/pengajuan.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');

// ========== HELPER FUNCTIONS UNTUK QUERY FILTER BERDASARKAN ROLE ==========

/**
 * Mendapatkan NIP dari token (preferred_username)
 */
function getUserNipFromToken(user) {
    if (!user) return null;
    
    // preferred_username dari token Keycloak berisi NIP
    const nip = user.preferred_username || user.username;
    
    console.log(`🔍 Getting NIP from token:`, {
        preferred_username: user.preferred_username,
        username: user.username,
        extractedNip: nip
    });
    
    return nip;
}

/**
 * Helper function untuk mengecek apakah user adalah admin_tambun_raya
 */
function isAdminTambunRaya(user) {
    if (!user) return false;
    
    // Cek dari extractedRoles atau role property
    const roles = user.extractedRoles || user.role || [];
    const isAdmin = roles.includes('admin_tambun_raya') || 
                    user.isAdminTambunRaya ||
                    user.preferred_username === 'admin_tambun_raya';
    
    console.log(`🔐 Checking admin_tambun_raya access for ${getUsername(user)}:`, {
        roles: roles,
        isAdminTambunRaya: isAdmin
    });
    
    return isAdmin;
}

/**
 * Helper function untuk mengecek apakah user adalah katim
 */
function isKatim(user) {
    if (!user) return false;
    
    const roles = user.extractedRoles || user.role || [];
    const isKatim = roles.includes('katim');
    
    console.log(`🔐 Checking katim access for ${getUsername(user)}:`, {
        roles: roles,
        isKatim: isKatim
    });
    
    return isKatim;
}

/**
 * Helper function untuk mendapatkan user ID berdasarkan NIP dari token
 */
async function getUserIdFromNip(user) {
    const nip = getUserNipFromToken(user);
    if (!nip) return null;
    
    try {
        const [rows] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [nip]
        );
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.error('Error getting user ID from NIP:', error);
        return null;
    }
}

/**
 * Mendapatkan semua roles user untuk logging
 */
function getUserRoles(user) {
    return user.extractedRoles || user.role || [];
}

// ========== PENGAJUAN KOMPETENSI ==========

/**
 * GET /api/pengajuan/kompetensi-baru
 * Mendapatkan daftar kompetensi yang belum dipenuhi oleh user tertentu
 * Untuk membuat pengajuan baru (hanya untuk user sendiri atau katim/admin)
 */
router.get('/kompetensi-baru', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const { user_id } = req.query;
    
    console.log(`📋 ${username} (NIP: ${userNip}) mengakses daftar kompetensi baru untuk user_id: ${user_id || 'diri sendiri'}`);
    
    try {
        // Dapatkan role user
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        
        // Tentukan user_id yang akan dianalisis
        let targetUserId = user_id;
        
        if (!targetUserId) {
            // Jika tidak ada user_id, gunakan user yang login
            const userId = await getUserIdFromNip(req.user);
            if (!userId) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan dalam database'
                });
            }
            targetUserId = userId;
        } else {
            // Jika ada user_id, cek akses
            if (!isAdmin && !isKatimRole) {
                // User biasa hanya bisa akses data sendiri
                const userId = await getUserIdFromNip(req.user);
                if (parseInt(targetUserId) !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Anda tidak memiliki izin untuk melihat kompetensi user lain'
                    });
                }
            }
        }
        
        // Ambil data user
        const [userData] = await db.query(`
            SELECT 
                u.id,
                u.nip,
                u.nama,
                u.id_jabatan,
                u.id_jenjang,
                u.id_fungsi,
                u.id_peran,
                j.nama_jabatan,
                jg.nama_jenjang,
                f.nama_fungsi
            FROM kepegawaian.user u
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE u.id = ?
        `, [targetUserId]);
        
        if (userData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        const user = userData[0];
        
        // Parse peran user
        let userPeranIds = [];
        if (user.id_peran) {
            userPeranIds = user.id_peran.split(',').map(id => parseInt(id.trim()));
        }
        
        if (userPeranIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'User tidak memiliki peran',
                data: {
                    user: {
                        id: user.id,
                        nip: user.nip,
                        nama: user.nama,
                        jabatan: user.nama_jabatan,
                        jenjang: user.nama_jenjang,
                        fungsi: user.nama_fungsi
                    },
                    kompetensi: [],
                    total: 0
                }
            });
        }
        
        // Ambil kompetensi yang belum dipenuhi user
        const query = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi,
                f.id as id_fungsi,
                p.nama_peran,
                p.id as id_peran,
                km.is_mandatory,
                jg.tingkat as tingkat_diperlukan,
                jg.nama_jenjang as jenjang_diperlukan
            FROM kepegawaian.kompetensi_mapping km
            JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON km.id_peran = p.id
            JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
            WHERE km.id_jabatan = ? 
                AND km.id_jenjang = ?
                AND km.id_peran IN (${userPeranIds.map(() => '?').join(',')})
                AND NOT EXISTS (
                    SELECT 1 FROM kepegawaian.user_kompetensi uk
                    WHERE uk.id_kompetensi = mk.id
                        AND uk.id_user = ?
                        AND uk.status = 'Lulus'
                )
            ORDER BY p.nama_peran, mk.kode_kompetensi
        `;
        
        const params = [user.id_jabatan, user.id_jenjang, ...userPeranIds, targetUserId];
        const [kompetensi] = await db.query(query, params);
        
        // Kelompokkan berdasarkan peran
        const byPeran = {};
        kompetensi.forEach(k => {
            if (!byPeran[k.nama_peran]) {
                byPeran[k.nama_peran] = {
                    total: 0,
                    kompetensi: []
                };
            }
            byPeran[k.nama_peran].total++;
            byPeran[k.nama_peran].kompetensi.push(k);
        });
        
        res.status(200).json({
            success: true,
            message: 'Daftar kompetensi yang belum dipenuhi berhasil diambil',
            data: {
                user: {
                    id: user.id,
                    nip: user.nip,
                    nama: user.nama,
                    jabatan: user.nama_jabatan,
                    jenjang: user.nama_jenjang,
                    fungsi: user.nama_fungsi
                },
                kompetensi,
                by_peran: byPeran,
                total: kompetensi.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching kompetensi baru:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pengajuan
 * Mendapatkan semua pengajuan kompetensi
 * - Admin Tambun Raya: melihat semua pengajuan
 * - Katim: melihat semua pengajuan (dengan parameter all=true)
 * - User biasa: hanya melihat pengajuan sendiri
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const { status, user_id, all } = req.query;
    
    console.log(`📊 ${username} (NIP: ${userNip}) mengakses daftar pengajuan`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        const requestAllData = all === 'true' || all === '1';
        
        // Dapatkan user ID dari token
        const currentUserId = await getUserIdFromNip(req.user);
        
        let query = `
            SELECT 
                pk.id,
                pk.id_user,
                u.nip,
                u.nama as nama_user,
                j.nama_jabatan as jabatan,
                jg.nama_jenjang as jenjang,
                f.nama_fungsi as fungsi,
                pk.tanggal_pengajuan,
                pk.status_pengajuan,
                pk.catatan_katim,
                pk.disetujui_oleh,
                (SELECT nama FROM kepegawaian.user WHERE id = pk.disetujui_oleh) as nama_penyetuju,
                pk.tanggal_disetujui,
                DATE_FORMAT(pk.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                DATE_FORMAT(pk.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
                COUNT(dpk.id) as jumlah_kompetensi,
                GROUP_CONCAT(mk.kode_kompetensi SEPARATOR ', ') as daftar_kompetensi
            FROM kepegawaian.pengajuan_kompetensi pk
            JOIN kepegawaian.user u ON pk.id_user = u.id
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.detail_pengajuan_kompetensi dpk ON pk.id = dpk.id_pengajuan
            LEFT JOIN kepegawaian.master_kompetensi mk ON dpk.id_kompetensi = mk.id
            WHERE 1=1
        `;
        
        const params = [];
        const conditions = [];
        
        // Filter berdasarkan role
        if (isAdmin) {
            // Admin bisa melihat semua
            console.log('👑 Admin Tambun Raya: can view all pengajuan');
        } else if (isKatimRole && requestAllData) {
            // Katim dengan all=true bisa melihat semua
            console.log('👥 Katim with all=true: can view all pengajuan');
        } else if (isKatimRole && !requestAllData) {
            // Katim tanpa all=true: hanya melihat data sendiri
            if (currentUserId) {
                conditions.push(`pk.id_user = ?`);
                params.push(currentUserId);
            } else {
                conditions.push('1=0');
            }
        } else {
            // User biasa: hanya melihat data sendiri
            if (currentUserId) {
                conditions.push(`pk.id_user = ?`);
                params.push(currentUserId);
            } else {
                conditions.push('1=0');
            }
        }
        
        // Filter tambahan
        if (status && status !== '') {
            conditions.push(`pk.status_pengajuan = ?`);
            params.push(status);
        }
        
        if (user_id && user_id !== '' && (isAdmin || isKatimRole)) {
            conditions.push(`pk.id_user = ?`);
            params.push(parseInt(user_id));
        }
        
        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }
        
        query += ` GROUP BY pk.id ORDER BY pk.created_at DESC`;
        
        console.log('Final query:', query);
        console.log('Params:', params);
        
        const [rows] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            message: 'Daftar pengajuan berhasil diambil',
            data: rows,
            total: rows.length,
            role_info: {
                isAdmin,
                isKatim: isKatimRole,
                access_level: isAdmin ? 'admin' : isKatimRole ? 'katim' : 'user',
                requestAllData
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pengajuan/:id
 * Mendapatkan detail pengajuan berdasarkan ID
 */
router.get('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📋 ${username} mengakses detail pengajuan ID: ${id}`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        const currentUserId = await getUserIdFromNip(req.user);
        
        // Ambil data pengajuan
        const [pengajuan] = await db.query(`
            SELECT 
                pk.*,
                u.nip,
                u.nama as nama_user,
                u.email as email_user,
                u.no_hp as no_hp_user,
                j.nama_jabatan,
                jg.nama_jenjang,
                f.nama_fungsi,
                (SELECT nama FROM kepegawaian.user WHERE id = pk.disetujui_oleh) as nama_penyetuju
            FROM kepegawaian.pengajuan_kompetensi pk
            JOIN kepegawaian.user u ON pk.id_user = u.id
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE pk.id = ?
        `, [id]);
        
        if (pengajuan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengajuan tidak ditemukan'
            });
        }
        
        const data = pengajuan[0];
        
        // Cek akses
        const hasAccess = isAdmin || isKatimRole || data.id_user === currentUserId;
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk melihat pengajuan ini'
            });
        }
        
        // Ambil detail kompetensi yang diajukan
        const [detail] = await db.query(`
            SELECT 
                dpk.id as id_detail,
                dpk.id_kompetensi,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                p.nama_peran,
                f.nama_fungsi,
                dpk.target_tanggal,
                dpk.prioritas,
                dpk.catatan as catatan_detail,
                dpk.created_at as detail_created_at,
                jk.id as id_jadwal,
                jk.tanggal_mulai,
                jk.tanggal_selesai,
                jk.metode,
                jk.penyelenggara,
                jk.lokasi,
                jk.status_jadwal
            FROM kepegawaian.detail_pengajuan_kompetensi dpk
            JOIN kepegawaian.master_kompetensi mk ON dpk.id_kompetensi = mk.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            LEFT JOIN kepegawaian.jadwal_kompetensi jk ON dpk.id = jk.id_detail_pengajuan
            WHERE dpk.id_pengajuan = ?
            ORDER BY 
                CASE dpk.prioritas
                    WHEN 'Urgen' THEN 1
                    WHEN 'Tinggi' THEN 2
                    WHEN 'Sedang' THEN 3
                    WHEN 'Rendah' THEN 4
                END,
                dpk.created_at
        `, [id]);
        
        // Cek kompetensi mana yang sudah dipenuhi
        const [userKompetensi] = await db.query(`
            SELECT id_kompetensi, tanggal_dipenuhi, nilai, status
            FROM kepegawaian.user_kompetensi
            WHERE id_user = ? AND status = 'Lulus'
        `, [data.id_user]);
        
        const dipenuhiSet = new Set(userKompetensi.map(uk => uk.id_kompetensi));
        
        // Tandai kompetensi yang sudah dipenuhi
        const detailWithStatus = detail.map(d => ({
            ...d,
            sudah_dipenuhi: dipenuhiSet.has(d.id_kompetensi)
        }));
        
        res.status(200).json({
            success: true,
            message: 'Detail pengajuan berhasil diambil',
            data: {
                ...data,
                detail: detailWithStatus,
                jumlah_kompetensi: detailWithStatus.length,
                jumlah_sudah_dipenuhi: detailWithStatus.filter(d => d.sudah_dipenuhi).length
            },
            role_info: {
                isAdmin,
                isKatim: isKatimRole,
                can_edit: isAdmin || (isKatimRole && data.status_pengajuan === 'Menunggu Persetujuan Katim'),
                can_delete: isAdmin
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching pengajuan detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/pengajuan
 * Membuat pengajuan kompetensi baru (Draft)
 * - User biasa: untuk diri sendiri
 * - Admin/Katim: bisa untuk user lain
 */
router.post('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id_user, kompetensi_ids, tanggal_pengajuan } = req.body;
    
    console.log(`📝 ${username} membuat pengajuan baru`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        const currentUserId = await getUserIdFromNip(req.user);
        
        // Validasi input
        if (!kompetensi_ids || !Array.isArray(kompetensi_ids) || kompetensi_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Daftar kompetensi harus diisi minimal 1'
            });
        }
        
        // Tentukan user yang mengajukan
        let targetUserId = id_user;
        
        if (!targetUserId) {
            // Jika tidak ada id_user, gunakan user yang login
            targetUserId = currentUserId;
        } else {
            // Jika ada id_user, cek akses
            if (!isAdmin && !isKatimRole) {
                // User biasa hanya bisa untuk diri sendiri
                if (parseInt(targetUserId) !== currentUserId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Anda tidak memiliki izin untuk membuat pengajuan untuk user lain'
                    });
                }
            }
        }
        
        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Cek apakah user valid
        const [userCheck] = await db.query('SELECT id FROM kepegawaian.user WHERE id = ?', [targetUserId]);
        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Mulai transaksi
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Insert pengajuan
            const tanggal = tanggal_pengajuan || new Date().toISOString().split('T')[0];
            const [pengajuanResult] = await connection.query(
                `INSERT INTO kepegawaian.pengajuan_kompetensi 
                 (id_user, tanggal_pengajuan, status_pengajuan) 
                 VALUES (?, ?, 'Draft')`,
                [targetUserId, tanggal]
            );
            
            const pengajuanId = pengajuanResult.insertId;
            
            // Insert detail kompetensi
            for (const id_kompetensi of kompetensi_ids) {
                await connection.query(
                    `INSERT INTO kepegawaian.detail_pengajuan_kompetensi 
                     (id_pengajuan, id_kompetensi) 
                     VALUES (?, ?)`,
                    [pengajuanId, id_kompetensi]
                );
            }
            
            await connection.commit();
            
            res.status(201).json({
                success: true,
                message: 'Pengajuan berhasil dibuat dalam status Draft',
                data: {
                    id: pengajuanId,
                    id_user: targetUserId,
                    tanggal_pengajuan: tanggal,
                    status: 'Draft',
                    jumlah_kompetensi: kompetensi_ids.length
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error creating pengajuan:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kompetensi sudah pernah diajukan dalam pengajuan ini',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * PUT /api/pengajuan/:id/ajukan
 * Mengajukan pengajuan ke Katim (ubah status dari Draft ke Menunggu Persetujuan Katim)
 */
router.put('/:id/ajukan', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📤 ${username} mengajukan pengajuan ID: ${id} ke Katim`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        const currentUserId = await getUserIdFromNip(req.user);
        
        // Cek pengajuan
        const [pengajuan] = await db.query(
            'SELECT * FROM kepegawaian.pengajuan_kompetensi WHERE id = ?',
            [id]
        );
        
        if (pengajuan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengajuan tidak ditemukan'
            });
        }
        
        const data = pengajuan[0];
        
        // Cek akses
        const hasAccess = isAdmin || isKatimRole || data.id_user === currentUserId;
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengajukan pengajuan ini'
            });
        }
        
        // Cek status
        if (data.status_pengajuan !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: `Pengajuan tidak dapat diajukan karena status saat ini: ${data.status_pengajuan}`
            });
        }
        
        // Update status
        await db.query(
            `UPDATE kepegawaian.pengajuan_kompetensi 
             SET status_pengajuan = 'Menunggu Persetujuan Katim', 
                 updated_at = NOW() 
             WHERE id = ?`,
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Pengajuan berhasil diajukan ke Katim',
            data: {
                id: parseInt(id),
                status: 'Menunggu Persetujuan Katim'
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error submitting pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * PUT /api/pengajuan/:id/setujui
 * Menyetujui pengajuan (hanya Katim/Admin)
 * Katim menentukan target tanggal dan prioritas
 */
router.put('/:id/setujui', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { detail, catatan_katim } = req.body;
    
    console.log(`✅ ${username} menyetujui pengajuan ID: ${id}`);
    
    // Cek role: hanya Katim atau Admin
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya Katim atau Admin yang dapat menyetujui pengajuan'
        });
    }
    
    // Validasi detail
    if (!detail || !Array.isArray(detail) || detail.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Detail kompetensi harus diisi (target tanggal dan prioritas)'
        });
    }
    
    try {
        const penyetujuId = await getUserIdFromNip(req.user);
        
        // Cek pengajuan
        const [pengajuan] = await db.query(
            'SELECT * FROM kepegawaian.pengajuan_kompetensi WHERE id = ?',
            [id]
        );
        
        if (pengajuan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengajuan tidak ditemukan'
            });
        }
        
        const data = pengajuan[0];
        
        // Cek status
        if (data.status_pengajuan !== 'Menunggu Persetujuan Katim') {
            return res.status(400).json({
                success: false,
                message: `Pengajuan tidak dapat disetujui karena status saat ini: ${data.status_pengajuan}`
            });
        }
        
        // Mulai transaksi
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Update pengajuan
            await connection.query(
                `UPDATE kepegawaian.pengajuan_kompetensi 
                 SET status_pengajuan = 'Disetujui Katim', 
                     catatan_katim = ?,
                     disetujui_oleh = ?,
                     tanggal_disetujui = NOW(),
                     updated_at = NOW()
                 WHERE id = ?`,
                [catatan_katim || null, penyetujuId, id]
            );
            
            // Update detail kompetensi
            for (const item of detail) {
                await connection.query(
                    `UPDATE kepegawaian.detail_pengajuan_kompetensi 
                     SET target_tanggal = ?,
                         prioritas = ?,
                         catatan = ?
                     WHERE id = ? AND id_pengajuan = ?`,
                    [
                        item.target_tanggal || null,
                        item.prioritas || 'Sedang',
                        item.catatan || null,
                        item.id_detail,
                        id
                    ]
                );
            }
            
            await connection.commit();
            
            res.status(200).json({
                success: true,
                message: 'Pengajuan berhasil disetujui',
                data: {
                    id: parseInt(id),
                    status: 'Disetujui Katim',
                    disetujui_oleh: penyetujuId,
                    tanggal_disetujui: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error approving pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * PUT /api/pengajuan/:id/tolak
 * Menolak pengajuan (hanya Katim/Admin)
 */
router.put('/:id/tolak', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { alasan_penolakan } = req.body;
    
    console.log(`❌ ${username} menolak pengajuan ID: ${id}`);
    
    // Cek role: hanya Katim atau Admin
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya Katim atau Admin yang dapat menolak pengajuan'
        });
    }
    
    try {
        // Cek pengajuan
        const [pengajuan] = await db.query(
            'SELECT * FROM kepegawaian.pengajuan_kompetensi WHERE id = ?',
            [id]
        );
        
        if (pengajuan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengajuan tidak ditemukan'
            });
        }
        
        const data = pengajuan[0];
        
        // Cek status
        if (data.status_pengajuan !== 'Menunggu Persetujuan Katim') {
            return res.status(400).json({
                success: false,
                message: `Pengajuan tidak dapat ditolak karena status saat ini: ${data.status_pengajuan}`
            });
        }
        
        // Update status
        await db.query(
            `UPDATE kepegawaian.pengajuan_kompetensi 
             SET status_pengajuan = 'Ditolak', 
                 catatan_katim = ?,
                 updated_at = NOW() 
             WHERE id = ?`,
            [alasan_penolakan || 'Pengajuan ditolak', id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Pengajuan berhasil ditolak',
            data: {
                id: parseInt(id),
                status: 'Ditolak'
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error rejecting pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/pengajuan/:id/jadwal
 * Membuat jadwal untuk detail pengajuan (setelah disetujui)
 */
router.post('/:id/jadwal', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { id_detail, tanggal_mulai, tanggal_selesai, metode, penyelenggara, lokasi } = req.body;
    
    console.log(`📅 ${username} membuat jadwal untuk pengajuan ID: ${id}`);
    
    // Cek role: hanya Katim atau Admin
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya Katim atau Admin yang dapat membuat jadwal'
        });
    }
    
    // Validasi
    if (!id_detail || !tanggal_mulai) {
        return res.status(400).json({
            success: false,
            message: 'ID Detail dan Tanggal Mulai harus diisi'
        });
    }
    
    try {
        // Cek detail pengajuan
        const [detail] = await db.query(
            `SELECT dpk.*, pk.status_pengajuan 
             FROM kepegawaian.detail_pengajuan_kompetensi dpk
             JOIN kepegawaian.pengajuan_kompetensi pk ON dpk.id_pengajuan = pk.id
             WHERE dpk.id = ? AND dpk.id_pengajuan = ?`,
            [id_detail, id]
        );
        
        if (detail.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Detail pengajuan tidak ditemukan'
            });
        }
        
        if (detail[0].status_pengajuan !== 'Disetujui Katim') {
            return res.status(400).json({
                success: false,
                message: 'Jadwal hanya dapat dibuat untuk pengajuan yang sudah disetujui'
            });
        }
        
        // Insert jadwal
        const [result] = await db.query(
            `INSERT INTO kepegawaian.jadwal_kompetensi 
             (id_detail_pengajuan, tanggal_mulai, tanggal_selesai, metode, penyelenggara, lokasi, status_jadwal) 
             VALUES (?, ?, ?, ?, ?, ?, 'Direncanakan')`,
            [id_detail, tanggal_mulai, tanggal_selesai || null, metode || 'Pelatihan Internal', penyelenggara || null, lokasi || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Jadwal berhasil dibuat',
            data: {
                id_jadwal: result.insertId,
                id_detail,
                tanggal_mulai,
                tanggal_selesai,
                metode: metode || 'Pelatihan Internal',
                status: 'Direncanakan'
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error creating jadwal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * PUT /api/pengajuan/jadwal/:id
 * Update jadwal kompetensi
 */
router.put('/jadwal/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { tanggal_mulai, tanggal_selesai, metode, penyelenggara, lokasi, status_jadwal } = req.body;
    
    console.log(`✏️ ${username} mengupdate jadwal ID: ${id}`);
    
    // Cek role: hanya Katim atau Admin
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya Katim atau Admin yang dapat mengupdate jadwal'
        });
    }
    
    try {
        const updates = [];
        const params = [];
        
        if (tanggal_mulai) {
            updates.push('tanggal_mulai = ?');
            params.push(tanggal_mulai);
        }
        if (tanggal_selesai !== undefined) {
            updates.push('tanggal_selesai = ?');
            params.push(tanggal_selesai);
        }
        if (metode) {
            updates.push('metode = ?');
            params.push(metode);
        }
        if (penyelenggara !== undefined) {
            updates.push('penyelenggara = ?');
            params.push(penyelenggara);
        }
        if (lokasi !== undefined) {
            updates.push('lokasi = ?');
            params.push(lokasi);
        }
        if (status_jadwal) {
            updates.push('status_jadwal = ?');
            params.push(status_jadwal);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang diupdate'
            });
        }
        
        params.push(id);
        
        const [result] = await db.query(
            `UPDATE kepegawaian.jadwal_kompetensi SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Jadwal berhasil diupdate',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error updating jadwal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * DELETE /api/pengajuan/:id
 * Menghapus pengajuan (hanya Admin, atau user sendiri jika masih Draft)
 */
router.delete('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`🗑️ ${username} menghapus pengajuan ID: ${id}`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const currentUserId = await getUserIdFromNip(req.user);
        
        // Cek pengajuan
        const [pengajuan] = await db.query(
            'SELECT * FROM kepegawaian.pengajuan_kompetensi WHERE id = ?',
            [id]
        );
        
        if (pengajuan.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengajuan tidak ditemukan'
            });
        }
        
        const data = pengajuan[0];
        
        // Cek akses
        const canDelete = isAdmin || (data.id_user === currentUserId && data.status_pengajuan === 'Draft');
        
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk menghapus pengajuan ini'
            });
        }
        
        // Hapus (cascade akan menghapus detail dan jadwal karena ON DELETE CASCADE)
        await db.query('DELETE FROM kepegawaian.pengajuan_kompetensi WHERE id = ?', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Pengajuan berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error deleting pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pengajuan/stats/dashboard
 * Mendapatkan statistik pengajuan untuk dashboard
 */
router.get('/stats/dashboard', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    
    console.log(`📊 ${username} mengakses statistik pengajuan`);
    
    try {
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        const currentUserId = await getUserIdFromNip(req.user);
        
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status_pengajuan = 'Draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status_pengajuan = 'Menunggu Persetujuan Katim' THEN 1 ELSE 0 END) as menunggu,
                SUM(CASE WHEN status_pengajuan = 'Disetujui Katim' THEN 1 ELSE 0 END) as disetujui,
                SUM(CASE WHEN status_pengajuan = 'Ditolak' THEN 1 ELSE 0 END) as ditolak,
                SUM(CASE WHEN status_pengajuan = 'Selesai' THEN 1 ELSE 0 END) as selesai
            FROM kepegawaian.pengajuan_kompetensi
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filter berdasarkan role
        if (!isAdmin && !isKatimRole) {
            // User biasa hanya melihat milik sendiri
            query += ` AND id_user = ?`;
            params.push(currentUserId);
        }
        
        const [stats] = await db.query(query, params);
        
        // Statistik tambahan untuk Katim/Admin
        let tambahan = {};
        if (isAdmin || isKatimRole) {
            const [perluPersetujuan] = await db.query(`
                SELECT COUNT(*) as jumlah
                FROM kepegawaian.pengajuan_kompetensi
                WHERE status_pengajuan = 'Menunggu Persetujuan Katim'
            `);
            
            const [jadwalMendatang] = await db.query(`
                SELECT COUNT(*) as jumlah
                FROM kepegawaian.jadwal_kompetensi jk
                JOIN kepegawaian.detail_pengajuan_kompetensi dpk ON jk.id_detail_pengajuan = dpk.id
                JOIN kepegawaian.pengajuan_kompetensi pk ON dpk.id_pengajuan = pk.id
                WHERE jk.status_jadwal = 'Direncanakan'
                    AND jk.tanggal_mulai >= CURDATE()
            `);
            
            tambahan = {
                perlu_persetujuan: perluPersetujuan[0].jumlah,
                jadwal_mendatang: jadwalMendatang[0].jumlah
            };
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...stats[0],
                ...tambahan
            },
            role_info: {
                isAdmin,
                isKatim: isKatimRole,
                access_level: isAdmin ? 'admin' : isKatimRole ? 'katim' : 'user'
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching pengajuan stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pengajuan/export/excel
 * Export data pengajuan ke Excel (hanya Admin/Katim)
 */
router.get('/export/excel', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { start_date, end_date, status } = req.query;
    
    console.log(`📊 ${username} mengexport data pengajuan ke Excel`);
    
    // Hanya Admin/Katim yang bisa export
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    
    if (!isAdmin && !isKatimRole) {
        return res.status(403).json({
            success: false,
            message: 'Hanya Admin atau Katim yang dapat mengexport data'
        });
    }
    
    try {
        let query = `
            SELECT 
                pk.id,
                u.nip,
                u.nama as nama_user,
                j.nama_jabatan as jabatan,
                jg.nama_jenjang as jenjang,
                f.nama_fungsi as fungsi,
                pk.tanggal_pengajuan,
                pk.status_pengajuan,
                pk.catatan_katim,
                (SELECT nama FROM kepegawaian.user WHERE id = pk.disetujui_oleh) as nama_penyetuju,
                pk.tanggal_disetujui,
                COUNT(dpk.id) as jumlah_kompetensi,
                GROUP_CONCAT(mk.kode_kompetensi SEPARATOR '; ') as daftar_kompetensi
            FROM kepegawaian.pengajuan_kompetensi pk
            JOIN kepegawaian.user u ON pk.id_user = u.id
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            LEFT JOIN kepegawaian.detail_pengajuan_kompetensi dpk ON pk.id = dpk.id_pengajuan
            LEFT JOIN kepegawaian.master_kompetensi mk ON dpk.id_kompetensi = mk.id
            WHERE 1=1
        `;
        
        const params = [];
        const conditions = [];
        
        if (start_date) {
            conditions.push(`DATE(pk.tanggal_pengajuan) >= ?`);
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push(`DATE(pk.tanggal_pengajuan) <= ?`);
            params.push(end_date);
        }
        
        if (status && status !== '') {
            conditions.push(`pk.status_pengajuan = ?`);
            params.push(status);
        }
        
        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }
        
        query += ` GROUP BY pk.id ORDER BY pk.tanggal_pengajuan DESC`;
        
        const [rows] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            data: rows,
            total: rows.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error exporting pengajuan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

module.exports = router;