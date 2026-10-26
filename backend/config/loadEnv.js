// Pemuat environment backend.
//
// Sebelumnya hanya `.env.local` yang dibaca, sehingga aplikasi gagal start
// ("KEYCLOAK_SERVER_URL is required") kalau konfigurasi lokal ada di `.env`.
// Sekarang keduanya dibaca: `.env` dulu, lalu `.env.local` menimpanya.
//
// Variabel yang SUDAH ada di process.env (mis. dari Docker Compose atau shell)
// tidak pernah ditimpa, supaya deployment tetap memakai nilai dari compose.
//
// Path dihitung dari folder backend (bukan CWD), jadi `node server.js` tetap
// benar walau dijalankan dari direktori lain.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const BACKEND_ROOT = path.join(__dirname, '..');
const ENV_FILES = ['.env', '.env.local'];

/**
 * Muat file environment backend dan kembalikan daftar file yang benar-benar ada.
 */
function loadEnv() {
  const preset = new Set(Object.keys(process.env));
  const loaded = [];

  for (const file of ENV_FILES) {
    const fullPath = path.join(BACKEND_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    let parsed;
    try {
      parsed = dotenv.parse(fs.readFileSync(fullPath));
    } catch (error) {
      console.error(`⚠️  Gagal membaca ${file}:`, error.message);
      continue;
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (!preset.has(key)) process.env[key] = value;
    }

    loaded.push(file);
  }

  return loaded;
}

module.exports = { loadEnv, ENV_FILES };
