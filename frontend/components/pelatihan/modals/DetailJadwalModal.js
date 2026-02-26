// components/pelatihan/modals/DetailJadwalModal.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchJadwalPelatihanById, updateStatusPeserta, respondUndangan } from '../api/pelatihanApi';

const DetailJadwalModal = ({ show, onClose, jadwal, session, onUndang, onKompetensi }) => {
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [respondingId, setRespondingId] = useState(null);
    const [userNip, setUserNip] = useState('');
    const [userRoles, setUserRoles] = useState({ isAdmin: false, isKatim: false });

   // components/pelatihan/modals/DetailJadwalModal.js

useEffect(() => {
    // Dapatkan NIP user dari session dengan berbagai cara
    if (session?.user) {
        console.log('🔍 Session user object:', session.user);
        
        // Coba dari berbagai sumber
        const nip = session.user.preferred_username || 
                   session.user.username || 
                   session.user.nip || 
                   session.user.email?.split('@')[0] ||
                   session.user.id;
        
        console.log('🔍 NIP yang ditemukan:', nip);
        setUserNip(nip || '');
        
        // Cek role user
        let roles = [];
        
        // Cek dari berbagai sumber roles
        if (session.user.roles) {
            if (Array.isArray(session.user.roles)) {
                roles = session.user.roles;
            } else if (typeof session.user.roles === 'string') {
                roles = session.user.roles.split(',').map(r => r.trim());
            }
        }
        
        // Cek dari realm_access
        if (session.user.realm_access?.roles) {
            roles = [...roles, ...session.user.realm_access.roles];
        }
        
        // Cek dari resource_access
        if (session.user.resource_access) {
            Object.values(session.user.resource_access).forEach(resource => {
                if (resource.roles) {
                    roles = [...roles, ...resource.roles];
                }
            });
        }
        
        // Hapus duplikasi
        roles = [...new Set(roles)];
        
        console.log('🔍 Roles ditemukan:', roles);
        
        setUserRoles({
            isAdmin: roles.includes('admin_tambun_raya'),
            isKatim: roles.includes('katim')
        });
    }
}, [session]);

// Tambahkan useEffect untuk memantau perubahan userNip
useEffect(() => {
    console.log('👤 userNip berubah menjadi:', userNip);
}, [userNip]);



    useEffect(() => {
        if (show && jadwal?.id) {
            console.log('📋 Membuka modal untuk jadwal:', jadwal);
            fetchDetail(jadwal.id);
        }
    }, [show, jadwal]);

    const fetchDetail = async (id) => {
        setLoading(true);
        try {
            console.log('📡 Fetching detail jadwal ID:', id);
            const result = await fetchJadwalPelatihanById(session, id);
            console.log('📥 Result:', result);
            
            if (result.success) {
                setDetailData(result.data);
                console.log('📋 Detail data:', result.data);
                console.log('📋 Peserta:', result.data?.peserta);
                
                // Cek apakah user ada di daftar peserta
                if (result.data?.peserta) {
                    const myData = result.data.peserta.find(p => p.user_nip === userNip);
                    console.log('🔍 Data saya di peserta:', myData);
                }
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateKehadiran = async (pesertaId, status) => {
        try {
            const result = await updateStatusPeserta(session, pesertaId, { status_kehadiran: status });
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Status kehadiran berhasil diupdate',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDetail(jadwal.id);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        }
    };

    // Fungsi untuk merespon undangan (Terima/Tolak)
    const handleRespondUndangan = async (pesertaId, status) => {
        setRespondingId(pesertaId);
        try {
            const result = await respondUndangan(session, pesertaId, status);
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: `Undangan berhasil ${status === 'Diterima' ? 'diterima' : 'ditolak'}`,
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDetail(jadwal.id);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setRespondingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Diterima': 'bg-green-100 text-green-800',
            'Ditolak': 'bg-red-100 text-red-800',
            'Hadir': 'bg-green-100 text-green-800',
            'Tidak Hadir': 'bg-red-100 text-red-800',
            'Izin': 'bg-blue-100 text-blue-800',
            'Sakit': 'bg-orange-100 text-orange-800',
            'Draft': 'bg-gray-100 text-gray-800',
            'Publik': 'bg-blue-100 text-blue-800',
            'Berlangsung': 'bg-green-100 text-green-800',
            'Selesai': 'bg-purple-100 text-purple-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    // Filter peserta berdasarkan role
    const getFilteredPeserta = () => {
        if (!detailData?.peserta) {
            console.log('⚠️ Tidak ada data peserta');
            return [];
        }
        
        console.log('📋 Semua peserta:', detailData.peserta);
        console.log('👤 User NIP:', userNip);
        console.log('👑 isAdmin:', userRoles.isAdmin);
        console.log('👥 isKatim:', userRoles.isKatim);
        
        // Jika admin atau katim, lihat semua peserta
        if (userRoles.isAdmin || userRoles.isKatim) {
            console.log('👑 Admin/Katim: melihat semua peserta');
            return detailData.peserta;
        }
        
        // Jika user biasa, hanya lihat data dirinya sendiri
        const filtered = detailData.peserta.filter(p => {
            const match = p.user_nip === userNip;
            console.log(`🔍 Membandingkan ${p.user_nip} dengan ${userNip}: ${match ? 'MATCH' : 'TIDAK MATCH'}`);
            return match;
        });
        
        console.log('📋 Peserta setelah filter:', filtered);
        return filtered;
    };

    if (!show || !jadwal) return null;

    const filteredPeserta = getFilteredPeserta();
    const isPeserta = filteredPeserta.length > 0 && !userRoles.isAdmin && !userRoles.isKatim;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        Detail Jadwal Pelatihan
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                
                
                <div className="p-6">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`py-2 px-4 font-medium text-sm ${
                                    activeTab === 'info'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Informasi Pelatihan
                            </button>
                            
                            {/* Tab Peserta - Selalu tampil, tapi kontennya akan difilter */}
                            <button
                                onClick={() => setActiveTab('peserta')}
                                className={`py-2 px-4 font-medium text-sm ${
                                    activeTab === 'peserta'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {userRoles.isAdmin || userRoles.isKatim ? (
                                    `Daftar Peserta (${detailData?.peserta?.length || 0})`
                                ) : (
                                    `Status Undangan Saya ${filteredPeserta.length > 0 ? `(${filteredPeserta.length})` : ''}`
                                )}
                            </button>
                            
                            <button
                                onClick={() => setActiveTab('kompetensi')}
                                className={`py-2 px-4 font-medium text-sm ${
                                    activeTab === 'kompetensi'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Kompetensi Terkait
                            </button>
                        </nav>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Tab Informasi */}
                            {activeTab === 'info' && detailData && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-700 mb-3">Informasi Pelatihan</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Kode Pelatihan</p>
                                                <p className="font-medium">{detailData.kode_pelatihan}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Nama Pelatihan</p>
                                                <p className="font-medium">{detailData.nama_pelatihan}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Jenis</p>
                                                <p className="font-medium">{detailData.jenis_pelatihan}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Durasi</p>
                                                <p className="font-medium">{detailData.durasi || '-'} jam</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Penyelenggara</p>
                                                <p className="font-medium">{detailData.nama_penyelenggara || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(detailData.status)}`}>
                                                    {detailData.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-700 mb-3">Jadwal dan Lokasi</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Tanggal Mulai</p>
                                                <p className="font-medium">{new Date(detailData.tanggal_mulai).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Tanggal Selesai</p>
                                                <p className="font-medium">{new Date(detailData.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Waktu</p>
                                                <p className="font-medium">
                                                    {detailData.waktu_mulai || '-'} - {detailData.waktu_selesai || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Metode</p>
                                                <p className="font-medium">{detailData.metode || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">Lokasi</p>
                                                <p className="font-medium">{detailData.lokasi || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-700 mb-3">Deskripsi</h3>
                                        <p className="text-gray-700">{detailData.deskripsi || '-'}</p>
                                    </div>

                                    {detailData.status === 'Draft' && (userRoles.isAdmin || userRoles.isKatim) && (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={onUndang}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Undang Peserta
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab Peserta - dengan data yang sudah difilter */}
                            {activeTab === 'peserta' && (
                                <div>
                                    {filteredPeserta.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredPeserta.map(peserta => (
                                                <div key={peserta.id} className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{peserta.user_nama}</p>
                                                            <p className="text-sm text-gray-600">{peserta.user_nip}</p>
                                                            {!userRoles.isAdmin && !userRoles.isKatim && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {peserta.user_fungsi} - {peserta.user_jabatan}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(peserta.status_undangan)}`}>
                                                                {userRoles.isAdmin || userRoles.isKatim ? 
                                                                    `Undangan: ${peserta.status_undangan}` : 
                                                                    peserta.status_undangan
                                                                }
                                                            </span>
                                                            {peserta.status_kehadiran && (
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(peserta.status_kehadiran)}`}>
                                                                    {peserta.status_kehadiran}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* TOMBOL UNTUK PESERTA MENERIMA/MENOLAK UNDANGAN */}
                                                    {/* Hanya tampil untuk user yang bersangkutan dan status masih Pending */}
                                                    {!userRoles.isAdmin && !userRoles.isKatim && 
                                                     peserta.user_nip === userNip && 
                                                     peserta.status_undangan === 'Pending' && (
                                                        <div className="mt-3 flex space-x-2">
                                                            <button
                                                                onClick={() => handleRespondUndangan(peserta.id, 'Diterima')}
                                                                disabled={respondingId === peserta.id}
                                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                                                            >
                                                                {respondingId === peserta.id ? (
                                                                    <>
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Memproses...
                                                                    </>
                                                                ) : (
                                                                    'Terima Undangan'
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespondUndangan(peserta.id, 'Ditolak')}
                                                                disabled={respondingId === peserta.id}
                                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                Tolak Undangan
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Untuk admin/katim: tampilkan semua peserta dengan opsi update kehadiran */}
                                                    {(userRoles.isAdmin || userRoles.isKatim) && (
                                                        <>
                                                            {detailData.status === 'Berlangsung' || detailData.status === 'Selesai' ? (
                                                                <div className="mt-3 flex space-x-2">
                                                                    <select
                                                                        value={peserta.status_kehadiran || ''}
                                                                        onChange={(e) => handleUpdateKehadiran(peserta.id, e.target.value)}
                                                                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                                                                    >
                                                                        <option value="">Pilih Kehadiran</option>
                                                                        <option value="Hadir">Hadir</option>
                                                                        <option value="Tidak Hadir">Tidak Hadir</option>
                                                                        <option value="Izin">Izin</option>
                                                                        <option value="Sakit">Sakit</option>
                                                                    </select>
                                                                    
                                                                    {detailData.status === 'Selesai' && (
                                                                        <button
                                                                            onClick={() => onKompetensi(peserta)}
                                                                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                                                        >
                                                                            Kompetensi Terpenuhi
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            {userRoles.isAdmin || userRoles.isKatim ? (
                                                'Belum ada peserta yang diundang'
                                            ) : (
                                                'Anda tidak diundang dalam pelatihan ini'
                                            )}
                                            {detailData?.status === 'Draft' && (userRoles.isAdmin || userRoles.isKatim) && (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={onUndang}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                    >
                                                        Undang Peserta Sekarang
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab Kompetensi */}
                            {activeTab === 'kompetensi' && (
                                <div>
                                    {detailData?.kompetensi?.length > 0 ? (
                                        <div className="space-y-2">
                                            {detailData.kompetensi.map(kom => (
                                                <div key={kom.id} className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="font-medium">{kom.kode_kompetensi} - {kom.nama_kompetensi}</p>
                                                    <p className="text-sm text-gray-600">Fungsi: {kom.nama_fungsi || '-'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Tidak ada kompetensi yang terkait dengan pelatihan ini
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailJadwalModal;