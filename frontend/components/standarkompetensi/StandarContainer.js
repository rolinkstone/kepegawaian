// components/standarkompetensi/StandarContainer.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  message,
  Avatar,
  Divider,
  Progress,
  Empty,
  Skeleton,
  Breadcrumb,
  Input,
  Select,
  List,
  Radio,
  Spin,
  Pagination,
  ConfigProvider
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
  PrinterOutlined,
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  HomeOutlined,
  DashboardOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CopyOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import FilterSection from './FilterSection';
import DetailModal from './modals/DetailStandarModal';
import StatistikModal from './modals/StatistikStandarModal';
import ExportModal from './modals/ExportStandarModal';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// ========== CUSTOM COMPONENTS ==========

const StatCard = ({ title, value, icon, color, subtitle, loading }) => {
  const colors = {
    blue: { bg: '#e6f7ff', text: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff10 0%, #e6f7ff 100%)' },
    green: { bg: '#f6ffed', text: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a10 0%, #f6ffed 100%)' },
    orange: { bg: '#fff7e6', text: '#fa8c16', gradient: 'linear-gradient(135deg, #fa8c1610 0%, #fff7e6 100%)' },
    purple: { bg: '#f9f0ff', text: '#722ed1', gradient: 'linear-gradient(135deg, #722ed110 0%, #f9f0ff 100%)' },
    cyan: { bg: '#e6fffb', text: '#13c2c2', gradient: 'linear-gradient(135deg, #13c2c210 0%, #e6fffb 100%)' }
  };

  const theme = colors[color] || colors.blue;

  return (
    <Card 
      bordered={false} 
      style={{ 
        background: theme.gradient,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        height: '100%'
      }}
      bodyStyle={{ padding: 20 }}
      hoverable
    >
      <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
              </Text>
              <Title level={2} style={{ margin: 0, color: theme.text, fontWeight: 700 }}>
                {value?.toLocaleString() || 0}
              </Title>
              {subtitle && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {subtitle}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Avatar
              size={56}
              icon={icon}
              style={{ 
                backgroundColor: theme.text,
                boxShadow: `0 8px 16px ${theme.text}20`
              }}
            />
          </Col>
        </Row>
      </Skeleton>
    </Card>
  );
};

const CardView = ({ data, pagination, onPageChange, onViewDetail }) => {
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const currentData = data.slice(startIndex, endIndex);

  if (data.length === 0) {
    return (
      <Empty 
        description="Tidak ada data kompetensi" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ margin: '40px 0' }}
      />
    );
  }

  return (
    <div className="card-view-container">
      <Row gutter={[16, 16]}>
        {currentData.map((item, index) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item.id_mapping || index}>
            <Card
              hoverable
              bordered={false}
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                animation: `fadeIn 0.3s ease ${index * 0.05}s both`
              }}
              bodyStyle={{ padding: 20 }}
              actions={[
                <Tooltip title="Lihat Detail" key="view">
                  <EyeOutlined onClick={() => onViewDetail(item)} />
                </Tooltip>,
                <Tooltip title="Export" key="export">
                  <ExportOutlined />
                </Tooltip>
              ]}
            >
              <Card.Meta
                avatar={
                  <Avatar 
                    size={48} 
                    style={{ 
                      backgroundColor: '#1890ff',
                      boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
                    }}
                  >
                    {item.kode_kompetensi?.substring(0, 2) || 'K'}
                  </Avatar>
                }
                title={
                  <Space direction="vertical" size={0}>
                    <Tag color="geekblue" style={{ borderRadius: 12, width: 'fit-content' }}>
                      {item.kode_kompetensi || '-'}
                    </Tag>
                    <Text strong style={{ fontSize: 14, marginTop: 8 }}>
                      {item.nama_kompetensi || '-'}
                    </Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={8} style={{ marginTop: 12 }}>
                    <Space wrap size={4}>
                      <Tag color="orange" icon={<ProfileOutlined />}>
                        {item.jabatan || item.nama_jabatan || '-'}
                      </Tag>
                      <Tag 
                        color={
                          item.tingkat_jenjang === 1 ? 'success' :
                          item.tingkat_jenjang === 2 ? 'processing' :
                          item.tingkat_jenjang === 3 ? 'warning' : 'default'
                        }
                        icon={<ApartmentOutlined />}
                      >
                        {item.jenjang || item.nama_jenjang || '-'}
                      </Tag>
                    </Space>
                    <Space wrap size={4}>
                      <Tag color="blue" icon={<ApartmentOutlined />}>
                        {item.fungsi || item.nama_fungsi || '-'}
                      </Tag>
                      <Tag color="green" icon={<UserOutlined />}>
                        {item.peran || item.nama_peran || '-'}
                      </Tag>
                    </Space>
                  </Space>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
      
      {data.length > 0 && (
        <Row justify="center" style={{ marginTop: 24 }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onPageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `Total ${total} data`}
          />
        </Row>
      )}
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const StandarContainer = ({ session }) => {
  const router = useRouter();
  
  // ========== STATE MANAGEMENT ==========
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    jabatan: '',
    jenjang: '',
    fungsi: '',
    peran: '',
    tingkat: 'all'
  });
  const [sorter, setSorter] = useState({
    field: 'kode_kompetensi',
    order: 'ascend'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalState, setModalState] = useState({
    detail: { visible: false, data: null },
    statistik: { visible: false },
    export: { visible: false, format: 'excel', data: [] }
  });
  const [stats, setStats] = useState({
    total: 0,
    byJenjang: [],
    byJabatan: [],
    byFungsi: [],
    byPeran: [],
    byTingkat: [],
    avgPerJabatan: 0,
    avgPerFungsi: 0
  });
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState('table');

  // ========== FETCH DATA ==========
  const fetchData = useCallback(async (showMessage = true) => {
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
        console.log('Fetched data:', result.data);
        setData(result.data || []);
        setFilteredData(result.data || []);
        setPagination(prev => ({
          ...prev,
          total: result.data?.length || 0
        }));
        
        calculateStats(result.data || []);
        
        if (showMessage) {
          message.success(`Data berhasil dimuat (${result.data?.length || 0} kompetensi)`);
        }
      } else {
        throw new Error(result.message || 'Gagal memuat data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error(`Gagal memuat data: ${error.message}`);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [session]);

  // ========== CALCULATE STATISTICS ==========
  const calculateStats = useCallback((dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      setStats({
        total: 0,
        byJenjang: [],
        byJabatan: [],
        byFungsi: [],
        byPeran: [],
        byTingkat: [],
        avgPerJabatan: 0,
        avgPerFungsi: 0
      });
      return;
    }

    const byJenjang = {};
    const byJabatan = {};
    const byFungsi = {};
    const byPeran = {};
    const byTingkat = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

    dataArray.forEach(item => {
      // By Jenjang
      const jenjangName = item.jenjang || item.nama_jenjang || 'Tidak Diketahui';
      const tingkatValue = item.tingkat_jenjang ?? 0;
      
      if (!byJenjang[jenjangName]) {
        byJenjang[jenjangName] = {
          jenjang: jenjangName,
          tingkat: tingkatValue,
          total: 0,
          persentase: 0
        };
      }
      byJenjang[jenjangName].total++;

      // By Tingkat
      byTingkat[tingkatValue] = (byTingkat[tingkatValue] || 0) + 1;

      // By Jabatan
      const jabatanName = item.jabatan || item.nama_jabatan;
      if (jabatanName) {
        if (!byJabatan[jabatanName]) {
          byJabatan[jabatanName] = {
            jabatan: jabatanName,
            total: 0,
            persentase: 0
          };
        }
        byJabatan[jabatanName].total++;
      }

      // By Fungsi
      const fungsiName = item.fungsi || item.nama_fungsi;
      if (fungsiName) {
        if (!byFungsi[fungsiName]) {
          byFungsi[fungsiName] = {
            fungsi: fungsiName,
            total: 0,
            persentase: 0
          };
        }
        byFungsi[fungsiName].total++;
      }

      // By Peran
      const peranName = item.peran || item.nama_peran;
      if (peranName && fungsiName) {
        const peranKey = `${fungsiName} - ${peranName}`;
        if (!byPeran[peranKey]) {
          byPeran[peranKey] = {
            fungsi: fungsiName,
            peran: peranName,
            total: 0,
            persentase: 0
          };
        }
        byPeran[peranKey].total++;
      }
    });

    const total = dataArray.length;

    // Hitung persentase
    Object.values(byJenjang).forEach(item => {
      item.persentase = ((item.total / total) * 100).toFixed(1);
    });
    
    Object.values(byJabatan).forEach(item => {
      item.persentase = ((item.total / total) * 100).toFixed(1);
    });
    
    Object.values(byFungsi).forEach(item => {
      item.persentase = ((item.total / total) * 100).toFixed(1);
    });
    
    Object.values(byPeran).forEach(item => {
      item.persentase = ((item.total / total) * 100).toFixed(1);
    });

    const byTingkatArray = Object.entries(byTingkat)
      .map(([tingkat, total]) => ({
        tingkat: parseInt(tingkat),
        total,
        persentase: total > 0 ? ((total / dataArray.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.tingkat - b.tingkat);

    setStats({
      total: dataArray.length,
      byJenjang: Object.values(byJenjang).sort((a, b) => a.tingkat - b.tingkat),
      byJabatan: Object.values(byJabatan).sort((a, b) => b.total - a.total),
      byFungsi: Object.values(byFungsi).sort((a, b) => b.total - a.total),
      byPeran: Object.values(byPeran).sort((a, b) => b.total - a.total),
      byTingkat: byTingkatArray,
      avgPerJabatan: Object.keys(byJabatan).length > 0 
        ? (dataArray.length / Object.keys(byJabatan).length).toFixed(1) 
        : 0,
      avgPerFungsi: Object.keys(byFungsi).length > 0 
        ? (dataArray.length / Object.keys(byFungsi).length).toFixed(1) 
        : 0
    });
  }, []);

  // ========== UNIQUE VALUES ==========
  const uniqueValues = useMemo(() => {
    console.log('Calculating unique values from data:', data.length);
    
    if (!Array.isArray(data) || data.length === 0) {
      return {
        jabatan: [],
        jenjang: [],
        fungsi: [],
        peran: [],
        tingkat: [
          { value: 'all', label: 'Semua Tingkat' },
          { value: '1', label: 'Ahli Pertama (Level 1)' },
          { value: '2', label: 'Ahli Muda (Level 2)' },
          { value: '3', label: 'Ahli Madya (Level 3)' },
          { value: '0', label: 'Universal (Level 0)' }
        ]
      };
    }

    const jabatanSet = new Set();
    const jenjangSet = new Set();
    const fungsiSet = new Set();
    const peranSet = new Set();

    data.forEach(item => {
      // Jabatan - cek berbagai kemungkinan field
      if (item.jabatan) jabatanSet.add(item.jabatan);
      if (item.nama_jabatan) jabatanSet.add(item.nama_jabatan);
      
      // Jenjang - cek berbagai kemungkinan field
      if (item.jenjang) jenjangSet.add(item.jenjang);
      if (item.nama_jenjang) jenjangSet.add(item.nama_jenjang);
      
      // Fungsi - cek berbagai kemungkinan field
      if (item.fungsi) fungsiSet.add(item.fungsi);
      if (item.nama_fungsi) fungsiSet.add(item.nama_fungsi);
      
      // Peran - cek berbagai kemungkinan field
      if (item.peran) peranSet.add(item.peran);
      if (item.nama_peran) peranSet.add(item.nama_peran);
    });

    const result = {
      jabatan: Array.from(jabatanSet)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })),
      jenjang: Array.from(jenjangSet)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })),
      fungsi: Array.from(fungsiSet)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })),
      peran: Array.from(peranSet)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })),
      tingkat: [
        { value: 'all', label: 'Semua Tingkat' },
        { value: '1', label: 'Ahli Pertama (Level 1)' },
        { value: '2', label: 'Ahli Muda (Level 2)' },
        { value: '3', label: 'Ahli Madya (Level 3)' },
        { value: '0', label: 'Universal (Level 0)' }
      ]
    };

    console.log('Unique values result:', {
      jabatanCount: result.jabatan.length,
      jenjangCount: result.jenjang.length,
      fungsiCount: result.fungsi.length,
      peranCount: result.peran.length,
      jabatanSample: result.jabatan.slice(0, 3),
      jenjangSample: result.jenjang.slice(0, 3)
    });

    return result;
  }, [data]);

  // ========== APPLY FILTERS ==========
  const applyFilters = useCallback(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([]);
      setPagination(prev => ({ ...prev, current: 1, total: 0 }));
      return;
    }

    let filtered = [...data];

    // Global search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableFields = [
          item.kode_kompetensi,
          item.nama_kompetensi,
          item.jabatan,
          item.nama_jabatan,
          item.jenjang,
          item.nama_jenjang,
          item.fungsi,
          item.nama_fungsi,
          item.peran,
          item.nama_peran,
          item.deskripsi_kompetensi
        ];
        
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by jabatan
    if (filters.jabatan) {
      filtered = filtered.filter(item => 
        item.jabatan === filters.jabatan || 
        item.nama_jabatan === filters.jabatan
      );
    }

    // Filter by jenjang
    if (filters.jenjang) {
      filtered = filtered.filter(item => 
        item.jenjang === filters.jenjang || 
        item.nama_jenjang === filters.jenjang
      );
    }

    // Filter by fungsi
    if (filters.fungsi) {
      filtered = filtered.filter(item => 
        item.fungsi === filters.fungsi || 
        item.nama_fungsi === filters.fungsi
      );
    }

    // Filter by peran
    if (filters.peran) {
      filtered = filtered.filter(item => 
        item.peran === filters.peran || 
        item.nama_peran === filters.peran
      );
    }

    // Filter by tingkat
    if (filters.tingkat && filters.tingkat !== 'all') {
      const tingkatValue = parseInt(filters.tingkat);
      filtered = filtered.filter(item => 
        item.tingkat_jenjang === tingkatValue
      );
    }

    // Apply sorting
    if (sorter.field) {
      filtered.sort((a, b) => {
        let valA = a[sorter.field];
        let valB = b[sorter.field];
        
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        
        if (sorter.order === 'ascend') {
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
      });
    }

    setFilteredData(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
    setSelectedRowKeys([]);
  }, [data, filters, sorter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (session) {
      fetchData(false);
    }
  }, [session, fetchData]);

  // ========== HANDLERS ==========
  const handleViewDetail = (record) => {
    setModalState(prev => ({
      ...prev,
      detail: { visible: true, data: record }
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      jabatan: '',
      jenjang: '',
      fungsi: '',
      peran: '',
      tingkat: 'all'
    });
    setSorter({
      field: 'kode_kompetensi',
      order: 'ascend'
    });
    setSelectedRowKeys([]);
    
    message.info('Semua filter telah direset');
  };

  const handleClearFilter = (key) => {
    if (key === 'all') {
      handleResetFilters();
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: key === 'tingkat' ? 'all' : ''
      }));
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    
    if (sorter.field) {
      setSorter({
        field: sorter.field,
        order: sorter.order
      });
    }
  };

  const handleExport = (format) => {
    setModalState(prev => ({
      ...prev,
      export: { 
        visible: true,
        format,
        data: selectedRowKeys.length > 0 
          ? filteredData.filter(item => selectedRowKeys.includes(item.id_mapping))
          : filteredData
      }
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFullscreen = () => {
    const element = document.querySelector('.standar-kompetensi-container');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  const handleExportSuccess = () => {
    setModalState(prev => ({ 
      ...prev, 
      export: { visible: false, format: 'excel', data: [] } 
    }));
    setSelectedRowKeys([]);
    message.success('Data berhasil diexport');
  };

  const handleExportCancel = () => {
    setModalState(prev => ({ 
      ...prev, 
      export: { visible: false, format: 'excel', data: [] } 
    }));
  };

  // ========== TABLE COLUMNS ==========
  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (text, record, index) => {
        const pageIndex = (pagination.current - 1) * pagination.pageSize + index + 1;
        return (
          <Text style={{ fontWeight: 500, color: '#8c8c8c' }}>
            {pageIndex.toString().padStart(3, '0')}
          </Text>
        );
      }
    },
    {
      title: 'Kode',
      dataIndex: 'kode_kompetensi',
      key: 'kode_kompetensi',
      width: 100,
      sorter: true,
      render: (text) => (
        <Tag 
          color="geekblue" 
          style={{ 
            borderRadius: 12,
            padding: '4px 12px',
            fontFamily: 'monospace',
            fontWeight: 600
          }}
        >
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Nama Kompetensi',
      dataIndex: 'nama_kompetensi',
      key: 'nama_kompetensi',
      width: 300,
      sorter: true,
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{text || '-'}</Text>
          {record.deskripsi_kompetensi && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.deskripsi_kompetensi.substring(0, 50)}...
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Jabatan',
      key: 'jabatan',
      width: 120,
      sorter: true,
      render: (_, record) => {
        const jabatan = record.jabatan || record.nama_jabatan || '-';
        return (
          <Tag 
            color="orange" 
            style={{ borderRadius: 12, padding: '4px 12px' }}
            icon={<ProfileOutlined />}
          >
            {jabatan}
          </Tag>
        );
      }
    },
    {
      title: 'Jenjang',
      key: 'jenjang',
      width: 150,
      sorter: true,
      render: (_, record) => {
        const jenjang = record.jenjang || record.nama_jenjang || '-';
        const colors = {
          1: { color: 'success', icon: <CheckCircleOutlined /> },
          2: { color: 'processing', icon: <InfoCircleOutlined /> },
          3: { color: 'warning', icon: <WarningOutlined /> },
          0: { color: 'default', icon: <CloseCircleOutlined /> }
        };
        const theme = colors[record.tingkat_jenjang] || colors[0];
        
        return (
          <Tag 
            color={theme.color} 
            style={{ borderRadius: 12, padding: '4px 12px' }}
            icon={theme.icon}
          >
            {jenjang}
          </Tag>
        );
      }
    },
    {
      title: 'Fungsi',
      key: 'fungsi',
      width: 150,
      sorter: true,
      render: (_, record) => {
        const fungsi = record.fungsi || record.nama_fungsi || '-';
        return (
          <Tag 
            color="blue" 
            style={{ borderRadius: 12, padding: '4px 12px' }}
            icon={<ApartmentOutlined />}
          >
            {fungsi}
          </Tag>
        );
      }
    },
    {
      title: 'Peran',
      key: 'peran',
      width: 150,
      sorter: true,
      render: (_, record) => {
        const peran = record.peran || record.nama_peran || '-';
        return (
          <Tag 
            color="green" 
            style={{ borderRadius: 12, padding: '4px 12px' }}
            icon={<UserOutlined />}
          >
            {peran}
          </Tag>
        );
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Lihat Detail" placement="left">
          <Button
            type="primary"
            shape="circle"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
            style={{ 
              boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
            }}
          />
        </Tooltip>
      )
    }
  ];

  // ========== RENDER STATISTICS TAB ==========
  const renderStatisticsTab = () => (
    <div className="statistics-container">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Total Mapping"
                value={stats.total}
                icon={<UnorderedListOutlined />}
                color="blue"
                subtitle="Seluruh data kompetensi"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Jabatan"
                value={stats.byJabatan.length}
                icon={<ProfileOutlined />}
                color="orange"
                subtitle={`${stats.byJabatan.length} jabatan terdaftar`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Jenjang"
                value={stats.byJenjang.length}
                icon={<ApartmentOutlined />}
                color="cyan"
                subtitle={`${stats.byJenjang.length} jenjang karir`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Fungsi"
                value={stats.byFungsi.length}
                icon={<ApartmentOutlined />}
                color="purple"
                subtitle={`${stats.byFungsi.length} fungsi pekerjaan`}
              />
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined style={{ color: '#1890ff' }} />
                <Text strong>Distribusi per Jenjang</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byJenjang.length > 0 ? (
              <List
                dataSource={stats.byJenjang}
                renderItem={item => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <Col span={24}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Avatar 
                              size={32}
                              style={{ 
                                backgroundColor: 
                                  item.tingkat === 1 ? '#52c41a' :
                                  item.tingkat === 2 ? '#1890ff' :
                                  item.tingkat === 3 ? '#fa8c16' : '#8c8c8c'
                              }}
                            >
                              {item.tingkat}
                            </Avatar>
                            <Space direction="vertical" size={0}>
                              <Text strong>{item.jenjang}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Tingkat {item.tingkat}
                              </Text>
                            </Space>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="large">
                            <Text strong style={{ fontSize: 16 }}>{item.total}</Text>
                            <Tag color="blue" style={{ borderRadius: 12 }}>
                              {item.persentase}%
                            </Tag>
                          </Space>
                        </Col>
                      </Row>
                      <Progress 
                        percent={parseFloat(item.persentase)} 
                        size="small"
                        strokeColor={
                          item.tingkat === 1 ? '#52c41a' :
                          item.tingkat === 2 ? '#1890ff' :
                          item.tingkat === 3 ? '#fa8c16' : '#8c8c8c'
                        }
                        style={{ marginTop: 8 }}
                        showInfo={false}
                      />
                    </Col>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Belum ada data jenjang" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined style={{ color: '#fa8c16' }} />
                <Text strong>Distribusi per Jabatan (Top 10)</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byJabatan.length > 0 ? (
              <List
                dataSource={stats.byJabatan.slice(0, 10)}
                renderItem={item => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <Col span={24}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Avatar 
                              size={32}
                              style={{ backgroundColor: '#fa8c16' }}
                              icon={<ProfileOutlined />}
                            />
                            <Text strong>{item.jabatan}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="large">
                            <Text strong style={{ fontSize: 16 }}>{item.total}</Text>
                            <Tag color="orange" style={{ borderRadius: 12 }}>
                              {item.persentase}%
                            </Tag>
                          </Space>
                        </Col>
                      </Row>
                      <Progress 
                        percent={parseFloat(item.persentase)} 
                        size="small"
                        strokeColor="#fa8c16"
                        style={{ marginTop: 8 }}
                        showInfo={false}
                      />
                    </Col>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Belum ada data jabatan" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <Text strong>Distribusi per Fungsi</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byFungsi.length > 0 ? (
              <List
                dataSource={stats.byFungsi}
                renderItem={item => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <Col span={24}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Avatar 
                              size={32}
                              style={{ backgroundColor: '#722ed1' }}
                              icon={<ApartmentOutlined />}
                            />
                            <Text strong>{item.fungsi}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="large">
                            <Text strong style={{ fontSize: 16 }}>{item.total}</Text>
                            <Tag color="purple" style={{ borderRadius: 12 }}>
                              {item.persentase}%
                            </Tag>
                          </Space>
                        </Col>
                      </Row>
                      <Progress 
                        percent={parseFloat(item.persentase)} 
                        size="small"
                        strokeColor="#722ed1"
                        style={{ marginTop: 8 }}
                        showInfo={false}
                      />
                    </Col>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Belum ada data fungsi" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined style={{ color: '#13c2c2' }} />
                <Text strong>Distribusi per Tingkat</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byTingkat.length > 0 ? (
              <List
                dataSource={stats.byTingkat}
                renderItem={item => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <Col span={24}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Avatar 
                              size={32}
                              style={{ 
                                backgroundColor: 
                                  item.tingkat === 1 ? '#52c41a' :
                                  item.tingkat === 2 ? '#1890ff' :
                                  item.tingkat === 3 ? '#fa8c16' : '#8c8c8c'
                              }}
                            >
                              {item.tingkat}
                            </Avatar>
                            <Text strong>
                              {item.tingkat === 1 ? 'Ahli Pertama' :
                               item.tingkat === 2 ? 'Ahli Muda' :
                               item.tingkat === 3 ? 'Ahli Madya' : 'Universal'}
                            </Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="large">
                            <Text strong style={{ fontSize: 16 }}>{item.total}</Text>
                            <Tag 
                              color={
                                item.tingkat === 1 ? 'success' :
                                item.tingkat === 2 ? 'processing' :
                                item.tingkat === 3 ? 'warning' : 'default'
                              } 
                              style={{ borderRadius: 12 }}
                            >
                              {item.persentase}%
                            </Tag>
                          </Space>
                        </Col>
                      </Row>
                      <Progress 
                        percent={parseFloat(item.persentase)} 
                        size="small"
                        strokeColor={
                          item.tingkat === 1 ? '#52c41a' :
                          item.tingkat === 2 ? '#1890ff' :
                          item.tingkat === 3 ? '#fa8c16' : '#8c8c8c'
                        }
                        style={{ marginTop: 8 }}
                        showInfo={false}
                      />
                    </Col>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Belum ada data tingkat" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  // ========== RENDER ==========
  if (initialLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <Spin size="large" />
        <Text type="secondary" style={{ fontSize: 16 }}>
          Memuat data standar kompetensi...
        </Text>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: { borderRadiusLG: 16 },
          Button: { borderRadius: 8 },
          Tag: { borderRadius: 12 }
        }
      }}
    >
      <div className="standar-kompetensi-container">
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .standar-kompetensi-container {
            padding: 24px;
            background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
            min-height: 100vh;
          }
          
          .ant-card-hoverable:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          
          .ant-table-thead > tr > th {
            background-color: #fafafa !important;
            border-bottom: 2px solid #f0f0f0 !important;
          }
          
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
            background-color: #1890ff !important;
            color: white !important;
          }
          
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: white !important;
          }
        `}</style>

        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/master">
            <DashboardOutlined />
            <span>Master Data</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <UnorderedListOutlined />
            <span>Standar Kompetensi</span>
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* Main Content */}
        <Card 
          bordered={false}
          style={{ 
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Space align="center" size={12}>
                <Avatar
                  size={56}
                  icon={<UnorderedListOutlined />}
                  style={{ 
                    backgroundColor: '#1890ff',
                    boxShadow: '0 8px 16px rgba(24,144,255,0.3)'
                  }}
                />
                <div>
                  <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                    Standar Kompetensi
                  </Title>
                  <Text type="secondary">
                    Kelola dan monitoring standar kompetensi pegawai
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size={4}>
                <Tooltip title="Refresh Data">
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchData(true)}
                    loading={loading}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Export Data">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'excel',
                          icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
                          label: 'Export ke Excel',
                          onClick: () => handleExport('excel')
                        },
                        {
                          key: 'pdf',
                          icon: <FilePdfOutlined style={{ color: '#f5222d' }} />,
                          label: 'Export ke PDF',
                          onClick: () => handleExport('pdf')
                        }
                      ]
                    }}
                    placement="bottomRight"
                  >
                    <Button icon={<ExportOutlined />} style={{ borderRadius: 8 }} />
                  </Dropdown>
                </Tooltip>
                <Tooltip title="Cetak">
                  <Button 
                    icon={<PrinterOutlined />} 
                    onClick={handlePrint}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Total Mapping"
                value={stats.total}
                icon={<UnorderedListOutlined />}
                color="blue"
                subtitle="Seluruh data kompetensi"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Jabatan"
                value={stats.byJabatan.length}
                icon={<ProfileOutlined />}
                color="orange"
                subtitle={`${stats.byJabatan.length} jabatan terdaftar`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Jenjang"
                value={stats.byJenjang.length}
                icon={<ApartmentOutlined />}
                color="cyan"
                subtitle={`${stats.byJenjang.length} jenjang karir`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                title="Fungsi"
                value={stats.byFungsi.length}
                icon={<ApartmentOutlined />}
                color="purple"
                subtitle={`${stats.byFungsi.length} fungsi pekerjaan`}
              />
            </Col>
          </Row>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            style={{ marginBottom: 24 }}
          >
            <TabPane 
              tab={
                <span>
                  <UnorderedListOutlined />
                  Daftar Kompetensi
                  <Badge 
                    count={filteredData.length} 
                    style={{ 
                      backgroundColor: '#52c41a',
                      marginLeft: 8
                    }}
                    showZero
                  />
                </span>
              } 
              key="list" 
            />
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  Statistik
                  <Badge 
                    count={stats.total} 
                    style={{ 
                      backgroundColor: '#1890ff',
                      marginLeft: 8
                    }}
                    showZero
                  />
                </span>
              } 
              key="stats" 
            />
          </Tabs>

          {/* Filter Section */}
          {activeTab === 'list' && (
            <>
              <FilterSection
                filters={filters}
                setFilters={setFilters}
                uniqueJabatan={uniqueValues.jabatan}
                uniqueJenjang={uniqueValues.jenjang}
                uniqueFungsi={uniqueValues.fungsi}
                uniquePeran={uniqueValues.peran}
                uniqueTingkat={uniqueValues.tingkat}
                onReset={handleResetFilters}
                totalData={data.length}
                filteredCount={filteredData.length}
              />

              {/* View Mode Selector */}
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                  <Space size={16}>
                    <Radio.Group 
                      value={viewMode} 
                      onChange={(e) => setViewMode(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value="table">
                        <UnorderedListOutlined /> Table
                      </Radio.Button>
                      <Radio.Button value="card">
                        <ProfileOutlined /> Card
                      </Radio.Button>
                    </Radio.Group>
                    {selectedRowKeys.length > 0 && (
                      <Tag color="blue" style={{ borderRadius: 12, padding: '4px 12px' }}>
                        {selectedRowKeys.length} data dipilih
                      </Tag>
                    )}
                  </Space>
                </Col>
                <Col>
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={() => handleExport('excel')}
                    disabled={selectedRowKeys.length === 0}
                    type="primary"
                    ghost
                    style={{ borderRadius: 8 }}
                  >
                    Export Selected ({selectedRowKeys.length})
                  </Button>
                </Col>
              </Row>

              {/* Content */}
              {viewMode === 'table' ? (
                <Table
                  columns={columns}
                  dataSource={filteredData}
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: handlePageChange,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} data`,
                    position: ['bottomCenter']
                  }}
                  onChange={handleTableChange}
                  onRow={(record) => ({
                    onDoubleClick: () => handleViewDetail(record),
                    style: { cursor: 'pointer' }
                  })}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    columnWidth: 48
                  }}
                  rowKey="id_mapping"
                  scroll={{ x: 1400, y: 'calc(100vh - 400px)' }}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                />
              ) : (
                <CardView
                  data={filteredData}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onViewDetail={handleViewDetail}
                />
              )}
            </>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && renderStatisticsTab()}
        </Card>

        {/* Modals */}
        <DetailModal
          visible={modalState.detail.visible}
          data={modalState.detail.data}
          onCancel={() => setModalState(prev => ({ 
            ...prev, 
            detail: { visible: false, data: null } 
          }))}
          onSuccess={fetchData}
        />

        <StatistikModal
          visible={modalState.statistik.visible}
          stats={stats}
          onCancel={() => setModalState(prev => ({ 
            ...prev, 
            statistik: { visible: false } 
          }))}
        />

        <ExportModal
          visible={modalState.export.visible}
          data={modalState.export.data}
          format={modalState.export.format}
          onCancel={handleExportCancel}
          onSuccess={handleExportSuccess}
        />
      </div>
    </ConfigProvider>
  );
};

export default StandarContainer;