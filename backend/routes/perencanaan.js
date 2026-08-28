// backend/routes/perencanaan.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { keycloakAuth, getUsername } = require('../middleware/keycloakAuth');

// ========== ROLE YANG BOLEH UPLOAD ==========
const UPLOAD_ROLES = ['admin', 'katim', 'kabag_tu'];

// ========== KONFIGURASI FOLDER & MULTER ==========
const PERENCANAAN_DIR = path.join(__dirname, '../uploads/perencanaan');
if (!fs.existsSync(PERENCANAAN_DIR)) {
    fs.mkdirSync(PERENCANAAN_DIR, { recursive: true });
    console.log(`📁 Folder perencanaan dibuat: ${PERENCANAAN_DIR}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PERENCANAAN_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
        cb(null, 'perencanaan-' + uniqueSuffix + ext);
    }
});

// Hanya izinkan file PDF
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file PDF yang diperbolehkan'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: fileFilter
});

// ========== HELPER ==========
function canUpload(user) {
    const roles = user.extractedRoles || user.role || user.roles || [];
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => UPLOAD_ROLES.includes(String(role).toLowerCase()));
}

// ========== ROUTES ==========

/**
 * GET /api/perencanaan
 * Mendapatkan daftar semua dokumen perencanaan (semua user bisa lihat)
 */
router.get('/', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    console.log(`📊 ${username} mengakses daftar perencanaan`);

    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                nama_file,
                file_name,
                ukuran_file,
                uploaded_by,
                uploaded_by_name,
                nip,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM kepegawaian.perencanaan
            ORDER BY created_at DESC
        `);

        console.log(`✅ Daftar perencanaan berhasil diambil, ${rows.length} dokumen`);
        res.status(200).json({
            success: true,
            message: 'Daftar perencanaan berhasil diambil',
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('❌ Error fetching perencanaan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar perencanaan: ' + error.message
        });
    }
});

/**
 * POST /api/perencanaan
 * Upload dokumen PDF (hanya admin, katim, kabag_tu)
 */
router.post('/', keycloakAuth, upload.single('file'), async (req, res) => {
    const username = getUsername(req.user);

    // Cek role yang boleh upload
    if (!canUpload(req.user)) {
        console.log(`⛔ ${username} tidak punya akses upload perencanaan`);
        return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki akses untuk mengunggah dokumen. Hanya admin, katim, dan kabag_tu yang dapat mengunggah.'
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File PDF wajib diunggah'
        });
    }

    const namaFile = (req.body.nama_file || req.file.originalname || 'Dokumen Perencanaan').trim();

    try {
        const [result] = await db.query(`
            INSERT INTO kepegawaian.perencanaan 
                (nama_file, file_name, ukuran_file, uploaded_by, uploaded_by_name, nip, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
            namaFile,
            req.file.filename,
            req.file.size,
            username,
            req.user.name || username,
            req.user.preferred_username || username
        ]);

        console.log(`✅ ${username} berhasil upload perencanaan: ${req.file.filename}`);
        res.status(201).json({
            success: true,
            message: 'Dokumen perencanaan berhasil diunggah',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Error uploading perencanaan:', error);
        // Hapus file jika gagal simpan ke DB
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`🗑️ File dihapus karena error: ${req.file.filename}`);
        }
        res.status(500).json({
            success: false,
            message: 'Gagal mengunggah dokumen: ' + error.message
        });
    }
});

/**
 * GET /api/perencanaan/file/:filename
 * Membuka file PDF (semua user bisa lihat)
 */
router.get('/file/:filename', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { filename } = req.params;

    // Cegah path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(PERENCANAAN_DIR, safeFilename);

    console.log(`📁 ${username} membuka file perencanaan: ${safeFilename}`);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        res.sendFile(filePath);
    } catch (error) {
        console.error('❌ Error accessing file:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuka file: ' + error.message
        });
    }
});

/**
 * DELETE /api/perencanaan/:id
 * Hapus dokumen (hanya uploader atau admin)
 */
router.delete('/:id', keycloakAuth, async (req, res) => {
    const username = getUsername(req.user);
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT * FROM kepegawaian.perencanaan WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dokumen tidak ditemukan'
            });
        }

        const doc = rows[0];

        // Hanya uploader atau admin yang boleh hapus
        const isAdmin = canUpload(req.user) && String(req.user.extractedRoles || []).toLowerCase().includes('admin');
        const isOwner = doc.uploaded_by === username;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk menghapus dokumen ini'
            });
        }

        await db.query(`DELETE FROM kepegawaian.perencanaan WHERE id = ?`, [id]);

        // Hapus file dari server
        const filePath = path.join(PERENCANAAN_DIR, path.basename(doc.file_name));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ File dihapus: ${doc.file_name}`);
        }

        console.log(`✅ ${username} menghapus perencanaan: ${doc.nama_file}`);
        res.status(200).json({
            success: true,
            message: 'Dokumen perencanaan berhasil dihapus'
        });
    } catch (error) {
        console.error('❌ Error deleting perencanaan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus dokumen: ' + error.message
        });
    }
});

module.exports = router;
