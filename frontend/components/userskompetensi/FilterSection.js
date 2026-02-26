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

                {/* Filter Status */}
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

                {/* Filter Pegawai */}
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

                {/* Filter Kompetensi */}
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

            {/* Filter khusus untuk Admin/Katim */}
            {(userRoles.isAdmin || userRoles.isKatim) && (
                <div className="mt-4 flex items-center">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={filters.all}
                            onChange={(e) => onFilterChange('all', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                            Tampilkan semua data (termasuk lintas fungsi)
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default FilterSection;