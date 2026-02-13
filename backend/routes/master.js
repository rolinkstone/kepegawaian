// backend/routes/master.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { keycloakAuth, getUserId, getUsername } = require('../middleware/keycloakAuth');

// ========== HELPER FUNCTIONS UNTUK QUERY FILTER BERDASARKAN ROLE ==========

/**
 * Build WHERE clause berdasarkan role user
 * Untuk modul kepegawaian - kompetensi
 */
function buildUserWhereClause(user) {
    const userId = getUserId(user);
    
    console.log(`🔧 Building WHERE clause for user:`, {
        user: getUsername(user),
        roles: user.extractedRoles || user.role,
        userId: userId,
        isAdmin: user.isAdmin,
        isPPK: user.isPPK,
        isKabalai: user.isKabalai,
        isRegularUser: user.isRegularUser
    });
    
    // 1. Admin: bisa melihat semua data
    if (user.isAdmin) {
        console.log('👑 Admin: can view all data');
        return { where: '', params: [] };
    }
    
    // 2. PPK: di konteks kepegawaian, PPK bisa lihat semua user di unitnya
    if (user.isPPK) {
        console.log('📋 PPK: can view all users');
        return { where: '', params: [] };
    }
    
    // 3. Kabalai: bisa melihat semua data
    if (user.isKabalai) {
        console.log('👔 Kabalai: can view all data');
        return { where: '', params: [] };
    }
    
    // 4. Regular User: hanya bisa melihat data mereka sendiri
    console.log('👤 Regular User: can only view own data');
    return { 
        where: 'WHERE u.id = ?', 
        params: [userId] 
    };
}

/**
 * Build WHERE clause untuk query single item berdasarkan role user
 */
function buildSingleItemWhereClause(user, itemId, tableAlias = '', idColumn = 'id') {
    const userId = getUserId(user);
    const alias = tableAlias ? `${tableAlias}.` : '';
    
    console.log(`🔧 Building single item WHERE clause for user:`, {
        user: getUsername(user),
        roles: user.extractedRoles || user.role,
        userId: userId,
        isAdmin: user.isAdmin,
        isPPK: user.isPPK,
        isKabalai: user.isKabalai,
        itemId: itemId
    });
    
    // 1. Admin/PPK/Kabalai: bisa mengakses semua data
    if (user.isAdmin || user.isPPK || user.isKabalai) {
        console.log('👑 Admin/PPK/Kabalai: can access all data');
        return { 
            where: `WHERE ${alias}${idColumn} = ?`, 
            params: [itemId]
        };
    }
    
    // 2. Regular User: hanya bisa mengakses data mereka sendiri
    console.log('👤 Regular User: can only access own data');
    return { 
        where: `WHERE ${alias}${idColumn} = ? AND ${alias}user_id = ?`, 
        params: [itemId, userId] 
    };
}

// Helper function untuk menjalankan query
function runQuery(query, params) {
    return new Promise((resolve, reject) => {
        console.log('📝 Executing query:', query.substring(0, 100) + '...');
        db.query(query, params, (err, results) => {
            if (err) {
                console.error('❌ Query error:', err);
                reject(err);
            } else {
                console.log('✅ Query success, rows:', results.length);
                resolve(results);
            }
        });
    });
}

// ========== MASTER FUNGSI ==========

/**
 * GET /api/master/fungsi
 * Mendapatkan semua data fungsi
 */
router.get('/fungsi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses master fungsi`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_fungsi,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.fungsi
            ORDER BY nama_fungsi ASC
        `;

        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Data fungsi berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching fungsi:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/master/fungsi/:id
 * Mendapatkan detail fungsi berdasarkan ID
 */
router.get('/fungsi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} mengakses detail fungsi ID: ${id}`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_fungsi,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.fungsi
            WHERE id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fungsi tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Detail fungsi berhasil diambil',
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching fungsi detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/master/fungsi
 * Menambahkan fungsi baru
 */
router.post('/fungsi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan fungsi baru`);
    
    // Hanya admin yang bisa menambah master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data fungsi'
        });
    }
    
    const { nama_fungsi } = req.body;
    
    if (!nama_fungsi) {
        return res.status(400).json({
            success: false,
            message: 'Nama fungsi harus diisi'
        });
    }
    
    try {
        const query = `
            INSERT INTO kepegawaian.fungsi (nama_fungsi)
            VALUES (?)
        `;

        const [result] = await db.query(query, [nama_fungsi]);
        
        res.status(201).json({
            success: true,
            message: 'Fungsi berhasil ditambahkan',
            data: {
                id: result.insertId,
                nama_fungsi
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error adding fungsi:', error);
        
        // Handle duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama fungsi sudah ada',
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
 * PUT /api/master/fungsi/:id
 * Mengupdate fungsi
 */
router.put('/fungsi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate fungsi ID: ${id}`);
    
    // Hanya admin yang bisa update master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data fungsi'
        });
    }
    
    const { nama_fungsi } = req.body;
    
    if (!nama_fungsi) {
        return res.status(400).json({
            success: false,
            message: 'Nama fungsi harus diisi'
        });
    }
    
    try {
        const query = `
            UPDATE kepegawaian.fungsi
            SET nama_fungsi = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [nama_fungsi, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fungsi tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Fungsi berhasil diupdate',
            data: {
                id: parseInt(id),
                nama_fungsi
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating fungsi:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama fungsi sudah ada',
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
 * DELETE /api/master/fungsi/:id
 * Menghapus fungsi
 */
router.delete('/fungsi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menghapus fungsi ID: ${id}`);
    
    // Hanya admin yang bisa hapus master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menghapus data fungsi'
        });
    }
    
    try {
        const query = `
            DELETE FROM kepegawaian.fungsi
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fungsi tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Fungsi berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deleting fungsi:', error);
        
        // Handle foreign key constraint
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Fungsi tidak dapat dihapus karena masih digunakan oleh data lain',
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

// ========== MASTER PERAN ==========

/**
 * GET /api/master/peran
 * Mendapatkan semua data peran
 */
router.get('/peran', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses master peran`);
    
    try {
        const { id_fungsi } = req.query;
        
        let query = `
            SELECT 
                p.id,
                p.nama_peran,
                p.id_fungsi,
                f.nama_fungsi,
                DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.peran p
            JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
        `;
        
        const params = [];
        
        if (id_fungsi) {
            query += ` WHERE p.id_fungsi = ?`;
            params.push(id_fungsi);
        }
        
        query += ` ORDER BY f.nama_fungsi, p.nama_peran ASC`;
        
        const [rows] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            message: 'Data peran berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching peran:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/master/peran/:id
 * Mendapatkan detail peran berdasarkan ID
 */
router.get('/peran/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} mengakses detail peran ID: ${id}`);
    
    try {
        const query = `
            SELECT 
                p.id,
                p.nama_peran,
                p.id_fungsi,
                f.nama_fungsi,
                DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.peran p
            JOIN kepegawaian.fungsi f ON p.id_fungsi = f.id
            WHERE p.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peran tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Detail peran berhasil diambil',
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching peran detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/master/peran
 * Menambahkan peran baru
 */
router.post('/peran', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan peran baru`);
    
    // Hanya admin yang bisa menambah master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data peran'
        });
    }
    
    const { id_fungsi, nama_peran } = req.body;
    
    if (!id_fungsi || !nama_peran) {
        return res.status(400).json({
            success: false,
            message: 'ID Fungsi dan Nama Peran harus diisi'
        });
    }
    
    try {
        // Cek apakah fungsi exists
        const [fungsi] = await db.query('SELECT id FROM kepegawaian.fungsi WHERE id = ?', [id_fungsi]);
        
        if (fungsi.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fungsi tidak ditemukan'
            });
        }
        
        const query = `
            INSERT INTO kepegawaian.peran (id_fungsi, nama_peran)
            VALUES (?, ?)
        `;

        const [result] = await db.query(query, [id_fungsi, nama_peran]);
        
        res.status(201).json({
            success: true,
            message: 'Peran berhasil ditambahkan',
            data: {
                id: result.insertId,
                id_fungsi,
                nama_peran
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error adding peran:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Peran dengan fungsi ini sudah ada',
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
 * PUT /api/master/peran/:id
 * Mengupdate peran
 */
router.put('/peran/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate peran ID: ${id}`);
    
    // Hanya admin yang bisa update master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data peran'
        });
    }
    
    const { id_fungsi, nama_peran } = req.body;
    
    if (!id_fungsi || !nama_peran) {
        return res.status(400).json({
            success: false,
            message: 'ID Fungsi dan Nama Peran harus diisi'
        });
    }
    
    try {
        const query = `
            UPDATE kepegawaian.peran
            SET id_fungsi = ?, nama_peran = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id_fungsi, nama_peran, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peran tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Peran berhasil diupdate',
            data: {
                id: parseInt(id),
                id_fungsi,
                nama_peran
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating peran:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Peran dengan fungsi ini sudah ada',
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
 * DELETE /api/master/peran/:id
 * Menghapus peran
 */
router.delete('/peran/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menghapus peran ID: ${id}`);
    
    // Hanya admin yang bisa hapus master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menghapus data peran'
        });
    }
    
    try {
        const query = `
            DELETE FROM kepegawaian.peran
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peran tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Peran berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deleting peran:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Peran tidak dapat dihapus karena masih digunakan oleh data lain',
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

// ========== MASTER JENJANG ==========

/**
 * GET /api/master/jenjang
 * Mendapatkan semua data jenjang
 */
router.get('/jenjang', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses master jenjang`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_jenjang,
                tingkat,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.jenjang
            ORDER BY tingkat ASC, nama_jenjang ASC
        `;

        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Data jenjang berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching jenjang:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/master/jenjang/:id
 * Mendapatkan detail jenjang berdasarkan ID
 */
router.get('/jenjang/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} mengakses detail jenjang ID: ${id}`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_jenjang,
                tingkat,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.jenjang
            WHERE id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jenjang tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Detail jenjang berhasil diambil',
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching jenjang detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/master/jenjang
 * Menambahkan jenjang baru
 */
router.post('/jenjang', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan jenjang baru`);
    
    // Hanya admin yang bisa menambah master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data jenjang'
        });
    }
    
    const { nama_jenjang, tingkat } = req.body;
    
    if (!nama_jenjang) {
        return res.status(400).json({
            success: false,
            message: 'Nama jenjang harus diisi'
        });
    }
    
    try {
        const query = `
            INSERT INTO kepegawaian.jenjang (nama_jenjang, tingkat)
            VALUES (?, ?)
        `;

        const [result] = await db.query(query, [nama_jenjang, tingkat || 0]);
        
        res.status(201).json({
            success: true,
            message: 'Jenjang berhasil ditambahkan',
            data: {
                id: result.insertId,
                nama_jenjang,
                tingkat: tingkat || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error adding jenjang:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama jenjang sudah ada',
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
 * PUT /api/master/jenjang/:id
 * Mengupdate jenjang
 */
router.put('/jenjang/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate jenjang ID: ${id}`);
    
    // Hanya admin yang bisa update master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data jenjang'
        });
    }
    
    const { nama_jenjang, tingkat } = req.body;
    
    if (!nama_jenjang) {
        return res.status(400).json({
            success: false,
            message: 'Nama jenjang harus diisi'
        });
    }
    
    try {
        const query = `
            UPDATE kepegawaian.jenjang
            SET nama_jenjang = ?, tingkat = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [nama_jenjang, tingkat || 0, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jenjang tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Jenjang berhasil diupdate',
            data: {
                id: parseInt(id),
                nama_jenjang,
                tingkat: tingkat || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating jenjang:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama jenjang sudah ada',
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
 * DELETE /api/master/jenjang/:id
 * Menghapus jenjang
 */
router.delete('/jenjang/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menghapus jenjang ID: ${id}`);
    
    // Hanya admin yang bisa hapus master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menghapus data jenjang'
        });
    }
    
    try {
        const query = `
            DELETE FROM kepegawaian.jenjang
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jenjang tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Jenjang berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deleting jenjang:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Jenjang tidak dapat dihapus karena masih digunakan oleh data lain',
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

// ========== MASTER JABATAN ==========

/**
 * GET /api/master/jabatan
 * Mendapatkan semua data jabatan
 */
router.get('/jabatan', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses master jabatan`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_jabatan,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.jabatan
            ORDER BY nama_jabatan ASC
        `;

        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Data jabatan berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching jabatan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/master/jabatan/:id
 * Mendapatkan detail jabatan berdasarkan ID
 */
router.get('/jabatan/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} mengakses detail jabatan ID: ${id}`);
    
    try {
        const query = `
            SELECT 
                id,
                nama_jabatan,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.jabatan
            WHERE id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jabatan tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Detail jabatan berhasil diambil',
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching jabatan detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * POST /api/master/jabatan
 * Menambahkan jabatan baru
 */
router.post('/jabatan', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan jabatan baru`);
    console.log('🔑 Token valid, user:', req.user.email || req.user.preferred_username);
    
    // Hanya admin yang bisa menambah master data
    if (!req.user.isAdmin) {
        console.log(`❌ ${username} tidak memiliki izin admin`);
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data jabatan'
        });
    }
    
    const { nama_jabatan } = req.body;
    
    if (!nama_jabatan) {
        return res.status(400).json({
            success: false,
            message: 'Nama jabatan harus diisi'
        });
    }
    
    try {
        const query = `
            INSERT INTO kepegawaian.jabatan (nama_jabatan)
            VALUES (?)
        `;

        const [result] = await db.query(query, [nama_jabatan]);
        
        console.log(`✅ ${username} berhasil menambah jabatan: ${nama_jabatan}`);
        
        res.status(201).json({
            success: true,
            message: 'Jabatan berhasil ditambahkan',
            data: {
                id: result.insertId,
                nama_jabatan
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error adding jabatan:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama jabatan sudah ada',
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
 * PUT /api/master/jabatan/:id
 * Mengupdate jabatan
 */
router.put('/jabatan/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate jabatan ID: ${id}`);
    
    // Hanya admin yang bisa update master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data jabatan'
        });
    }
    
    const { nama_jabatan } = req.body;
    
    if (!nama_jabatan) {
        return res.status(400).json({
            success: false,
            message: 'Nama jabatan harus diisi'
        });
    }
    
    try {
        const query = `
            UPDATE kepegawaian.jabatan
            SET nama_jabatan = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [nama_jabatan, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jabatan tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Jabatan berhasil diupdate',
            data: {
                id: parseInt(id),
                nama_jabatan
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating jabatan:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Nama jabatan sudah ada',
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
 * DELETE /api/master/jabatan/:id
 * Menghapus jabatan
 */
router.delete('/jabatan/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menghapus jabatan ID: ${id}`);
    
    // Hanya admin yang bisa hapus master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menghapus data jabatan'
        });
    }
    
    try {
        const query = `
            DELETE FROM kepegawaian.jabatan
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jabatan tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Jabatan berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deleting jabatan:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Jabatan tidak dapat dihapus karena masih digunakan oleh data lain',
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

// ========== MASTER KOMPETENSI ==========


router.get('/kompetensi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses master kompetensi`);
    
    try {
        const { id_fungsi, id_peran, search } = req.query;
        
        let query = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                mk.id_fungsi,
                f.nama_fungsi,
                mk.id_peran,
                p.nama_peran,
                DATE_FORMAT(mk.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (id_fungsi) {
            query += ` AND mk.id_fungsi = ?`;
            params.push(id_fungsi);
        }
        
        if (id_peran) {
            query += ` AND mk.id_peran = ?`;
            params.push(id_peran);
        }
        
        if (search) {
            query += ` AND (mk.kode_kompetensi LIKE ? OR mk.nama_kompetensi LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY mk.kode_kompetensi ASC`;
        
        const [rows] = await db.query(query, params);
        
        // Ambil mapping untuk setiap kompetensi
        for (let kompetensi of rows) {
            const [mapping] = await db.query(`
                SELECT 
                    km.id_jabatan,
                    j.nama_jabatan,
                    km.id_jenjang,
                    jg.nama_jenjang,
                    jg.tingkat,
                    km.is_mandatory
                FROM kepegawaian.kompetensi_mapping km
                JOIN kepegawaian.jabatan j ON km.id_jabatan = j.id
                JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
                WHERE km.id_kompetensi = ?
                ORDER BY jg.tingkat ASC
            `, [kompetensi.id]);
            
            kompetensi.mapping = mapping;
        }
        
        res.status(200).json({
            success: true,
            message: 'Data kompetensi berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching kompetensi:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});


router.get('/kompetensi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    
    console.log(`📊 ${username} mengakses detail kompetensi ID: ${id}`);
    
    try {
        const query = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                mk.id_fungsi,
                f.nama_fungsi,
                mk.id_peran,
                p.nama_peran,
                DATE_FORMAT(mk.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            WHERE mk.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        const kompetensi = rows[0];
        
        // Ambil mapping
        const [mapping] = await db.query(`
            SELECT 
                km.id_jabatan,
                j.nama_jabatan,
                km.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat,
                km.is_mandatory
            FROM kepegawaian.kompetensi_mapping km
            JOIN kepegawaian.jabatan j ON km.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
            WHERE km.id_kompetensi = ?
            ORDER BY jg.tingkat ASC
        `, [id]);
        
        kompetensi.mapping = mapping;
        
        res.status(200).json({
            success: true,
            message: 'Detail kompetensi berhasil diambil',
            data: kompetensi,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching kompetensi detail:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});


router.post('/kompetensi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📝 ${username} menambahkan kompetensi baru`);
    
    // Hanya admin yang bisa menambah master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menambah data kompetensi'
        });
    }
    
    const { 
        kode_kompetensi, 
        nama_kompetensi, 
        deskripsi, 
        id_fungsi, 
        id_peran,
        mapping 
    } = req.body;
    
    if (!kode_kompetensi || !nama_kompetensi || !id_fungsi || !id_peran) {
        return res.status(400).json({
            success: false,
            message: 'Kode kompetensi, nama kompetensi, fungsi, dan peran harus diisi'
        });
    }
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Insert ke master_kompetensi
        const [result] = await connection.query(`
            INSERT INTO kepegawaian.master_kompetensi 
            (kode_kompetensi, nama_kompetensi, deskripsi, id_fungsi, id_peran)
            VALUES (?, ?, ?, ?, ?)
        `, [kode_kompetensi, nama_kompetensi, deskripsi || null, id_fungsi, id_peran]);
        
        const id_kompetensi = result.insertId;
        
        // Insert mapping jika ada
        if (mapping && mapping.length > 0) {
            for (const map of mapping) {
                await connection.query(`
                    INSERT INTO kepegawaian.kompetensi_mapping 
                    (id_kompetensi, id_jabatan, id_jenjang, id_peran, is_mandatory)
                    VALUES (?, ?, ?, ?, ?)
                `, [id_kompetensi, map.id_jabatan, map.id_jenjang, map.id_peran, map.is_mandatory !== false]);
            }
        }
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Kompetensi berhasil ditambahkan',
            data: {
                id: id_kompetensi,
                kode_kompetensi,
                nama_kompetensi,
                id_fungsi,
                id_peran,
                mapping: mapping || []
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error adding kompetensi:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kode kompetensi sudah ada',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});


router.put('/kompetensi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`📝 ${username} mengupdate kompetensi ID: ${id}`);
    
    // Hanya admin yang bisa update master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk mengupdate data kompetensi'
        });
    }
    
    const { 
        kode_kompetensi, 
        nama_kompetensi, 
        deskripsi, 
        id_fungsi, 
        id_peran,
        mapping 
    } = req.body;
    
    if (!kode_kompetensi || !nama_kompetensi || !id_fungsi || !id_peran) {
        return res.status(400).json({
            success: false,
            message: 'Kode kompetensi, nama kompetensi, fungsi, dan peran harus diisi'
        });
    }
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Update master_kompetensi
        const [updateResult] = await connection.query(`
            UPDATE kepegawaian.master_kompetensi
            SET kode_kompetensi = ?, nama_kompetensi = ?, deskripsi = ?, 
                id_fungsi = ?, id_peran = ?
            WHERE id = ?
        `, [kode_kompetensi, nama_kompetensi, deskripsi || null, id_fungsi, id_peran, id]);
        
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        // Update mapping: hapus existing, insert baru
        await connection.query(`
            DELETE FROM kepegawaian.kompetensi_mapping
            WHERE id_kompetensi = ?
        `, [id]);
        
        if (mapping && mapping.length > 0) {
            for (const map of mapping) {
                await connection.query(`
                    INSERT INTO kepegawaian.kompetensi_mapping 
                    (id_kompetensi, id_jabatan, id_jenjang, id_peran, is_mandatory)
                    VALUES (?, ?, ?, ?, ?)
                `, [id, map.id_jabatan, map.id_jenjang, map.id_peran, map.is_mandatory !== false]);
            }
        }
        
        await connection.commit();
        
        res.status(200).json({
            success: true,
            message: 'Kompetensi berhasil diupdate',
            data: {
                id: parseInt(id),
                kode_kompetensi,
                nama_kompetensi,
                id_fungsi,
                id_peran,
                mapping: mapping || []
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error updating kompetensi:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kode kompetensi sudah ada',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});


router.delete('/kompetensi/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;
    console.log(`🗑️ ${username} menghapus kompetensi ID: ${id}`);
    
    // Hanya admin yang bisa hapus master data
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin untuk menghapus data kompetensi'
        });
    }
    
    try {
        const query = `
            DELETE FROM kepegawaian.master_kompetensi
            WHERE id = ?
        `;

        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Kompetensi berhasil dihapus',
            data: { id: parseInt(id) },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error deleting kompetensi:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Kompetensi tidak dapat dihapus karena masih digunakan oleh data user',
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

// ========== DASHBOARD & GAP ANALYSIS ==========

/**
 * GET /api/master/dashboard/gap/:userId
 * Mendapatkan gap analysis untuk user tertentu
 */
router.get('/dashboard/gap/:userId', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { userId } = req.params;
    
    console.log(`📊 ${username} mengakses gap analysis untuk user ID: ${userId}`);
    
    try {
        // Cek apakah user exists
        const [userCheck] = await db.query(`
            SELECT u.*, j.nama_jabatan, jg.nama_jenjang, jg.tingkat 
            FROM kepegawaian.user u
            JOIN kepegawaian.jabatan j ON u.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON u.id_jenjang = jg.id
            WHERE u.id = ?
        `, [userId]);
        
        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Gunakan view yang sudah dibuat
        const [gapData] = await db.query(`
            SELECT * FROM kepegawaian.vw_gap_analysis_reuse
            WHERE id_user = ?
            ORDER BY tingkat_target, kode_kompetensi
        `, [userId]);
        
        // Hitung summary
        const summary = {
            total_kompetensi: gapData.length,
            sudah_dipenuhi: gapData.filter(d => d.status_pemenuhan.includes('✓')).length,
            belum_dipenuhi: gapData.filter(d => d.status_pemenuhan.includes('✗')).length,
            reuse_kompetensi: gapData.filter(d => d.analisis_reuse.includes('REUSE')).length,
            early_kompetensi: gapData.filter(d => d.analisis_reuse.includes('EARLY')).length,
            gap_kompetensi: gapData.filter(d => d.analisis_reuse.includes('🔴')).length,
            baru_kompetensi: gapData.filter(d => d.analisis_reuse.includes('🔵')).length
        };
        
        // Kelompokkan berdasarkan fungsi/peran
        const byFungsi = {};
        gapData.forEach(item => {
            const key = `${item.fungsi} - ${item.peran}`;
            if (!byFungsi[key]) {
                byFungsi[key] = {
                    fungsi: item.fungsi,
                    peran: item.peran,
                    total: 0,
                    sudah: 0,
                    belum: 0,
                    kompetensi: []
                };
            }
            byFungsi[key].total++;
            if (item.status_pemenuhan.includes('✓')) {
                byFungsi[key].sudah++;
            } else {
                byFungsi[key].belum++;
            }
            byFungsi[key].kompetensi.push(item);
        });
        
        res.status(200).json({
            success: true,
            message: 'Gap analysis berhasil diambil',
            data: {
                user: {
                    id: userCheck[0].id,
                    nip: userCheck[0].nip,
                    nama: userCheck[0].nama,
                    jabatan: userCheck[0].nama_jabatan,
                    jenjang: userCheck[0].nama_jenjang,
                    tingkat: userCheck[0].tingkat
                },
                gap_analysis: gapData,
                summary,
                by_fungsi: Object.values(byFungsi)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching gap analysis:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});

/**
 * GET /api/master/dashboard/standar-kompetensi
 * Mendapatkan standar kompetensi per jabatan & jenjang
 */
router.get('/dashboard/standar-kompetensi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses standar kompetensi`);
    
    try {
        const [rows] = await db.query(`
            SELECT * FROM kepegawaian.vw_standar_kompetensi
            ORDER BY tingkat_jenjang, fungsi, peran, kode_kompetensi
        `);
        
        // Kelompokkan berdasarkan jabatan & jenjang
        const grouped = {};
        rows.forEach(item => {
            const key = `${item.jabatan} - ${item.jenjang}`;
            if (!grouped[key]) {
                grouped[key] = {
                    jabatan: item.jabatan,
                    jenjang: item.jenjang,
                    tingkat: item.tingkat_jenjang,
                    total_kompetensi: 0,
                    by_fungsi: {}
                };
            }
            
            grouped[key].total_kompetensi++;
            
            const fungsiKey = `${item.fungsi} - ${item.peran}`;
            if (!grouped[key].by_fungsi[fungsiKey]) {
                grouped[key].by_fungsi[fungsiKey] = {
                    fungsi: item.fungsi,
                    peran: item.peran,
                    total: 0,
                    kompetensi: []
                };
            }
            
            grouped[key].by_fungsi[fungsiKey].total++;
            grouped[key].by_fungsi[fungsiKey].kompetensi.push(item);
        });
        
        res.status(200).json({
            success: true,
            message: 'Standar kompetensi berhasil diambil',
            data: {
                detail: rows,
                grouped: Object.values(grouped).map(g => ({
                    ...g,
                    by_fungsi: Object.values(g.by_fungsi)
                }))
            },
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching standar kompetensi:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});


/**
 * @swagger
 * /api/mapping/kompetensi:
 *   get:
 *     summary: Get all kompetensi mapping with various formats
 *     tags: [Mapping]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [full, simple, detail, reuse, per-fungsi, compact]
 *         description: Format output mapping (default: full)
 *       - in: query
 *         name: id_fungsi
 *         schema:
 *           type: integer
 *         description: Filter by fungsi ID
 *       - in: query
 *         name: id_peran
 *         schema:
 *           type: integer
 *         description: Filter by peran ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by kode or nama kompetensi
 */
router.get('/mapping/kompetensi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses mapping kompetensi`);
    
    try {
        const { format = 'full', id_fungsi, id_peran, search } = req.query;
        
        let baseQuery = `
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            LEFT JOIN kepegawaian.kompetensi_mapping km ON mk.id = km.id_kompetensi
            LEFT JOIN kepegawaian.jabatan j ON km.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (id_fungsi) {
            baseQuery += ` AND mk.id_fungsi = ?`;
            params.push(id_fungsi);
        }
        
        if (id_peran) {
            baseQuery += ` AND mk.id_peran = ?`;
            params.push(id_peran);
        }
        
        if (search) {
            baseQuery += ` AND (mk.kode_kompetensi LIKE ? OR mk.nama_kompetensi LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        let query = '';
        let groupBy = ' GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi, f.nama_fungsi, p.nama_peran';
        let orderBy = ' ORDER BY mk.kode_kompetensi ASC';
        
        // Pilih format berdasarkan parameter
        switch(format) {
            case 'full':
                // Format 1: Lengkap dengan semua detail dalam satu kolom
                query = `
                    SELECT 
                        mk.kode_kompetensi AS kode,
                        mk.nama_kompetensi AS nama_kompetensi,
                        mk.deskripsi,
                        CONCAT(
                            '[JABATAN: ', COALESCE(GROUP_CONCAT(DISTINCT j.nama_jabatan ORDER BY j.nama_jabatan SEPARATOR ', '), '-'), '] ',
                            '[FUNGSI: ', f.nama_fungsi, '] ',
                            '[PERAN: ', p.nama_peran, '] ',
                            '[JENJANG: ', COALESCE(GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', '), '-'), ']'
                        ) AS jabatan_fungsi,
                        f.nama_fungsi AS fungsi,
                        p.nama_peran AS peran,
                        GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', ') AS daftar_jabatan,
                        GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', ') AS daftar_jenjang,
                        COUNT(DISTINCT km.id_jenjang) AS jumlah_jenjang,
                        COUNT(DISTINCT km.id_jabatan) AS jumlah_jabatan
                `;
                break;
                
            case 'simple':
                // Format 2: Sederhana - Nama Kompetensi | Jabatan & Fungsi (1 baris)
                query = `
                    SELECT 
                        CONCAT(mk.kode_kompetensi, ' - ', mk.nama_kompetensi) AS nama_kompetensi,
                        CONCAT(
                            'Jabatan: ', COALESCE(GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', '), '-'),
                            ' | Fungsi: ', f.nama_fungsi,
                            ' (', p.nama_peran, ')',
                            ' | Jenjang: ', COALESCE(GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', '), '-')
                        ) AS jabatan_fungsi,
                        f.nama_fungsi AS fungsi,
                        p.nama_peran AS peran
                `;
                break;
                
            case 'detail':
                // Format 3: Detail dengan kolom terpisah
                query = `
                    SELECT 
                        mk.kode_kompetensi,
                        mk.nama_kompetensi,
                        mk.deskripsi,
                        GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', ') AS daftar_jabatan,
                        f.nama_fungsi AS fungsi,
                        p.nama_peran AS peran,
                        GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', ') AS daftar_jenjang,
                        GROUP_CONCAT(DISTINCT 
                            CONCAT(j.nama_jabatan, ' (', jg.nama_jenjang, ')') 
                            ORDER BY jg.tingkat SEPARATOR ', '
                        ) AS jabatan_dan_jenjang
                `;
                break;
                
            case 'compact':
                // Format 4: Compact - hanya info penting
                query = `
                    SELECT 
                        mk.kode_kompetensi,
                        LEFT(mk.nama_kompetensi, 50) AS nama_kompetensi,
                        CONCAT(
                            '[J: ', COALESCE(GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ','), '-'), '] ',
                            '[F: ', f.nama_fungsi, '] ',
                            '[P: ', p.nama_peran, '] ',
                            '[Jg: ', COALESCE(GROUP_CONCAT(DISTINCT jg.nama_jenjang SEPARATOR ','), '-'), ']'
                        ) AS info_singkat
                `;
                break;
                
            case 'reuse':
                // Format 5: Kompetensi yang di-reuse di multiple jenjang
                query = `
                    SELECT 
                        mk.kode_kompetensi,
                        mk.nama_kompetensi,
                        f.nama_fungsi,
                        p.nama_peran,
                        GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', ') AS daftar_jabatan,
                        GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ' → ') AS reuse_jenjang,
                        COUNT(DISTINCT km.id_jenjang) AS jumlah_jenjang,
                        COUNT(DISTINCT km.id_jabatan) AS jumlah_jabatan
                `;
                // Override HAVING clause for reuse
                baseQuery += ` AND km.id_jenjang IS NOT NULL`; // Only include kompetensi with mapping
                groupBy = ' GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi, f.nama_fungsi, p.nama_peran HAVING COUNT(DISTINCT km.id_jenjang) > 1';
                orderBy = ' ORDER BY jumlah_jenjang DESC, mk.kode_kompetensi';
                break;
                
            case 'per-fungsi':
                // Format 6: Group by fungsi
                query = `
                    SELECT 
                        f.nama_fungsi,
                        mk.kode_kompetensi,
                        mk.nama_kompetensi,
                        p.nama_peran,
                        GROUP_CONCAT(DISTINCT 
                            CONCAT(j.nama_jabatan, ' (', jg.nama_jenjang, ')') 
                            ORDER BY j.nama_jabatan, jg.tingkat SEPARATOR ', '
                        ) AS jabatan_dan_jenjang,
                        COUNT(DISTINCT km.id_jenjang) AS total_jenjang,
                        COUNT(DISTINCT km.id_jabatan) AS total_jabatan
                `;
                groupBy = ' GROUP BY f.id, f.nama_fungsi, mk.id, mk.kode_kompetensi, mk.nama_kompetensi, p.nama_peran';
                orderBy = ' ORDER BY f.nama_fungsi, mk.kode_kompetensi';
                break;
                
            case 'export':
                // Format 7: Export all data for reporting
                query = `
                    SELECT 
                        mk.kode_kompetensi,
                        mk.nama_kompetensi,
                        mk.deskripsi,
                        f.nama_fungsi,
                        p.nama_peran,
                        GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', ') AS daftar_jabatan,
                        GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', ') AS daftar_jenjang,
                        GROUP_CONCAT(DISTINCT 
                            CONCAT(j.nama_jabatan, ' (', 
                                CASE 
                                    WHEN jg.tingkat = 1 THEN 'Ahli Pertama'
                                    WHEN jg.tingkat = 2 THEN 'Ahli Muda'
                                    WHEN jg.tingkat = 3 THEN 'Ahli Madya'
                                    WHEN jg.tingkat = 4 THEN 'Ahli Utama'
                                    ELSE jg.nama_jenjang
                                END
                            , ')') 
                            ORDER BY jg.tingkat SEPARATOR '; '
                        ) AS mapping_detail,
                        COUNT(DISTINCT CONCAT(km.id_jabatan, '-', km.id_jenjang)) AS total_mapping
                `;
                break;
                
            case 'sederhana':
            default:
                // Format default: sederhana - seperti endpoint /sederhana sebelumnya
                query = `
                    SELECT 
                        CONCAT(mk.kode_kompetensi, ' - ', mk.nama_kompetensi) AS nama_kompetensi,
                        CONCAT(
                            'Jabatan: ', COALESCE(GROUP_CONCAT(DISTINCT j.nama_jabatan SEPARATOR ', '), '-'),
                            ' | Fungsi: ', f.nama_fungsi,
                            ' (', p.nama_peran, ')',
                            ' | Jenjang: ', COALESCE(GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', '), '-')
                        ) AS jabatan_fungsi
                `;
                break;
        }
        
        // Gabungkan query
        const fullQuery = query + baseQuery + groupBy + orderBy;
        
        // Execute query
        const [results] = await db.query(fullQuery, params);
        
        // Response summary
        let summary = {
            total: results.length,
            format: format,
            timestamp: new Date().toISOString()
        };
        
        // Tambahkan summary khusus untuk format tertentu
        if (format === 'reuse') {
            summary.total_reuse_kompetensi = results.length;
            summary.total_reuse_jenjang = results.reduce((acc, curr) => acc + (parseInt(curr.jumlah_jenjang) || 0), 0);
        } else if (format === 'per-fungsi') {
            // Group by fungsi for summary
            const fungsiCount = {};
            results.forEach(r => {
                fungsiCount[r.nama_fungsi] = (fungsiCount[r.nama_fungsi] || 0) + 1;
            });
            summary.per_fungsi = fungsiCount;
        } else if (format === 'export') {
            summary.total_mapping = results.reduce((acc, curr) => acc + (parseInt(curr.total_mapping) || 0), 0);
            summary.kompetensi_dengan_mapping = results.filter(r => parseInt(r.total_mapping) > 0).length;
            summary.kompetensi_tanpa_mapping = results.filter(r => parseInt(r.total_mapping) === 0).length;
        }
        
        res.json({
            success: true,
            message: `Data mapping kompetensi berhasil diambil (format: ${format})`,
            data: results,
            summary: summary
        });
        
    } catch (error) {
        console.error('❌ Error getting mapping kompetensi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});


router.get('/mapping/kompetensi/:kode', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses detail mapping kompetensi: ${req.params.kode}`);
    
    try {
        const { kode } = req.params;
        
        // Query tanpa JSON_ARRAYAGG dan JSON_OBJECT
        const kompetensiQuery = `
            SELECT 
                mk.id,
                mk.kode_kompetensi,
                mk.nama_kompetensi,
                mk.deskripsi,
                f.nama_fungsi AS fungsi,
                f.id AS id_fungsi,
                p.nama_peran AS peran,
                p.id AS id_peran,
                GROUP_CONCAT(DISTINCT j.nama_jabatan ORDER BY j.nama_jabatan SEPARATOR ', ') AS daftar_jabatan,
                GROUP_CONCAT(DISTINCT jg.nama_jenjang ORDER BY jg.tingkat SEPARATOR ', ') AS daftar_jenjang,
                GROUP_CONCAT(DISTINCT 
                    CONCAT(j.nama_jabatan, ' (', jg.nama_jenjang, ')') 
                    ORDER BY j.nama_jabatan, jg.tingkat SEPARATOR ', '
                ) AS jabatan_dan_jenjang,
                COUNT(DISTINCT km.id_jabatan) AS jumlah_jabatan,
                COUNT(DISTINCT km.id_jenjang) AS jumlah_jenjang
            FROM kepegawaian.master_kompetensi mk
            JOIN kepegawaian.fungsi f ON mk.id_fungsi = f.id
            JOIN kepegawaian.peran p ON mk.id_peran = p.id
            LEFT JOIN kepegawaian.kompetensi_mapping km ON mk.id = km.id_kompetensi
            LEFT JOIN kepegawaian.jabatan j ON km.id_jabatan = j.id
            LEFT JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
            WHERE mk.kode_kompetensi = ?
            GROUP BY mk.id, mk.kode_kompetensi, mk.nama_kompetensi, mk.deskripsi, 
                     f.id, f.nama_fungsi, p.id, p.nama_peran
        `;
        
        const [kompetensiResult] = await db.query(kompetensiQuery, [kode]);
        
        if (kompetensiResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kompetensi tidak ditemukan'
            });
        }
        
        const kompetensi = kompetensiResult[0];
        
        // Query terpisah untuk mendapatkan mapping detail
        const mappingQuery = `
            SELECT 
                km.id,
                km.id_jabatan,
                j.nama_jabatan,
                km.id_jenjang,
                jg.nama_jenjang,
                jg.tingkat,
                km.is_mandatory,
                km.created_at
            FROM kepegawaian.kompetensi_mapping km
            JOIN kepegawaian.jabatan j ON km.id_jabatan = j.id
            JOIN kepegawaian.jenjang jg ON km.id_jenjang = jg.id
            WHERE km.id_kompetensi = ?
            ORDER BY jg.tingkat ASC, j.nama_jabatan ASC
        `;
        
        const [mappingResult] = await db.query(mappingQuery, [kompetensi.id]);
        
        // Gabungkan data
        kompetensi.mapping = mappingResult;
        
        res.json({
            success: true,
            message: 'Detail mapping kompetensi berhasil diambil',
            data: kompetensi
        });
        
    } catch (error) {
        console.error('❌ Error getting mapping by kode:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});




module.exports = router;