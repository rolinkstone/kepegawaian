// components/userskompetensi/modals/VerifyModal.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const VerifyModal = ({ show, onClose, data, onConfirm }) => {
    const [status, setStatus] = useState('');
    const [hasilVerif, setHasilVerif] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Reset form ketika modal dibuka dengan data baru
        if (show && data) {
            setStatus('');
            setHasilVerif('');
            setKeterangan('');
        }
    }, [show, data]);

    if (!show || !data) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validasi
        if (!status) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan',
                text: 'Pilih status verifikasi'
            });
            return;
        }
        
        if (!hasilVerif) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan',
                text: 'Pilih hasil verifikasi'
            });
            return;
        }

        setLoading(true);
        
        try {
            // Kirim data verifikasi sebagai object
            await onConfirm(data.id, { 
                status, 
                hasil_verif: hasilVerif,
                keterangan: keterangan 
            });
            // Modal akan ditutup oleh container setelah sukses
        } catch (error) {
            console.error('Error in verify modal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Gagal melakukan verifikasi'
            });
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk mendapatkan warna badge berdasarkan status
    const getStatusColor = (status) => {
        switch(status) {
            case 'Lulus': return 'bg-green-100 text-green-800';
            case 'Tidak Lulus': return 'bg-red-100 text-red-800';
            case 'Dalam Proses': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Fungsi untuk mendapatkan warna badge hasil verifikasi
    const getHasilVerifColor = (hasil) => {
        switch(hasil) {
            case 'Valid': return 'bg-green-100 text-green-800';
            case 'Tidak Valid': return 'bg-red-100 text-red-800';
            case 'Perlu Revisi': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Verifikasi Kompetensi</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Informasi Pegawai */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Informasi Pegawai</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="font-medium">Nama:</span>
                                <p className="mt-1">{data.user_nama}</p>
                            </div>
                            <div>
                                <span className="font-medium">NIP:</span>
                                <p className="mt-1">{data.user_nip}</p>
                            </div>
                            <div>
                                <span className="font-medium">Fungsi:</span>
                                <p className="mt-1">{data.user_fungsi || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Kompetensi */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Informasi Kompetensi</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="font-medium">Kompetensi:</span>
                                <p className="mt-1">{data.nama_kompetensi}</p>
                            </div>
                            <div>
                                <span className="font-medium">Kode:</span>
                                <p className="mt-1">{data.kode_kompetensi}</p>
                            </div>
                            <div>
                                <span className="font-medium">Tanggal Dipenuhi:</span>
                                <p className="mt-1">{data.tanggal_dipenuhi}</p>
                            </div>
                            {data.nilai && (
                                <div>
                                    <span className="font-medium">Nilai:</span>
                                    <p className="mt-1">{data.nilai}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-3">
                            <span className="text-sm font-medium mr-2">Status Saat Ini:</span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(data.status)}`}>
                                {data.status}
                            </span>
                        </div>
                        {data.hasil_verif && (
                            <div className="mt-2">
                                <span className="text-sm font-medium mr-2">Hasil Sebelumnya:</span>
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHasilVerifColor(data.hasil_verif)}`}>
                                    {data.hasil_verif}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Informasi Verifikasi Sebelumnya (jika ada) */}
                    {data.verified_by && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-medium">Verifikasi Sebelumnya:</p>
                                    <p>Diverifikasi oleh: {data.verified_by_nama || '-'}</p>
                                    <p>Pada: {data.verified_at ? new Date(data.verified_at).toLocaleString('id-ID') : '-'}</p>
                                    {data.keterangan && (
                                        <p className="mt-1">Keterangan: {data.keterangan}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pilihan Status Verifikasi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Verifikasi <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading}
                        >
                            <option value="">Pilih Status</option>
                            <option value="Lulus">Lulus</option>
                            <option value="Tidak Lulus">Tidak Lulus</option>
                            <option value="Dalam Proses">Dalam Proses</option>
                        </select>
                    </div>

                    {/* Pilihan Hasil Verifikasi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hasil Verifikasi <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={hasilVerif}
                            onChange={(e) => setHasilVerif(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading}
                        >
                            <option value="">Pilih Hasil Verifikasi</option>
                            <option value="Valid">Valid</option>
                            <option value="Tidak Valid">Tidak Valid</option>
                            <option value="Perlu Revisi">Perlu Revisi</option>
                        </select>
                    </div>

                    {/* Keterangan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keterangan
                        </label>
                        <textarea
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan keterangan verifikasi (opsional)"
                            disabled={loading}
                        />
                    </div>

                    {/* Informasi Verifikasi */}
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium">Informasi Verifikasi:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Anda akan bertindak sebagai verifikator</li>
                                    <li>ID Admin Anda akan tercatat di field <span className="font-mono bg-blue-100 px-1">verified_by</span></li>
                                    <li>Hasil verifikasi akan tercatat di field <span className="font-mono bg-blue-100 px-1">hasil_verif</span></li>
                                    <li>Keterangan akan tercatat di field <span className="font-mono bg-blue-100 px-1">keterangan</span></li>
                                    <li>Waktu verifikasi akan tercatat di field <span className="font-mono bg-blue-100 px-1">verified_at</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !status || !hasilVerif}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center min-w-[120px] justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : (
                                'Verifikasi'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyModal;