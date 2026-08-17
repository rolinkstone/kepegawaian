// components/pegawai/PeranPemenuhanContainer.js
// Halaman: Pemenuhan Kompetensi per Peran (Profil Kompetensi)
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
  Select,
  Input,
  Progress,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  SearchOutlined,
  ClearOutlined,
  ApartmentOutlined,
  FileExcelOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { getRekapPeran, getPemenuhanPeran } from './api/peranPemenuhanApi';

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

// ========== KOMPETENSI DETAIL (EXPANDABLE ROW) ==========
const KompetensiDetail = ({ kompetensiDetail }) => {
  if (!kompetensiDetail || kompetensiDetail.length === 0) {
    return <Empty description="Tidak ada kompetensi wajib untuk peran ini" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const jumlahDipenuhi = kompetensiDetail.filter(k => k.dipenuhi).length;

  return (
    <div style={{ padding: '12px 24px' }}>
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Text strong>Kompetensi Wajib Peran</Text>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Text type="secondary">
            Dipenuhi: <Text strong style={{ color: '#52c41a' }}>{jumlahDipenuhi}</Text> / {kompetensiDetail.length}
          </Text>
        </Col>
      </Row>

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={kompetensiDetail}
        style={{ background: '#fff', borderRadius: 8 }}
        columns={[
          {
            title: 'Kode',
            dataIndex: 'kode_kompetensi',
            width: 140,
            render: (val) => <Text code>{val}</Text>
          },
          {
            title: 'Kompetensi',
            dataIndex: 'nama_kompetensi'
          },
          {
            title: 'Fungsi',
            dataIndex: 'kompetensi_fungsi',
            width: 160,
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
            title: 'Status',
            dataIndex: 'dipenuhi',
            width: 130,
            align: 'center',
            render: (dipenuhi) => dipenuhi
              ? <Tag color="success" icon={<CheckCircleOutlined />}>Dipenuhi</Tag>
              : <Tag color="default" icon={<CloseCircleOutlined />}>Belum</Tag>
          }
        ]}
      />
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const PeranPemenuhanContainer = ({ session }) => {
  const router = useRouter();

  // State
  const [rekap, setRekap] = useState([]);
  const [rekapStatistik, setRekapStatistik] = useState({ total_peran: 0, total_pegawai: 0, total_sudah_memenuhi: 0, persentase_keseluruhan: 0 });
  const [selectedPeranId, setSelectedPeranId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [idFungsi, setIdFungsi] = useState('');
  const [fungsiOptions, setFungsiOptions] = useState([]);

  // ========== FETCH REKAP ==========
  const fetchRekap = useCallback(async (showMessage = false) => {
    setLoading(true);
    try {
      const result = await getRekapPeran(session);
      if (result.success) {
        setRekap(result.data || []);
        setRekapStatistik(result.statistik || {});
        // Kumpulkan daftar fungsi unik dari rekap
        const fungi = [...new Set((result.data || []).map(r => r.nama_fungsi).filter(Boolean))];
        setFungsiOptions(fungi);
        if (showMessage) {
          message.success('Rekap pemenuhan berhasil dimuat');
        }
      } else {
        message.error(result.message || 'Gagal memuat rekap pemenuhan');
      }
    } catch (error) {
      console.error('Error fetch rekap:', error);
      message.error(error.message || 'Gagal memuat rekap pemenuhan');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ========== FETCH DETAIL PERAN ==========
  const fetchDetail = useCallback(async (peranId, opts = {}) => {
    if (!peranId) return;
    // Gunakan nilai eksplisit jika diberikan, jika tidak pakai state saat ini
    const s = opts.search !== undefined ? opts.search : search;
    const f = opts.id_fungsi !== undefined ? opts.id_fungsi : idFungsi;
    setDetailLoading(true);
    try {
      const result = await getPemenuhanPeran(session, peranId, { search: s, id_fungsi: f });
      if (result.success) {
        setDetail(result.data);
        if (opts.showMessage) {
          message.success('Data pemenuhan berhasil dimuat');
        }
      } else {
        message.error(result.message || 'Gagal memuat data pemenuhan');
      }
    } catch (error) {
      console.error('Error fetch detail:', error);
      message.error(error.message || 'Gagal memuat data pemenuhan');
    } finally {
      setDetailLoading(false);
    }
  }, [session, search, idFungsi]);

  // Load rekap saat pertama kali dibuka
  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  // ========== HANDLERS ==========
  const handleSelectPeran = (peranId) => {
    const id = peranId ? parseInt(peranId) : null;
    setSelectedPeranId(id);
    setSearch('');
    setIdFungsi('');
    if (id) {
      fetchDetail(id, { search: '', id_fungsi: '' });
    } else {
      setDetail(null);
    }
  };

  const handleBack = () => {
    setSelectedPeranId(null);
    setDetail(null);
    setSearch('');
    setIdFungsi('');
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (selectedPeranId) {
      fetchDetail(selectedPeranId, { search: value });
    }
  };

  const handleFilterFungsi = (value) => {
    setIdFungsi(value);
    if (selectedPeranId) {
      fetchDetail(selectedPeranId, { id_fungsi: value });
    }
  };

  const handleExport = () => {
    if (!detail?.pegawai?.length) {
      message.warning('Tidak ada data untuk diexport');
      return;
    }
    try {
      const rows = [
        ['NIP', 'Nama', 'Fungsi', 'Jabatan', 'Jenjang', 'Peran', 'Kompetensi Dipenuhi'],
        ...detail.pegawai.map(p => [
          p.nip, p.nama, p.nama_fungsi || '-', p.nama_jabatan || '-', p.nama_jenjang || '-',
          p.daftar_peran || '-', `${p.jumlah_dipenuhi}/${p.jumlah_kompetensi}`
        ])
      ];
      const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pemenuhan_Peran_${detail.peran?.nama_peran || selectedPeranId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Data berhasil diexport');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Gagal mengexport data');
    }
  };

  // ========== KOLOM REKAP ==========
  const rekapColumns = [
    {
      title: 'Peran',
      dataIndex: 'nama_peran',
      render: (val, record) => (
        <Space>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#722ed1', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15
          }}>
            <CrownOutlined />
          </span>
          <Space direction="vertical" size={0}>
            <Text strong>{val}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nama_fungsi}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Jumlah Kompetensi',
      dataIndex: 'jumlah_kompetensi',
      width: 160,
      align: 'center',
      render: (val) => <Tag color="geekblue">{val} kompetensi</Tag>
    },
    {
      title: 'Total Pegawai',
      dataIndex: 'total_pegawai',
      width: 130,
      align: 'center',
      render: (val) => <Text strong>{val}</Text>
    },
    {
      title: 'Sudah Memenuhi',
      dataIndex: 'sudah_memenuhi',
      width: 140,
      align: 'center',
      render: (val) => <Tag color="success" icon={<CheckCircleOutlined />}>{val}</Tag>
    },
    {
      title: 'Belum Memenuhi',
      dataIndex: 'belum_memenuhi',
      width: 140,
      align: 'center',
      render: (val) => <Tag color="error" icon={<CloseCircleOutlined />}>{val}</Tag>
    },
    {
      title: 'Persentase',
      dataIndex: 'persentase',
      width: 180,
      render: (val) => (
        <Progress
          percent={val}
          size="small"
          status={val >= 80 ? 'success' : val >= 50 ? 'active' : 'exception'}
          format={(p) => `${p}%`}
        />
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<TeamOutlined />}
          onClick={() => handleSelectPeran(record.peran_id)}
        >
          Detail
        </Button>
      )
    }
  ];

  // ========== KOLOM PEGAWAI ==========
  const pegawaiColumns = [
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
      width: 160,
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
      title: 'Peran',
      dataIndex: 'daftar_peran',
      width: 180,
      render: (val) => val ? (
        <Space size={4} wrap>
          {val.split(', ').slice(0, 2).map((p, i) => (
            <Tag key={i} color="cyan">{p}</Tag>
          ))}
          {val.split(', ').length > 2 && (
            <Tooltip title={val}>
              <Tag>+{val.split(', ').length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ) : '-'
    },
    {
      title: 'Pemenuhan',
      dataIndex: 'jumlah_dipenuhi',
      width: 160,
      align: 'center',
      render: (val, record) => (
        <Tooltip title={`${val} dari ${record.jumlah_kompetensi} kompetensi wajib`}>
          <Progress
            type="circle"
            size={54}
            percent={record.jumlah_kompetensi > 0 ? Math.round((val / record.jumlah_kompetensi) * 100) : 0}
            format={() => `${val}/${record.jumlah_kompetensi}`}
            strokeColor={record.sudah_memenuhi ? '#52c41a' : '#fa8c16'}
          />
        </Tooltip>
      )
    }
  ];

  // ========== RENDER REKAP VIEW ==========
  const renderRekapView = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Peran"
            value={rekapStatistik.total_peran}
            icon={<CrownOutlined />}
            color="purple"
            subtitle="Jumlah peran terdaftar"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Pegawai"
            value={rekapStatistik.total_pegawai}
            icon={<TeamOutlined />}
            color="blue"
            subtitle="Pegawai yang memiliki peran"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Sudah Memenuhi"
            value={rekapStatistik.total_sudah_memenuhi}
            icon={<CheckCircleOutlined />}
            color="green"
            subtitle="Memenuhi seluruh kompetensi wajib"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Persentase"
            value={rekapStatistik.persentase_keseluruhan + '%'}
            icon={<ProfileOutlined />}
            color="orange"
            subtitle="Pemenuhan keseluruhan"
            loading={loading}
          />
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#722ed1' }} />
            <span>Rekap Pemenuhan Kompetensi per Peran</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchRekap(true)}
            loading={loading}
          >
            Muat Ulang
          </Button>
        }
      >
        <Table
          rowKey="peran_id"
          loading={loading}
          dataSource={rekap}
          columns={rekapColumns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="Belum ada data peran" /> }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => handleSelectPeran(record.peran_id)
          })}
        />
      </Card>
    </>
  );

  // ========== RENDER DETAIL VIEW ==========
  const renderDetailView = () => {
    const statistik = detail?.statistik || {};

    return (
      <>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item onClick={handleBack} style={{ cursor: 'pointer' }}>
            <a>Rekap Peran</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{detail?.peran?.nama_peran || 'Detail'}</Breadcrumb.Item>
        </Breadcrumb>

        <Card
          style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={14}>
              <Space size={16} align="start">
                <span style={{
                  width: 56, height: 56, borderRadius: 14,
                  backgroundColor: '#722ed1', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26
                }}>
                  <CrownOutlined />
                </span>
                <Space direction="vertical" size={2}>
                  <Title level={4} style={{ margin: 0 }}>
                    Peran {detail?.peran?.nama_peran}
                  </Title>
                  <Text type="secondary">
                    <ApartmentOutlined /> {detail?.peran?.nama_fungsi || '-'}
                  </Text>
                  <Space size={8} style={{ marginTop: 4 }}>
                    <Tag color="geekblue">{detail?.kompetensi_wajib?.length || 0} kompetensi wajib</Tag>
                    {detail?.peran?.is_lintas_fungsi === 1 && <Tag color="gold">Lintas Fungsi</Tag>}
                  </Space>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={10} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                >
                  Kembali
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchDetail(selectedPeranId, { showMessage: true })}
                  loading={detailLoading}
                >
                  Muat Ulang
                </Button>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExport}
                  disabled={!detail?.pegawai?.length}
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
              title="Total Pegawai"
              value={statistik.total_pegawai}
              icon={<TeamOutlined />}
              color="blue"
              subtitle={`Pegawai dengan peran ${detail?.peran?.nama_peran || ''}`}
              loading={detailLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Sudah Memenuhi"
              value={statistik.sudah_memenuhi}
              icon={<CheckCircleOutlined />}
              color="green"
              subtitle="Memenuhi semua kompetensi wajib"
              loading={detailLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Belum Memenuhi"
              value={statistik.belum_memenuhi}
              icon={<CloseCircleOutlined />}
              color="red"
              subtitle="Masih ada kompetensi yang belum"
              loading={detailLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Persentase"
              value={statistik.persentase + '%'}
              icon={<ProfileOutlined />}
              color="orange"
              subtitle="Tingkat pemenuhan peran"
              loading={detailLoading}
            />
          </Col>
        </Row>

        <Card
          style={{ marginTop: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          title={
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              <span>Daftar Pegawai Peran {detail?.peran?.nama_peran}</span>
              <Badge count={statistik.total_pegawai || 0} style={{ backgroundColor: '#1890ff' }} />
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
              <Select
                allowClear
                placeholder="Filter Fungsi"
                value={idFungsi || undefined}
                onChange={handleFilterFungsi}
                style={{ width: 180 }}
                options={fungsiOptions.map(f => ({ label: f, value: f }))}
              />
              {(search || idFungsi) && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setSearch('');
                    setIdFungsi('');
                    fetchDetail(selectedPeranId, { search: '', id_fungsi: '' });
                  }}
                >
                  Reset
                </Button>
              )}
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={detailLoading}
            dataSource={detail?.pegawai || []}
            columns={pegawaiColumns}
            expandable={{
              expandedRowRender: (record) => <KompetensiDetail kompetensiDetail={record.kompetensi_detail} />,
              rowExpandable: (record) => record.kompetensi_detail?.length > 0
            }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} pegawai` }}
            locale={{ emptyText: <Empty description="Tidak ada pegawai dengan peran ini" /> }}
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
            {selectedPeranId ? `Pemenuhan Peran ${detail?.peran?.nama_peran || ''}` : 'Pemenuhan Kompetensi per Peran'}
          </Title>
          <Text type="secondary">
            {selectedPeranId
              ? 'Menampilkan pegawai beserta status pemenuhan terhadap seluruh kompetensi wajib peran tersebut.'
              : 'Pilih peran untuk melihat pegawai yang sudah memenuhi kompetensinya berdasarkan peran.'}
          </Text>
        </Space>

        {!selectedPeranId ? renderRekapView() : renderDetailView()}
      </div>
    </ConfigProvider>
  );
};

export default PeranPemenuhanContainer;
