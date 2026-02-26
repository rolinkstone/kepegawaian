import React, { useState } from 'react';

const DeleteModal = ({ show, onClose, data, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    if (!show || !data) return null;

    const handleDelete = async () => {
        setLoading(true);
        await onConfirm(data.id);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Hapus Data</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-center mb-4 text-red-600">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    
                    <p className="text-center text-gray-700 mb-2">
                        Apakah Anda yakin ingin menghapus data berikut?
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Pegawai:</span> {data.user_nama} ({data.user_nip})
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Kompetensi:</span> {data.nama_kompetensi}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span> {data.status}
                        </p>
                    </div>
                    
                    <p className="text-center text-sm text-red-600 mb-4">
                        Data yang dihapus tidak dapat dikembalikan!
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;