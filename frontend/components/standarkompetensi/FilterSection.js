// components/standarkompetensi/FilterSection.js
import React, { useState, useEffect } from 'react';
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
  Divider,
  Typography,
  Card
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  DownOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const FilterSection = ({
  filters,
  setFilters,
  uniqueJabatan = [],
  uniqueJenjang = [],
  uniqueFungsi = [],
  uniquePeran = [],
  uniqueTingkat = [],
  onReset,
  totalData,
  filteredCount
}) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  const [expanded, setExpanded] = useState(false);

  // Sync search text with filters
  useEffect(() => {
    setSearchText(filters.search || '');
  }, [filters.search]);

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
  const tingkatOptions = uniqueTingkat.length > 0 ? uniqueTingkat : [
    { value: 'all', label: 'Semua Tingkat' },
    { value: '1', label: 'Ahli Pertama (Level 1)' },
    { value: '2', label: 'Ahli Muda (Level 2)' },
    { value: '3', label: 'Ahli Madya (Level 3)' },
    { value: '0', label: 'Universal (Level 0)' }
  ];

  // Debug props
  console.log('FilterSection Props:', {
    uniqueJabatan,
    uniqueJenjang,
    uniqueFungsi,
    uniquePeran,
    filters
  });

  return (
    <Card 
      bordered={false}
      style={{ 
        marginBottom: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)'
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {/* Main Filter Row */}
      <Row gutter={[16, 16]} align="middle">
        {/* Search */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input.Search
            placeholder="Cari kode/nama/deskripsi kompetensi..."
            allowClear
            enterButton={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%' }}
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
            notFoundContent="Tidak ada data jabatan"
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
            notFoundContent="Tidak ada data jenjang"
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
              style={{ borderRadius: 6 }}
            >
              Cari
            </Button>
            
            <Tooltip title="Reset Filter">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                style={{ borderRadius: 6 }}
              >
                Reset
              </Button>
            </Tooltip>

            <Button
              type="text"
              icon={<DownOutlined rotate={expanded ? 180 : 0} />}
              onClick={() => setExpanded(!expanded)}
              style={{ borderRadius: 6 }}
            >
              {expanded ? 'Sembunyikan' : 'Lanjutan'}
            </Button>

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

      {/* Advanced Filters */}
      {expanded && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          
          <Row gutter={[16, 16]}>
            {/* Filter Fungsi */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter Fungsi"
                allowClear
                style={{ width: '100%' }}
                value={filters.fungsi || undefined}
                onChange={(value) => setFilters({ ...filters, fungsi: value, peran: '' })}
                showSearch
                optionFilterProp="children"
                notFoundContent="Tidak ada data fungsi"
              >
                {uniqueFungsi.map(fungsi => (
                  <Option key={fungsi} value={fungsi}>{fungsi}</Option>
                ))}
              </Select>
            </Col>

            {/* Filter Peran */}
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
                notFoundContent="Pilih fungsi terlebih dahulu"
              >
                {uniquePeran
                  .filter(peran => !filters.fungsi || peran.includes(filters.fungsi))
                  .map(peran => (
                    <Option key={peran} value={peran}>{peran}</Option>
                  ))}
              </Select>
            </Col>

            {/* Info Total Data */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Total Data
                </Text>
                <Space>
                  <Badge 
                    count={totalData} 
                    style={{ backgroundColor: '#1890ff' }} 
                    showZero 
                  />
                  <Text strong>data tersedia</Text>
                </Space>
              </Space>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hasil Filter
                </Text>
                <Space>
                  <Badge 
                    count={filteredCount} 
                    style={{ backgroundColor: '#52c41a' }} 
                    showZero 
                  />
                  <Text strong>data ditampilkan</Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </>
      )}

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div style={{ marginTop: 16 }}>
          <Divider orientation="left" style={{ margin: '12px 0' }}>
            <Space>
              <FilterOutlined />
              <Text strong>Filter Aktif</Text>
              <Button 
                type="link" 
                icon={<CloseCircleOutlined />} 
                onClick={handleReset}
                size="small"
                style={{ padding: '4px 8px' }}
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
                style={{ 
                  borderRadius: 12, 
                  padding: '4px 12px',
                  backgroundColor: '#e6f7ff',
                  borderColor: '#91d5ff',
                  color: '#0050b3'
                }}
              >
                <SearchOutlined /> Pencarian: {filters.search}
              </Tag>
            )}
            
            {filters.jabatan && (
              <Tag 
                closable 
                color="orange"
                onClose={() => setFilters({ ...filters, jabatan: '' })}
                style={{ borderRadius: 12, padding: '4px 12px' }}
              >
                Jabatan: {filters.jabatan}
              </Tag>
            )}
            
            {filters.jenjang && (
              <Tag 
                closable 
                color="purple"
                onClose={() => setFilters({ ...filters, jenjang: '' })}
                style={{ borderRadius: 12, padding: '4px 12px' }}
              >
                Jenjang: {filters.jenjang}
              </Tag>
            )}
            
            {filters.fungsi && (
              <Tag 
                closable 
                color="blue"
                onClose={() => setFilters({ ...filters, fungsi: '', peran: '' })}
                style={{ borderRadius: 12, padding: '4px 12px' }}
              >
                Fungsi: {filters.fungsi}
              </Tag>
            )}
            
            {filters.peran && (
              <Tag 
                closable 
                color="green"
                onClose={() => setFilters({ ...filters, peran: '' })}
                style={{ borderRadius: 12, padding: '4px 12px' }}
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
                style={{ borderRadius: 12, padding: '4px 12px' }}
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
    </Card>
  );
};

export default FilterSection;