// components/pelatihan/JadwalPelatihanList.js
import React from 'react';

const JadwalPelatihanList = ({ 
    data, 
    loading, 
    pagination, 
    onPageChange, 
    onPageSizeChange, 
    onViewDetail, 
    onEdit, 
    onDelete, 
    onPublikasi, 
    onUndang, 
    onMonitor,
    onUbahStatus,
    userRoles,
    getStatusBadge,
    userNip
}) => {
    
    const getCurrentPageData = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return data.slice(start, end);
    };

    const currentData = getCurrentPageData();

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Info untuk user biasa */}
            {!userRoles.isAdmin && !userRoles.isKatim && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-sm text-blue-700">
                        <span className="font-medium">Info:</span> Menampilkan {data.length} jadwal pelatihan yang mengundang Anda.
                    </p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pelatihan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peserta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                    {!userRoles.isAdmin && !userRoles.isKatim 
                                        ? 'Tidak ada jadwal pelatihan yang mengundang Anda' 
                                        : 'Tidak ada data jadwal pelatihan'}
                                </td>
                            </tr>
                        ) : (
                            currentData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.kode_pelatihan}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{item.nama_pelatihan}</div>
                                        <div className="text-xs text-gray-500">{item.jenis_pelatihan}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>{new Date(item.tanggal_mulai).toLocaleDateString('id-ID')}</div>
                                        <div className="text-xs text-gray-500">s/d {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.lokasi || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                                            {item.metode || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>{item.jumlah_peserta || 0} / {item.kuota || '∞'}</div>
                                        <div className="text-xs text-green-600">{item.jumlah_hadir || 0} hadir</div>
                                        {/* Tampilkan status undangan milik user yang login (termasuk katim/admin yang mengundang diri sendiri) */}
                                        {item.status_undangan_saya && (
                                            <div className="mt-1">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    item.status_undangan_saya === 'Diterima' ? 'bg-green-100 text-green-700' :
                                                    item.status_undangan_saya === 'Ditolak' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    Undangan: {item.status_undangan_saya}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => onViewDetail(item)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Detail"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            
                                            {/* Pantau sertifikat peserta — muncul setelah pelatihan berstatus Selesai */}
                                            {(userRoles.isKatim || userRoles.isAdmin) && item.status === 'Selesai' && (
                                                <button
                                                    onClick={() => onMonitor(item)}
                                                    className="flex items-center gap-1 px-2 py-1 text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
                                                    title="Pantau sertifikat peserta (sudah/belum upload ke riwayat)"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    <span className="text-xs font-medium">Pantau</span>
                                                </button>
                                            )}

                                            {/* Ubah status: Publik -> Mulai (Berlangsung) */}
                                            {(userRoles.isKatim || userRoles.isAdmin) && item.status === 'Publik' && (
                                                <button
                                                    onClick={() => onUbahStatus(item, 'Berlangsung')}
                                                    className="flex items-center gap-1 px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100"
                                                    title="Mulai pelatihan (ubah status menjadi Berlangsung)"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-xs font-medium">Mulai</span>
                                                </button>
                                            )}

                                            {/* Ubah status: Berlangsung -> Selesai */}
                                            {(userRoles.isKatim || userRoles.isAdmin) && item.status === 'Berlangsung' && (
                                                <button
                                                    onClick={() => onUbahStatus(item, 'Selesai')}
                                                    className="flex items-center gap-1 px-2 py-1 text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                                                    title="Tandai pelatihan selesai (ubah status menjadi Selesai)"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-medium">Selesai</span>
                                                </button>
                                            )}

                                            {/* Untuk user biasa, hanya lihat detail (tanpa aksi edit/dll) */}
                                            {(userRoles.isKatim || userRoles.isAdmin) && item.status === 'Draft' && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => onPublikasi(item)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Publikasi"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            
                                            {(userRoles.isKatim || userRoles.isAdmin) && (item.status === 'Draft' || item.status === 'Publik') && (
                                                <button
                                                    onClick={() => onUndang(item)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Undang Peserta"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                    </svg>
                                                </button>
                                            )}
                                            
                                            {/* Hapus: admin boleh semua status; katim hanya Draft */}
                                            {(userRoles.isAdmin || (userRoles.isKatim && item.status === 'Draft')) && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title={userRoles.isAdmin ? 'Hapus jadwal (status apa pun)' : 'Hapus jadwal'}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data.length > 0 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Menampilkan {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, data.length)} dari {data.length} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {[...Array(Math.ceil(data.length / pagination.pageSize))].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => onPageChange(i + 1)}
                                className={`px-3 py-1 border rounded hover:bg-gray-50 ${
                                    pagination.current === i + 1 ? 'bg-blue-500 text-white' : ''
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => onPageChange(pagination.current + 1)}
                            disabled={pagination.current === Math.ceil(data.length / pagination.pageSize)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <select
                        value={pagination.pageSize}
                        onChange={(e) => onPageSizeChange(pagination.current, parseInt(e.target.value))}
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
    );
};

export default JadwalPelatihanList;