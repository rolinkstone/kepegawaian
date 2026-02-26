// components/pelatihan/PelatihanContainer.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import PelatihanForm from './PelatihanForm';
import MasterPelatihanForm from './MasterPelatihanForm';
import FilterSection from './FilterSection';
import DetailJadwalModal from './modals/DetailJadwalModal';
import UndangPesertaModal from './modals/UndangPesertaModal';
import KompetensiTerpenuhiModal from './modals/KompetensiTerpenuhiModal';
import ConfirmModal from './modals/ConfirmModal';
import JadwalPelatihanList from './JadwalPelatihanList';
import MasterPelatihanList from './MasterPelatihanList';
import { 
    fetchJadwalPelatihan, 
    fetchMasterPelatihan,
    fetchOptions, 
    deleteJadwalPelatihan,
    deleteMasterPelatihan,
    publikasiJadwal 
} from './api/pelatihanApi';

const PelatihanContainer = () => {
    const { data: session } = useSession();
    
    // State untuk data
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [masterPelatihan, setMasterPelatihan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    
    // State untuk form
    const [showForm, setShowForm] = useState(false);
    const [showMasterForm, setShowMasterForm] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [editingMaster, setEditingMaster] = useState(null);
    
    // State untuk modal
    const [selectedJadwal, setSelectedJadwal] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: null,
        data: null
    });

    // State untuk tab
    const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal' atau 'master'

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        all: true
    });

    // Options for dropdowns
    const [options, setOptions] = useState({
        pelatihan: [],
        users: [],
        status_options: ['Draft', 'Publik', 'Berlangsung', 'Selesai', 'Dibatalkan'],
        metode_options: ['Offline', 'Online', 'Hybrid'],
        status_undangan_options: ['Pending', 'Diterima', 'Ditolak'],
        status_kehadiran_options: ['Hadir', 'Tidak Hadir', 'Izin', 'Sakit']
    });

    // Pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // User roles
    const [userRoles, setUserRoles] = useState({
        isAdmin: false,
        isKatim: false,
        isUser: true,
        roles: []
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        publik: 0,
        berlangsung: 0,
        selesai: 0
    });

    // Di PelatihanContainer.js, tambahkan fungsi helper
        const getUserNip = useCallback(() => {
            if (!session?.user) return null;
            
            return session.user.preferred_username || 
                session.user.username || 
                session.user.nip || 
                session.user.email?.split('@')[0] ||
                null;
        }, [session]);
    // ========== CEK USER ROLES ==========
    // components/pelatihan/PelatihanContainer.js

// ========== CEK USER ROLES ==========
useEffect(() => {
    if (session?.user) {
        console.log('🔍 Session user:', session.user);
        
        let roles = [];
        let isAdmin = false;
        let isKatim = false;

        // CEK 1: Dari session.user.roles (array)
        if (session.user.roles && Array.isArray(session.user.roles)) {
            console.log('🔍 roles dari array:', session.user.roles);
            roles = [...roles, ...session.user.roles];
            isAdmin = isAdmin || session.user.roles.includes('admin_tambun_raya');
            isKatim = isKatim || session.user.roles.includes('katim');
        }
        
        // CEK 2: Dari session.user.roles (string)
        if (session.user.roles && typeof session.user.roles === 'string') {
            const roleArray = session.user.roles.split(',').map(r => r.trim());
            console.log('🔍 roles dari string:', roleArray);
            roles = [...roles, ...roleArray];
            isAdmin = isAdmin || roleArray.includes('admin_tambun_raya');
            isKatim = isKatim || roleArray.includes('katim');
        }
        
        // CEK 3: Dari session.user.realm_access (Keycloak specific)
        if (session.user.realm_access?.roles) {
            console.log('🔍 realm_access roles:', session.user.realm_access.roles);
            const realmRoles = session.user.realm_access.roles;
            roles = [...roles, ...realmRoles];
            isAdmin = isAdmin || realmRoles.includes('admin_tambun_raya');
            isKatim = isKatim || realmRoles.includes('katim');
        }
        
        // CEK 4: Dari session.user.resource_access
        if (session.user.resource_access) {
            Object.keys(session.user.resource_access).forEach(client => {
                if (session.user.resource_access[client].roles) {
                    const clientRoles = session.user.resource_access[client].roles;
                    console.log(`🔍 resource_access.${client} roles:`, clientRoles);
                    roles = [...roles, ...clientRoles];
                    isAdmin = isAdmin || clientRoles.includes('admin_tambun_raya');
                    isKatim = isKatim || clientRoles.includes('katim');
                }
            });
        }
        
        // CEK 5: Dari session.user.client_roles (jika ada)
        if (session.user.client_roles) {
            console.log('🔍 client_roles:', session.user.client_roles);
            const clientRoles = session.user.client_roles;
            roles = [...roles, ...clientRoles];
            isAdmin = isAdmin || clientRoles.includes('admin_tambun_raya');
            isKatim = isKatim || clientRoles.includes('katim');
        }
        
        // CEK 6: Dari session.user.groups (jika ada)
        if (session.user.groups) {
            console.log('🔍 groups:', session.user.groups);
            // Groups mungkin mengandung role
        }
        
        // CEK 7: Dari session.user.email/username (fallback)
        if (session.user.email) {
            if (session.user.email.includes('admin')) {
                isAdmin = true;
                console.log('🔍 isAdmin dari email');
            }
            if (session.user.email.includes('katim')) {
                isKatim = true;
                console.log('🔍 isKatim dari email');
            }
        }
        
        if (session.user.preferred_username) {
            if (session.user.preferred_username.includes('admin')) {
                isAdmin = true;
                console.log('🔍 isAdmin dari preferred_username');
            }
            if (session.user.preferred_username.includes('katim')) {
                isKatim = true;
                console.log('🔍 isKatim dari preferred_username');
            }
        }
        
        // CEK 8: Dari token (jika ada accessToken)
        if (session.accessToken) {
            try {
                const tokenParts = session.accessToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('🔍 Token payload:', payload);
                    
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
        
        console.log('🔍 FINAL RESULTS =====');
        console.log('🔍 All roles found:', roles);
        console.log('🔍 isAdmin:', isAdmin);
        console.log('🔍 isKatim:', isKatim);
        
        setUserRoles({
            isAdmin,
            isKatim,
            isUser: !isAdmin && !isKatim,
            roles
        });
    }
}, [session]);

// Debug tambahan - tampilkan userRoles di console setiap kali berubah
useEffect(() => {
    console.log('👤 User Roles State:', userRoles);
}, [userRoles]);

    // Tentukan apakah user bisa membuat jadwal
    const canCreateJadwal = userRoles.isKatim || userRoles.isAdmin;
    console.log('🎯 canCreateJadwal:', canCreateJadwal);

    // ========== FETCH OPTIONS ==========
    const fetchOptionsData = useCallback(async () => {
        try {
            const result = await fetchOptions(session);
            if (result.success) {
                setOptions(prev => ({
                    ...prev,
                    ...result.data
                }));
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }, [session]);

    // ========== FETCH MASTER PELATIHAN ==========
    const fetchMasterData = useCallback(async () => {
        try {
            const result = await fetchMasterPelatihan(session);
            if (result.success) {
                setMasterPelatihan(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching master:', error);
        }
    }, [session]);

    // ========== FETCH JADWAL PELATIHAN ==========
    const fetchData = useCallback(async (showMessage = true) => {
        setLoading(true);
        try {
            const params = {
                status: filters.status,
                search: filters.search
            };
            
            const result = await fetchJadwalPelatihan(session, params);

            if (result.success) {
                setData(result.data || []);
                setFilteredData(result.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: result.data?.length || 0
                }));
                
                calculateStats(result.data || []);
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
    }, [session, filters]);

    // ========== CALCULATE STATS ==========
    const calculateStats = (data) => {
        const total = data.length;
        const draft = data.filter(item => item.status === 'Draft').length;
        const publik = data.filter(item => item.status === 'Publik').length;
        const berlangsung = data.filter(item => item.status === 'Berlangsung').length;
        const selesai = data.filter(item => item.status === 'Selesai').length;
        
        setStats({ total, draft, publik, berlangsung, selesai });
    };

    // ========== INITIAL LOAD ==========
    useEffect(() => {
        if (session) {
            fetchOptionsData();
            fetchMasterData();
            fetchData(false);
        }
    }, [session, fetchOptionsData, fetchMasterData, fetchData]);

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
                item.nama_pelatihan?.toLowerCase().includes(searchLower) ||
                item.kode_pelatihan?.toLowerCase().includes(searchLower) ||
                item.lokasi?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
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
            all: true
        });
    };

    const handleRefresh = () => {
        if (activeTab === 'jadwal') {
            fetchData(true);
        } else {
            fetchMasterData();
        }
    };

    // ========== HANDLER UNTUK JADWAL PELATIHAN ==========
    const handleAdd = () => {
        setEditingData(null);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        if (item.status !== 'Draft') {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Dapat Mengedit',
                text: 'Hanya jadwal dengan status Draft yang dapat diedit'
            });
            return;
        }
        setEditingData(item);
        setShowForm(true);
    };

    const handleViewDetail = (item) => {
        setSelectedJadwal(item);
        setModalConfig({
            show: true,
            type: 'detail',
            data: item
        });
    };

    const handleUndangPeserta = (item) => {
        if (item.status !== 'Draft' && item.status !== 'Publik') {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Dapat Mengundang',
                text: 'Hanya jadwal dengan status Draft atau Publik yang dapat mengundang peserta'
            });
            return;
        }
        setSelectedJadwal(item);
        setModalConfig({
            show: true,
            type: 'undang',
            data: item
        });
    };

    const handlePublikasi = async (item) => {
        if (item.status !== 'Draft') {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Dapat Dipublikasi',
                text: 'Jadwal sudah dipublikasikan'
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'question',
            title: 'Publikasi Jadwal',
            text: `Apakah Anda yakin ingin mempublikasikan jadwal "${item.nama_pelatihan}"?`,
            showCancelButton: true,
            confirmButtonText: 'Ya, Publikasi',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await publikasiJadwal(session, item.id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Jadwal berhasil dipublikasikan',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchData(false);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message
                });
            }
        }
    };

    const handleDelete = (item) => {
        if (item.status !== 'Draft') {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Dapat Menghapus',
                text: 'Hanya jadwal dengan status Draft yang dapat dihapus'
            });
            return;
        }

        setModalConfig({
            show: true,
            type: 'delete',
            data: item
        });
    };

    const handleDeleteConfirm = async (id) => {
        try {
            const result = await deleteJadwalPelatihan(session, id);
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Jadwal berhasil dihapus',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData(false);
                handleCloseModal();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        }
    };

    // ========== HANDLER UNTUK MASTER PELATIHAN ==========
    const handleAddMaster = () => {
        setEditingMaster(null);
        setShowMasterForm(true);
    };

    const handleEditMaster = (item) => {
        setEditingMaster(item);
        setShowMasterForm(true);
    };

    const handleDeleteMaster = async (id) => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Hapus Master Pelatihan',
            text: 'Apakah Anda yakin ingin menghapus master pelatihan ini?',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteMasterPelatihan(session, id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Master pelatihan berhasil dihapus',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchMasterData();
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message
                });
            }
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        fetchData(true);
    };

    const handleMasterFormSuccess = () => {
        setShowMasterForm(false);
        fetchMasterData();
    };

    const handleCloseModal = () => {
        setModalConfig({
            show: false,
            type: null,
            data: null
        });
        setSelectedJadwal(null);
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
            'Draft': 'bg-gray-100 text-gray-800',
            'Publik': 'bg-blue-100 text-blue-800',
            'Berlangsung': 'bg-green-100 text-green-800',
            'Selesai': 'bg-purple-100 text-purple-800',
            'Dibatalkan': 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
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
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Pelatihan</h1>
                    
                    {/* Role Info */}
                    <div className="flex gap-2 mt-2">
                        {userRoles.isAdmin && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Admin (dapat mengelola master pelatihan)
                            </span>
                        )}
                        {userRoles.isKatim && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Ketua Tim (dapat membuat jadwal pelatihan)
                            </span>
                        )}
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="flex gap-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600">Total Jadwal</p>
                            <p className="text-xl font-bold text-blue-700">{stats.total}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Draft</p>
                            <p className="text-xl font-bold text-gray-700">{stats.draft}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-600">Publik</p>
                            <p className="text-xl font-bold text-green-700">{stats.publik}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-sm text-purple-600">Selesai</p>
                            <p className="text-xl font-bold text-purple-700">{stats.selesai}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {/* TOMBOL UNTUK MASTER PELATIHAN (HANYA ADMIN) */}
                     {(userRoles.isKatim || userRoles.isAdmin) && (
                        <button
                            onClick={handleAddMaster}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Buat Master Pelatihan
                        </button>
                    )}
                    
                    {/* TOMBOL BUAT JADWAL (KATIM DAN ADMIN) */}
                    {(userRoles.isKatim || userRoles.isAdmin) && (
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Jadwal Pelatihan
                        </button>
                    )}
                    
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
            />

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('jadwal')}
                        className={`py-2 px-4 font-medium text-sm ${
                            activeTab === 'jadwal'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Jadwal Pelatihan
                    </button>
                    {userRoles.isAdmin && (
                        <button
                            onClick={() => setActiveTab('master')}
                            className={`py-2 px-4 font-medium text-sm ${
                                activeTab === 'master'
                                    ? 'border-b-2 border-purple-500 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Master Pelatihan
                        </button>
                    )}
                </nav>
            </div>

            {/* Konten berdasarkan tab aktif */}
            {activeTab === 'jadwal' ? (
                <JadwalPelatihanList 
                    data={currentData}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPublikasi={handlePublikasi}
                    onUndang={handleUndangPeserta}
                    userRoles={userRoles}
                    getStatusBadge={getStatusBadge}
                    userNip={getUserNip()} // Tambahkan ini
                />
            ) : (
                <MasterPelatihanList 
                    data={masterPelatihan}
                    onEdit={handleEditMaster}
                    onDelete={handleDeleteMaster}
                    userRoles={userRoles}
                />
            )}

            {/* Form Modal untuk Jadwal */}
            {showForm && (
                <PelatihanForm
                    show={showForm}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                    editingData={editingData}
                    options={options}
                    masterPelatihan={masterPelatihan}
                    session={session}
                    userRoles={userRoles}
                />
            )}

            {/* Form Modal untuk Master Pelatihan */}
            {showMasterForm && (
                <MasterPelatihanForm
                    show={showMasterForm}
                    onClose={() => setShowMasterForm(false)}
                    onSuccess={handleMasterFormSuccess}
                    editingData={editingMaster}
                    options={options}
                    session={session}
                    userRoles={userRoles}
                />
            )}

            {/* Detail Modal */}
            <DetailJadwalModal
                show={modalConfig.show && modalConfig.type === 'detail'}
                onClose={handleCloseModal}
                jadwal={modalConfig.data}
                session={session}
                onUndang={() => handleUndangPeserta(modalConfig.data)}
                onKompetensi={(peserta) => {
                    setModalConfig({
                        show: true,
                        type: 'kompetensi',
                        data: { jadwal: modalConfig.data, peserta }
                    });
                }}
            />

            {/* Undang Peserta Modal */}
            <UndangPesertaModal
                show={modalConfig.show && modalConfig.type === 'undang'}
                onClose={handleCloseModal}
                jadwal={modalConfig.data}
                options={options}
                session={session}
                onSuccess={() => {
                    fetchData(false);
                    handleCloseModal();
                }}
            />

            {/* Kompetensi Terpenuhi Modal */}
            <KompetensiTerpenuhiModal
                show={modalConfig.show && modalConfig.type === 'kompetensi'}
                onClose={handleCloseModal}
                data={modalConfig.data}
                session={session}
                onSuccess={() => {
                    fetchData(false);
                    handleCloseModal();
                }}
            />

            {/* Delete Modal */}
            <ConfirmModal
                show={modalConfig.show && modalConfig.type === 'delete'}
                onClose={handleCloseModal}
                onConfirm={() => handleDeleteConfirm(modalConfig.data?.id)}
                title="Hapus Jadwal"
                message={`Apakah Anda yakin ingin menghapus jadwal "${modalConfig.data?.nama_pelatihan}"?`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
};

export default PelatihanContainer;