// components/prioritaskompetensi/api/prioritasKompetensiApi.js

/**
 * Helper untuk mendapatkan token
 */
const getToken = (session) => {
    if (session?.accessToken) return session.accessToken;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
};

const handleResponse = async (response) => {
    const text = await response.text();

    let result;
    try {
        result = text ? JSON.parse(text) : {};
    } catch (error) {
        console.error('❌ Response bukan JSON:', text.substring(0, 300));
        throw new Error('Response bukan format JSON yang valid');
    }

    if (!response.ok) {
        return {
            success: false,
            message: result.message || result.error || `HTTP Error ${response.status}`
        };
    }

    return result;
};

const requestJson = async (session, url, options = {}) => {
    const token = getToken(session);

    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    return handleResponse(response);
};

/**
 * GET /prioritas-kompetensi
 */
export const fetchPrioritasKompetensi = async (session, params = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value);
        }
    });

    const queryString = query.toString();
    const url = `${baseUrl}/prioritas-kompetensi${queryString ? `?${queryString}` : ''}`;

    return requestJson(session, url);
};

/**
 * GET /prioritas-kompetensi/rekap — rekap per kompetensi + jenjang
 */
export const fetchRekapPrioritasKompetensi = async (session, params = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value);
        }
    });

    const queryString = query.toString();
    const url = `${baseUrl}/prioritas-kompetensi/rekap${queryString ? `?${queryString}` : ''}`;

    return requestJson(session, url);
};

/**
 * GET /prioritas-kompetensi/detail — daftar pegawai untuk satu kompetensi + jenjang
 */
export const fetchDetailPrioritasKompetensi = async (session, { id_kompetensi, id_jenjang, search } = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const query = new URLSearchParams({
        id_kompetensi,
        id_jenjang
    });

    if (search) query.append('search', search);

    return requestJson(session, `${baseUrl}/prioritas-kompetensi/detail?${query.toString()}`);
};

/**
 * GET /prioritas-kompetensi/rekap-pegawai — rekap per pegawai
 */
export const fetchRekapPegawaiPrioritasKompetensi = async (session, params = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value);
        }
    });

    const queryString = query.toString();
    const url = `${baseUrl}/prioritas-kompetensi/rekap-pegawai${queryString ? `?${queryString}` : ''}`;

    return requestJson(session, url);
};

/**
 * GET /prioritas-kompetensi/detail-pegawai — daftar kompetensi milik satu pegawai
 */
export const fetchDetailPegawaiPrioritasKompetensi = async (session, { id_user, search } = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const query = new URLSearchParams({ id_user });

    if (search) query.append('search', search);

    return requestJson(session, `${baseUrl}/prioritas-kompetensi/detail-pegawai?${query.toString()}`);
};

/**
 * PUT /prioritas-kompetensi — simpan satu isian (prioritas null = hapus)
 */
export const updatePrioritasKompetensi = async (session, payload) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    return requestJson(session, `${baseUrl}/prioritas-kompetensi`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

/**
 * PUT /prioritas-kompetensi/bulk — simpan banyak baris sekaligus
 */
export const bulkUpdatePrioritasKompetensi = async (session, items, prioritas) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    return requestJson(session, `${baseUrl}/prioritas-kompetensi/bulk`, {
        method: 'PUT',
        body: JSON.stringify({ items, prioritas })
    });
};

/**
 * Ambil opsi master untuk filter jabatan/jenjang/fungsi
 */
const fetchMasterOptions = async (session, path) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const result = await requestJson(session, `${baseUrl}/master/${path}`);

    return result.success && Array.isArray(result.data) ? result.data : [];
};

export const fetchFilterOptions = async (session) => {
    const [jabatan, jenjang, fungsi] = await Promise.all([
        fetchMasterOptions(session, 'jabatan'),
        fetchMasterOptions(session, 'jenjang'),
        fetchMasterOptions(session, 'fungsi')
    ]);

    return { jabatan, jenjang, fungsi };
};
