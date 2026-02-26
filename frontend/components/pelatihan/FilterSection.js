// components/pelatihan/FilterSection.js
import React from 'react';

const FilterSection = ({ filters, onFilterChange, onReset, options, showMasterFilter = false }) => {
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
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        placeholder="Cari nama pelatihan, lokasi..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filter Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Status</option>
                        {options.status_options?.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Pelatihan (untuk master) */}
                {showMasterFilter && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Pelatihan
                        </label>
                        <select
                            value={filters.jenis_pelatihan || ''}
                            onChange={(e) => onFilterChange('jenis_pelatihan', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Jenis</option>
                            <option value="Teknis">Teknis</option>
                            <option value="Manajerial">Manajerial</option>
                            <option value="Sertifikasi">Sertifikasi</option>
                            <option value="Umum">Umum</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterSection;