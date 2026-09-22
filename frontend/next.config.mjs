/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

// ============================================================================
//  GUARD: NEXT_PUBLIC_API_URL wajib '/api/backend'
// ============================================================================
// Sejak token Keycloak tidak lagi dikirim ke browser (hanya ada di cookie HttpOnly),
// klien HANYA bisa mengambil data lewat proxy same-origin /api/backend.
// Kalau variabel ini diisi URL backend langsung (mis. https://api-tambun.bbpompky.id/api),
// aplikasi gagal total di browser: CSP `connect-src 'self'` memblokir request itu
// (gejalanya "Failed to fetch") dan klien juga tidak punya token yang sah.
// Lebih baik build GAGAL dengan pesan jelas daripada men-deploy aplikasi rusak.
const API_BASE = '/api/backend';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (configuredApiUrl && configuredApiUrl !== API_BASE) {
  throw new Error(
    `NEXT_PUBLIC_API_URL harus "${API_BASE}", tetapi berisi "${configuredApiUrl}".\n` +
      'Klien wajib memanggil backend lewat proxy same-origin (DEPLOY.md bagian 8).\n' +
      'Perbaiki nilainya di .env / build args frontend, lalu build ulang.'
  );
}

// Origin Keycloak untuk form-action (halaman login diarahkan ke sana).
const keycloakOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || '').origin;
  } catch {
    return null;
  }
})();

// CSP = lapisan kedua terhadap XSS (token sendiri sudah tidak dikirim ke browser).
// - 'unsafe-inline' masih perlu: Next.js & Ant Design menyuntikkan script/style inline.
// - cdnjs.cloudflare.com dipakai saat mencetak QR (utils/printUtils.js).
// - www.emsifa.com dipakai untuk data wilayah di form kegiatan.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://www.emsifa.com${isDev ? ' ws: wss:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self'${keycloakOrigin ? ` ${keycloakOrigin}` : ''}`,
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig = {
  // Sembunyikan X-Powered-By: Next.js
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Berlaku untuk semua halaman/aset
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Favicon "nyangkut" di cache favicon browser (Chromium menyimpannya
        // di database terpisah, tidak ikut ter-refresh saat hard reload).
        // no-store mencegah ikon lama disimpan, jadi penggantian favicon
        // langsung terlihat tanpa perlu bump query `?v=` di _document.js.
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
