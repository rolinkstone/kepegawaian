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


// ========== VW_STANDAR_KOMPETENSI ==========

/**
 * GET /api/master/vw-standar-kompetensi
 * Memanggil view vw_standar_kompetensi yang sudah ada di database
 */
router.get('/vw-standar-kompetensi', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses view vw_standar_kompetensi`);
    
    try {
        // Simple query - langsung panggil view
        const query = `SELECT * FROM kepegawaian.vw_standar_kompetensi`;
        
        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Data standar kompetensi berhasil diambil',
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching vw_standar_kompetensi:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server', 
            error: error.message 
        });
    }
});
module.exports = router;