// components/modals/ModalAnalisisKenaikan.js
import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert, Progress, Table, Tag, Card, Statistic, Row, Col, Select, message, Descriptions, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  BarChartOutlined, 
  ApartmentOutlined, 
  UserOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Option } = Select;

const ModalAnalisisKenaikan = ({ visible, onCancel, selectedPegawai, options, session }) => {
  const [loading, setLoading] = useState(false);
  const [analisisData, setAnalisisData] = useState(null);
  const [targetJenjang, setTargetJenjang] = useState(null);
  const [selectedFungsi, setSelectedFungsi] = useState(null);
  const [availableJenjang, setAvailableJenjang] = useState([]);
  const [availableFungsi, setAvailableFungsi] = useState([]);

  // Helper untuk mendapatkan token
  const getToken = () => {
    if (session?.accessToken) {
      return session.accessToken;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    if (visible && selectedPegawai?.id && targetJenjang && selectedFungsi) {
      fetchAnalisis(selectedPegawai.id, targetJenjang, selectedFungsi);
    }
  }, [visible, selectedPegawai, targetJenjang, selectedFungsi]);

  // Inisialisasi data ketika modal dibuka
  useEffect(() => {
    if (visible && selectedPegawai) {
      // Set default fungsi ke fungsi pegawai
      setSelectedFungsi(selectedPegawai.id_fungsi);
      
      // Set default target jenjang ke jenjang saat ini
      setTargetJenjang(selectedPegawai.id_jenjang);
      
      // Set available fungsi dari options
      if (options?.fungsi) {
        setAvailableFungsi(options.fungsi);
      }
    }
  }, [visible, selectedPegawai, options]);

  // Filter jenjang berdasarkan fungsi yang dipilih
  useEffect(() => {
    if (options?.jenjang) {
      // Urutkan jenjang berdasarkan tingkat
      const sorted = [...options.jenjang].sort((a, b) => a.tingkat - b.tingkat);
      setAvailableJenjang(sorted);
    }
  }, [options]);

  const fetchAnalisis = async (id, targetId, fungsiId) => {
    setLoading(true);
    try {
      const token = getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pegawai/${id}/analisis-kenaikan?target_jenjang_id=${targetId}&fungsi_id=${fungsiId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setAnalisisData(result.data);
      } else {
        throw new Error(result.message || 'Gagal memuat analisis');
      }
    } catch (error) {
      console.error('Error fetching analisis:', error);
      message.error('Gagal memuat analisis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kolom dengan ukuran yang lebih kecil - HAPUS kolom Hasil Verifikasi, Keterangan, Verifikator
  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 50,
      render: (text, record, index) => (
        <span style={{ fontSize: '12px', fontWeight: '500' }}>{index + 1}</span>
      )
    },
    {
      title: 'Kode',
      dataIndex: 'kode_kompetensi',
      key: 'kode',
      width: 80,
      render: (text) => (
        <Tag color="geekblue" style={{ fontSize: '11px', padding: '0 4px', margin: 0 }}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Nama Kompetensi',
      dataIndex: 'nama_kompetensi',
      key: 'nama',
      width: 300,
      render: (text) => (
        <span style={{ fontSize: '12px' }}>{text || '-'}</span>
      )
    },
    {
      title: 'Fungsi',
      dataIndex: 'nama_fungsi',
      key: 'fungsi',
      width: 90,
      render: (text) => (
        <Tag color="purple" style={{ fontSize: '11px', padding: '0 4px', margin: 0 }}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Peran',
      dataIndex: 'nama_peran',
      key: 'peran',
      width: 120,
      render: (text, record) => {
        // Cek apakah peran ini dimiliki user
        const peranDimiliki = analisisData?.peran_info?.peran_dimiliki?.includes(text);
        return (
          <Tooltip title={!peranDimiliki ? "Peran ini tidak dimiliki pegawai" : ""}>
            <Tag 
              color={peranDimiliki ? 'blue' : 'default'} 
              style={{ 
                fontSize: '11px', 
                padding: '0 4px', 
                margin: 0,
                opacity: peranDimiliki ? 1 : 0.7,
                border: !peranDimiliki ? '1px dashed #d9d9d9' : 'none'
              }}
            >
              {text || '-'}
              {!peranDimiliki && ' *'}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Pemenuhan Kompetensi</div>
          <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: 4 }}>
            <span style={{ marginRight: 20 }}>Memenuhi</span>
            <span>Tidak Memenuhi</span>
          </div>
        </div>
      ),
      key: 'pemenuhan',
      width: 180,
      align: 'center',
      render: (text, record) => {
        // Hanya dianggap memenuhi jika:
        // 1. Ada di tabel user_kompetensi
        // 2. Status = 'Lulus'
        // 3. verified_by tidak null
        // 4. hasil_verif = 'Valid'
        const isTerpenuhi = record.is_valid_verified === true;
        
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '30px'
          }}>
            {/* V untuk MEMENUHI */}
            <div style={{ 
              color: isTerpenuhi ? '#52c41a' : '#d9d9d9',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              V
            </div>
            
            {/* X untuk TIDAK MEMENUHI */}
            <div style={{ 
              color: !isTerpenuhi ? '#f5222d' : '#d9d9d9',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              X
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <Modal
      title={
        <span>
          <BarChartOutlined style={{ marginRight: 8 }} />
          Analisis Kenaikan Jenjang
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1100}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        {selectedPegawai && (
          <>
            {/* Informasi Pegawai dengan Descriptions */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
              <Descriptions 
                title="Informasi Pegawai" 
                size="small" 
                column={2}
                labelStyle={{ fontWeight: 'bold', width: '120px' }}
              >
                <Descriptions.Item label="Nama">{selectedPegawai.nama}</Descriptions.Item>
                <Descriptions.Item label="NIP">{selectedPegawai.nip}</Descriptions.Item>
                <Descriptions.Item label="Jabatan">{selectedPegawai.nama_jabatan}</Descriptions.Item>
                <Descriptions.Item label="Jenjang Saat Ini">
                  <Tag color="cyan">{selectedPegawai.nama_jenjang}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Fungsi">
                  <Tag color="purple" icon={<ApartmentOutlined />}>
                    {selectedPegawai.nama_fungsi}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Peran">
                  {selectedPegawai.nama_peran ? (
                    selectedPegawai.nama_peran.split(', ').map((peran, idx) => (
                      <Tag color="blue" key={idx} style={{ marginRight: 4 }}>
                        {peran}
                      </Tag>
                    ))
                  ) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Filter Section */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Pilih Fungsi:</span>
                </div>
                <Select
                  placeholder="Pilih Fungsi"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    setSelectedFungsi(value);
                    setAnalisisData(null);
                  }}
                  value={selectedFungsi}
                  size="small"
                  showSearch
                  optionFilterProp="children"
                >
                  {availableFungsi.map(f => {
                    const isCurrentFungsi = selectedPegawai?.id_fungsi === f.id;
                    return (
                      <Option key={f.id} value={f.id}>
                        {f.nama} {isCurrentFungsi && '(Fungsi Saat Ini)'}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Pilih Target Jenjang:</span>
                </div>
                <Select
                  placeholder="Pilih Target Jenjang"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    setTargetJenjang(value);
                    setAnalisisData(null);
                  }}
                  value={targetJenjang}
                  size="small"
                  showSearch
                  optionFilterProp="children"
                >
                  {availableJenjang.map(j => {
                    const isCurrentJenjang = selectedPegawai?.id_jenjang === j.id;
                    const isHigher = j.tingkat > (selectedPegawai?.tingkat_jenjang || 0);
                    
                    return (
                      <Option key={j.id} value={j.id}>
                        {j.nama} (Tingkat {j.tingkat})
                        {isCurrentJenjang && ' - Saat Ini'}
                        {isHigher && ' - Kenaikan'}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
            </Row>

            {/* Info Filter */}
            {analisisData && (
              <>
                {/* Info Lintas Fungsi */}
                {analisisData.filter_info?.is_lintas_fungsi && (
                  <Alert
                    message={
                      <span>
                        <WarningOutlined style={{ marginRight: 8 }} />
                        Analisis Lintas Fungsi
                      </span>
                    }
                    description={
                      <div>
                        <Row gutter={[8, 4]}>
                          <Col span={12}>
                            <strong>Fungsi Pegawai:</strong> {analisisData.filter_info.fungsi_user}
                          </Col>
                          <Col span={12}>
                            <strong>Fungsi Analisis:</strong> {analisisData.filter_info.fungsi_analisis}
                          </Col>
                        </Row>
                        <div style={{ marginTop: 8, background: '#fff1f0', padding: 8, borderRadius: 4 }}>
                          <InfoCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                          <span style={{ fontSize: '12px' }}>
                            Peran yang tidak dimiliki pegawai akan ditandai dengan <Tag color="default" style={{ fontSize: '10px' }}>*</Tag>
                          </span>
                        </div>
                      </div>
                    }
                    type="warning"
                    showIcon={false}
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* Info Peran */}
                {analisisData.peran_info && (
                  <Card size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: 8 }}>
                      Informasi Peran
                    </div>
                    <Row gutter={[8, 8]}>
                      <Col span={8}>
                        <div style={{ fontSize: '11px' }}>
                          <strong>Peran Dimiliki:</strong>
                        </div>
                        <div>
                          {analisisData.peran_info.peran_dimiliki.map(peran => (
                            <Tag color="blue" key={peran} style={{ margin: '2px' }}>
                              {peran}
                            </Tag>
                          ))}
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: '11px' }}>
                          <strong>Peran Tidak Dimiliki:</strong>
                        </div>
                        <div>
                          {analisisData.peran_info.peran_tidak_dimiliki.map(peran => (
                            <Tag color="default" key={peran} style={{ margin: '2px' }}>
                              {peran} *
                            </Tag>
                          ))}
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: '11px' }}>
                          <strong>Total Peran:</strong> {analisisData.peran_info.semua_peran.length}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Statistik cards */}
                <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <Card size="small" bodyStyle={{ padding: '8px' }}>
                      <Statistic
                        title={<span style={{ fontSize: '11px' }}>Target Jenjang</span>}
                        value={analisisData.target_jenjang?.nama || '-'}
                        valueStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" bodyStyle={{ padding: '8px' }}>
                      <Statistic
                        title={<span style={{ fontSize: '11px' }}>Total Kompetensi</span>}
                        value={analisisData.analisis?.total || 0}
                        valueStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" bodyStyle={{ padding: '8px' }}>
                      <Statistic
                        title={<span style={{ fontSize: '11px' }}>MEMENUHI</span>}
                        value={analisisData.analisis?.terpenuhi || 0}
                        valueStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" bodyStyle={{ padding: '8px' }}>
                      <Statistic
                        title={<span style={{ fontSize: '11px' }}>TIDAK MEMENUHI</span>}
                        value={analisisData.analisis?.belumTerpenuhi || 0}
                        valueStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#f5222d' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Progress bar */}
                <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <Progress
                      percent={analisisData.analisis?.persentase || 0}
                      status="active"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      format={percent => `${percent}% Memenuhi`}
                    />
                  </Col>
                </Row>

                {/* Alert status */}
                <Alert
                  message={
                    <span style={{ fontSize: '12px' }}>
                      <strong>Kesiapan:</strong> {analisisData.analisis?.terpenuhi || 0} kompetensi <span style={{ color: '#52c41a', fontWeight: 'bold' }}>MEMENUHI</span>, {analisisData.analisis?.belumTerpenuhi || 0} kompetensi <span style={{ color: '#f5222d', fontWeight: 'bold' }}>TIDAK MEMENUHI</span>
                    </span>
                  }
                  type={(analisisData.analisis?.persentase || 0) >= 80 ? 'success' : 
                        (analisisData.analisis?.persentase || 0) >= 50 ? 'warning' : 'error'}
                  showIcon
                  style={{ marginBottom: 12, padding: '6px 12px' }}
                />

                {/* Tabel Kompetensi */}
                <Table
                  columns={columns}
                  dataSource={analisisData.analisis?.detail || []}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 300 }}
                  locale={{ emptyText: 'Tidak ada data kompetensi' }}
                  style={{ fontSize: '12px' }}
                />
              </>
            )}
          </>
        )}
      </Spin>

      {/* Style tambahan */}
      <style jsx>{`
        :global(.compact-table-row) {
          height: 60px;
        }
        :global(.compact-table-row td) {
          padding: 8px 8px !important;
        }
        :global(.ant-table-small .ant-table-thead > tr > th) {
          padding: 8px 8px !important;
          font-size: 11px;
          font-weight: bold;
          background-color: #f5f5f5;
        }
        :global(.ant-table-small .ant-table-tbody > tr > td) {
          padding: 8px 8px !important;
        }
      `}</style>
    </Modal>
  );
};

export default ModalAnalisisKenaikan;