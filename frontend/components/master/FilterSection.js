// components/master/FilterSection.js
import React, { useState } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;

const FilterSection = ({
  filters,
  setFilters,
  uniqueJabatan = [],
  uniqueJenjang = [],
  uniqueFungsi = [],
  uniquePeran = [],
  onReset,
  totalData,
  filteredCount
}) => {
  const [searchText, setSearchText] = useState(filters.search || '');

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchText });
  };

  // Handle reset
  const handleReset = () => {
    setSearchText('');
    onReset();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.jabatan) count++;
    if (filters.jenjang) count++;
    if (filters.fungsi) count++;
    if (filters.peran) count++;
    if (filters.tingkat && filters.tingkat !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Tingkat options
  const tingkatOptions = [
    { value: 'all', label: 'Semua Tingkat' },
    { value: '1', label: 'Ahli Pertama (Level 1)' },
    { value: '2', label: 'Ahli Muda (Level 2)' },
    { value: '3', label: 'Ahli Madya (Level 3)' },
    { value: '0', label: 'Universal (Level 0)' }
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        {/* Search */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input.Search
            placeholder="Cari kode/nama kompetensi..."
            allowClear
            enterButton={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </Col>

        {/* Filter Jabatan */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            placeholder="Filter Jabatan"
            allowClear
            style={{ width: '100%' }}
            value={filters.jabatan || undefined}
            onChange={(value) => setFilters({ ...filters, jabatan: value })}
            showSearch
            optionFilterProp="children"
          >
            {uniqueJabatan.map(jabatan => (
              <Option key={jabatan} value={jabatan}>{jabatan}</Option>
            ))}
          </Select>
        </Col>

        {/* Filter Jenjang */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            placeholder="Filter Jenjang"
            allowClear
            style={{ width: '100%' }}
            value={filters.jenjang || undefined}
            onChange={(value) => setFilters({ ...filters, jenjang: value })}
            showSearch
            optionFilterProp="children"
          >
            {uniqueJenjang.map(jenjang => (
              <Option key={jenjang} value={jenjang}>{jenjang}</Option>
            ))}
          </Select>
        </Col>

        {/* Filter Tingkat */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            placeholder="Filter Tingkat"
            style={{ width: '100%' }}
            value={filters.tingkat}
            onChange={(value) => setFilters({ ...filters, tingkat: value })}
          >
            {tingkatOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        {/* Action Buttons */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Cari
            </Button>
            
            <Tooltip title="Reset Filter">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Tooltip>

            {activeFilterCount > 0 && (
              <Badge count={activeFilterCount}>
                <Tag color="blue" style={{ marginRight: 0 }}>
                  Filter Aktif
                </Tag>
              </Badge>
            )}
          </Space>
        </Col>
      </Row>

      {/* Additional Filters Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="Filter Fungsi"
            allowClear
            style={{ width: '100%' }}
            value={filters.fungsi || undefined}
            onChange={(value) => setFilters({ ...filters, fungsi: value })}
            showSearch
            optionFilterProp="children"
          >
            {uniqueFungsi.map(fungsi => (
              <Option key={fungsi} value={fungsi}>{fungsi}</Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="Filter Peran"
            allowClear
            style={{ width: '100%' }}
            value={filters.peran || undefined}
            onChange={(value) => setFilters({ ...filters, peran: value })}
            showSearch
            optionFilterProp="children"
            disabled={!filters.fungsi}
          >
            {uniquePeran
              .filter(peran => !filters.fungsi || peran.includes(filters.fungsi))
              .map(peran => (
                <Option key={peran} value={peran}>{peran}</Option>
              ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Space>
            <span style={{ color: '#999' }}>
              Menampilkan {filteredCount} dari {totalData} data
            </span>
          </Space>
        </Col>
      </Row>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div style={{ marginTop: 16 }}>
          <Divider orientation="left" style={{ margin: '12px 0' }}>
            <Space>
              <FilterOutlined />
              Filter Aktif
              <Button 
                type="link" 
                icon={<CloseCircleOutlined />} 
                onClick={handleReset}
                size="small"
              >
                Hapus Semua
              </Button>
            </Space>
          </Divider>
          
          <Space size={[8, 8]} wrap>
            {filters.search && (
              <Tag 
                closable 
                onClose={() => {
                  setFilters({ ...filters, search: '' });
                  setSearchText('');
                }}
              >
                Pencarian: {filters.search}
              </Tag>
            )}
            
            {filters.jabatan && (
              <Tag 
                closable 
                color="orange"
                onClose={() => setFilters({ ...filters, jabatan: '' })}
              >
                Jabatan: {filters.jabatan}
              </Tag>
            )}
            
            {filters.jenjang && (
              <Tag 
                closable 
                color="purple"
                onClose={() => setFilters({ ...filters, jenjang: '' })}
              >
                Jenjang: {filters.jenjang}
              </Tag>
            )}
            
            {filters.fungsi && (
              <Tag 
                closable 
                color="blue"
                onClose={() => setFilters({ ...filters, fungsi: '', peran: '' })}
              >
                Fungsi: {filters.fungsi}
              </Tag>
            )}
            
            {filters.peran && (
              <Tag 
                closable 
                color="green"
                onClose={() => setFilters({ ...filters, peran: '' })}
              >
                Peran: {filters.peran}
              </Tag>
            )}
            
            {filters.tingkat && filters.tingkat !== 'all' && (
              <Tag 
                closable 
                color={
                  filters.tingkat === '1' ? 'success' :
                  filters.tingkat === '2' ? 'processing' :
                  filters.tingkat === '3' ? 'warning' : 'default'
                }
                onClose={() => setFilters({ ...filters, tingkat: 'all' })}
              >
                Tingkat: {
                  filters.tingkat === '1' ? 'Ahli Pertama' :
                  filters.tingkat === '2' ? 'Ahli Muda' :
                  filters.tingkat === '3' ? 'Ahli Madya' : 'Universal'
                }
              </Tag>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default FilterSection;