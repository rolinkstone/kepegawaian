// components/master/modal/ExportStandarModal.js
import React, { useState } from 'react';
import {
  Modal,
  Radio,
  Space,
  Typography,
  Button,
  message,
  Alert,
  Checkbox,
  Divider
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const ExportStandarModal = ({ visible, data, onCancel, onSuccess }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Prepare export data
      const exportData = data.map((item, index) => ({
        'No': index + 1,
        'Kode Kompetensi': item.kode_kompetensi,
        'Nama Kompetensi': item.nama_kompetensi,
        'Jabatan': item.jabatan,
        'Jenjang': `${item.jenjang} (Level ${item.tingkat_jenjang})`,
        'Fungsi': item.fungsi,
        'Peran': item.peran,
        'ID Mapping': item.id_mapping
      }));

      // Convert to CSV
      if (exportFormat === 'excel') {
        const headers = includeHeaders ? Object.keys(exportData[0]) : [];
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            Object.values(row).map(value => 
              typeof value === 'string' && (value.includes(',') || value.includes('\n')) 
                ? `"${value}"` 
                : value
            ).join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `standar-kompetensi-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        message.success(`Berhasil mengexport ${exportData.length} data`);
      }

      if (exportFormat === 'pdf') {
        message.info('Format PDF akan segera tersedia');
      }

      if (exportFormat === 'print') {
        window.print();
      }

      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('Export error:', error);
      message.error('Gagal mengexport data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined style={{ color: '#1890ff' }} />
          <span>Export Standar Kompetensi</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Batal
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
          disabled={!data || data.length === 0}
        >
          Export
        </Button>
      ]}
      width={500}
      destroyOnClose
    >
      <Alert
        message="Informasi Export"
        description={`Anda akan mengexport ${data?.length || 0} data standar kompetensi`}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider orientation="left">Format Export</Divider>
      
      <Radio.Group 
        value={exportFormat} 
        onChange={(e) => setExportFormat(e.target.value)}
        style={{ width: '100%', marginBottom: 24 }}
      >
        <Space direction="vertical">
          <Radio value="excel">
            <Space>
              <FileExcelOutlined style={{ color: '#52c41a' }} />
              Microsoft Excel (.csv)
            </Space>
          </Radio>
          <Radio value="pdf" disabled>
            <Space>
              <FilePdfOutlined style={{ color: '#ff4d4f' }} />
              PDF Document (.pdf) - Segera hadir
            </Space>
          </Radio>
          <Radio value="print">
            <Space>
              <PrinterOutlined style={{ color: '#1890ff' }} />
              Print / Cetak
            </Space>
          </Radio>
        </Space>
      </Radio.Group>

      <Divider orientation="left">Pengaturan</Divider>

      <Checkbox
        checked={includeHeaders}
        onChange={(e) => setIncludeHeaders(e.target.checked)}
        disabled={exportFormat === 'print'}
      >
        Sertakan header kolom
      </Checkbox>
      
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          File akan diunduh dalam format CSV yang dapat dibuka dengan Microsoft Excel
        </Text>
      </div>
    </Modal>
  );
};

export default ExportStandarModal;