// frontend/src/components/kepegawaian/modals/KompetensiModal.js
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
  Divider,
  Chip,
  IconButton,
  Paper,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { masterService } from '../services/masterService';

const KompetensiModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  mode, 
  data, 
  fungsiList, 
  peranList,
  jabatanList,
  jenjangList 
}) => {
  const [formData, setFormData] = useState({
    kode_kompetensi: '',
    nama_kompetensi: '',
    deskripsi: '',
    id_fungsi: '',
    id_peran: ''
  });
  const [mapping, setMapping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredPeran, setFilteredPeran] = useState([]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          kode_kompetensi: data.kode_kompetensi || '',
          nama_kompetensi: data.nama_kompetensi || '',
          deskripsi: data.deskripsi || '',
          id_fungsi: data.id_fungsi || '',
          id_peran: data.id_peran || ''
        });
        setMapping(data.mapping || []);
      } else {
        setFormData({
          kode_kompetensi: '',
          nama_kompetensi: '',
          deskripsi: '',
          id_fungsi: '',
          id_peran: ''
        });
        setMapping([]);
      }
      setError('');
    }
  }, [open, mode, data]);

  // Filter peran berdasarkan fungsi yang dipilih
  useEffect(() => {
    if (formData.id_fungsi) {
      setFilteredPeran(peranList.filter(p => p.id_fungsi === parseInt(formData.id_fungsi)));
      if (mode !== 'edit') {
        setFormData(prev => ({ ...prev, id_peran: '' }));
      }
    } else {
      setFilteredPeran([]);
    }
  }, [formData.id_fungsi, peranList, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMapping = () => {
    setMapping([
      ...mapping,
      {
        id_jabatan: '',
        id_jenjang: '',
        is_mandatory: true,
        temporary: true
      }
    ]);
  };

  const handleMappingChange = (index, field, value) => {
    const updated = [...mapping];
    updated[index][field] = value;
    setMapping(updated);
  };

  const handleDeleteMapping = (index) => {
    const updated = mapping.filter((_, i) => i !== index);
    setMapping(updated);
  };

  const validateMapping = () => {
    for (let map of mapping) {
      if (!map.id_jabatan || !map.id_jenjang) {
        setError('Semua mapping harus memiliki jabatan dan jenjang');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.kode_kompetensi.trim()) {
      setError('Kode kompetensi harus diisi');
      return;
    }
    if (!formData.nama_kompetensi.trim()) {
      setError('Nama kompetensi harus diisi');
      return;
    }
    if (!formData.id_fungsi) {
      setError('Fungsi harus dipilih');
      return;
    }
    if (!formData.id_peran) {
      setError('Peran harus dipilih');
      return;
    }

    if (!validateMapping()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        mapping: mapping.map(({ id_jabatan, id_jenjang, is_mandatory }) => ({
          id_jabatan,
          id_jenjang,
          is_mandatory
        }))
      };

      if (mode === 'add') {
        await masterService.createKompetensi(payload);
        showSuccess('Kompetensi berhasil ditambahkan');
      } else {
        await masterService.updateKompetensi(data.id, payload);
        showSuccess('Kompetensi berhasil diupdate');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving kompetensi:', error);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Tambah Kompetensi Baru' : 'Edit Kompetensi'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {/* Kode Kompetensi */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kode Kompetensi"
                name="kode_kompetensi"
                value={formData.kode_kompetensi}
                onChange={handleChange}
                placeholder="Contoh: K001, P001, A001"
                required
                disabled={loading}
              />
            </Grid>
            
            {/* Fungsi */}
            <Grid item xs={12} md={6}>
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
            
            {/* Peran */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!formData.id_fungsi}>
                <InputLabel>Peran</InputLabel>
                <Select
                  name="id_peran"
                  value={formData.id_peran}
                  onChange={handleChange}
                  label="Peran"
                  disabled={loading || !formData.id_fungsi}
                >
                  <MenuItem value="">-- Pilih Peran --</MenuItem>
                  {filteredPeran.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nama_peran}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Nama Kompetensi - Full width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Kompetensi"
                name="nama_kompetensi"
                value={formData.nama_kompetensi}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap kompetensi"
                required
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>
            
            {/* Deskripsi */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deskripsi (Opsional)"
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Masukkan deskripsi kompetensi"
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>
            <Chip label="Mapping Jabatan & Jenjang" color="primary" />
          </Divider>

          {/* Mapping Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                Mapping Kompetensi ke Jabatan & Jenjang
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddMapping}
                size="small"
                variant="outlined"
              >
                Tambah Mapping
              </Button>
            </Box>

            {mapping.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  Belum ada mapping. Klik "Tambah Mapping" untuk menambahkan.
                </Typography>
              </Paper>
            ) : (
              mapping.map((map, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, position: 'relative' }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jabatan</InputLabel>
                        <Select
                          value={map.id_jabatan || ''}
                          onChange={(e) => handleMappingChange(index, 'id_jabatan', e.target.value)}
                          label="Jabatan"
                          size="small"
                        >
                          <MenuItem value="">-- Pilih Jabatan --</MenuItem>
                          {jabatanList.map((j) => (
                            <MenuItem key={j.id} value={j.id}>
                              {j.nama_jabatan}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jenjang</InputLabel>
                        <Select
                          value={map.id_jenjang || ''}
                          onChange={(e) => handleMappingChange(index, 'id_jenjang', e.target.value)}
                          label="Jenjang"
                          size="small"
                        >
                          <MenuItem value="">-- Pilih Jenjang --</MenuItem>
                          {jenjangList.map((j) => (
                            <MenuItem key={j.id} value={j.id}>
                              {j.nama_jenjang} (Tingkat {j.tingkat})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={map.is_mandatory !== false}
                            onChange={(e) => handleMappingChange(index, 'is_mandatory', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Wajib"
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteMapping(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))
            )}

            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              * Satu kompetensi dapat dimapping ke beberapa kombinasi jabatan & jenjang (reuse kompetensi)
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.kode_kompetensi || !formData.nama_kompetensi || !formData.id_fungsi || !formData.id_peran}
        >
          {loading ? <CircularProgress size={24} /> : mode === 'add' ? 'Simpan' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KompetensiModal;