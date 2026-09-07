// pages/index.js - Dashboard Home
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { fetchDashboardStats } from '../components/dashboard/api/dashboardApi';
import { fetchUserKompetensi } from '../components/userskompetensi/api/userKompetensiApi';
import { fetchOptions } from '../components/userskompetensi/api/userKompetensiApi';
import UserskompetensiForm from '../components/userskompetensi/UserskompetensiForm';
import { fetchKompetensiWajib, fetchKompetensiWajibByTahun } from '../components/pelatihan/api/pelatihanApi';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';

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
    jabatanId: null,
    fungsi: '',
    fungsiId: null,
    peran: '',
    peranId: null,
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

  // State untuk kompetensi wajib user (SUDAH DIFILTER berdasarkan jabatan/fungsi/peran)
  const [kompetensiWajibData, setKompetensiWajibData] = useState([]);
  const [kompetensiWajibFiltered, setKompetensiWajibFiltered] = useState([]); // KOMPETENSI WAJIB YANG SESUAI JABATAN/FUNGSI/PERAN USER
  const [kompetensiUserValid, setKompetensiUserValid] = useState([]);
  const [kompetensiWajibBelumDipenuhi, setKompetensiWajibBelumDipenuhi] = useState([]); // SUDAH DIFILTER
  const [isLoadingKompetensiWajib, setIsLoadingKompetensiWajib] = useState(false);

  // State untuk notifikasi admin - pegawai yang belum 100% memenuhi kompetensi wajib
  const [pegawaiBelumLengkap, setPegawaiBelumLengkap] = useState([]);
  const [isLoadingPegawaiStatus, setIsLoadingPegawaiStatus] = useState(false);
  const [allPegawaiData, setAllPegawaiData] = useState([]);

  // State untuk master data (jabatan, fungsi, peran)
  const [masterJabatan, setMasterJabatan] = useState([]);
  const [masterFungsi, setMasterFungsi] = useState([]);
  const [masterPeran, setMasterPeran] = useState([]);

  // State untuk modal form tambah kompetensi
  const [showForm, setShowForm] = useState(false);
  const [formEditingData, setFormEditingData] = useState(null);
  const [formOptions, setFormOptions] = useState(null);
  const [formPreselectUserId, setFormPreselectUserId] = useState(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // === FUNGSI REFRESH DATA (dibuat reusable) ===
  const refreshDashboardData = useCallback(async () => {
    console.log('🔄 Refreshing dashboard data...');
    try {
      const result = await fetchDashboardStats(session);
      if (result.success) {
        setStats(result.data);
        console.log('✅ Dashboard stats refreshed');
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [session]);

  // Fungsi untuk mengambil master data (jabatan, fungsi, peran)
  const fetchMasterData = useCallback(async () => {
    try {
      const token = session?.accessToken || localStorage.getItem('token');
      
      // Ambil master jabatan
      const jabatanRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jabatan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jabatanResult = await jabatanRes.json();
      if (jabatanResult.success) {
        setMasterJabatan(jabatanResult.data);
      }
      
      // Ambil master fungsi
      const fungsiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fungsi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fungsiResult = await fungsiRes.json();
      if (fungsiResult.success) {
        setMasterFungsi(fungsiResult.data);
      }
      
      // Ambil master peran
      const peranRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/peran`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const peranResult = await peranRes.json();
      if (peranResult.success) {
        setMasterPeran(peranResult.data);
      }
      
      console.log('✅ Master data fetched:', {
        jabatan: jabatanResult.data?.length,
        fungsi: fungsiResult.data?.length,
        peran: peranResult.data?.length
      });
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  }, [session]);

  // Fungsi untuk mendapatkan data pegawai berdasarkan NIP (untuk mendapatkan jabatan, fungsi, peran)
  const fetchPegawaiByNip = useCallback(async (nip) => {
    try {
      const token = session?.accessToken || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pegawai/nip/${nip}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching pegawai by NIP:', error);
      return null;
    }
  }, [session]);

  // Fungsi untuk memfilter kompetensi wajib berdasarkan jabatan, fungsi, dan peran user
  const filterKompetensiWajibByUser = useCallback((kompetensiList, userJabatanId, userFungsiId, userPeranId) => {
    if (!kompetensiList || kompetensiList.length === 0) {
      return [];
    }
    
    console.log('🔍 Filtering kompetensi wajib with:', {
      jabatanId: userJabatanId,
      fungsiId: userFungsiId,
      peranId: userPeranId,
      totalKompetensi: kompetensiList.length
    });
    
    const filtered = kompetensiList.filter(kompetensi => {
      // Parse target_jabatan, target_fungsi, target_peran (bisa berupa string JSON atau array)
      let targetJabatan = [];
      let targetFungsi = [];
      let targetPeran = [];
      
      try {
        if (kompetensi.target_jabatan) {
          targetJabatan = typeof kompetensi.target_jabatan === 'string' 
            ? JSON.parse(kompetensi.target_jabatan) 
            : kompetensi.target_jabatan;
        }
        if (kompetensi.target_fungsi) {
          targetFungsi = typeof kompetensi.target_fungsi === 'string' 
            ? JSON.parse(kompetensi.target_fungsi) 
            : kompetensi.target_fungsi;
        }
        if (kompetensi.target_peran) {
          targetPeran = typeof kompetensi.target_peran === 'string' 
            ? JSON.parse(kompetensi.target_peran) 
            : kompetensi.target_peran;
        }
      } catch (e) {
        console.warn('Error parsing target for kompetensi:', kompetensi.kode_kompetensi, e);
      }
      
      // Jika tidak ada target yang ditentukan, kompetensi ini untuk semua (default)
      const hasNoTarget = targetJabatan.length === 0 && targetFungsi.length === 0 && targetPeran.length === 0;
      
      if (hasNoTarget) {
        return true; // Kompetensi untuk semua pegawai
      }
      
      // Cek apakah user masuk ke dalam target
      let matchesJabatan = true;
      let matchesFungsi = true;
      let matchesPeran = true;
      
      if (targetJabatan.length > 0) {
        matchesJabatan = targetJabatan.includes(Number(userJabatanId)) || targetJabatan.includes(String(userJabatanId));
      }
      
      if (targetFungsi.length > 0) {
        matchesFungsi = targetFungsi.includes(Number(userFungsiId)) || targetFungsi.includes(String(userFungsiId));
      }
      
      if (targetPeran.length > 0) {
        matchesPeran = targetPeran.includes(Number(userPeranId)) || targetPeran.includes(String(userPeranId));
      }
      
      // User harus memenuhi SEMUA target yang ditentukan (AND logic)
      // Jika ada target yang tidak dipenuhi, kompetensi tidak relevan untuk user ini
      const isRelevant = matchesJabatan && matchesFungsi && matchesPeran;
      
      if (isRelevant) {
        console.log(`✅ Kompetensi ${kompetensi.kode_kompetensi} relevan untuk user ini`);
      }
      
      return isRelevant;
    });
    
    console.log(`📊 Filtered kompetensi wajib: ${filtered.length} dari ${kompetensiList.length} kompetensi`);
    return filtered;
  }, []);

  const refreshAdminNotifications = useCallback(async () => {
    if (!userInfo.nip) return;
    
    const isAdminRole = userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya';
    
    if (isAdminRole) {
      console.log('🔄 Refreshing admin notifications...');
      await fetchAllKompetensiData();
      await fetchAllPegawaiForAdmin();
    }
  }, [userInfo.role, userInfo.nip]);

  const refreshUserKompetensiData = useCallback(async () => {
    if (!userInfo.nip || userInfo.nip === '-') return;
    
    console.log('🔄 Refreshing user kompetensi data...');
    try {
      const result = await fetchUserKompetensi(session, { all: true });
      
      if (result.success) {
        const userNip = userInfo.nip;
        const userData = result.data.filter(item => item.user_nip === userNip);
        
        setUserKompetensi(userData);
        
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
        console.log('✅ User kompetensi refreshed');
      }
    } catch (error) {
      console.error('Error refreshing user kompetensi:', error);
    }
  }, [session, userInfo.nip]);

  const refreshKompetensiWajibUser = useCallback(async () => {
    setIsLoadingKompetensiWajib(true);
    try {
      const currentYear = new Date().getFullYear().toString();
      const result = await fetchKompetensiWajib(session, { tahun: currentYear });
      
      if (result.success && result.data) {
        setKompetensiWajibData(result.data);
        console.log('📊 Kompetensi wajib (semua) fetched:', result.data.length);
        
        // Filter kompetensi wajib berdasarkan jabatan/fungsi/peran user
        if (userInfo.jabatanId || userInfo.fungsiId || userInfo.peranId) {
          const filtered = filterKompetensiWajibByUser(
            result.data,
            userInfo.jabatanId,
            userInfo.fungsiId,
            userInfo.peranId
          );
          setKompetensiWajibFiltered(filtered);
        } else {
          // Jika belum ada data jabatan/fungsi/peran, tampilkan semua dulu
          setKompetensiWajibFiltered(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching kompetensi wajib:', error);
    } finally {
      setIsLoadingKompetensiWajib(false);
    }
  }, [session, userInfo.jabatanId, userInfo.fungsiId, userInfo.peranId, filterKompetensiWajibByUser]);

  // Fungsi untuk mengambil SEMUA data kompetensi (untuk admin)
  const fetchAllKompetensiData = useCallback(async () => {
    setIsLoadingAdminNotification(true);
    try {
      console.log('📡 Fetching ALL kompetensi data for admin...');
      
      const result = await fetchUserKompetensi(session, { all: true });
      
      if (result.success && result.data && result.data.length > 0) {
        setAllKompetensiData(result.data);
        processUnverifiedKompetensi(result.data);
        console.log('✅ Admin kompetensi data refreshed');
      } else {
        console.log('⚠️ No kompetensi data found');
        setUsersWithUnverifiedKompetensi([]);
      }
    } catch (error) {
      console.error('Error fetching all kompetensi:', error);
      setUsersWithUnverifiedKompetensi([]);
    } finally {
      setIsLoadingAdminNotification(false);
    }
  }, [session]);

  // Proses data kompetensi untuk mendapatkan kompetensi yang BELUM DIVERIFIKASI
  const processUnverifiedKompetensi = useCallback((data) => {
    if (!data || data.length === 0) {
      setUsersWithUnverifiedKompetensi([]);
      return;
    }
    
    const unverifiedData = data.filter(item => !item.verified_by);
    
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
    
    const filtered = Object.values(grouped).filter(u => u.unverifiedKompetensi.length > 0);
    filtered.sort((a, b) => b.unverifiedKompetensi.length - a.unverifiedKompetensi.length);
    
    setUsersWithUnverifiedKompetensi(filtered);
    console.log('✅ Unverified kompetensi processed:', filtered.length, 'users');
  }, []);

  // Ambil semua pegawai untuk admin
  const fetchAllPegawaiForAdmin = useCallback(async () => {
    setIsLoadingPegawaiStatus(true);
    try {
      const token = session?.accessToken || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pegawai?all=true&is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setAllPegawaiData(result.data);
        await analyzePegawaiKompetensiWajib(result.data);
        console.log('✅ All pegawai data refreshed');
      }
    } catch (error) {
      console.error('Error fetching all pegawai:', error);
    } finally {
      setIsLoadingPegawaiStatus(false);
    }
  }, [session]);

  // Analisis kompetensi wajib pegawai (dengan filter jabatan/fungsi/peran masing-masing pegawai)
  const analyzePegawaiKompetensiWajib = useCallback(async (pegawaiList) => {
    try {
      const token = session?.accessToken || localStorage.getItem('token');
      const currentYear = new Date().getFullYear().toString();
      
      // Ambil semua kompetensi wajib
      const kompetensiWajibResult = await fetchKompetensiWajib(session, { tahun: currentYear });
      
      if (!kompetensiWajibResult.success || !kompetensiWajibResult.data) {
        console.log('Tidak ada kompetensi wajib');
        setPegawaiBelumLengkap([]);
        return;
      }
      
      const semuaKompetensiWajib = kompetensiWajibResult.data;
      
      // Untuk setiap pegawai, hitung kompetensi wajib yang relevan dengan jabatan/fungsi/perannya
      const pegawaiStatus = await Promise.all(pegawaiList.map(async (pegawai) => {
        try {
          // Filter kompetensi wajib berdasarkan jabatan/fungsi/peran pegawai ini
          const kompetensiWajibRelevan = filterKompetensiWajibByUser(
            semuaKompetensiWajib,
            pegawai.jabatan_id,
            pegawai.fungsi_id,
            pegawai.peran_id
          );
          
          const totalKompetensiWajib = kompetensiWajibRelevan.length;
          
          if (totalKompetensiWajib === 0) {
            return {
              ...pegawai,
              totalKompetensiWajib: 0,
              sudahDipenuhi: 0,
              belumDipenuhi: 0,
              persentase: 100,
              isComplete: true,
              kompetensiWajibList: []
            };
          }
          
          // Ambil kompetensi pegawai yang sudah dimiliki
          const kompetensiResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/userskompetensi/user/${pegawai.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const kompetensiResult = await kompetensiResponse.json();
          
          // Filter kompetensi yang valid (Lulus + hasil_verif Valid)
          const kompetensiValid = kompetensiResult.success && kompetensiResult.data
            ? kompetensiResult.data.filter(k => k.status === 'Lulus' && k.hasil_verif === 'Valid')
            : [];
          
          const kompetensiValidIds = new Set(kompetensiValid.map(k => k.id_kompetensi));
          
          // Hitung kompetensi wajib yang sudah dipenuhi (hanya dari yang relevan)
          const sudahDipenuhi = kompetensiWajibRelevan.filter(kw => kompetensiValidIds.has(kw.id_kompetensi)).length;
          const belumDipenuhi = totalKompetensiWajib - sudahDipenuhi;
          const persentase = totalKompetensiWajib > 0 ? Math.round((sudahDipenuhi / totalKompetensiWajib) * 100) : 100;
          
          return {
            ...pegawai,
            totalKompetensiWajib,
            sudahDipenuhi,
            belumDipenuhi,
            persentase,
            isComplete: sudahDipenuhi === totalKompetensiWajib,
            kompetensiWajibList: kompetensiWajibRelevan.map(kw => ({
              ...kw,
              sudahDipenuhi: kompetensiValidIds.has(kw.id_kompetensi)
            }))
          };
        } catch (err) {
          console.error(`Error for pegawai ${pegawai.id}:`, err);
          return {
            ...pegawai,
            totalKompetensiWajib: 0,
            sudahDipenuhi: 0,
            belumDipenuhi: 0,
            persentase: 0,
            isComplete: false,
            kompetensiWajibList: []
          };
        }
      }));
      
      // Filter pegawai yang belum 100% memenuhi kompetensi wajib (dan memiliki kompetensi wajib > 0)
      const belumLengkap = pegawaiStatus.filter(p => !p.isComplete && p.totalKompetensiWajib > 0);
      // Urutkan berdasarkan persentase terendah
      belumLengkap.sort((a, b) => a.persentase - b.persentase);
      
      setPegawaiBelumLengkap(belumLengkap);
      console.log('📊 Pegawai belum lengkap kompetensi wajib (berdasarkan filter jabatan/fungsi/peran):', belumLengkap.length);
      
    } catch (error) {
      console.error('Error analyzing pegawai kompetensi:', error);
    }
  }, [session, filterKompetensiWajibByUser]);

  // Fungsi refresh semua data (untuk digunakan saat tab aktif kembali)
  const refreshAllData = useCallback(async () => {
    console.log('🔄 REFRESHING ALL DATA (tab became active)...');
    await refreshDashboardData();
    await refreshUserKompetensiData();
    await refreshKompetensiWajibUser();
    await refreshAdminNotifications();
  }, [refreshDashboardData, refreshUserKompetensiData, refreshKompetensiWajibUser, refreshAdminNotifications]);

  const extractUserInfo = async (session) => {
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
      let jabatanId = null;
      let fungsi = '';
      let fungsiId = null;
      let peran = '';
      let peranId = null;
      
      // Ambil data pegawai lengkap dari API
      if (nip !== '-') {
        const pegawaiData = await fetchPegawaiByNip(nip);
        if (pegawaiData) {
          jabatan = pegawaiData.nama_jabatan || pegawaiData.jabatan || jabatan;
          jabatanId = pegawaiData.jabatan_id;
          fungsi = pegawaiData.nama_fungsi || '';
          fungsiId = pegawaiData.fungsi_id;
          peran = pegawaiData.nama_peran || '';
          peranId = pegawaiData.peran_id;
          console.log('📋 Pegawai data from API:', { jabatan, jabatanId, fungsi, fungsiId, peran, peranId });
        }
      }
      
      // Fallback ke token jika API tidak mengembalikan data
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
        jabatanId,
        fungsi,
        fungsiId,
        peran,
        peranId,
        role,
        roles: [...new Set(roles)],
        loginTime,
        department: 'Balai Besar Pengawasan Obat dan Makanan di Palangka Raya'
      });
      
      console.log('✅ User Info extracted:', { nip, name, role, jabatanId, fungsiId, peranId });
      
    } catch (error) {
      console.error('Error extracting user info:', error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await fetchDashboardStats(session);
      
      if (result.success) {
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

  // Hitung kompetensi wajib yang belum dipenuhi (setelah userKompetensi di-load) - MENGGUNAKAN KOMPETENSI YANG SUDAH DIFILTER
  useEffect(() => {
    if (kompetensiWajibFiltered.length > 0 && userKompetensi.length > 0) {
      const validUserKompetensi = userKompetensi.filter(item => 
        item.status === 'Lulus' && item.hasil_verif === 'Valid'
      );
      setKompetensiUserValid(validUserKompetensi);
      
      const userKompetensiIds = new Set(validUserKompetensi.map(k => k.id_kompetensi));
      
      const belumDipenuhi = kompetensiWajibFiltered.filter(kw => !userKompetensiIds.has(kw.id_kompetensi));
      setKompetensiWajibBelumDipenuhi(belumDipenuhi);
      
      console.log('📊 Kompetensi wajib BELUM dipenuhi (setelah filter):', belumDipenuhi.length);
    } else if (kompetensiWajibFiltered.length > 0 && userKompetensi.length === 0) {
      setKompetensiWajibBelumDipenuhi(kompetensiWajibFiltered);
      console.log('📊 Kompetensi wajib BELUM dipenuhi (user belum punya kompetensi):', kompetensiWajibFiltered.length);
    }
  }, [kompetensiWajibFiltered, userKompetensi]);

  // useEffect untuk initial load
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user) {
      // Ekstrak user info (async)
      const initUser = async () => {
        await extractUserInfo(session);
        await fetchMasterData();
        fetchDashboardData();
      };
      initUser();
    }
  }, [session]);

  // Panggil refreshUserKompetensiData setelah userInfo terisi
  useEffect(() => {
    if (userInfo.nip && userInfo.nip !== '-') {
      console.log('🔄 userInfo updated, fetching kompetensi for NIP:', userInfo.nip);
      refreshUserKompetensiData();
      refreshKompetensiWajibUser();
    }
  }, [userInfo.nip, refreshUserKompetensiData, refreshKompetensiWajibUser]);

  // Untuk admin, ambil semua data setelah userInfo terisi
  useEffect(() => {
    if ((userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya') && userInfo.nip && userInfo.nip !== '-') {
      fetchAllKompetensiData();
      fetchAllPegawaiForAdmin();
    }
  }, [userInfo.role, userInfo.nip, fetchAllKompetensiData, fetchAllPegawaiForAdmin]);

  // === SOLUSI UTAMA: Listener untuk visibilitychange (tab aktif kembali) ===
  useEffect(() => {
    // Handler ketika tab menjadi aktif kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible - refreshing all notifications...');
        
        // Refresh data utama
        refreshAllData();
        
        // Refresh tambahan untuk admin
        if (userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya') {
          fetchAllKompetensiData();
          fetchAllPegawaiForAdmin();
        } else {
          // Untuk user biasa, refresh kompetensi wajib dan user kompetensi
          refreshUserKompetensiData();
          refreshKompetensiWajibUser();
        }
      }
    };

    // Handler untuk online/offline (jika koneksi pulih)
    const handleOnline = () => {
      console.log('🌐 Connection restored - refreshing data...');
      refreshAllData();
    };

    // Handler untuk focus (ketika window di-focus kembali)
    const handleFocus = () => {
      console.log('🎯 Window focused - refreshing data...');
      refreshAllData();
    };

    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshAllData, userInfo.role, refreshUserKompetensiData, refreshKompetensiWajibUser, fetchAllKompetensiData, fetchAllPegawaiForAdmin]);

  // Optional: Interval refresh setiap 30 detik (jika diperlukan)
  useEffect(() => {
    // Refresh data setiap 30 detik untuk memastikan notifikasi selalu update
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('⏰ Interval refresh (30s) - updating notifications...');
        
        // Refresh notifikasi saja (lebih ringan)
        if (userInfo.role === 'admin' || userInfo.role === 'admin_tambun_raya') {
          fetchAllKompetensiData();
          fetchAllPegawaiForAdmin();
        } else {
          refreshUserKompetensiData();
          refreshKompetensiWajibUser();
        }
        
        // Refresh dashboard stats
        refreshDashboardData();
      }
    }, 30000); // 30 detik

    return () => clearInterval(intervalId);
  }, [userInfo.role, refreshUserKompetensiData, refreshKompetensiWajibUser, refreshDashboardData, fetchAllKompetensiData, fetchAllPegawaiForAdmin]);

  // Handler untuk membuka modal tambah kompetensi
  const handleTambahKompetensi = useCallback(async () => {
    let optionsData = formOptions;
    if (!optionsData) {
      try {
        const result = await fetchOptions(session);
        if (result.success) {
          optionsData = result.data;
          setFormOptions(result.data);
        } else {
          console.error('Gagal fetch options:', result.message);
          optionsData = { users: [], kompetensi: [], status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses'] };
          setFormOptions(optionsData);
        }
      } catch (error) {
        console.error('Error fetch options:', error);
        optionsData = { users: [], kompetensi: [], status_options: ['Lulus', 'Tidak Lulus', 'Dalam Proses'] };
        setFormOptions(optionsData);
      }
    }
    
    // Cari user yang sedang login dari daftar users berdasarkan NIP
    const normalizeNip = (nip) => String(nip || '').replace(/\s/g, '');
    const nip = userInfo.nip;
    const cleanNip = normalizeNip(nip);
    let foundUserId = null;
    if (cleanNip && nip !== '-' && optionsData?.users) {
      const found = optionsData.users.find(u => normalizeNip(u.nip) === cleanNip) ||
                    optionsData.users.find(u => normalizeNip(u.nip).includes(cleanNip) || cleanNip.includes(normalizeNip(u.nip)));
      if (found) {
        foundUserId = found.id;
        console.log('✅ Preselect user ditemukan:', found.nama, '- ID:', found.id);
      }
    }
    
    setFormPreselectUserId(foundUserId);
    setFormEditingData(null);
    setShowForm(true);
  }, [session, formOptions, userInfo.nip]);

  // Handler untuk close modal & refresh data
  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setFormEditingData(null);
    setFormPreselectUserId(null);
    // Refresh data kompetensi user
    refreshUserKompetensiData();
    // Refresh data kompetensi wajib
    refreshKompetensiWajibUser();
  }, [refreshUserKompetensiData, refreshKompetensiWajibUser]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setFormEditingData(null);
    setFormPreselectUserId(null);
  }, []);

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin_tambun_raya': return 'Admin Tambun Raya';
      case 'admin': return 'Administrator';
      case 'katim': return 'Ketua Tim';
      default: return 'Pegawai';
    }
  };

  const getStatusBadge = (status, hasilVerif) => {
    if (status === 'Lulus' && hasilVerif === 'Valid') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'Tidak Lulus' || hasilVerif === 'Tidak Valid') {
      return 'bg-red-100 text-red-800';
    } else if (hasilVerif === 'Perlu Revisi') {
      return 'bg-amber-100 text-amber-800';
    } else {
      return 'bg-amber-100 text-amber-800';
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

  const getProgressColor = (persentase) => {
    if (persentase >= 80) return 'bg-green-500';
    if (persentase >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const StatCard = ({ title, value, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
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

  // Data yang digunakan untuk stat card user biasa (menggunakan kompetensi yang sudah difilter)
  const kompetensiWajibTotal = kompetensiWajibFiltered.length;
  const kompetensiSudahDipenuhi = kompetensiWajibTotal - kompetensiWajibBelumDipenuhi.length;

  return (
    <DashboardLayout>
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero / Header Halaman */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-start justify-between gap-6 px-6 py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, {userInfo.name}!</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                  {getRoleDisplay(userInfo.role)}
                </span>
                <span>{userInfo.department}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                NIP: {userInfo.nip}{userInfo.jabatan && <> | {userInfo.jabatan}</>}
              </p>
              {(userInfo.fungsi || userInfo.peran) && (
                <p className="mt-0.5 text-sm text-gray-400">
                  {userInfo.fungsi && <>Fungsi: {userInfo.fungsi}</>}
                  {userInfo.fungsi && userInfo.peran && <> • </>}
                  {userInfo.peran && <>Peran: {userInfo.peran}</>}
                </p>
              )}
            </div>
            <div className="shrink-0 rounded-lg bg-gray-50 border border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500">Login Terakhir</p>
              <p className="mt-1 font-semibold text-gray-900">{userInfo.loginTime}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8 max-w-[1600px] mx-auto">

          {/* NOTIFIKASI UNTUK ADMIN: PEGAWAI YANG BELUM 100% MEMENUHI KOMPETENSI WAJIB */}
          {isAdmin && pegawaiBelumLengkap.length > 0 && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50">
              <div className="px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-red-800">
                      Pegawai yang belum 100% memenuhi kompetensi wajib
                    </h2>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      {pegawaiBelumLengkap.length} pegawai
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-red-700/80">
                    {pegawaiBelumLengkap.length} pegawai belum menyelesaikan 100% kompetensi wajib yang relevan dengan jabatan/fungsinya tahun {new Date().getFullYear()}
                  </p>

                  {isLoadingPegawaiStatus ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-200 border-t-red-600"></div>
                      <span className="ml-3 text-sm text-red-700">Memuat data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {pegawaiBelumLengkap.slice(0, 5).map((pegawai, idx) => (
                          <div key={pegawai.nip || idx} className="bg-white rounded-lg border border-red-100 p-4">
                            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900">{pegawai.nama}</span>
                                <span className="text-xs text-gray-500 ml-2">NIP: {pegawai.nip}</span>
                                {pegawai.nama_fungsi && (
                                  <span className="text-xs text-gray-500 ml-2">• {pegawai.nama_fungsi}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                  {pegawai.persentase}%
                                </span>
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                  {pegawai.sudahDipenuhi}/{pegawai.totalKompetensiWajib}
                                </span>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${getProgressColor(pegawai.persentase)} h-2 rounded-full`} 
                                  style={{ width: `${pegawai.persentase}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Daftar kompetensi wajib yang belum dipenuhi */}
                            <div className="space-y-1 mt-2">
                              {pegawai.kompetensiWajibList?.filter(k => !k.sudahDipenuhi).slice(0, 3).map((kom, kidx) => (
                                <div key={kidx} className="text-sm text-gray-600 flex items-center gap-2">
                                  <span className="font-mono text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                                    {kom.kode_kompetensi}
                                  </span>
                                  <span className="text-xs">{kom.nama_kompetensi?.substring(0, 50)}</span>
                                </div>
                              ))}
                              {pegawai.kompetensiWajibList?.filter(k => !k.sudahDipenuhi).length > 3 && (
                                <p className="text-xs text-gray-400">
                                  +{pegawai.kompetensiWajibList.filter(k => !k.sudahDipenuhi).length - 3} kompetensi lainnya
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-3 flex gap-4">
                              <Link 
                                href={`/users_kompetensi?nip=${pegawai.nip}`} 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Lihat semua kompetensi →
                              </Link>
                              <Link 
                                href={`/pelatihan`} 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Rekomendasi Pelatihan
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      {pegawaiBelumLengkap.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          +{pegawaiBelumLengkap.length - 5} pegawai lainnya
                        </p>
                      )}
                      <div className="mt-4 pt-3 border-t border-red-100 text-right">
                        <Link 
                          href="/users_kompetensi" 
                          className="inline-block bg-white text-red-700 border border-red-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Kelola Semua Pegawai →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI KOMPETENSI WAJIB YANG HARUS DIPENUHI - UNTUK USER BIASA (SUDAH DIFILTER) */}
          {!isAdmin && kompetensiWajibBelumDipenuhi.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50">
              <div className="px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-amber-900">
                      Kompetensi wajib yang harus Anda penuhi
                    </h2>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {kompetensiWajibBelumDipenuhi.length} kompetensi
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-amber-800/80">
                    Berdasarkan jabatan <strong>{userInfo.jabatan}</strong>
                    {userInfo.fungsi && <> dan fungsi <strong>{userInfo.fungsi}</strong></>}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 mt-3">
                    {kompetensiWajibBelumDipenuhi.slice(0, 5).map((item, idx) => (
                      <div key={item.id || idx} className="bg-white rounded-lg border border-amber-100 px-4 py-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                              {item.kode_kompetensi}
                            </span>
                            <span className="ml-2 text-sm text-gray-700">{item.nama_kompetensi || item.kompetensi_original}</span>
                          </div>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                            WAJIB
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">
                          Fungsi: {item.nama_fungsi || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {kompetensiWajibBelumDipenuhi.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{kompetensiWajibBelumDipenuhi.length - 5} kompetensi wajib lainnya
                    </p>
                  )}
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      onClick={handleTambahKompetensi}
                      className="inline-block text-sm bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                      + Tambah/Upload Kompetensi
                    </button>
                    <Link 
                      href="/pelatihan" 
                      className="inline-block text-sm text-blue-600 border border-blue-200 bg-white px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
                    >
                      Cari Pelatihan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI SEMUA KOMPETENSI WAJIB SUDAH TERPENUHI */}
          {!isAdmin && kompetensiWajibFiltered.length > 0 && kompetensiWajibBelumDipenuhi.length === 0 && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50">
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-green-800">
                      Selamat! Semua Kompetensi Wajib Terpenuhi
                    </h2>
                    <p className="mt-1 text-sm text-green-700/80">
                      Anda telah memenuhi semua kompetensi wajib yang relevan dengan jabatan {userInfo.jabatan}
                      {userInfo.fungsi && <> dan fungsi {userInfo.fungsi}</>} untuk tahun {new Date().getFullYear()}.
                    </p>
                  </div>
                  <Link 
                    href="/users_kompetensi" 
                    className="shrink-0 inline-block text-sm bg-white text-green-700 border border-green-200 px-4 py-2 rounded-md font-medium hover:bg-green-100/50 transition-colors"
                  >
                    Lihat Semua Kompetensi →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI UNTUK ADMIN: KOMPETENSI YANG HARUS DIVERIFIKASI */}
          {isAdmin && usersWithUnverifiedKompetensi.length > 0 && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50">
              <div className="px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-blue-900">
                      Kompetensi yang harus diverifikasi
                    </h2>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {usersWithUnverifiedKompetensi.reduce((sum, u) => sum + u.unverifiedKompetensi.length, 0)} kompetensi
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-blue-800/80">
                    Berikut adalah daftar kompetensi yang <strong>belum diverifikasi</strong> dan perlu segera diverifikasi.
                  </p>

                  {isLoadingAdminNotification ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
                      <span className="ml-3 text-sm text-blue-800">Memuat data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {usersWithUnverifiedKompetensi.map((user, idx) => (
                          <div key={user.nip || idx} className="bg-white rounded-lg border border-blue-100 p-4">
                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900">{user.nama}</span>
                                <span className="text-xs text-gray-500 ml-2">NIP: {user.nip}</span>
                                {user.jabatan !== '-' && (
                                  <span className="text-xs text-gray-500 ml-2">• {user.jabatan}</span>
                                )}
                              </div>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                {user.unverifiedKompetensi.length} kompetensi
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {user.unverifiedKompetensi.slice(0, 3).map((kom, kidx) => (
                                <div key={kidx} className="text-sm text-gray-700 flex justify-between items-center flex-wrap gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-mono text-xs bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">
                                      {kom.kode}
                                    </span>
                                    <span className="ml-2">{kom.nama}</span>
                                  </div>
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    Menunggu
                                  </span>
                                </div>
                              ))}
                              {user.unverifiedKompetensi.length > 3 && (
                                <p className="text-xs text-gray-400">
                                  +{user.unverifiedKompetensi.length - 3} kompetensi lainnya
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex gap-4">
                              <Link 
                                href={`/users_kompetensi?nip=${user.nip}`} 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Lihat semua kompetensi user →
                              </Link>
                              <Link 
                                href={`/users_kompetensi/verifikasi?nip=${user.nip}`} 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Verifikasi sekarang →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-blue-100 text-right">
                        <Link 
                          href="/users_kompetensi" 
                          className="inline-block bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
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

          {/* Pemberitahuan Undangan Pelatihan — untuk siapa pun yang punya undangan pending,
              termasuk katim/admin yang mengundang diri sendiri sebagai peserta */}
          {stats.pelatihan?.undanganPending > 0 && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50">
              <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 text-sm font-medium text-blue-900">
                  Anda memiliki {stats.pelatihan.undanganPending} undangan pelatihan yang perlu dikonfirmasi
                </p>
                <Link href="/pelatihan" className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-900">
                  Lihat undangan sekarang →
                </Link>
              </div>
            </div>
          )}

          {/* Profile Kompetensi Section - Hanya untuk user biasa */}
          {!isAdmin && (
            <div className="mb-8">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900">Profil Kompetensi Anda</h2>
                  {kompetensiWajibFiltered.length > 0 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {Math.round((kompetensiSudahDipenuhi / kompetensiWajibFiltered.length) * 100)}% terpenuhi
                    </span>
                  )}
                </div>
                
                <div className="p-6">
                  {/* Statistik Ringkas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">{kompetensiWajibFiltered.length}</p>
                      <p className="text-xs text-gray-600">Kompetensi Wajib</p>
                    </div>
                    <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{kompetensiSudahDipenuhi}</p>
                      <p className="text-xs text-gray-600">Sudah Dipenuhi</p>
                    </div>
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
                      <p className="text-2xl font-bold text-red-700">{kompetensiWajibBelumDipenuhi.length}</p>
                      <p className="text-xs text-gray-600">Belum Dipenuhi</p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{userKompetensiStats.dalamProses}</p>
                      <p className="text-xs text-gray-600">Dalam Proses</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">{userKompetensiStats.total}</p>
                      <p className="text-xs text-gray-600">Total Kompetensi</p>
                    </div>
                  </div>

                  {/* Progress Bar Kompetensi Wajib */}
                  {kompetensiWajibFiltered.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress Pemenuhan Kompetensi Wajib</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {kompetensiWajibFiltered.length > 0 ? Math.round((kompetensiSudahDipenuhi / kompetensiWajibFiltered.length) * 100) : 100}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${kompetensiWajibFiltered.length > 0 ? (kompetensiSudahDipenuhi / kompetensiWajibFiltered.length) * 100 : 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Berdasarkan jabatan: <strong>{userInfo.jabatan}</strong>
                        {userInfo.fungsi && <> • Fungsi: <strong>{userInfo.fungsi}</strong></>}
                      </p>
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
                              <button
                                onClick={handleTambahKompetensi}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                + Tambah
                              </button>
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
                                  <p className="text-xs text-amber-700 mt-2">Catatan: {item.catatan}</p>
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
                          <button
                            onClick={handleTambahKompetensi}
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Tambah Kompetensi
                          </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Pegawai"
                value={allPegawaiData.length}
                subtitle="Seluruh pegawai aktif"
              />
              <StatCard
                title="Belum 100% Kompetensi Wajib"
                value={pegawaiBelumLengkap.length}
                subtitle="Perlu pendampingan"
              />
              <StatCard
                title="Menunggu Verifikasi"
                value={usersWithUnverifiedKompetensi.reduce((sum, u) => sum + u.unverifiedKompetensi.length, 0)}
                subtitle="Perlu segera diverifikasi"
              />
              <StatCard
                title="Jadwal Pelatihan"
                value={stats.pelatihan.totalJadwal}
                subtitle={`${stats.pelatihan.berlangsung} berlangsung`}
              />
            </div>
          )}

          {/* Stat Cards Grid - Untuk user biasa (menggunakan data yang sudah difilter) */}
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Kompetensi Wajib"
                value={kompetensiWajibFiltered.length}
                subtitle={`${kompetensiSudahDipenuhi} dipenuhi`}
              />
              <StatCard
                title="Sudah Dipenuhi"
                value={kompetensiSudahDipenuhi}
                subtitle="Dari kompetensi wajib"
              />
              <StatCard
                title="Belum Dipenuhi"
                value={kompetensiWajibBelumDipenuhi.length}
                subtitle="Perlu segera dipenuhi"
              />
              <StatCard
                title="Undangan Pelatihan"
                value={stats.pelatihan.undanganPending || 0}
                subtitle="Menunggu konfirmasi"
              />
            </div>
          )}

          {/* Charts Row 1 - Hanya untuk user biasa */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Kompetensi Status Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Status Kompetensi</h3>
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
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Tren Pelatihan per Bulan</h3>
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
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Master Pelatihan per Jenis</h3>
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
                      <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Kompetensi by Fungsi */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Kompetensi per Fungsi</h3>
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
                      <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pelatihan Status Radial */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Status Pelatihan</h3>
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

      {/* Modal Tambah Kompetensi */}
      {showForm && formOptions && (
        <UserskompetensiForm
          show={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          editingData={formEditingData}
          options={formOptions}
          userRoles={{ isAdmin: isAdmin, isKatim: userInfo.role === 'katim' }}
          session={session}
          preselectUserId={formPreselectUserId}
        />
      )}
    </DashboardLayout>
  );
};

export default Home;