// components/userskompetensi/UserskompetensiForm.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createUserKompetensi, updateUserKompetensi } from './api/userKompetensiApi';

const UserskompetensiForm = ({ show, onClose, onSuccess, editingData, options, userRoles, session, preselectUserId }) => {
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
    
    // Filter untuk pegawai
    const [searchUserTerm, setSearchUserTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    
    // Filter untuk kompetensi
    const [searchKompetensiTerm, setSearchKompetensiTerm] = useState('');
    const [filteredKompetensi, setFilteredKompetensi] = useState([]);
    const [showKompetensiDropdown, setShowKompetensiDropdown] = useState(false);

    const isAdmin = userRoles?.isAdmin || false;

    // Helper untuk normalisasi NIP (hapus spasi)
    const normalizeNip = (nip) => String(nip || '').replace(/\s/g, '');

    // Dapatkan data user saat ini dari session (untuk non-admin)
    useEffect(() => {
        if (!isAdmin && options.users) {
            let foundUser = null;
            
            // Prioritas 1: pakai preselectUserId dari parent (paling akurat)
            if (preselectUserId) {
                foundUser = options.users.find(u => u.id?.toString() === preselectUserId.toString());
                console.log('🔍 Mencari user dari preselectUserId:', preselectUserId, foundUser ? `✅ ${foundUser.nama}` : '❌ tidak ditemukan');
            }
            
            // Prioritas 2: cari dari session
            if (!foundUser && session?.user) {
                const userNip = session.user.nip ||
                               session.user.username || 
                               session.user.email || 
                               session.user.nip_raw;
                console.log('🔍 Mencari user dengan NIP:', userNip);
                // Normalisasi NIP (hapus spasi) sebelum dibandingkan
                const cleanNip = normalizeNip(userNip);
                foundUser = options.users.find(u => normalizeNip(u.nip) === cleanNip);
                if (!foundUser && cleanNip) {
                    foundUser = options.users.find(u => 
                        normalizeNip(u.nip).includes(cleanNip) || 
                        cleanNip.includes(normalizeNip(u.nip))
                    );
                }
            }
            
            // Prioritas 3: cari dari session user name
            if (!foundUser && session?.user?.name && options.users.length > 0) {
                const userName = session.user.name.toLowerCase().trim();
                foundUser = options.users.find(u => 
                    u.nama?.toLowerCase().includes(userName) || 
                    userName.includes(u.nama?.toLowerCase())
                );
                if (foundUser) {
                    console.log('🔍 User ditemukan dari nama:', foundUser.nama);
                }
            }
            
            if (foundUser) {
                setCurrentUser(foundUser);
                console.log('✅ Current user ditemukan:', foundUser);
            } else if (options.users.length > 0) {
                setCurrentUser(options.users[0]);
                console.log('⚠️ Fallback ke user pertama:', options.users[0]);
            }
        }
    }, [session, options.users, isAdmin, preselectUserId]);

    // Filter users untuk dropdown (khusus admin)
    useEffect(() => {
        if (isAdmin && options.users && searchUserTerm) {
            const filtered = options.users.filter(user => 
                user.nama?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
                user.nip?.toLowerCase().includes(searchUserTerm.toLowerCase())
            );
            setFilteredUsers(filtered.slice(0, 10));
        } else if (isAdmin && options.users) {
            setFilteredUsers(options.users.slice(0, 10));
        }
    }, [searchUserTerm, options.users, isAdmin]);

    // Filter kompetensi untuk dropdown (untuk semua user)
    useEffect(() => {
        if (options.kompetensi && searchKompetensiTerm) {
            const filtered = options.kompetensi.filter(kom => 
                kom.nama_kompetensi?.toLowerCase().includes(searchKompetensiTerm.toLowerCase()) ||
                kom.kode_kompetensi?.toLowerCase().includes(searchKompetensiTerm.toLowerCase()) ||
                kom.nama_fungsi?.toLowerCase().includes(searchKompetensiTerm.toLowerCase()) ||
                kom.deskripsi?.toLowerCase().includes(searchKompetensiTerm.toLowerCase())
            );
            setFilteredKompetensi(filtered.slice(0, 20));
        } else if (options.kompetensi) {
            setFilteredKompetensi(options.kompetensi.slice(0, 20));
        }
    }, [searchKompetensiTerm, options.kompetensi]);

    // Set id_user otomatis untuk non-admin
    useEffect(() => {
        if (!isAdmin && !editingData && show && currentUser) {
            setFormData(prev => ({
                ...prev,
                id_user: currentUser.id?.toString() || ''
            }));
        }
    }, [isAdmin, editingData, currentUser, show]);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (show) {
            console.log('📋 Form ditampilkan, editingData:', editingData);
            
            if (editingData) {
                setFormData({
                    id_user: editingData.id_user?.toString() || '',
                    id_kompetensi: editingData.id_kompetensi?.toString() || '',
                    tanggal_dipenuhi: editingData.tanggal_dipenuhi || '',
                    nilai: editingData.nilai?.toString() || '',
                    status: editingData.status || 'Dalam Proses',
                    bukti: editingData.bukti || null
                });
                
                // Set search term untuk kompetensi yang dipilih
                const selectedKom = options.kompetensi?.find(k => k.id?.toString() === editingData.id_kompetensi?.toString());
                if (selectedKom) {
                    setSearchKompetensiTerm(`${selectedKom.kode_kompetensi} - ${selectedKom.nama_kompetensi}`);
                }
                
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
    }, [show, editingData, options.kompetensi]);

    const resetForm = () => {
        setFormData({
            id_user: !isAdmin && currentUser ? currentUser.id?.toString() || '' : '',
            id_kompetensi: '',
            tanggal_dipenuhi: '',
            nilai: '',
            status: 'Dalam Proses',
            bukti: null
        });
        setSelectedFile(null);
        setPreviewFile(null);
        setErrors({});
        setSearchUserTerm('');
        setSearchKompetensiTerm('');
        setShowUserDropdown(false);
        setShowKompetensiDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSelectUser = (user) => {
        setFormData(prev => ({ ...prev, id_user: user.id.toString() }));
        setSearchUserTerm(`${user.nama} (${user.nip})`);
        setShowUserDropdown(false);
        if (errors.id_user) {
            setErrors(prev => ({ ...prev, id_user: null }));
        }
    };

    const handleSelectKompetensi = (kompetensi) => {
        setFormData(prev => ({ ...prev, id_kompetensi: kompetensi.id.toString() }));
        setSearchKompetensiTerm(`${kompetensi.kode_kompetensi} - ${kompetensi.nama_kompetensi}`);
        setShowKompetensiDropdown(false);
        if (errors.id_kompetensi) {
            setErrors(prev => ({ ...prev, id_kompetensi: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('📁 File selected:', file.name, file.type, file.size);
            
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            const maxSize = 2 * 1024 * 1024;

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
        
        if (!formData.id_user || formData.id_user === '') {
            newErrors.id_user = 'Pegawai harus dipilih';
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

            if (response && response.success) {
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
                Swal.fire({
                    icon: 'warning',
                    title: 'Duplikasi Data',
                    text: response.message || 'User sudah memiliki kompetensi ini',
                    confirmButtonText: 'OK'
                });
            }
            else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menyimpan Data',
                    text: response?.message || 'Terjadi kesalahan saat menyimpan data',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
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

    // Dapatkan nama pegawai yang dipilih
    const selectedUserName = options.users?.find(u => u.id?.toString() === formData.id_user)?.nama || '';
    const selectedUserNip = options.users?.find(u => u.id?.toString() === formData.id_user)?.nip || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
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

                {/* Info Role */}
                <div className="px-6 pt-4">
                    {isAdmin ? (
                        <div className="bg-blue-50 text-blue-800 p-2 rounded-lg text-sm">
                            <span className="font-medium">👑 Mode Admin:</span> Anda dapat memilih pegawai yang akan ditambahkan kompetensinya
                        </div>
                    ) : (
                        <div className="bg-gray-50 text-gray-800 p-2 rounded-lg text-sm">
                            <span className="font-medium">👤 Mode User:</span> Kompetensi akan ditambahkan untuk Anda sendiri
                            {currentUser && (
                                <div className="mt-1 text-xs text-gray-600">
                                    Pegawai: {currentUser.nama} ({currentUser.nip})
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" encType="multipart/form-data">
                    
                    {/* Pilih Pegawai - KHUSUS UNTUK ADMIN */}
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pilih Pegawai <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchUserTerm || (formData.id_user ? `${selectedUserName} (${selectedUserNip})` : '')}
                                    onChange={(e) => {
                                        setSearchUserTerm(e.target.value);
                                        setShowUserDropdown(true);
                                        if (!e.target.value && !formData.id_user) {
                                            setFormData(prev => ({ ...prev, id_user: '' }));
                                        }
                                    }}
                                    onFocus={() => setShowUserDropdown(true)}
                                    placeholder="Cari pegawai berdasarkan nama atau NIP..."
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.id_user ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                
                                {showUserDropdown && filteredUsers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{user.nama}</div>
                                                <div className="text-sm text-gray-500">NIP: {user.nip} | {user.nama_fungsi || '-'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.id_user && (
                                <p className="mt-1 text-sm text-red-600">{errors.id_user}</p>
                            )}
                            {formData.id_user && selectedUserName && (
                                <p className="mt-1 text-sm text-green-600">
                                    ✓ Pegawai dipilih: {selectedUserName} ({selectedUserNip})
                                </p>
                            )}
                        </div>
                    )}

                    {/* Hidden field untuk id_user (non-admin) */}
                    {!isAdmin && (
                        <input type="hidden" name="id_user" value={formData.id_user} />
                    )}

                    {/* Pilih Kompetensi - DENGAN FILTER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kompetensi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchKompetensiTerm}
                                onChange={(e) => {
                                    setSearchKompetensiTerm(e.target.value);
                                    setShowKompetensiDropdown(true);
                                    if (!e.target.value) {
                                        setFormData(prev => ({ ...prev, id_kompetensi: '' }));
                                    }
                                }}
                                onFocus={() => setShowKompetensiDropdown(true)}
                                placeholder="Cari kompetensi berdasarkan nama, kode, atau fungsi..."
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.id_kompetensi ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading}
                            />
                            
                            {showKompetensiDropdown && filteredKompetensi.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredKompetensi.map(kom => (
                                        <div
                                            key={kom.id}
                                            onClick={() => handleSelectKompetensi(kom)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-900">
                                                {kom.kode_kompetensi} - {kom.nama_kompetensi}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Fungsi: {kom.nama_fungsi || '-'}
                                            </div>
                                            {kom.deskripsi && (
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {kom.deskripsi}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {showKompetensiDropdown && filteredKompetensi.length === 0 && searchKompetensiTerm && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                    Tidak ditemukan kompetensi dengan kata kunci "{searchKompetensiTerm}"
                                </div>
                            )}
                        </div>
                        {errors.id_kompetensi && (
                            <p className="mt-1 text-sm text-red-600">{errors.id_kompetensi}</p>
                        )}
                        {formData.id_kompetensi && (() => {
                            const selectedKom = options.kompetensi?.find(k => k.id?.toString() === formData.id_kompetensi);
                            return (
                                <div className="mt-1">
                                    <p className="text-sm text-green-600">
                                        ✓ Kompetensi dipilih: {selectedKom?.kode_kompetensi} - {selectedKom?.nama_kompetensi}
                                    </p>
                                    {selectedKom?.deskripsi && (
                                        <p className="text-xs text-gray-500 mt-0.5 ml-4 italic">
                                            {selectedKom.deskripsi}
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Tips: Ketik untuk mencari kompetensi berdasarkan nama, kode, atau fungsi
                        </p>
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
                                <span className="font-medium">File baru:</span> {previewFile.name}
                            </div>
                        )}
                        
                        {editingData && editingData.bukti && !selectedFile && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                                <span className="font-medium">File saat ini:</span> {editingData.bukti}
                            </div>
                        )}
                    </div>

                    {/* Tombol Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white py-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!isAdmin && !currentUser)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Menyimpan...
                                </div>
                            ) : (editingData ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserskompetensiForm;