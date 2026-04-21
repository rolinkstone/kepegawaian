// components/userskompetensi/api/userKompetensiApi.js

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
        console.log('📥 Response text:', text.substring(0, 200) + '...');
        
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
    } catch (error) {
        console.error('❌ Error handleResponse:', error);
        throw error;
    }
};

/**
 * POST /userskompetensi - Membuat data baru dengan FormData
 */
export const createUserKompetensi = async (session, formData) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await handleResponse(response);
        
        // Jika response tidak ok, pastikan success = false
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || 'Gagal menyimpan data',
                status: response.status
            };
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi'
        };
    }
};

/**
 * PUT /userskompetensi/:id - Mengupdate data dengan FormData
 */
export const updateUserKompetensi = async (session, id, formData) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await handleResponse(response);
        
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || 'Gagal mengupdate data',
                status: response.status
            };
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi'
        };
    }
};

/**
 * DELETE /userskompetensi/:id
 */
export const deleteUserKompetensi = async (session, id) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi/${id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await handleResponse(response);
        
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || 'Gagal menghapus data',
                status: response.status
            };
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi'
        };
    }
};

/**
 * GET /userskompetensi
 */
// components/userskompetensi/api/userKompetensiApi.js

/**
 * GET /userskompetensi
 */
/**
 * GET /userskompetensi
 */
export const fetchUserKompetensi = async (session, params = {}) => {
    const token = getToken(session);
    
    if (!token) {
        console.error('Token tidak ditemukan');
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: []
        };
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('all', 'true');
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const url = `${baseUrl}/userskompetensi?${queryParams.toString()}`;
    
    console.log('📡 Fetching from URL:', url);
    
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
        console.error('❌ fetchUserKompetensi error:', error);
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
};

/**
 * GET /userskompetensi/options/all
 */
export const fetchOptions = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.',
            data: {
                users: [],
                kompetensi: [],
                status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses']
            }
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi/options/all`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await handleResponse(response);
        
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || 'Gagal memuat options',
                data: {
                    users: [],
                    kompetensi: [],
                    status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses']
                }
            };
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi',
            data: {
                users: [],
                kompetensi: [],
                status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses']
            }
        };
    }
};

/**
 * PATCH /userskompetensi/:id/verify
 */
// components/userskompetensi/api/userKompetensiApi.js

/**
 * PATCH /userskompetensi/:id/verify
 */
// components/userskompetensi/api/userKompetensiApi.js

export const verifyUserKompetensi = async (session, id, data) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi/${id}/verify`;
    
    // Kirim data dengan verified_by berupa nama admin
    const payload = {
        status: data.status,
        hasil_verif: data.hasil_verif,
        keterangan: data.keterangan || null,
        verified_by: data.verified_by,  // Langsung nama admin dari Keycloak
        verified_by_nip: data.verified_by_nip
    };
    
    console.log('📤 Sending verification payload:', payload);
    
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            return {
                success: false,
                message: result.message || `HTTP Error ${response.status}`
            };
        }
        
        return result;
    } catch (error) {
        console.error('❌ verifyUserKompetensi error:', error);
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi'
        };
    }
};