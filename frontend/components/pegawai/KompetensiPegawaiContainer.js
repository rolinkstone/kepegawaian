// components/pegawai/KompetensiPegawaiContainer.js
// Halaman: Rekap Kompetensi Pegawai — melihat siapa saja yang punya sertifikat
// kompetensi tertentu (contoh: PPNS, PBJ, PPK, dst).
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
  Input,
  Empty,
  Breadcrumb,
  message,
  Spin,
  ConfigProvider
} from 'antd';
import {
  ReloadOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  SearchOutlined,
  ClearOutlined,
  ApartmentOutlined,
  FileExcelOutlined,
  ProfileOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { getRekapKompetensi, getPemilikKompetensi } from './api/kompetensiPegawaiApi';

const { Title, Text } = Typography;

// ========== STAT CARD COMPONENT ==========
const StatCard = ({ title, value, icon, color, subtitle, loading }) => {
  const colors = {
    blue: { bg: '#e6f7ff', text: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff10 0%, #e6f7ff 100%)' },
    green: { bg: '#f6ffed', text: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a10 0%, #f6ffed 100%)' },
    orange: { bg: '#fff7e6', text: '#fa8c16', gradient: 'linear-gradient(135deg, #fa8c1610 0%, #fff7e6 100%)' },
    purple: { bg: '#f9f0ff', text: '#722ed1', gradient: 'linear-gradient(135deg, #722ed110 0%, #f9f0ff 100%)' },
    cyan: { bg: '#e6fffb', text: '#13c2c2', gradient: 'linear-gradient(135deg, #13c2c210 0%, #e6fffb 100%)' },
    red: { bg: '#fff1f0', text: '#f5222d', gradient: 'linear-gradient(135deg, #f5222d10 0%, #fff1f0 100%)' }
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
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: theme.text,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                boxShadow: `0 8px 16px ${theme.text}30`
              }}
            >
              {icon}
            </span>
          </Col>
        </Row>
      </Spin>
    </Card>
  );
};

// ========== MAIN COMPONENT ==========
const KompetensiPegawaiContainer = ({ session }) => {
  const router = useRouter();

  // State
  const [rekap, setRekap] = useState([]);
  const [rekapStatistik, setRekapStatistik] = useState({
    total_kompetensi: 0,
    total_tercatat: 0,
    total_pemilik_sertifikat: 0,
    kompetensi_dengan_pemilik: 0
  });
  const [selectedKompetensiId, setSelectedKompetensiId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [rekapSearch, setRekapSearch] = useState('');

  // ========== FETCH REKAP ==========
  const fetchRekap = useCallback(async (showMessage = false) => {
    setLoading(true);
    try {
      const result = await getRekapKompetensi(session);
      if (result.success) {
        setRekap(result.data || []);
        setRekapStatistik(result.statistik || {});
        if (showMessage) {
          message.success('Rekap kompetensi berhasil dimuat');
        }
      } else {
        message.error(result.message || 'Gagal memuat rekap kompetensi');
      }
    } catch (error) {
      console.error('Error fetch rekap kompetensi:', error);
      message.error(error.message || 'Gagal memuat rekap kompetensi');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ========== FETCH DETAIL PEMILIK ==========
  const fetchDetail = useCallback(async (kompetensiId, opts = {}) => {
    if (!kompetensiId) return;
    const s = opts.search !== undefined ? opts.search : search;
    setDetailLoading(true);
    try {
      const result = await getPemilikKompetensi(session, kompetensiId, { search: s });
      if (result.success) {
        setDetail(result);
        if (opts.showMessage) {
          message.success('Data pemilik sertifikat berhasil dimuat');
        }
      } else {
        message.error(result.message || 'Gagal memuat data pemilik sertifikat');
      }
    } catch (error) {
      console.error('Error fetch detail kompetensi:', error);
      message.error(error.message || 'Gagal memuat data pemilik sertifikat');
    } finally {
      setDetailLoading(false);
    }
  }, [session, search]);

  // Load rekap saat pertama kali dibuka
  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  // ========== HANDLERS ==========
  const handleSelectKompetensi = (kompetensiId) => {
    const id = kompetensiId ? parseInt(kompetensiId) : null;
    setSelectedKompetensiId(id);
    setSearch('');
    if (id) {
      fetchDetail(id, { search: '' });
    } else {
      setDetail(null);
    }
  };

  const handleBack = () => {
    setSelectedKompetensiId(null);
    setDetail(null);
    setSearch('');
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (selectedKompetensiId) {
      fetchDetail(selectedKompetensiId, { search: value });
    }
  };

  const handleExport = () => {
    const pemilik = detail?.data || [];
    if (!pemilik.length) {
      message.warning('Tidak ada data untuk diexport');
      return;
    }
    try {
      const rows = [
        ['NIP', 'Nama', 'Fungsi', 'Jabatan', 'Jenjang', 'Peran', 'Tanggal Dipenuhi', 'Nilai', 'Diverifikasi Oleh', 'Tanggal Verifikasi'],
        ...pemilik.map(p => [
          p.nip, p.nama, p.nama_fungsi || '-', p.nama_jabatan || '-', p.nama_jenjang || '-',
          p.daftar_peran || '-', p.tanggal_dipenuhi || '-', p.nilai || '-',
          p.verified_by_nama || '-', p.verified_at || '-'
        ])
      ];
      const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pemilik_Sertifikat_${detail?.kompetensi?.kode_kompetensi || selectedKompetensiId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Data berhasil diexport');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Gagal mengexport data');
    }
  };

  // Filter rekap berdasarkan kata kunci (kode / nama / fungsi / peran)
  const filteredRekap = useMemo(() => {
    const q = rekapSearch.trim().toLowerCase();
    if (!q) return rekap;
    return rekap.filter(r =>
      (r.kode_kompetensi || '').toLowerCase().includes(q) ||
      (r.nama_kompetensi || '').toLowerCase().includes(q) ||
      (r.nama_fungsi || '').toLowerCase().includes(q) ||
      (r.nama_peran || '').toLowerCase().includes(q)
    );
  }, [rekap, rekapSearch]);

  // ========== KOLOM REKAP ==========
  const rekapColumns = [
    {
      title: 'Kompetensi',
      dataIndex: 'nama_kompetensi',
      render: (val, record) => (
        <Space>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: '#0d9488', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17
          }}>
            <SafetyCertificateOutlined />
          </span>
          <Space direction="vertical" size={0}>
            <Space size={6}>
              <Text code>{record.kode_kompetensi}</Text>
              <Text strong>{val}</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nama_fungsi} • {record.nama_peran}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Total Tercatat',
      dataIndex: 'total_tercatat',
      width: 140,
      align: 'center',
      render: (val) => <Tag color="default">{val} pegawai</Tag>
    },
    {
      title: 'Pemilik Sertifikat',
      dataIndex: 'pemilik_sertifikat',
      width: 180,
      align: 'center',
      render: (val) => val > 0
        ? <Tag color="green" icon={<CheckCircleOutlined />}>{val} pegawai</Tag>
        : <Tag color="default">0 pegawai</Tag>
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<TeamOutlined />}
          onClick={() => handleSelectKompetensi(record.kompetensi_id)}
        >
          Detail
        </Button>
      )
    }
  ];

  // ========== KOLOM PEMILIK SERTIFIKAT ==========
  const pemilikColumns = [
    {
      title: 'NIP',
      dataIndex: 'nip',
      width: 160,
      render: (val) => <Text code>{val}</Text>
    },
    {
      title: 'Nama Pegawai',
      dataIndex: 'nama',
      render: (val, record) => (
        <Space>
          <span style={{
            width: 30, height: 30, borderRadius: '50%',
            backgroundColor: '#1890ff', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600
          }}>
            {(val || '?').charAt(0).toUpperCase()}
          </span>
          <Text strong>{val}</Text>
        </Space>
      )
    },
    {
      title: 'Fungsi',
      dataIndex: 'nama_fungsi',
      width: 150,
      render: (val) => val ? <Tag color="purple">{val}</Tag> : '-'
    },
    {
      title: 'Jabatan',
      dataIndex: 'nama_jabatan',
      width: 170,
      render: (val) => val || '-'
    },
    {
      title: 'Jenjang',
      dataIndex: 'nama_jenjang',
      width: 120,
      render: (val) => val || '-'
    },
    {
      title: 'Tanggal Dipenuhi',
      dataIndex: 'tanggal_dipenuhi',
      width: 140,
      render: (val) => val || '-'
    },
    {
      title: 'Nilai',
      dataIndex: 'nilai',
      width: 90,
      align: 'center',
      render: (val) => val || '-'
    },
    {
      title: 'Verifikasi',
      dataIndex: 'verified_by_nama',
      width: 160,
      render: (val, record) => val ? (
        <Tooltip title={`${val} • ${record.verified_at || '-'}`}>
          <Tag color="green" icon={<CheckCircleOutlined />}>{val}</Tag>
        </Tooltip>
      ) : '-'
    }
  ];

  // ========== RENDER REKAP VIEW ==========
  const renderRekapView = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Kompetensi"
            value={rekapStatistik.total_kompetensi}
            icon={<BookOutlined />}
            color="purple"
            subtitle="Jumlah kompetensi terdaftar"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pemilik Sertifikat"
            value={rekapStatistik.total_pemilik_sertifikat}
            icon={<SafetyCertificateOutlined />}
            color="green"
            subtitle="Total pegawai bersertifikat (Lulus & Valid)"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Kompetensi Berisi"
            value={rekapStatistik.kompetensi_dengan_pemilik}
            icon={<ProfileOutlined />}
            color="cyan"
            subtitle="Kompetensi yang punya pemilik sertifikat"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Tercatat"
            value={rekapStatistik.total_tercatat}
            icon={<TeamOutlined />}
            color="orange"
            subtitle="Seluruh catatan kompetensi"
            loading={loading}
          />
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0d9488' }} />
            <span>Rekap Pemenuhan per Kompetensi</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              placeholder="Cari kode / nama / fungsi / peran"
              value={rekapSearch}
              onChange={(e) => setRekapSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchRekap(true)}
              loading={loading}
            >
              Muat Ulang
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="kompetensi_id"
          loading={loading}
          dataSource={filteredRekap}
          columns={rekapColumns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="Belum ada data kompetensi" /> }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => handleSelectKompetensi(record.kompetensi_id)
          })}
        />
      </Card>
    </>
  );

  // ========== RENDER DETAIL VIEW ==========
  const renderDetailView = () => {
    const statistik = detail?.statistik || {};
    const pemilik = detail?.data || [];

    return (
      <>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item onClick={handleBack} style={{ cursor: 'pointer' }}>
            <a>Rekap Kompetensi</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{detail?.kompetensi?.kode_kompetensi || 'Detail'}</Breadcrumb.Item>
        </Breadcrumb>

        <Card
          style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Space size={16} align="start">
                <span style={{
                  width: 56, height: 56, borderRadius: 14,
                  backgroundColor: '#0d9488', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26
                }}>
                  <SafetyCertificateOutlined />
                </span>
                <Space direction="vertical" size={2}>
                  <Title level={4} style={{ margin: 0 }}>
                    <Text code>{detail?.kompetensi?.kode_kompetensi}</Text>{' '}
                    {detail?.kompetensi?.nama_kompetensi}
                  </Title>
                  <Text type="secondary">
                    <ApartmentOutlined /> {detail?.kompetensi?.nama_fungsi || '-'} • {detail?.kompetensi?.nama_peran || '-'}
                  </Text>
                  {detail?.kompetensi?.deskripsi && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {detail?.kompetensi?.deskripsi}
                    </Text>
                  )}
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                >
                  Kembali
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchDetail(selectedKompetensiId, { showMessage: true })}
                  loading={detailLoading}
                >
                  Muat Ulang
                </Button>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExport}
                  disabled={!pemilik.length}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Pemilik Sertifikat"
              value={statistik.total_pemilik}
              icon={<SafetyCertificateOutlined />}
              color="green"
              subtitle={`Pegawai dengan sertifikat ${detail?.kompetensi?.kode_kompetensi || ''}`}
              loading={detailLoading}
            />
          </Col>
        </Row>

        <Card
          style={{ marginTop: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          title={
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              <span>Pemilik Sertifikat {detail?.kompetensi?.kode_kompetensi}</span>
              <Badge count={statistik.total_pemilik || 0} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          extra={
            <Space>
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#999' }} />}
                placeholder="Cari NIP / Nama / Email / Jabatan"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value) handleSearch('');
                }}
                onPressEnter={(e) => handleSearch(e.target.value)}
                style={{ width: 260 }}
              />
              {search && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setSearch('');
                    fetchDetail(selectedKompetensiId, { search: '' });
                  }}
                >
                  Reset
                </Button>
              )}
            </Space>
          }
        >
          <Table
            rowKey="user_id"
            loading={detailLoading}
            dataSource={pemilik}
            columns={pemilikColumns}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} pegawai` }}
            locale={{ emptyText: <Empty description="Tidak ada pegawai dengan sertifikat ini" /> }}
          />
        </Card>
      </>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0d9488'
        }
      }}
    >
      <div style={{ padding: '4px 0' }}>
        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {selectedKompetensiId
              ? `Pemilik Sertifikat ${detail?.kompetensi?.kode_kompetensi || ''}`
              : 'Pemenuhan per Kompetensi'}
          </Title>
          <Text type="secondary">
            {selectedKompetensiId
              ? 'Menampilkan pegawai yang memiliki sertifikat kompetensi tersebut (status Lulus & Valid).'
              : 'Pilih kompetensi untuk melihat siapa saja yang memiliki sertifikatnya (misal PPNS, PBJ, PPK, dst).'}
          </Text>
        </Space>

        {!selectedKompetensiId ? renderRekapView() : renderDetailView()}
      </div>
    </ConfigProvider>
  );
};

export default KompetensiPegawaiContainer;
