// utils/keycloakJwt.js
// Verifikasi tanda tangan access token Keycloak memakai JWKS realm.
// Sebelumnya backend hanya `jwt.decode()` (tanpa verifikasi) sehingga token
// palsu buatan siapa pun bisa diterima. Modul ini fail-closed:
// token tanpa tanda tangan sah SELALU ditolak.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWKS_TTL_MS = 10 * 60 * 1000;        // cache JWKS 10 menit
const JWKS_TIMEOUT_MS = 10 * 1000;         // timeout ambil JWKS

let cachedKeys = null;
let cachedAt = 0;
let inFlight = null;

function getIssuer() {
  const base = (process.env.KEYCLOAK_SERVER_URL || 'https://auth.bbpompky.id').replace(/\/+$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'master';
  return `${base}/realms/${realm}`;
}

function getAudiences() {
  return (process.env.KEYCLOAK_AUDIENCES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchJwks(force = false) {
  const fresh = cachedKeys && Date.now() - cachedAt < JWKS_TTL_MS;
  if (!force && fresh) return cachedKeys;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const url = `${getIssuer()}/protocol/openid-connect/certs`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JWKS_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`JWKS HTTP ${res.status}`);
      const body = await res.json();
      const keys = Array.isArray(body?.keys) ? body.keys : [];
      if (keys.length === 0) throw new Error('JWKS kosong');
      cachedKeys = keys;
      cachedAt = Date.now();
      return keys;
    } finally {
      clearTimeout(timer);
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

function toPublicKey(jwk) {
  return crypto.createPublicKey({ key: jwk, format: 'jwk' });
}

const ALGS_BY_KTY = {
  RSA: ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'],
  EC: ['ES256', 'ES384', 'ES512'],
  OKP: ['EdDSA'],
};

function pickKey(keys, kid) {
  if (!Array.isArray(keys) || keys.length === 0) return null;
  if (kid) return keys.find((k) => k.kid === kid) || null;
  // Token tanpa kid: hanya boleh kalau JWKS memang punya satu kunci.
  return keys.length === 1 ? keys[0] : null;
}

/**
 * Verifikasi access token Keycloak (signature + iss + exp, opsional aud/typ).
 * @param {string} token
 * @returns {Promise<object>} payload token yang sudah terverifikasi
 * @throws {Error} bila token tidak valid
 */
async function verifyAccessToken(token) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('token kosong');
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) throw new Error('format token tidak valid');

  const { alg, kid } = decoded.header;
  if (!alg || alg === 'none' || /^HS/i.test(alg)) {
    throw new Error(`algoritma token tidak diizinkan: ${alg || '(kosong)'}`);
  }

  let jwk = pickKey(await fetchJwks(false), kid);
  if (!jwk && kid) {
    // Mungkin kunci baru (rotasi) — paksa ambil ulang sekali.
    jwk = pickKey(await fetchJwks(true), kid);
  }
  if (!jwk) throw new Error('kunci penandatangan tidak ditemukan di JWKS');

  const allowedAlgs = ALGS_BY_KTY[jwk.kty] || [];
  if (!allowedAlgs.includes(alg)) {
    throw new Error(`alg ${alg} tidak cocok dengan tipe kunci ${jwk.kty}`);
  }

  const audiences = getAudiences();
  const payload = jwt.verify(token, toPublicKey(jwk), {
    algorithms: allowedAlgs,
    issuer: getIssuer(),
    ...(audiences.length > 0 ? { audience: audiences } : {}),
  });

  if (payload.typ && payload.typ !== 'Bearer') {
    throw new Error('typ token bukan Bearer');
  }

  return payload;
}

module.exports = {
  verifyAccessToken,
  getIssuer,
  getAudiences,
  // untuk pengujian
  _resetJwksCache: () => {
    cachedKeys = null;
    cachedAt = 0;
    inFlight = null;
  },
};
