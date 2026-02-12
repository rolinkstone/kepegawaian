// frontend/src/components/kepegawaian/modals/FungsiModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';

import { masterService } from '../services/masterService';

const FungsiModal = ({ open, onClose, onSuccess, mode, data }) => {
  const [formData, setFormData] = useState({
    nama_fungsi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          nama_fungsi: data.nama_fungsi || ''
        });
      } else {
        setFormData({ nama_fungsi: '' });
      }
      setError('');
    }
  }, [open, mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nama_fungsi.trim()) {
      setError('Nama fungsi harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'add') {
        await masterService.createFungsi(formData);
        showSuccess('Fungsi berhasil ditambahkan');
      } else {
        await masterService.updateFungsi(data.id, formData);
        showSuccess('Fungsi berhasil diupdate');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving fungsi:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
        showError(error.response.data.message);
      } else {
        setError('Terjadi kesalahan saat menyimpan data');
        showError('Gagal menyimpan data');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Tambah Fungsi Baru' : 'Edit Fungsi'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            fullWidth
            label="Nama Fungsi"
            name="nama_fungsi"
            value={formData.nama_fungsi}
            onChange={handleChange}
            placeholder="Contoh: Pengujian, Pemeriksaan"
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="caption" color="textSecondary">
            Nama fungsi harus unik dan tidak boleh sama dengan yang sudah ada.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.nama_fungsi.trim()}
        >
          {loading ? <CircularProgress size={24} /> : mode === 'add' ? 'Simpan' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FungsiModal;