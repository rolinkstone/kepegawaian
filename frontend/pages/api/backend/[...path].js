// pages/api/backend/[...path].js
//
// PROXY API ke backend.
//
// Tujuan keamanan: token Keycloak TIDAK PERNAH dikirim ke browser. Cookie sesi
// NextAuth (HttpOnly, terenkripsi) tetap menyimpan token asli; route ini
// membacanya DI SERVER lalu menambahkan header `Authorization` saat meneruskan
// permintaan ke backend.
//
// Klien cukup memanggil URL relatif (NEXT_PUBLIC_API_URL=/api/backend), jadi
// header Authorization dari browser selalu diabaikan/dibuang.
import { getToken } from 'next-auth/jwt';

// Body tidak di-parse: diteruskan mentah sebagai stream supaya upload multipart
// (sampai 20MB) tidak perlu ditampung di memori proxy.
export const config = {
  api: { bodyParser: false },
};

const BACKEND_BASE = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:5001'
).replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 120 * 1000;

const PASS_THROUGH_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'etag',
  'last-modified',
  'content-length',
  'content-language',
];

// Klien memakai `NEXT_PUBLIC_API_URL` = '/api/backend' lalu menambahkan path
// backend, mis. '/pegawai' atau '/api/userskompetensi/1'. Sebagian kode lama
// menambahkan '/api' lagi, jadi di sini path dinormalkan menjadi TEPAT satu
// prefix '/api'.
function toBackendPath(segments) {
  const raw = (Array.isArray(segments) ? segments : [segments]).filter(Boolean);
  if (raw.some((s) => s.includes('..'))) return null;

  let rest = `/${raw.join('/')}`;
  while (/^\/api(\/|$)/i.test(rest)) rest = rest.replace(/^\/api/i, '');
  if (!rest.startsWith('/')) rest = `/${rest}`;
  return `/api${rest === '/' ? '' : rest}`;
}

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.accessToken) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Sesi tidak ditemukan - silakan login kembali',
    });
  }

  const backendPath = toBackendPath(req.query.path);
  if (!backendPath) {
    return res.status(400).json({ success: false, message: 'Path tidak valid' });
  }

  const queryIndex = (req.url || '').indexOf('?');
  const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  const target = `${BACKEND_BASE}${backendPath}${query}`;

  const headers = {
    // Token asli hanya ada di server. Header Authorization dari browser
    // SENGAJA tidak diteruskan.
    authorization: `Bearer ${token.accessToken}`,
    accept: req.headers.accept || 'application/json',
    'accept-language': req.headers['accept-language'] || 'id',
    // Supaya rate limit & audit log backend tetap melihat IP pengguna asli,
    // bukan IP container frontend.
    'x-forwarded-for': req.socket?.remoteAddress || '',
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
  };
  for (const h of ['content-type', 'range', 'if-none-match']) {
    if (req.headers[h]) headers[h] = req.headers[h];
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = req; // stream mentah (termasuk multipart upload)
    init.duplex = 'half';
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (error) {
    console.error(`❌ Proxy gagal ${req.method} ${backendPath}:`, error.message);
    return res.status(502).json({
      success: false,
      message: 'Tidak dapat menghubungi server backend',
    });
  }

  res.status(upstream.status);
  for (const header of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) res.setHeader(header, value);
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  return res.send(body);
}
