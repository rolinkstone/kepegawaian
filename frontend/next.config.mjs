/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sembunyikan X-Powered-By: Next.js
  poweredByHeader: false,

  async headers() {
    return [
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
