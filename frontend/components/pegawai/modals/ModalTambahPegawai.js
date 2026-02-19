import React from 'react';
import { Modal, Form, message } from 'antd';
import PegawaiForm from '../PegawaiForm';

const ModalTambahPegawai = ({ visible, onCancel, onSuccess, options, session }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = getToken();

      // Format tanggal jika ada
      if (values.tanggal_bergabung) {
        // Pastikan format tanggal YYYY-MM-DD
        if (values.tanggal_bergabung.includes('T')) {
          values.tanggal_bergabung = values.tanggal_bergabung.split('T')[0];
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pegawai`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        }
      );

      const result = await response.json();

      if (result.success) {
        message.success('Pegawai berhasil ditambahkan');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        throw new Error(result.message || 'Gagal menambahkan pegawai');
      }
    } catch (error) {
      console.error('Error adding pegawai:', error);
      
      if (error.message) {
        message.error(error.message);
      } else if (error.errorFields) {
        message.error('Harap isi semua field yang required');
      } else {
        message.error('Gagal menambahkan pegawai: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tambah Pegawai Baru"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Simpan"
      cancelText="Batal"
      style={{ top: 20 }}
    >
      <PegawaiForm 
        form={form} 
        options={options}
        isEditing={false}
      />
    </Modal>
  );
};

export default ModalTambahPegawai;