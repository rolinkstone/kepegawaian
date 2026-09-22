// components/pegawai/api/kompetensiPegawaiApi.js
/**
 * Service untuk endpoint /api/kompetensi-pegawai
 * Digunakan oleh halaman "Kompetensi Pegawai" (Rekap berdasarkan kompetensi/sertifikat)
 */

const getToken = (session) => {
    return session?.accessToken || (
        typeof window !== 'undefined'
            ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
            : null
    );
};

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/kompetensi-pegawai`;

const handleResponse = async (response) => {
    const text = await response.text();

    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        console.error('❌ Gagal parse JSON:', text.substring(0, 500));
        throw new Error('Response bukan format JSON yang valid');
    }

    if (!response.ok) {
        console.error('❌ Response error:', result);
        return {
            success: false,
            message: result.message || result.error || `HTTP Error ${response.status}`,
            data: []
        };
    }

    return result;
};

/**
 * GET /kompetensi-pegawai/rekap
 * Rekapitulasi kompetensi beserta jumlah pegawai pemilik sertifikat.
 */
export const getRekapKompetensi = async (session) => {
    const token = getToken(session);

    if (!token) {
        return { success: false, message: 'Token tidak ditemukan. Silakan login kembali.', data: [] };
    }

    try {
        const response = await fetch(`${BASE_URL}/rekap`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('❌ Error getRekapKompetensi:', error);
        return { success: false, message: error.message || 'Gagal mengambil rekap kompetensi', data: [] };
    }
};

/**
 * GET /kompetensi-pegawai/:kompetensiId/pegawai
 * Detail daftar pegawai yang memiliki sertifikat kompetensi tertentu.
 *
 * @param {Object} session      - NextAuth session
 * @param {number|string} kompetensiId - ID kompetensi
 * @param {Object} params       - { search }
 */
export const getPemilikKompetensi = async (session, kompetensiId, params = {}) => {
    const token = getToken(session);

    if (!token) {
        return { success: false, message: 'Token tidak ditemukan. Silakan login kembali.', data: [] };
    }

    try {
        // CATATAN: NEXT_PUBLIC_API_URL bersifat relative ('/api/backend') supaya browser
        // memakai proxy same-origin. `new URL(relative)` tanpa base akan melempar
        // "Failed to construct 'URL': Invalid URL", jadi query string disusun manual.
        const query = new URLSearchParams();
        if (params.search && params.search !== '') {
            query.append('search', params.search);
        }
        const qs = query.toString();

        const response = await fetch(`${BASE_URL}/${kompetensiId}/pegawai${qs ? `?${qs}` : ''}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('❌ Error getPemilikKompetensi:', error);
        return { success: false, message: error.message || 'Gagal mengambil data pemilik sertifikat', data: [] };
    }
};
