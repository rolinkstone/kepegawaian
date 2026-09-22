// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// Fungsi untuk memformat NIP dengan spasi
function formatNipWithSpaces(nip) {
    if (!nip) return '';
    
    // Hapus spasi yang ada
    const cleanNip = String(nip).replace(/\s/g, '');
    
    // Jika panjang 18 digit, format jadi 8 6 1 3
    if (cleanNip.length === 18 && /^\d+$/.test(cleanNip)) {
        return `${cleanNip.substring(0, 8)} ${cleanNip.substring(8, 14)} ${cleanNip.substring(14, 15)} ${cleanNip.substring(15, 18)}`;
    }
    
    // Jika sudah ada spasi, kembalikan asli
    if (nip.includes(' ')) {
        return nip;
    }
    
    return cleanNip;
}

/**
 * Ambil klaim dari payload access token DI SERVER saja (bukan mengirim tokennya).
 * Dipakai untuk mempertahankan perilaku lama (mis. tampilan username/jabatan)
 * tanpa perlu menyerahkan token ke browser.
 */
function decodeJwtPayload(jwtToken) {
  try {
    const part = String(jwtToken).split('.')[1];
    if (!part) return {};
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Perbarui access token memakai refresh token (Keycloak).
 *
 * Kenapa perlu: di realm ini `accessTokenLifespan` = 10800 detik (3 jam) sedangkan
 * sesi NextAuth 4 jam. Tanpa refresh, semua panggilan API setelah 3 jam akan ditolak
 * backend dengan "Token tidak valid atau kadaluarsa" walau user masih login.
 */
async function refreshAccessToken(token) {
  const issuer = String(process.env.KEYCLOAK_ISSUER || '').replace(/\/+$/, '');
  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KEYCLOAK_CLIENT_ID || '',
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      refresh_token: token.refreshToken,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || `HTTP ${res.status}`);
  }

  const claims = decodeJwtPayload(data.access_token);
  return {
    ...token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || token.refreshToken,
    idToken: data.id_token || token.idToken,
    expiresAt: Math.floor(Date.now() / 1000) + Number(data.expires_in || 300),
    displayClaims: {
      preferred_username: claims.preferred_username || token.username,
      jabatan: claims.jabatan || null,
    },
    error: undefined,
  };
}

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      
      authorization: {
        params: {
          scope: "openid profile email"
        }
      },
      
      profile(profile) {
        console.log("🔐 Profile for:", profile.preferred_username);
        
        // Determine ALL roles — user bisa punya multiple roles (ppk + katim, admin_tambun_raya + user, dll)
        const realmRoles = profile.realm_access?.roles || [];
        const recognizedRoles = ['admin', 'admin_tambun_raya', 'ppk', 'kabalai', 'kabag_tu', 'katim', 'bendahara'];
        const roles = realmRoles.filter(r => recognizedRoles.includes(r));
        const primaryRole = roles.length > 0 ? roles[0] : 'user';
        
        // Ambil NIP dari berbagai sumber
        let nipRaw = '';
        let nipClean = '';
        
        // 1. Coba dari attributes
        if (profile.attributes?.nip) {
          nipRaw = Array.isArray(profile.attributes.nip) ? profile.attributes.nip[0] : profile.attributes.nip;
          nipClean = nipRaw.replace(/\s/g, '');
        }
        // 2. Coba dari preferred_username
        else if (profile.preferred_username) {
          nipClean = profile.preferred_username;
          nipRaw = formatNipWithSpaces(nipClean);
        }
        
        console.log("📋 Profile data:", {
          sub: profile.sub,
          preferred_username: profile.preferred_username,
          email: profile.email,
          name: profile.name,
          nip_raw: nipRaw,
          nip_clean: nipClean,
          roles: roles,
          primaryRole: primaryRole
        });
        
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          role: primaryRole,       // Role utama (untuk backward compatibility)
          roles: roles,            // SEMUA roles (array) — untuk multi-role
          nip: nipClean,           // NIP tanpa spasi (untuk filter)
          nip_raw: nipRaw,         // NIP dengan spasi (untuk display & database)
          username: profile.preferred_username,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.roles = user.roles;     // SEMUA roles (array)
        token.nip = user.nip;         // NIP tanpa spasi
        token.nip_raw = user.nip_raw; // NIP dengan spasi
        token.username = user.username;
        // Token asli TETAP disimpan di cookie NextAuth (HttpOnly + terenkripsi).
        // Cookie ini hanya bisa dibaca di server (lihat pages/api/backend/[...path].js).
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Klaim tampilan (bukan token) supaya UI tetap punya data yang dulu
        // diambil dengan mendekode token di browser.
        const claims = decodeJwtPayload(account.access_token);
        token.displayClaims = {
          preferred_username: claims.preferred_username || user.username,
          jabatan: claims.jabatan || null,
        };

        return token;
      }

      // --- Perpanjang token sebelum kedaluwarsa (60 detik lebih awal) ---
      const nowSec = Math.floor(Date.now() / 1000);
      if (!token.expiresAt || nowSec < token.expiresAt - 60) {
        return token; // masih berlaku
      }
      if (!token.refreshToken) {
        return token; // sesi lama (dibuat sebelum fitur refresh) — biarkan seperti dulu
      }
      try {
        const refreshed = await refreshAccessToken(token);
        console.log('🔄 Access token diperbarui lewat refresh token');
        return refreshed;
      } catch (refreshError) {
        console.error('❌ Gagal memperbarui access token:', refreshError.message);
        return { ...token, error: 'RefreshTokenError' };
      }
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
          roles: token.roles,       // SEMUA roles (array)
          nip: token.nip,           // NIP tanpa spasi
          nip_raw: token.nip_raw,   // NIP dengan spasi
          username: token.username,
          // klaim tampilan (bukan token) — dulu diambil dari mendekode token
          preferred_username: token.displayClaims?.preferred_username || token.username,
          jabatan: token.displayClaims?.jabatan || undefined,
        };

        // PENTING (keamanan): token asli TIDAK boleh masuk ke sini.
        // Nilai di bawah hanya penanda "sudah login" supaya pemeriksaan
        // `if (!session?.accessToken)` di komponen lama tetap berjalan.
        // Token asli dibaca dari cookie HttpOnly di server oleh
        // pages/api/backend/[...path].js — jadi tidak pernah sampai ke browser.
        session.accessToken = 'session';
        session.clientId = process.env.KEYCLOAK_CLIENT_ID || 'nextjs-local';
        // Bukan rahasia: hanya penanda bahwa token tidak bisa diperbarui lagi
        // (refresh token kedaluwarsa) sehingga klien perlu login ulang.
        session.error = token.error || null;
        session.expires = token.expiresAt ? 
          new Date(token.expiresAt * 1000).toISOString() : null;
      }
      
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Relative URL atau URL internal → aman
      if (url.startsWith('/')) return url;

      try {
        const urlObj = new URL(url);
        // Redirect ke Keycloak (authorization) — selalu izinkan
        if (urlObj.hostname === 'auth.bbpompky.id') return url;
        // Redirect internal — izinkan jika hostname sama
        const baseObj = new URL(baseUrl);
        if (urlObj.hostname === baseObj.hostname) return url;
      } catch {
        // URL tidak valid
      }
      // Redirect mencurigakan → fallback ke baseUrl
      return baseUrl;
    },
  },

  events: {
    async signOut({ token }) {
      // Hancurkan Keycloak SSO session saat NextAuth logout
      if (token?.idToken) {
        const issuer = process.env.KEYCLOAK_ISSUER;
        const clientId = process.env.KEYCLOAK_CLIENT_ID || 'kepegawaian';
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${token.idToken}&post_logout_redirect_uri=${process.env.NEXTAUTH_URL}/login&client_id=${clientId}`;
        try {
          await fetch(logoutUrl);
        } catch (error) {
          console.error('❌ Keycloak SSO logout error:', error);
        }
      }
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60,
  },

  // debug NextAuth bisa menulis token ke log server -> matikan.
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,

};

// Lazy initialization — hindari NextAuth() di module level (bisa error build cache)
let nextAuthHandler;

export default async function handler(req, res) {
  if (!nextAuthHandler) {
    nextAuthHandler = NextAuth(authOptions);
  }
  const path = req.query.nextauth?.[0];
  const origin = req.headers.origin || req.headers.referer || '';

  // Hapus X-Powered-By
  res.removeHeader('X-Powered-By');

  // Proteksi /api/auth/providers
  if (path === 'providers') {
    if (origin) {
      const allowed = [
        process.env.NEXTAUTH_URL,
        'http://localhost:3002',
        'https://tambun-raya.bbpompky.id',
        'https://auth.bbpompky.id',
      ];
      const isTrusted = allowed.some(d => d && origin.includes(d));
      if (!isTrusted) return res.status(404).end();
    } else {
      // Akses langsung tanpa origin → 404
      return res.status(404).end();
    }
  }

  // Proteksi /api/auth/csrf — blokir jika:
  // - Origin terisi dan tidak trusted (dari situs luar)
  // - Origin kosong (akses langsung curl/browser)
  if (path === 'csrf') {
    if (origin) {
      const allowed = [
        process.env.NEXTAUTH_URL,
        'http://localhost:3002',
        'https://tambun-raya.bbpompky.id',
        'https://auth.bbpompky.id',
      ];
      const isTrusted = allowed.some(d => d && origin.includes(d));
      if (!isTrusted) return res.status(403).end();
    } else {
      // Origin kosong — tetap blokir (fetch dari app selalu sertakan origin)
      return res.status(403).end();
    }
  }

  return nextAuthHandler(req, res);
}