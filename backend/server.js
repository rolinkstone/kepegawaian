// backend/server.js — MERGED with app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const KeycloakStrategy = require('passport-keycloak');
const db = require('./db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config({ path: '.env.local' });

const app = express();

// Trust proxy untuk reverse proxy (Nginx, Docker, dll)
app.set('trust proxy', 1);

// ========== SECURITY HEADERS ==========
// Hapus X-Powered-By Express
app.disable('x-powered-by');

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Izinkan upload file dari origin lain
    contentSecurityPolicy: false // Nonaktifkan CSP karena sudah dihandle frontend (jika ada)
}));

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 5001;

// ========== RATE LIMITING ==========
// Pembatasan umum untuk semua API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan, silakan coba lagi dalam 15 menit'
    }
});

// Pembatasan ketat untuk endpoint login (mencegah brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 20,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit'
    }
});

// Terapkan rate limiter umum ke semua API routes
app.use('/api/', apiLimiter);

// ========== KEYCLOAK CONFIG FROM ENV ==========
const KEYCLOAK_CONFIG = {
    url: process.env.KEYCLOAK_SERVER_URL || 'https://auth.bbpompky.id',
    realm: process.env.KEYCLOAK_REALM || 'master',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'nextjs-local',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    serverUrl: process.env.KEYCLOAK_SERVER_URL || 'https://auth.bbpompky.id'
};

// ========== KONFIGURASI UPLOAD FOLDER ==========
const UPLOADS_DIR = path.join(__dirname, 'uploads');
console.log('📁 Uploads directory:', UPLOADS_DIR);

// Buat folder uploads jika belum ada
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('✅ Folder uploads berhasil dibuat');
}

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== SESSION SETUP ==========
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ========== PASSPORT SETUP ==========
app.use(passport.initialize());
app.use(passport.session());

// ========== PASSPORT KEYCLOAK STRATEGY ==========
passport.use(new KeycloakStrategy({
    host: KEYCLOAK_CONFIG.serverUrl,
    realm: KEYCLOAK_CONFIG.realm,
    clientID: KEYCLOAK_CONFIG.clientId,
    clientSecret: KEYCLOAK_CONFIG.clientSecret,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/keycloak/callback`,
    authorizationURL: `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth`,
    tokenURL: `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`,
    userInfoURL: `${KEYCLOAK_CONFIG.serverUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`
}, (accessToken, refreshToken, profile, done) => {
    console.log('🔑 Keycloak profile received:', profile);
    const user = {
        id: profile.id || profile.sub,
        username: profile.preferred_username || profile.username,
        email: profile.email,
        firstName: profile.given_name || profile.firstName,
        lastName: profile.family_name || profile.lastName,
        fullName: profile.name,
        nip: profile.nip,
        roles: profile.realm_access?.roles || [],
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
    };
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    console.log('💾 Serializing user:', user.username);
    done(null, user);
});

passport.deserializeUser((user, done) => {
    console.log('📖 Deserializing user:', user.username);
    done(null, user);
});

// ========== CUSTOM HTTPS AGENT ==========
const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true
});

// ========== LOGIN ROUTE (TANPA AUTH) UNTUK POSTMAN ==========
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        console.log('📥 Login request received');
        console.log('📥 Body:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password diperlukan'
            });
        }
        
        // Forward ke Keycloak
        const keycloakUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
        
        const params = new URLSearchParams();
        params.append('client_id', KEYCLOAK_CONFIG.clientId);
        params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);
        
        console.log('📡 Calling Keycloak:', keycloakUrl);
        
        const response = await axios.post(keycloakUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            httpsAgent: httpsAgent
        });
        
        if (response.data && response.data.access_token) {
            // Decode token untuk mendapatkan informasi user
            const decoded = jwt.decode(response.data.access_token);
            
            console.log(`✅ Login successful: ${username}`);
            
            return res.json({
                success: true,
                message: 'Login berhasil',
                data: {
                    access_token: response.data.access_token,
                    refresh_token: response.data.refresh_token,
                    expires_in: response.data.expires_in,
                    token_type: response.data.token_type,
                    user: {
                        id: decoded?.sub,
                        username: decoded?.preferred_username || username,
                        email: decoded?.email,
                        name: decoded?.name,
                        roles: decoded?.realm_access?.roles || []
                    }
                }
            });
        } else {
            throw new Error('No access token received');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login',
            error: error.message
        });
    }
});

// ========== AUTH MIDDLEWARE ==========
const enhancedAuth = async (req, res, next) => {
    try {
        // Daftar route yang TIDAK memerlukan autentikasi
        const publicRoutes = [
            '/api/login',
            '/api/auth/login',
            '/api/auth/keycloak',
            '/api/auth/failure',
            '/api/auth/logout',
            '/api/health',
            '/api/validate',
            '/api/refresh',
            '/api/debug',
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

        // Extract roles from realm_access or resource_access
        let roles = [];
        if (decoded.realm_access && decoded.realm_access.roles) {
            roles = decoded.realm_access.roles;
        } else if (decoded.resource_access && decoded.resource_access['nextjs-local'] && decoded.resource_access['nextjs-local'].roles) {
            roles = decoded.resource_access['nextjs-local'].roles;
        }
        
        req.user.extractedRoles = roles;
        
        console.log(`✅ User authenticated: ${req.user.username} (${req.path})`);

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

// ========== DIRECTORY UNTUK DOKUMEN STATIS ==========
const DOCS_DIR = path.join(__dirname, 'docs');

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

// ========== ROUTE UNTUK DOKUMEN STATIS (DENGAN AUTH) ==========
app.get('/api/docs/:filename', enhancedAuth, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(DOCS_DIR, filename);
        
        console.log(`📁 User ${req.user?.username} mengakses dokumen: ${filename}`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Dokumen tidak ditemukan'
            });
        }
        
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.png': 'image/png'
        };
        
        if (contentTypes[ext]) {
            res.contentType(contentTypes[ext]);
        }
        
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.sendFile(filePath);
        console.log(`✅ Dokumen berhasil dikirim ke ${req.user?.username}: ${filename}`);
    } catch (error) {
        console.error('❌ Error accessing document:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Gagal mengakses dokumen: ' + error.message
        });
    }
});

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ========== IMPORT ROUTES ==========
const authRoutes = require('./routes/auth');
const standarkompetensiRoutes = require('./routes/standarkompetensi');
const masterRoutes = require('./routes/master');
const pegawaiRoutes = require('./routes/pegawai');
const userskompetensiRoutes = require('./routes/userskompetensi');
const pelatihanRoutes = require('./routes/pelatihan');
const keycloakRoutes = require('./routes/keycloak');
const dashboardRoutes = require('./routes/dashboard');
const kompetensiWajibRoutes = require('./routes/kompetensiWajib');

// ========== MOUNT ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/standarkompetensi', standarkompetensiRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/userskompetensi', userskompetensiRoutes);
app.use('/api/pelatihan', pelatihanRoutes);
app.use('/api/keycloak', keycloakRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kompetensi-wajib', kompetensiWajibRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: err.message
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.path} tidak ditemukan`
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ============================================
    🚀 SERVER READY: http://localhost:${PORT}
    📁 Uploads directory: ${UPLOADS_DIR}
    🔐 Auth enabled for protected routes
    📝 Public routes: /api/login, /api/health
    ============================================
    `);
});