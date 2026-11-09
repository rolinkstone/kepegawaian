// components/prioritaskompetensi/PrioritasRekapTab.js
// Tab "Rekap per Kompetensi": satu baris = satu kompetensi per jenjang.
// Setiap sub-kolom prioritas (Mutlak/Perlu/Penting) menampilkan centang bila
// ada pegawai dengan prioritas tersebut. Isian per pegawai dilakukan di modal
// daftar nama pegawai (berupa centang, bukan dropdown).
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
  Modal,
  Checkbox,
  Tooltip,
  Empty,
  message
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  fetchRekapPrioritasKompetensi,
  fetchDetailPrioritasKompetensi,
  updatePrioritasKompetensi
} from './api/prioritasKompetensiApi';

const { Text } = Typography;

const PRIORITAS_VALUES = ['Mutlak', 'Perlu', 'Penting'];

const PRIORITAS_META = {
  Mutlak: { color: 'red', textColor: '#cf1322' },
  Perlu: { color: 'orange', textColor: '#d46b08' },
  Penting: { color: 'gold', textColor: '#d4b106' }
};

const STATUS_ISI_OPTIONS = [
  { value: 'belum', label: 'Belum diisi' },
  { value: 'lengkap', label: 'Sudah diisi semua' }
];

const rowKeyOf = (record) => `${record.id_kompetensi}::${record.id_jenjang}`;

const PrioritasRekapTab = ({ session, options = { jabatan: [], jenjang: [], fungsi: [] } }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    search_kompetensi: '',
    id_jabatan: undefined,
    id_jenjang: undefined,
    id_fungsi: undefined,
    status_isi: undefined
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchKompetensiInput, setSearchKompetensiInput] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [modal, setModal] = useState({
    open: false,
    row: null,
    employees: [],
    loading: false,
    savingKey: null
  });

  // ========== FETCH REKAP ==========
  const fetchRekap = useCallback(async (showMessage = false) => {
    if (!session) return;

    setLoading(true);
    try {
      const result = await fetchRekapPrioritasKompetensi(session, {
        search: filters.search,
        search_kompetensi: filters.search_kompetensi,
        id_jabatan: filters.id_jabatan,
        id_jenjang: filters.id_jenjang,
        id_fungsi: filters.id_fungsi,
        status_isi: filters.status_isi,
        page: pagination.current,
        pageSize: pagination.pageSize
      });

      if (result.success) {
        setRows(result.data || []);
        setPagination(prev => ({ ...prev, total: result.total || 0 }));

        if (showMessage) {
          message.success(`Rekap dimuat (${result.total || 0} baris)`);
        }
      } else {
        message.error(result.message || 'Gagal memuat rekap prioritas kompetensi');
      }
    } catch (error) {
      console.error('❌ Error memuat rekap prioritas:', error);
      message.error(error.message || 'Gagal memuat rekap prioritas kompetensi');
    } finally {
      setLoading(false);
    }
  }, [
    session,
    filters.search,
    filters.search_kompetensi,
    filters.id_jabatan,
    filters.id_jenjang,
    filters.id_fungsi,
    filters.status_isi,
    pagination.current,
    pagination.pageSize
  ]);

  useEffect(() => {
    fetchRekap(false);
  }, [fetchRekap]);

  // Debounce pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce pencarian nama/kode kompetensi
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      setFilters(prev => (
        prev.search_kompetensi === searchKompetensiInput
          ? prev
          : { ...prev, search_kompetensi: searchKompetensiInput }
      ));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchKompetensiInput]);

  // ========== MODAL DAFTAR PEGAWAI ==========
  const loadEmployees = async (row, search = '') => {
    setModal(prev => ({ ...prev, loading: true }));
    try {
      const result = await fetchDetailPrioritasKompetensi(session, {
        id_kompetensi: row.id_kompetensi,
        id_jenjang: row.id_jenjang,
        search
      });

      if (result.success) {
        setModal(prev => ({ ...prev, employees: result.data || [], loading: false }));
      } else {
        message.error(result.message || 'Gagal memuat daftar pegawai');
        setModal(prev => ({ ...prev, employees: [], loading: false }));
      }
    } catch (error) {
      console.error('❌ Error memuat daftar pegawai:', error);
      message.error(error.message || 'Gagal memuat daftar pegawai');
      setModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openModal = (row) => {
    setModalSearch('');
    setModal({
      open: true,
      row,
      employees: [],
      loading: true,
      savingKey: null
    });
  };

  const closeModal = () => {
    setModalSearch('');
    setModal({ open: false, row: null, employees: [], loading: false, savingKey: null });
  };

  // Muat daftar pegawai saat modal dibuka / kata kunci berubah (debounce)
  useEffect(() => {
    if (!modal.open || !modal.row) return undefined;

    const timer = setTimeout(() => {
      loadEmployees(modal.row, modalSearch);
    }, modalSearch ? 400 : 0);

    return () => clearTimeout(timer);
  }, [modal.open, modal.row, modalSearch]);

  const handleSetPrioritas = async (employee, value) => {
    if (!employee.can_edit) {
      message.warning('Hanya admin atau pemilik data yang dapat mengubah prioritas ini');
      return;
    }

    const key = `${employee.id_user}::${employee.id_kompetensi}`;
    setModal(prev => ({ ...prev, savingKey: key }));

    try {
      const result = await updatePrioritasKompetensi(session, {
        id_user: employee.id_user,
        id_kompetensi: employee.id_kompetensi,
        prioritas: value
      });

      if (result.success) {
        setModal(prev => ({
          ...prev,
          employees: prev.employees.map(item => (
            item.id_user === employee.id_user
              ? { ...item, prioritas: value }
              : item
          ))
        }));
        message.success(result.message || 'Prioritas disimpan');
        fetchRekap(false);
      } else {
        message.error(result.message || 'Gagal menyimpan prioritas');
      }
    } catch (error) {
      console.error('❌ Error menyimpan prioritas:', error);
      message.error(error.message || 'Gagal menyimpan prioritas');
    } finally {
      setModal(prev => ({ ...prev, savingKey: null }));
    }
  };

  // ========== OPSI FILTER ==========
  const jabatanOptions = options.jabatan.map(item => ({ value: item.id, label: item.nama_jabatan }));
  const jenjangOptions = options.jenjang.map(item => ({ value: item.id, label: item.nama_jenjang }));
  const fungsiOptions = options.fungsi.map(item => ({ value: item.id, label: item.nama_fungsi }));

  // ========== KOLOM TABEL REKAP ==========
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
          {record.nama_peran && (
            <Text type="secondary" style={{ fontSize: 12 }}>Peran: {record.nama_peran}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Prioritas',
      key: 'prioritas',
      children: PRIORITAS_VALUES.map(value => {
        const field = `jumlah_${value.toLowerCase()}`;
        const jumlah = (record) => Number(record[field] || 0);

        return {
          title: <Tag color={PRIORITAS_META[value].color}>{value}</Tag>,
          key: field,
          width: 110,
          align: 'center',
          render: (_, record) => {
            const total = jumlah(record);
            return (
              <Tooltip title={total > 0 ? `${total} pegawai ${value}` : `Belum ada pegawai ${value}`}>
                <Space size={6}>
                  <Checkbox checked={total > 0} disabled />
                  <Text style={{ color: total > 0 ? PRIORITAS_META[value].textColor : '#bfbfbf' }}>
                    {total}
                  </Text>
                </Space>
              </Tooltip>
            );
          }
        };
      })
    },
    {
      title: 'Jenjang',
      key: 'jenjang',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="processing">{record.nama_jenjang}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>Level {record.tingkat_jenjang ?? '-'}</Text>
        </Space>
      )
    },
    {
      title: 'Pegawai',
      key: 'pegawai',
      width: 190,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Button type="link" icon={<TeamOutlined />} onClick={() => openModal(record)} style={{ padding: 0 }}>
            Lihat ({record.total_pegawai} pegawai)
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Belum diisi: {record.jumlah_belum}
          </Text>
        </Space>
      )
    }
  ];

  // ========== KOLOM MODAL ==========
  const modalColumns = [
    {
      title: 'Pegawai',
      key: 'pegawai',
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
      render: (text) => text ? <Tag color="orange">{text}</Tag> : '-'
    },
    {
      title: 'Fungsi',
      dataIndex: 'nama_fungsi',
      key: 'nama_fungsi',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-'
    },
    {
      title: 'Prioritas',
      key: 'prioritas',
      width: 250,
      render: (_, record) => {
        const saving = modal.savingKey === `${record.id_user}::${record.id_kompetensi}`;

        return (
          <Space size={12} wrap>
            {PRIORITAS_VALUES.map(value => (
              <Checkbox
                key={value}
                checked={record.prioritas === value}
                disabled={saving || !record.can_edit}
                onChange={() => handleSetPrioritas(
                  record,
                  record.prioritas === value ? null : value
                )}
              >
                {value}
              </Checkbox>
            ))}
          </Space>
        );
      }
    }
  ];

  return (
    <>
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={4}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari nama pegawai / NIP"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari kode / nama kompetensi"
              value={searchKompetensiInput}
              onChange={(e) => setSearchKompetensiInput(e.target.value)}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Jabatan"
              value={filters.id_jabatan}
              onChange={(value) => {
                setPagination(prev => ({ ...prev, current: 1 }));
                setFilters(prev => ({ ...prev, id_jabatan: value }));
              }}
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
              onChange={(value) => {
                setPagination(prev => ({ ...prev, current: 1 }));
                setFilters(prev => ({ ...prev, id_jenjang: value }));
              }}
              options={jenjangOptions}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Fungsi"
              value={filters.id_fungsi}
              onChange={(value) => {
                setPagination(prev => ({ ...prev, current: 1 }));
                setFilters(prev => ({ ...prev, id_fungsi: value }));
              }}
              options={fungsiOptions}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Semua Status Isian"
              value={filters.status_isi}
              onChange={(value) => {
                setPagination(prev => ({ ...prev, current: 1 }));
                setFilters(prev => ({ ...prev, status_isi: value }));
              }}
              options={STATUS_ISI_OPTIONS}
            />
          </Col>
          <Col xs={24} md={4}>
            <Space>
              <Tooltip title="Muat ulang data">
                <Button icon={<ReloadOutlined />} onClick={() => fetchRekap(true)} loading={loading} />
              </Tooltip>
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  setSearchInput('');
                  setSearchKompetensiInput('');
                  setPagination(prev => ({ ...prev, current: 1 }));
                  setFilters({
                    search: '',
                    search_kompetensi: '',
                    id_jabatan: undefined,
                    id_jenjang: undefined,
                    id_fungsi: undefined,
                    status_isi: undefined
                  });
                }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey={rowKeyOf}
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1300 }}
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

      <Modal
        open={modal.open}
        title={
          modal.row ? (
            <Space direction="vertical" size={0}>
              <Text strong>
                {modal.row.kode_kompetensi} - {modal.row.nama_kompetensi}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Jenjang {modal.row.nama_jenjang} - {modal.row.total_pegawai} pegawai
              </Text>
            </Space>
          ) : 'Daftar Pegawai'
        }
        footer={null}
        width={900}
        onCancel={closeModal}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            Centang salah satu: <strong>Mutlak</strong>, <strong>Perlu</strong>, atau <strong>Penting</strong>.
            Centang ulang untuk menghapus isian.
          </Text>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Cari nama pegawai / NIP"
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
          />

          <Table
            rowKey={(record) => `${record.id_user}::${record.id_kompetensi}`}
            size="small"
            loading={modal.loading}
            columns={modalColumns}
            dataSource={modal.employees}
            pagination={false}
            scroll={{ y: 380 }}
            locale={{
              emptyText: <Empty description="Belum ada pegawai pada kompetensi + jenjang ini" />
            }}
          />
        </Space>
      </Modal>
    </>
  );
};

export default PrioritasRekapTab;
