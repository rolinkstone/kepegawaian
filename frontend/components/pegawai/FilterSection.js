import React from 'react';
import { Row, Col, Input, Select, Button, Space, Form } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const FilterSection = ({ filters, onFilter, onReset, options }) => {
  const [form] = Form.useForm();

  const handleSearch = (value) => {
    onFilter({ search: value });
  };

  const handleChange = (changedValues, allValues) => {
    onFilter(allValues);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={filters}
      onValuesChange={handleChange}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="search" label="Pencarian">
            <Search
              placeholder="Cari NIP/Nama/Email"
              allowClear
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Form.Item name="id_fungsi" label="Fungsi">
            <Select 
              placeholder="Pilih Fungsi" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {options.fungsi?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Form.Item name="id_jabatan" label="Jabatan">
            <Select 
              placeholder="Pilih Jabatan" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {options.jabatan?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Form.Item name="id_jenjang" label="Jenjang">
            <Select 
              placeholder="Pilih Jenjang" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {options.jenjang?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={3}>
          <Form.Item name="is_active" label="Status">
            <Select placeholder="Pilih Status" allowClear>
              <Option value={true}>Aktif</Option>
              <Option value={false}>Tidak Aktif</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Form.Item>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default FilterSection;