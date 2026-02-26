// components/userskompetensi/api/userKompetensiApi.js

/**
 * Helper untuk mendapatkan token
 */
const getToken = (session) => {
    return session?.accessToken || localStorage.getItem('token');
};

/**
 * Helper untuk handle response - TANPA ERROR DI CONSOLE
 */
const handleResponse = async (response) => {
    const clonedResponse = response.clone();
    
    try {
        const text = await clonedResponse.text();
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            // Return object error, jangan throw
            return {
                success: false,
                message: 'Response bukan format JSON yang valid',
                _parseError: true
            };
        }
        
        // Untuk semua response, kita return result apa adanya
        // Tidak perlu throw error
        return result;
    } catch (error) {
        // Return object error, jangan throw
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan',
            _networkError: true
        };
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
export const fetchUserKompetensi = async (session, params = {}) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan. Silakan login kembali.'
        };
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('all', 'true');
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/userskompetensi?${queryParams.toString()}`;
    
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
                message: result.message || 'Gagal memuat data',
                data: []
            };
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Terjadi kesalahan koneksi',
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
    
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await handleResponse(response);
        
        if (!response.ok && result.success === undefined) {
            return {
                success: false,
                message: result.message || 'Gagal verifikasi data'
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