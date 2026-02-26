// pages/home.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { fetchDashboardStats } from '../components/dashboard/api/dashboardApi';
import { fetchUserKompetensi } from '../components/userskompetensi/api/userKompetensiApi';
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user) {
      extractUserInfo(session);
      fetchDashboardData();
    }
  }, [session]);

  // Panggil fetchUserKompetensiData setelah userInfo terisi
  useEffect(() => {
    if (userInfo.nip && userInfo.nip !== '-') {
      console.log('🔄 userInfo updated, fetching kompetensi for NIP:', userInfo.nip);
      fetchUserKompetensiData();
    }
  }, [userInfo.nip]);

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
      console.log('📡 Fetching user kompetensi with NIP:', userInfo.nip);
      
      const result = await fetchUserKompetensi(session, { all: true });
      
      console.log('📥 Raw result:', result);
      
      if (result.success) {
        console.log('📊 All kompetensi data length:', result.data?.length || 0);
        
        if (result.data && result.data.length > 0) {
          console.log('📊 Sample data:', result.data[0]);
        }
        
        // Filter hanya data user yang sedang login
        const userNip = userInfo.nip;
        console.log('🔍 Filtering for NIP:', userNip);
        
        const userData = result.data.filter(item => {
          const match = item.user_nip === userNip;
          console.log(`Comparing ${item.user_nip} with ${userNip}: ${match ? 'MATCH' : 'NO MATCH'}`);
          return match;
        });
        
        console.log('📊 Filtered user data length:', userData.length);
        
        setUserKompetensi(userData);
        
        // Hitung statistik
        const total = userData.length;
        const lulus = userData.filter(item => item.status === 'Lulus' && item.hasil_verif === 'Valid').length;
        const tidakLulus = userData.filter(item => item.status === 'Tidak Lulus' || item.hasil_verif === 'Tidak Valid').length;
        const dalamProses = userData.filter(item => !item.verified_by).length;
        const perluRevisi = userData.filter(item => item.hasil_verif === 'Perlu Revisi').length;
        
        console.log('📊 Stats:', { total, lulus, tidakLulus, dalamProses, perluRevisi });
        
        setUserKompetensiStats({
          total,
          lulus,
          tidakLulus,
          dalamProses,
          perluRevisi,
          persentase: total > 0 ? Math.round((lulus / total) * 100) : 0
        });
      } else {
        console.error('Failed to fetch user kompetensi:', result.message);
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

  return (
    <DashboardLayout>
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

          {/* Welcome Message untuk User Biasa */}
          {!userInfo.role.includes('admin') && !userInfo.role.includes('katim') && stats.pelatihan.undanganPending > 0 && (
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

          {/* Profile Kompetensi Section */}
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
                    <p className="text-2xl font-bold text-blue-600">{userKompetensiStats.total}</p>
                    <p className="text-xs text-gray-600">Total Kompetensi</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{userKompetensiStats.lulus}</p>
                    <p className="text-xs text-gray-600">Lulus (Valid)</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{userKompetensiStats.dalamProses}</p>
                    <p className="text-xs text-gray-600">Dalam Proses</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{userKompetensiStats.perluRevisi}</p>
                    <p className="text-xs text-gray-600">Perlu Revisi</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{userKompetensiStats.tidakLulus}</p>
                    <p className="text-xs text-gray-600">Tidak Lulus</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Tingkat Kelulusan</span>
                    <span className="text-sm font-semibold text-gray-900">{userKompetensiStats.persentase}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${userKompetensiStats.persentase}%` }}
                    ></div>
                  </div>
                </div>

                {/* Daftar Kompetensi */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Daftar Kompetensi</h3>
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
                              <div className="flex items-center mb-2">
                                <span className="text-sm font-semibold text-gray-900 mr-2">{item.kode_kompetensi}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(item.status, item.hasil_verif)}`}>
                                  {getStatusText(item)}
                                </span>
                              </div>
                              <p className="text-base font-medium text-gray-800 mb-1">{item.nama_kompetensi}</p>
                              <div className="flex items-center text-xs text-gray-500 space-x-3">
                                <span>Tanggal: {item.tanggal_dipenuhi}</span>
                                {item.nilai && <span>Nilai: {item.nilai}</span>}
                                {item.verified_by_nama && (
                                  <span>Verifikator: {item.verified_by_nama}</span>
                                )}
                              </div>
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

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Kompetensi"
              value={stats.kompetensi.total}
              icon="🎓"
              color="bg-blue-100 text-blue-600"
              subtitle={`${stats.kompetensi.lulus} Lulus • ${stats.kompetensi.dalamProses} Proses`}
            />
            <StatCard
              title="Kompetensi Valid"
              value={stats.kompetensi.lulus}
              icon="✅"
              color="bg-green-100 text-green-600"
              subtitle={`${stats.kompetensi.persentase}% dari total`}
            />
            <StatCard
              title="Jadwal Pelatihan"
              value={stats.pelatihan.totalJadwal}
              icon="📅"
              color="bg-purple-100 text-purple-600"
              subtitle={`${stats.pelatihan.berlangsung} Berlangsung • ${stats.pelatihan.selesai} Selesai`}
            />
            <StatCard
              title="Total Peserta"
              value={stats.pelatihan.totalPeserta}
              icon="👥"
              color="bg-orange-100 text-orange-600"
              subtitle={`${stats.pelatihan.totalHadir} Hadir (${stats.pelatihan.totalPeserta > 0 ? Math.round((stats.pelatihan.totalHadir / stats.pelatihan.totalPeserta) * 100) : 0}%)`}
            />
          </div>

          {/* Charts Row 1 */}
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

          {/* Charts Row 2 */}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;