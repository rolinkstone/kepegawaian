import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Tag,
  Tooltip,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Avatar,
  Typography,
  Tabs,
  Radio,
  Empty,
  Spin,
  ConfigProvider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LockOutlined,
  CrownOutlined,
  SecurityScanOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import FilterSection from './FilterSection';
import PegawaiForm from './PegawaiForm';
import {
  ModalTambahPegawai,
  ModalDetailPegawai,
  ModalAnalisisKenaikan
} from './modals';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;

// ========== STAT CARD COMPONENT ==========
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
      <Spin spinning={loading}>
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
      </Spin>
    </Card>
  );
};

// ========== MAIN COMPONENT ==========
const PegawaiContainer = ({ session }) => {
  // ========== CEK ROLE ADMIN TAMBUN RAYA DAN KATIM ==========
  const userRoles = useMemo(() => {
    if (!session) {
      console.log('🔐 Session tidak ada');
      return { isAdmin: false, isKatim: false, roles: [] };
    }

    console.log('🔐 Session object:', JSON.stringify(session, null, 2));
    
    let roles = [];
    let isAdmin = false;
    let isKatim = false;

    // Cek dari access token (biasanya di token ada roles)
    if (session.accessToken) {
      try {
        // Decode token untuk cek roles
        const tokenParts = session.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔐 Token payload:', payload);
          
          // Cek realm_access roles
          if (payload.realm_access?.roles) {
            roles = [...roles, ...payload.realm_access.roles];
            isAdmin = isAdmin || payload.realm_access.roles.includes('admin_tambun_raya');
            isKatim = isKatim || payload.realm_access.roles.includes('katim');
          }
          
          // Cek resource_access
          if (payload.resource_access) {
            for (const client in payload.resource_access) {
              if (payload.resource_access[client].roles) {
                roles = [...roles, ...payload.resource_access[client].roles];
                isAdmin = isAdmin || payload.resource_access[client].roles.includes('admin_tambun_raya');
                isKatim = isKatim || payload.resource_access[client].roles.includes('katim');
              }
            }
          }
          
          // Cek di root roles
          if (payload.roles) {
            roles = [...roles, ...payload.roles];
            isAdmin = isAdmin || payload.roles.includes('admin_tambun_raya');
            isKatim = isKatim || payload.roles.includes('katim');
          }
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    // Cek dari user object
    if (session.user) {
      const user = session.user;
      
      // Cek roles array
      if (user.roles && Array.isArray(user.roles)) {
        roles = [...roles, ...user.roles];
        isAdmin = isAdmin || user.roles.includes('admin_tambun_raya');
        isKatim = isKatim || user.roles.includes('katim');
      }
      
      // Cek dari email/username
      if (user.email === 'admin_tambun_raya' || user.preferred_username === 'admin_tambun_raya') {
        isAdmin = true;
      }
      if (user.email === 'katim' || user.preferred_username === 'katim') {
        isKatim = true;
      }
      
      // Cek dari custom field
      if (user.isAdminTambunRaya === true) {
        isAdmin = true;
      }
      if (user.isKatim === true) {
        isKatim = true;
      }
    }

    // Hapus duplikasi roles
    roles = [...new Set(roles)];

    console.log('🔐 User roles:', roles);
    console.log('🔐 isAdmin:', isAdmin);
    console.log('🔐 isKatim:', isKatim);

    return { isAdmin, isKatim, roles };
  }, [session]);

  const isAdminTambunRaya = userRoles.isAdmin;
  const isKatim = userRoles.isKatim;
  
  // Tentukan apakah user bisa melakukan operasi tulis (edit/delete)
  const canWrite = isAdminTambunRaya; // Hanya admin yang bisa write
  const canView = true; // Semua user bisa view

  // Log role untuk debugging
  useEffect(() => {
    console.log('👑 isAdminTambunRaya:', isAdminTambunRaya);
    console.log('👥 isKatim:', isKatim);
    console.log('📝 canWrite:', canWrite);
  }, [isAdminTambunRaya, isKatim, canWrite]);

  // ========== STATE MANAGEMENT ==========
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataPegawai, setDataPegawai] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedPegawai, setSelectedPegawai] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    tidakAktif: 0,
    byJabatan: [],
    byJenjang: [],
    byFungsi: [],
    byPeran: []
  });

  // State untuk pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // State untuk sorter
  const [sorter, setSorter] = useState({
    field: 'nama',
    order: 'ascend'
  });

  // State untuk form edit
  const [formEdit] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // State untuk modal
  const [modalTambah, setModalTambah] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);
  const [modalAnalisis, setModalAnalisis] = useState(false);

  // State untuk filter
  const [filters, setFilters] = useState({
    is_active: '',
    id_fungsi: '',
    id_jabatan: '',
    id_jenjang: '',
    search: ''
  });

  // State untuk opsi dropdown
  const [options, setOptions] = useState({
    jabatan: [],
    jenjang: [],
    fungsi: [],
    peran: []
  });

  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState('table');

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/pegawai`;

  // ========== GET TOKEN HELPER ==========
  const getToken = useCallback(() => {
    if (session?.accessToken) {
      return session.accessToken;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  }, [session]);

  // ========== FETCH DATA PEGAWAI ==========
  const fetchDataPegawai = useCallback(async (showMessage = true) => {
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login kembali.');
      }

      console.log('Fetching from:', API_URL);

      // TAMBAHKAN PARAMETER UNTUK MEMINTA SEMUA DATA
      // Tambahkan query parameter untuk memastikan API mengembalikan semua data
      const url = new URL(API_URL, window.location.origin);
      url.searchParams.append('all', 'true'); // Minta semua data
      url.searchParams.append('role', 'katim'); // Kirim role untuk logging di server
      
      console.log('Fetching URL with params:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi telah berakhir. Silakan login kembali.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        const data = result.data || [];
        console.log(`📊 Data diterima: ${data.length} pegawai`);
        
        // Debug: tampilkan sample data
        if (data.length > 0) {
          console.log('Sample data pertama:', data[0]);
        }
        
        setDataPegawai(data);
        setFilteredData(data);
        setPagination(prev => ({
          ...prev,
          total: data.length
        }));

        calculateStats(data);

        if (showMessage) {
          message.success(`Data pegawai berhasil dimuat (${data.length} pegawai)`);
        }
      } else {
        throw new Error(result.message || 'Gagal memuat data pegawai');
      }
    } catch (error) {
      console.error('Error fetching pegawai:', error);
      message.error(error.message || 'Gagal memuat data pegawai');
      
      setDataPegawai([]);
      setFilteredData([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [API_URL, getToken]);

  // ========== FETCH OPTIONS ==========
  const fetchOptions = useCallback(async () => {
    try {
      const token = getToken();
      
      if (!token) {
        console.warn('Token tidak ditemukan untuk fetch options');
        return;
      }

      // TAMBAHKAN PARAMETER UNTUK MEMINTA SEMUA DATA
      const url = new URL(`${API_URL}/options/all`, window.location.origin);
      url.searchParams.append('all', 'true');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setOptions(result.data);
        console.log('Fetched options:', result.data);
      } else {
        throw new Error(result.message || 'Gagal memuat data opsi');
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  }, [API_URL, getToken]);

  // ========== CALCULATE STATISTICS ==========
  const calculateStats = useCallback((dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      setStats({
        total: 0,
        aktif: 0,
        tidakAktif: 0,
        byJabatan: [],
        byJenjang: [],
        byFungsi: [],
        byPeran: []
      });
      return;
    }

    const aktif = dataArray.filter(item => item.is_active === 1 || item.is_active === true).length;
    const tidakAktif = dataArray.length - aktif;

    const byJabatan = {};
    const byJenjang = {};
    const byFungsi = {};
    const byPeran = {};

    dataArray.forEach(item => {
      const jabatanName = item.nama_jabatan || item.jabatan;
      if (jabatanName) {
        byJabatan[jabatanName] = (byJabatan[jabatanName] || 0) + 1;
      }

      const jenjangName = item.nama_jenjang || item.jenjang;
      if (jenjangName) {
        byJenjang[jenjangName] = (byJenjang[jenjangName] || 0) + 1;
      }

      const fungsiName = item.nama_fungsi || item.fungsi;
      if (fungsiName) {
        byFungsi[fungsiName] = (byFungsi[fungsiName] || 0) + 1;
      }

      if (item.nama_peran) {
        const peranList = item.nama_peran.split(', ');
        peranList.forEach(peran => {
          if (peran && peran.trim()) {
            byPeran[peran] = (byPeran[peran] || 0) + 1;
          }
        });
      }
    });

    const total = dataArray.length;

    const formatStats = (obj) => Object.entries(obj).map(([key, value]) => ({
      name: key,
      total: value,
      persentase: ((value / total) * 100).toFixed(1)
    })).sort((a, b) => b.total - a.total);

    setStats({
      total: dataArray.length,
      aktif,
      tidakAktif,
      byJabatan: formatStats(byJabatan),
      byJenjang: formatStats(byJenjang),
      byFungsi: formatStats(byFungsi),
      byPeran: formatStats(byPeran)
    });
  }, []);

  // ========== UNIQUE VALUES FOR FILTERS ==========
  const uniqueValues = useMemo(() => {
    if (!Array.isArray(dataPegawai) || dataPegawai.length === 0) {
      return {
        jabatan: [],
        jenjang: [],
        fungsi: [],
        peran: []
      };
    }

    const jabatanSet = new Set();
    const jenjangSet = new Set();
    const fungsiSet = new Set();
    const peranSet = new Set();

    dataPegawai.forEach(item => {
      if (item.nama_jabatan) jabatanSet.add(item.nama_jabatan);
      if (item.nama_jenjang) jenjangSet.add(item.nama_jenjang);
      if (item.nama_fungsi) fungsiSet.add(item.nama_fungsi);
      if (item.nama_peran) {
        const peranList = item.nama_peran.split(', ');
        peranList.forEach(peran => {
          if (peran && peran.trim()) {
            peranSet.add(peran.trim());
          }
        });
      }
    });

    return {
      jabatan: Array.from(jabatanSet).sort((a, b) => a.localeCompare(b)),
      jenjang: Array.from(jenjangSet).sort((a, b) => a.localeCompare(b)),
      fungsi: Array.from(fungsiSet).sort((a, b) => a.localeCompare(b)),
      peran: Array.from(peranSet).sort((a, b) => a.localeCompare(b))
    };
  }, [dataPegawai]);

  // ========== APPLY FILTERS ==========
  const applyFilters = useCallback(() => {
    if (!Array.isArray(dataPegawai) || dataPegawai.length === 0) {
      setFilteredData([]);
      setPagination(prev => ({ ...prev, current: 1, total: 0 }));
      return;
    }

    console.log('Applying filters, total data:', dataPegawai.length);
    
    let filtered = [...dataPegawai];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableFields = [
          item.nip,
          item.nama,
          item.email,
          item.nama_jabatan,
          item.nama_jenjang,
          item.nama_fungsi,
          item.nama_peran
        ];
        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.id_jabatan) {
      filtered = filtered.filter(item => item.id_jabatan === parseInt(filters.id_jabatan));
    }

    if (filters.id_jenjang) {
      filtered = filtered.filter(item => item.id_jenjang === parseInt(filters.id_jenjang));
    }

    if (filters.id_fungsi) {
      filtered = filtered.filter(item => item.id_fungsi === parseInt(filters.id_fungsi));
    }

    if (filters.is_active !== '' && filters.is_active !== undefined) {
      const isActive = filters.is_active === 'true' || filters.is_active === true;
      filtered = filtered.filter(item => item.is_active === isActive);
    }

    if (sorter.field) {
      filtered.sort((a, b) => {
        let valA = a[sorter.field];
        let valB = b[sorter.field];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

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

    console.log('Filtered data:', filtered.length);
    setFilteredData(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
    setSelectedRowKeys([]);
  }, [dataPegawai, filters, sorter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (session || !session) {
      fetchDataPegawai(false);
      fetchOptions();
    }
  }, [session, fetchDataPegawai, fetchOptions]);

  // ========== HANDLERS ==========
  const handleFilter = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilter = () => {
    setFilters({
      is_active: '',
      id_fungsi: '',
      id_jabatan: '',
      id_jenjang: '',
      search: ''
    });
    setSorter({
      field: 'nama',
      order: 'ascend'
    });
    message.info('Semua filter telah direset');
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

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // ========== HANDLE EDIT ==========
  const handleEdit = (record) => {
    if (!canWrite) {
      message.error('Anda tidak memiliki izin untuk mengedit data pegawai. Hanya admin_tambun_raya yang diizinkan.');
      return;
    }

    setSelectedPegawai(record);

    const formValues = {
      ...record,
      id_peran: record.id_peran
    };

    if (typeof record.id_peran === 'string' && record.id_peran.includes(',')) {
      formValues.id_peran = record.id_peran.split(',').map(id => parseInt(id.trim()));
    }

    formEdit.setFieldsValue(formValues);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await formEdit.validateFields();
      setEditLoading(true);
      
      const token = getToken();

      const response = await fetch(`${API_URL}/${selectedPegawai.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const result = await response.json();

      if (result.success) {
        message.success('Pegawai berhasil diupdate');
        formEdit.resetFields();
        setEditModalVisible(false);
        fetchDataPegawai(false);
      } else {
        throw new Error(result.message || 'Gagal mengupdate pegawai');
      }
    } catch (error) {
      message.error(`Gagal mengupdate pegawai: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // ========== HANDLE HAPUS ==========
  const handleHapus = (record) => {
    if (!canWrite) {
      message.error('Anda tidak memiliki izin untuk menonaktifkan pegawai. Hanya admin_tambun_raya yang diizinkan.');
      return;
    }

    confirm({
      title: 'Konfirmasi Hapus',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p>Apakah Anda yakin ingin menonaktifkan pegawai berikut?</p>
          <div style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 4,
            marginTop: 8
          }}>
            <p><strong>NIP:</strong> {record.nip}</p>
            <p><strong>Nama:</strong> {record.nama}</p>
            <p><strong>Jabatan:</strong> {record.nama_jabatan}</p>
          </div>
          <p style={{ marginTop: 16, color: '#ff4d4f' }}>
            <small>* Pegawai yang dinonaktifkan tidak akan muncul dalam daftar aktif</small>
          </p>
        </div>
      ),
      okText: 'Ya, Nonaktifkan',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          setLoading(true);
          
          const token = getToken();

          const response = await fetch(`${API_URL}/${record.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();

          if (result.success) {
            message.success('Pegawai berhasil dinonaktifkan');
            fetchDataPegawai(false);
          } else {
            throw new Error(result.message || 'Gagal menonaktifkan pegawai');
          }
        } catch (error) {
          message.error(`Gagal menonaktifkan pegawai: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleTambah = () => {
    if (!canWrite) {
      message.error('Anda tidak memiliki izin untuk menambah pegawai. Hanya admin_tambun_raya yang diizinkan.');
      return;
    }
    setSelectedPegawai(null);
    setModalTambah(true);
  };

  const handleDetail = (record) => {
    setSelectedPegawai(record);
    setModalDetail(true);
  };

  const handleAnalisis = (record) => {
    setSelectedPegawai(record);
    setModalAnalisis(true);
  };

  const handleSubmitSuccess = () => {
    fetchDataPegawai(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    message.info('Fitur export sedang dalam pengembangan');
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
      title: 'NIP',
      dataIndex: 'nip',
      key: 'nip',
      width: 120,
      sorter: true,
      render: (text) => (
        <Tag color="geekblue" style={{ borderRadius: 12, fontFamily: 'monospace' }}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      width: 200,
      sorter: true,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{text || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
        </Space>
      )
    },
    {
      title: 'Jabatan',
      dataIndex: 'nama_jabatan',
      key: 'jabatan',
      width: 150,
      sorter: true,
      render: (text) => (
        <Tag color="orange" style={{ borderRadius: 12 }} icon={<ProfileOutlined />}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Jenjang',
      dataIndex: 'nama_jenjang',
      key: 'jenjang',
      width: 120,
      sorter: true,
      render: (text) => (
        <Tag color="cyan" style={{ borderRadius: 12 }} icon={<ApartmentOutlined />}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Fungsi',
      dataIndex: 'nama_fungsi',
      key: 'fungsi',
      width: 150,
      sorter: true,
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: 12 }} icon={<ApartmentOutlined />}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Peran',
      dataIndex: 'nama_peran',
      key: 'peran',
      width: 200,
      render: (text) => {
        if (!text) return '-';
        const peranList = text.split(', ');
        return (
          <Space wrap size={[4, 4]}>
            {peranList.map((peran, index) => (
              <Tag color="green" key={index} style={{ borderRadius: 12 }}>
                {peran}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      align: 'center',
      sorter: true,
      render: (is_active) => (
        <Badge
          status={is_active ? 'success' : 'error'}
          text={is_active ? 'Aktif' : 'Tidak Aktif'}
        />
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="Detail">
            <Button
              icon={<EyeOutlined />}
              size="small"
              shape="circle"
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          <Tooltip title={!canWrite ? "Hanya admin_tambun_raya yang dapat mengedit" : "Edit"}>
            <Button
              icon={<EditOutlined />}
              size="small"
              shape="circle"
              type="primary"
              ghost
              onClick={() => handleEdit(record)}
              disabled={!canWrite}
            />
          </Tooltip>
          <Tooltip title="Analisis Kenaikan">
            <Button
              icon={<BarChartOutlined />}
              size="small"
              shape="circle"
              onClick={() => handleAnalisis(record)}
            />
          </Tooltip>
          <Tooltip title={!canWrite ? "Hanya admin_tambun_raya yang dapat menonaktifkan" : "Nonaktifkan"}>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              shape="circle"
              danger
              onClick={() => handleHapus(record)}
              disabled={!record.is_active || !canWrite}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // ========== RENDER STATISTICS TAB ==========
  const renderStatisticsTab = () => (
    <div className="statistics-container">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <StatCard
                title="Total Pegawai"
                value={stats.total}
                icon={<TeamOutlined />}
                color="blue"
                subtitle="Seluruh pegawai"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Aktif"
                value={stats.aktif}
                icon={<UserOutlined />}
                color="green"
                subtitle="Pegawai aktif"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Tidak Aktif"
                value={stats.tidakAktif}
                icon={<UserOutlined />}
                color="orange"
                subtitle="Pegawai non-aktif"
                loading={loading}
              />
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#fa8c16' }} />
                <Text strong>Distribusi per Jabatan (Top 5)</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byJabatan.length > 0 ? (
              stats.byJabatan.slice(0, 5).map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar size={24} style={{ backgroundColor: '#fa8c16' }}>
                          {item.total}
                        </Avatar>
                        <Text strong>{item.name}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color="orange">{item.persentase}%</Tag>
                    </Col>
                  </Row>
                </div>
              ))
            ) : (
              <Empty description="Belum ada data jabatan" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#13c2c2' }} />
                <Text strong>Distribusi per Jenjang (Top 5)</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byJenjang.length > 0 ? (
              stats.byJenjang.slice(0, 5).map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar size={24} style={{ backgroundColor: '#13c2c2' }}>
                          {item.total}
                        </Avatar>
                        <Text strong>{item.name}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color="cyan">{item.persentase}%</Tag>
                    </Col>
                  </Row>
                </div>
              ))
            ) : (
              <Empty description="Belum ada data jenjang" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <Text strong>Distribusi per Fungsi (Top 5)</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byFungsi.length > 0 ? (
              stats.byFungsi.slice(0, 5).map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar size={24} style={{ backgroundColor: '#722ed1' }}>
                          {item.total}
                        </Avatar>
                        <Text strong>{item.name}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color="purple">{item.persentase}%</Tag>
                    </Col>
                  </Row>
                </div>
              ))
            ) : (
              <Empty description="Belum ada data fungsi" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#52c41a' }} />
                <Text strong>Distribusi per Peran (Top 5)</Text>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {stats.byPeran.length > 0 ? (
              stats.byPeran.slice(0, 5).map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar size={24} style={{ backgroundColor: '#52c41a' }}>
                          {item.total}
                        </Avatar>
                        <Text strong>{item.name}</Text>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color="green">{item.persentase}%</Tag>
                    </Col>
                  </Row>
                </div>
              ))
            ) : (
              <Empty description="Belum ada data peran" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  // ========== DEBUG BUTTON ==========
  const handleDebug = () => {
    console.log('🔍 DEBUG INFO ==========');
    console.log('Session:', session);
    console.log('User Roles:', userRoles);
    console.log('isAdminTambunRaya:', isAdminTambunRaya);
    console.log('isKatim:', isKatim);
    console.log('canWrite:', canWrite);
    console.log('Data Pegawai:', dataPegawai);
    console.log('Data Length:', dataPegawai.length);
    console.log('Filtered Data:', filteredData);
    console.log('Filtered Length:', filteredData.length);
    console.log('Stats:', stats);
    console.log('Options:', options);
    console.log('========================');
    
    message.info('Data debug telah dicetak ke console (F12)');
  };

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
          Memuat data pegawai...
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
      <div className="pegawai-container">
        <style jsx global>{`
          .pegawai-container {
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
                  icon={<TeamOutlined />}
                  style={{
                    backgroundColor: '#1890ff',
                    boxShadow: '0 8px 16px rgba(24,144,255,0.3)'
                  }}
                />
                <div>
                  <Space align="center" size={16}>
                    <div>
                      <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                        Manajemen Pegawai
                      </Title>
                      <Text type="secondary">
                        Kelola data pegawai dan analisis kompetensi
                      </Text>
                    </div>
                    {isAdminTambunRaya && (
                      <Tag
                        icon={<CrownOutlined />}
                        color="gold"
                        style={{ 
                          borderRadius: 20, 
                          padding: '4px 12px',
                          fontWeight: 500,
                          fontSize: 12
                        }}
                      >
                        Admin Tambun Raya
                      </Tag>
                    )}
                    {isKatim && !isAdminTambunRaya && (
                      <Tag
                        icon={<EyeOutlined />}
                        color="blue"
                        style={{ 
                          borderRadius: 20, 
                          padding: '4px 12px',
                          fontWeight: 500,
                          fontSize: 12
                        }}
                      >
                        Ketua Tim (View Only)
                      </Tag>
                    )}
                    {!isAdminTambunRaya && !isKatim && (
                      <Tag
                        icon={<UserOutlined />}
                        color="default"
                        style={{ 
                          borderRadius: 20, 
                          padding: '4px 12px',
                          fontWeight: 500,
                          fontSize: 12
                        }}
                      >
                        User Biasa
                      </Tag>
                    )}
                  </Space>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size={4}>
                <Tooltip title="Refresh Data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchDataPegawai(true)}
                    loading={loading}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Export Data">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Cetak">
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Debug Info">
                  <Button
                    icon={<SecurityScanOutlined />}
                    onClick={handleDebug}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title={!canWrite ? "Hanya admin_tambun_raya yang dapat menambah pegawai" : "Tambah Pegawai"}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleTambah}
                    disabled={!canWrite}
                    style={{ borderRadius: 8 }}
                  >
                    Tambah Pegawai
                  </Button>
                </Tooltip>
              </Space>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <StatCard
                title="Total Pegawai"
                value={stats.total}
                icon={<TeamOutlined />}
                color="blue"
                subtitle="Seluruh pegawai"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Aktif"
                value={stats.aktif}
                icon={<UserOutlined />}
                color="green"
                subtitle="Pegawai aktif"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Tidak Aktif"
                value={stats.tidakAktif}
                icon={<UserOutlined />}
                color="orange"
                subtitle="Pegawai non-aktif"
                loading={loading}
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
                  Daftar Pegawai
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
                onFilter={handleFilter}
                onReset={handleResetFilter}
                options={options}
                uniqueValues={uniqueValues}
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
                    </Radio.Group>
                    {selectedRowKeys.length > 0 && (
                      <Tag color="blue" style={{ borderRadius: 12, padding: '4px 12px' }}>
                        {selectedRowKeys.length} data dipilih
                      </Tag>
                    )}
                    
                    {/* Info jumlah data */}
                    <Tag color="geekblue" style={{ borderRadius: 12 }}>
                      Total Data: {dataPegawai.length} pegawai
                    </Tag>
                  </Space>
                </Col>
                {!canWrite && (
                  <Col>
                    <Tag 
                      icon={isKatim ? <EyeOutlined /> : <LockOutlined />} 
                      color={isKatim ? 'blue' : 'warning'} 
                      style={{ borderRadius: 20 }}
                    >
                      {isKatim 
                        ? 'Mode Baca - Ketua Tim (View Only)' 
                        : 'Mode Baca - Hanya admin_tambun_raya yang dapat mengubah data'}
                    </Tag>
                  </Col>
                )}
              </Row>

              {/* Table */}
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
                  onDoubleClick: () => handleDetail(record),
                  style: { cursor: 'pointer' }
                })}
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                  columnWidth: 48
                }}
                rowKey="id"
                scroll={{ x: 1600, y: 'calc(100vh - 450px)' }}
                style={{ borderRadius: 12, overflow: 'hidden' }}
              />
            </>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && renderStatisticsTab()}
        </Card>

        {/* MODAL TAMBAH */}
        <ModalTambahPegawai
          visible={modalTambah}
          onCancel={() => setModalTambah(false)}
          onSuccess={handleSubmitSuccess}
          options={options}
          session={session}
        />

        {/* MODAL EDIT */}
        <Modal
          title="Edit Pegawai"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            formEdit.resetFields();
          }}
          onOk={handleEditSubmit}
          confirmLoading={editLoading}
          width={700}
          okText="Simpan Perubahan"
          cancelText="Batal"
        >
          <PegawaiForm
            form={formEdit}
            options={options}
            isEditing={true}
            initialValues={selectedPegawai}
          />
        </Modal>

        {/* MODAL DETAIL */}
        <ModalDetailPegawai
          visible={modalDetail}
          onCancel={() => setModalDetail(false)}
          selectedPegawai={selectedPegawai}
          session={session}
        />

        {/* MODAL ANALISIS */}
        <ModalAnalisisKenaikan
          visible={modalAnalisis}
          onCancel={() => setModalAnalisis(false)}
          selectedPegawai={selectedPegawai}
          options={options}
          session={session}
        />
      </div>
    </ConfigProvider>
  );
};

export default PegawaiContainer;