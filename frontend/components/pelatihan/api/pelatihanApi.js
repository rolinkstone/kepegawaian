// components/pelatihan/api/pelatihanApi.js

/**
 * Helper untuk mendapatkan token
 */
const getToken = (session) => {
    return session?.accessToken || localStorage.getItem('token');
};

/**
 * Helper untuk handle response
 */
const handleResponse = async (response) => {
    const clonedResponse = response.clone();
    
    try {
        const text = await clonedResponse.text();
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error('Response bukan format JSON yang valid');
        }
        
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || `HTTP Error ${response.status}`
            };
        }
        
        return result;
    } catch (error) {
        throw error;
    }
};

// ========== MASTER PELATIHAN API ==========

/**
 * GET /api/pelatihan/master
 */
export const fetchMasterPelatihan = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/master`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /api/pelatihan/master/:id
 */
export const fetchMasterPelatihanById = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/master/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * POST /api/pelatihan/master
 */
// components/pelatihan/api/pelatihanApi.js

/**
 * POST /api/pelatihan/master
 */
export const createMasterPelatihan = async (session, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/master`;
    
    console.log('📤 POST to:', url);
    console.log('📤 Data:', data);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await handleResponse(response);
        console.log('📥 Response:', result);
        return result;
    } catch (error) {
        console.error('❌ Error:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * PUT /api/pelatihan/master/:id
 */
export const updateMasterPelatihan = async (session, id, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/master/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * DELETE /api/pelatihan/master/:id
 */
export const deleteMasterPelatihan = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/master/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// ========== JADWAL PELATIHAN API ==========

/**
 * GET /api/pelatihan/jadwal
 */
export const fetchJadwalPelatihan = async (session, params = {}) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /api/pelatihan/jadwal/:id
 */
export const fetchJadwalPelatihanById = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * POST /api/pelatihan/jadwal
 */
export const createJadwalPelatihan = async (session, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * PUT /api/pelatihan/jadwal/:id
 */
export const updateJadwalPelatihan = async (session, id, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * DELETE /api/pelatihan/jadwal/:id
 */
export const deleteJadwalPelatihan = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * POST /api/pelatihan/jadwal/:id/publikasi
 */
export const publikasiJadwal = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal/${id}/publikasi`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// ========== PESERTA PELATIHAN API ==========

/**
 * POST /api/pelatihan/jadwal/:id/tambah-peserta
 */
export const tambahPeserta = async (session, idJadwal, pesertaIds) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/jadwal/${idJadwal}/tambah-peserta`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ peserta_ids: pesertaIds })
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * PUT /api/pelatihan/peserta/:id
 */
export const updateStatusPeserta = async (session, id, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/peserta/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * POST /api/pelatihan/peserta/:id/kompetensi-terpenuhi
 */
export const simpanKompetensiTerpenuhi = async (session, idPeserta, kompetensiIds) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/peserta/${idPeserta}/kompetensi-terpenuhi`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ kompetensi_ids: kompetensiIds })
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// ========== OPTIONS API ==========

/**
 * GET /api/pelatihan/options/all
 */
// components/pelatihan/api/pelatihanApi.js

// ========== OPTIONS API ==========

/**
 * GET /api/pelatihan/options/all
 */
export const fetchOptions = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: {
                pelatihan: [],
                users: [],
                kompetensi: [], // TAMBAHKAN INI
                status_options: [],
                metode_options: []
            }
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/options/all`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: {
                pelatihan: [],
                users: [],
                kompetensi: [], // TAMBAHKAN INI
                status_options: [],
                metode_options: []
            }
        };
    }
};

// components/pelatihan/api/pelatihanApi.js

/**
 * GET /api/pelatihan/undangan
 * Mendapatkan daftar undangan untuk user yang login
 */
export const fetchUndanganPeserta = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/undangan`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * PUT /api/pelatihan/undangan/:id
 * Merespon undangan (terima/tolak)
 */
// components/pelatihan/api/pelatihanApi.js

/**
 * PUT /api/pelatihan/undangan/:id
 * Merespon undangan (terima/tolak)
 */
export const respondUndangan = async (session, id, status) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/undangan/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status_undangan: status })
        });
        
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// ========== KOMPETENSI WAJIB API ==========

/**
 * GET /api/pelatihan/kompetensi-wajib
 * Mendapatkan semua kompetensi wajib
 */
export const fetchKompetensiWajib = async (session, params = {}) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const queryParams = new URLSearchParams();
    if (params.tahun) queryParams.append('tahun', params.tahun);
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching kompetensi wajib:', error);
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /api/pelatihan/kompetensi-wajib/tahun/:tahun
 * Mendapatkan kompetensi wajib berdasarkan tahun
 */
export const fetchKompetensiWajibByTahun = async (session, tahun) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/tahun/${tahun}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching kompetensi wajib by tahun:', error);
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /api/pelatihan/kompetensi-wajib/tahun-options
 * Mendapatkan daftar tahun yang tersedia
 */
export const fetchTahunOptions = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/tahun-options`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching tahun options:', error);
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /api/pelatihan/kompetensi-wajib/options/kompetensi
 * Mendapatkan daftar kompetensi yang belum menjadi wajib untuk tahun tertentu
 */
export const fetchAvailableKompetensi = async (session, tahun) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/options/kompetensi${tahun ? `?tahun=${tahun}` : ''}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching available kompetensi:', error);
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * POST /api/pelatihan/kompetensi-wajib
 * Menambah kompetensi wajib baru (hanya admin)
 */
export const createKompetensiWajib = async (session, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib`;
    
    console.log('📤 POST /kompetensi-wajib:', data);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating kompetensi wajib:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * POST /api/pelatihan/kompetensi-wajib/bulk
 * Menambah multiple kompetensi wajib sekaligus (hanya admin)
 */
export const createKompetensiWajibBulk = async (session, kompetensiIds, tahun) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/bulk`;
    
    console.log('📤 POST /kompetensi-wajib/bulk:', { kompetensi_ids: kompetensiIds, tahun });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kompetensi_ids: kompetensiIds,
                tahun: tahun
            })
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating kompetensi wajib bulk:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * DELETE /api/pelatihan/kompetensi-wajib/:id
 * Menghapus kompetensi wajib (hanya admin)
 */
export const deleteKompetensiWajib = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error deleting kompetensi wajib:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * DELETE /api/pelatihan/kompetensi-wajib/tahun/:tahun
 * Menghapus semua kompetensi wajib untuk tahun tertentu (hanya admin)
 */
export const deleteKompetensiWajibByTahun = async (session, tahun) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/pelatihan/kompetensi-wajib/tahun/${tahun}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return await handleResponse(response);
    } catch (error) {
        console.error('Error deleting kompetensi wajib by tahun:', error);
        return {
            success: false,
            message: error.message
        };
    }
};