// frontend/components/master/modals/JabatanModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';

// PERBAIKAN: Import dengan curly braces untuk named export
import { masterService } from '../services/masterService';

const JabatanModal = ({ open, onClose, onSuccess, mode, data }) => {
  const [namaJabatan, setNamaJabatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      console.log('JabatanModal opened, mode:', mode, 'data:', data);
      if (mode === 'edit' && data) {
        setNamaJabatan(data.nama_jabatan || '');
      } else {
        setNamaJabatan('');
      }
      setError('');
    }
  }, [open, mode, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!namaJabatan.trim()) {
      setError('Nama jabatan harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      
      if (mode === 'add') {
        console.log('Creating jabatan:', { nama_jabatan: namaJabatan });
        response = await masterService.createJabatan({
          nama_jabatan: namaJabatan
        });
      } else {
        console.log('Updating jabatan:', data.id, { nama_jabatan: namaJabatan });
        response = await masterService.updateJabatan(data.id, {
          nama_jabatan: namaJabatan
        });
      }

      console.log('Response:', response);
      
      if (response.success) {
        onSuccess(mode === 'add' ? 'Jabatan berhasil ditambahkan' : 'Jabatan berhasil diperbarui');
        onClose();
      } else {
        setError(response.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      console.error('Error in JabatanModal:', err);
      
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('Anda tidak memiliki izin untuk menambah data jabatan');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Data tidak valid');
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNamaJabatan('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'add' ? 'Tambah Jabatan Baru' : 'Edit Jabatan'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Nama Jabatan"
            type="text"
            fullWidth
            variant="outlined"
            value={namaJabatan}
            onChange={(e) => setNamaJabatan(e.target.value)}
            disabled={loading}
            required
            placeholder="Masukkan nama jabatan"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose} 
            color="inherit"
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !namaJabatan.trim()}
            sx={{ minWidth: 100 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JabatanModal;