// components/pelatihan/modals/PesertaBelumMemenuhiModal.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const PesertaBelumMemenuhiModal = ({ show, onClose, kompetensi, session }) => {
    const [loading, setLoading] = useState(false);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFungsi, setSelectedFungsi] = useState('');
    const [fungsiOptions, setFungsiOptions] = useState([]);
    const [stats, setStats] = useState({
        total_pegawai_dengan_peran: 0,
        sudah_memenuhi: 0,
        belum_memenuhi: 0,
        persentase_pemenuhan: 0
    });
    const [kompetensiInfo, setKompetensiInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && kompetensi) {
            fetchPegawaiBelumMemenuhi();
        }
    }, [show, kompetensi]);

    useEffect(() => {
        applyFilters();
    }, [pegawaiList, searchTerm, selectedFungsi]);

    const fetchPegawaiBelumMemenuhi = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = session?.accessToken || localStorage.getItem('token');
            
            // Gunakan endpoint yang sudah dibuat di backend
            // Endpoint ini akan otomatis memfilter pegawai berdasarkan peran yang sesuai dengan kompetensi
            const url = `${process.env.NEXT_PUBLIC_API_URL}/kompetensi-wajib/${kompetensi.id_kompetensi}/pegawai-belum-memenuhi`;
            
            console.log('📡 Fetching dari endpoint:', url);
            console.log('📊 Kompetensi ID:', kompetensi.id_kompetensi);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                
                console.log('✅ Response dari backend:', data);
                
                // Set data dari response
                setPegawaiList(data.pegawai || []);
                setFilteredList(data.pegawai || []);
                setFungsiOptions(data.fungsi_options || []);
                setStats(data.statistik || {
                    total_pegawai_dengan_peran: 0,
                    sudah_memenuhi: 0,
                    belum_memenuhi: 0,
                    persentase_pemenuhan: 0
                });
                setKompetensiInfo(data.kompetensi || null);
                
                // Jika tidak ada pegawai dengan peran sesuai
                if (data.statistik?.total_pegawai_dengan_peran === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Informasi',
                        text: `Tidak ada pegawai dengan peran yang sesuai untuk kompetensi ${kompetensi?.kode_kompetensi}`,
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
                
            } else {
                setError(result.message || 'Gagal memuat data');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Gagal memuat data pegawai'
                });
            }
        } catch (error) {
            console.error('Error fetching pegawai:', error);
            setError(error.message);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal memuat data pegawai: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...pegawaiList];
        
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.nama?.toLowerCase().includes(searchLower) ||
                p.nip?.toLowerCase().includes(searchLower) ||
                p.nama_fungsi?.toLowerCase().includes(searchLower) ||
                p.daftar_peran?.toLowerCase().includes(searchLower) ||
                p.nama_jabatan?.toLowerCase().includes(searchLower)
            );
        }
        
        if (selectedFungsi) {
            filtered = filtered.filter(p => p.nama_fungsi === selectedFungsi);
        }
        
        setFilteredList(filtered);
    };

    const getStatusBadge = (status, hasilVerif) => {
        if (status === 'Lulus' && hasilVerif === 'Valid') {
            return 'bg-green-100 text-green-800';
        } else if (status === 'Lulus' && hasilVerif !== 'Valid') {
            return 'bg-yellow-100 text-yellow-800';
        } else if (status === 'Tidak Lulus') {
            return 'bg-red-100 text-red-800';
        }
        return 'bg-gray-100 text-gray-600';
    };

    const getStatusText = (status, hasilVerif) => {
        if (status === 'Lulus' && hasilVerif === 'Valid') {
            return 'Sudah Memenuhi';
        } else if (status === 'Lulus' && hasilVerif !== 'Valid') {
            return 'Menunggu Verifikasi';
        } else if (status === 'Tidak Lulus') {
            return 'Tidak Lulus';
        }
        return 'Belum Ada Data';
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Pegawai yang Belum Memenuhi Kompetensi
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Kompetensi: <span className="font-semibold text-purple-600">{kompetensi?.kode_kompetensi} - {kompetensi?.nama_kompetensi}</span>
                                        </p>
                                        {kompetensiInfo?.required_peran_nama && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                <span className="font-medium">Peran yang dibutuhkan:</span> {kompetensiInfo.required_peran_nama}
                                                {kompetensiInfo.required_peran_fungsi && ` (Fungsi: ${kompetensiInfo.required_peran_fungsi})`}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Stats Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
                                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                        <p className="text-xs text-purple-600">Pegawai dengan Peran Sesuai</p>
                                        <p className="text-2xl font-bold text-purple-700">{stats.total_pegawai_dengan_peran || 0}</p>
                                        <p className="text-xs text-purple-500 mt-1">Total pegawai</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                        <p className="text-xs text-green-600">Sudah Memenuhi</p>
                                        <p className="text-2xl font-bold text-green-700">{stats.sudah_memenuhi || 0}</p>
                                        <p className="text-xs text-green-500 mt-1">{stats.persentase_pemenuhan || 0}%</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                        <p className="text-xs text-red-600">Belum Memenuhi</p>
                                        <p className="text-2xl font-bold text-red-700">{stats.belum_memenuhi || 0}</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                                        <p className="text-xs text-yellow-600">Menunggu Verifikasi</p>
                                        <p className="text-2xl font-bold text-yellow-700">
                                            {pegawaiList.filter(p => p.kompetensi_detail?.status === 'Lulus' && p.kompetensi_detail?.hasil_verif !== 'Valid').length}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                        <p className="text-xs text-blue-600">Fungsi Terlibat</p>
                                        <p className="text-2xl font-bold text-blue-700">{fungsiOptions.length}</p>
                                    </div>
                                </div>

                                {/* Filter Section */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Cari Pegawai
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Cari nama, NIP, fungsi, peran, atau jabatan..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        
                                        {fungsiOptions.length > 0 && (
                                            <div className="min-w-[180px]">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Filter Fungsi
                                                </label>
                                                <select
                                                    value={selectedFungsi}
                                                    onChange={(e) => setSelectedFungsi(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                >
                                                    <option value="">Semua Fungsi</option>
                                                    {fungsiOptions.map(fungsi => (
                                                        <option key={fungsi} value={fungsi}>{fungsi}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSelectedFungsi('');
                                                }}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                Reset Filter
                                            </button>
                                            <button
                                                onClick={fetchPegawaiBelumMemenuhi}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                                                disabled={loading}
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                {/* Table Section */}
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                                        <span className="ml-3 text-gray-500">Memuat data...</span>
                                    </div>
                                ) : filteredList.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-gray-500">
                                            {stats.total_pegawai_dengan_peran === 0 
                                                ? `⚠️ Tidak ada pegawai dengan peran yang sesuai untuk kompetensi ${kompetensi?.kode_kompetensi}`
                                                : stats.belum_memenuhi === 0 
                                                    ? `✨ Semua pegawai dengan peran yang sesuai sudah memenuhi kompetensi ${kompetensi?.kode_kompetensi}`
                                                    : 'Tidak ada pegawai yang sesuai dengan filter'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fungsi</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenjang</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredList.map((pegawai, index) => (
                                                    <tr key={pegawai.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                            {pegawai.nip}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {pegawai.nama}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                                                            <div className="flex flex-wrap gap-1">
                                                                {pegawai.daftar_peran_array?.length > 0 ? (
                                                                    pegawai.daftar_peran_array.map((peran, i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                            {peran}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                {pegawai.nama_fungsi || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {pegawai.nama_jabatan || '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {pegawai.nama_jenjang || '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(pegawai.kompetensi_detail?.status, pegawai.kompetensi_detail?.hasil_verif)}`}>
                                                                {getStatusText(pegawai.kompetensi_detail?.status, pegawai.kompetensi_detail?.hasil_verif)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                                                            {pegawai.kompetensi_detail?.keterangan || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                
                                {/* Info Footer */}
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        <span className="font-semibold">Informasi:</span> 
                                        Terdapat <strong>{filteredList.length}</strong> pegawai yang belum memenuhi kompetensi <strong>{kompetensi?.kode_kompetensi}</strong>.
                                        {kompetensiInfo?.required_peran_nama && (
                                            <span className="block text-xs text-blue-600 mt-1">
                                                * Hanya menampilkan pegawai dengan peran <strong>{kompetensiInfo.required_peran_nama}</strong> yang relevan dengan kompetensi ini.
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PesertaBelumMemenuhiModal;