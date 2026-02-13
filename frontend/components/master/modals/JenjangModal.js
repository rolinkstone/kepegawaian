// frontend/src/components/kepegawaian/modals/JenjangModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Typography,
  Snackbar
} from '@mui/material';
import { masterService } from '../services/masterService';

const JenjangModal = ({ open, onClose, onSuccess, mode, data }) => {
  const [formData, setFormData] = useState({
    nama_jenjang: '',
    tingkat: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          nama_jenjang: data.nama_jenjang || '',
          tingkat: data.tingkat || 0
        });
      } else {
        setFormData({
          nama_jenjang: '',
          tingkat: 0
        });
      }
      setError('');
      setSuccessMessage('');
    }
  }, [open, mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setSnackbarOpen(true);
  };

  const showError = (message) => {
    setError(message);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.nama_jenjang.trim()) {
      setError('Nama jenjang harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'add') {
        await masterService.createJenjang(formData);
        showSuccess('Jenjang berhasil ditambahkan');
      } else {
        await masterService.updateJenjang(data.id, formData);
        showSuccess('Jenjang berhasil diupdate');
      }
      
      // Beri waktu untuk menampilkan pesan sukses
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving jenjang:', error);
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

  const tingkatOptions = [
    { value: 0, label: 'Universal / Tanpa Tingkat' },
    { value: 1, label: 'Tingkat 1 - Ahli Pertama' },
    { value: 2, label: 'Tingkat 2 - Ahli Muda' },
    { value: 3, label: 'Tingkat 3 - Ahli Madya' },
    { value: 4, label: 'Tingkat 4 - Ahli Utama' }
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mode === 'add' ? 'Tambah Jenjang Baru' : 'Edit Jenjang'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nama Jenjang"
                  name="nama_jenjang"
                  value={formData.nama_jenjang}
                  onChange={handleChange}
                  placeholder="Contoh: Ahli Pertama, Ahli Muda"
                  required
                  disabled={loading}
                  error={!!error && !formData.nama_jenjang.trim()}
                  helperText={error && !formData.nama_jenjang.trim() ? 'Nama jenjang wajib diisi' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tingkat</InputLabel>
                  <Select
                    name="tingkat"
                    value={formData.tingkat}
                    onChange={handleChange}
                    label="Tingkat"
                    disabled={loading}
                  >
                    {tingkatOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
              Tingkat digunakan untuk menentukan urutan jenjang dan reuse kompetensi.
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
            disabled={loading || !formData.nama_jenjang.trim()}
          >
            {loading ? <CircularProgress size={24} /> : mode === 'add' ? 'Simpan' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar untuk notifikasi sukses */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default JenjangModal;