// components/master/StandarContainer.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
  Badge,
  Row,
  Col,
  Statistic,
  Tabs,
  Dropdown,
  message
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  UserOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  ExportOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import FilterSection from './FilterSection';
import DetailModal from './modals/DetailStandarModal';
import StatistikModal from './modals/StatistikStandarModal';
import ExportModal from './modals/ExportStandarModal';

const { Title } = Typography;
const { TabPane } = Tabs;

const StandarContainer = ({ session, status }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    jabatan: '',
    jenjang: '',
    fungsi: '',
    peran: '',
    tingkat: 'all'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalState, setModalState] = useState({
    detail: { visible: false, data: null },
    statistik: { visible: false },
    export: { visible: false }
  });
  const [stats, setStats] = useState({
    total: 0,
    byJenjang: [],
    byJabatan: [],
    byFungsi: [],
    byPeran: []
  });
  const [activeTab, setActiveTab] = useState('list');

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = session?.accessToken || localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/standarkompetensi/vw-standar-kompetensi`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setFilteredData(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.data.length
        }));
        
        // Hitung statistik
        calculateStats(result.data);
        message.success(`Data berhasil dimuat (${result.data.length} kompetensi)`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Calculate statistics
  const calculateStats = (dataArray) => {
    const byJenjang = {};
    const byJabatan = {};
    const byFungsi = {};
    const byPeran = {};

    dataArray.forEach(item => {
      // By Jenjang
      if (!byJenjang[item.jenjang]) {
        byJenjang[item.jenjang] = {
          jenjang: item.jenjang,
          tingkat: item.tingkat_jenjang,
          total: 0
        };
      }
      byJenjang[item.jenjang].total++;

      // By Jabatan
      if (!byJabatan[item.jabatan]) {
        byJabatan[item.jabatan] = {
          jabatan: item.jabatan,
          total: 0
        };
      }
      byJabatan[item.jabatan].total++;

      // By Fungsi
      if (!byFungsi[item.fungsi]) {
        byFungsi[item.fungsi] = {
          fungsi: item.fungsi,
          total: 0
        };
      }
      byFungsi[item.fungsi].total++;

      // By Peran
      const peranKey = `${item.fungsi} - ${item.peran}`;
      if (!byPeran[peranKey]) {
        byPeran[peranKey] = {
          fungsi: item.fungsi,
          peran: item.peran,
          total: 0
        };
      }
      byPeran[peranKey].total++;
    });

    setStats({
      total: dataArray.length,
      byJenjang: Object.values(byJenjang).sort((a, b) => a.tingkat - b.tingkat),
      byJabatan: Object.values(byJabatan).sort((a, b) => b.total - a.total),
      byFungsi: Object.values(byFungsi).sort((a, b) => b.total - a.total),
      byPeran: Object.values(byPeran).sort((a, b) => b.total - a.total)
    });
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...data];

    // Global search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.kode_kompetensi?.toLowerCase().includes(searchLower) ||
        item.nama_kompetensi?.toLowerCase().includes(searchLower) ||
        item.jabatan?.toLowerCase().includes(searchLower) ||
        item.jenjang?.toLowerCase().includes(searchLower) ||
        item.fungsi?.toLowerCase().includes(searchLower) ||
        item.peran?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by jabatan
    if (filters.jabatan) {
      filtered = filtered.filter(item => 
        item.jabatan === filters.jabatan
      );
    }

    // Filter by jenjang
    if (filters.jenjang) {
      filtered = filtered.filter(item => 
        item.jenjang === filters.jenjang
      );
    }

    // Filter by fungsi
    if (filters.fungsi) {
      filtered = filtered.filter(item => 
        item.fungsi === filters.fungsi
      );
    }

    // Filter by peran
    if (filters.peran) {
      filtered = filtered.filter(item => 
        item.peran === filters.peran
      );
    }

    // Filter by tingkat
    if (filters.tingkat && filters.tingkat !== 'all') {
      filtered = filtered.filter(item => 
        item.tingkat_jenjang === parseInt(filters.tingkat)
      );
    }

    setFilteredData(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
  }, [data, filters]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (data.length > 0) {
      applyFilters();
    }
  }, [data, applyFilters]);

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // Handle view detail
  const handleViewDetail = (record) => {
    setModalState({
      ...modalState,
      detail: { visible: true, data: record }
    });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      jabatan: '',
      jenjang: '',
      fungsi: '',
      peran: '',
      tingkat: 'all'
    });
    setFilteredData(data);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: data.length
    }));
  };

  // Get unique values for filter dropdowns
  const uniqueJabatan = [...new Set(data.map(item => item.jabatan))].sort();
  const uniqueJenjang = [...new Set(data.map(item => item.jenjang))].sort();
  const uniqueFungsi = [...new Set(data.map(item => item.fungsi))].sort();
  const uniquePeran = [...new Set(data.map(item => item.peran))].sort();

  // Table columns
  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      render: (text, record, index) => 
        (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Kode',
      dataIndex: 'kode_kompetensi',
      key: 'kode_kompetensi',
      width: 100,
      render: (text) => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: 'Nama Kompetensi',
      dataIndex: 'nama_kompetensi',
      key: 'nama_kompetensi',
      width: 300,
      ellipsis: true
    },
    {
      title: 'Jabatan',
      dataIndex: 'jabatan',
      key: 'jabatan',
      width: 120,
      render: (text) => <Tag color="orange">{text}</Tag>
    },
    {
      title: 'Jenjang',
      dataIndex: 'jenjang',
      key: 'jenjang',
      width: 150,
      render: (text, record) => {
        const colors = {
          1: 'success',
          2: 'processing',
          3: 'warning',
          0: 'default'
        };
        return (
          <Tag color={colors[record.tingkat_jenjang]}>
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Fungsi',
      dataIndex: 'fungsi',
      key: 'fungsi',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Peran',
      dataIndex: 'peran',
      key: 'peran',
      width: 150,
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Lihat Detail">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          />
        </Tooltip>
      )
    }
  ];

  // Dropdown menu items for Ant Design v5
  const menuItems = [
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Export Data',
      onClick: () => setModalState({ ...modalState, export: { visible: true } })
    },
    {
      key: 'statistik',
      icon: <BarChartOutlined />,
      label: 'Lihat Statistik',
      onClick: () => setModalState({ ...modalState, statistik: { visible: true } })
    },
    {
      type: 'divider'
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Cetak',
      onClick: () => window.print()
    },
    {
      key: 'refresh',
      icon: <ReloadOutlined />,
      label: 'Refresh',
      onClick: fetchData
    }
  ];

  return (
    <Card bordered={false} className="standar-kompetensi-container">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <UnorderedListOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              Standar Kompetensi
            </Title>
            <Badge 
              count={filteredData.length} 
              showZero 
              style={{ backgroundColor: '#52c41a' }}
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            
            {/* Fixed Dropdown for Ant Design v5 */}
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <Button icon={<FilterOutlined />}>
                Menu
              </Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#e6f7ff' }}>
            <Statistic
              title="Total Mapping"
              value={stats.total}
              prefix={<UnorderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic
              title="Jabatan"
              value={stats.byJabatan.length}
              prefix={<ProfileOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
            <Statistic
              title="Jenjang"
              value={stats.byJenjang.length}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f0ff' }}>
            <Statistic
              title="Fungsi"
              value={stats.byFungsi.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
        <TabPane 
          tab={
            <span>
              <UnorderedListOutlined />
              Daftar Kompetensi
            </span>
          } 
          key="list" 
        />
        <TabPane 
          tab={
            <span>
              <BarChartOutlined />
              Statistik
            </span>
          } 
          key="stats" 
        />
      </Tabs>

      {/* Filter Section */}
      <FilterSection
        filters={filters}
        setFilters={setFilters}
        uniqueJabatan={uniqueJabatan}
        uniqueJenjang={uniqueJenjang}
        uniqueFungsi={uniqueFungsi}
        uniquePeran={uniquePeran}
        onReset={handleResetFilters}
        totalData={data.length}
        filteredCount={filteredData.length}
      />

      {/* Table */}
      {activeTab === 'list' && (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id_mapping"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} data`,
            onChange: (page, pageSize) => 
              setPagination({ ...pagination, current: page, pageSize })
          }}
          scroll={{ x: 1300 }}
          size="middle"
          onRow={(record) => ({
            onDoubleClick: () => handleViewDetail(record)
          })}
        />
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Per Jenjang" size="small">
              {stats.byJenjang.map(item => (
                <Row justify="space-between" style={{ marginBottom: 8 }} key={item.jenjang}>
                  <Col>
                    <Tag color={
                      item.tingkat === 1 ? 'success' :
                      item.tingkat === 2 ? 'processing' :
                      item.tingkat === 3 ? 'warning' : 'default'
                    }>
                      {item.jenjang}
                    </Tag>
                  </Col>
                  <Col>
                    <Badge count={item.total} style={{ backgroundColor: '#1890ff' }} />
                  </Col>
                </Row>
              ))}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Per Jabatan (Top 10)" size="small">
              {stats.byJabatan.slice(0, 10).map(item => (
                <Row justify="space-between" style={{ marginBottom: 8 }} key={item.jabatan}>
                  <Col>
                    <Tag color="orange">{item.jabatan}</Tag>
                  </Col>
                  <Col>
                    <Badge count={item.total} style={{ backgroundColor: '#fa8c16' }} />
                  </Col>
                </Row>
              ))}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Per Fungsi" size="small">
              {stats.byFungsi.map(item => (
                <Row justify="space-between" style={{ marginBottom: 8 }} key={item.fungsi}>
                  <Col>
                    <Tag color="blue">{item.fungsi}</Tag>
                  </Col>
                  <Col>
                    <Badge count={item.total} style={{ backgroundColor: '#722ed1' }} />
                  </Col>
                </Row>
              ))}
            </Card>
          </Col>
        </Row>
      )}

      {/* Modals */}
      <DetailModal
        visible={modalState.detail.visible}
        data={modalState.detail.data}
        onCancel={() => setModalState({ ...modalState, detail: { visible: false, data: null } })}
      />

      <StatistikModal
        visible={modalState.statistik.visible}
        stats={stats}
        onCancel={() => setModalState({ ...modalState, statistik: { visible: false } })}
      />

      <ExportModal
        visible={modalState.export.visible}
        data={filteredData}
        onCancel={() => setModalState({ ...modalState, export: { visible: false } })}
        onSuccess={fetchData}
      />
    </Card>
  );
};

export default StandarContainer;