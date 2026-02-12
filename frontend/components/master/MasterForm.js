// frontend/components/master/MasterForm.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  Tab,
  Tabs,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Bookmark as BookmarkIcon,
  Category as CategoryIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// ========== IMPORT MODALS ==========
import FungsiModal from './modals/FungsiModal';
import PeranModal from './modals/PeranModal';
import JenjangModal from './modals/JenjangModal';
import JabatanModal from './modals/JabatanModal';
import KompetensiModal from './modals/KompetensiModal';
import MappingModal from './modals/MappingModal';

// ========== IMPORT SERVICES - PERBAIKAN: Gunakan curly braces untuk named export ==========
import { masterService } from './services/masterService';

// ========== TAB PANEL ==========
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`master-tabpanel-${index}`}
      aria-labelledby={`master-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `master-tab-${index}`,
    'aria-controls': `master-tabpanel-${index}`,
  };
}

// ========== MAIN COMPONENT ==========
const MasterForm = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });

  // ========== STATE UNTUK DATA ==========
  const [jabatan, setJabatan] = useState([]);
  const [jenjang, setJenjang] = useState([]);
  const [fungsi, setFungsi] = useState([]);
  const [peran, setPeran] = useState([]);
  const [kompetensi, setKompetensi] = useState([]);

  // ========== STATE UNTUK FILTER ==========
  const [filterFungsi, setFilterFungsi] = useState('');
  const [filterPeran, setFilterPeran] = useState('');
  const [searchKompetensi, setSearchKompetensi] = useState('');

  // ========== STATE UNTUK MODALS ==========
  const [modalJabatan, setModalJabatan] = useState({ open: false, mode: 'add', data: null });
  const [modalJenjang, setModalJenjang] = useState({ open: false, mode: 'add', data: null });
  const [modalFungsi, setModalFungsi] = useState({ open: false, mode: 'add', data: null });
  const [modalPeran, setModalPeran] = useState({ open: false, mode: 'add', data: null });
  const [modalKompetensi, setModalKompetensi] = useState({ open: false, mode: 'add', data: null });
  const [modalMapping, setModalMapping] = useState({ open: false, mode: 'add', data: null, kompetensiId: null });

  // ========== SHOW MESSAGE ==========
  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, text, severity });
  };

  const handleCloseMessage = () => {
    setMessage({ open: false, text: '', severity: 'success' });
  };

  // ========== GET TOKEN DARI SESSION ==========
  const getToken = useCallback(() => {
    if (session?.accessToken) {
      return session.accessToken;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, [session]);

  // ========== FETCH ALL DATA ==========
  const fetchAllData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.error('❌ No token found');
      showMessage('Silakan login terlebih dahulu', 'error');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }

    setLoading(true);
    try {
      console.log('🔑 Fetching with token:', token.substring(0, 20) + '...');
      
      // Fetch semua data menggunakan masterService
      const [
        jabatanRes,
        jenjangRes,
        fungsiRes,
        peranRes,
        kompetensiRes
      ] = await Promise.all([
        masterService.getJabatan(),
        masterService.getJenjang(),
        masterService.getFungsi(),
        masterService.getPeran(),
        masterService.getKompetensi()
      ]);

      console.log('✅ API Responses:', {
        jabatan: jabatanRes,
        jenjang: jenjangRes,
        fungsi: fungsiRes,
        peran: peranRes,
        kompetensi: kompetensiRes
      });

      // Handle response - format { success: true, data: [...] }
      setJabatan(jabatanRes.success ? jabatanRes.data || [] : jabatanRes || []);
      setJenjang(jenjangRes.success ? jenjangRes.data || [] : jenjangRes || []);
      setFungsi(fungsiRes.success ? fungsiRes.data || [] : fungsiRes || []);
      setPeran(peranRes.success ? peranRes.data || [] : peranRes || []);
      setKompetensi(kompetensiRes.success ? kompetensiRes.data || [] : kompetensiRes || []);

      showMessage(`Data berhasil dimuat (${jabatanRes.data?.length || 0} jabatan, ${fungsiRes.data?.length || 0} fungsi)`);
      
    } catch (error) {
      console.error('❌ Error fetching master data:', error);
      
      if (error.response?.status === 401) {
        showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showMessage(`Gagal memuat data: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, router]);

  // ========== INITIAL FETCH ==========
  useEffect(() => {
    if (status !== 'loading') {
      fetchAllData();
    }
  }, [status, fetchAllData]);

  // ========== HANDLE REFRESH ==========
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    showMessage('Data berhasil diperbarui');
  };

  // ========== HANDLE TAB CHANGE ==========
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ========== HANDLE MODAL JABATAN ==========
  const handleOpenJabatanModal = (mode, data = null) => {
    console.log('Opening Jabatan Modal:', mode, data);
    setModalJabatan({ open: true, mode, data });
  };

  const handleCloseJabatanModal = (refresh = false) => {
    setModalJabatan({ open: false, mode: 'add', data: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE MODAL JENJANG ==========
  const handleOpenJenjangModal = (mode, data = null) => {
    console.log('Opening Jenjang Modal:', mode, data);
    setModalJenjang({ open: true, mode, data });
  };

  const handleCloseJenjangModal = (refresh = false) => {
    setModalJenjang({ open: false, mode: 'add', data: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE MODAL FUNGSI ==========
  const handleOpenFungsiModal = (mode, data = null) => {
    console.log('Opening Fungsi Modal:', mode, data);
    setModalFungsi({ open: true, mode, data });
  };

  const handleCloseFungsiModal = (refresh = false) => {
    setModalFungsi({ open: false, mode: 'add', data: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE MODAL PERAN ==========
  const handleOpenPeranModal = (mode, data = null) => {
    console.log('Opening Peran Modal:', mode, data);
    setModalPeran({ open: true, mode, data });
  };

  const handleClosePeranModal = (refresh = false) => {
    setModalPeran({ open: false, mode: 'add', data: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE MODAL KOMPETENSI ==========
  const handleOpenKompetensiModal = (mode, data = null) => {
    console.log('Opening Kompetensi Modal:', mode, data);
    setModalKompetensi({ open: true, mode, data });
  };

  const handleCloseKompetensiModal = (refresh = false) => {
    setModalKompetensi({ open: false, mode: 'add', data: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE MODAL MAPPING ==========
  const handleOpenMappingModal = (mode, kompetensiId = null, data = null) => {
    console.log('Opening Mapping Modal:', mode, kompetensiId, data);
    setModalMapping({ 
      open: true, 
      mode, 
      data,
      kompetensiId 
    });
  };

  const handleCloseMappingModal = (refresh = false) => {
    setModalMapping({ 
      open: false, 
      mode: 'add', 
      data: null,
      kompetensiId: null 
    });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE DELETE JABATAN ==========
  const handleDeleteJabatan = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data jabatan ini?')) {
      try {
        const response = await masterService.deleteJabatan(id);
        if (response.success) {
          showMessage('Jabatan berhasil dihapus');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Error deleting jabatan:', error);
        showMessage('Gagal menghapus jabatan', 'error');
      }
    }
  };

  // ========== HANDLE DELETE JENJANG ==========
  const handleDeleteJenjang = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data jenjang ini?')) {
      try {
        const response = await masterService.deleteJenjang(id);
        if (response.success) {
          showMessage('Jenjang berhasil dihapus');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Error deleting jenjang:', error);
        showMessage('Gagal menghapus jenjang', 'error');
      }
    }
  };

  // ========== HANDLE DELETE FUNGSI ==========
  const handleDeleteFungsi = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data fungsi ini?')) {
      try {
        const response = await masterService.deleteFungsi(id);
        if (response.success) {
          showMessage('Fungsi berhasil dihapus');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Error deleting fungsi:', error);
        showMessage('Gagal menghapus fungsi', 'error');
      }
    }
  };

  // ========== HANDLE DELETE PERAN ==========
  const handleDeletePeran = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data peran ini?')) {
      try {
        const response = await masterService.deletePeran(id);
        if (response.success) {
          showMessage('Peran berhasil dihapus');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Error deleting peran:', error);
        showMessage('Gagal menghapus peran', 'error');
      }
    }
  };

  // ========== HANDLE DELETE KOMPETENSI ==========
  const handleDeleteKompetensi = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data kompetensi ini?\nSemua mapping kompetensi juga akan ikut terhapus.')) {
      try {
        const response = await masterService.deleteKompetensi(id);
        if (response.success) {
          showMessage('Kompetensi berhasil dihapus');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Error deleting kompetensi:', error);
        showMessage('Gagal menghapus kompetensi', 'error');
      }
    }
  };

  // ========== FILTERED KOMPETENSI ==========
  const getFilteredKompetensi = () => {
    return kompetensi.filter(item => {
      let match = true;
      if (filterFungsi) match = match && item.id_fungsi === parseInt(filterFungsi);
      if (filterPeran) match = match && item.id_peran === parseInt(filterPeran);
      if (searchKompetensi) {
        match = match && (
          item.kode_kompetensi?.toLowerCase().includes(searchKompetensi.toLowerCase()) ||
          item.nama_kompetensi?.toLowerCase().includes(searchKompetensi.toLowerCase())
        );
      }
      return match;
    });
  };

  // ========== RENDER JABATAN TAB ==========
  const renderJabatanTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon color="primary" />
          Daftar Jabatan
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenJabatanModal('add')}
          disabled={loading}
          sx={{ 
            '&:hover': { 
              backgroundColor: 'primary.dark' 
            } 
          }}
        >
          Tambah Jabatan
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama Jabatan</TableCell>
              <TableCell>Tanggal Dibuat</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : jabatan.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="textSecondary">Belum ada data jabatan</Typography>
                </TableCell>
              </TableRow>
            ) : (
              jabatan.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight="500">{item.nama_jabatan}</Typography>
                  </TableCell>
                  <TableCell>{item.created_at || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenJabatanModal('edit', item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteJabatan(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ========== RENDER JENJANG TAB ==========
  const renderJenjangTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Daftar Jenjang
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenJenjangModal('add')}
          disabled={loading}
        >
          Tambah Jenjang
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama Jenjang</TableCell>
              <TableCell>Tingkat</TableCell>
              <TableCell>Tanggal Dibuat</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : jenjang.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">Belum ada data jenjang</Typography>
                </TableCell>
              </TableRow>
            ) : (
              jenjang.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight="500">{item.nama_jenjang}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Tingkat ${item.tingkat || 0}`} 
                      size="small"
                      color={item.tingkat === 1 ? 'success' : item.tingkat === 2 ? 'primary' : item.tingkat === 3 ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{item.created_at || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenJenjangModal('edit', item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteJenjang(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ========== RENDER FUNGSI TAB ==========
  const renderFungsiTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          Daftar Fungsi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenFungsiModal('add')}
          disabled={loading}
        >
          Tambah Fungsi
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama Fungsi</TableCell>
              <TableCell>Tanggal Dibuat</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : fungsi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="textSecondary">Belum ada data fungsi</Typography>
                </TableCell>
              </TableRow>
            ) : (
              fungsi.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight="500">{item.nama_fungsi}</Typography>
                  </TableCell>
                  <TableCell>{item.created_at || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenFungsiModal('edit', item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteFungsi(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ========== RENDER PERAN TAB ==========
  const renderPeranTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          Daftar Peran
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenPeranModal('add')}
          disabled={loading}
        >
          Tambah Peran
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter Fungsi</InputLabel>
            <Select
              value={filterFungsi}
              label="Filter Fungsi"
              onChange={(e) => setFilterFungsi(e.target.value)}
            >
              <MenuItem value="">Semua Fungsi</MenuItem>
              {fungsi.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.nama_fungsi}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama Peran</TableCell>
              <TableCell>Fungsi</TableCell>
              <TableCell>Tanggal Dibuat</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : peran.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">Belum ada data peran</Typography>
                </TableCell>
              </TableRow>
            ) : (
              peran
                .filter(p => !filterFungsi || p.id_fungsi === parseInt(filterFungsi))
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight="500">{item.nama_peran}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.nama_fungsi} 
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>{item.created_at || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenPeranModal('edit', item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePeran(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ========== RENDER KOMPETENSI TAB ==========
  const renderKompetensiTab = () => {
    const filteredKompetensi = getFilteredKompetensi();

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkIcon color="primary" />
            Daftar Kompetensi
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenKompetensiModal('add')}
              disabled={loading}
            >
              Tambah Kompetensi
            </Button>
          </Box>
        </Box>

        {/* FILTERS */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Fungsi</InputLabel>
                <Select
                  value={filterFungsi}
                  label="Filter Fungsi"
                  onChange={(e) => setFilterFungsi(e.target.value)}
                >
                  <MenuItem value="">Semua Fungsi</MenuItem>
                  {fungsi.map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.nama_fungsi}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Peran</InputLabel>
                <Select
                  value={filterPeran}
                  label="Filter Peran"
                  onChange={(e) => setFilterPeran(e.target.value)}
                  disabled={!filterFungsi}
                >
                  <MenuItem value="">Semua Peran</MenuItem>
                  {peran
                    .filter(p => !filterFungsi || p.id_fungsi === parseInt(filterFungsi))
                    .map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.nama_peran}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Cari Kompetensi"
                value={searchKompetensi}
                onChange={(e) => setSearchKompetensi(e.target.value)}
                placeholder="Cari berdasarkan kode atau nama kompetensi"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* KOMPETENSI TABLE */}
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Kode</TableCell>
                <TableCell>Nama Kompetensi</TableCell>
                <TableCell>Fungsi</TableCell>
                <TableCell>Peran</TableCell>
                <TableCell>Mapping Jabatan/Jenjang</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      Memuat data kompetensi...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredKompetensi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="textSecondary">
                      Belum ada data kompetensi
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenKompetensiModal('add')}
                      sx={{ mt: 2 }}
                    >
                      Tambah Kompetensi Pertama
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredKompetensi.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Chip 
                        label={item.kode_kompetensi} 
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {item.nama_kompetensi}
                      </Typography>
                      {item.deskripsi && (
                        <Typography variant="caption" color="textSecondary">
                          {item.deskripsi}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.nama_fungsi} 
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.nama_peran} 
                        size="small"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      {item.mapping && item.mapping.length > 0 ? (
                        <Box>
                          {item.mapping.map((map, idx) => (
                            <Chip
                              key={idx}
                              label={`${map.nama_jabatan} - ${map.nama_jenjang}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="warning.main">
                          Belum ada mapping
                        </Typography>
                      )}
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleOpenMappingModal('add', item.id, item)}
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        Atur Mapping
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Lihat Mapping">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenMappingModal('view', item.id, item)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Kompetensi">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenKompetensiModal('edit', item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus Kompetensi">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteKompetensi(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FOOTER INFO */}
        {filteredKompetensi.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Total: {filteredKompetensi.length} kompetensi
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // ========== MAIN RENDER ==========
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Memeriksa autentikasi...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="600">
          Master Data Kepegawaian
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* STATS CARD */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="body2" color="textSecondary">Total Jabatan</Typography>
            <Typography variant="h4">{jabatan.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
            <Typography variant="body2" color="textSecondary">Total Jenjang</Typography>
            <Typography variant="h4">{jenjang.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
            <Typography variant="body2" color="textSecondary">Total Fungsi</Typography>
            <Typography variant="h4">{fungsi.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
            <Typography variant="body2" color="textSecondary">Total Peran</Typography>
            <Typography variant="h4">{peran.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
            <Typography variant="body2" color="textSecondary">Total Kompetensi</Typography>
            <Typography variant="h4">{kompetensi.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* TABS */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="master data tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Jabatan" icon={<WorkIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Jenjang" icon={<SchoolIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Fungsi" icon={<CategoryIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="Peran" icon={<AssignmentIcon />} iconPosition="start" {...a11yProps(3)} />
          <Tab label="Kompetensi" icon={<BookmarkIcon />} iconPosition="start" {...a11yProps(4)} />
        </Tabs>

        {/* TAB PANELS */}
        <TabPanel value={tabValue} index={0}>
          {renderJabatanTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderJenjangTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {renderFungsiTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {renderPeranTab()}
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          {renderKompetensiTab()}
        </TabPanel>
      </Paper>

      {/* ========== MODALS ========== */}
      <JabatanModal
        open={modalJabatan.open}
        onClose={() => handleCloseJabatanModal(false)}
        onSuccess={() => handleCloseJabatanModal(true)}
        mode={modalJabatan.mode}
        data={modalJabatan.data}
      />

      <JenjangModal
        open={modalJenjang.open}
        onClose={() => handleCloseJenjangModal(false)}
        onSuccess={() => handleCloseJenjangModal(true)}
        mode={modalJenjang.mode}
        data={modalJenjang.data}
      />

      <FungsiModal
        open={modalFungsi.open}
        onClose={() => handleCloseFungsiModal(false)}
        onSuccess={() => handleCloseFungsiModal(true)}
        mode={modalFungsi.mode}
        data={modalFungsi.data}
      />

      <PeranModal
        open={modalPeran.open}
        onClose={() => handleClosePeranModal(false)}
        onSuccess={() => handleClosePeranModal(true)}
        mode={modalPeran.mode}
        data={modalPeran.data}
        fungsiList={fungsi}
      />

      <KompetensiModal
        open={modalKompetensi.open}
        onClose={() => handleCloseKompetensiModal(false)}
        onSuccess={() => handleCloseKompetensiModal(true)}
        mode={modalKompetensi.mode}
        data={modalKompetensi.data}
        fungsiList={fungsi}
        peranList={peran}
        jabatanList={jabatan}
        jenjangList={jenjang}
      />

      <MappingModal
        open={modalMapping.open}
        onClose={() => handleCloseMappingModal(false)}
        onSuccess={() => handleCloseMappingModal(true)}
        mode={modalMapping.mode}
        data={modalMapping.data}
        kompetensiId={modalMapping.kompetensiId}
        jabatanList={jabatan}
        jenjangList={jenjang}
      />

      {/* SNACKBAR UNTUK NOTIFICATION */}
      <Snackbar
        open={message.open}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseMessage} severity={message.severity} sx={{ width: '100%' }}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MasterForm;