// frontend/components/master/MasterForm.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Snackbar,
  Avatar,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  Grow,
  Slide,
  useTheme,
  alpha,
  TablePagination,
  Pagination,
  PaginationItem,
  Stack,
  TableFooter,
  useMediaQuery
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
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Layers as LayersIcon,
  MoreVert as MoreVertIcon,
  FileCopy as FileCopyIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Security as SecurityIcon
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

// ========== IMPORT SERVICES ==========
import { masterService } from './services/masterService';

// ========== CUSTOM PAGINATION COMPONENT ==========
const TablePaginationActions = ({ count, page, rowsPerPage, onPageChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ 
      flexShrink: 0, 
      ml: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
        size={isMobile ? 'small' : 'medium'}
        sx={{
          bgcolor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
        }}
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        size={isMobile ? 'small' : 'medium'}
        sx={{
          bgcolor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
        }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        size={isMobile ? 'small' : 'medium'}
        sx={{
          bgcolor: page >= Math.ceil(count / rowsPerPage) - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
        }}
      >
        <ChevronRightIcon />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
        size={isMobile ? 'small' : 'medium'}
        sx={{
          bgcolor: page >= Math.ceil(count / rowsPerPage) - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
        }}
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
};

// ========== CUSTOM COMPONENTS ==========
const StatCard = ({ title, value, icon: Icon, color, gradient, delay }) => {
  const theme = useTheme();
  
  return (
    <Grow in={true} timeout={500 + delay}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          background: gradient || `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(color, 0.2),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
            borderColor: alpha(color, 0.3)
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7), fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: color }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.15),
              color: color,
              width: 56,
              height: 56,
              borderRadius: 2
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Avatar>
        </Box>
      </Paper>
    </Grow>
  );
};

const FilterCard = ({ children, onClear }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.1),
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Filter & Pencarian
        </Typography>
        {onClear && (
          <Button
            size="small"
            onClick={onClear}
            sx={{ ml: 'auto', color: theme.palette.text.secondary }}
            startIcon={<ClearIcon />}
          >
            Reset
          </Button>
        )}
      </Box>
      {children}
    </Paper>
  );
};

const CustomTable = ({ children, title, actions, isAdmin }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.5),
        overflow: 'hidden'
      }}
    >
      {title && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.5),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: alpha(theme.palette.background.paper, 0.6)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {title}
            </Typography>
            {!isAdmin && (
              <Chip
                icon={<PersonIcon />}
                label="Mode Baca"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  fontWeight: 500
                }}
              />
            )}
          </Box>
          {actions}
        </Box>
      )}
      <TableContainer>
        {children}
      </TableContainer>
    </Paper>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, color = 'primary', tooltip, disabled = false }) => (
  <Tooltip title={disabled ? 'Hanya admin_tambun_raya yang dapat melakukan aksi ini' : (tooltip || label)} arrow>
    <span>
      <IconButton
        onClick={onClick}
        size="small"
        disabled={disabled}
        sx={{
          mr: 0.5,
          color: theme => disabled 
            ? alpha(theme.palette.action.disabled, 0.5)
            : theme.palette[color].main,
          '&:hover': {
            bgcolor: disabled 
              ? 'transparent'
              : theme => alpha(theme.palette[color].main, 0.1)
          },
          opacity: disabled ? 0.6 : 1
        }}
      >
        <Icon fontSize="small" />
      </IconButton>
    </span>
  </Tooltip>
);

// ========== TAB PANEL ==========
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <Fade in={value === index} timeout={300}>
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
    </Fade>
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
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // ========== HOOKS DI LEVEL ATAS ==========
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // ========== CEK ROLE ADMIN TAMBUN RAYA ==========
  const isAdminTambunRaya = useMemo(() => {
    if (!session?.user) {
      console.log('❌ Session tidak ada di MasterForm');
      return false;
    }

    console.log('🔐 Session di MasterForm:', JSON.stringify(session, null, 2));

    // ===== CEK DARI ACCESS TOKEN =====
    if (session?.accessToken) {
      try {
        // Decode token JWT
        const tokenParts = session.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔐 Token payload di MasterForm:', payload);
          
          // Cek realm_access (Keycloak)
          if (payload.realm_access?.roles) {
            const isAdmin = payload.realm_access.roles.includes('admin_tambun_raya');
            console.log('🔐 From realm_access di MasterForm:', isAdmin);
            if (isAdmin) return true;
          }
          
          // Cek resource_access (Keycloak)
          if (payload.resource_access) {
            for (const client in payload.resource_access) {
              if (payload.resource_access[client].roles?.includes('admin_tambun_raya')) {
                console.log('🔐 From resource_access di MasterForm:', true);
                return true;
              }
            }
          }
          
          // Cek di root roles
          if (payload.roles?.includes('admin_tambun_raya')) {
            console.log('🔐 From root roles di MasterForm:', true);
            return true;
          }
        }
      } catch (e) {
        console.error('Error decoding token di MasterForm:', e);
      }
    }

    // ===== CEK DARI SESSION.USER =====
    if (session.user) {
      const user = session.user;
      
      // Cek roles array
      if (user.roles && Array.isArray(user.roles)) {
        const isAdmin = user.roles.includes('admin_tambun_raya');
        console.log('🔐 From user.roles di MasterForm:', isAdmin);
        if (isAdmin) return true;
      }
      
      // Cek role tunggal
      if (user.role === 'admin_tambun_raya') {
        console.log('🔐 From user.role di MasterForm:', true);
        return true;
      }
      
      // Cek dari email/username
      if (user.email === 'admin_tambun_raya' || user.username === 'admin_tambun_raya') {
        console.log('🔐 From email/username di MasterForm:', true);
        return true;
      }
      
      // Cek dari custom field
      if (user.isAdminTambunRaya === true) {
        console.log('🔐 From custom field di MasterForm:', true);
        return true;
      }
    }

    // ===== CEK DARI USER ROLE STATE (DARI API) =====
    if (userRole === 'admin_tambun_raya') {
      console.log('🔐 From API userRole di MasterForm:', true);
      return true;
    }

    console.log('❌ Bukan admin_tambun_raya di MasterForm');
    return false;
  }, [session, userRole]);

  // ===== FUNGSI UNTUK CEK ROLE VIA API =====
  const checkUserRoleViaAPI = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setCheckingRole(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role || data.user?.role);
        console.log('📋 Role dari API di MasterForm:', data);
      }
    } catch (error) {
      console.error('Error checking role via API di MasterForm:', error);
    } finally {
      setCheckingRole(false);
    }
  }, [API_URL]);

  // ===== DEBUG SESSION =====
  useEffect(() => {
    console.log('📦 Session di MasterForm useEffect:', session);
    console.log('👤 User di MasterForm useEffect:', session?.user);
    console.log('🔑 AccessToken di MasterForm useEffect:', session?.accessToken ? 'Ada' : 'Tidak ada');
    
    if (session?.user) {
      checkUserRoleViaAPI();
    } else {
      setCheckingRole(false);
    }
  }, [session, checkUserRoleViaAPI]);

  // ========== STATE UNTUK DATA ==========
  const [jabatan, setJabatan] = useState([]);
  const [jenjang, setJenjang] = useState([]);
  const [fungsi, setFungsi] = useState([]);
  const [peran, setPeran] = useState([]);
  const [kompetensi, setKompetensi] = useState([]);

  // ========== STATE UNTUK FILTER KOMPETENSI ==========
  const [filterFungsi, setFilterFungsi] = useState('');
  const [filterPeran, setFilterPeran] = useState('');
  const [searchKompetensi, setSearchKompetensi] = useState('');

  // ========== STATE UNTUK PAGINATION KOMPETENSI ==========
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowsPerPageOptions] = useState([5, 10, 25, 50, 100]);

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
    // Cek dari session.accessToken
    if (session?.accessToken) {
      return session.accessToken;
    }
    
    // Cek dari session.user.accessToken
    if (session?.user?.accessToken) {
      return session.user.accessToken;
    }
    
    // Cek dari localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) return token;
      
      // Cek juga dari sessionStorage
      const sessionToken = sessionStorage.getItem('token');
      if (sessionToken) return sessionToken;
    }
    
    console.log('⚠️ Token tidak ditemukan di MasterForm');
    return null;
  }, [session]);

  // ========== FETCH ALL DATA ==========
  const fetchAllData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      showMessage('Silakan login terlebih dahulu', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    setLoading(true);
    try {
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

      setJabatan(jabatanRes.success ? jabatanRes.data || [] : jabatanRes || []);
      setJenjang(jenjangRes.success ? jenjangRes.data || [] : jenjangRes || []);
      setFungsi(fungsiRes.success ? fungsiRes.data || [] : fungsiRes || []);
      setPeran(peranRes.success ? peranRes.data || [] : peranRes || []);
      setKompetensi(kompetensiRes.success ? kompetensiRes.data || [] : kompetensiRes || []);

      showMessage('Data berhasil dimuat', 'success');
      
    } catch (error) {
      console.error('Error fetching master data:', error);
      
      if (error.response?.status === 401) {
        showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        localStorage.removeItem('token');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        showMessage(`Gagal memuat data: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    if (status !== 'loading' && !checkingRole) {
      fetchAllData();
    }
  }, [status, checkingRole, fetchAllData]);

  // ========== HANDLE REFRESH ==========
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  // ========== HANDLE TAB CHANGE ==========
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset pagination saat pindah tab
    setPage(0);
  };

  // ========== HANDLE PAGE CHANGE ==========
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Scroll ke atas table dengan smooth
    const tableContainer = document.querySelector('.kompetensi-table-container');
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ========== HANDLE MODAL ==========
  const handleOpenModal = (type, mode, data = null) => {
    // Cek apakah user adalah admin untuk operasi yang memerlukan hak akses
    if (mode !== 'view' && !isAdminTambunRaya) {
      showMessage('Anda tidak memiliki izin untuk melakukan operasi ini. Hanya admin_tambun_raya yang diizinkan.', 'error');
      return;
    }

    const modalState = {
      jabatan: setModalJabatan,
      jenjang: setModalJenjang,
      fungsi: setModalFungsi,
      peran: setModalPeran,
      kompetensi: setModalKompetensi,
      mapping: setModalMapping
    };

    if (type === 'mapping') {
      modalState[type]({ open: true, mode, data, kompetensiId: data?.id });
    } else {
      modalState[type]({ open: true, mode, data });
    }
  };

  const handleCloseModal = (type, refresh = false) => {
    const modalState = {
      jabatan: setModalJabatan,
      jenjang: setModalJenjang,
      fungsi: setModalFungsi,
      peran: setModalPeran,
      kompetensi: setModalKompetensi,
      mapping: setModalMapping
    };

    modalState[type]({ open: false, mode: 'add', data: null, kompetensiId: null });
    if (refresh) fetchAllData();
  };

  // ========== HANDLE DELETE ==========
  const handleDelete = async (type, id, message) => {
    // Cek apakah user adalah admin
    if (!isAdminTambunRaya) {
      showMessage('Anda tidak memiliki izin untuk menghapus data. Hanya admin_tambun_raya yang diizinkan.', 'error');
      return;
    }

    if (window.confirm(message)) {
      try {
        const serviceMethod = {
          jabatan: masterService.deleteJabatan,
          jenjang: masterService.deleteJenjang,
          fungsi: masterService.deleteFungsi,
          peran: masterService.deletePeran,
          kompetensi: masterService.deleteKompetensi
        }[type];

        const response = await serviceMethod(id);
        
        if (response.success) {
          showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} berhasil dihapus`, 'success');
          fetchAllData();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showMessage(`Gagal menghapus ${type}`, 'error');
      }
    }
  };

  // ========== FILTER FUNCTIONS ==========
  const getFilteredPeran = () => {
    return peran.filter(p => !filterFungsi || p.id_fungsi === parseInt(filterFungsi));
  };

  // ========== FILTERED KOMPETENSI DENGAN MEMO ==========
  const getFilteredKompetensi = useMemo(() => {
    return kompetensi.filter(item => {
      let match = true;
      if (filterFungsi) match = match && item.id_fungsi === parseInt(filterFungsi);
      if (filterPeran) match = match && item.id_peran === parseInt(filterPeran);
      if (searchKompetensi) {
        match = match && (
          item.kode_kompetensi?.toLowerCase().includes(searchKompetensi.toLowerCase()) ||
          item.nama_kompetensi?.toLowerCase().includes(searchKompetensi.toLowerCase()) ||
          item.deskripsi?.toLowerCase().includes(searchKompetensi.toLowerCase())
        );
      }
      return match;
    });
  }, [kompetensi, filterFungsi, filterPeran, searchKompetensi]);

  // ========== PAGINATED KOMPETENSI ==========
  const paginatedKompetensi = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return getFilteredKompetensi.slice(start, end);
  }, [getFilteredKompetensi, page, rowsPerPage]);

  // ========== RESET PAGE WHEN FILTERS CHANGE ==========
  useEffect(() => {
    setPage(0);
  }, [filterFungsi, filterPeran, searchKompetensi]);

  // ========== CLEAR FILTERS ==========
  const clearFilters = () => {
    setFilterFungsi('');
    setFilterPeran('');
    setSearchKompetensi('');
    setPage(0);
  };

  // ========== RENDER JABATAN TAB ==========
  const renderJabatanTab = () => (
    <CustomTable
      title="Daftar Jabatan"
      isAdmin={isAdminTambunRaya}
      actions={
        isAdminTambunRaya ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('jabatan', 'add')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Tambah Jabatan
          </Button>
        ) : (
          <Tooltip title="Hanya admin_tambun_raya yang dapat menambah data">
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  opacity: 0.6
                }}
              >
                Tambah Jabatan
              </Button>
            </span>
          </Tooltip>
        )
      }
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.primary.main, 0.2) }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.primary.main, 0.2) }}>
              Nama Jabatan
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.primary.main, 0.2) }}>
              Tanggal Dibuat
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.primary.main, 0.2) }}>
              Aksi
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Memuat data...
                </Typography>
              </TableCell>
            </TableRow>
          ) : jabatan.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      width: 60,
                      height: 60
                    }}
                  >
                    <WorkIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Belum ada data jabatan
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {isAdminTambunRaya 
                      ? 'Klik tombol "Tambah Jabatan" untuk menambahkan data pertama'
                      : 'Hubungi admin_tambun_raya untuk menambahkan data'}
                  </Typography>
                  {isAdminTambunRaya && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenModal('jabatan', 'add')}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Tambah Jabatan Pertama
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            jabatan.map((item) => (
              <TableRow 
                key={item.id}
                sx={{
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <WorkIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography fontWeight="500">{item.nama_jabatan}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{item.created_at || '-'}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ActionButton
                      icon={EditIcon}
                      label="Edit"
                      onClick={() => handleOpenModal('jabatan', 'edit', item)}
                      disabled={!isAdminTambunRaya}
                      tooltip="Edit Jabatan"
                    />
                    <ActionButton
                      icon={DeleteIcon}
                      label="Hapus"
                      color="error"
                      onClick={() => handleDelete('jabatan', item.id, 'Apakah Anda yakin ingin menghapus data jabatan ini?')}
                      disabled={!isAdminTambunRaya}
                      tooltip="Hapus Jabatan"
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CustomTable>
  );

  // ========== RENDER JENJANG TAB ==========
  const renderJenjangTab = () => (
    <CustomTable
      title="Daftar Jenjang"
      isAdmin={isAdminTambunRaya}
      actions={
        isAdminTambunRaya ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('jenjang', 'add')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Tambah Jenjang
          </Button>
        ) : (
          <Tooltip title="Hanya admin_tambun_raya yang dapat menambah data">
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  opacity: 0.6
                }}
              >
                Tambah Jenjang
              </Button>
            </span>
          </Tooltip>
        )
      }
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.success.main, 0.2) }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.success.main, 0.2) }}>
              Nama Jenjang
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.success.main, 0.2) }}>
              Tingkat
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.success.main, 0.2) }}>
              Tanggal Dibuat
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.success.main, 0.2) }}>
              Aksi
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Memuat data...
                </Typography>
              </TableCell>
            </TableRow>
          ) : jenjang.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      width: 60,
                      height: 60
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Belum ada data jenjang
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {isAdminTambunRaya 
                      ? 'Klik tombol "Tambah Jenjang" untuk menambahkan data pertama'
                      : 'Hubungi admin_tambun_raya untuk menambahkan data'}
                  </Typography>
                  {isAdminTambunRaya && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenModal('jenjang', 'add')}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Tambah Jenjang Pertama
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            jenjang.map((item) => {
              const colors = {
                1: 'success',
                2: 'primary',
                3: 'warning',
                4: 'error'
              };
              return (
                <TableRow 
                  key={item.id}
                  sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.02) },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                        <SchoolIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                      </Avatar>
                      <Typography fontWeight="500">{item.nama_jenjang}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Tingkat ${item.tingkat || 0}`} 
                      size="small"
                      color={colors[item.tingkat] || 'default'}
                      sx={{ fontWeight: 500, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell>{item.created_at || '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <ActionButton
                        icon={EditIcon}
                        label="Edit"
                        onClick={() => handleOpenModal('jenjang', 'edit', item)}
                        disabled={!isAdminTambunRaya}
                        tooltip="Edit Jenjang"
                      />
                      <ActionButton
                        icon={DeleteIcon}
                        label="Hapus"
                        color="error"
                        onClick={() => handleDelete('jenjang', item.id, 'Apakah Anda yakin ingin menghapus data jenjang ini?')}
                        disabled={!isAdminTambunRaya}
                        tooltip="Hapus Jenjang"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </CustomTable>
  );

  // ========== RENDER FUNGSI TAB ==========
  const renderFungsiTab = () => (
    <CustomTable
      title="Daftar Fungsi"
      isAdmin={isAdminTambunRaya}
      actions={
        isAdminTambunRaya ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('fungsi', 'add')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Tambah Fungsi
          </Button>
        ) : (
          <Tooltip title="Hanya admin_tambun_raya yang dapat menambah data">
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  opacity: 0.6
                }}
              >
                Tambah Fungsi
              </Button>
            </span>
          </Tooltip>
        )
      }
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.info.main, 0.2) }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.info.main, 0.2) }}>
              Nama Fungsi
            </TableCell>
            <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.info.main, 0.2) }}>
              Tanggal Dibuat
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.info.main, 0.2) }}>
              Aksi
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Memuat data...
                </Typography>
              </TableCell>
            </TableRow>
          ) : fungsi.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      width: 60,
                      height: 60
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Belum ada data fungsi
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {isAdminTambunRaya 
                      ? 'Klik tombol "Tambah Fungsi" untuk menambahkan data pertama'
                      : 'Hubungi admin_tambun_raya untuk menambahkan data'}
                  </Typography>
                  {isAdminTambunRaya && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenModal('fungsi', 'add')}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Tambah Fungsi Pertama
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            fungsi.map((item) => (
              <TableRow 
                key={item.id}
                sx={{
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.02) },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <CategoryIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                    </Avatar>
                    <Typography fontWeight="500">{item.nama_fungsi}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{item.created_at || '-'}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ActionButton
                      icon={EditIcon}
                      label="Edit"
                      onClick={() => handleOpenModal('fungsi', 'edit', item)}
                      disabled={!isAdminTambunRaya}
                      tooltip="Edit Fungsi"
                    />
                    <ActionButton
                      icon={DeleteIcon}
                      label="Hapus"
                      color="error"
                      onClick={() => handleDelete('fungsi', item.id, 'Apakah Anda yakin ingin menghapus data fungsi ini?')}
                      disabled={!isAdminTambunRaya}
                      tooltip="Hapus Fungsi"
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CustomTable>
  );

  // ========== RENDER PERAN TAB ==========
  const renderPeranTab = () => {
    const filteredPeran = getFilteredPeran();

    return (
      <Box>
        <FilterCard onClear={() => setFilterFungsi('')}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Fungsi</InputLabel>
                <Select
                  value={filterFungsi}
                  label="Filter Fungsi"
                  onChange={(e) => {
                    setFilterFungsi(e.target.value);
                    setFilterPeran('');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Semua Fungsi</MenuItem>
                  {fungsi.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                        {f.nama_fungsi}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {filterFungsi && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, display: 'flex', alignItems: 'center' }}>
                <FilterIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Filter aktif:
              </Typography>
              <Chip
                label={`Fungsi: ${fungsi.find(f => f.id === parseInt(filterFungsi))?.nama_fungsi}`}
                size="small"
                onDelete={() => setFilterFungsi('')}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          )}
        </FilterCard>

        <CustomTable
          title="Daftar Peran"
          isAdmin={isAdminTambunRaya}
          actions={
            isAdminTambunRaya ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenModal('peran', 'add')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                Tambah Peran
              </Button>
            ) : (
              <Tooltip title="Hanya admin_tambun_raya yang dapat menambah data">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      opacity: 0.6
                    }}
                  >
                    Tambah Peran
                  </Button>
                </span>
              </Tooltip>
            )
          }
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.secondary.main, 0.2) }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.secondary.main, 0.2) }}>
                  Nama Peran
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.secondary.main, 0.2) }}>
                  Fungsi
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.secondary.main, 0.2) }}>
                  Tanggal Dibuat
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '2px solid', borderBottomColor: alpha(theme.palette.secondary.main, 0.2) }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPeran.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          mx: 'auto',
                          mb: 2,
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                          width: 60,
                          height: 60
                        }}
                      >
                        <AssignmentIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        {filterFungsi ? 'Tidak ada peran untuk fungsi ini' : 'Belum ada data peran'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        {filterFungsi 
                          ? 'Pilih fungsi lain'
                          : isAdminTambunRaya 
                            ? 'Klik tombol "Tambah Peran" untuk menambahkan data pertama'
                            : 'Hubungi admin_tambun_raya untuk menambahkan data'}
                      </Typography>
                      {!filterFungsi && isAdminTambunRaya && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenModal('peran', 'add')}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Tambah Peran Pertama
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeran.map((item) => (
                  <TableRow 
                    key={item.id}
                    sx={{
                      '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.02) },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                          <AssignmentIcon sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
                        </Avatar>
                        <Typography fontWeight="500">{item.nama_peran}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.nama_fungsi} 
                        size="small"
                        color="info"
                        sx={{ fontWeight: 500, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>{item.created_at || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ActionButton
                          icon={EditIcon}
                          label="Edit"
                          onClick={() => handleOpenModal('peran', 'edit', item)}
                          disabled={!isAdminTambunRaya}
                          tooltip="Edit Peran"
                        />
                        <ActionButton
                          icon={DeleteIcon}
                          label="Hapus"
                          color="error"
                          onClick={() => handleDelete('peran', item.id, 'Apakah Anda yakin ingin menghapus data peran ini?')}
                          disabled={!isAdminTambunRaya}
                          tooltip="Hapus Peran"
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CustomTable>
      </Box>
    );
  };

  // ========== RENDER KOMPETENSI TAB DENGAN PAGINATION ==========
  const renderKompetensiTab = () => {
    // useMediaQuery sudah dipanggil di level atas, tidak perlu dipanggil lagi di sini
    const totalItems = getFilteredKompetensi.length;
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - totalItems) : 0;

    return (
      <Box>
        {/* HEADER */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                width: 40,
                height: 40,
                borderRadius: 2
              }}
            >
              <BookmarkIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Daftar Kompetensi
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total {totalItems} kompetensi • {Math.ceil(totalItems / rowsPerPage)} halaman
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                borderColor: alpha(theme.palette.warning.main, 0.3),
                '&:hover': { borderColor: theme.palette.warning.main }
              }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
            {isAdminTambunRaya ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenModal('kompetensi', 'add')}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  bgcolor: theme.palette.warning.main,
                  '&:hover': { bgcolor: theme.palette.warning.dark },
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`,
                  '&:hover': { boxShadow: `0 6px 16px ${alpha(theme.palette.warning.main, 0.3)}` }
                }}
              >
                {isMobile ? 'Tambah' : 'Tambah Kompetensi'}
              </Button>
            ) : (
              <Tooltip title="Hanya admin_tambun_raya yang dapat menambah data">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      opacity: 0.6
                    }}
                  >
                    {isMobile ? 'Tambah' : 'Tambah Kompetensi'}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* FILTER CARD */}
        <FilterCard onClear={clearFilters}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Fungsi</InputLabel>
                <Select
                  value={filterFungsi}
                  label="Filter Fungsi"
                  onChange={(e) => {
                    setFilterFungsi(e.target.value);
                    setFilterPeran('');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Semua Fungsi</em>
                  </MenuItem>
                  {fungsi.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                        {f.nama_fungsi}
                      </Box>
                    </MenuItem>
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
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Semua Peran</em>
                  </MenuItem>
                  {peran
                    .filter(p => !filterFungsi || p.id_fungsi === parseInt(filterFungsi))
                    .map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                          {p.nama_peran}
                        </Box>
                      </MenuItem>
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
                placeholder="Cari berdasarkan kode, nama, atau deskripsi"
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  ),
                  endAdornment: searchKompetensi && (
                    <IconButton size="small" onClick={() => setSearchKompetensi('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          </Grid>

          {/* ACTIVE FILTERS */}
          {(filterFungsi || filterPeran || searchKompetensi) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, display: 'flex', alignItems: 'center' }}>
                <FilterIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Filter aktif:
              </Typography>
              {filterFungsi && (
                <Chip
                  label={`Fungsi: ${fungsi.find(f => f.id === parseInt(filterFungsi))?.nama_fungsi}`}
                  size="small"
                  onDelete={() => setFilterFungsi('')}
                  sx={{ borderRadius: 1 }}
                />
              )}
              {filterPeran && (
                <Chip
                  label={`Peran: ${peran.find(p => p.id === parseInt(filterPeran))?.nama_peran}`}
                  size="small"
                  onDelete={() => setFilterPeran('')}
                  sx={{ borderRadius: 1 }}
                />
              )}
              {searchKompetensi && (
                <Chip
                  label={`Pencarian: "${searchKompetensi}"`}
                  size="small"
                  onDelete={() => setSearchKompetensi('')}
                  sx={{ borderRadius: 1 }}
                />
              )}
            </Box>
          )}
        </FilterCard>

        {/* KOMPETENSI TABLE DENGAN PAGINATION */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.5),
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {loading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 1,
                height: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: theme.palette.warning.main
                }
              }} 
            />
          )}
          
          <TableContainer 
            className="kompetensi-table-container"
            sx={{ 
              maxHeight: '70vh',
              '&::-webkit-scrollbar': {
                width: 8,
                height: 8
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: alpha(theme.palette.common.black, 0.05),
                borderRadius: 4
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(theme.palette.common.black, 0.2),
                borderRadius: 4,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.black, 0.3)
                }
              }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Kode
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Nama Kompetensi
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Fungsi
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Peran
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Mapping
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                      borderBottom: '2px solid',
                      borderBottomColor: alpha(theme.palette.warning.main, 0.2)
                    }}
                  >
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={48} thickness={4} sx={{ color: theme.palette.warning.main }} />
                        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
                          Memuat data kompetensi...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : paginatedKompetensi.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Fade in={true}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              mx: 'auto',
                              mb: 2,
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              width: 80,
                              height: 80,
                              borderRadius: 3
                            }}
                          >
                            <BookmarkIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                          <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                            {searchKompetensi || filterFungsi || filterPeran 
                              ? 'Tidak ada hasil yang ditemukan'
                              : 'Belum ada data kompetensi'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                            {searchKompetensi || filterFungsi || filterPeran
                              ? `Tidak ditemukan kompetensi dengan kriteria yang Anda masukkan.`
                              : isAdminTambunRaya 
                                ? 'Klik tombol "Tambah Kompetensi" untuk menambahkan data pertama.'
                                : 'Hubungi admin_tambun_raya untuk menambahkan data.'}
                          </Typography>
                          {(searchKompetensi || filterFungsi || filterPeran) && (
                            <Button
                              variant="contained"
                              onClick={clearFilters}
                              sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none',
                                px: 4,
                                bgcolor: theme.palette.warning.main,
                                '&:hover': { bgcolor: theme.palette.warning.dark }
                              }}
                            >
                              Reset Filter
                            </Button>
                          )}
                        </Box>
                      </Fade>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {paginatedKompetensi.map((item, index) => (
                      <TableRow 
                        key={item.id}
                        hover
                        sx={{
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.warning.main, 0.02),
                            transition: 'background-color 0.2s ease'
                          },
                          animation: `fadeIn 0.3s ease ${index * 0.05}s`
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={item.kode_kompetensi} 
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.dark,
                              borderRadius: 1.5
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
                            {item.nama_kompetensi}
                          </Typography>
                          {item.deskripsi && (
                            <Typography 
                              variant="caption" 
                              color="textSecondary" 
                              sx={{ 
                                display: 'block',
                                maxWidth: 350,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.deskripsi}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.nama_fungsi} 
                            size="small"
                            sx={{ 
                              fontWeight: 500,
                              borderRadius: 1.5,
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.dark
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.nama_peran} 
                            size="small"
                            sx={{ 
                              fontWeight: 500,
                              borderRadius: 1.5,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.dark
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {item.mapping && item.mapping.length > 0 ? (
                              <>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                  {item.mapping.slice(0, 2).map((map, idx) => (
                                    <Chip
                                      key={idx}
                                      label={`${map.nama_jabatan} - ${map.nama_jenjang}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        borderRadius: 1,
                                        borderColor: alpha(theme.palette.warning.main, 0.3)
                                      }}
                                    />
                                  ))}
                                  {item.mapping.length > 2 && (
                                    <Tooltip 
                                      title={
                                        <Box sx={{ p: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                            Mapping Lainnya:
                                          </Typography>
                                          {item.mapping.slice(2).map((map, idx) => (
                                            <Typography key={idx} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                              • {map.nama_jabatan} - {map.nama_jenjang}
                                            </Typography>
                                          ))}
                                        </Box>
                                      }
                                      arrow
                                    >
                                      <Chip
                                        label={`+${item.mapping.length - 2}`}
                                        size="small"
                                        sx={{ 
                                          fontSize: '0.7rem',
                                          borderRadius: 1,
                                          bgcolor: alpha(theme.palette.warning.main, 0.05)
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                                
                              </>
                            ) : (
                              <Typography variant="caption" sx={{ color: theme.palette.warning.main, fontStyle: 'italic' }}>
                                Belum ada mapping
                              </Typography>
                            )}
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleOpenModal('mapping', 'add', item)}
                              disabled={!isAdminTambunRaya}
                              sx={{ 
                                mt: 1, 
                                p: 0,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                color: theme.palette.warning.main,
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                '&.Mui-disabled': {
                                  color: alpha(theme.palette.warning.main, 0.4)
                                }
                              }}
                            >
                              Atur Mapping
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <ActionButton
                              icon={ViewIcon}
                              label="Lihat"
                              color="info"
                              onClick={() => handleOpenModal('mapping', 'view', item)}
                              disabled={!isAdminTambunRaya}
                              tooltip="Lihat Detail Mapping"
                            />
                            <ActionButton
                              icon={EditIcon}
                              label="Edit"
                              color="warning"
                              onClick={() => handleOpenModal('kompetensi', 'edit', item)}
                              disabled={!isAdminTambunRaya}
                              tooltip="Edit Kompetensi"
                            />
                            <ActionButton
                              icon={DeleteIcon}
                              label="Hapus"
                              color="error"
                              onClick={() => handleDelete('kompetensi', item.id, 'Apakah Anda yakin ingin menghapus data kompetensi ini?\nSemua mapping kompetensi juga akan ikut terhapus.')}
                              disabled={!isAdminTambunRaya}
                              tooltip="Hapus Kompetensi"
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: 53 * emptyRows }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* PAGINATION SECTION */}
          {!loading && getFilteredKompetensi.length > 0 && (
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                borderTop: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.5),
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.6)
              }}
            >
              {/* ROWS PER PAGE */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    displayEmpty
                    sx={{ 
                      height: 36,
                      borderRadius: 2,
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }
                    }}
                  >
                    {rowsPerPageOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LayersIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                          {option} baris
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="textSecondary">
                  Menampilkan{' '}
                  <Typography component="span" fontWeight="600" color="textPrimary">
                    {totalItems === 0 ? 0 : page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalItems)}
                  </Typography>{' '}
                  dari{' '}
                  <Typography component="span" fontWeight="600" color="textPrimary">
                    {totalItems}
                  </Typography>{' '}
                  kompetensi
                </Typography>
              </Box>

              {/* PAGINATION CONTROLS */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[]}
                  ActionsComponent={TablePaginationActions}
                  sx={{
                    '.MuiTablePagination-spacer': { display: 'none' },
                    '.MuiTablePagination-displayedRows': { display: 'none' },
                    '.MuiTablePagination-actions': { display: 'none' }
                  }}
                />
                
                <Pagination
                  count={Math.ceil(totalItems / rowsPerPage)}
                  page={page + 1}
                  onChange={(e, value) => handleChangePage(e, value - 1)}
                  color="warning"
                  size={isMobile ? 'small' : 'medium'}
                  shape="rounded"
                  variant="outlined"
                  renderItem={(item) => (
                    <PaginationItem
                      slots={{
                        first: FirstPageIcon,
                        last: LastPageIcon,
                        previous: ChevronLeftIcon,
                        next: ChevronRightIcon
                      }}
                      {...item}
                      sx={{
                        borderRadius: 2,
                        '&.Mui-selected': {
                          bgcolor: theme.palette.warning.main,
                          color: 'white',
                          '&:hover': {
                            bgcolor: theme.palette.warning.dark
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
          )}
        </Paper>

        {/* STATISTICS CARD */}
        {!loading && getFilteredKompetensi.length > 0 && (
          <Fade in={true}>
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.5),
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1.5 }}>
                    <BookmarkIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Total Kompetensi</Typography>
                    <Typography variant="body1" fontWeight="700">{totalItems}</Typography>
                  </Box>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1.5 }}>
                    <CategoryIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Fungsi Terkait</Typography>
                    <Typography variant="body1" fontWeight="700">
                      {new Set(getFilteredKompetensi.map(k => k.id_fungsi)).size}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1.5 }}>
                    <AssignmentIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Peran Terkait</Typography>
                    <Typography variant="body1" fontWeight="700">
                      {new Set(getFilteredKompetensi.map(k => k.id_peran)).size}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Button
                variant="text"
                startIcon={<DownloadIcon />}
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2,
                  color: theme.palette.warning.main
                }}
              >
                Export Data
              </Button>
            </Paper>
          </Fade>
        )}
      </Box>
    );
  };

  // ========== MAIN RENDER ==========
  if (status === 'loading' || checkingRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary', fontWeight: 400 }}>
          {status === 'loading' ? 'Memeriksa autentikasi...' : 'Memeriksa hak akses...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Master Data Kepegawaian
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" color="textSecondary">
              Kelola data jabatan, jenjang, fungsi, peran, dan kompetensi
            </Typography>
            <Chip
              icon={isAdminTambunRaya ? <AdminIcon /> : <PersonIcon />}
              label={isAdminTambunRaya ? 'Admin Tambun Raya' : 'User Biasa'}
              color={isAdminTambunRaya ? 'warning' : 'default'}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </Box>
        <Tooltip title="Refresh Data" arrow>
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              width: 48,
              height: 48
            }}
          >
            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* STATS CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Jabatan"
            value={jabatan.length}
            icon={WorkIcon}
            color={theme.palette.primary.main}
            gradient={`linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`}
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Jenjang"
            value={jenjang.length}
            icon={SchoolIcon}
            color={theme.palette.success.main}
            gradient={`linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Fungsi"
            value={fungsi.length}
            icon={CategoryIcon}
            color={theme.palette.info.main}
            gradient={`linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`}
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Peran"
            value={peran.length}
            icon={AssignmentIcon}
            color={theme.palette.secondary.main}
            gradient={`linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`}
            delay={300}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Kompetensi"
            value={kompetensi.length}
            icon={BookmarkIcon}
            color={theme.palette.warning.main}
            gradient={`linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`}
            delay={400}
          />
        </Grid>
      </Grid>

      {/* TABS */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.5),
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="master data tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.5),
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }
            },
            '& .Mui-selected': {
              fontWeight: 600
            }
          }}
        >
          <Tab 
            label="Jabatan" 
            icon={<WorkIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Jenjang" 
            icon={<SchoolIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Fungsi" 
            icon={<CategoryIcon />} 
            iconPosition="start" 
            {...a11yProps(2)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Peran" 
            icon={<AssignmentIcon />} 
            iconPosition="start" 
            {...a11yProps(3)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Kompetensi" 
            icon={<BookmarkIcon />} 
            iconPosition="start" 
            {...a11yProps(4)} 
            sx={{ textTransform: 'none' }}
          />
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
        onClose={() => handleCloseModal('jabatan', false)}
        onSuccess={() => handleCloseModal('jabatan', true)}
        mode={modalJabatan.mode}
        data={modalJabatan.data}
      />

      <JenjangModal
        open={modalJenjang.open}
        onClose={() => handleCloseModal('jenjang', false)}
        onSuccess={() => handleCloseModal('jenjang', true)}
        mode={modalJenjang.mode}
        data={modalJenjang.data}
      />

      <FungsiModal
        open={modalFungsi.open}
        onClose={() => handleCloseModal('fungsi', false)}
        onSuccess={() => handleCloseModal('fungsi', true)}
        mode={modalFungsi.mode}
        data={modalFungsi.data}
      />

      <PeranModal
        open={modalPeran.open}
        onClose={() => handleCloseModal('peran', false)}
        onSuccess={() => handleCloseModal('peran', true)}
        mode={modalPeran.mode}
        data={modalPeran.data}
        fungsiList={fungsi}
      />

      <KompetensiModal
        open={modalKompetensi.open}
        onClose={() => handleCloseModal('kompetensi', false)}
        onSuccess={() => handleCloseModal('kompetensi', true)}
        mode={modalKompetensi.mode}
        data={modalKompetensi.data}
        fungsiList={fungsi}
        peranList={peran}
        jabatanList={jabatan}
        jenjangList={jenjang}
      />

      <MappingModal
        open={modalMapping.open}
        onClose={() => handleCloseModal('mapping', false)}
        onSuccess={() => handleCloseModal('mapping', true)}
        mode={modalMapping.mode}
        data={modalMapping.data}
        kompetensiId={modalMapping.kompetensiId}
        jabatanList={jabatan}
        jenjangList={jenjang}
      />

      {/* SNACKBAR UNTUK NOTIFICATION */}
      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={message.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            alignItems: 'center'
          }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
            info: <InfoIcon fontSize="inherit" />
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            {message.text}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MasterForm;