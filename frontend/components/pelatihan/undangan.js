// pages/pelatihan/undangan.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import Layout from '../../components/Layout';
import { fetchUndanganPeserta, respondUndangan } from '../../components/pelatihan/api/pelatihanApi';

const UndanganPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [undangan, setUndangan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        diterima: 0,
        ditolak: 0
    });

    useEffect(() => {
        if (session) {
            fetchUndangan();
        }
    }, [session]);

    const fetchUndangan = async () => {
        setLoading(true);
        try {
            const result = await fetchUndanganPeserta(session);
            if (result.success) {
                setUndangan(result.data);
                calculateStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching undangan:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const pending = data.filter(item => item.status_undangan === 'Pending').length;
        const diterima = data.filter(item => item.status_undangan === 'Diterima').length;
        const ditolak = data.filter(item => item.status_undangan === 'Ditolak').length;
        setStats({ pending, diterima, ditolak });
    };

    const handleRespond = async (id, status) => {
        const result = await Swal.fire({
            icon: 'question',
            title: `Konfirmasi Undangan`,
            text: `Apakah Anda yakin ingin ${status === 'Diterima' ? 'menerima' : 'menolak'} undangan ini?`,
            showCancelButton: true,
            confirmButtonText: status === 'Diterima' ? 'Ya, Terima' : 'Ya, Tolak',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await respondUndangan(session, id, status);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: `Undangan berhasil ${status === 'Diterima' ? 'diterima' : 'ditolak'}`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchUndangan();
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message
                });
            }
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Diterima': 'bg-green-100 text-green-800',
            'Ditolak': 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (status === 'loading' || loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Undangan Pelatihan</h1>
                    <p className="text-gray-600">Kelola undangan pelatihan yang Anda terima</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Diterima</p>
                        <p className="text-2xl font-bold text-green-700">{stats.diterima}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Ditolak</p>
                        <p className="text-2xl font-bold text-red-700">{stats.ditolak}</p>
                    </div>
                </div>

                {/* Daftar Undangan */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelatihan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penyelenggara</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {undangan.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            Tidak ada undangan
                                        </td>
                                    </tr>
                                ) : (
                                    undangan.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{item.nama_pelatihan}</div>
                                                <div className="text-xs text-gray-500">{item.kode_pelatihan}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{new Date(item.tanggal_mulai).toLocaleDateString('id-ID')}</div>
                                                <div className="text-xs text-gray-500">s/d {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.lokasi || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.penyelenggara_nama}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status_undangan)}`}>
                                                    {item.status_undangan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {item.status_undangan === 'Pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleRespond(item.id, 'Diterima')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                        >
                                                            Terima
                                                        </button>
                                                        <button
                                                            onClick={() => handleRespond(item.id, 'Ditolak')}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </div>
                                                )}
                                                {item.status_undangan === 'Diterima' && (
                                                    <span className="text-sm text-green-600">Sudah diterima</span>
                                                )}
                                                {item.status_undangan === 'Ditolak' && (
                                                    <span className="text-sm text-red-600">Sudah ditolak</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UndanganPage;