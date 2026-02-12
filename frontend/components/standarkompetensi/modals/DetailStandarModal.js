// components/master/modal/DetailStandarModal.js
import React from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Divider } from 'antd';
import {
  UnorderedListOutlined,
  ProfileOutlined,
  ApartmentOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TagOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DetailStandarModal = ({ visible, data, onCancel }) => {
  if (!data) return null;

  const getTingkatColor = (tingkat) => {
    const colors = {
      1: 'success',
      2: 'processing',
      3: 'warning',
      0: 'default'
    };
    return colors[tingkat] || 'default';
  };

  const getTingkatLabel = (tingkat) => {
    const labels = {
      1: 'Ahli Pertama',
      2: 'Ahli Muda',
      3: 'Ahli Madya',
      0: 'Universal'
    };
    return labels[tingkat] || 'Unknown';
  };

  return (
    <Modal
      title={
        <Space>
          <UnorderedListOutlined style={{ color: '#1890ff' }} />
          <span>Detail Standar Kompetensi</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <div style={{ marginBottom: 24 }}>
        <Tag color="geekblue" style={{ fontSize: '14px', padding: '4px 12px' }}>
          {data.kode_kompetensi}
        </Tag>
        <Title level={5} style={{ marginTop: 8, marginBottom: 0 }}>
          {data.nama_kompetensi}
        </Title>
      </div>

      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="ID Mapping" span={1}>
          <Tag color="cyan">{data.id_mapping}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="ID Kompetensi" span={1}>
          <Tag color="cyan">{data.id_kompetensi}</Tag>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <ProfileOutlined />
              Jabatan
            </Space>
          } 
          span={1}
        >
          <Tag color="orange">{data.jabatan}</Tag>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <ApartmentOutlined />
              Jenjang
            </Space>
          } 
          span={1}
        >
          <Space direction="vertical" size={0}>
            <Tag color={getTingkatColor(data.tingkat_jenjang)}>
              {data.jenjang} 
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getTingkatLabel(data.tingkat_jenjang)}
            </Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <UserOutlined />
              Fungsi
            </Space>
          } 
          span={1}
        >
          <Tag color="blue">{data.fungsi}</Tag>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <UserOutlined />
              Peran
            </Space>
          } 
          span={1}
        >
          <Tag color="green">{data.peran}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">
        <Space>
          <TagOutlined />
          Informasi Tambahan
        </Space>
      </Divider>

      <div style={{ padding: '0 8px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Kode Lengkap: </Text>
            <div style={{ marginTop: 4 }}>
              <Text code>{data.kode_kompetensi} - {data.nama_kompetensi}</Text>
            </div>
          </div>
          
          <div>
            <Text strong style={{ marginTop: 8 }}>Mapping: </Text>
            <div style={{ marginTop: 4 }}>
              <Text>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> 
                {data.jabatan} - {data.jenjang}
              </Text>
              <br />
              <Text type="secondary" style={{ marginLeft: 24 }}>
                ({data.fungsi} - {data.peran})
              </Text>
            </div>
          </div>
        </Space>
      </div>
    </Modal>
  );
};

export default DetailStandarModal;