// pages/home.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { fetchDashboardStats } from '../components/dashboard/api/dashboardApi';
import { fetchUserKompetensi } from '../components/userskompetensi/api/userKompetensiApi';
import { fetchKompetensiWajib, fetchKompetensiWajibByTahun } from '../components/pelatihan/api/pelatihanApi';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';

// Tambahkan CSS untuk efek kedip
const blinkAnimation = `
  @keyframes blink {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.02); text-shadow: 0 0 10px rgba(255,255,255,0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .blink-text {
    animation: blink 1s ease-in-out infinite;
  }
  
  .pulse-glow {
    animation: pulse-glow 2s infinite;
  }
  
  .slide-in {
    animation: slideInLeft 0.5s ease-out;
  }
`;

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';
  
  const [userInfo, setUserInfo] = useState({
    username: '',
    name: '',
    email: '',
    nip: '',
    jabatan: '',
    role: '',
    roles: [],
    loginTime: '',
    department: 'Balai Besar Pengawasan Obat dan Makanan di Palangka Raya'
  });

  const [stats, setStats] = useState({
    kompetensi: {
      total: 0,
      lulus: 0,
      tidakLulus: 0,
      dalamProses: 0,
      perluRevisi: 0,
      persentase: 0,
      byStatus: [],
      byFungsi: []
    },
    pelatihan: {
      totalJadwal: 0,
      draft: 0,
      publik: 0,
      berlangsung: 0,
      selesai: 0,
      totalPeserta: 0,
      totalHadir: 0,
      undanganPending: 0,
      byBulan: [],
      byStatusPelatihan: []
    },
    masterPelatihan: {
      total: 0,
      byJenis: []
    },
    recentActivities: []
  });

  // State untuk profile kompetensi user
  const [userKompetensi, setUserKompetensi] = useState([]);
  const [userKompetensiStats, setUserKompetensiStats] = useState({
    total: 0,
    lulus: 0,
    tidakLulus: 0,
    dalamProses: 0,
    perluRevisi: 0,
    persentase: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAllKompetensi, setShowAllKompetensi] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // State untuk notifikasi admin (kompetensi yang harus diverifikasi)
  const [usersWithUnverifiedKompetensi, setUsersWithUnverifiedKompetensi] = useState([]);
  const [isLoadingAdminNotification, setIsLoadingAdminNotification] = useState(false);
  const [allKompetensiData, setAllKompetensiData] = useState([]);

  // State untuk kompetensi wajib user
  const [kompetensiWajibData, setKompetensiWajibData] = useState([]);
  const [kompetensiUserValid, setKompetensiUserValid] = useState([]);
  const [kompetensiWajibBelumDipenuhi, setKompetensiWajibBelumDipenuhi] = useState([]);
  const [isLoadingKompetensiWajib, setIsLoadingKompetensiWajib] = useState(false);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // DATA SIMULASI UNTUK TESTING - TAMPILKAN SEMUA USER
  const MOCK_ALL_USERS_DATA = [
    {
      id: 1,
      user_nip: '198001012005011001',
      user_nama: 'Dr. Ahmad Budiman, M.Si',
      user_jabatan: 'Kepala Balai',
      kode_kompetensi: 'KOMP-001',
      nama_kompetensi: 'Manajemen Pengawasan Obat dan Makanan',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-01-15'
    },
    {
      id: 2,
      user_nip: '198001012005011001',
      user_nama: 'Dr. Ahmad Budiman, M.Si',
      user_jabatan: 'Kepala Balai',
      kode_kompetensi: 'KOMP-002',
      nama_kompetensi: 'Pengawasan Keamanan Pangan',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-02-10'
    },
    {
      id: 3,
      user_nip: '198502122010022002',
      user_nama: 'Siti Rahmawati, S.Si., Apt.',
      user_jabatan: 'Kepala Bidang',
      kode_kompetensi: 'KOMP-001',
      nama_kompetensi: 'Manajemen Pengawasan Obat dan Makanan',
      verified_by: 'admin1',
      hasil_verif: 'Valid',
      status: 'Lulus',
      tanggal_dipenuhi: '2024-01-20'
    },
    {
      id: 4,
      user_nip: '198502122010022002',
      user_nama: 'Siti Rahmawati, S.Si., Apt.',
      user_jabatan: 'Kepala Bidang',
      kode_kompetensi: 'KOMP-003',
      nama_kompetensi: 'Pengawasan Obat Tradisional',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-03-01'
    },
    {
      id: 5,
      user_nip: '199003152015031003',
      user_nama: 'Bambang Prasetyo, S.T.',
      user_jabatan: 'Kepala Seksi',
      kode_kompetensi: 'KOMP-002',
      nama_kompetensi: 'Pengawasan Keamanan Pangan',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-02-25'
    },
    {
      id: 6,
      user_nip: '199003152015031003',
      user_nama: 'Bambang Prasetyo, S.T.',
      user_jabatan: 'Kepala Seksi',
      kode_kompetensi: 'KOMP-004',
      nama_kompetensi: 'Pengawasan Kosmetik',
      verified_by: 'admin2',
      hasil_verif: 'Perlu Revisi',
      status: 'Tidak Lulus',
      tanggal_dipenuhi: '2024-01-30'
    },
    {
      id: 7,
      user_nip: '199112202018042004',
      user_nama: 'Dewi Lestari, S.Farm., Apt.',
      user_jabatan: 'Pengawas Farmasi Muda',
      kode_kompetensi: 'KOMP-001',
      nama_kompetensi: 'Manajemen Pengawasan Obat dan Makanan',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-03-10'
    },
    {
      id: 8,
      user_nip: '199112202018042004',
      user_nama: 'Dewi Lestari, S.Farm., Apt.',
      user_jabatan: 'Pengawas Farmasi Muda',
      kode_kompetensi: 'KOMP-005',
      nama_kompetensi: 'Inspeksi Sarana Produksi',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-02-28'
    },
    {
      id: 9,
      user_nip: '199112202018042004',
      user_nama: 'Dewi Lestari, S.Farm., Apt.',
      user_jabatan: 'Pengawas Farmasi Muda',
      kode_kompetensi: 'KOMP-006',
      nama_kompetensi: 'Pengujian Laboratorium',
      verified_by: null,
      hasil_verif: null,
      status: 'Menunggu',
      tanggal_dipenuhi: '2024-03-05'
    },
    {
      id: 10,
      user_nip: '198807202009032005',
      user_nama: 'Eko Supriyanto, S.Sos.',
      user_jabatan: 'Analis Kebijakan',
      kode_kompetensi: 'KOMP-002',
      nama_kompetensi: 'Pengawasan Keamanan Pangan',
      verified_by: 'admin1',
      hasil_verif: 'Tidak Valid',
      status: 'Tidak Lulus',
      tanggal_dipenuhi: '2024-01-25'
    }
  ];

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user) {
      extractUserInfo(session);
      fetchDashboardData();
      fetchKompetensiWajibUser(); // Tambahkan fetch kompetensi wajib
      // Untuk admin, ambil semua data kompetensi untuk verifikasi
      if (userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya') {
        fetchAllKompetensiData();
      }
    }
  }, [session]);

  // Panggil fetchUserKompetensiData setelah userInfo terisi
  useEffect(() => {
    if (userInfo.nip && userInfo.nip !== '-') {
      console.log('🔄 userInfo updated, fetching kompetensi for NIP:', userInfo.nip);
      fetchUserKompetensiData();
    }
  }, [userInfo.nip]);

  // Fetch kompetensi wajib untuk user
  const fetchKompetensiWajibUser = async () => {
    setIsLoadingKompetensiWajib(true);
    try {
      const currentYear = new Date().getFullYear().toString();
      
      // Ambil kompetensi wajib untuk tahun ini
      const result = await fetchKompetensiWajib(session, { tahun: currentYear });
      
      if (result.success && result.data) {
        setKompetensiWajibData(result.data);
        console.log('📊 Kompetensi wajib tahun ini:', result.data.length);
      }
    } catch (error) {
      console.error('Error fetching kompetensi wajib:', error);
    } finally {
      setIsLoadingKompetensiWajib(false);
    }
  };

  // Hitung kompetensi wajib yang belum dipenuhi (setelah userKompetensi di-load)
  useEffect(() => {
    if (kompetensiWajibData.length > 0 && userKompetensi.length > 0) {
      // Ambil kompetensi user yang sudah valid (Lulus + hasil_verif Valid)
      const validUserKompetensi = userKompetensi.filter(item => 
        item.status === 'Lulus' && item.hasil_verif === 'Valid'
      );
      setKompetensiUserValid(validUserKompetensi);
      
      const userKompetensiIds = new Set(validUserKompetensi.map(k => k.id_kompetensi));
      
      // Filter kompetensi wajib yang belum dipenuhi user
      const belumDipenuhi = kompetensiWajibData.filter(kw => !userKompetensiIds.has(kw.id_kompetensi));
      setKompetensiWajibBelumDipenuhi(belumDipenuhi);
      
      console.log('📊 Kompetensi wajib BELUM dipenuhi:', belumDipenuhi.length);
    } else if (kompetensiWajibData.length > 0 && userKompetensi.length === 0) {
      // Jika user belum punya kompetensi sama sekali
      setKompetensiWajibBelumDipenuhi(kompetensiWajibData);
      console.log('📊 Kompetensi wajib BELUM dipenuhi (user belum punya kompetensi):', kompetensiWajibData.length);
    }
  }, [kompetensiWajibData, userKompetensi]);

  // Fungsi untuk mengambil SEMUA data kompetensi (untuk admin)
  const fetchAllKompetensiData = async () => {
    setIsLoadingAdminNotification(true);
    try {
      console.log('📡 Fetching ALL kompetensi data for admin...');
      
      const result = await fetchUserKompetensi(session, { all: true });
      
      console.log('📥 Raw all kompetensi result:', result);
      console.log('📥 Data length:', result.data?.length);
      
      if (result.success && result.data && result.data.length > 0) {
        setAllKompetensiData(result.data);
        processUnverifiedKompetensi(result.data);
      } else {
        console.log('⚠️ Using mock data for testing...');
        setAllKompetensiData(MOCK_ALL_USERS_DATA);
        processUnverifiedKompetensi(MOCK_ALL_USERS_DATA);
      }
    } catch (error) {
      console.error('Error fetching all kompetensi:', error);
      setAllKompetensiData(MOCK_ALL_USERS_DATA);
      processUnverifiedKompetensi(MOCK_ALL_USERS_DATA);
    } finally {
      setIsLoadingAdminNotification(false);
    }
  };

  // Proses data kompetensi untuk mendapatkan kompetensi yang BELUM DIVERIFIKASI (untuk admin)
  const processUnverifiedKompetensi = (data) => {
    if (!data || data.length === 0) {
      console.log('No kompetensi data available');
      setUsersWithUnverifiedKompetensi([]);
      return;
    }

    console.log('Processing unverified kompetensi from', data.length, 'records');
    
    // Filter hanya kompetensi yang BELUM diverifikasi (verified_by === null)
    const unverifiedData = data.filter(item => !item.verified_by);
    
    console.log('Unverified kompetensi count:', unverifiedData.length);
    
    // Kelompokkan berdasarkan user_nip
    const grouped = unverifiedData.reduce((acc, item) => {
      const nip = item.user_nip;
      if (!nip) return acc;
      
      if (!acc[nip]) {
        acc[nip] = {
          nip: nip,
          nama: item.user_nama || item.user_name || item.nama_user || nip,
          jabatan: item.user_jabatan || item.jabatan_user || '-',
          email: item.user_email || '-',
          totalKompetensi: 0,
          unverifiedKompetensi: []
        };
      }
      
      acc[nip].totalKompetensi++;
      acc[nip].unverifiedKompetensi.push({
        id: item.id,
        kode: item.kode_kompetensi,
        nama: item.nama_kompetensi,
        status: 'Menunggu Verifikasi',
        tanggal: item.tanggal_dipenuhi,
        verified_by: item.verified_by,
        hasil_verif: item.hasil_verif
      });
      
      return acc;
    }, {});
    
    console.log('Grouped data:', Object.keys(grouped).length, 'users');
    
    // Filter hanya yang memiliki unverified kompetensi
    const filtered = Object.values(grouped).filter(u => u.unverifiedKompetensi.length > 0);
    // Urutkan berdasarkan jumlah terbanyak
    filtered.sort((a, b) => b.unverifiedKompetensi.length - a.unverifiedKompetensi.length);
    
    console.log('📊 Users with unverified kompetensi:', filtered.length);
    filtered.forEach(u => {
      console.log(`- ${u.nama} (${u.nip}): ${u.unverifiedKompetensi.length} kompetensi menunggu verifikasi`);
      u.unverifiedKompetensi.forEach(k => {
        console.log(`  * ${k.kode} - ${k.nama}`);
      });
    });
    
    setUsersWithUnverifiedKompetensi(filtered);
  };

  const extractUserInfo = (session) => {
    try {
      const user = session.user;
      let tokenPayload = {};
      
      if (session.accessToken) {
        try {
          const base64Payload = session.accessToken.split('.')[1];
          const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
          tokenPayload = JSON.parse(decodedPayload);
        } catch (e) {
          console.log('Cannot parse token');
        }
      }

      const username = tokenPayload.preferred_username || user.preferred_username || user.name || 'User';
      const name = tokenPayload.name || user.name || username;
      const email = tokenPayload.email || user.email || '-';
      
      let nip = '-';
      if (tokenPayload.preferred_username && /^\d+$/.test(tokenPayload.preferred_username)) {
        nip = tokenPayload.preferred_username;
      } else if (tokenPayload.nip) {
        nip = tokenPayload.nip;
      } else if (user.nip) {
        nip = user.nip;
      } else {
        const numericPart = username.match(/\d+/);
        nip = numericPart ? numericPart[0] : username;
      }
      
      let jabatan = 'Pegawai';
      if (tokenPayload.jabatan) jabatan = tokenPayload.jabatan;
      else if (user.jabatan) jabatan = user.jabatan;
      
      let role = 'user';
      const roles = [];

      if (tokenPayload.realm_access?.roles) roles.push(...tokenPayload.realm_access.roles);
      if (tokenPayload.resource_access) {
        Object.values(tokenPayload.resource_access).forEach(client => {
          if (client?.roles) roles.push(...client.roles);
        });
      }
      if (user.roles) {
        if (Array.isArray(user.roles)) roles.push(...user.roles);
        else roles.push(user.roles);
      }
      
      if (roles.includes('admin_tambun_raya')) role = 'admin_tambun_raya';
      else if (roles.includes('admin')) role = 'admin';
      else if (roles.includes('katim')) role = 'katim';
      else if (user.role) role = user.role;
      
      const loginTime = new Date().toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      setUserInfo({
        username,
        name,
        email,
        nip,
        jabatan,
        role,
        roles: [...new Set(roles)],
        loginTime,
        department: 'Balai Besar Pengawasan Obat dan Makanan di Palangka Raya'
      });
      
      console.log('✅ User Info extracted:', { nip, name, role });
      
    } catch (error) {
      console.error('Error extracting user info:', error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('📡 Fetching dashboard stats...');
      const result = await fetchDashboardStats(session);
      
      console.log('📥 Dashboard result:', result);
      
      if (result.success) {
        console.log('📊 Dashboard Data:', result.data);
        setStats(result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        setFetchError(result.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setFetchError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch kompetensi milik user yang sedang login
  const fetchUserKompetensiData = async () => {
    try {
      console.log('📡 Fetching user kompetensi for NIP:', userInfo.nip);
      
      const result = await fetchUserKompetensi(session, { all: true });
      
      if (result.success) {
        // Filter hanya data user yang sedang login
        const userNip = userInfo.nip;
        const userData = result.data.filter(item => item.user_nip === userNip);
        
        setUserKompetensi(userData);
        
        // Hitung statistik
        const total = userData.length;
        const lulus = userData.filter(item => item.status === 'Lulus' && item.hasil_verif === 'Valid').length;
        const tidakLulus = userData.filter(item => item.status === 'Tidak Lulus' || item.hasil_verif === 'Tidak Valid').length;
        const dalamProses = userData.filter(item => !item.verified_by).length;
        const perluRevisi = userData.filter(item => item.hasil_verif === 'Perlu Revisi').length;
        
        setUserKompetensiStats({
          total,
          lulus,
          tidakLulus,
          dalamProses,
          perluRevisi,
          persentase: total > 0 ? Math.round((lulus / total) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching user kompetensi:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin_tambun_raya': return 'from-purple-600 to-purple-800';
      case 'admin': return 'from-red-600 to-red-800';
      case 'katim': return 'from-blue-600 to-blue-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin_tambun_raya': return 'Admin Tambun Raya';
      case 'admin': return 'Administrator';
      case 'katim': return 'Ketua Tim';
      default: return 'Pegawai';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin_tambun_raya': return '👑';
      case 'admin': return '⚡';
      case 'katim': return '👥';
      default: return '👤';
    }
  };

  const getStatusBadge = (status, hasilVerif) => {
    if (status === 'Lulus' && hasilVerif === 'Valid') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'Tidak Lulus' || hasilVerif === 'Tidak Valid') {
      return 'bg-red-100 text-red-800';
    } else if (hasilVerif === 'Perlu Revisi') {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (item) => {
    if (item.verified_by && item.hasil_verif === 'Valid') {
      return 'Valid';
    } else if (item.verified_by && item.hasil_verif === 'Tidak Valid') {
      return 'Ditolak';
    } else if (item.verified_by && item.hasil_verif === 'Perlu Revisi') {
      return 'Perlu Revisi';
    } else if (item.verified_by) {
      return 'Terverifikasi';
    } else {
      return 'Menunggu';
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${color} shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium text-lg">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya' || userInfo.role === 'katim';

  return (
    <DashboardLayout>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: blinkAnimation }} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <div className={`bg-gradient-to-r ${getRoleColor(userInfo.role)} text-white w-full`}>
          <div className="px-8 py-10 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Selamat Datang, {userInfo.name}!</h1>
                <p className="text-white/80 mt-3 text-xl flex items-center">
                  <span className="mr-3 text-2xl">{getRoleIcon(userInfo.role)}</span>
                  {getRoleDisplay(userInfo.role)} • {userInfo.department}
                </p>
                <p className="text-white/60 mt-2 text-base">
                  NIP: {userInfo.nip} | {userInfo.jabatan}
                </p>
              </div>
              <div className="bg-white/20 rounded-2xl px-8 py-6 backdrop-blur-lg border border-white/30">
                <p className="text-sm text-white/80">Login Terakhir</p>
                <p className="font-semibold text-lg mt-1">{userInfo.loginTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8 max-w-[1600px] mx-auto">

          {/* NOTIFIKASI KOMPETENSI WAJIB YANG HARUS DIPENUHI - UNTUK USER BIASA */}
          {!isAdmin && kompetensiWajibBelumDipenuhi.length > 0 && (
            <div className="mb-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-xl overflow-hidden slide-in pulse-glow">
              <div className="px-8 py-6 flex items-start text-white">
                <div className="flex-shrink-0 mr-6">
                  <span className="text-5xl animate-bounce inline-block">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-2xl mb-3 flex items-center flex-wrap gap-3">
                    <span className="blink-text bg-red-600 px-4 py-2 rounded-lg shadow-lg">
                      🎯 KOMPETENSI WAJIB YANG HARUS ANDA PENUHI
                    </span>
                    <span className="bg-yellow-400 text-yellow-900 text-sm px-3 py-1 rounded-full animate-pulse font-bold">
                      {kompetensiWajibBelumDipenuhi.length} kompetensi
                    </span>
                  </p>
                  <p className="text-white/90 text-sm mb-3 flex items-center">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                    Kompetensi berikut adalah kompetensi WAJIB untuk tahun {new Date().getFullYear()} yang belum Anda penuhi
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {kompetensiWajibBelumDipenuhi.slice(0, 5).map((item, idx) => (
                      <div key={item.id || idx} className="bg-white/10 rounded-lg px-4 py-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 transform">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex-1">
                            <span className="font-semibold text-sm bg-white/20 px-2 py-1 rounded">
                              {item.kode_kompetensi}
                            </span>
                            <span className="ml-2 text-sm">{item.nama_kompetensi || item.kompetensi_original}</span>
                          </div>
                          <span className="text-xs bg-red-400 text-white px-2 py-1 rounded-full animate-pulse font-bold">
                            WAJIB
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 ml-1">
                          Fungsi: {item.nama_fungsi || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {kompetensiWajibBelumDipenuhi.length > 5 && (
                    <p className="text-xs text-white/80 mt-2">
                      +{kompetensiWajibBelumDipenuhi.length - 5} kompetensi wajib lainnya
                    </p>
                  )}
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <Link 
                      href="/users_kompetensi/tambah" 
                      className="inline-block text-sm bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-all duration-300 hover:scale-105 transform animate-pulse"
                    >
                      + Tambah/Upload Kompetensi
                    </Link>
                    <Link 
                      href="/pelatihan" 
                      className="inline-block text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 hover:scale-105 transform"
                    >
                      📚 Cari Pelatihan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI SEMUA KOMPETENSI WAJIB SUDAH TERPENUHI */}
          {!isAdmin && kompetensiWajibData.length > 0 && kompetensiWajibBelumDipenuhi.length === 0 && (
            <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl overflow-hidden slide-in">
              <div className="px-8 py-6 flex items-center text-white">
                <div className="flex-shrink-0 mr-6">
                  <span className="text-5xl animate-bounce inline-block">🎉</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-2xl mb-2">
                    Selamat! Semua Kompetensi Wajib Terpenuhi
                  </p>
                  <p className="text-white/90 text-sm">
                    Anda telah memenuhi semua kompetensi wajib untuk tahun {new Date().getFullYear()}. 
                    Pertahankan prestasi Anda!
                  </p>
                  <div className="mt-3">
                    <Link 
                      href="/users_kompetensi" 
                      className="inline-block text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
                    >
                      Lihat Semua Kompetensi →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI UNTUK ADMIN: KOMPETENSI YANG HARUS DIVERIFIKASI */}
          {isAdmin && usersWithUnverifiedKompetensi.length > 0 && (
            <div className="mb-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-xl overflow-hidden slide-in">
              <div className="px-8 py-6 flex items-start text-white">
                <div className="flex-shrink-0 mr-6">
                  <span className="text-5xl animate-bounce inline-block">🔔</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap mb-3">
                    <p className="font-bold text-2xl flex items-center gap-3">
                      <span className="blink-text bg-red-600 px-4 py-2 rounded-lg shadow-lg">
                        ⚠️ KOMPETENSI YANG HARUS DIVERIFIKASI
                      </span>
                      <span className="bg-yellow-400 text-yellow-900 text-sm px-3 py-1 rounded-full animate-pulse font-bold">
                        {usersWithUnverifiedKompetensi.reduce((sum, u) => sum + u.unverifiedKompetensi.length, 0)} kompetensi
                      </span>
                    </p>
                  </div>
                  <p className="text-sm text-white/90 mb-4 flex items-center">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                    Berikut adalah daftar kompetensi yang <strong className="mx-1">BELUM DIVERIFIKASI</strong> dan perlu segera diverifikasi
                  </p>

                  {isLoadingAdminNotification ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      <span className="ml-3">Memuat data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {usersWithUnverifiedKompetensi.map((user, idx) => (
                          <div key={user.nip || idx} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 transform cursor-pointer">
                            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                              <div>
                                <span className="font-bold text-white text-lg">{user.nama}</span>
                                <span className="text-xs text-white/70 ml-2">NIP: {user.nip}</span>
                                {user.jabatan !== '-' && (
                                  <span className="text-xs text-white/70 ml-2">• {user.jabatan}</span>
                                )}
                              </div>
                              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full animate-pulse font-bold">
                                {user.unverifiedKompetensi.length} kompetensi
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {user.unverifiedKompetensi.slice(0, 3).map((kom, kidx) => (
                                <div key={kidx} className="text-sm text-white/80 flex justify-between items-center flex-wrap gap-2">
                                  <div className="flex-1">
                                    <span className="font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">
                                      {kom.kode}
                                    </span>
                                    <span className="ml-2">{kom.nama}</span>
                                  </div>
                                  <span className="text-xs bg-yellow-300 text-yellow-800 px-2 py-0.5 rounded-full animate-pulse">
                                    ⏳ Menunggu
                                  </span>
                                </div>
                              ))}
                              {user.unverifiedKompetensi.length > 3 && (
                                <p className="text-xs text-white/60">
                                  +{user.unverifiedKompetensi.length - 3} kompetensi lainnya
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex gap-3">
                              <Link 
                                href={`/users_kompetensi?nip=${user.nip}`} 
                                className="text-xs text-white underline hover:no-underline hover:text-yellow-200 transition-colors"
                              >
                                Lihat semua kompetensi user →
                              </Link>
                              <Link 
                                href={`/users_kompetensi/verifikasi?nip=${user.nip}`} 
                                className="text-xs text-yellow-200 underline hover:no-underline hover:text-yellow-100 transition-colors animate-pulse"
                              >
                                ⚡ Verifikasi sekarang →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/20 text-right">
                        <Link 
                          href="/users_kompetensi" 
                          className="text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 hover:scale-105 transform inline-block"
                        >
                          Kelola Semua Verifikasi →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Welcome Message untuk User Biasa - Undangan Pelatihan */}
          {!isAdmin && stats.pelatihan.undanganPending > 0 && (
            <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-8 py-6 flex items-center text-white">
                <span className="text-4xl mr-6">📬</span>
                <div className="flex-1">
                  <p className="font-bold text-xl">
                    Anda memiliki {stats.pelatihan.undanganPending} undangan pelatihan yang perlu dikonfirmasi
                  </p>
                  <Link href="/pelatihan" className="text-white/90 hover:text-white underline mt-2 inline-block text-lg">
                    Lihat undangan sekarang →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Profile Kompetensi Section - Hanya untuk user biasa */}
          {!isAdmin && (
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">🎓</span> 
                    Profil Kompetensi Anda
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Statistik Ringkas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{kompetensiWajibData.length}</p>
                      <p className="text-xs text-gray-600">Kompetensi Wajib</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{kompetensiWajibData.length - kompetensiWajibBelumDipenuhi.length}</p>
                      <p className="text-xs text-gray-600">Sudah Dipenuhi</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{kompetensiWajibBelumDipenuhi.length}</p>
                      <p className="text-xs text-gray-600">Belum Dipenuhi</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{userKompetensiStats.dalamProses}</p>
                      <p className="text-xs text-gray-600">Dalam Proses</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{userKompetensiStats.total}</p>
                      <p className="text-xs text-gray-600">Total Kompetensi</p>
                    </div>
                  </div>

                  {/* Progress Bar Kompetensi Wajib */}
                  {kompetensiWajibData.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress Pemenuhan Kompetensi Wajib</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(((kompetensiWajibData.length - kompetensiWajibBelumDipenuhi.length) / kompetensiWajibData.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${((kompetensiWajibData.length - kompetensiWajibBelumDipenuhi.length) / kompetensiWajibData.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Daftar Kompetensi Wajib yang Belum Dipenuhi */}
                  {kompetensiWajibBelumDipenuhi.length > 0 && (
                    <div className="mt-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs mr-2">!</span>
                        Kompetensi Wajib yang Perlu Dipenuhi
                      </h3>
                      <div className="space-y-2">
                        {kompetensiWajibBelumDipenuhi.map((item, index) => (
                          <div key={item.id || index} className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex-1">
                                <span className="font-semibold text-sm text-red-800">{item.kode_kompetensi}</span>
                                <p className="text-sm text-gray-700 mt-1">{item.nama_kompetensi || item.kompetensi_original}</p>
                                <p className="text-xs text-gray-500 mt-1">Fungsi: {item.nama_fungsi || '-'}</p>
                              </div>
                              <Link 
                                href={`/users_kompetensi/tambah?kompetensi_id=${item.id_kompetensi}`}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                + Tambah
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daftar Semua Kompetensi User */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Semua Kompetensi Anda</h3>
                      {userKompetensi.length > 5 && (
                        <button 
                          onClick={() => setShowAllKompetensi(!showAllKompetensi)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {showAllKompetensi ? 'Tampilkan Sedikit' : 'Lihat Semua'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {userKompetensi.length > 0 ? (
                        (showAllKompetensi ? userKompetensi : userKompetensi.slice(0, 5)).map((item, index) => (
                          <div key={item.id || index} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-2 flex-wrap gap-2">
                                  <span className="text-sm font-semibold text-gray-900 mr-2">{item.kode_kompetensi}</span>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(item.status, item.hasil_verif)}`}>
                                    {getStatusText(item)}
                                  </span>
                                </div>
                                <p className="text-base font-medium text-gray-800 mb-1">{item.nama_kompetensi}</p>
                                <div className="flex items-center text-xs text-gray-500 space-x-3 flex-wrap gap-2">
                                  <span>Tanggal: {item.tanggal_dipenuhi}</span>
                                  {item.nilai && <span>Nilai: {item.nilai}</span>}
                                  {item.verified_by_nama && (
                                    <span>Verifikator: {item.verified_by_nama}</span>
                                  )}
                                </div>
                                {item.hasil_verif === 'Perlu Revisi' && item.catatan && (
                                  <p className="text-xs text-orange-600 mt-2">📝 Catatan: {item.catatan}</p>
                                )}
                              </div>
                              <Link 
                                href={`/users_kompetensi/detail/${item.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                              >
                                Detail
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-2">Anda belum memiliki data kompetensi</p>
                          <Link 
                            href="/users_kompetensi/tambah"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Tambah Kompetensi
                          </Link>
                        </div>
                      )}

                      {!showAllKompetensi && userKompetensi.length > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-sm text-gray-500">
                            Menampilkan 5 dari {userKompetensi.length} kompetensi
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Link ke halaman kompetensi */}
                  {userKompetensi.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200 text-right">
                      <Link 
                        href="/users_kompetensi"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end"
                      >
                        Kelola Semua Kompetensi
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stat Cards Grid - Hanya untuk admin */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Kompetensi"
                value={stats.kompetensi.total}
                icon="🎓"
                color="bg-blue-100 text-blue-600"
                subtitle="Seluruh kompetensi"
              />
              <StatCard
                title="Menunggu Verifikasi"
                value={usersWithUnverifiedKompetensi.reduce((sum, u) => sum + u.unverifiedKompetensi.length, 0)}
                icon="⏳"
                color="bg-yellow-100 text-yellow-600"
                subtitle="Perlu segera diverifikasi"
              />
              <StatCard
                title="User dengan Kompetensi"
                value={usersWithUnverifiedKompetensi.length}
                icon="👥"
                color="bg-purple-100 text-purple-600"
                subtitle="Yang memiliki kompetensi pending"
              />
              <StatCard
                title="Jadwal Pelatihan"
                value={stats.pelatihan.totalJadwal}
                icon="📅"
                color="bg-purple-100 text-purple-600"
                subtitle={`${stats.pelatihan.berlangsung} Berlangsung`}
              />
            </div>
          )}

          {/* Stat Cards Grid - Untuk user biasa */}
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Kompetensi Wajib"
                value={kompetensiWajibData.length}
                icon="🎯"
                color="bg-purple-100 text-purple-600"
                subtitle={`${kompetensiWajibData.length - kompetensiWajibBelumDipenuhi.length} dipenuhi`}
              />
              <StatCard
                title="Sudah Dipenuhi"
                value={kompetensiWajibData.length - kompetensiWajibBelumDipenuhi.length}
                icon="✅"
                color="bg-green-100 text-green-600"
                subtitle="Dari kompetensi wajib"
              />
              <StatCard
                title="Belum Dipenuhi"
                value={kompetensiWajibBelumDipenuhi.length}
                icon="⚠️"
                color="bg-red-100 text-red-600"
                subtitle="Perlu segera dipenuhi"
              />
              <StatCard
                title="Undangan Pelatihan"
                value={stats.pelatihan.undanganPending || 0}
                icon="📬"
                color="bg-orange-100 text-orange-600"
                subtitle="Menunggu konfirmasi"
              />
            </div>
          )}

          {/* Charts Row 1 - Hanya untuk user biasa */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Kompetensi Status Chart */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mr-3 text-lg">📊</span>
                  Status Kompetensi
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.kompetensi.byStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.kompetensi.byStatus?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          border: 'none'
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-gray-700 font-medium">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pelatihan by Month Chart */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mr-3 text-lg">📈</span>
                  Tren Pelatihan per Bulan
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.pelatihan.byBulan}>
                      <defs>
                        <linearGradient id="colorJadwal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPeserta" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          border: 'none'
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="jadwal" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorJadwal)" 
                        name="Jumlah Jadwal"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="peserta" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorPeserta)" 
                        name="Jumlah Peserta"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row 2 - Hanya untuk user biasa */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Master Pelatihan by Jenis */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-2">📚</span>
                  Master Pelatihan
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.masterPelatihan.byJenis} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis dataKey="name" type="category" stroke="#6B7280" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: 'none'
                        }} 
                      />
                      <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Kompetensi by Fungsi */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-2">🏢</span>
                  Kompetensi per Fungsi
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.kompetensi.byFungsi}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: 'none'
                        }} 
                      />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pelatihan Status Radial */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mr-2">⚡</span>
                  Status Pelatihan
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="20%" 
                      outerRadius="80%" 
                      data={stats.pelatihan.byStatusPelatihan} 
                      startAngle={90} 
                      endAngle={-270}
                    >
                      <RadialBar
                        minAngle={15}
                        background
                        clockWise={true}
                        dataKey="value"
                        cornerRadius={8}
                      />
                      <Legend 
                        iconSize={10} 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: 'none'
                        }} 
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;