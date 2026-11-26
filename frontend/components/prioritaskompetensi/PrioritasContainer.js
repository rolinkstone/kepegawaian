// components/prioritaskompetensi/PrioritasContainer.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Modal,
  Radio,
  Tabs,
  Tooltip,
  message
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ClearOutlined
} from '@ant-design/icons';
import {
  fetchPrioritasKompetensi,
  updatePrioritasKompetensi,
  bulkUpdatePrioritasKompetensi,
  fetchFilterOptions,
  fetchOpsiKompetensi
} from './api/prioritasKompetensiApi';
import PrioritasRekapTab from './PrioritasRekapTab';
import PrioritasRekapPegawaiTab from './PrioritasRekapPegawaiTab';
import PrioritasGrafikTab from './PrioritasGrafikTab';

const { Title, Text } = Typography;

const PRIORITAS_VALUES = ['Mutlak', 'Perlu', 'Penting'];

const PRIORITAS_META = {
  Mutlak: { color: 'red' },
  Perlu: { color: 'orange' },
  Penting: { color: 'gold' }
};

const PRIORITAS_OPTIONS = PRIORITAS_VALUES.map(value => ({ value, label: value }));

const rowKeyOf = (record) => `${record.id_user}::${record.id_kompetensi}`;

const PrioritasContainer = ({ session }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    mutlak: 0,
    perlu: 0,
    penting: 0,
    belum_diisi: 0
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    id_jabatan: undefined,
    id_jenjang: undefined,
    id_fungsi: undefined,
    id_kompetensi: [],
    prioritas: undefined
  });
  const [searchInput, setSearchInput] = useState('');
  const [options, setOptions] = useState({ jabatan: [], jenjang: [], fungsi: [], kompetensi: [] });
  const [savingKey, setSavingKey] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkModal, setBulkModal] = useState({ open: false, prioritas: 'Mutlak', saving: false });
  const [activeTab, setActiveTab] = useState('data');

  // ========== FETCH DATA ==========
  const fetchData = useCallback(async (showMessage = false) => {
    if (!session) return;

    setLoading(true);
    try {
      const result = await fetchPrioritasKompetensi(session, {
        search: filters.search,
        id_jabatan: filters.id_jabatan,
        id_jenjang: filters.id_jenjang,
        id_fungsi: filters.id_fungsi,
        id_kompetensi: filters.id_kompetensi.length > 0 ? filters.id_kompetensi.join(',') : undefined,
        prioritas: filters.prioritas,
        page: pagination.current,
        pageSize: pagination.pageSize
      });

      if (result.success) {
        setData(result.data || []);
        setSummary(result.summary || {
          total: 0, mutlak: 0, perlu: 0, penting: 0, belum_diisi: 0
        });
        setPagination(prev => ({ ...prev, total: result.total || 0 }));

        if (showMessage) {
          message.success(`Data dimuat (${result.total || 0} baris)`);
        }
      } else {
        message.error(result.message || 'Gagal memuat data prioritas kompetensi');
      }
    } catch (error) {
      console.error('❌ Error memuat prioritas kompetensi:', error);
      message.error(error.message || 'Gagal memuat data prioritas kompetensi');
    } finally {
      setLoading(false);
    }
  }, [
    session,
    filters.search,
    filters.id_jabatan,
    filters.id_jenjang,
    filters.id_fungsi,
    filters.id_kompetensi,
    filters.prioritas,
    pagination.current,
    pagination.pageSize
  ]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    (async () => {
      try {
        const result = await fetchFilterOptions(session);
        if (active) setOptions(result);
      } catch (error) {
        console.error('❌ Gagal memuat opsi filter:', error);
      }
    })();

    return () => { active = false; };
  }, [session]);

  // Saat filter fungsi berubah, sempitkan daftar kompetensi yang bisa dipilih
  // dan buang pilihan kompetensi yang tidak lagi relevan.
  useEffect(() => {
    if (!session) return;

    let active = true;
    (async () => {
      try {
        const list = await fetchOpsiKompetensi(
          session,
          filters.id_fungsi ? { id_fungsi: filters.id_fungsi } : {}
        );
        if (!active) return;

        const availableIds = new Set(list.map(item => item.id));
        setOptions(prev => ({ ...prev, kompetensi: list }));
        setFilters(prev => {
          if (prev.id_kompetensi.length === 0) return prev;
          const kept = prev.id_kompetensi.filter(id => availableIds.has(id));
          return kept.length === prev.id_kompetensi.length
            ? prev
            : { ...prev, id_kompetensi: kept };
        });
      } catch (error) {
        console.error('❌ Gagal memuat opsi kompetensi:', error);
      }
    })();

    return () => { active = false; };
  }, [session, filters.id_fungsi]);

  // Debounce pencarian nama/NIP
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ========== HANDLERS ==========
  const handleFilterChange = (name, value) => {
    setPagination(prev => ({ ...prev, current: 1 }));
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setPagination(prev => ({ ...prev, current: 1 }));
    setFilters({
      search: '',
      id_jabatan: undefined,
      id_jenjang: undefined,
      id_fungsi: undefined,
      id_kompetensi: [],
      prioritas: undefined
    });
    setSelectedRowKeys([]);
  };

  const handleInlineSave = async (record, value) => {
    const key = rowKeyOf(record);
    setSavingKey(key);

    try {
      const result = await updatePrioritasKompetensi(session, {
        id_user: record.id_user,
        id_kompetensi: record.id_kompetensi,
        prioritas: value ?? null
      });

      if (result.success) {
        message.success(result.message || 'Prioritas disimpan');
        await fetchData(false);
      } else {
        message.error(result.message || 'Gagal menyimpan prioritas');
      }
    } catch (error) {
      console.error('❌ Error menyimpan prioritas:', error);
      message.error(error.message || 'Gagal menyimpan prioritas');
    } finally {
      setSavingKey(null);
    }
  };

  const handleBulkSave = async () => {
    if (selectedRowKeys.length === 0) return;

    const items = selectedRowKeys.map(key => {
      const [idUser, idKompetensi] = key.split('::');
      return { id_user: Number(idUser), id_kompetensi: Number(idKompetensi) };
    });

    setBulkModal(prev => ({ ...prev, saving: true }));

    try {
      const result = await bulkUpdatePrioritasKompetensi(session, items, bulkModal.prioritas);

      if (result.success) {
        message.success(result.message || 'Prioritas berhasil diterapkan');
        setBulkModal({ open: false, prioritas: 'Mutlak', saving: false });
        setSelectedRowKeys([]);
        await fetchData(false);
      } else {
        message.error(result.message || 'Gagal menerapkan prioritas');
        setBulkModal(prev => ({ ...prev, saving: false }));
      }
    } catch (error) {
      console.error('❌ Error bulk prioritas:', error);
      message.error(error.message || 'Gagal menerapkan prioritas');
      setBulkModal(prev => ({ ...prev, saving: false }));
    }
  };

  // ========== OPSI FILTER ==========
  const kompetensiOptions = options.kompetensi.map(item => ({
    value: item.id,
    label: `${item.kode_kompetensi} — ${item.nama_kompetensi}${item.nama_fungsi ? ` (${item.nama_fungsi})` : ''}`
  }));

  // ========== KOLOM TABEL ==========
  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <Text type="secondary">
          {((pagination.current - 1) * pagination.pageSize + index + 1).toString().padStart(3, '0')}
        </Text>
      )
    },
    {
      title: 'Pegawai',
      key: 'pegawai',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.nama_pegawai}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.nip}</Text>
        </Space>
      )
    },
    {
      title: 'Jabatan',
      dataIndex: 'nama_jabatan',
      key: 'nama_jabatan',
      width: 160,
      render: (text) => text ? <Tag color="orange">{text}</Tag> : '-'
    },
    {
      title: 'Jenjang',
      dataIndex: 'nama_jenjang',
      key: 'nama_jenjang',
      width: 150,
      render: (text) => text ? <Tag color="processing">{text}</Tag> : '-'
    },
    {
      title: 'Fungsi',
      dataIndex: 'nama_fungsi',
      key: 'nama_fungsi',
      width: 150,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-'
    },
    {
      title: 'Kompetensi',
      key: 'kompetensi',
      width: 320,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={6} wrap>
            <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{record.kode_kompetensi}</Tag>
            <Text strong style={{ fontSize: 13 }}>{record.nama_kompetensi}</Text>
            {Boolean(record.is_mandatory) && <Tag color="volcano">Wajib</Tag>}
          </Space>
          {record.nama_peran && (
            <Text type="secondary" style={{ fontSize: 12 }}>Peran: {record.nama_peran}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Prioritas',
      key: 'prioritas',
      width: 160,
      render: (_, record) => {
        const key = rowKeyOf(record);
        return (
          <Select
            size="small"
            allowClear
            placeholder="Belum diisi"
            style={{ width: 140 }}
            value={record.prioritas || undefined}
            options={PRIORITAS_OPTIONS}
            loading={savingKey === key}
            disabled={savingKey === key}
            onChange={(value) => handleInlineSave(record, value)}
          />
        );
      }
    },
    {
      title: 'Diisi Oleh',
      key: 'diisi_oleh',
      width: 170,
      render: (_, record) => (
        record.prioritas ? (
          <Space direction="vertical" size={0}>
            <Text>{record.diisi_oleh || '-'}</Text>
            {record.prioritas_updated_at && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(record.prioritas_updated_at).toLocaleString('id-ID')}
              </Text>
            )}
          </Space>
        ) : <Text type="secondary">-</Text>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>Prioritas Kompetensi</Title>
            <Text type="secondary">
              Penetapan prioritas kebutuhan kompetensi pegawai: Mutlak, Perlu, atau Penting.
            </Text>
          </Col>
        </Row>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'data',
            label: 'Data Prioritas',
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic title="Total Baris" value={summary.total} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Tag color="red">Mutlak</Tag>}
              value={summary.mutlak}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Tag color="orange">Perlu</Tag>}
              value={summary.perlu}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Tag color="gold">Penting</Tag>}
              value={summary.penting}
              valueStyle={{ color: '#d4b106' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Belum Diisi"
              value={summary.belum_diisi}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari nama pegawai / NIP"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Jabatan"
              value={filters.id_jabatan}
              onChange={(value) => handleFilterChange('id_jabatan', value)}
              options={options.jabatan.map(item => ({ value: item.id, label: item.nama_jabatan }))}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Jenjang"
              value={filters.id_jenjang}
              onChange={(value) => handleFilterChange('id_jenjang', value)}
              options={options.jenjang.map(item => ({ value: item.id, label: item.nama_jenjang }))}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Fungsi"
              value={filters.id_fungsi}
              onChange={(value) => handleFilterChange('id_fungsi', value)}
              options={options.fungsi.map(item => ({ value: item.id, label: item.nama_fungsi }))}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Prioritas"
              value={filters.prioritas}
              onChange={(value) => handleFilterChange('prioritas', value)}
              options={[
                { value: 'belum', label: 'Belum diisi' },
                ...PRIORITAS_OPTIONS
              ]}
            />
          </Col>
          <Col xs={24} md={3}>
            <Space>
              <Tooltip title="Muat ulang data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchData(true)}
                  loading={loading}
                />
              </Tooltip>
              <Tooltip title="Reset filter">
                <Button icon={<ClearOutlined />} onClick={handleResetFilter}>
                  Reset
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={14}>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Kompetensi (bisa pilih lebih dari satu)"
              value={filters.id_kompetensi}
              onChange={(value) => handleFilterChange('id_kompetensi', value || [])}
              options={kompetensiOptions}
              showSearch
              optionFilterProp="label"
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={10}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {filters.id_kompetensi.length > 0
                ? `${filters.id_kompetensi.length} kompetensi dipilih — data dibatasi ke kompetensi tersebut.`
                : `Filter kompetensi: ${options.kompetensi.length} kompetensi tersedia.`}
            </Text>
          </Col>
        </Row>

        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Text type="secondary">
              {selectedRowKeys.length > 0
                ? `${selectedRowKeys.length} baris dipilih`
                : 'Centang beberapa baris untuk mengisi prioritas sekaligus (bulk).'}
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={() => setBulkModal({ open: true, prioritas: 'Mutlak', saving: false })}
            >
              Terapkan Prioritas{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
            </Button>
          </Col>
        </Row>

        <Table
          rowKey={rowKeyOf}
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys) => setSelectedRowKeys(keys)
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} baris`,
            onChange: (current, pageSize) => {
              setPagination(prev => ({ ...prev, current, pageSize }));
            }
          }}
        />
      </Card>
              </>
            )
          },
          {
            key: 'grafik',
            label: 'Grafik',
            children: <PrioritasGrafikTab session={session} options={options} />
          },
          {
            key: 'rekap',
            label: 'Rekap per Kompetensi',
            children: <PrioritasRekapTab session={session} options={options} />
          },
          {
            key: 'rekap-pegawai',
            label: 'Rekap per Pegawai',
            children: <PrioritasRekapPegawaiTab session={session} options={options} />
          }
        ]}
      />

      <Modal
        open={bulkModal.open}
        title="Terapkan Prioritas (Bulk)"
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={bulkModal.saving}
        onOk={handleBulkSave}
        onCancel={() => setBulkModal({ open: false, prioritas: 'Mutlak', saving: false })}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Text>
            Prioritas akan diterapkan ke <strong>{selectedRowKeys.length} baris</strong> terpilih.
            Nilai prioritas yang sudah ada akan ditimpa.
          </Text>
          <Radio.Group
            value={bulkModal.prioritas}
            onChange={(e) => setBulkModal(prev => ({ ...prev, prioritas: e.target.value }))}
          >
            <Space direction="vertical">
              {PRIORITAS_VALUES.map(value => (
                <Radio key={value} value={value}>
                  <Tag color={PRIORITAS_META[value].color}>{value}</Tag>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Space>
      </Modal>
    </div>
  );
};

export default PrioritasContainer;
