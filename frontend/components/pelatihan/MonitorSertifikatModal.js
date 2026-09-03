// components/pelatihan/MonitorSertifikatModal.js
// Modal pemantauan peserta SUDAH/BELUM upload sertifikat ke Riwayat Pelatihan (user_kompetensi)
// untuk SATU jadwal pelatihan, dipantau PER KOMPETENSI terkait pelatihan (pelatihan_kompetensi).
// Jika pelatihan punya >1 kompetensi, masing-masing kompetensi dicek sendiri.
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { fetchMonitorSertifikat } from './api/pelatihanApi';

const MonitorSertifikatModal = ({ show, onClose, jadwal, session }) => {
    const [monitor, setMonitor] = useState(null);
    const [loading, setLoading] = useState(false);

    const getToken = () => {
        return session?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    };

    const handleViewFile = async (bukti) => {
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const fileUrl = `${baseUrl}/uploads/${bukti}`;
        try {
            const response = await fetch(fileUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Gagal membuka file (status ' + response.status + ')');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Membuka File',
                text: error.message || 'Terjadi kesalahan saat membuka file'
            });
        }
    };

    const fetchData = useCallback(async () => {
        if (!show || !jadwal?.id || !session) return;
        setLoading(true);
        try {
            const result = await fetchMonitorSertifikat(session, {
                status: jadwal.status || 'Selesai',
                jadwal_id: jadwal.id
            });
            if (result.success) {
                const list = result.data?.jadwal || [];
                setMonitor(list.length > 0 ? list[0] : null);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Memuat Data',
                    text: result.message || 'Terjadi kesalahan saat memuat monitoring sertifikat'
                });
            }
        } catch (error) {
            console.error('Error memuat monitoring:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Terjadi kesalahan saat memuat monitoring sertifikat'
            });
        } finally {
            setLoading(false);
        }
    }, [show, jadwal, session]);

    useEffect(() => {
        if (show) {
            setMonitor(null);
            fetchData();
        }
    }, [show, fetchData]);

    if (!show) return null;

    const peserta = monitor?.peserta || [];
    const totalKompetensi = peserta.reduce((s, p) => s + (p.jumlah_kompetensi || 0), 0);
    const sudahKompetensi = peserta.reduce((s, p) => s + (p.sudah_kompetensi || 0), 0);
    const belumKompetensi = totalKompetensi - sudahKompetensi;
    const pesertaLengkap = peserta.filter(p => p.sudah_upload).length;
    const pesertaBelum = peserta.length - pesertaLengkap;

    const formatTanggal = (t) => {
        if (!t) return '-';
        return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const statusBadge = (p) => {
        if (p.jumlah_kompetensi === 0) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Tanpa Kompetensi</span>;
        }
        if (p.sudah_upload) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Lengkap ({p.sudah_kompetensi}/{p.jumlah_kompetensi})</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Belum Lengkap ({p.sudah_kompetensi}/{p.jumlah_kompetensi})</span>;
    };

    const verifBadge = (verif) => {
        if (!verif) return null;
        const map = {
            'Valid': 'bg-green-100 text-green-700',
            'Tidak Valid': 'bg-red-100 text-red-700',
            'Perlu Revisi': 'bg-yellow-100 text-yellow-700'
        };
        return <span className={`px-2 py-0.5 text-xs rounded-full ${map[verif] || 'bg-gray-100 text-gray-700'}`}>Verif: {verif}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Pantau Sertifikat Peserta</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {monitor?.kode_pelatihan ? (
                                <>
                                    <span className="font-medium text-gray-700">{monitor.nama_pelatihan}</span>
                                    {' '}({monitor.kode_pelatihan}) • {formatTanggal(monitor.tanggal_mulai)} s/d {formatTanggal(monitor.tanggal_selesai)}
                                </>
                            ) : (
                                jadwal?.nama_pelatihan || ''
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Info */}
                    <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <p>
                            Peserta dengan undangan <b>Diterima</b>. Status dihitung <b>per kompetensi</b> yang terkait
                            pelatihan ini: peserta dianggap sudah upload bila memiliki catatan di Riwayat Pelatihan
                            (<i>user_kompetensi</i>) berisi file sertifikat untuk kompetensi tsb.
                            Peserta <b>"Lengkap"</b> = sudah upload sertifikat untuk <b>semua</b> kompetensi terkait.
                        </p>
                    </div>

                    {/* Kompetensi terkait */}
                    {monitor?.kompetensi_pelatihan?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1 items-center">
                            <span className="text-xs text-gray-500 mr-1">Kompetensi terkait:</span>
                            {monitor.kompetensi_pelatihan.map((k, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                    {k.kode} - {k.nama}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Ringkasan */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div className="bg-white border rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-500">Total Peserta (Diterima)</p>
                            <p className="text-2xl font-bold text-gray-800">{peserta.length}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                            <p className="text-sm text-blue-600">Upload Kompetensi</p>
                            <p className="text-2xl font-bold text-blue-700">{sudahKompetensi}<span className="text-base text-blue-400">/{totalKompetensi}</span></p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                            <p className="text-sm text-green-600">Peserta Lengkap</p>
                            <p className="text-2xl font-bold text-green-700">{pesertaLengkap}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                            <p className="text-sm text-orange-600">Peserta Belum Lengkap</p>
                            <p className="text-2xl font-bold text-orange-700">{pesertaBelum}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : peserta.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-3xl mb-2">📭</p>
                            <p className="font-medium">Belum ada peserta (undangan Diterima) pada jadwal ini</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peserta</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kehadiran</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sertifikat per Kompetensi</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {peserta.map((p, i) => (
                                        <tr key={p.peserta_id} className="hover:bg-gray-50 align-top">
                                            <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{p.user_nama}</p>
                                                <p className="text-xs text-gray-500">{p.user_nip}</p>
                                                <p className="text-xs text-gray-400">
                                                    {p.nama_fungsi || '-'}{p.nama_jabatan ? ` • ${p.nama_jabatan}` : ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{p.status_kehadiran || '-'}</td>
                                            <td className="px-4 py-3">
                                                {p.kompetensi && p.kompetensi.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {p.kompetensi.map((k, j) => (
                                                            <div key={j} className="flex items-center gap-2 flex-wrap">
                                                                {k.sudah ? (
                                                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </span>
                                                                )}
                                                                <span className={`text-sm ${k.sudah ? 'text-gray-800' : 'text-gray-500'}`}>
                                                                    {k.kode} - {k.nama}
                                                                </span>
                                                                {k.sudah && k.sertifikat ? (
                                                                    <>
                                                                        {verifBadge(k.sertifikat.hasil_verif)}
                                                                        <button
                                                                            onClick={() => handleViewFile(k.sertifikat.bukti)}
                                                                            className="text-xs text-blue-600 underline hover:text-blue-800"
                                                                        >
                                                                            Lihat
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-red-500">Belum upload</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Pelatihan tanpa kompetensi terkait</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{statusBadge(p)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonitorSertifikatModal;
