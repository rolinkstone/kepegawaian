// frontend/src/components/kepegawaian/modals/MappingModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Paper,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import { masterService } from '../services/masterService';

const MappingModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  mode, 
  data, 
  kompetensiId,
  jabatanList,
  jenjangList 
}) => {
  const [kompetensi, setKompetensi] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [newMapping, setNewMapping] = useState({
    id_jabatan: '',
    id_jenjang: '',
    is_mandatory: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && kompetensiId) {
      fetchKompetensiDetail();
    }
  }, [open, kompetensiId]);

  const fetchKompetensiDetail = async () => {
    setLoading(true);
    try {
      const response = await masterService.getKompetensiById(kompetensiId);
      setKompetensi(response.data);
      setMapping(response.data.mapping || []);
    } catch (error) {
      console.error('Error fetching kompetensi detail:', error);
      setError('Gagal mengambil data kompetensi');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMappingChange = (field, value) => {
    setNewMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMapping = async () => {
    if (!newMapping.id_jabatan || !newMapping.id_jenjang) {
      setError('Jabatan dan Jenjang harus dipilih');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ambil mapping yang sudah ada
      const currentMapping = mapping.map(m => ({
        id_jabatan: m.id_jabatan,
        id_jenjang: m.id_jenjang,
        is_mandatory: m.is_mandatory
      }));

      // Tambah mapping baru
      currentMapping.push({
        id_jabatan: parseInt(newMapping.id_jabatan),
        id_jenjang: parseInt(newMapping.id_jenjang),
        is_mandatory: newMapping.is_mandatory
      });

      // Update kompetensi dengan mapping baru
      await masterService.updateKompetensi(kompetensiId, {
        ...kompetensi,
        mapping: currentMapping
      });

      // Reset form dan refresh data
      setNewMapping({
        id_jabatan: '',
        id_jenjang: '',
        is_mandatory: true
      });
      
      await fetchKompetensiDetail();
      showSuccess('Mapping berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding mapping:', error);
      setError('Gagal menambahkan mapping');
      showError('Gagal menambahkan mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (index) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus mapping ini?')) return;

    setLoading(true);
    try {
      const updatedMapping = mapping.filter((_, i) => i !== index);
      
      await masterService.updateKompetensi(kompetensiId, {
        ...kompetensi,
        mapping: updatedMapping.map(m => ({
          id_jabatan: m.id_jabatan,
          id_jenjang: m.id_jenjang,
          is_mandatory: m.is_mandatory
        }))
      });

      await fetchKompetensiDetail();
      showSuccess('Mapping berhasil dihapus');
    } catch (error) {
      console.error('Error deleting mapping:', error);
      setError('Gagal menghapus mapping');
      showError('Gagal menghapus mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMandatory = async (index) => {
    setLoading(true);
    try {
      const updatedMapping = [...mapping];
      updatedMapping[index].is_mandatory = !updatedMapping[index].is_mandatory;
      
      await masterService.updateKompetensi(kompetensiId, {
        ...kompetensi,
        mapping: updatedMapping.map(m => ({
          id_jabatan: m.id_jabatan,
          id_jenjang: m.id_jenjang,
          is_mandatory: m.is_mandatory
        }))
      });

      await fetchKompetensiDetail();
      showSuccess('Status mandatory berhasil diupdate');
    } catch (error) {
      console.error('Error updating mapping:', error);
      setError('Gagal mengupdate mapping');
      showError('Gagal mengupdate mapping');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'view' ? 'Lihat Mapping Kompetensi' : 'Atur Mapping Kompetensi'}
      </DialogTitle>
      <DialogContent dividers>
        {loading && !kompetensi ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Info Kompetensi */}
            {kompetensi && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Kode Kompetensi
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {kompetensi.kode_kompetensi}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">
                      Nama Kompetensi
                    </Typography>
                    <Typography variant="body2">
                      {kompetensi.nama_kompetensi}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Fungsi / Peran
                    </Typography>
                    <Typography variant="body2">
                      <Chip 
                        label={kompetensi.nama_fungsi} 
                        size="small" 
                        color="info" 
                        sx={{ mr: 0.5 }} 
                      />
                      <Chip 
                        label={kompetensi.nama_peran} 
                        size="small" 
                        color="success" 
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Form Tambah Mapping (Hanya untuk mode edit/add) */}
            {mode !== 'view' && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Tambah Mapping Baru
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Jabatan</InputLabel>
                      <Select
                        value={newMapping.id_jabatan}
                        onChange={(e) => handleNewMappingChange('id_jabatan', e.target.value)}
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
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Jenjang</InputLabel>
                      <Select
                        value={newMapping.id_jenjang}
                        onChange={(e) => handleNewMappingChange('id_jenjang', e.target.value)}
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
                  <Grid item xs={12} md={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newMapping.is_mandatory}
                          onChange={(e) => handleNewMappingChange('is_mandatory', e.target.checked)}
                          size="small"
                        />
                      }
                      label="Wajib"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMapping}
                      disabled={loading || !newMapping.id_jabatan || !newMapping.id_jenjang}
                      size="small"
                    >
                      Tambah
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Daftar Mapping */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Daftar Mapping ({mapping.length})
            </Typography>

            {mapping.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  Belum ada mapping untuk kompetensi ini.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Jabatan</TableCell>
                      <TableCell>Jenjang</TableCell>
                      <TableCell>Tingkat</TableCell>
                      <TableCell>Status</TableCell>
                      {mode !== 'view' && <TableCell align="center">Aksi</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mapping.map((map, index) => {
                      const jabatan = jabatanList.find(j => j.id === map.id_jabatan);
                      const jenjang = jenjangList.find(j => j.id === map.id_jenjang);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{jabatan?.nama_jabatan || '-'}</TableCell>
                          <TableCell>{jenjang?.nama_jenjang || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`Tingkat ${jenjang?.tingkat || 0}`} 
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {mode === 'view' ? (
                              <Chip 
                                label={map.is_mandatory ? 'Wajib' : 'Opsional'}
                                color={map.is_mandatory ? 'primary' : 'default'}
                                size="small"
                              />
                            ) : (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={map.is_mandatory}
                                    onChange={() => handleToggleMandatory(index)}
                                    size="small"
                                  />
                                }
                                label={map.is_mandatory ? 'Wajib' : 'Opsional'}
                              />
                            )}
                          </TableCell>
                          {mode !== 'view' && (
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteMapping(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
              * Satu kompetensi dapat digunakan di beberapa jenjang (reuse kompetensi)
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Tutup
        </Button>
        {mode !== 'view' && (
          <Button onClick={onSuccess} variant="contained">
            Selesai
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MappingModal;