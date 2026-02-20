// backend/routes/pegawai.js
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
                    user.preferred_username === 'admin_tambun_raya'; // Fallback check
    
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
 * Build WHERE clause berdasarkan role user untuk GET / (mendapatkan semua data)
 * 
 * @param {Object} user - User object dari token
 * @param {boolean} requestAllData - Apakah user meminta semua data (parameter all=true)
 * @returns {Object} - { whereClause: string, params: array }
 */
function buildUserWhereClause(user, requestAllData = false) {
    const userNip = getUserNipFromToken(user);
    const isAdmin = isAdminTambunRaya(user);
    const isKatimRole = isKatim(user);
    
    console.log(`🔧 Building WHERE clause for user:`, {
        user: getUsername(user),
        roles: user.extractedRoles || user.role,
        userNip: userNip,
        isAdminTambunRaya: isAdmin,
        isKatim: isKatimRole,
        requestAllData: requestAllData
    });
    
    // Admin Tambun Raya: bisa melihat semua data
    if (isAdmin) {
        console.log('👑 Admin Tambun Raya: can view all data');
        return { whereClause: '', params: [] };
    }
    
    // Katim: bisa melihat semua data jika requestAllData = true
    if (isKatimRole && requestAllData) {
        console.log('👥 Katim requesting all data - can view all data');
        return { whereClause: '', params: [] };
    }
    
    // Katim tanpa parameter all=true: tetap hanya melihat data sendiri
    if (isKatimRole && !requestAllData) {
        console.log('👥 Katim without all parameter - can only view own data');
        if (!userNip) {
            console.log('⚠️ User NIP not found in token, returning no results');
            return { whereClause: '1=0', params: [] };
        }
        return { 
            whereClause: 'u.nip = ?', 
            params: [userNip] 
        };
    }
    
    // Regular User: hanya bisa melihat data mereka sendiri berdasarkan NIP dari token
    console.log('👤 Regular User: can only view own data based on NIP from token');
    
    // Validasi userNip
    if (!userNip) {
        console.log('⚠️ User NIP not found in token, returning no results');
        return { whereClause: '1=0', params: [] }; // Kondisi yang selalu false
    }
    
    console.log(`🔍 Filtering by NIP from token: ${userNip}`);
    return { 
        whereClause: 'u.nip = ?', 
        params: [userNip] 
    };
}

/**
 * Build WHERE clause untuk query single item berdasarkan role user
 * 
 * @param {Object} user - User object dari token
 * @param {number|string} itemId - ID item yang diakses
 * @param {string} tableAlias - Alias tabel (optional)
 * @param {string} idColumn - Nama kolom ID (default: 'id')
 * @returns {Object} - { whereClause: string, params: array }
 */
function buildSingleItemWhereClause(user, itemId, tableAlias = '', idColumn = 'id') {
    const userNip = getUserNipFromToken(user);
    const alias = tableAlias ? `${tableAlias}.` : '';
    const isAdmin = isAdminTambunRaya(user);
    const isKatimRole = isKatim(user);
    
    console.log(`🔧 Building single item WHERE clause for user:`, {
        user: getUsername(user),
        roles: user.extractedRoles || user.role,
        userNip: userNip,
        isAdminTambunRaya: isAdmin,
        isKatim: isKatimRole,
        itemId: itemId
    });
    
    // Admin Tambun Raya: bisa mengakses semua data
    if (isAdmin) {
        console.log('👑 Admin Tambun Raya: can access all data');
        return { 
            whereClause: `${alias}${idColumn} = ?`, 
            params: [itemId]
        };
    }
    
    // Katim: bisa mengakses semua data (view only)
    if (isKatimRole) {
        console.log('👥 Katim: can access all data (view only)');
        return { 
            whereClause: `${alias}${idColumn} = ?`, 
            params: [itemId]
        };
    }
    
    // Regular User: hanya bisa mengakses data mereka sendiri berdasarkan NIP dari token
    console.log('👤 Regular User: can only access own data based on NIP from token');
    
    // Validasi userNip
    if (!userNip) {
        console.log('⚠️ User NIP not found in token, returning no results');
        return { 
            whereClause: '1=0', 
            params: [] 
        };
    }
    
    // Untuk single item, kita perlu memastikan user hanya bisa mengakses data mereka sendiri
    // dengan mencocokkan ID item DAN NIP dari token
    return { 
        whereClause: `${alias}${idColumn} = ? AND u.nip = ?`, 
        params: [itemId, userNip] 
    };
}

/**
 * Mendapatkan semua roles user untuk logging
 */
function getUserRoles(user) {
    return user.extractedRoles || user.role || [];
}

// ========== USER (PEGAWAI) MANAGEMENT ==========

/**
 * GET /api/pegawai
 * Mendapatkan semua data pegawai
 * - Admin Tambun Raya: melihat semua data
 * - Katim: melihat semua data (dengan parameter all=true)
 * - User biasa: hanya melihat data sendiri
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    console.log(`📊 ${username} (NIP from token: ${userNip}) mengakses data pegawai`);
    console.log('🔍 Full user object:', {
        preferred_username: req.user.preferred_username,
        username: req.user.username,
        email: req.user.email,
        roles: req.user.extractedRoles || req.user.role
    });
    
    try {
        const { is_active, id_fungsi, id_jabatan, id_jenjang, search, all } = req.query;
        
        // CEK APAKAH USER MEMINTA SEMUA DATA (UNTUK ROLE KATIM)
        const requestAllData = all === 'true' || all === '1';
        
        // Dapatkan role user
        const userRoles = getUserRoles(req.user);
        const isAdmin = isAdminTambunRaya(req.user);
        const isKatimRole = isKatim(req.user);
        
        console.log(`🔐 User roles:`, userRoles);
        console.log(`🔐 isAdmin: ${isAdmin}, isKatim: ${isKatimRole}, requestAllData: ${requestAllData}`);
        
        // Base query
        let query = `
            SELECT 
                u.id,
                u.nip,
                u.nama,
                u.email,
                u.no_hp,
                DATE_FORMAT(u.tanggal_bergabung, '%Y-%m-%d') as tanggal_bergabung,
                u.is_active,
                u.id_jabatan,
                j.nama_jabatan,
                u.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat,
                u.id_fungsi,
                f.nama_fungsi,
                u.id_peran,
                (
                    SELECT GROUP_CONCAT(p.nama_peran SEPARATOR ', ')
                    FROM kepegawaian.peran p
                    WHERE FIND_IN_SET(p.id, u.id_peran)
                ) as nama_peran,
                DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE 1=1
        `;
        
        const params = [];
        const conditions = [];
        
        // FILTER BERDASARKAN ROLE - Gunakan fungsi buildUserWhereClause dengan parameter requestAllData
        const roleFilter = buildUserWhereClause(req.user, requestAllData);
        if (roleFilter.whereClause) {
            conditions.push(roleFilter.whereClause);
            if (roleFilter.params && roleFilter.params.length > 0) {
                params.push(...roleFilter.params);
            }
            console.log(`🔒 Applying role filter:`, roleFilter.whereClause);
        } else {
            console.log(`🔓 No role filter applied - user can view all data`);
        }
        
        // Filter tambahan dari query params
        if (is_active !== undefined && is_active !== '') {
            conditions.push(`u.is_active = ?`);
            params.push(is_active === 'true' ? 1 : 0);
        }
        
        if (id_fungsi && id_fungsi !== '') {
            conditions.push(`u.id_fungsi = ?`);
            params.push(parseInt(id_fungsi));
        }
        
        if (id_jabatan && id_jabatan !== '') {
            conditions.push(`u.id_jabatan = ?`);
            params.push(parseInt(id_jabatan));
        }
        
        if (id_jenjang && id_jenjang !== '') {
            conditions.push(`u.id_jenjang = ?`);
            params.push(parseInt(id_jenjang));
        }
        
        if (search && search !== '') {
            conditions.push(`(u.nip LIKE ? OR u.nama LIKE ? OR u.email LIKE ?)`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        // Gabungkan semua kondisi
        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY u.nama ASC`;
        
        console.log('Final query:', query);
        console.log('Params:', params);
        
        const [rows] = await db.query(query, params);
        
        console.log(`✅ Found ${rows.length} records for user ${username} (Role: ${isAdmin ? 'Admin' : isKatimRole ? 'Katim' : 'User'})`);
        console.log(`📊 Request all data: ${requestAllData ? 'Yes' : 'No'}`);
        
        res.status(200).json({
            success: true,
            message: 'Data pegawai berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString(),
            debug: {
                userRole: isAdmin ? 'admin' : isKatimRole ? 'katim' : 'user',
                requestAllData,
                filteredByRole: roleFilter.whereClause ? true : false,
                userNip: userNip
            }
        });
    } catch (error) {
        console.error('❌ Error fetching pegawai:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/pegawai/:id
 * Mendapatkan detail pegawai berdasarkan ID
 */
router.get('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const userNip = getUserNipFromToken(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} (NIP from token: ${userNip}) mengakses detail pegawai ID: ${id}`);
    
    try {
        // Cek akses user - gunakan buildSingleItemWhereClause
        const accessCheck = buildSingleItemWhereClause(req.user, id, 'u');
        
        const query = `
            SELECT 
                u.id,
                u.nip,
                u.nama,
                u.email,
                u.no_hp,
                DATE_FORMAT(u.tanggal_bergabung, '%Y-%m-%d') as tanggal_bergabung,
                u.is_active,
                u.id_jabatan,
                j.nama_jabatan,
                u.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat,
                u.id_fungsi,
                f.nama_fungsi,
                u.id_peran,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', p.id,
                            'nama_peran', p.nama_peran
                        )
                    )
                    FROM kepegawaian.peran p
                    WHERE FIND_IN_SET(p.id, u.id_peran)
                ) as daftar_peran,
                DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.user u
            LEFT JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            LEFT JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
        `;
        
        let finalQuery;
        let finalParams;
        
        // Handle kasus khusus
        if (accessCheck.whereClause === '1=0') {
            finalQuery = query + ' WHERE 1=0';
            finalParams = [];
        } else {
            finalQuery = query + ' WHERE ' + accessCheck.whereClause;
            finalParams = accessCheck.params;
        }
        
        console.log('Detail query:', finalQuery);
        console.log('Detail params:', finalParams);
        
        const [rows] = await db.query(finalQuery, finalParams);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan atau anda tidak memiliki akses'
            });
        }
        
        // Parse JSON daftar_peran jika ada
        if (rows[0].daftar_peran) {
            try {
                rows[0].daftar_peran = JSON.parse(rows[0].daftar_peran);
            } catch (e) {
                console.error('Error parsing daftar_peran:', e);
                rows[0].daftar_peran = [];
            }
        } else {
            rows[0].daftar_peran = [];
        }
        
        res.status(200).json({
            success: true,
            message: 'Detail pegawai berhasil diambil',
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching pegawai detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/pegawai
 * Menambahkan pegawai baru - HANYA ADMIN TAMBUN RAYA
 */
router.post('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan pegawai baru`);
    
    // Hanya admin_tambun_raya yang bisa menambah pegawai
    if (!isAdminTambunRaya(req.user)) {
        console.log(`❌ ${username} tidak memiliki izin admin_tambun_raya`);
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data pegawai. Hanya admin_tambun_raya yang diizinkan.'
        });
    }
    
    const { 
        nip, 
        nama, 
        id_jabatan, 
        id_jenjang, 
        id_fungsi, 
        id_peran, 
        email, 
        no_hp, 
        tanggal_bergabung,
        is_active 
    } = req.body;
    
    // Validasi required fields
    if (!nip || !nama || !id_jabatan || !id_jenjang || !id_fungsi || !id_peran) {
        return res.status(400).json({
            success: false,
            message: 'NIP, Nama, Jabatan, Jenjang, Fungsi, dan Peran harus diisi'
        });
    }
    
    // Validasi id_peran harus array dan konversi ke string
    let peranString = '';
    if (Array.isArray(id_peran)) {
        peranString = id_peran.join(',');
    } else if (typeof id_peran === 'string') {
        // Jika sudah string, pastikan formatnya benar (angka dipisah koma)
        const peranArray = id_peran.split(',').map(p => p.trim());
        peranString = peranArray.join(',');
    } else {
        return res.status(400).json({
            success: false,
            message: 'Format id_peran tidak valid, harus array atau string dengan format "1,2,3"'
        });
    }
    
    // Format tanggal
    let formattedTanggal = null;
    if (tanggal_bergabung) {
        if (tanggal_bergabung.includes('T')) {
            formattedTanggal = tanggal_bergabung.split('T')[0];
        } else {
            formattedTanggal = tanggal_bergabung;
        }
    }
    
    try {
        // Cek apakah NIP sudah ada
        const [existingNip] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ?',
            [nip]
        );
        
        if (existingNip.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'NIP sudah terdaftar'
            });
        }
        
        // Cek apakah foreign keys valid
        const [jabatan] = await db.query('SELECT id FROM kepegawaian.jabatan WHERE id = ?', [id_jabatan]);
        const [jenjang] = await db.query('SELECT id FROM kepegawaian.jenjang WHERE id = ?', [id_jenjang]);
        const [fungsi] = await db.query('SELECT id FROM kepegawaian.fungsi WHERE id = ?', [id_fungsi]);
        
        if (jabatan.length === 0 || jenjang.length === 0 || fungsi.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Jabatan, Jenjang, atau Fungsi tidak valid'
            });
        }
        
        const query = `
            INSERT INTO kepegawaian.user 
            (nip, nama, id_jabatan, id_jenjang, id_fungsi, id_peran, email, no_hp, tanggal_bergabung, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            nip, 
            nama, 
            id_jabatan, 
            id_jenjang, 
            id_fungsi, 
            peranString, 
            email || null, 
            no_hp || null, 
            formattedTanggal,
            is_active !== undefined ? (is_active ? 1 : 0) : 1
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Pegawai berhasil ditambahkan',
            data: {
                id: result.insertId,
                nip,
                nama,
                id_jabatan,
                id_jenjang,
                id_fungsi,
                id_peran: peranString
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error adding pegawai:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'NIP sudah ada',
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
 * PUT /api/pegawai/:id
 * Mengupdate pegawai - HANYA ADMIN TAMBUN RAYA
 */
router.put('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate pegawai ID: ${id}`);
    
    // Hanya admin_tambun_raya yang bisa update pegawai
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data pegawai. Hanya admin_tambun_raya yang diizinkan.'
        });
    }
    
    let { 
        nip, 
        nama, 
        id_jabatan, 
        id_jenjang, 
        id_fungsi, 
        id_peran, 
        email, 
        no_hp, 
        tanggal_bergabung,
        is_active 
    } = req.body;
    
    // Validasi required fields
    if (!nip || !nama || !id_jabatan || !id_jenjang || !id_fungsi || !id_peran) {
        return res.status(400).json({
            success: false,
            message: 'NIP, Nama, Jabatan, Jenjang, Fungsi, dan Peran harus diisi'
        });
    }
    
    // Format tanggal
    let formattedTanggal = null;
    if (tanggal_bergabung) {
        if (tanggal_bergabung.includes('T')) {
            formattedTanggal = tanggal_bergabung.split('T')[0];
        } else {
            formattedTanggal = tanggal_bergabung;
        }
    }
    
    // Validasi id_peran
    let peranString = '';
    if (Array.isArray(id_peran)) {
        peranString = id_peran.join(',');
    } else if (typeof id_peran === 'string') {
        const peranArray = id_peran.split(',').map(p => p.trim());
        peranString = peranArray.join(',');
    } else {
        return res.status(400).json({
            success: false,
            message: 'Format id_peran tidak valid'
        });
    }
    
    try {
        // Cek apakah NIP sudah ada (kecuali untuk user ini sendiri)
        const [existingNip] = await db.query(
            'SELECT id FROM kepegawaian.user WHERE nip = ? AND id != ?',
            [nip, id]
        );
        
        if (existingNip.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'NIP sudah digunakan oleh pegawai lain'
            });
        }
        
        const query = `
            UPDATE kepegawaian.user
            SET nip = ?, nama = ?, id_jabatan = ?, id_jenjang = ?, 
                id_fungsi = ?, id_peran = ?, email = ?, no_hp = ?, 
                tanggal_bergabung = ?, is_active = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [
            nip, 
            nama, 
            id_jabatan, 
            id_jenjang, 
            id_fungsi, 
            peranString, 
            email || null, 
            no_hp || null, 
            formattedTanggal,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Pegawai berhasil diupdate',
            data: {
                id: parseInt(id),
                nip,
                nama,
                id_jabatan,
                id_jenjang,
                id_fungsi,
                id_peran: peranString
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating pegawai:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'NIP sudah ada',
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
 * DELETE /api/pegawai/:id
 * Menghapus pegawai (soft delete dengan set is_active = false) - HANYA ADMIN TAMBUN RAYA
 */
router.delete('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menonaktifkan pegawai ID: ${id}`);
    
    // Hanya admin_tambun_raya yang bisa menonaktifkan pegawai
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menonaktifkan pegawai. Hanya admin_tambun_raya yang diizinkan.'
        });
    }
    
    try {
        // Soft delete dengan mengubah is_active menjadi false
        const query = `
            UPDATE kepegawaian.user
            SET is_active = 0
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Pegawai berhasil dinonaktifkan',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deactivating pegawai:', error);
        
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * PATCH /api/pegawai/:id/activate
 * Mengaktifkan kembali pegawai - HANYA ADMIN TAMBUN RAYA
 */
router.patch('/:id/activate', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🔄 ${username} mengaktifkan kembali pegawai ID: ${id}`);
    
    // Hanya admin_tambun_raya yang bisa mengaktifkan pegawai
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengaktifkan pegawai. Hanya admin_tambun_raya yang diizinkan.'
        });
    }
    
    try {
        const query = `
            UPDATE kepegawaian.user
            SET is_active = 1
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Pegawai berhasil diaktifkan kembali',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error activating pegawai:', error);
        
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

// ========== ANALISIS KOMPETENSI ==========

/**
 * GET /api/pegawai/:id/analisis-kenaikan
 * Analisis kenaikan jenjang untuk pegawai - HANYA ADMIN TAMBUN RAYA
 */
/**
 * GET /api/pegawai/:id/analisis-kenaikan
 * Analisis kenaikan jenjang untuk pegawai
 * - Admin Tambun Raya: full access
 * - Katim: view only
 * - User biasa: tidak bisa akses (hanya data sendiri)
 */
router.get('/:id/analisis-kenaikan', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { target_jenjang_id, fungsi_id } = req.query;
    
    console.log(`📊 ${username} menganalisis kenaikan jenjang pegawai ID: ${id} ke jenjang: ${target_jenjang_id}, fungsi: ${fungsi_id}`);
    
    // Dapatkan role user
    const isAdmin = isAdminTambunRaya(req.user);
    const isKatimRole = isKatim(req.user);
    const userNip = getUserNipFromToken(req.user);
    
    console.log(`🔐 User role check - isAdmin: ${isAdmin}, isKatim: ${isKatimRole}`);
    
    // CEK AKSES:
    // 1. Admin: boleh akses semua
    // 2. Katim: boleh akses semua (view only)
    // 3. User biasa: hanya boleh akses data mereka sendiri
    let hasAccess = false;
    let accessMessage = '';
    
    if (isAdmin) {
        hasAccess = true;
        console.log('👑 Admin Tambun Raya: can access analysis');
    } else if (isKatimRole) {
        hasAccess = true;
        console.log('👥 Katim: can access analysis (view only)');
    } else {
        // Untuk user biasa, cek apakah mereka mengakses data mereka sendiri
        // Ambil data pegawai untuk cek NIP
        const [userData] = await db.query(
            'SELECT nip FROM kepegawaian.user WHERE id = ?',
            [id]
        );
        
        if (userData.length > 0 && userData[0].nip === userNip) {
            hasAccess = true;
            console.log('👤 Regular User: accessing own data');
        } else {
            hasAccess = false;
            accessMessage = 'Anda tidak memiliki izin untuk melihat analisis pegawai lain.';
        }
    }
    
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: accessMessage || 'Anda tidak memiliki izin untuk mengakses analisis ini.'
        });
    }
    
    try {
        // Validasi target_jenjang_id
        if (!target_jenjang_id) {
            return res.status(400).json({
                success: false,
                message: 'Target jenjang harus dipilih'
            });
        }
        
        // Validasi fungsi_id
        if (!fungsi_id) {
            return res.status(400).json({
                success: false,
                message: 'Fungsi harus dipilih'
            });
        }
        
        // Ambil data user lengkap dengan fungsi dan peran
        const [userData] = await db.query(`
            SELECT 
                u.*,
                j.nama_jabatan,
                jg.nama_jenjang as nama_jenjang_saat_ini,
                jg.tingkat as tingkat_saat_ini,
                f.nama_fungsi as nama_fungsi_user,
                f.id as id_fungsi_user
            FROM kepegawaian.user u
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE u.id = ?
        `, [id]);
        
        if (userData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan'
            });
        }
        
        const user = userData[0];
        
        // Ambil data target jenjang
        const [targetJenjang] = await db.query(
            'SELECT * FROM kepegawaian.jenjang WHERE id = ?',
            [target_jenjang_id]
        );
        
        if (targetJenjang.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Jenjang target tidak valid'
            });
        }
        
        const target = targetJenjang[0];
        
        // Ambil data fungsi yang dipilih
        const [selectedFungsi] = await db.query(
            'SELECT id, nama_fungsi FROM kepegawaian.fungsi WHERE id = ?',
            [fungsi_id]
        );
        
        if (selectedFungsi.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Fungsi tidak valid'
            });
        }
        
        const fungsi = selectedFungsi[0];
        
        // Parse peran-peran yang dimiliki user
        let userPeran = [];
        let userPeranIds = [];
        if (user.id_peran) {
            if (typeof user.id_peran === 'string') {
                userPeranIds = user.id_peran.split(',').map(id => parseInt(id.trim()));
            } else if (Array.isArray(user.id_peran)) {
                userPeranIds = user.id_peran;
            }
            
            // Ambil nama peran dari tabel peran
            if (userPeranIds.length > 0) {
                const [peranData] = await db.query(
                    `SELECT id, nama_peran FROM kepegawaian.peran WHERE id IN (${userPeranIds.map(() => '?').join(',')})`,
                    userPeranIds
                );
                userPeran = peranData;
            }
        }
        
        // Tentukan mode analisis berdasarkan fungsi yang dipilih
        const isSameFungsi = (parseInt(fungsi_id) === parseInt(user.id_fungsi_user));
        const modeAnalisis = isSameFungsi ? 'sesuai_peran' : 'semua_peran';
        
        console.log('===== DEBUG ANALISIS =====');
        console.log('User ID:', user.id);
        console.log('User Nama:', user.nama);
        console.log('User Jabatan ID:', user.id_jabatan);
        console.log('User Jabatan:', user.nama_jabatan);
        console.log('User Fungsi ID:', user.id_fungsi_user);
        console.log('User Fungsi:', user.nama_fungsi_user);
        console.log('Selected Fungsi ID:', fungsi_id);
        console.log('Selected Fungsi:', fungsi.nama_fungsi);
        console.log('Target Jenjang ID:', target.id);
        console.log('Target Jenjang:', target.nama_jenjang);
        console.log('User Peran IDs:', userPeranIds);
        console.log('User Peran:', userPeran.map(p => p.nama_peran));
        console.log('Mode Analisis:', modeAnalisis);
        
        // Cari tahu ID untuk Universal
        const [universalFungsi] = await db.query(
            `SELECT id FROM kepegawaian.fungsi WHERE LOWER(nama_fungsi) = 'universal' LIMIT 1`
        );
        const universalFungsiId = universalFungsi.length > 0 ? universalFungsi[0].id : null;
        
        const [universalJabatan] = await db.query(
            `SELECT id FROM kepegawaian.jabatan WHERE LOWER(nama_jabatan) = 'universal' LIMIT 1`
        );
        const universalJabatanId = universalJabatan.length > 0 ? universalJabatan[0].id : null;
        
        const [universalJenjang] = await db.query(
            `SELECT id FROM kepegawaian.jenjang WHERE LOWER(nama_jenjang) = 'universal' OR tingkat = 0 LIMIT 1`
        );
        const universalJenjangId = universalJenjang.length > 0 ? universalJenjang[0].id : null;
        
        console.log('Universal Fungsi ID:', universalFungsiId);
        console.log('Universal Jabatan ID:', universalJabatanId);
        console.log('Universal Jenjang ID:', universalJenjangId);
        
        // Jika tidak ada peran, kembalikan data kosong
        if (userPeranIds.length === 0) {
            console.log('❌ User tidak memiliki peran');
            return res.status(200).json({
                success: true,
                message: 'Pegawai tidak memiliki peran',
                data: {
                    user: {
                        id: user.id,
                        nip: user.nip,
                        nama: user.nama,
                        jabatan: user.nama_jabatan,
                        jenjang_saat_ini: user.nama_jenjang_saat_ini,
                        tingkat_saat_ini: user.tingkat_saat_ini,
                        fungsi_user: user.nama_fungsi_user,
                        id_fungsi_user: user.id_fungsi_user,
                        fungsi_analisis: fungsi.nama_fungsi,
                        id_fungsi_analisis: fungsi.id,
                        peran: []
                    },
                    target_jenjang: {
                        id: target.id,
                        nama: target.nama_jenjang,
                        tingkat: target.tingkat
                    },
                    analisis: {
                        total: 0,
                        terpenuhi: 0,
                        belumTerpenuhi: 0,
                        persentase: 0,
                        by_peran: {},
                        detail: []
                    },
                    filter_info: {
                        fungsi_user: user.nama_fungsi_user,
                        fungsi_analisis: fungsi.nama_fungsi,
                        jumlah_peran: 0,
                        daftar_peran: [],
                        mode_analisis: modeAnalisis,
                        is_lintas_fungsi: !isSameFungsi
                    },
                    // Tambahkan info role untuk frontend
                    role_info: {
                        isAdmin,
                        isKatim: isKatimRole,
                        access_level: isAdmin ? 'admin' : isKatimRole ? 'katim' : 'user'
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // BUILD QUERY BERDASARKAN MODE ANALISIS
        let kompetensi = [];
        
        if (isSameFungsi) {
            // MODE 1: Fungsi sendiri → filter berdasarkan peran user
            console.log('🔍 Mode: Sesuai Peran User');
            
            // Query untuk kompetensi sesuai fungsi dan peran user
            // UNTUK PERAN BIASA (seperti Penguji)
            const queryPeranBiasa = `
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
                    CASE 
                        WHEN uk.id_kompetensi IS NOT NULL AND uk.status = 'Lulus' THEN 'TERPENUHI'
                        ELSE 'BELUM TERPENUHI'
                    END as status,
                    uk.tanggal_dipenuhi,
                    uk.nilai
                FROM kepegawaian.kompetensi_mapping km
                JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
                JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
                JOIN kepegawaian.peran p ON km.id_peran = p.id
                LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_kompetensi = mk.id 
                    AND uk.id_user = ? AND uk.status = 'Lulus'
                WHERE km.id_jabatan = ? 
                    AND km.id_jenjang = ?
                    AND mk.id_fungsi = ?
                    AND km.id_peran IN (${userPeranIds.map(() => '?').join(',')})
                ORDER BY p.nama_peran, mk.kode_kompetensi
            `;
            
            const paramsPeranBiasa = [id, user.id_jabatan, target.id, fungsi_id, ...userPeranIds];
            const [kompetensiPeranBiasa] = await db.query(queryPeranBiasa, paramsPeranBiasa);
            kompetensi = kompetensiPeranBiasa;
            
            // TAMBAHKAN KOMPETISI UNTUK PERAN UNIVERSAL (seperti Auditor Internal)
            if (universalFungsiId && universalJabatanId && universalJenjangId) {
                console.log('🔍 Menambahkan kompetensi universal untuk peran user');
                
                // Cari peran yang termasuk dalam kategori universal (berdasarkan id_fungsi)
                const [universalPeran] = await db.query(`
                    SELECT id, nama_peran 
                    FROM kepegawaian.peran 
                    WHERE id_fungsi = ? 
                        AND id IN (${userPeranIds.map(() => '?').join(',')})
                `, [universalFungsiId, ...userPeranIds]);
                
                console.log('Universal Peran:', universalPeran);
                
                if (universalPeran.length > 0) {
                    const universalPeranIds = universalPeran.map(p => p.id);
                    
                    // Query untuk kompetensi universal
                    // - Fungsi: Universal
                    // - Peran: Universal (Auditor Internal)
                    // - Jabatan: PFM ATAU Universal
                    // - Jenjang: Target ATAU Universal
                    const queryUniversal = `
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
                            CASE 
                                WHEN uk.id_kompetensi IS NOT NULL AND uk.status = 'Lulus' THEN 'TERPENUHI'
                                ELSE 'BELUM TERPENUHI'
                            END as status,
                            uk.tanggal_dipenuhi,
                            uk.nilai
                        FROM kepegawaian.kompetensi_mapping km
                        JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
                        JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
                        JOIN kepegawaian.peran p ON km.id_peran = p.id
                        LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_kompetensi = mk.id 
                            AND uk.id_user = ? AND uk.status = 'Lulus'
                        WHERE mk.id_fungsi = ?
                            AND km.id_peran IN (${universalPeranIds.map(() => '?').join(',')})
                            AND (km.id_jabatan = ? OR km.id_jabatan = ?)
                            AND (km.id_jenjang = ? OR km.id_jenjang = ?)
                        ORDER BY p.nama_peran, mk.kode_kompetensi
                    `;
                    
                    const paramsUniversal = [
                        id, 
                        universalFungsiId, 
                        ...universalPeranIds,
                        user.id_jabatan, // PFM
                        universalJabatanId, // Universal
                        target.id, // Jenjang target (Ahli Pertama)
                        universalJenjangId // Jenjang Universal
                    ];
                    
                    const [kompetensiUniversal] = await db.query(queryUniversal, paramsUniversal);
                    
                    // Gabungkan kompetensi (hindari duplikasi)
                    const existingIds = new Set(kompetensi.map(k => k.id));
                    const newKompetensi = kompetensiUniversal.filter(k => !existingIds.has(k.id));
                    
                    kompetensi = [...kompetensi, ...newKompetensi];
                    console.log(`✅ Ditambahkan ${newKompetensi.length} kompetensi universal`);
                }
            }
            
        } else {
            // MODE 2: Fungsi lain → tampilkan semua peran (tanpa filter)
            console.log('🔍 Mode: Semua Peran (Lintas Fungsi)');
            
            // Query untuk kompetensi dari fungsi yang dipilih (tanpa filter peran)
            const queryLain = `
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
                    CASE 
                        WHEN uk.id_kompetensi IS NOT NULL AND uk.status = 'Lulus' THEN 'TERPENUHI'
                        ELSE 'BELUM TERPENUHI'
                    END as status,
                    uk.tanggal_dipenuhi,
                    uk.nilai
                FROM kepegawaian.kompetensi_mapping km
                JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
                JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
                JOIN kepegawaian.peran p ON km.id_peran = p.id
                LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_kompetensi = mk.id 
                    AND uk.id_user = ? AND uk.status = 'Lulus'
                WHERE km.id_jabatan = ? 
                    AND km.id_jenjang = ?
                    AND mk.id_fungsi = ?
                ORDER BY p.nama_peran, mk.kode_kompetensi
            `;
            
            const paramsLain = [id, user.id_jabatan, target.id, fungsi_id];
            const [kompetensiLain] = await db.query(queryLain, paramsLain);
            kompetensi = kompetensiLain;
            
            // Tambahkan juga kompetensi universal untuk semua peran user
            if (universalFungsiId && universalJabatanId && universalJenjangId) {
                console.log('🔍 Menambahkan kompetensi universal untuk lintas fungsi');
                
                // Cari peran yang termasuk dalam kategori universal
                const [universalPeran] = await db.query(`
                    SELECT id, nama_peran 
                    FROM kepegawaian.peran 
                    WHERE id_fungsi = ? 
                        AND id IN (${userPeranIds.map(() => '?').join(',')})
                `, [universalFungsiId, ...userPeranIds]);
                
                if (universalPeran.length > 0) {
                    const universalPeranIds = universalPeran.map(p => p.id);
                    
                    const queryUniversal = `
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
                            CASE 
                                WHEN uk.id_kompetensi IS NOT NULL AND uk.status = 'Lulus' THEN 'TERPENUHI'
                                ELSE 'BELUM TERPENUHI'
                            END as status,
                            uk.tanggal_dipenuhi,
                            uk.nilai
                        FROM kepegawaian.kompetensi_mapping km
                        JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
                        JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
                        JOIN kepegawaian.peran p ON km.id_peran = p.id
                        LEFT JOIN kepegawaian.user_kompetensi uk ON uk.id_kompetensi = mk.id 
                            AND uk.id_user = ? AND uk.status = 'Lulus'
                        WHERE mk.id_fungsi = ?
                            AND km.id_peran IN (${universalPeranIds.map(() => '?').join(',')})
                            AND (km.id_jabatan = ? OR km.id_jabatan = ?)
                            AND (km.id_jenjang = ? OR km.id_jenjang = ?)
                        ORDER BY p.nama_peran, mk.kode_kompetensi
                    `;
                    
                    const paramsUniversal = [
                        id, 
                        universalFungsiId, 
                        ...universalPeranIds,
                        user.id_jabatan,
                        universalJabatanId,
                        target.id,
                        universalJenjangId
                    ];
                    
                    const [kompetensiUniversal] = await db.query(queryUniversal, paramsUniversal);
                    
                    const existingIds = new Set(kompetensi.map(k => k.id));
                    const newKompetensi = kompetensiUniversal.filter(k => !existingIds.has(k.id));
                    
                    kompetensi = [...kompetensi, ...newKompetensi];
                    console.log(`✅ Ditambahkan ${newKompetensi.length} kompetensi universal`);
                }
            }
        }
        
        console.log(`✅ Total ditemukan ${kompetensi.length} kompetensi`);
        
        // Ambil kompetensi yang sudah dimiliki user
        const [kompetensiDimiliki] = await db.query(`
            SELECT 
                uk.id_kompetensi,
                uk.tanggal_dipenuhi,
                uk.nilai,
                uk.status,
                mk.kode_kompetensi,
                mk.nama_kompetensi
            FROM kepegawaian.user_kompetensi uk
            JOIN kepegawaian.master_kompetensi mk ON uk.id_kompetensi = mk.id
            WHERE uk.id_user = ? AND uk.status = 'Lulus'
        `, [id]);
        
        console.log(`User memiliki ${kompetensiDimiliki.length} kompetensi yang sudah lulus`);
        
        const dimilikiSet = new Set(kompetensiDimiliki.map(k => k.id_kompetensi));
        
        // Hitung statistik
        const total = kompetensi.length;
        const terpenuhi = kompetensi.filter(k => dimilikiSet.has(k.id)).length;
        const belumTerpenuhi = total - terpenuhi;
        const persentase = total > 0 ? Math.round((terpenuhi / total) * 100) : 0;
        
        // Kelompokkan berdasarkan peran
        const byPeran = {};
        kompetensi.forEach(k => {
            if (!byPeran[k.nama_peran]) {
                byPeran[k.nama_peran] = {
                    total: 0,
                    terpenuhi: 0,
                    kompetensi: []
                };
            }
            byPeran[k.nama_peran].total++;
            if (dimilikiSet.has(k.id)) byPeran[k.nama_peran].terpenuhi++;
            byPeran[k.nama_peran].kompetensi.push(k);
        });
        
        // Hitung persentase per peran
        Object.keys(byPeran).forEach(peran => {
            byPeran[peran].persentase = Math.round((byPeran[peran].terpenuhi / byPeran[peran].total) * 100);
        });
        
        // Dapatkan daftar peran unik dari kompetensi
        const uniquePeran = [...new Set(kompetensi.map(k => k.nama_peran))];
        
        // Tandai peran mana yang dimiliki user
        const userPeranSet = new Set(userPeran.map(p => p.nama_peran));
        const peranWithOwnership = uniquePeran.map(peran => ({
            nama: peran,
            dimiliki: userPeranSet.has(peran)
        }));
        
        // Response dengan informasi role
        res.status(200).json({
            success: true,
            message: 'Analisis kenaikan jenjang berhasil',
            data: {
                user: {
                    id: user.id,
                    nip: user.nip,
                    nama: user.nama,
                    jabatan: user.nama_jabatan,
                    jenjang_saat_ini: user.nama_jenjang_saat_ini,
                    tingkat_saat_ini: user.tingkat_saat_ini,
                    fungsi_user: user.nama_fungsi_user,
                    id_fungsi_user: user.id_fungsi_user,
                    fungsi_analisis: fungsi.nama_fungsi,
                    id_fungsi_analisis: fungsi.id,
                    peran: userPeran,
                    nama_peran: userPeran.map(p => p.nama_peran).join(', ')
                },
                target_jenjang: {
                    id: target.id,
                    nama: target.nama_jenjang,
                    tingkat: target.tingkat
                },
                analisis: {
                    total,
                    terpenuhi,
                    belumTerpenuhi,
                    persentase,
                    by_peran: byPeran,
                    detail: kompetensi
                },
                peran_info: {
                    semua_peran: uniquePeran,
                    peran_dimiliki: userPeran.map(p => p.nama_peran),
                    peran_tidak_dimiliki: uniquePeran.filter(p => !userPeranSet.has(p)),
                    detail_peran: peranWithOwnership
                },
                filter_info: {
                    fungsi_user: user.nama_fungsi_user,
                    fungsi_analisis: fungsi.nama_fungsi,
                    jumlah_peran_user: userPeranIds.length,
                    daftar_peran_user: userPeranIds,
                    jumlah_peran_fungsi: uniquePeran.length,
                    daftar_peran_fungsi: uniquePeran,
                    mode_analisis: modeAnalisis,
                    is_lintas_fungsi: !isSameFungsi,
                    includes_universal: true,
                    includes_jenjang_universal: true,
                    message: !isSameFungsi 
                        ? `Analisis lintas fungsi: Menampilkan semua kompetensi untuk fungsi ${fungsi.nama_fungsi} + kompetensi universal dari semua peran Anda (termasuk jenjang universal)`
                        : `Analisis sesuai peran: Menampilkan kompetensi untuk semua peran Anda di fungsi ${fungsi.nama_fungsi} + kompetensi universal (termasuk jenjang universal)`
                },
                // Tambahkan info role untuk frontend
                role_info: {
                    isAdmin,
                    isKatim: isKatimRole,
                    access_level: isAdmin ? 'admin' : isKatimRole ? 'katim' : 'user',
                    can_edit: isAdmin, // Hanya admin yang bisa edit
                    can_view: true // Semua bisa view
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error analyzing kenaikan jenjang:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pegawai/:id/analisis-peran-baru
 * Analisis jika menambah peran baru untuk pegawai - HANYA ADMIN TAMBUN RAYA
 */
router.get('/:id/analisis-peran-baru', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    const { peran_ids } = req.query;
    
    console.log(`📊 ${username} menganalisis penambahan peran untuk pegawai ID: ${id}`);
    
    // Hanya admin_tambun_raya yang bisa analisis
    if (!isAdminTambunRaya(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk analisis ini. Hanya admin_tambun_raya yang diizinkan.'
        });
    }
    
    try {
        if (!peran_ids) {
            return res.status(400).json({
                success: false,
                message: 'Parameter peran_ids diperlukan'
            });
        }
        
        // Parse peran_ids
        const peranArray = peran_ids.split(',').map(id => parseInt(id.trim()));
        
        // Ambil data user
        const [userData] = await db.query(`
            SELECT 
                u.*,
                j.nama_jabatan,
                jg.nama_jenjang,
                f.nama_fungsi
            FROM kepegawaian.user u
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            JOIN kepegawaian.fungsi f ON u.id_fungsi = f.id
            WHERE u.id = ?
        `, [id]);
        
        if (userData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pegawai tidak ditemukan'
            });
        }
        
        const user = userData[0];
        
        // Ambil informasi peran yang akan ditambahkan
        const [peranInfo] = await db.query(
            'SELECT * FROM kepegawaian.peran WHERE id IN (?)',
            [peranArray]
        );
        
        // Ambil semua kompetensi yang diperlukan untuk peran-peran baru
        const [kompetensiRequired] = await db.query(`
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi,
                p.nama_peran,
                p.id as id_peran
            FROM kepegawaian.kompetensi_mapping km
            JOIN kepegawaian.master_kompetensi mk ON km.id_kompetensi = mk.id
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON km.id_peran = p.id
            WHERE km.id_jabatan = ? AND km.id_jenjang = ? 
                AND km.id_peran IN (?)
            ORDER BY p.nama_peran, mk.kode_kompetensi
        `, [user.id_jabatan, user.id_jenjang, peranArray]);
        
        // Ambil kompetensi yang sudah dimiliki user
        const [kompetensiDimiliki] = await db.query(`
            SELECT 
                uk.id_kompetensi,
                uk.tanggal_dipenuhi,
                uk.nilai,
                uk.status
            FROM kepegawaian.user_kompetensi uk
            WHERE uk.id_user = ? AND uk.status = 'Lulus'
        `, [id]);
        
        const dimilikiSet = new Set(kompetensiDimiliki.map(k => k.id_kompetensi));
        
        // Analisis gap per peran
        const byPeran = {};
        peranInfo.forEach(peran => {
            byPeran[peran.nama_peran] = {
                id: peran.id,
                total: 0,
                terpenuhi: 0,
                kompetensi: []
            };
        });
        
        kompetensiRequired.forEach(k => {
            const terpenuhi = dimilikiSet.has(k.id);
            if (byPeran[k.nama_peran]) {
                byPeran[k.nama_peran].total++;
                if (terpenuhi) byPeran[k.nama_peran].terpenuhi++;
                byPeran[k.nama_peran].kompetensi.push({
                    ...k,
                    status: terpenuhi ? 'TERPENUHI' : 'BELUM TERPENUHI'
                });
            }
        });
        
        res.status(200).json({
            success: true,
            message: 'Analisis penambahan peran berhasil',
            data: {
                user: {
                    id: user.id,
                    nip: user.nip,
                    nama: user.nama,
                    jabatan: user.nama_jabatan,
                    jenjang: user.nama_jenjang,
                    fungsi: user.nama_fungsi
                },
                peran_ditambahkan: peranInfo,
                analisis: byPeran
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error analyzing penambahan peran:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/pegawai/options/all
 * Mendapatkan data untuk dropdown (jabatan, jenjang, fungsi, peran)
 */
router.get('/options/all', keycloakAuth, async (req, res) => {
    try {
        const [jabatan] = await db.query('SELECT id, nama_jabatan as nama FROM kepegawaian.jabatan ORDER BY nama_jabatan');
        const [jenjang] = await db.query('SELECT id, nama_jenjang as nama, tingkat FROM kepegawaian.jenjang ORDER BY tingkat');
        const [fungsi] = await db.query('SELECT id, nama_fungsi as nama FROM kepegawaian.fungsi ORDER BY nama_fungsi');
        const [peran] = await db.query(`
            SELECT p.id, p.nama_peran as nama, f.nama_fungsi as fungsi
            FROM kepegawaian.peran p
            JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            ORDER BY f.nama_fungsi, p.nama_peran
        `);
        
        res.status(200).json({
            success: true,
            data: {
                jabatan,
                jenjang,
                fungsi,
                peran
            }
        });
    } catch (error) {
        console.error('❌ Error fetching options:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

module.exports = router;