// components/perencanaan/PerencanaanContainer.js
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FaUpload, FaFilePdf, FaEye, FaDownload, FaTrash, FaSpinner, FaSearch } from 'react-icons/fa';

const UPLOAD_ROLES = ['admin', 'katim', 'kabag_tu'];

const PerencanaanContainer = ({ session, status }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const token = session?.accessToken || localStorage.getItem('token');

  // Cek apakah user punya akses upload (admin, katim, kabag_tu)
  const canUpload = useCallback(() => {
    if (!session?.user) return false;
    const roles = session.user.roles || (session.user.role ? [session.user.role] : []);
    return roles.some(r => UPLOAD_ROLES.includes(String(r).toLowerCase()));
  }, [session]);

  // Ambil daftar dokumen
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/perencanaan`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP Error ${response.status}`);
      }

      const result = await response.json();
      setDocuments(result.data || []);
    } catch (error) {
      console.error('❌ Error fetching perencanaan:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: error.message || 'Terjadi kesalahan saat memuat daftar perencanaan'
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments();
    }
  }, [status, fetchDocuments]);

  // Format ukuran file
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();

    const form = e.target;
    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'File Belum Dipilih',
        text: 'Silakan pilih file PDF terlebih dahulu'
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: 'File Tidak Valid',
        text: 'Hanya file PDF yang diperbolehkan'
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Terlalu Besar',
        text: 'Ukuran file maksimal 20MB'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const namaFileInput = form.querySelector('input[name="nama_file"]');
      const namaFile = namaFileInput ? namaFileInput.value.trim() : '';
      if (namaFile) {
        formData.append('nama_file', namaFile);
      }

      const response = await fetch(`${baseUrl}/perencanaan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `HTTP Error ${response.status}`);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: result.message || 'Dokumen perencanaan berhasil diunggah'
      });

      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('❌ Error uploading:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah',
        text: error.message || 'Terjadi kesalahan saat mengunggah dokumen'
      });
    } finally {
      setUploading(false);
    }
  };

  // Buka file untuk di-view (fetch blob + iframe)
  const handleView = async (doc) => {
    if (!doc || !doc.file_name) return;
    setViewLoading(true);
    try {
      const response = await fetch(`${baseUrl}/perencanaan/file/${doc.file_name}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setViewingDoc({ ...doc, blobUrl: url });
    } catch (error) {
      console.error('❌ Error viewing file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuka File',
        text: error.message || 'Terjadi kesalahan saat membuka file'
      });
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    if (viewingDoc?.blobUrl) {
      window.URL.revokeObjectURL(viewingDoc.blobUrl);
    }
    setViewingDoc(null);
  };

  // Download file
  const handleDownload = async (doc) => {
    if (!doc || !doc.file_name) return;
    try {
      const response = await fetch(`${baseUrl}/perencanaan/file/${doc.file_name}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nama_file || doc.file_name;
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

  // Hapus dokumen
  const handleDelete = async (doc) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Dokumen?',
      text: `Anda yakin ingin menghapus "${doc.nama_file}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`${baseUrl}/perencanaan/${doc.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `HTTP Error ${response.status}`);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: result.message || 'Dokumen berhasil dihapus'
      });

      fetchDocuments();
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: error.message || 'Terjadi kesalahan saat menghapus dokumen'
      });
    }
  };

  // Filter pencarian
  const filteredDocuments = documents.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      (doc.nama_file || '').toLowerCase().includes(term) ||
      (doc.uploaded_by_name || '').toLowerCase().includes(term) ||
      (doc.uploaded_by || '').toLowerCase().includes(term)
    );
  });

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Perencanaan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dokumen perencanaan Pengembangan Kompetensi.
          </p>
        </div>
        {canUpload() && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="
              flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
              bg-gradient-to-r from-emerald-600 to-teal-600 text-white
              hover:from-emerald-700 hover:to-teal-700
              transition-all duration-200 shadow-lg
            "
          >
            <FaUpload />
            <span className="font-medium">Upload Dokumen</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2 max-w-md">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama file atau pengunggah..."
          className="w-full py-2 outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama File</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ukuran</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diunggah Oleh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIP</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Upload</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <FaSpinner className="animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    {searchTerm ? 'Tidak ada dokumen yang cocok dengan pencarian' : 'Belum ada dokumen perencanaan'}
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleView(doc)}
                        className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline text-left"
                        title="Klik untuk melihat"
                      >
                        <FaFilePdf className="text-red-500 flex-shrink-0" />
                        <span className="truncate max-w-xs">{doc.nama_file}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.ukuran_file)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.uploaded_by_name || doc.uploaded_by}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.nip || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(doc)}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          title="Lihat"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Download"
                        >
                          <FaDownload />
                        </button>
                        {canUpload() && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Hapus"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Upload Dokumen Perencanaan</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul / Nama Dokumen <span className="text-gray-400">(opsional, default = nama file)</span>
                </label>
                <input
                  type="text"
                  name="nama_file"
                  placeholder="Contoh: Rencana Kerja Tahunan 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File PDF <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">Hanya file PDF, maksimal 20MB</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="
                    flex items-center gap-2 px-5 py-2 rounded-lg
                    bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                    hover:from-emerald-700 hover:to-teal-700
                    transition-all duration-200 shadow
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lihat File */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2 min-w-0">
                <FaFilePdf className="text-red-500 flex-shrink-0" />
                <h2 className="text-lg font-bold text-gray-800 truncate">{viewingDoc.nama_file}</h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(viewingDoc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm"
                >
                  <FaDownload />
                  <span>Download</span>
                </button>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[70vh] bg-gray-100">
              {viewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <FaSpinner className="animate-spin" />
                    <span>Membuka file...</span>
                  </div>
                </div>
              ) : (
                <iframe
                  src={viewingDoc.blobUrl}
                  title={viewingDoc.nama_file}
                  className="w-full h-full"
                  style={{ minHeight: '70vh' }}
                />
              )}
            </div>
            <div className="px-4 py-2 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-500">
              <span>Diunggah oleh {viewingDoc.uploaded_by_name || viewingDoc.uploaded_by} pada {formatDate(viewingDoc.created_at)}</span>
              <span>{formatFileSize(viewingDoc.ukuran_file)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerencanaanContainer;
