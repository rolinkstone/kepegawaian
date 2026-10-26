const { loadEnv } = require('./loadEnv');
const loadedEnvFiles = loadEnv();

console.log(`🔍 Loading environment variables from ${loadedEnvFiles.length ? loadedEnvFiles.join(' + ') : '(file .env / .env.local tidak ditemukan)'}`);
console.log('KEYCLOAK_SERVER_URL:', process.env.KEYCLOAK_SERVER_URL ? '✓ SET' : '✗ NOT SET');
console.log('KEYCLOAK_ADMIN_USERNAME:', process.env.KEYCLOAK_ADMIN_USERNAME ? '✓ SET' : '✗ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Validasi environment variables
const requiredEnvVars = [
    'KEYCLOAK_SERVER_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_ADMIN_USERNAME',
    'KEYCLOAK_ADMIN_PASSWORD'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ ERROR: ${envVar} is required but not set`);
        console.error('Isi variabel tersebut di backend/.env atau backend/.env.local');
        process.exit(1);
    }
}

// ========== KEYCLOAK CONFIGURATION ==========
const KEYCLOAK_CONFIG = {
    serverUrl: process.env.KEYCLOAK_SERVER_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'nextjs-local',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD
};

console.log('✅ Keycloak Configuration Loaded Successfully');
console.log(`   Server: ${KEYCLOAK_CONFIG.serverUrl}`);
console.log(`   Realm: ${KEYCLOAK_CONFIG.realm}`);
console.log(`   Admin User: ${KEYCLOAK_CONFIG.adminUsername}`);

module.exports = KEYCLOAK_CONFIG;