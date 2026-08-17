// components/pegawai/api/peranPemenuhanApi.js
/**
 * Service untuk endpoint /api/pegawai-peran
 * Digunakan oleh halaman "Pemenuhan per Peran" (Profil Kompetensi)
 */

const getToken = (session) => {
    return session?.accessToken || (
        typeof window !== 'undefined'
            ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
            : null
    );
};

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/pegawai-peran`;

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
 * GET /pegawai-peran/rekap
 * Rekapitulasi pemenuhan kompetensi untuk semua peran.
 */
export const getRekapPeran = async (session) => {
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
        console.error('❌ Error getRekapPeran:', error);
        return { success: false, message: error.message || 'Gagal mengambil rekap peran', data: [] };
    }
};

/**
 * GET /pegawai-peran/:peranId/pemenuhan
 * Detail pemenuhan pegawai untuk satu peran.
 *
 * @param {Object} session  - NextAuth session
 * @param {number|string} peranId - ID peran
 * @param {Object} params   - { search, id_fungsi }
 */
export const getPemenuhanPeran = async (session, peranId, params = {}) => {
    const token = getToken(session);

    if (!token) {
        return { success: false, message: 'Token tidak ditemukan. Silakan login kembali.', data: [] };
    }

    try {
        const url = new URL(`${BASE_URL}/${peranId}/pemenuhan`);

        if (params.search && params.search !== '') {
            url.searchParams.append('search', params.search);
        }
        if (params.id_fungsi && params.id_fungsi !== '') {
            url.searchParams.append('id_fungsi', params.id_fungsi);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('❌ Error getPemenuhanPeran:', error);
        return { success: false, message: error.message || 'Gagal mengambil data pemenuhan', data: [] };
    }
};
