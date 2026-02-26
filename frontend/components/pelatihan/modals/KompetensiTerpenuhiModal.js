// components/pelatihan/modals/KompetensiTerpenuhiModal.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { simpanKompetensiTerpenuhi } from '../api/pelatihanApi';

const KompetensiTerpenuhiModal = ({ show, onClose, data, session, onSuccess }) => {
    const [selectedKompetensi, setSelectedKompetensi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [kompetensiList, setKompetensiList] = useState([]);

    useEffect(() => {
        if (show && data?.jadwal) {
            // Ambil kompetensi dari jadwal
            setKompetensiList(data.jadwal.kompetensi || []);
        }
    }, [show, data]);

    if (!show || !data) return null;

    const { jadwal, peserta } = data;

    const handleKompetensiChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setSelectedKompetensi(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedKompetensi.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan',
                text: 'Pilih minimal satu kompetensi'
            });
            return;
        }

        setLoading(true);
        
        try {
            const result = await simpanKompetensiTerpenuhi(session, peserta.id, selectedKompetensi);
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Kompetensi terpenuhi berhasil disimpan',
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                throw new Error(result.message || 'Gagal menyimpan kompetensi');
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
                        Kompetensi Terpenuhi
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Peserta:</span> {peserta.user_nama} ({peserta.user_nip})
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Pelatihan:</span> {jadwal.nama_pelatihan}
                        </p>
                    </div>

                    {kompetensiList.length > 0 ? (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Kompetensi yang Terpenuhi
                                </label>
                                <select
                                    multiple
                                    size="6"
                                    value={selectedKompetensi}
                                    onChange={handleKompetensiChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    {kompetensiList.map(kom => (
                                        <option key={kom.id} value={kom.id}>
                                            {kom.kode_kompetensi} - {kom.nama_kompetensi}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tekan Ctrl/Cmd untuk memilih lebih dari satu kompetensi
                                </p>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p>Kompetensi yang dipilih akan dicatat sebagai terpenuhi untuk peserta ini.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mb-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                            <p>Tidak ada kompetensi yang terkait dengan pelatihan ini.</p>
                        </div>
                    )}

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
                            disabled={loading || kompetensiList.length === 0 || selectedKompetensi.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KompetensiTerpenuhiModal;