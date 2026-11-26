// components/prioritaskompetensi/PrioritasGrafikTab.js
// Tab "Grafik": sebaran prioritas dilihat dari sisi KOMPETENSI.
//
// Grafik menampilkan NAMA KOMPETENSI saja (sumbu Y) dengan batang bertumpuk
// Mutlak / Perlu / Penting / Belum diisi. Tabel di bawahnya menjawab pertanyaan
// "kompetensi mana yang sudah / belum dipetakan ke Mutlak, Perlu, Penting".
// Klik salah satu batang untuk menyaring tabel ke kompetensi tersebut.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Empty,
  Tooltip,
  Segmented,
  message
} from 'antd';
import {
  ReloadOutlined,
  ClearOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { fetchGrafikKompetensi } from './api/prioritasKompetensiApi';

const { Title, Text } = Typography;

// Satu sumber warna untuk grafik, kartu ringkasan, dan tag tabel.
const SERI = [
  { key: 'jumlah_mutlak', label: 'Mutlak', color: '#cf1322', tag: 'red' },
  { key: 'jumlah_perlu', label: 'Perlu', color: '#d46b08', tag: 'orange' },
  { key: 'jumlah_penting', label: 'Penting', color: '#d4b106', tag: 'gold' },
  { key: 'jumlah_belum', label: 'Belum diisi', color: '#8c8c8c', tag: 'default' }
];

const STATUS_META = {
  belum: { label: 'Belum dipetakan', color: 'default' },
  sebagian: { label: 'Terisi sebagian', color: 'orange' },
  lengkap: { label: 'Lengkap', color: 'green' }
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'sudah', label: 'Sudah dipetakan' },
  { value: 'belum', label: 'Belum dipetakan' },
  { value: 'sebagian', label: 'Sebagian' },
  { value: 'lengkap', label: 'Lengkap' }
];

const EMPTY_SUMMARY = {
  total_kompetensi: 0,
  kompetensi_belum: 0,
  kompetensi_sebagian: 0,
  kompetensi_lengkap: 0,
  kompetensi_sudah: 0,
  baris_mutlak: 0,
  baris_perlu: 0,
  baris_penting: 0,
  baris_belum: 0
};

const DEFAULT_FILTERS = {
  search: '',
  id_jabatan: undefined,
  id_jenjang: undefined,
  id_fungsi: undefined,
  id_kompetensi: [],
  status_isi: ''
};

const CHART_LIMIT = 12;

// Nama kompetensi bisa sangat panjang; dipotong untuk sumbu Y. Nama penuh
// tetap muncul di tooltip dan di tabel.
const pendekkan = (text, maks = 38) => {
  const value = String(text || '-');
  return value.length > maks ? `${value.slice(0, maks - 1)}…` : value;
};

const PrioritasGrafikTab = ({ session, options = { jabatan: [], jenjang: [], fungsi: [], kompetensi: [] } }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [chartRows, setChartRows] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const [rows, setRows] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const [activeKompetensi, setActiveKompetensi] = useState(null);

  // ========== PARAMETER FILTER ==========
  const baseParams = useMemo(() => ({
    search: filters.search,
    id_jabatan: filters.id_jabatan,
    id_jenjang: filters.id_jenjang,
    id_fungsi: filters.id_fungsi,
    id_kompetensi: filters.id_kompetensi.length > 0 ? filters.id_kompetensi.join(',') : undefined
  }), [filters]);

  // ========== GRAFIK (top kompetensi + ringkasan) ==========
  const fetchChart = useCallback(async (showMessage = false) => {
    if (!session) return;

    setLoadingChart(true);
    try {
      const result = await fetchGrafikKompetensi(session, {
        ...baseParams,
        page: 1,
        pageSize: CHART_LIMIT
      });

      if (result.success) {
        setChartRows(result.data || []);
        setSummary({ ...EMPTY_SUMMARY, ...(result.summary || {}) });
        if (showMessage) message.success('Grafik diperbarui');
      } else {
        message.error(result.message || 'Gagal memuat grafik kompetensi');
      }
    } catch (error) {
      console.error('❌ Error memuat grafik kompetensi:', error);
      message.error(error.message || 'Gagal memuat grafik kompetensi');
    } finally {
      setLoadingChart(false);
    }
  }, [session, baseParams]);

  // ========== TABEL STATUS PEMETAAN ==========
  const fetchTable = useCallback(async (page, pageSize) => {
    if (!session) return;

    setLoadingTable(true);
    try {
      const result = await fetchGrafikKompetensi(session, {
        ...baseParams,
        status_isi: filters.status_isi || undefined,
        page,
        pageSize
      });

      if (result.success) {
        setRows(result.data || []);
        setPagination(prev => ({ ...prev, total: result.total || 0 }));
      } else {
        message.error(result.message || 'Gagal memuat daftar kompetensi');
        setRows([]);
      }
    } catch (error) {
      console.error('❌ Error memuat daftar kompetensi:', error);
      message.error(error.message || 'Gagal memuat daftar kompetensi');
      setRows([]);
    } finally {
      setLoadingTable(false);
    }
  }, [session, baseParams, filters.status_isi]);

  useEffect(() => { fetchChart(false); }, [fetchChart]);
  useEffect(() => { fetchTable(1, pagination.pageSize); }, [fetchTable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce pencarian nama/kode kompetensi
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, current: 1 }));
      setActiveKompetensi(null);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ========== HANDLERS ==========
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    setActiveKompetensi(null);
  };

  const handleReset = () => {
    setSearchInput('');
    setFilters(DEFAULT_FILTERS);
    setPagination({ current: 1, pageSize: 20, total: 0 });
    setActiveKompetensi(null);
  };

  // Klik batang grafik -> saring tabel ke satu kompetensi (klik lagi = lepas).
  const handleChartClick = (entry) => {
    const id = entry?.id_kompetensi || entry?.payload?.id_kompetensi;
    if (!id) return;

    if (activeKompetensi === id) {
      setActiveKompetensi(null);
      setFilters(prev => ({ ...prev, id_kompetensi: [] }));
      setPagination(prev => ({ ...prev, current: 1 }));
      return;
    }

    setActiveKompetensi(id);
    setFilters(prev => ({ ...prev, id_kompetensi: [id] }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // ========== OPSI FILTER ==========
  const jabatanOptions = options.jabatan.map(item => ({ value: item.id, label: item.nama_jabatan }));
  const jenjangOptions = options.jenjang.map(item => ({ value: item.id, label: item.nama_jenjang }));
  const fungsiOptions = options.fungsi.map(item => ({ value: item.id, label: item.nama_fungsi }));
  const kompetensiOptions = (options.kompetensi || []).map(item => ({
    value: item.id,
    label: `${item.kode_kompetensi} — ${item.nama_kompetensi}${item.nama_fungsi ? ` (${item.nama_fungsi})` : ''}`
  }));

  // ========== DATA GRAFIK ==========
  const chartData = chartRows.map(row => ({
    ...row,
    // label sumbu Y: nama kompetensi saja
    label: pendekkan(row.nama_kompetensi),
    nama_penuh: row.nama_kompetensi
  }));

  const totalBaris = summary.baris_mutlak + summary.baris_perlu + summary.baris_penting + summary.baris_belum;
  const persenSudah = summary.total_kompetensi > 0
    ? Math.round((summary.kompetensi_sudah / summary.total_kompetensi) * 100)
    : 0;

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
      title: 'Nama Kompetensi',
      key: 'kompetensi',
      width: 380,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={6} wrap>
            <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{record.kode_kompetensi}</Tag>
            <Text strong style={{ fontSize: 13 }}>{record.nama_kompetensi}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.nama_fungsi || '-'} · {record.jumlah_jenjang} jenjang · {record.total_pegawai} pegawai
          </Text>
        </Space>
      )
    },
    {
      title: 'Status Pemetaan',
      key: 'status',
      width: 170,
      render: (_, record) => {
        const meta = STATUS_META[record.status] || STATUS_META.belum;
        return (
          <Space direction="vertical" size={2}>
            <Tag color={meta.color}>{meta.label}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.jumlah_terisi} dari {record.total_baris} baris
            </Text>
          </Space>
        );
      }
    },
    ...SERI.map(item => ({
      title: <Tag color={item.tag}>{item.label}</Tag>,
      key: item.key,
      width: 110,
      align: 'center',
      sorter: (a, b) => Number(a[item.key] || 0) - Number(b[item.key] || 0),
      render: (_, record) => {
        const nilai = Number(record[item.key] || 0);
        return (
          <Text style={{ color: nilai > 0 ? item.color : '#bfbfbf', fontWeight: nilai > 0 ? 600 : 400 }}>
            {nilai}
          </Text>
        );
      }
    }))
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Space size={8} align="center">
              <FilterOutlined style={{ color: '#8c8c8c' }} />
              <Text strong>Filter Grafik</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Grafik dan tabel mengikuti filter ini.
              </Text>
            </Space>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xs={24} md={5}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari kode / nama kompetensi"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Jabatan"
              value={filters.id_jabatan}
              onChange={(value) => handleFilterChange('id_jabatan', value)}
              options={jabatanOptions}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Jenjang"
              value={filters.id_jenjang}
              onChange={(value) => handleFilterChange('id_jenjang', value)}
              options={jenjangOptions}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Fungsi"
              value={filters.id_fungsi}
              onChange={(value) => handleFilterChange('id_fungsi', value)}
              options={fungsiOptions}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Kompetensi"
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
          <Col xs={24} md={6}>
            <Space>
              <Tooltip title="Muat ulang grafik dan tabel">
                <Button
                  icon={<ReloadOutlined />}
                  loading={loadingChart}
                  onClick={() => {
                    fetchChart(true);
                    fetchTable(pagination.current, pagination.pageSize);
                  }}
                />
              </Tooltip>
              <Button icon={<ClearOutlined />} onClick={handleReset}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 16 }}
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>Kompetensi dengan Prioritas Terbanyak</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Klik salah satu batang untuk menyaring tabel ke kompetensi itu. Nama penuh muncul saat kursor diarahkan.
            </Text>
          </Space>
        }
        loading={loadingChart && chartData.length === 0}
      >
        <div style={{ width: '100%', height: Math.max(320, chartData.length * 44 + 80) }}>
          {chartData.length === 0 ? (
            <Empty description="Belum ada kompetensi untuk filter ini" style={{ paddingTop: 60 }} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={260}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0].payload;

                    return (
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          padding: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          maxWidth: 320
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {row.kode_kompetensi} — {row.nama_penuh}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                          {row.total_baris} baris · {row.jumlah_jenjang} jenjang · {row.total_pegawai} pegawai
                        </div>
                        {SERI.map(item => (
                          <div
                            key={item.key}
                            style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}
                          >
                            <span style={{ color: item.color }}>{item.label}</span>
                            <strong>{Number(row[item.key] || 0)}</strong>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SERI.map((item, index) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    name={item.label}
                    stackId="prioritas"
                    fill={item.color}
                    radius={index === SERI.length - 1 ? [0, 6, 6, 0] : 0}
                    onClick={handleChartClick}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
          <Col xs={12} md={6}>
            <Card size="small" style={{ borderRadius: 10 }} bodyStyle={{ padding: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Total Kompetensi</Text>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.total_kompetensi}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{totalBaris} baris pegawai × kompetensi</Text>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card
              size="small"
              hoverable
              style={{ borderRadius: 10, cursor: 'pointer' }}
              bodyStyle={{ padding: 12 }}
              onClick={() => handleFilterChange('status_isi', 'sudah')}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>Sudah dipetakan</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#237804' }}>
                {summary.kompetensi_sudah}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{persenSudah}% dari kompetensi</Text>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card
              size="small"
              hoverable
              style={{ borderRadius: 10, cursor: 'pointer' }}
              bodyStyle={{ padding: 12 }}
              onClick={() => handleFilterChange('status_isi', 'belum')}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>Belum dipetakan</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#8c8c8c' }}>
                {summary.kompetensi_belum}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>belum ada isian prioritas</Text>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card
              size="small"
              hoverable
              style={{ borderRadius: 10, cursor: 'pointer' }}
              bodyStyle={{ padding: 12 }}
              onClick={() => handleFilterChange('status_isi', 'sebagian')}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>Terisi sebagian</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#d46b08' }}>
                {summary.kompetensi_sebagian}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                lengkap: {summary.kompetensi_lengkap}
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          {SERI.map(item => {
            const key = item.key.replace('jumlah_', 'baris_');
            return (
              <Col xs={12} md={6} key={item.key}>
                <Space size={8} align="center">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: item.color
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                  <Text strong>{Number(summary[key] || 0)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>baris</Text>
                </Space>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 16 }}
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>Status Pemetaan per Kompetensi</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kompetensi mana yang sudah dan belum dipetakan ke Mutlak, Perlu, atau Penting.
            </Text>
          </Space>
        }
        extra={
          <Segmented
            value={filters.status_isi || ''}
            options={STATUS_OPTIONS.map(item => ({ value: item.value, label: item.label }))}
            onChange={(value) => handleFilterChange('status_isi', value)}
          />
        }
      >
        {activeKompetensi && (
          <Space style={{ marginBottom: 12 }} wrap>
            <Tag color="blue">Disaring dari grafik</Tag>
            <Button
              size="small"
              onClick={() => {
                setActiveKompetensi(null);
                setFilters(prev => ({ ...prev, id_kompetensi: [] }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              Tampilkan semua kompetensi
            </Button>
          </Space>
        )}

        <Table
          rowKey="id_kompetensi"
          size="middle"
          loading={loadingTable}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  filters.status_isi === 'belum'
                    ? 'Semua kompetensi sudah punya isian prioritas'
                    : filters.status_isi === 'sudah'
                      ? 'Belum ada kompetensi yang dipetakan'
                      : 'Tidak ada kompetensi untuk filter ini'
                }
              />
            )
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} kompetensi`,
            onChange: (current, pageSize) => {
              setPagination(prev => ({ ...prev, current, pageSize }));
              fetchTable(current, pageSize);
            }
          }}
        />
      </Card>
    </Space>
  );
};

export default PrioritasGrafikTab;
