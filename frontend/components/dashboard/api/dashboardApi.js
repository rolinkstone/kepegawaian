// components/dashboard/api/dashboardApi.js

const getToken = (session) => {
    return session?.accessToken || localStorage.getItem('token');
};

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
        
        if (!response.ok) {
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

/**
 * GET /api/dashboard/stats
 */
export const fetchDashboardStats = async (session) => {
    const token = getToken(session);
    
    if (!token) {
        return {
            success: false,
            message: 'Token tidak ditemukan',
            data: null
        };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/dashboard/stats`;
    
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
            data: null
        };
    }
};