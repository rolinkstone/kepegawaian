// components/userskompetensi/modals/DetailModal.js
import React from 'react';
import Swal from 'sweetalert2';
import { useSession } from 'next-auth/react';

const DetailModal = ({ show, onClose, data, getStatusBadge }) => {
    const { data: session } = useSession();
    
    if (!show || !data) return null;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ;
    const fileUrl = `${baseUrl}/uploads/${data.bukti}`;

    // Fungsi untuk mendapatkan token dari berbagai sumber
    const getToken = () => {
        if (session?.accessToken) return session.accessToken;
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || sessionStorage.getItem('token');
        }
        return null;
    };

    const handleViewSertifikat = async () => {
        if (!data.bukti) {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak Ada File',
                text: 'Tidak ada sertifikat/bukti untuk ditampilkan',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        try {
            const token = getToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(fileUrl, { headers });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sesi telah berakhir. Silakan login kembali.');
                }
                throw new Error('Gagal memuat file');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Membuka File',
                text: error.message,
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    // Fungsi untuk mendapatkan badge status (tetap dipertahankan)
    const getHasilVerifBadge = (hasil) => {
        const badges = {
            'Valid': 'bg-green-100 text-green-800',
            'Tidak Valid': 'bg-red-100 text-red-800',
            'Perlu Revisi': 'bg-yellow-100 text-yellow-800'
        };
        return badges[hasil] || 'bg-gray-100 text-gray-800';
    };

    // Debug: log data untuk memastikan nilai ada
    console.log('📊 DetailModal data:', {
        hasil_verif: data.hasil_verif,
        keterangan: data.keterangan,
        verified_by: data.verified_by,
        verified_at: data.verified_at
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Detail Kompetensi
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Informasi Pegawai */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Data Pegawai
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-500">Nama</p>
                                <p className="font-medium text-gray-900">{data.user_nama}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">NIP</p>
                                <p className="font-medium text-gray-900">{data.user_nip}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500">Fungsi / Jabatan</p>
                                <p className="font-medium text-gray-900">
                                    {data.user_fungsi || '-'} {data.user_jabatan && `• ${data.user_jabatan}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Kompetensi */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Data Kompetensi
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500">Kompetensi</p>
                                <p className="font-medium text-gray-900">{data.nama_kompetensi}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Kode</p>
                                <p className="font-medium text-gray-900">{data.kode_kompetensi}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Fungsi</p>
                                <p className="font-medium text-gray-900">{data.kompetensi_fungsi || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detail Pemenuhan */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pemenuhan
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-500">Tanggal Dipenuhi</p>
                                <p className="font-medium text-gray-900">{data.tanggal_dipenuhi}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Nilai</p>
                                <p className="font-medium text-gray-900">{data.nilai || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Status</p>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(data.status)}`}>
                                    {data.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Sertifikat</p>
                                {data.bukti ? (
                                    <button
                                        onClick={handleViewSertifikat}
                                        className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Lihat
                                    </button>
                                ) : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Informasi Verifikasi */}
                    {(data.verified_by || data.verified_at || data.hasil_verif || data.keterangan) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Verifikasi
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Verifikator</p>
                                    <p className="font-medium text-gray-900">{data.verified_by_nama || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Tanggal</p>
                                    <p className="font-medium text-gray-900">
                                        {data.verified_at ? new Date(data.verified_at).toLocaleDateString('id-ID') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Hasil Verifikasi</p>
                                    {data.hasil_verif ? (
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getHasilVerifBadge(data.hasil_verif)}`}>
                                            {data.hasil_verif}
                                        </span>
                                    ) : '-'}
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Keterangan</p>
                                    <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                                        {data.keterangan || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Informasi Sistem */}
                    <div className="text-xs text-gray-400 text-right border-t border-gray-100 pt-3">
                        Dibuat: {data.created_at ? new Date(data.created_at).toLocaleString('id-ID') : '-'}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;