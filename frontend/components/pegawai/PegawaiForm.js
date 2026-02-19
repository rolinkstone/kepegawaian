import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Switch } from 'antd';

const { Option } = Select;

const PegawaiForm = ({ form, initialValues, options, isEditing = false }) => {
  // Peran options dikelompokkan berdasarkan fungsi
  const peranOptions = options.peran?.reduce((acc, peran) => {
    const fungsi = peran.fungsi || 'Lainnya';
    if (!acc[fungsi]) {
      acc[fungsi] = [];
    }
    acc[fungsi].push(peran);
    return acc;
  }, {});

  useEffect(() => {
    if (initialValues && form) {
      // Parse id_peran jika berupa string
      let peranValue = initialValues.id_peran;
      if (typeof peranValue === 'string' && peranValue.includes(',')) {
        peranValue = peranValue.split(',').map(id => parseInt(id.trim()));
      }
      
      form.setFieldsValue({
        ...initialValues,
        id_peran: peranValue,
        is_active: initialValues.is_active === 1 || initialValues.is_active === true
      });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ is_active: true }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="nip"
            label="NIP"
            rules={[
              { required: true, message: 'NIP harus diisi' },
              { pattern: /^\d{18}$/, message: 'NIP harus 18 digit angka' }
            ]}
          >
            <Input placeholder="Masukkan NIP (18 digit)" maxLength={18} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="nama"
            label="Nama Lengkap"
            rules={[{ required: true, message: 'Nama harus diisi' }]}
          >
            <Input placeholder="Masukkan nama lengkap" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="id_fungsi"
            label="Fungsi"
            rules={[{ required: true, message: 'Fungsi harus dipilih' }]}
          >
            <Select placeholder="Pilih Fungsi" showSearch optionFilterProp="children">
              {options.fungsi?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="id_jabatan"
            label="Jabatan"
            rules={[{ required: true, message: 'Jabatan harus dipilih' }]}
          >
            <Select placeholder="Pilih Jabatan" showSearch optionFilterProp="children">
              {options.jabatan?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="id_jenjang"
            label="Jenjang"
            rules={[{ required: true, message: 'Jenjang harus dipilih' }]}
          >
            <Select placeholder="Pilih Jenjang" showSearch optionFilterProp="children">
              {options.jenjang?.map(item => (
                <Option key={item.id} value={item.id}>{item.nama}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="id_peran"
        label="Peran"
        rules={[{ required: true, message: 'Minimal satu peran harus dipilih' }]}
      >
        <Select 
          mode="multiple" 
          placeholder="Pilih Peran"
          showSearch
          optionFilterProp="children"
        >
          {peranOptions && Object.entries(peranOptions).map(([fungsi, perans]) => (
            <Select.OptGroup label={fungsi} key={fungsi}>
              {perans.map(peran => (
                <Option key={peran.id} value={peran.id}>{peran.nama}</Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Format email tidak valid' }
            ]}
          >
            <Input placeholder="Masukkan email" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="no_hp"
            label="No. HP"
          >
            <Input placeholder="Masukkan nomor HP" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="tanggal_bergabung"
            label="Tanggal Bergabung"
          >
            <Input type="date" placeholder="Pilih tanggal" />
          </Form.Item>
        </Col>

        {isEditing && (
          <Col span={12}>
            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Aktif" 
                unCheckedChildren="Tidak Aktif"
              />
            </Form.Item>
          </Col>
        )}
      </Row>
    </Form>
  );
};

export default PegawaiForm;