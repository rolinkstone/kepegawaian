// components/userskompetensi/UserskompetensiForm.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createUserKompetensi, updateUserKompetensi } from './api/userKompetensiApi';

const UserskompetensiForm = ({ show, onClose, onSuccess, editingData, options, userRoles, session }) => {
    const [formData, setFormData] = useState({
        id_user: '',
        id_kompetensi: '',
        tanggal_dipenuhi: '',
        nilai: '',
        status: 'Dalam Proses',
        bukti: null
    });
    
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    // Dapatkan data user saat ini dari session
    useEffect(() => {
        if (session?.user && options.users) {
            // Coba dapatkan NIP dari berbagai sumber
            const userNip = session.user.preferred_username || 
                           session.user.username || 
                           session.user.email || 
                           session.user.nip;
            
            console.log('🔍 Session user:', session.user);
            console.log('🔍 Mencari user dengan NIP:', userNip);
            console.log('📋 Data users dari options:', options.users);
            
            // Cari user berdasarkan NIP
            let foundUser = options.users.find(u => u.nip === userNip);
            
            // Jika tidak ditemukan, coba cari berdasarkan bagian dari NIP
            if (!foundUser && userNip) {
                console.log('🔍 Mencari user dengan partial match...');
                foundUser = options.users.find(u => u.nip?.includes(userNip) || userNip.includes(u.nip));
            }
            
            // Jika masih tidak ditemukan, ambil user pertama (untuk testing)
            if (!foundUser && options.users.length > 0) {
                console.log('⚠️ User tidak ditemukan, menggunakan user pertama untuk testing');
                foundUser = options.users[0];
                setDebugInfo(`User tidak ditemukan, menggunakan: ${foundUser.nama} (${foundUser.nip})`);
            }
            
            if (foundUser) {
                setCurrentUser(foundUser);
                console.log('✅ Current user ditemukan:', foundUser);
                setDebugInfo(`User ditemukan: ${foundUser.nama} (${foundUser.nip})`);
            } else {
                console.log('❌ Current user tidak ditemukan dalam options.users');
                setDebugInfo('User tidak ditemukan dalam database. Silakan hubungi admin.');
            }
        }
    }, [session, options.users]);

    // Set id_user otomatis untuk user biasa dan katim
    useEffect(() => {
        if (!editingData && show) {
            if (!userRoles.isAdmin) {
                if (currentUser) {
                    const userId = currentUser.id.toString();
                    console.log('📌 Auto-set id_user:', userId);
                    setFormData(prev => ({
                        ...prev,
                        id_user: userId
                    }));
                    setDebugInfo(`ID User diset: ${userId} (${currentUser.nama})`);
                } else {
                    console.log('⚠️ currentUser tidak ada, id_user tidak bisa diset otomatis');
                    
                    // Jika tidak ada currentUser tapi options.users ada, ambil user pertama
                    if (options.users && options.users.length > 0) {
                        const fallbackUser = options.users[0];
                        setCurrentUser(fallbackUser);
                        setFormData(prev => ({
                            ...prev,
                            id_user: fallbackUser.id.toString()
                        }));
                        setDebugInfo(`Menggunakan fallback user: ${fallbackUser.nama}`);
                    }
                }
            } else {
                console.log('📌 Admin mode - id_user akan dipilih manual');
                setDebugInfo('Admin mode - silakan pilih pegawai');
            }
        }
    }, [editingData, userRoles.isAdmin, currentUser, show, options.users]);

    // Reset form ketika modal dibuka/tutup
    useEffect(() => {
        if (show) {
            console.log('📋 Form ditampilkan, editingData:', editingData);
            
            if (editingData) {
                console.log('📝 Editing data:', editingData);
                const newFormData = {
                    id_user: editingData.id_user?.toString() || '',
                    id_kompetensi: editingData.id_kompetensi?.toString() || '',
                    tanggal_dipenuhi: editingData.tanggal_dipenuhi || '',
                    nilai: editingData.nilai?.toString() || '',
                    status: editingData.status || 'Dalam Proses',
                    bukti: editingData.bukti || null
                };
                setFormData(newFormData);
                setDebugInfo(`Mode Edit - ID: ${editingData.id}`);
                
                if (editingData.bukti) {
                    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${editingData.bukti}`;
                    setPreviewFile({
                        name: editingData.bukti,
                        url: fileUrl
                    });
                }
            } else {
                resetForm();
            }
        }
    }, [show, editingData]);

    const resetForm = () => {
        let newIdUser = '';
        
        if (!userRoles.isAdmin) {
            if (currentUser) {
                newIdUser = currentUser.id?.toString() || '';
            } else if (options.users && options.users.length > 0) {
                // Fallback ke user pertama
                newIdUser = options.users[0].id?.toString() || '';
                setDebugInfo(`Fallback ke user: ${options.users[0].nama}`);
            }
        }
        
        console.log('📌 Reset form dengan id_user:', newIdUser);
        
        const newFormData = {
            id_user: newIdUser,
            id_kompetensi: '',
            tanggal_dipenuhi: '',
            nilai: '',
            status: 'Dalam Proses',
            bukti: null
        };
        
        setFormData(newFormData);
        setSelectedFile(null);
        setPreviewFile(null);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('📁 File selected:', file.name, file.type, file.size);
            
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            const maxSize = 2 * 1024 * 1024; // 2MB

            if (!allowedTypes.includes(file.type)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hanya file PDF, JPG, atau PNG yang diperbolehkan'
                });
                e.target.value = '';
                return;
            }
            
            if (file.size > maxSize) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ukuran file maksimal 2MB'
                });
                e.target.value = '';
                return;
            }
            
            setSelectedFile(file);
            setFormData(prev => ({ ...prev, bukti: file.name }));
            
            const previewUrl = URL.createObjectURL(file);
            setPreviewFile({
                name: file.name,
                url: previewUrl,
                type: file.type
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        console.log('🔍 Validasi form:', {
            id_user: formData.id_user,
            id_kompetensi: formData.id_kompetensi,
            tanggal_dipenuhi: formData.tanggal_dipenuhi
        });
        
        if (!formData.id_user || formData.id_user === '') {
            newErrors.id_user = 'Data user tidak ditemukan';
        }
        
        if (!formData.id_kompetensi || formData.id_kompetensi === '') {
            newErrors.id_kompetensi = 'Kompetensi harus dipilih';
        }
        
        if (!formData.tanggal_dipenuhi || formData.tanggal_dipenuhi === '') {
            newErrors.tanggal_dipenuhi = 'Tanggal dipenuhi harus diisi';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // components/userskompetensi/UserskompetensiForm.js

// components/userskompetensi/UserskompetensiForm.js

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        Swal.fire({
            icon: 'warning',
            title: 'Validasi Gagal',
            text: 'Harap lengkapi semua field yang wajib diisi'
        });
        return;
    }

    setLoading(true);
    
    try {
        const formDataToSend = new FormData();
        
        formDataToSend.append('id_user', String(formData.id_user));
        formDataToSend.append('id_kompetensi', String(formData.id_kompetensi));
        formDataToSend.append('tanggal_dipenuhi', String(formData.tanggal_dipenuhi));
        formDataToSend.append('status', String(formData.status));
        
        if (formData.nilai && formData.nilai.trim() !== '') {
            formDataToSend.append('nilai', String(formData.nilai));
        }
        
        if (selectedFile) {
            formDataToSend.append('bukti', selectedFile);
        } else if (editingData && editingData.bukti && !selectedFile) {
            formDataToSend.append('bukti_lama', editingData.bukti);
        }

        let response;
        if (editingData) {
            response = await updateUserKompetensi(session, editingData.id, formDataToSend);
        } else {
            response = await createUserKompetensi(session, formDataToSend);
        }

        // CEK RESPONSE
        if (response && response.success) {
            // SUKSES
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: editingData ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan',
                timer: 1500,
                showConfirmButton: false
            });
            
            if (previewFile?.url && previewFile.url.startsWith('blob:')) {
                URL.revokeObjectURL(previewFile.url);
            }
            
            onSuccess();
            onClose();
        } 
        else if (response && response.message && response.message.includes('sudah memiliki kompetensi ini')) {
            // DUPLIKAT DATA - TAMPILKAN NOTIFIKASI TANPA ERROR DI CONSOLE
            Swal.fire({
                icon: 'warning',
                title: 'Duplikasi Data',
                text: response.message || 'User sudah memiliki kompetensi ini',
                confirmButtonText: 'OK'
            });
        }
        else {
            // ERROR LAINNYA
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan Data',
                text: response?.message || 'Terjadi kesalahan saat menyimpan data',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        // Error yang tidak tertangkap (seharusnya tidak terjadi karena kita sudah handle di atas)
        Swal.fire({
            icon: 'error',
            title: 'Gagal Menyimpan Data',
            text: error.message || 'Terjadi kesalahan saat menyimpan data',
            confirmButtonText: 'OK'
        });
    } finally {
        setLoading(false);
    }
};

    const handleClose = () => {
        if (previewFile?.url && previewFile.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewFile.url);
        }
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingData ? 'Edit Kompetensi Pegawai' : 'Tambah Kompetensi Pegawai'}
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Debug Info */}
                

               

                <form onSubmit={handleSubmit} className="p-6 space-y-4" encType="multipart/form-data">
                    {/* Hidden field untuk id_user */}
                    <input type="hidden" name="id_user" value={formData.id_user} />

                    {/* Pilih Kompetensi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kompetensi <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="id_kompetensi"
                            value={formData.id_kompetensi}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.id_kompetensi ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        >
                            <option value="">Pilih Kompetensi</option>
                            {options.kompetensi?.map(kom => (
                                <option key={kom.id} value={kom.id}>
                                    {kom.kode_kompetensi} - {kom.nama_kompetensi} ({kom.nama_fungsi || '-'})
                                </option>
                            ))}
                        </select>
                        {errors.id_kompetensi && (
                            <p className="mt-1 text-sm text-red-600">{errors.id_kompetensi}</p>
                        )}
                    </div>

                    {/* Tanggal Dipenuhi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Dipenuhi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="tanggal_dipenuhi"
                            value={formData.tanggal_dipenuhi}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.tanggal_dipenuhi ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        />
                        {errors.tanggal_dipenuhi && (
                            <p className="mt-1 text-sm text-red-600">{errors.tanggal_dipenuhi}</p>
                        )}
                    </div>

                    {/* Nilai */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nilai (0-100)
                        </label>
                        <input
                            type="number"
                            name="nilai"
                            value={formData.nilai}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: 85.50"
                            disabled={loading}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {options.status_options?.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Upload File */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Sertifikat/Bukti
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Format: PDF, JPG, PNG. Maksimal 2MB
                        </p>
                        
                        {previewFile && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                                File: {previewFile.name}
                            </div>
                        )}
                        
                        {editingData && editingData.bukti && !selectedFile && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                                File saat ini: {editingData.bukti}
                            </div>
                        )}
                    </div>

                    {/* Tombol Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !currentUser}
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

export default UserskompetensiForm;