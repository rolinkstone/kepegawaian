// components/userskompetensi/UserskompetensiContainer.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import UserskompetensiForm from './UserskompetensiForm';
import FilterSection from './FilterSection';
import DetailModal from './modals/DetailModal';
import DeleteModal from './modals/DeleteModal';
import VerifyModal from './modals/VerifyModal';
import ViewSertifikatModal from './modals/ViewSertifikatModal';
import { 
    fetchUserKompetensi, 
    fetchOptions, 
    verifyUserKompetensi, 
    deleteUserKompetensi 
} from './api/userKompetensiApi';

const UserskompetensiContainer = () => {
    const { data: session } = useSession();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [preselectUserId, setPreselectUserId] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: null,
        data: null
    });

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        id_user: '',
        id_kompetensi: '',
        fungsi_id: '',
        all: true
    });

    // Options for dropdowns
    const [options, setOptions] = useState({
        users: [],
        kompetensi: [],
        status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses']
    });

    // Pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // User roles dari session dengan parsing yang lebih baik
    const userRoles = useMemo(() => {
        if (!session) {
            console.log('🔐 Session tidak ada');
            return { isAdmin: false, isKatim: false, isUser: true, roles: [] };
        }

        console.log('🔐 ===== DEBUG USER ROLES =====');
        console.log('🔐 Session object:', JSON.stringify(session, null, 2));
        console.log('🔐 Session user:', session.user);
        
        let roles = [];
        let isAdmin = false;
        let isKatim = false;

        // CEK DARI SESSION.USER.ROLES
        if (session.user?.roles) {
            console.log('🔐 session.user.roles:', session.user.roles);
            const userRoles = session.user.roles;
            
            if (Array.isArray(userRoles)) {
                roles = [...roles, ...userRoles];
                isAdmin = isAdmin || userRoles.includes('admin_tambun_raya');
                isKatim = isKatim || userRoles.includes('katim');
                console.log('🔐 Dari array roles - admin_tambun_raya:', userRoles.includes('admin_tambun_raya'));
            } else if (typeof userRoles === 'string') {
                const roleArray = userRoles.split(',').map(r => r.trim());
                roles = [...roles, ...roleArray];
                isAdmin = isAdmin || roleArray.includes('admin_tambun_raya');
                isKatim = isKatim || roleArray.includes('katim');
                console.log('🔐 Dari string roles - admin_tambun_raya:', roleArray.includes('admin_tambun_raya'));
            }
        }

        // CEK DARI SESSION.USER.REALM_ACCESS (Keycloak specific)
        if (session.user?.realm_access?.roles) {
            console.log('🔐 realm_access.roles:', session.user.realm_access.roles);
            const realmRoles = session.user.realm_access.roles;
            roles = [...roles, ...realmRoles];
            isAdmin = isAdmin || realmRoles.includes('admin_tambun_raya');
            isKatim = isKatim || realmRoles.includes('katim');
            console.log('🔐 Dari realm_access - admin_tambun_raya:', realmRoles.includes('admin_tambun_raya'));
        }

        // CEK DARI SESSION.USER.RESOURCE_ACCESS (Keycloak specific)
        if (session.user?.resource_access) {
            console.log('🔐 resource_access:', session.user.resource_access);
            Object.keys(session.user.resource_access).forEach(client => {
                if (session.user.resource_access[client].roles) {
                    const clientRoles = session.user.resource_access[client].roles;
                    roles = [...roles, ...clientRoles];
                    isAdmin = isAdmin || clientRoles.includes('admin_tambun_raya');
                    isKatim = isKatim || clientRoles.includes('katim');
                    console.log(`🔐 Dari resource_access.${client} - admin_tambun_raya:`, clientRoles.includes('admin_tambun_raya'));
                }
            });
        }

        // CEK DARI TOKEN (jika ada)
        if (session.accessToken) {
            try {
                const tokenParts = session.accessToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('🔐 Token payload:', payload);
                    
                    if (payload.realm_access?.roles) {
                        roles = [...roles, ...payload.realm_access.roles];
                        isAdmin = isAdmin || payload.realm_access.roles.includes('admin_tambun_raya');
                        isKatim = isKatim || payload.realm_access.roles.includes('katim');
                    }
                    
                    if (payload.resource_access) {
                        Object.keys(payload.resource_access).forEach(client => {
                            if (payload.resource_access[client].roles) {
                                roles = [...roles, ...payload.resource_access[client].roles];
                                isAdmin = isAdmin || payload.resource_access[client].roles.includes('admin_tambun_raya');
                                isKatim = isKatim || payload.resource_access[client].roles.includes('katim');
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }

        // Hapus duplikasi roles
        roles = [...new Set(roles)];

        console.log('🔐 FINAL Results:');
        console.log('🔐 - roles:', roles);
        console.log('🔐 - isAdmin:', isAdmin);
        console.log('🔐 - isKatim:', isKatim);
        console.log('🔐 ===== END DEBUG =====');

        return { 
            isAdmin, 
            isKatim, 
            isUser: !isAdmin && !isKatim,
            roles 
        };
    }, [session]);

    const isAdminTambunRaya = userRoles.isAdmin;
    const isKatim = userRoles.isKatim;
    
    // Tentukan apakah user bisa melakukan operasi tulis
    const canWrite = true; // Semua user bisa menambah dan mengedit
    const canVerify = isAdminTambunRaya; // HANYA ADMIN yang bisa verifikasi
    const canView = true; // Semua user bisa view

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        lulus: 0,
        tidakLulus: 0,
        dalamProses: 0
    });

    // ========== FETCH OPTIONS ==========
   // components/userskompetensi/UserskompetensiContainer.js

// components/userskompetensi/UserskompetensiContainer.js

// Fungsi helper untuk mendapatkan NIP dari session
const getUserNip = useCallback(() => {
    if (!session?.user) return null;
    
    // Coba dari berbagai sumber
    const possibleNip = 
        session.user.preferred_username ||
        session.user.username ||
        session.user.nip ||
        session.user.email?.split('@')[0] || // Ambil sebelum @ jika email
        null;
    
    console.log('🔍 Mencari NIP dari session:', {
        preferred_username: session.user.preferred_username,
        username: session.user.username,
        nip: session.user.nip,
        email: session.user.email,
        result: possibleNip
    });
    
    // Normalisasi: hapus semua spasi
    return possibleNip ? String(possibleNip).replace(/\s/g, '') : null;
}, [session]);

// ========== FETCH OPTIONS ==========
const fetchOptionsData = useCallback(async () => {
    try {
        console.log('📌 Fetching options...');
        const result = await fetchOptions(session);
        if (result.success) {
            // Filter options users berdasarkan role
            let usersData = result.data.users || [];
            
            // Jika bukan admin, hanya tampilkan dirinya sendiri di dropdown
            if (!userRoles.isAdmin && !userRoles.isKatim) {
                const userNip = getUserNip();
                if (userNip) {
                    const cleanNip = String(userNip).replace(/\s/g, '');
                    usersData = usersData.filter(user => {
                        const dbNip = String(user.nip || '').replace(/\s/g, '');
                        return dbNip === cleanNip;
                    });
                    console.log('📌 Filtered users for non-admin:', usersData);
                } else {
                    console.warn('⚠️ userNip tidak ditemukan, tidak bisa memfilter users');
                }
            }
            
            setOptions({
                ...result.data,
                users: usersData
            });
            console.log('📌 Options loaded:', result.data);
        }
    } catch (error) {
        console.error('Error fetching options:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Gagal mengambil data options: ' + error.message
        });
    }
}, [session, userRoles.isAdmin, userRoles.isKatim, getUserNip]);

// ========== FETCH DATA ==========
const fetchData = useCallback(async (showMessage = true) => {
    setLoading(true);
    try {
        console.log('📌 Fetching data with params:', filters);
        
        const params = {
            all: true
        };
        
        const result = await fetchUserKompetensi(session, params);

        if (result.success) {
            console.log('📌 Fetched data:', result.data?.length || 0, 'items');
            
            // Filter data berdasarkan role
            let fetchedData = result.data || [];
            
            // Dapatkan NIP user dari session
            const userNip = getUserNip();
            console.log('🔍 Current user NIP:', userNip);
            
            // Log sample data untuk debugging
            if (fetchedData.length > 0) {
                console.log('📌 Sample data:', {
                    firstItem: fetchedData[0],
                    allNips: fetchedData.map(d => d.user_nip)
                });
            }
            
            // FILTER BERDASARKAN ROLE
            if (userRoles.isAdmin) {
                // Admin: lihat semua data
                console.log('👑 Admin: melihat semua data');
                // Tidak perlu filter
            } else if (userRoles.isKatim) {
                // Katim: lihat data di fungsi mereka (implementasi sesuai kebutuhan)
                console.log('👥 Katim: melihat data di fungsi mereka');
                // Filter berdasarkan fungsi (sesuaikan dengan kebutuhan)
                // fetchedData = fetchedData.filter(item => item.user_fungsi_id === fungsiKatim);
            } else {
                // User biasa: hanya lihat data sendiri
                console.log('👤 User biasa: hanya melihat data sendiri');
                
                if (!userNip) {
                    console.error('❌ userNip tidak ditemukan di session');
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'NIP tidak ditemukan di session. Silakan login ulang.'
                    });
                    setData([]);
                    setFilteredData([]);
                    setLoading(false);
                    return;
                }
                
                const beforeCount = fetchedData.length;
                fetchedData = fetchedData.filter(item => {
                    // Pastikan item.user_nip ada dan bandingkan dengan NIP session
                    return item.user_nip === userNip;
                });
                console.log(`📌 Filtered from ${beforeCount} to ${fetchedData.length} items for user ${userNip}`);
            }
            
            setData(fetchedData);
            setFilteredData(fetchedData);
            setPagination(prev => ({
                ...prev,
                total: fetchedData.length
            }));
            
            calculateStats(fetchedData);
            
            if (showMessage) {
                if (fetchedData.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Info',
                        text: userRoles.isAdmin ? 'Belum ada data kompetensi' : 'Belum ada data kompetensi untuk Anda',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: `Data berhasil dimuat (${fetchedData.length} kompetensi)`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            }
        } else {
            throw new Error(result.message || 'Gagal memuat data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Gagal memuat data: ${error.message}`
        });
    } finally {
        setLoading(false);
        setInitialLoading(false);
    }
}, [session, userRoles.isAdmin, userRoles.isKatim, getUserNip, filters]);

    // ========== CALCULATE STATS ==========
    const calculateStats = (data) => {
        const total = data.length;
        const lulus = data.filter(item => item.status === 'Lulus').length;
        const tidakLulus = data.filter(item => item.status === 'Tidak Lulus').length;
        const dalamProses = data.filter(item => item.status === 'Dalam Proses').length;
        
        setStats({ total, lulus, tidakLulus, dalamProses });
    };

    // components/userskompetensi/UserskompetensiContainer.js

// Tambahkan useEffect untuk notifikasi admin
useEffect(() => {
    if (data.length > 0 && userRoles.isAdmin) {
        // Hitung data yang perlu diverifikasi ulang
        const needReVerification = data.filter(item => 
            item.hasil_verif === 'Tidak Valid' || 
            item.hasil_verif === 'Perlu Revisi'
        ).length;
        
        const pendingVerification = data.filter(item => 
            !item.verified_by
        ).length;
        
        if (needReVerification > 0) {
            console.log(`📊 Ada ${needReVerification} data yang perlu diverifikasi ulang`);
            
            // Tampilkan notifikasi jika ada data yang perlu diverifikasi ulang
            if (needReVerification > 0 && !initialLoading) {
                Swal.fire({
                    icon: 'info',
                    title: 'Perhatian',
                    text: `Terdapat ${needReVerification} data yang perlu diverifikasi ulang`,
                    timer: 3000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
        }
        
        if (pendingVerification > 0) {
            console.log(`📊 Ada ${pendingVerification} data yang menunggu verifikasi`);
        }
    }
}, [data, userRoles.isAdmin, initialLoading]);
    // ========== INITIAL LOAD ==========
    useEffect(() => {
        if (session) {
            console.log('📌 Session loaded, fetching data...');
            fetchOptionsData();
            fetchData(false);
        }
    }, [session, fetchOptionsData, fetchData]);

    // ========== APPLY FILTERS ==========
    useEffect(() => {
        applyFilters();
    }, [data, filters]);

    const applyFilters = () => {
        if (!data || data.length === 0) {
            setFilteredData([]);
            return;
        }

        let result = [...data];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(item => 
                item.user_nama?.toLowerCase().includes(searchLower) ||
                item.user_nip?.toLowerCase().includes(searchLower) ||
                item.nama_kompetensi?.toLowerCase().includes(searchLower) ||
                item.kode_kompetensi?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
        }

        if (filters.id_user) {
            result = result.filter(item => item.id_user === parseInt(filters.id_user));
        }

        if (filters.id_kompetensi) {
            result = result.filter(item => item.id_kompetensi === parseInt(filters.id_kompetensi));
        }

        setFilteredData(result);
        setPagination(prev => ({
            ...prev,
            current: 1,
            total: result.length
        }));
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            status: '',
            id_user: '',
            id_kompetensi: '',
            fungsi_id: '',
            all: true
        });
        Swal.fire({
            icon: 'info',
            title: 'Filter Direset',
            text: 'Semua filter telah direset',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleRefresh = () => {
        fetchData(true);
    };

    const handleAdd = () => {
        console.log('📌 Tambah button clicked');
        setEditingData(null);
        
        // Cari user yang sedang login dari options.users
        const nip = getUserNip();
        let foundId = null;
        if (nip && options.users?.length > 0) {
            const cleanNip = String(nip).replace(/\s/g, '');
            const found = options.users.find(u => String(u.nip || '').replace(/\s/g, '') === cleanNip);
            if (found) {
                foundId = found.id;
                console.log('✅ Preselect user ID:', foundId, found.nama);
            }
        }
        setPreselectUserId(foundId);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        // Cek apakah data sudah diverifikasi dengan hasil Valid
        if (item.verified_by && item.hasil_verif === 'Valid') {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Dapat Mengedit',
                text: 'Data yang sudah diverifikasi dengan hasil VALID tidak dapat diedit'
            });
            return;
        }
        
        // Untuk data dengan hasil Tidak Valid atau Perlu Revisi, bisa diedit
        console.log('📌 Edit button clicked');
        setEditingData(item);
        setShowForm(true);
    };

    const handleViewDetail = (item) => {
        setModalConfig({
            show: true,
            type: 'detail',
            data: item
        });
    };

    const handleViewSertifikat = (item) => {
        setModalConfig({
            show: true,
            type: 'viewSertifikat',
            data: item
        });
    };

    // ========== FUNGSI UNTUK MENDAPATKAN STATUS VERIFIKASI ==========
    const getVerificationStatus = (item) => {
        const isAdminOrKatim = userRoles.isAdmin || userRoles.isKatim;

        if (!item.verified_by) {
            return {
                type: 'pending',
                label: 'Belum Diverifikasi',
                color: 'bg-yellow-100 text-yellow-800',
                message: 'Menunggu verifikasi admin',
                canEdit: true,
                canDelete: isAdminOrKatim,
                icon: '⏳'
            };
        }
        
        if (item.hasil_verif === 'Valid') {
            return {
                type: 'valid',
                label: 'Valid',
                color: 'bg-green-100 text-green-800',
                message: `Diverifikasi oleh ${item.verified_by_nama} pada ${new Date(item.verified_at).toLocaleDateString('id-ID')}`,
                canEdit: false,
                canDelete: isAdminOrKatim,
                icon: '✓'
            };
        }
        
        if (item.hasil_verif === 'Tidak Valid') {
            return {
                type: 'invalid',
                label: 'Tidak Valid',
                color: 'bg-red-100 text-red-800',
                message: `Ditolak oleh ${item.verified_by_nama}. ${item.keterangan ? 'Keterangan: ' + item.keterangan : ''}`,
                canEdit: true,
                canDelete: isAdminOrKatim,
                icon: '✗'
            };
        }
        
        if (item.hasil_verif === 'Perlu Revisi') {
            return {
                type: 'revision',
                label: 'Perlu Revisi',
                color: 'bg-orange-100 text-orange-800',
                message: `Perlu revisi oleh ${item.verified_by_nama}. ${item.keterangan ? 'Keterangan: ' + item.keterangan : ''}`,
                canEdit: true,
                canDelete: isAdminOrKatim,
                icon: '↻'
            };
        }
        
        return {
            type: 'unknown',
            label: item.status,
            color: 'bg-gray-100 text-gray-800',
            message: '',
            canEdit: !item.verified_by,
            canDelete: isAdminOrKatim,
            icon: '?'
        };
    };

    // Fungsi untuk mendapatkan warna badge hasil verifikasi
    const getHasilVerifBadge = (hasil) => {
        const badges = {
            'Valid': 'bg-green-100 text-green-800',
            'Tidak Valid': 'bg-red-100 text-red-800',
            'Perlu Revisi': 'bg-orange-100 text-orange-800'
        };
        return badges[hasil] || 'bg-gray-100 text-gray-800';
    };

    // ========== HANDLE VERIFY ==========
    const handleVerify = (item) => {
        if (!canVerify) {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Diizinkan',
                text: 'Hanya admin_tambun_raya yang dapat melakukan verifikasi'
            });
            return;
        }

        const verificationStatus = getVerificationStatus(item);

        // Jika data sudah diverifikasi, tampilkan konfirmasi
        if (item.verified_by) {
            let confirmMessage = '';
            
            if (item.hasil_verif === 'Valid') {
                confirmMessage = `Data ini sudah diverifikasi dengan hasil VALID oleh ${item.verified_by_nama}. Apakah Anda ingin mengubah verifikasi?`;
            } else if (item.hasil_verif === 'Tidak Valid') {
                confirmMessage = `Data ini sebelumnya ditolak dengan hasil TIDAK VALID oleh ${item.verified_by_nama}. Apakah Anda ingin memverifikasi ulang?`;
            } else if (item.hasil_verif === 'Perlu Revisi') {
                confirmMessage = `Data ini sebelumnya membutuhkan REVISI oleh ${item.verified_by_nama}. Apakah Anda ingin memverifikasi ulang?`;
            }

            Swal.fire({
                icon: 'question',
                title: 'Verifikasi Ulang',
                text: confirmMessage,
                showCancelButton: true,
                confirmButtonText: 'Ya, Verifikasi Ulang',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    setModalConfig({
                        show: true,
                        type: 'verify',
                        data: item
                    });
                }
            });
            return;
        }
        
        setModalConfig({
            show: true,
            type: 'verify',
            data: item
        });
    };

    // ========== HANDLE VERIFY SUCCESS ==========
    const handleVerifySuccess = async (id, data) => {
        try {
            console.log('🔍 Verifikasi - ID:', id, 'Data:', data);
            
            const result = await verifyUserKompetensi(session, id, data);

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Status kompetensi berhasil diverifikasi',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData(false);
                handleCloseModal();
            } else {
                throw new Error(result.message || 'Gagal memverifikasi');
            }
        } catch (error) {
            console.error('Error verifying:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Verifikasi',
                text: error.message || 'Terjadi kesalahan saat memverifikasi data'
            });
        }
    };

    // ========== HANDLE DELETE ==========
    const handleDelete = (item) => {
        const verificationStatus = getVerificationStatus(item);
        
        // Jika data sudah Valid, beri konfirmasi ekstra
        if (item.hasil_verif === 'Valid') {
            Swal.fire({
                icon: 'warning',
                title: 'Hapus Data Tervalidasi?',
                html: `
                    <div class="text-left">
                        <p class="mb-2">Data ini sudah diverifikasi dengan hasil <strong>VALID</strong> oleh <strong>${item.verified_by_nama || 'Verifikator'}</strong>.</p>
                        <p class="text-red-600 font-semibold">Apakah Anda yakin ingin menghapus data ini?</p>
                        <p class="text-sm text-gray-500 mt-2">Data yang dihapus tidak dapat dikembalikan.</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#dc2626',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    setModalConfig({
                        show: true,
                        type: 'delete',
                        data: item
                    });
                }
            });
            return;
        }
        
        setModalConfig({
            show: true,
            type: 'delete',
            data: item
        });
    };

    const handleCloseModal = () => {
        setModalConfig({
            show: false,
            type: null,
            data: null
        });
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setPreselectUserId(null);
        fetchData(true);
    };

    // ========== HANDLE DELETE CONFIRM ==========
    const handleDeleteConfirm = async (id) => {
        try {
            const result = await deleteUserKompetensi(session, id);

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data kompetensi berhasil dihapus',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData(false);
                handleCloseModal();
            } else {
                throw new Error(result.message || 'Gagal menghapus');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Gagal menghapus: ${error.message}`
            });
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current: page }));
    };

    const handlePageSizeChange = (current, size) => {
        setPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
    };

    const getCurrentPageData = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filteredData.slice(start, end);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Lulus': 'bg-green-100 text-green-800',
            'Tidak Lulus': 'bg-red-100 text-red-800',
            'Dalam Proses': 'bg-yellow-100 text-yellow-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    // Debug button handler
    const handleDebug = () => {
        console.log('🔍 DEBUG INFO ==========');
        console.log('Session:', session);
        console.log('User Roles:', userRoles);
        console.log('isAdmin:', isAdminTambunRaya);
        console.log('isKatim:', isKatim);
        console.log('canWrite:', canWrite);
        console.log('canVerify:', canVerify);
        console.log('Data length:', data.length);
        console.log('Filtered length:', filteredData.length);
        console.log('Options:', options);
        console.log('Filters:', filters);
        console.log('========================');
        
        Swal.fire({
            icon: 'info',
            title: 'Debug Info',
            text: 'Data debug telah dicetak ke console (F12)',
            timer: 2000,
            showConfirmButton: false
        });
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentData = getCurrentPageData();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Kompetensi Pegawai</h1>
                    
                    {/* Role Info */}
                    <div className="flex gap-2 mt-2">
                        {isAdminTambunRaya && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Admin Tambun Raya
                            </span>
                        )}
                        {isKatim && !isAdminTambunRaya && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Ketua Tim
                            </span>
                        )}
                        {!isAdminTambunRaya && !isKatim && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                User Biasa
                            </span>
                        )}
                    </div>
              
                    
                    {/* Stats Cards */}
                    <div className="flex gap-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600">Total</p>
                            <p className="text-xl font-bold text-blue-700">{stats.total}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-600">Lulus</p>
                            <p className="text-xl font-bold text-green-700">{stats.lulus}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-600">Tidak Lulus</p>
                            <p className="text-xl font-bold text-red-700">{stats.tidakLulus}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm text-yellow-600">Dalam Proses</p>
                            <p className="text-xl font-bold text-yellow-700">{stats.dalamProses}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {/* Debug Button */}
                    <button
                        onClick={handleDebug}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center shadow"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Debug
                    </button>
                    
                    {/* Tombol Tambah - SEMUA USER BISA MENAMBAH */}
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Kompetensi
                    </button>
                    
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center shadow"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <FilterSection
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                options={options}
                userRoles={userRoles}
            />

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pegawai</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kompetensi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dipenuhi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Hasil</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sertifikat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifikator</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada data
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((item, index) => {
                                    const verificationStatus = getVerificationStatus(item);
                                    const canEdit = verificationStatus.canEdit;
                                    const canDelete = verificationStatus.canDelete;
                                    
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(pagination.current - 1) * pagination.pageSize + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{item.user_nama}</div>
                                                <div className="text-sm text-gray-500">{item.user_nip}</div>
                                                <div className="text-xs text-gray-400">{item.user_fungsi}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{item.nama_kompetensi}</div>
                                                <div className="text-sm text-gray-500">{item.kode_kompetensi}</div>
                                                {item.deskripsi && (
                                                    <div className="text-xs text-gray-400 mt-0.5">{item.deskripsi}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.tanggal_dipenuhi}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.nilai ? item.nilai : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                    {item.hasil_verif && (
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHasilVerifBadge(item.hasil_verif)}`}>
                                                            {item.hasil_verif} {verificationStatus.icon}
                                                        </span>
                                                    )}
                                                    {!item.hasil_verif && item.verified_by && (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            {verificationStatus.icon}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.bukti ? (
                                                    <button
                                                        onClick={() => handleViewSertifikat(item)}
                                                        className="text-green-600 hover:text-green-900 flex items-center"
                                                        title="Lihat Sertifikat"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Lihat
                                                    </button>
                                                ) : '-'}
                                            </td>
                                          
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {item.verified_by ? (
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{item.verified_by}</span>
                                                                    {item.verified_at && (
                                                                        <span className="text-xs text-gray-500">
                                                                            {new Date(item.verified_at).toLocaleDateString('id-ID')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-yellow-600 text-xs">Belum diverifikasi</span>
                                                            )}
                                                        </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {/* Tombol Detail - selalu aktif */}
                                                    <button
                                                        onClick={() => handleViewDetail(item)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Detail"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {/* Tombol Lihat Sertifikat - jika ada file */}
                                                    {item.bukti && (
                                                        <button
                                                            onClick={() => handleViewSertifikat(item)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Lihat Sertifikat"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    
                                                    {/* Tombol Edit - berdasarkan status verifikasi */}
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className={`${
                                                            !canEdit
                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                : 'text-yellow-600 hover:text-yellow-900'
                                                        }`}
                                                        title={!canEdit ? verificationStatus.message : 'Edit'}
                                                        disabled={!canEdit}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {/* Tombol Verifikasi - SELALU MUNCUL UNTUK ADMIN */}
                                                    {userRoles.isAdmin && (
                                                        <button
                                                            onClick={() => handleVerify(item)}
                                                            className="text-purple-600 hover:text-purple-900"
                                                            title={verificationStatus.message || 'Verifikasi Kompetensi'}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    
                                                    {/* Tombol Hapus - berdasarkan status verifikasi */}
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className={`${
                                                            !canDelete
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'text-red-600 hover:text-red-900'
                                                        }`}
                                                        title={!canDelete ? verificationStatus.message : 'Hapus'}
                                                        disabled={!canDelete}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Menampilkan {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, filteredData.length)} dari {filteredData.length} data
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current - 1)}
                                disabled={pagination.current === 1}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {[...Array(Math.ceil(filteredData.length / pagination.pageSize))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-3 py-1 border rounded hover:bg-gray-50 ${
                                        pagination.current === i + 1 ? 'bg-blue-500 text-white' : ''
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(pagination.current + 1)}
                                disabled={pagination.current === Math.ceil(filteredData.length / pagination.pageSize)}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => handlePageSizeChange(pagination.current, parseInt(e.target.value))}
                            className="px-3 py-1 border rounded"
                        >
                            <option value="10">10 / halaman</option>
                            <option value="25">25 / halaman</option>
                            <option value="50">50 / halaman</option>
                            <option value="100">100 / halaman</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <UserskompetensiForm
                    show={showForm}
                    onClose={() => { setShowForm(false); setPreselectUserId(null); }}
                    onSuccess={handleFormSuccess}
                    editingData={editingData}
                    options={options}
                    userRoles={userRoles}
                    session={session}
                    preselectUserId={preselectUserId}
                />
            )}

            {/* Detail Modal */}
            <DetailModal
                show={modalConfig.show && modalConfig.type === 'detail'}
                onClose={handleCloseModal}
                data={modalConfig.data}
                getStatusBadge={getStatusBadge}
            />

            {/* View Sertifikat Modal */}
            <ViewSertifikatModal
                show={modalConfig.show && modalConfig.type === 'viewSertifikat'}
                onClose={handleCloseModal}
                data={modalConfig.data}
            />

            {/* Verify Modal */}
            <VerifyModal
                show={modalConfig.show && modalConfig.type === 'verify'}
                onClose={handleCloseModal}
                data={modalConfig.data}
                onConfirm={handleVerifySuccess}
            />

            {/* Delete Modal */}
            <DeleteModal
                show={modalConfig.show && modalConfig.type === 'delete'}
                onClose={handleCloseModal}
                data={modalConfig.data}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};

export default UserskompetensiContainer;