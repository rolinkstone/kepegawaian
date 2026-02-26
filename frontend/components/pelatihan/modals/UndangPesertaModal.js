// components/pelatihan/modals/UndangPesertaModal.js
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { tambahPeserta } from '../api/pelatihanApi';

const UndangPesertaModal = ({ show, onClose, jadwal, options, session, onSuccess }) => {
    const [selectedPeserta, setSelectedPeserta] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    if (!show || !jadwal) return null;

    const filteredUsers = options.users?.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return user.nama?.toLowerCase().includes(searchLower) ||
               user.nip?.toLowerCase().includes(searchLower) ||
               user.nama_fungsi?.toLowerCase().includes(searchLower);
    }) || [];

    const handlePesertaChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setSelectedPeserta(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedPeserta.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan',
                text: 'Pilih minimal satu peserta'
            });
            return;
        }

        setLoading(true);
        
        try {
            const result = await tambahPeserta(session, jadwal.id, selectedPeserta);
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: `${selectedPeserta.length} peserta berhasil diundang`,
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                throw new Error(result.message || 'Gagal mengundang peserta');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        Undang Peserta - {jadwal.nama_pelatihan}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Jadwal:</span> {jadwal.nama_pelatihan}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                            <span className="font-medium">Tanggal:</span> {new Date(jadwal.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(jadwal.tanggal_selesai).toLocaleDateString('id-ID')}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari Pegawai
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari berdasarkan nama, NIP, atau fungsi..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Daftar Peserta */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Peserta
                        </label>
                        <select
                            multiple
                            size="8"
                            value={selectedPeserta}
                            onChange={handlePesertaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {filteredUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.nama} ({user.nip}) - {user.nama_fungsi || '-'}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Tekan Ctrl/Cmd untuk memilih lebih dari satu peserta
                        </p>
                    </div>

                    {/* Info */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p>Peserta yang diundang akan menerima notifikasi dan dapat mengkonfirmasi kehadiran mereka.</p>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedPeserta.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Mengundang...' : 'Undang Peserta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UndangPesertaModal;