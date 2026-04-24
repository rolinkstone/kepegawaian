// components/pelatihan/KompetensiWajibList.js
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import KompetensiWajibForm from './KompetensiWajibForm';
import PesertaBelumMemenuhiModal from './modals/PesertaBelumMemenuhiModal';
import { 
    fetchKompetensiWajib, 
    fetchTahunOptions,
    deleteKompetensiWajib,
    deleteKompetensiWajibByTahun
} from './api/pelatihanApi';

const KompetensiWajibList = ({ session, userRoles }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTahun, setSelectedTahun] = useState('');
    const [tahunOptions, setTahunOptions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [refetchKey, setRefetchKey] = useState(0);
    
    // State untuk modal peserta belum memenuhi
    const [showPesertaModal, setShowPesertaModal] = useState(false);
    const [selectedKompetensi, setSelectedKompetensi] = useState(null);

    const fetchData = useCallback(async () => {
        if (!selectedTahun) return;
        
        setLoading(true);
        try {
            const result = await fetchKompetensiWajib(session, { tahun: selectedTahun });
            if (result.success) {
                setData(result.data || []);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Gagal memuat data'
                });
            }
        } catch (error) {
            console.error('Error fetching kompetensi wajib:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    }, [session, selectedTahun]);

    const fetchTahun = useCallback(async () => {
        try {
            const result = await fetchTahunOptions(session);
            if (result.success && result.data.length > 0) {
                setTahunOptions(result.data);
                setSelectedTahun(result.data[0]);
            } else {
                // Jika belum ada data, set tahun default ke tahun ini
                const currentYear = new Date().getFullYear().toString();
                setTahunOptions([currentYear]);
                setSelectedTahun(currentYear);
            }
        } catch (error) {
            console.error('Error fetching tahun:', error);
            // Fallback: gunakan tahun ini
            const currentYear = new Date().getFullYear().toString();
            setTahunOptions([currentYear]);
            setSelectedTahun(currentYear);
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchTahun();
        }
    }, [session, fetchTahun]);

    useEffect(() => {
        if (session && selectedTahun) {
            fetchData();
        }
    }, [session, selectedTahun, refetchKey, fetchData]);

    const handleDelete = async (item) => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Hapus Kompetensi Wajib',
            html: `Apakah Anda yakin ingin menghapus <strong>${item.kode_kompetensi} - ${item.nama_kompetensi || item.kompetensi_original}</strong> dari daftar kompetensi wajib tahun ${item.tahun}?`,
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteKompetensiWajib(session, item.id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Kompetensi wajib berhasil dihapus',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    setRefetchKey(prev => prev + 1);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Gagal menghapus data'
                    });
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

    const handleDeleteAllByTahun = async () => {
        if (!selectedTahun) return;
        
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hapus Semua Kompetensi Wajib',
            html: `Apakah Anda yakin ingin menghapus SEMUA kompetensi wajib untuk tahun <strong>${selectedTahun}</strong>?<br/><br/><span class="text-red-600">Data yang dihapus tidak dapat dikembalikan!</span>`,
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Semua',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteKompetensiWajibByTahun(session, selectedTahun);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    setRefetchKey(prev => prev + 1);
                    // Refresh tahun options jika perlu
                    const tahunResult = await fetchTahunOptions(session);
                    if (tahunResult.success && tahunResult.data.length > 0) {
                        setTahunOptions(tahunResult.data);
                        setSelectedTahun(tahunResult.data[0]);
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Gagal menghapus data'
                    });
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

    const handleLihatPeserta = (kompetensi) => {
        setSelectedKompetensi(kompetensi);
        setShowPesertaModal(true);
    };

    const getStatusBadge = (tahun) => {
        const currentYear = new Date().getFullYear();
        const tahunNum = parseInt(tahun);
        if (tahunNum === currentYear) {
            return 'bg-green-100 text-green-800';
        } else if (tahunNum < currentYear) {
            return 'bg-gray-100 text-gray-600';
        } else {
            return 'bg-blue-100 text-blue-800';
        }
    };

    if (loading && !data.length && tahunOptions.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-500">Memuat data...</span>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Kompetensi Wajib</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar kompetensi yang wajib dipenuhi oleh pegawai setiap tahunnya
                    </p>
                </div>
                {userRoles?.isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-lg transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tambah Kompetensi Wajib
                    </button>
                )}
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tahun
                        </label>
                        <select
                            value={selectedTahun}
                            onChange={(e) => setSelectedTahun(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            {tahunOptions.map(tahun => (
                                <option key={tahun} value={tahun}>{tahun}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setRefetchKey(prev => prev + 1);
                                Swal.fire({
                                    icon: 'info',
                                    title: 'Refresh',
                                    text: 'Memuat ulang data...',
                                    timer: 1000,
                                    showConfirmButton: false
                                });
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        
                        {data.length > 0 && userRoles?.isAdmin && (
                            <button
                                onClick={handleDeleteAllByTahun}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Hapus Semua {selectedTahun}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="text-sm text-purple-600">Total Kompetensi Wajib</p>
                    <p className="text-2xl font-bold text-purple-700">{data.length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-blue-600">Tahun Aktif</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedTahun || '-'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-green-600">Status</p>
                    <p className="text-2xl font-bold text-green-700">
                        {selectedTahun == new Date().getFullYear() ? 'Aktif' : 
                         selectedTahun < new Date().getFullYear() ? 'Lampau' : 'Mendatang'}
                    </p>
                </div>
            </div>

            {/* Table Section */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-gray-500">Memuat data...</span>
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Belum ada kompetensi wajib untuk tahun {selectedTahun}</p>
                    {userRoles?.isAdmin && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            + Tambah Kompetensi Wajib
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kompetensi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fungsi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                                {userRoles?.isAdmin && (
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                            {item.kode_kompetensi}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md break-words">
                                        {item.nama_kompetensi || item.kompetensi_original}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.nama_fungsi || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.tahun)}`}>
                                            {item.tahun}
                                        </span>
                                    </td>
                                    {userRoles?.isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleLihatPeserta(item)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                                                    title="Lihat Pegawai yang Belum Memenuhi Kompetensi Ini"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Simple Pagination if needed */}
                    {data.length > 10 && (
                        <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Menampilkan {data.length} data
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <KompetensiWajibForm
                    show={showForm}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        setRefetchKey(prev => prev + 1);
                        setTimeout(() => {
                            fetchTahun();
                        }, 500);
                    }}
                    session={session}
                    existingTahunOptions={tahunOptions}
                />
            )}

            {/* Peserta Belum Memenuhi Modal */}
            {showPesertaModal && (
                <PesertaBelumMemenuhiModal
                    show={showPesertaModal}
                    onClose={() => {
                        setShowPesertaModal(false);
                        setSelectedKompetensi(null);
                    }}
                    kompetensi={selectedKompetensi}
                    session={session}
                />
            )}
        </div>
    );
};

export default KompetensiWajibList;