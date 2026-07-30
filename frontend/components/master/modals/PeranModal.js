// frontend/src/components/kepegawaian/modals/PeranModal.js
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
  Snackbar,
  FormControlLabel,
  Switch
} from '@mui/material';
import { masterService } from '../services/masterService';

const PeranModal = ({ open, onClose, onSuccess, mode, data, fungsiList }) => {
  const [formData, setFormData] = useState({
    id_fungsi: '',
    nama_peran: '',
    is_lintas_fungsi: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          id_fungsi: data.id_fungsi || '',
          nama_peran: data.nama_peran || '',
          is_lintas_fungsi: data.is_lintas_fungsi === 1 || data.is_lintas_fungsi === true
        });
      } else {
        setFormData({
          id_fungsi: '',
          nama_peran: '',
          is_lintas_fungsi: false
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
    if (!formData.id_fungsi) {
      setError('Fungsi harus dipilih');
      return;
    }
    if (!formData.nama_peran.trim()) {
      setError('Nama peran harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'add') {
        await masterService.createPeran(formData);
        showSuccess('Peran berhasil ditambahkan');
      } else {
        await masterService.updatePeran(data.id, formData);
        showSuccess('Peran berhasil diupdate');
      }
      
      // Beri waktu untuk menampilkan pesan sukses sebelum menutup modal
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving peran:', error);
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
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mode === 'add' ? 'Tambah Peran Baru' : 'Edit Peran'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!error && !formData.id_fungsi}>
                  <InputLabel>Fungsi</InputLabel>
                  <Select
                    name="id_fungsi"
                    value={formData.id_fungsi}
                    onChange={handleChange}
                    label="Fungsi"
                    disabled={loading}
                  >
                    <MenuItem value="">-- Pilih Fungsi --</MenuItem>
                    {fungsiList && fungsiList.length > 0 ? (
                      fungsiList.map((f) => (
                        <MenuItem key={f.id} value={f.id}>
                          {f.nama_fungsi}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Tidak ada data fungsi</MenuItem>
                    )}
                  </Select>
                  {error && !formData.id_fungsi && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      Fungsi harus dipilih
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nama Peran"
                  name="nama_peran"
                  value={formData.nama_peran}
                  onChange={handleChange}
                  placeholder="Contoh: Penguji, Pemeriksa, Auditor Internal"
                  required
                  disabled={loading}
                  error={!!error && !formData.nama_peran.trim()}
                  helperText={error && !formData.nama_peran.trim() ? 'Nama peran wajib diisi' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_lintas_fungsi}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_lintas_fungsi: e.target.checked }))}
                      name="is_lintas_fungsi"
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Lintas Fungsi</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Jika diaktifkan, peran ini akan muncul di semua fungsi
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
              Peran terikat dengan fungsi. Setiap fungsi dapat memiliki beberapa peran.
              Centang "Lintas Fungsi" jika peran ini harus muncul di semua fungsi (misal: BMN).
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
            disabled={loading || !formData.id_fungsi || !formData.nama_peran.trim()}
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

export default PeranModal;