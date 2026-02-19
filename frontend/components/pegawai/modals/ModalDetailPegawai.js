import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Badge, Spin, Row, Col, Card, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';

const ModalDetailPegawai = ({ visible, onCancel, selectedPegawai, session }) => {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

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
    if (visible && selectedPegawai?.id) {
      fetchDetailPegawai(selectedPegawai.id);
    }
  }, [visible, selectedPegawai]);

  const fetchDetailPegawai = async (id) => {
    setLoading(true);
    try {
      const token = getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pegawai/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setDetailData(result.data);
      } else {
        throw new Error(result.message || 'Gagal memuat detail pegawai');
      }
    } catch (error) {
      console.error('Error fetching detail pegawai:', error);
      message.error('Gagal memuat detail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Modal
      title="Detail Pegawai"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        {detailData && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card size="small" style={{ background: '#f0f5ff' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="NIP">
                      <strong>{detailData.nip}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Nama Lengkap">
                      <UserOutlined style={{ marginRight: 8 }} />
                      {detailData.nama}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Jabatan" span={2}>
                {detailData.nama_jabatan}
              </Descriptions.Item>

              <Descriptions.Item label="Jenjang">
                {detailData.nama_jenjang} (Tk. {detailData.tingkat})
              </Descriptions.Item>

              <Descriptions.Item label="Fungsi">
                {detailData.nama_fungsi}
              </Descriptions.Item>

              <Descriptions.Item label="Peran" span={2}>
                {detailData.daftar_peran?.map(peran => (
                  <Tag color="blue" key={peran.id} style={{ margin: '2px' }}>
                    {peran.nama_peran}
                  </Tag>
                ))}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                <MailOutlined style={{ marginRight: 8 }} />
                {detailData.email || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="No. HP">
                <PhoneOutlined style={{ marginRight: 8 }} />
                {detailData.no_hp || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="Tanggal Bergabung">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(detailData.tanggal_bergabung)}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Badge 
                  status={detailData.is_active ? 'success' : 'error'} 
                  text={detailData.is_active ? 'Aktif' : 'Tidak Aktif'} 
                />
              </Descriptions.Item>

              <Descriptions.Item label="Tanggal Dibuat">
                {formatDate(detailData.created_at)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default ModalDetailPegawai;