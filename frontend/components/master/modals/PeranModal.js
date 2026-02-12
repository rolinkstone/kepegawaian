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
  Typography
} from '@mui/material';
import { masterService } from '../services/masterService';


const PeranModal = ({ open, onClose, onSuccess, mode, data, fungsiList }) => {
  const [formData, setFormData] = useState({
    id_fungsi: '',
    nama_peran: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          id_fungsi: data.id_fungsi || '',
          nama_peran: data.nama_peran || ''
        });
      } else {
        setFormData({
          id_fungsi: '',
          nama_peran: ''
        });
      }
      setError('');
    }
  }, [open, mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      onSuccess();
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Tambah Peran Baru' : 'Edit Peran'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Fungsi</InputLabel>
                <Select
                  name="id_fungsi"
                  value={formData.id_fungsi}
                  onChange={handleChange}
                  label="Fungsi"
                  disabled={loading}
                >
                  <MenuItem value="">-- Pilih Fungsi --</MenuItem>
                  {fungsiList.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.nama_fungsi}
                    </MenuItem>
                  ))}
                </Select>
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
              />
            </Grid>
          </Grid>
          
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            Peran terikat dengan fungsi. Setiap fungsi dapat memiliki beberapa peran.
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
  );
};

export default PeranModal;