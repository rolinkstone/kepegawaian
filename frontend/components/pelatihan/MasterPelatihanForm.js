// components/pelatihan/MasterPelatihanForm.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createMasterPelatihan, updateMasterPelatihan } from './api/pelatihanApi';

const MasterPelatihanForm = ({ show, onClose, onSuccess, editingData, options, session, userRoles }) => {
    const [formData, setFormData] = useState({
        kode_pelatihan: '',
        nama_pelatihan: '',
        deskripsi: '',
        durasi: '',
        jenis_pelatihan: 'Teknis',
        biaya: '',
        kompetensi_ids: []
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedKompetensi, setSelectedKompetensi] = useState([]);

    useEffect(() => {
        if (show) {
            if (editingData) {
                setFormData({
                    kode_pelatihan: editingData.kode_pelatihan || '',
                    nama_pelatihan: editingData.nama_pelatihan || '',
                    deskripsi: editingData.deskripsi || '',
                    durasi: editingData.durasi?.toString() || '',
                    jenis_pelatihan: editingData.jenis_pelatihan || 'Teknis',
                    biaya: editingData.biaya?.toString() || '',
                    kompetensi_ids: []
                });
            } else {
                resetForm();
            }
        }
    }, [show, editingData]);

    const resetForm = () => {
        setFormData({
            kode_pelatihan: '',
            nama_pelatihan: '',
            deskripsi: '',
            durasi: '',
            jenis_pelatihan: 'Teknis',
            biaya: '',
            kompetensi_ids: []
        });
        setSelectedKompetensi([]);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleKompetensiChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setSelectedKompetensi(selected);
        setFormData(prev => ({ ...prev, kompetensi_ids: selected }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.kode_pelatihan) {
            newErrors.kode_pelatihan = 'Kode pelatihan harus diisi';
        }
        
        if (!formData.nama_pelatihan) {
            newErrors.nama_pelatihan = 'Nama pelatihan harus diisi';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

   // components/pelatihan/MasterPelatihanForm.js

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        Swal.fire({
            icon: 'warning',
            title: 'Validasi Gagal',
            text: 'Harap lengkapi data dengan benar'
        });
        return;
    }

    setLoading(true);
    
    try {
        // Log data yang akan dikirim
        console.log('📤 Data to send:', {
            ...formData,
            durasi: formData.durasi ? parseInt(formData.durasi) : null,
            biaya: formData.biaya ? parseFloat(formData.biaya) : null,
            kompetensi_ids: selectedKompetensi
        });

        const dataToSend = {
            ...formData,
            durasi: formData.durasi ? parseInt(formData.durasi) : null,
            biaya: formData.biaya ? parseFloat(formData.biaya) : null,
            kompetensi_ids: selectedKompetensi
        };

        let response;
        if (editingData) {
            response = await updateMasterPelatihan(session, editingData.id, dataToSend);
        } else {
            response = await createMasterPelatihan(session, dataToSend);
        }

        console.log('📥 Response:', response);

        if (response && response.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: editingData ? 'Master pelatihan berhasil diupdate' : 'Master pelatihan berhasil ditambahkan',
                timer: 1500,
                showConfirmButton: false
            });
            
            onSuccess();
            onClose();
        } else {
            throw new Error(response?.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('❌ Error saving data:', error);
        
        let errorMessage = error.message || 'Terjadi kesalahan saat menyimpan data';
        
        // Cek apakah error dari response
        if (error.response) {
            try {
                const errorData = await error.response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Ignore
            }
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Gagal Menyimpan Data',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
    } finally {
        setLoading(false);
    }
};

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingData ? 'Edit Master Pelatihan' : 'Tambah Master Pelatihan'}
                    </h2>
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
                    {/* Kode Pelatihan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Pelatihan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="kode_pelatihan"
                            value={formData.kode_pelatihan}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.kode_pelatihan ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Contoh: TEK-001"
                            disabled={loading}
                        />
                        {errors.kode_pelatihan && (
                            <p className="mt-1 text-sm text-red-600">{errors.kode_pelatihan}</p>
                        )}
                    </div>

                    {/* Nama Pelatihan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Pelatihan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama_pelatihan"
                            value={formData.nama_pelatihan}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.nama_pelatihan ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Contoh: Pengujian Menggunakan HPLC"
                            disabled={loading}
                        />
                        {errors.nama_pelatihan && (
                            <p className="mt-1 text-sm text-red-600">{errors.nama_pelatihan}</p>
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            name="deskripsi"
                            value={formData.deskripsi}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Deskripsi pelatihan..."
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Jenis Pelatihan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jenis Pelatihan
                            </label>
                            <select
                                name="jenis_pelatihan"
                                value={formData.jenis_pelatihan}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                <option value="Teknis">Teknis</option>
                                <option value="Manajerial">Manajerial</option>
                                <option value="Sertifikasi">Sertifikasi</option>
                                <option value="Umum">Umum</option>
                            </select>
                        </div>

                        {/* Durasi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Durasi (jam)
                            </label>
                            <input
                                type="number"
                                name="durasi"
                                value={formData.durasi}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="40"
                                disabled={loading}
                            />
                        </div>

                        {/* Biaya */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Biaya (Rp)
                            </label>
                            <input
                                type="number"
                                name="biaya"
                                value={formData.biaya}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Daftar Kompetensi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kompetensi yang Terkait
                        </label>
                        <select
                            multiple
                            size="6"
                            value={selectedKompetensi}
                            onChange={handleKompetensiChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {options.kompetensi?.map(kom => (
                                <option key={kom.id} value={kom.id}>
                                    {kom.kode_kompetensi} - {kom.nama_kompetensi} ({kom.nama_fungsi || '-'})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Tekan Ctrl/Cmd untuk memilih lebih dari satu kompetensi
                        </p>
                    </div>

                    {/* Tombol Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
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
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                        >
                            {loading ? 'Menyimpan...' : (editingData ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MasterPelatihanForm;