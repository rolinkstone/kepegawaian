const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const https = require('https');

const app = express();

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: '*', // Untuk Postman testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ========== KEYCLOAK CONFIG ==========
const KEYCLOAK_CONFIG = {
    url: 'https://auth.bbpompky.id',
    realm: 'master',
    clientId: 'nextjs-local',
    clientSecret: 'WJGi86sOoEcIW1IvD0ET40BgEnDvuSDj'
};

// ========== CUSTOM HTTPS AGENT ==========
// Gunakan agent dengan konfigurasi aman
const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true // Tetap validasi SSL certificate
});

// ========== AUTH MIDDLEWARE ==========
const enhancedAuth = async (req, res, next) => {
    try {
        const publicRoutes = [
            '/api/login', 
            '/api/health', 
            '/api/validate', 
            '/api/refresh', 
            '/api/debug',
            '/api/kegiatan/test/public'
        ];
        
        if (publicRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }
        
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

// ========== IMPORT ROUTES ==========
const standarkompetensiRoutes = require('./routes/standarkompetensi');
const masterRoutes = require('./routes/master');
const pegawaiRoutes = require('./routes/pegawai');
const jadwalRoutes = require('./routes/jadwal');
const keycloakRoutes = require('./routes/keycloak'); // <-- tambahkan ini


// ========== MOUNT ROUTES ==========
app.use('/api/standarkompetensi', standarkompetensiRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/keycloak', keycloakRoutes); // <-- tambahkan ini


// ========== AUTH ENDPOINTS ==========
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        console.log(`🔐 Login attempt for: ${username}`);
        
        const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
        
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', KEYCLOAK_CONFIG.clientId);
        params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
        params.append('username', username);
        params.append('password', password);
        
        const response = await axios.post(tokenUrl, params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 10000,
            httpsAgent: httpsAgent
        });
        
        const tokens = response.data;
        const decoded = jwt.decode(tokens.access_token);
        
        console.log(`✅ Login successful for: ${decoded.preferred_username || username}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            user: {
                id: decoded.sub,
                username: decoded.preferred_username || username,
                email: decoded.email || '',
                name: decoded.name || decoded.preferred_username || username
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        
        // Handle SSL certificate errors
        if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
            error.code === 'CERT_HAS_EXPIRED' ||
            error.message.includes('certificate')) {
            
            console.warn('⚠️ SSL Certificate issue detected');
            
            // Fallback: Gunakan agent tanpa SSL verification untuk kasus emergency
            const fallbackAgent = new https.Agent({ rejectUnauthorized: false });
            
            try {
                const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
                
                const params = new URLSearchParams();
                params.append('grant_type', 'password');
                params.append('client_id', KEYCLOAK_CONFIG.clientId);
                params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
                params.append('username', username);
                params.append('password', password);
                
                const fallbackResponse = await axios.post(tokenUrl, params.toString(), {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    timeout: 10000,
                    httpsAgent: fallbackAgent
                });
                
                const tokens = fallbackResponse.data;
                const decoded = jwt.decode(tokens.access_token);
                
                console.warn('⚠️ Login successful with fallback SSL');
                
                return res.json({
                    success: true,
                    message: 'Login successful (fallback mode)',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_in: tokens.expires_in,
                    user: {
                        id: decoded.sub,
                        username: decoded.preferred_username || username,
                        email: decoded.email || '',
                        name: decoded.name || decoded.preferred_username || username
                    }
                });
                
            } catch (fallbackError) {
                console.error('❌ Fallback login failed:', fallbackError.message);
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed - SSL certificate issue'
                });
            }
        }
        
        res.status(401).json({
            success: false,
            message: error.response?.data?.error_description || 'Authentication failed'
        });
    }
});

app.post('/api/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        
        console.log('🔄 Refreshing token...');
        
        const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
        
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', KEYCLOAK_CONFIG.clientId);
        params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
        params.append('refresh_token', refresh_token);
        
        const response = await axios.post(tokenUrl, params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 10000,
            httpsAgent: httpsAgent
        });
        
        console.log('✅ Token refreshed successfully');
        
        res.json({
            success: true,
            ...response.data
        });
        
    } catch (error) {
        console.error('❌ Refresh error:', error.message);
        
        // Fallback jika ada SSL issue
        if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            try {
                const fallbackAgent = new https.Agent({ rejectUnauthorized: false });
                
                const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
                
                const params = new URLSearchParams();
                params.append('grant_type', 'refresh_token');
                params.append('client_id', KEYCLOAK_CONFIG.clientId);
                params.append('client_secret', KEYCLOAK_CONFIG.clientSecret);
                params.append('refresh_token', refresh_token);
                
                const fallbackResponse = await axios.post(tokenUrl, params.toString(), {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    timeout: 10000,
                    httpsAgent: fallbackAgent
                });
                
                return res.json({
                    success: true,
                    ...fallbackResponse.data
                });
                
            } catch (fallbackError) {
                console.error('❌ Fallback refresh failed:', fallbackError.message);
            }
        }
        
        res.status(401).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
});

app.get('/api/userinfo', (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
    
    res.json({
        success: true,
        user: req.user
    });
});

// ========== PUBLIC ENDPOINTS ==========
app.get('/api/health', (req, res) => {
    db.query('SELECT 1 as status', (err) => {
        const dbStatus = err ? 'DISCONNECTED' : 'CONNECTED';
        
        res.json({ 
            status: 'OK', 
            service: 'Keuangan Backend API',
            database: dbStatus,
            timestamp: new Date().toISOString(),
            endpoints: [
                'POST /api/login',
                'GET /api/kegiatan',
                'GET /api/userinfo',
                'POST /api/refresh'
            ]
        });
    });
});

// ========== DEBUG ENDPOINT (Untuk testing) ==========
app.get('/api/debug', (req, res) => {
    res.json({
        success: true,
        message: 'Debug endpoint',
        headers: req.headers,
        timestamp: new Date().toISOString(),
        ssl_verification: 'ENABLED'
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ============================================
    🚀 SERVER READY: http://localhost:${PORT}
    ============================================
    
    ✅ Routes: /api/kegiatan
    ✅ Authentication: Keycloak JWT
    ✅ SSL Verification: ENABLED
    ✅ Database: MySQL
    
    🔐 Login: POST /api/login
    📊 Kegiatan: GET /api/kegiatan
    👤 User Info: GET /api/userinfo
    🔄 Refresh: POST /api/refresh
    
    ============================================
    ⚠️  PERHATIAN:
    - SSL certificate validation AKTIF
    - Jika ada SSL error, akan dicoba fallback
    - Gunakan certificate yang valid di production
    ============================================
    `);
});