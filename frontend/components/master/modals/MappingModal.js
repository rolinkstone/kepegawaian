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
  FormControlLabel,
  Snackbar,
  DialogContentText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

import { masterService } from '../services/masterService';

const MappingModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  mode, 
  data, 
  kompetensiKode,
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
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmMapAll, setConfirmMapAll] = useState(false);
  const [mapAllPreview, setMapAllPreview] = useState({ total: 0, baru: 0 });

  useEffect(() => {
    if (open && (kompetensiKode || data?.kode_kompetensi)) {
      fetchKompetensiDetail();
    }
  }, [open, kompetensiKode, data]);

  const fetchKompetensiDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const kode = kompetensiKode || data?.kode_kompetensi;
      
      // Gunakan endpoint mapping by kode yang tersedia di backend
      const response = await masterService.getMappingByKodeKompetensi(kode);
      
      if (response.success) {
        setKompetensi(response.data);
        
        // Transform mapping data sesuai format yang digunakan di modal
        const mappingData = response.data.jabatan_dan_jenjang ? 
          response.data.jabatan_dan_jenjang.split(', ').map((item, index) => {
            // Parse format "Jabatan (Jenjang)"
            const match = item.match(/(.+) \((.+)\)/);
            if (match) {
              const jabatanNama = match[1];
              const jenjangNama = match[2];
              
              // Cari id berdasarkan nama
              const jabatan = jabatanList.find(j => j.nama_jabatan === jabatanNama);
              const jenjang = jenjangList.find(j => j.nama_jenjang === jenjangNama);
              
              return {
                id_jabatan: jabatan?.id || null,
                id_jenjang: jenjang?.id || null,
                nama_jabatan: jabatanNama,
                nama_jenjang: jenjangNama,
                is_mandatory: true, // Default, karena backend tidak mengirim status mandatory
                tingkat: jenjang?.tingkat || 0
              };
            }
            return null;
          }).filter(Boolean) : [];
        
        setMapping(mappingData);
      }
    } catch (error) {
      console.error('Error fetching kompetensi detail:', error);
      setError(error.response?.data?.message || 'Gagal mengambil data kompetensi');
    } finally {
      setLoading(false);
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
      // Karena tidak ada endpoint khusus untuk mapping, kita update kompetensi dengan mapping baru
      const currentMapping = mapping.map(m => ({
        id_jabatan: m.id_jabatan,
        id_jenjang: m.id_jenjang,
        is_mandatory: m.is_mandatory !== undefined ? m.is_mandatory : true
      }));

      // Tambah mapping baru
      currentMapping.push({
        id_jabatan: parseInt(newMapping.id_jabatan),
        id_jenjang: parseInt(newMapping.id_jenjang),
        is_mandatory: newMapping.is_mandatory
      });

      // Dapatkan detail kompetensi
      const kompetensiDetail = await masterService.getKompetensiByKode(kompetensiKode || data?.kode_kompetensi);
      
      if (kompetensiDetail.success) {
        // Update kompetensi dengan mapping baru
        await masterService.updateKompetensi(kompetensiDetail.data.id, {
          ...kompetensiDetail.data,
          mapping: currentMapping
        });
      }

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
      setError(error.response?.data?.message || 'Gagal menambahkan mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (index) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus mapping ini?')) return;

    setLoading(true);
    try {
      const updatedMapping = mapping.filter((_, i) => i !== index);
      
      // Dapatkan detail kompetensi
      const kompetensiDetail = await masterService.getKompetensiByKode(kompetensiKode || data?.kode_kompetensi);
      
      if (kompetensiDetail.success) {
        // Update kompetensi dengan mapping yang sudah dihapus
        await masterService.updateKompetensi(kompetensiDetail.data.id, {
          ...kompetensiDetail.data,
          mapping: updatedMapping.map(m => ({
            id_jabatan: m.id_jabatan,
            id_jenjang: m.id_jenjang,
            is_mandatory: m.is_mandatory !== undefined ? m.is_mandatory : true
          }))
        });
      }

      await fetchKompetensiDetail();
      showSuccess('Mapping berhasil dihapus');
    } catch (error) {
      console.error('Error deleting mapping:', error);
      setError(error.response?.data?.message || 'Gagal menghapus mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMandatory = async (index) => {
    setLoading(true);
    try {
      const updatedMapping = [...mapping];
      updatedMapping[index].is_mandatory = !updatedMapping[index].is_mandatory;
      
      // Dapatkan detail kompetensi
      const kompetensiDetail = await masterService.getKompetensiByKode(kompetensiKode || data?.kode_kompetensi);
      
      if (kompetensiDetail.success) {
        // Update kompetensi dengan status mandatory baru
        await masterService.updateKompetensi(kompetensiDetail.data.id, {
          ...kompetensiDetail.data,
          mapping: updatedMapping.map(m => ({
            id_jabatan: m.id_jabatan,
            id_jenjang: m.id_jenjang,
            is_mandatory: m.is_mandatory
          }))
        });
      }

      await fetchKompetensiDetail();
      showSuccess('Status mandatory berhasil diupdate');
    } catch (error) {
      console.error('Error updating mapping:', error);
      setError(error.response?.data?.message || 'Gagal mengupdate mapping');
    } finally {
      setLoading(false);
    }
  };

  // ========== MAPPING KE SEMUA JABATAN & JENJANG ==========
  const handlePreviewMapAll = () => {
    // Hitung total kombinasi jabatan x jenjang
    const totalKombinasi = jabatanList.length * jenjangList.length;
    
    // Hitung yang sudah ada (cek duplikat id_jabatan + id_jenjang)
    const existingKeys = new Set(mapping.map(m => `${m.id_jabatan}-${m.id_jenjang}`));
    const baru = totalKombinasi - existingKeys.size;
    
    setMapAllPreview({ total: totalKombinasi, baru });
    setConfirmMapAll(true);
  };

  const handleConfirmMapAll = async () => {
    setConfirmMapAll(false);
    setLoading(true);
    setError('');

    try {
      // Ambil id_peran dari kompetensi (default peran master)
      const idPeran = kompetensi?.id_peran;
      if (!idPeran) {
        throw new Error('Peran default kompetensi tidak ditemukan');
      }

      // Set yang sudah ada
      const existingKeys = new Set(mapping.map(m => `${m.id_jabatan}-${m.id_jenjang}`));
      
      // Generate semua kombinasi jabatan x jenjang
      const allMapping = [];
      
      // Pertahankan mapping yang sudah ada
      for (const m of mapping) {
        allMapping.push({
          id_jabatan: parseInt(m.id_jabatan),
          id_jenjang: parseInt(m.id_jenjang),
          id_peran: parseInt(idPeran),
          is_mandatory: m.is_mandatory !== false
        });
      }
      
      // Tambahkan mapping baru yang belum ada
      for (const jabatan of jabatanList) {
        for (const jenjang of jenjangList) {
          const key = `${jabatan.id}-${jenjang.id}`;
          if (!existingKeys.has(key)) {
            allMapping.push({
              id_jabatan: parseInt(jabatan.id),
              id_jenjang: parseInt(jenjang.id),
              id_peran: parseInt(idPeran),
              is_mandatory: true
            });
          }
        }
      }

      // Update kompetensi dengan semua mapping (gunakan data dari state)
      if (!kompetensi?.id) {
        throw new Error('Data kompetensi tidak ditemukan');
      }
      
      await masterService.updateKompetensi(kompetensi.id, {
        kode_kompetensi: kompetensi.kode_kompetensi,
        nama_kompetensi: kompetensi.nama_kompetensi,
        deskripsi: kompetensi.deskripsi || '',
        id_fungsi: kompetensi.id_fungsi,
        id_peran: parseInt(idPeran),
        mapping: allMapping
      });

      await fetchKompetensiDetail();
      showSuccess(`Mapping otomatis berhasil! ${allMapping.length} mapping tersimpan.`);
    } catch (error) {
      console.error('Error mapping all:', error);
      setError(error.response?.data?.message || 'Gagal mapping otomatis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={() => setError('')}
                >
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
                          label={kompetensi.fungsi || kompetensi.nama_fungsi} 
                          size="small" 
                          color="info" 
                          sx={{ mr: 0.5 }} 
                        />
                        <Chip 
                          label={kompetensi.peran || kompetensi.nama_peran} 
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
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jenjang</InputLabel>
                        <Select
                          value={newMapping.id_jenjang}
                          onChange={(e) => handleNewMappingChange('id_jenjang', e.target.value)}
                          label="Jenjang"
                          size="small"
                          disabled={loading}
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
                            disabled={loading}
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
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Atau mapping otomatis ke semua jabatan & jenjang:
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Peran akan mengikuti peran default kompetensi ({kompetensi?.peran || kompetensi?.nama_peran || '-'})
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={handlePreviewMapAll}
                      disabled={loading || !kompetensi?.id_peran}
                      size="small"
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Mapping ke Semua
                    </Button>
                  </Box>
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
                        const jabatan = map.nama_jabatan || jabatanList.find(j => j.id === map.id_jabatan)?.nama_jabatan || '-';
                        const jenjang = map.nama_jenjang || jenjangList.find(j => j.id === map.id_jenjang)?.nama_jenjang || '-';
                        const tingkat = map.tingkat || jenjangList.find(j => j.id === map.id_jenjang)?.tingkat || 0;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{jabatan}</TableCell>
                            <TableCell>{jenjang}</TableCell>
                            <TableCell>
                              <Chip 
                                label={`Tingkat ${tingkat}`} 
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
                                      checked={map.is_mandatory !== false}
                                      onChange={() => handleToggleMandatory(index)}
                                      size="small"
                                      disabled={loading}
                                    />
                                  }
                                  label={map.is_mandatory !== false ? 'Wajib' : 'Opsional'}
                                />
                              )}
                            </TableCell>
                            {mode !== 'view' && (
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteMapping(index)}
                                  disabled={loading}
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
          <Button onClick={onClose} disabled={loading}>
            Tutup
          </Button>
          {mode !== 'view' && (
            <Button 
              onClick={() => {
                onSuccess();
                onClose();
              }} 
              variant="contained"
              disabled={loading}
            >
              Selesai
            </Button>
          )}
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

      {/* Dialog Konfirmasi Mapping ke Semua */}
      <Dialog open={confirmMapAll} onClose={() => setConfirmMapAll(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="secondary" />
            <span>Mapping Otomatis</span>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Akan membuat mapping untuk <strong>semua kombinasi jabatan & jenjang</strong> 
            dengan peran default <strong>{kompetensi?.peran || kompetensi?.nama_peran || '-'}</strong>.
          </DialogContentText>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Total Jabatan</Typography>
                <Typography variant="body1" fontWeight="bold">{jabatanList.length}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Total Jenjang</Typography>
                <Typography variant="body1" fontWeight="bold">{jenjangList.length}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Total Kombinasi</Typography>
                <Typography variant="body1" fontWeight="bold">{mapAllPreview.total}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Alert severity={mapAllPreview.baru > 0 ? "info" : "success"} icon={false}>
              <Typography variant="body2">
                <strong>{mapAllPreview.baru}</strong> mapping baru akan ditambahkan
                {mapAllPreview.baru < mapAllPreview.total && (
                  <> • <strong>{mapAllPreview.total - mapAllPreview.baru}</strong> sudah ada</>
                )}
              </Typography>
            </Alert>
          </Box>
          
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            * Peran default kompetensi akan digunakan untuk semua mapping baru.
            Mapping yang sudah ada tidak akan diubah.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmMapAll(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleConfirmMapAll}
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
            disabled={loading || mapAllPreview.baru === 0}
          >
            {mapAllPreview.baru === 0 ? 'Semua Sudah Ada' : `Mapping ${mapAllPreview.baru} Baru`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MappingModal;