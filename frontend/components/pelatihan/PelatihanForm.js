// components/pelatihan/PelatihanForm.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createJadwalPelatihan, updateJadwalPelatihan } from './api/pelatihanApi';

const PelatihanForm = ({ show, onClose, onSuccess, editingData, options, masterPelatihan, session, userRoles }) => {
    const [formData, setFormData] = useState({
        id_pelatihan: '',
        nama_penyelenggara: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        waktu_mulai: '',
        waktu_selesai: '',
        lokasi: '',
        metode: 'Offline',
        kuota: '',
        deskripsi: '',
        peserta_ids: []
    });
    
    const [loading, setLoading] = useState(false);
    const [selectedPelatihan, setSelectedPelatihan] = useState(null);
    const [errors, setErrors] = useState({});
    const [selectedPeserta, setSelectedPeserta] = useState([]);

    useEffect(() => {
        if (show) {
            if (editingData) {
                setFormData({
                    id_pelatihan: editingData.id_pelatihan?.toString() || '',
                    nama_penyelenggara: editingData.nama_penyelenggara || '',
                    tanggal_mulai: editingData.tanggal_mulai || '',
                    tanggal_selesai: editingData.tanggal_selesai || '',
                    waktu_mulai: editingData.waktu_mulai || '',
                    waktu_selesai: editingData.waktu_selesai || '',
                    lokasi: editingData.lokasi || '',
                    metode: editingData.metode || 'Offline',
                    kuota: editingData.kuota?.toString() || '',
                    deskripsi: editingData.deskripsi || '',
                    peserta_ids: []
                });
                
                // Cari data pelatihan yang dipilih
                const pelatihan = masterPelatihan.find(p => p.id === editingData.id_pelatihan);
                setSelectedPelatihan(pelatihan);
            } else {
                resetForm();
            }
        }
    }, [show, editingData, masterPelatihan]);

    const resetForm = () => {
        setFormData({
            id_pelatihan: '',
            nama_penyelenggara: '',
            tanggal_mulai: '',
            tanggal_selesai: '',
            waktu_mulai: '',
            waktu_selesai: '',
            lokasi: '',
            metode: 'Offline',
            kuota: '',
            deskripsi: '',
            peserta_ids: []
        });
        setSelectedPelatihan(null);
        setSelectedPeserta([]);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Update selectedPelatihan when id_pelatihan changes
        if (name === 'id_pelatihan' && value) {
            const pelatihan = masterPelatihan.find(p => p.id === parseInt(value));
            setSelectedPelatihan(pelatihan);
        }
    };

    const handlePesertaChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(parseInt(options[i].value));
            }
        }
        setSelectedPeserta(selected);
        setFormData(prev => ({ ...prev, peserta_ids: selected }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.id_pelatihan) {
            newErrors.id_pelatihan = 'Pilih pelatihan';
        }
        
        if (!formData.tanggal_mulai) {
            newErrors.tanggal_mulai = 'Tanggal mulai harus diisi';
        }
        
        if (!formData.tanggal_selesai) {
            newErrors.tanggal_selesai = 'Tanggal selesai harus diisi';
        }
        
        if (formData.tanggal_mulai && formData.tanggal_selesai && 
            new Date(formData.tanggal_mulai) > new Date(formData.tanggal_selesai)) {
            newErrors.tanggal_selesai = 'Tanggal selesai harus setelah tanggal mulai';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
            const dataToSend = {
                ...formData,
                kuota: formData.kuota ? parseInt(formData.kuota) : null,
                peserta_ids: selectedPeserta
            };

            let response;
            if (editingData) {
                response = await updateJadwalPelatihan(session, editingData.id, dataToSend);
            } else {
                response = await createJadwalPelatihan(session, dataToSend);
            }

            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: editingData ? 'Jadwal berhasil diupdate' : 'Jadwal berhasil dibuat',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                onSuccess();
                onClose();
            } else {
                throw new Error(response.message || 'Gagal menyimpan data');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Gagal menyimpan data'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingData ? 'Edit Jadwal Pelatihan' : 'Buat Jadwal Pelatihan Baru'}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Informasi Pelatihan */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-4">Informasi Pelatihan</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Pilih Master Pelatihan */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Pelatihan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="id_pelatihan"
                                    value={formData.id_pelatihan}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.id_pelatihan ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading || editingData}
                                >
                                    <option value="">Pilih Pelatihan</option>
                                    {masterPelatihan.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.kode_pelatihan} - {p.nama_pelatihan} ({p.jenis_pelatihan})
                                        </option>
                                    ))}
                                </select>
                                {errors.id_pelatihan && (
                                    <p className="mt-1 text-sm text-red-600">{errors.id_pelatihan}</p>
                                )}
                            </div>

                            {/* Info Pelatihan Terpilih */}
                            {selectedPelatihan && (
                                <div className="col-span-2 bg-blue-50 p-3 rounded-lg text-sm">
                                    <p><span className="font-medium">Deskripsi:</span> {selectedPelatihan.deskripsi || '-'}</p>
                                    <p><span className="font-medium">Durasi:</span> {selectedPelatihan.durasi || '-'} jam</p>
                                    <p><span className="font-medium">Jenis:</span> {selectedPelatihan.jenis_pelatihan}</p>
                                </div>
                            )}

                            {/* Nama Penyelenggara */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Penyelenggara
                                </label>
                                <input
                                    type="text"
                                    name="nama_penyelenggara"
                                    value={formData.nama_penyelenggara}
                                    onChange={handleChange}
                                    placeholder="Contoh: BBPOM, Lembaga Diklat, dll"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Jadwal dan Lokasi */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-4">Jadwal dan Lokasi</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Tanggal Mulai */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Mulai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tanggal_mulai"
                                    value={formData.tanggal_mulai}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.tanggal_mulai && (
                                    <p className="mt-1 text-sm text-red-600">{errors.tanggal_mulai}</p>
                                )}
                            </div>

                            {/* Tanggal Selesai */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Selesai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tanggal_selesai"
                                    value={formData.tanggal_selesai}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.tanggal_selesai && (
                                    <p className="mt-1 text-sm text-red-600">{errors.tanggal_selesai}</p>
                                )}
                            </div>

                            {/* Waktu Mulai */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Waktu Mulai
                                </label>
                                <input
                                    type="time"
                                    name="waktu_mulai"
                                    value={formData.waktu_mulai}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>

                            {/* Waktu Selesai */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Waktu Selesai
                                </label>
                                <input
                                    type="time"
                                    name="waktu_selesai"
                                    value={formData.waktu_selesai}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>

                            {/* Lokasi */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lokasi
                                </label>
                                <input
                                    type="text"
                                    name="lokasi"
                                    value={formData.lokasi}
                                    onChange={handleChange}
                                    placeholder="Contoh: Ruang Meeting, Zoom Meeting, dll"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>

                            {/* Metode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Metode
                                </label>
                                <select
                                    name="metode"
                                    value={formData.metode}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    {options.metode_options?.map(metode => (
                                        <option key={metode} value={metode}>{metode}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Kuota */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kuota Peserta
                                </label>
                                <input
                                    type="number"
                                    name="kuota"
                                    value={formData.kuota}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Kosongkan jika tidak terbatas"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi / Catatan
                        </label>
                        <textarea
                            name="deskripsi"
                            value={formData.deskripsi}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Informasi tambahan tentang pelatihan..."
                            disabled={loading}
                        />
                    </div>

                    {/* Daftar Peserta (untuk undangan awal) */}
                    {!editingData && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700 mb-4">Undang Peserta (Opsional)</h3>
                            
                            <select
                                multiple
                                size="6"
                                value={selectedPeserta}
                                onChange={handlePesertaChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                {options.users?.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.nama} ({user.nip}) - {user.nama_fungsi || '-'}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Tekan Ctrl/Cmd untuk memilih lebih dari satu peserta
                            </p>
                        </div>
                    )}

                    {/* Informasi Status */}
                    {editingData && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700 mb-2">Informasi Status</h3>
                            <p className="text-sm">
                                Status saat ini: <span className="font-semibold">{editingData.status}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {editingData.status === 'Draft' 
                                    ? 'Jadwal masih dalam mode draft. Publikasikan setelah siap.'
                                    : 'Jadwal sudah dipublikasikan. Hanya informasi tertentu yang dapat diubah.'}
                            </p>
                        </div>
                    )}

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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Menyimpan...' : (editingData ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PelatihanForm;