// components/pelatihan/KompetensiWajibForm.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    fetchAvailableKompetensi,
    createKompetensiWajib,
    createKompetensiWajibBulk
} from './api/pelatihanApi';

const KompetensiWajibForm = ({ show, onClose, onSuccess, session, existingTahunOptions }) => {
    const [formData, setFormData] = useState({
        tahun: new Date().getFullYear().toString()
    });
    const [kompetensiOptions, setKompetensiOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedKompetensi, setSelectedKompetensi] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (show) {
            fetchAvailableData();
            resetForm();
        }
    }, [show, formData.tahun]);

    const fetchAvailableData = async () => {
        try {
            const result = await fetchAvailableKompetensi(session, formData.tahun);
            if (result.success) {
                setKompetensiOptions(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching available kompetensi:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            tahun: new Date().getFullYear().toString()
        });
        setSelectedKompetensi([]);
        setSearchTerm('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'tahun') {
            setSearchTerm('');
            setSelectedKompetensi([]);
        }
    };

    const handleSelectAll = () => {
        if (selectedKompetensi.length === filteredKompetensi.length) {
            setSelectedKompetensi([]);
        } else {
            setSelectedKompetensi(filteredKompetensi.map(k => k.id));
        }
    };

    const handleSubmit = async () => {
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
            const response = await createKompetensiWajibBulk(session, selectedKompetensi, formData.tahun);

            if (response.success) {
                let message = response.message;
                if (response.data?.skipped > 0) {
                    message = `${response.message} (${response.data.skipped} duplikat diabaikan)`;
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: message,
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: response.message || 'Gagal menambah kompetensi wajib'
                });
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

    const filteredKompetensi = kompetensiOptions.filter(kom =>
        kom.kode_kompetensi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kom.nama_kompetensi?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tahunList = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Tambah Kompetensi Wajib
                                </h3>

                                <div className="space-y-4">
                                    {/* Tahun */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tahun <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="tahun"
                                            value={formData.tahun}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            {tahunList.map(tahun => (
                                                <option key={tahun} value={tahun}>{tahun}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Kompetensi dengan Checkbox List */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kompetensi <span className="text-red-500">*</span>
                                        </label>
                                        
                                        <input
                                            type="text"
                                            placeholder="Cari kompetensi (kode atau nama)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                                        />
                                        
                                        {filteredKompetensi.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="text-sm text-purple-600 hover:text-purple-800 mb-2 block"
                                            >
                                                {selectedKompetensi.length === filteredKompetensi.length ? 'Deselect All' : 'Select All'}
                                                {filteredKompetensi.length > 0 && (
                                                    <span className="ml-1 text-gray-400">
                                                        ({selectedKompetensi.length}/{filteredKompetensi.length})
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                        
                                        <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                                            {filteredKompetensi.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    {kompetensiOptions.length === 0 
                                                        ? `Tidak ada kompetensi yang tersedia untuk tahun ${formData.tahun}`
                                                        : 'Tidak ada kompetensi yang sesuai dengan pencarian'}
                                                </div>
                                            ) : (
                                                filteredKompetensi.map(kom => (
                                                    <label
                                                        key={kom.id}
                                                        className="flex items-start p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            value={kom.id}
                                                            checked={selectedKompetensi.includes(kom.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedKompetensi([...selectedKompetensi, kom.id]);
                                                                } else {
                                                                    setSelectedKompetensi(selectedKompetensi.filter(id => id !== kom.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                        />
                                                        <div className="ml-3 flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {kom.kode_kompetensi}
                                                                </span>
                                                                {kom.nama_fungsi && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                        {kom.nama_fungsi}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-700 break-words mt-1">
                                                                {kom.nama_kompetensi}
                                                            </p>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        
                                        {selectedKompetensi.length > 0 && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                Terpilih: {selectedKompetensi.length} kompetensi
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || kompetensiOptions.length === 0}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Simpan'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KompetensiWajibForm;