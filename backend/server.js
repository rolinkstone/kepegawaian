// backend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const app = express();

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 5001;

// ========== KONFIGURASI UPLOAD FOLDER ==========
const UPLOADS_DIR = path.join(__dirname, 'uploads');
console.log('📁 Uploads directory:', UPLOADS_DIR);

// Buat folder uploads jika belum ada
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('✅ Folder uploads berhasil dibuat');
}

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== KEYCLOAK CONFIG ==========
const KEYCLOAK_CONFIG = {
    url: 'https://auth.bbpompky.id',
    realm: 'master',
    clientId: 'nextjs-local',
    clientSecret: 'WJGi86sOoEcIW1IvD0ET40BgEnDvuSDj'
};

// ========== CUSTOM HTTPS AGENT ==========
const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true
});

// ========== AUTH MIDDLEWARE ==========
const enhancedAuth = async (req, res, next) => {
    try {
        // Daftar route yang TIDAK memerlukan autentikasi
        const publicRoutes = [
            '/api/login',
            '/api/health',
            '/api/validate',
            '/api/refresh',
            '/api/debug',
            '/api/kegiatan/test/public',
            '/uploads-list' // Untuk testing saja (bisa dihapus nanti)
        ];

        // Cek apakah request ke public route
        const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

        if (isPublicRoute) {
            console.log(`📂 Public route accessed: ${req.path}`);
            return next();
        }

        // Untuk route yang memerlukan autentikasi
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'No authorization header'
            });
        }

        let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (!token || token.trim() === '') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Empty token'
            });
        }

        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token format'
            });
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }

        req.user = {
            id: decoded.sub,
            username: decoded.preferred_username || decoded.email || 'unknown',
            email: decoded.email || '',
            name: decoded.name || decoded.preferred_username || 'User',
            roles: decoded.realm_access?.roles || []
        };

        console.log(`✅ User authenticated: ${req.user.username}`);
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

app.use(enhancedAuth);

// ========== ROUTE UNTUK FILE UPLOAD (DENGAN AUTH) ==========
app.get('/api/uploads/:filename', enhancedAuth, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(UPLOADS_DIR, filename);
        
        console.log(`📁 User ${req.user?.username} mengakses file: ${filename}`);
        console.log(`📁 Full path: ${filePath}`);
        
        // Cek apakah file ada
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File tidak ditemukan: ${filename}`);
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'File tidak ditemukan'
            });
        }
        
        // Dapatkan ekstensi file
        const ext = path.extname(filename).toLowerCase();
        console.log(`📁 File extension: ${ext}`);
        
        // Set content type berdasarkan ekstensi
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        };
        
        if (contentTypes[ext]) {
            res.contentType(contentTypes[ext]);
        }
        
        // Set header untuk download
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        // Kirim file
        res.sendFile(filePath);
        console.log(`✅ File berhasil dikirim ke ${req.user?.username}: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error accessing file:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Gagal mengakses file: ' + error.message
        });
    }
});

// Test route untuk cek file (tanpa autentikasi) - OPSIONAL, bisa dihapus jika tidak perlu
app.get('/uploads-list', (req, res) => {
    try {
        const files = fs.readdirSync(UPLOADS_DIR);
        res.json({
            success: true,
            uploads_dir: UPLOADS_DIR,
            files: files,
            urls: files.map(f => `http://localhost:${PORT}/api/uploads/${f}`)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal membaca folder uploads',
            error: error.message
        });
    }
});

// ========== IMPORT ROUTES ==========
const standarkompetensiRoutes = require('./routes/standarkompetensi');
const masterRoutes = require('./routes/master');
const pegawaiRoutes = require('./routes/pegawai');
const userskompetensiRoutes = require('./routes/userskompetensi');
const pelatihanRoutes = require('./routes/pelatihan');
const keycloakRoutes = require('./routes/keycloak');
const dashboardRoutes = require('./routes/dashboard');

// ========== MOUNT ROUTES ==========
app.use('/api/standarkompetensi', standarkompetensiRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/userskompetensi', userskompetensiRoutes);
app.use('/api/pelatihan', pelatihanRoutes);
app.use('/api/keycloak', keycloakRoutes);
app.use('/api/dashboard', dashboardRoutes);


// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ============================================
    🚀 SERVER READY: http://localhost:${PORT}
    ============================================
    `);
});