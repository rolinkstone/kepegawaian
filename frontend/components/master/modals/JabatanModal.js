// frontend/src/components/kepegawaian/modals/JabatanModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';

import { masterService } from '../services/masterService';

const JabatanModal = ({ open, onClose, onSuccess, mode, data }) => {
  const [namaJabatan, setNamaJabatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      console.log('JabatanModal opened, mode:', mode, 'data:', data);
      if (mode === 'edit' && data) {
        setNamaJabatan(data.nama_jabatan || '');
      } else {
        setNamaJabatan('');
      }
      setError('');
      setSuccessMessage('');
    }
  }, [open, mode, data]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

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
        const successMsg = mode === 'add' 
          ? 'Jabatan berhasil ditambahkan' 
          : 'Jabatan berhasil diperbarui';
        
        showSuccess(successMsg);
        
        // Beri waktu untuk menampilkan pesan sukses
        setTimeout(() => {
          onSuccess(successMsg);
          handleClose();
        }, 1500);
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
      setSuccessMessage('');
      setSnackbarOpen(false);
      onClose();
    }
  };

  return (
    <>
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
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
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
              error={!!error && !namaJabatan.trim()}
              helperText={error && !namaJabatan.trim() ? 'Nama jabatan wajib diisi' : ''}
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

export default JabatanModal;