// components/master/modal/StatistikStandarModal.js
import React from 'react';
import { Modal, Row, Col, Card, Statistic, Table, Tag, Divider, Space } from 'antd';
import {
  BarChartOutlined,
  ApartmentOutlined,
  UserOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  PieChartOutlined
} from '@ant-design/icons';

const StatistikStandarModal = ({ visible, stats, onCancel }) => {
  if (!stats) return null;

  // Columns for per jenjang table
  const jenjangColumns = [
    {
      title: 'Jenjang',
      dataIndex: 'jenjang',
      key: 'jenjang',
      render: (text, record) => (
        <Tag color={
          record.tingkat === 1 ? 'success' :
          record.tingkat === 2 ? 'processing' :
          record.tingkat === 3 ? 'warning' : 'default'
        }>
          {text}
        </Tag>
      )
    },
    {
      title: 'Tingkat',
      dataIndex: 'tingkat',
      key: 'tingkat',
      width: 80
    },
    {
      title: 'Jumlah',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total) => (
        <span>
          <Badge count={total} style={{ backgroundColor: '#1890ff' }} />
          <span style={{ marginLeft: 8 }}>
            ({((total / stats.total) * 100).toFixed(1)}%)
          </span>
        </span>
      )
    }
  ];

  // Columns for per jabatan table
  const jabatanColumns = [
    {
      title: 'Jabatan',
      dataIndex: 'jabatan',
      key: 'jabatan',
      render: (text) => <Tag color="orange">{text}</Tag>
    },
    {
      title: 'Jumlah',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => (
        <span>
          <Badge count={total} style={{ backgroundColor: '#fa8c16' }} />
          <span style={{ marginLeft: 8 }}>
            ({((total / stats.total) * 100).toFixed(1)}%)
          </span>
        </span>
      )
    }
  ];

  // Columns for per fungsi table
  const fungsiColumns = [
    {
      title: 'Fungsi',
      dataIndex: 'fungsi',
      key: 'fungsi',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Jumlah',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => (
        <span>
          <Badge count={total} style={{ backgroundColor: '#722ed1' }} />
          <span style={{ marginLeft: 8 }}>
            ({((total / stats.total) * 100).toFixed(1)}%)
          </span>
        </span>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined style={{ color: '#1890ff' }} />
          <span>Statistik Standar Kompetensi</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ background: '#e6f7ff' }}>
            <Statistic
              title="Total Mapping"
              value={stats.total}
              prefix={<UnorderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic
              title="Total Jabatan"
              value={stats.byJabatan.length}
              prefix={<ProfileOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
            <Statistic
              title="Total Jenjang"
              value={stats.byJenjang.length}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f0ff' }}>
            <Statistic
              title="Total Fungsi"
              value={stats.byFungsi.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Per Jenjang Table */}
      <Divider orientation="left">
        <Space>
          <PieChartOutlined />
          Distribusi per Jenjang
        </Space>
      </Divider>
      <Table
        columns={jenjangColumns}
        dataSource={stats.byJenjang}
        rowKey="jenjang"
        pagination={false}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {/* Per Jabatan Table */}
      <Divider orientation="left">
        <Space>
          <PieChartOutlined />
          Top 10 Jabatan
        </Space>
      </Divider>
      <Table
        columns={jabatanColumns}
        dataSource={stats.byJabatan.slice(0, 10)}
        rowKey="jabatan"
        pagination={false}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {/* Per Fungsi Table */}
      <Divider orientation="left">
        <Space>
          <PieChartOutlined />
          Distribusi per Fungsi
        </Space>
      </Divider>
      <Table
        columns={fungsiColumns}
        dataSource={stats.byFungsi}
        rowKey="fungsi"
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

// Badge component
const Badge = ({ count, style }) => (
  <span style={{
    display: 'inline-block',
    padding: '0 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '12px',
    lineHeight: '20px',
    ...style
  }}>
    {count}
  </span>
);

export default StatistikStandarModal;