// components/userskompetensi/modals/ViewSertifikatModal.js
import React from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';

const ViewSertifikatModal = ({ show, onClose, data }) => {
    const { data: session } = useSession();
    
    if (!show || !data || !data.bukti) return null;

    // PERBAIKI: baseUrl sudah termasuk /api, jadi jangan tambah /api lagi
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    
    // HAPUS /api dari sini karena sudah termasuk di baseUrl
    const fileUrl = `${baseUrl}/uploads/${data.bukti}`;
    
    console.log('📁 Base URL:', baseUrl);
    console.log('📁 File URL:', fileUrl);
    console.log('📁 Session token:', session?.accessToken ? 'Ada' : 'Tidak ada');

    const handleDownload = async () => {
        try {
            console.log('📥 Mencoba download file:', fileUrl);
            
            const response = await fetch(fileUrl, {
                headers: {
                    'Authorization': `Bearer ${session?.accessToken}`
                }
            });
            
            console.log('📥 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                let errorMessage = 'Gagal download file';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch (e) {
                    if (errorText) errorMessage = errorText;
                }
                
                throw new Error(errorMessage);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.bukti;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('❌ Error downloading file:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal Download',
                text: error.message || 'Terjadi kesalahan saat mendownload file'
            });
        }
    };

    const handleView = async () => {
        try {
            console.log('📥 Mencoba view file:', fileUrl);
            
            const response = await fetch(fileUrl, {
                headers: {
                    'Authorization': `Bearer ${session?.accessToken}`
                }
            });
            
            console.log('📥 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                let errorMessage = 'Gagal membuka file';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch (e) {
                    if (errorText) errorMessage = errorText;
                }
                
                throw new Error(errorMessage);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
        } catch (error) {
            console.error('❌ Error viewing file:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal Membuka File',
                text: error.message || 'Terjadi kesalahan saat membuka file'
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        Sertifikat/Bukti - {data.user_nama}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Kompetensi:</span> {data.nama_kompetensi} ({data.kode_kompetensi})
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Nama File:</span> {data.bukti}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">URL:</span> {fileUrl}
                        </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            
                            <p className="text-gray-600">
                                File hanya bisa diakses dengan autentikasi
                            </p>
                            
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleView}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Lihat File
                                </button>
                                
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSertifikatModal;