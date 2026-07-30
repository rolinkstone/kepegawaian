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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon,
  ClearAll as ClearAllIcon
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
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filteredPeran, setFilteredPeran] = useState([]);
  const [filteredPeranMapping, setFilteredPeranMapping] = useState([]);

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
        
        // Transform mapping data dengan menambahkan id_peran jika belum ada
        const mappingData = (data.mapping || []).map(m => ({
          ...m,
          id_peran: m.id_peran || data.id_peran || '', // Default ke peran kompetensi jika belum ada
          temporary: m.temporary || false
        }));
        setMapping(mappingData);
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
      setSuccessMessage('');
    }
  }, [open, mode, data]);

  // Filter peran berdasarkan fungsi yang dipilih (tampilkan juga peran lintas fungsi)
  useEffect(() => {
    if (formData.id_fungsi) {
      const filtered = peranList.filter(p => 
        p.id_fungsi === parseInt(formData.id_fungsi) ||
        p.is_lintas_fungsi === 1 || p.is_lintas_fungsi === true
      );
      setFilteredPeran(filtered);
      setFilteredPeranMapping(filtered);
      
      if (mode !== 'edit') {
        setFormData(prev => ({ ...prev, id_peran: '' }));
      }
    } else {
      setFilteredPeran([]);
      setFilteredPeranMapping([]);
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
        id_peran: formData.id_peran || '', // Default ke peran kompetensi
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

  // Mapping ke semua jabatan & jenjang
  const handleMapAll = () => {
    if (!formData.id_peran) {
      setError('Pilih peran default terlebih dahulu');
      return;
    }

    const existingKeys = new Set(mapping.map(m => `${m.id_jabatan}-${m.id_jenjang}`));
    const newMapping = [...mapping];
    let addedCount = 0;

    for (const jabatan of jabatanList) {
      for (const jenjang of jenjangList) {
        const key = `${jabatan.id}-${jenjang.id}`;
        if (!existingKeys.has(key)) {
          newMapping.push({
            id_jabatan: parseInt(jabatan.id),
            id_jenjang: parseInt(jenjang.id),
            id_peran: parseInt(formData.id_peran),
            is_mandatory: true,
            temporary: true
          });
          addedCount++;
        }
      }
    }

    setMapping(newMapping);
    setSuccessMessage(`${addedCount} mapping baru ditambahkan!`);
    setSnackbarOpen(true);
  };

  // Kosongkan semua mapping
  const handleClearMapping = () => {
    if (mapping.length === 0) return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus semua mapping?')) {
      setMapping([]);
      setSuccessMessage('Semua mapping berhasil dihapus');
      setSnackbarOpen(true);
    }
  };

  const validateMapping = () => {
    for (let map of mapping) {
      if (!map.id_jabatan) {
        setError('Semua mapping harus memiliki jabatan');
        return false;
      }
      if (!map.id_jenjang) {
        setError('Semua mapping harus memiliki jenjang');
        return false;
      }
      if (!map.id_peran) {
        setError('Semua mapping harus memiliki peran');
        return false;
      }
    }

    // Cek duplikasi mapping (jabatan + jenjang + peran)
    const seen = new Set();
    for (let map of mapping) {
      const key = `${map.id_jabatan}|${map.id_jenjang}|${map.id_peran}`;
      if (seen.has(key)) {
        setError(`Terdapat mapping duplikat untuk Jabatan: ${getJabatanName(map.id_jabatan)}, Jenjang: ${getJenjangName(map.id_jenjang)}, Peran: ${getPeranName(map.id_peran)}`);
        return false;
      }
      seen.add(key);
    }

    return true;
  };

  // Helper functions
  const getJabatanName = (id) => {
    if (!id) return '-';
    const jabatan = jabatanList.find(j => j.id === parseInt(id));
    return jabatan?.nama_jabatan || `ID: ${id}`;
  };

  const getJenjangName = (id) => {
    if (!id) return '-';
    const jenjang = jenjangList.find(j => j.id === parseInt(id));
    return jenjang?.nama_jenjang || `ID: ${id}`;
  };

  const getPeranName = (id) => {
    if (!id) return '-';
    const peran = peranList.find(p => p.id === parseInt(id));
    return peran?.nama_peran || `ID: ${id}`;
  };

  const getPeranColor = (id) => {
    if (!id) return 'default';
    const peran = peranList.find(p => p.id === parseInt(id));
    switch(peran?.nama_peran) {
      case 'Penguji': return 'primary';
      case 'Pemeriksa': return 'success';
      case 'Sertifikasi': return 'warning';
      case 'Auditor Internal': return 'info';
      default: return 'default';
    }
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
    // Validasi
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
      setError('Peran default harus dipilih');
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
        mapping: mapping.map(({ id_jabatan, id_jenjang, id_peran, is_mandatory }) => ({
          id_jabatan: parseInt(id_jabatan),
          id_jenjang: parseInt(id_jenjang),
          id_peran: parseInt(id_peran),
          is_mandatory: is_mandatory !== false
        }))
      };

      if (mode === 'add') {
        await masterService.createKompetensi(payload);
        showSuccess('Kompetensi berhasil ditambahkan');
      } else {
        await masterService.updateKompetensi(data.id, payload);
        showSuccess('Kompetensi berhasil diupdate');
      }
      
      // Beri waktu untuk menampilkan pesan sukses
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
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
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'add' ? 'Tambah Kompetensi Baru' : 'Edit Kompetensi'}
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
              {/* Kode Kompetensi - BISA DIEDIT UNTUK EDIT MODE */}
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
                  error={!!error && !formData.kode_kompetensi.trim()}
                  helperText={error && !formData.kode_kompetensi.trim() ? 'Kode kompetensi wajib diisi' : ''}
                  InputProps={{
                    // Hapus readOnly agar bisa diedit
                  }}
                />
              </Grid>
              
              {/* Fungsi - TIDAK BISA DIEDIT SAAT EDIT MODE */}
              <Grid item xs={12} md={6}>
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
                    {fungsiList.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.nama_fungsi}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && !formData.id_fungsi && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      Fungsi harus dipilih
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              {/* Peran Default - TIDAK BISA DIEDIT SAAT EDIT MODE */}
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  required 
                  disabled={!formData.id_fungsi || mode === 'edit'}
                  error={!!error && !formData.id_peran}
                >
                  <InputLabel>Peran Default</InputLabel>
                  <Select
                    name="id_peran"
                    value={formData.id_peran}
                    onChange={handleChange}
                    label="Peran Default"
                    disabled={loading || !formData.id_fungsi}
                  >
                    <MenuItem value="">-- Pilih Peran Default --</MenuItem>
                    {filteredPeran.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nama_peran}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && !formData.id_peran && formData.id_fungsi && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      Peran default harus dipilih
                    </Typography>
                  )}
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
                  error={!!error && !formData.nama_kompetensi.trim()}
                  helperText={error && !formData.nama_kompetensi.trim() ? 'Nama kompetensi wajib diisi' : ''}
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
              <Chip label="Mapping Jabatan, Jenjang & Peran" color="primary" />
            </Divider>

            {/* Mapping Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  Mapping Kompetensi ke Jabatan, Jenjang & Peran
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleMapAll}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    disabled={loading || !formData.id_peran || !formData.id_fungsi}
                    title="Mapping ke semua jabatan & jenjang"
                  >
                    Mapping ke Semua
                  </Button>
                  <Button
                    startIcon={<ClearAllIcon />}
                    onClick={handleClearMapping}
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={loading || mapping.length === 0}
                    title="Hapus semua mapping"
                  >
                    Kosongkan
                  </Button>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddMapping}
                    size="small"
                    variant="outlined"
                    disabled={loading || !formData.id_fungsi}
                  >
                    Tambah Mapping
                  </Button>
                </Box>
              </Box>

              {!formData.id_fungsi && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Pilih fungsi terlebih dahulu untuk menambahkan mapping
                </Alert>
              )}

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
                    sx={{ p: 2, mb: 2, position: 'relative', borderLeft: 6, borderLeftColor: getPeranColor(map.id_peran) || 'grey.300' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Jabatan</InputLabel>
                          <Select
                            value={map.id_jabatan || ''}
                            onChange={(e) => handleMappingChange(index, 'id_jabatan', e.target.value)}
                            label="Jabatan"
                            size="small"
                            disabled={loading}
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
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Jenjang</InputLabel>
                          <Select
                            value={map.id_jenjang || ''}
                            onChange={(e) => handleMappingChange(index, 'id_jenjang', e.target.value)}
                            label="Jenjang"
                            size="small"
                            disabled={loading}
                          >
                            <MenuItem value="">-- Pilih Jenjang --</MenuItem>
                            {jenjangList.map((j) => (
                              <MenuItem key={j.id} value={j.id}>
                                {j.nama_jenjang} (Tkt {j.tingkat})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Peran</InputLabel>
                          <Select
                            value={map.id_peran || ''}
                            onChange={(e) => handleMappingChange(index, 'id_peran', e.target.value)}
                            label="Peran"
                            size="small"
                            disabled={loading || !formData.id_fungsi}
                          >
                            <MenuItem value="">-- Pilih Peran --</MenuItem>
                            {filteredPeranMapping.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.nama_peran}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={map.is_mandatory !== false}
                              onChange={(e) => handleMappingChange(index, 'is_mandatory', e.target.checked)}
                              size="small"
                              disabled={loading}
                            />
                          }
                          label="Wajib"
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {map.id_peran && (
                            <Chip 
                              label={getPeranName(map.id_peran)} 
                              size="small"
                              color={getPeranColor(map.id_peran)}
                              sx={{ maxWidth: '100px' }}
                            />
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMapping(index)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Tampilkan peringatan jika mapping tidak lengkap */}
                    {(!map.id_jabatan || !map.id_jenjang || !map.id_peran) && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        {!map.id_jabatan && 'Jabatan belum dipilih. '}
                        {!map.id_jenjang && 'Jenjang belum dipilih. '}
                        {!map.id_peran && 'Peran belum dipilih. '}
                      </Typography>
                    )}
                  </Paper>
                ))
              )}

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  * Satu kompetensi dapat dimapping ke beberapa kombinasi jabatan, jenjang & peran (reuse kompetensi)
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  * Warna border kiri menunjukkan peran yang dipilih untuk mapping
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  * Peran default kompetensi akan otomatis terisi pada mapping baru
                </Typography>
              </Box>
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
            disabled={
              loading || 
              !formData.kode_kompetensi.trim() || 
              !formData.nama_kompetensi.trim() || 
              !formData.id_fungsi || 
              !formData.id_peran ||
              mapping.some(m => !m.id_jabatan || !m.id_jenjang || !m.id_peran)
            }
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

export default KompetensiModal;