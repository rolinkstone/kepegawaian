// components/userskompetensi/FilterSection.js
import React from 'react';

const FilterSection = ({ filters, onFilterChange, onReset, options, userRoles }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Filter</h3>
                <button
                    onClick={onReset}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                    Reset Filter
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pencarian
                    </label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        placeholder="Cari nama, NIP, kompetensi..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filter Status - untuk semua user */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Status</option>
                        {options.status_options?.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Pegawai - HANYA UNTUK ADMIN */}
                {userRoles.isAdmin && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pegawai
                        </label>
                        <select
                            value={filters.id_user}
                            onChange={(e) => onFilterChange('id_user', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Pegawai</option>
                            {options.users?.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.nama} - {user.nip}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Filter Kompetensi - untuk semua user */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kompetensi
                    </label>
                    <select
                        value={filters.id_kompetensi}
                        onChange={(e) => onFilterChange('id_kompetensi', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Kompetensi</option>
                        {options.kompetensi?.map(kom => (
                            <option key={kom.id} value={kom.id}>
                                {kom.kode_kompetensi} - {kom.nama_kompetensi}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Info jumlah data berdasarkan role */}
            <div className="mt-4 text-sm text-gray-600">
                {userRoles.isAdmin ? (
                    <span>🔓 Admin: Melihat semua data pegawai</span>
                ) : userRoles.isKatim ? (
                    <span>👥 Katim: Melihat data pegawai di fungsi Anda</span>
                ) : (
                    <span>👤 User: Hanya melihat data Anda sendiri</span>
                )}
            </div>
        </div>
    );
};

export default FilterSection;