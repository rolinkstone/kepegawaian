// pages/home.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

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

  const [isLoading, setIsLoading] = useState(true);

  // Authentication effect
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  // Get user data from session
  useEffect(() => {
    if (session?.user) {
      extractUserInfo(session);
    }
  }, [session]);

  const extractUserInfo = (session) => {
    try {
      setIsLoading(true);
      
      const user = session.user;
      let tokenPayload = {};
      
      // Parse token jika ada
      if (session.accessToken) {
        try {
          const base64Payload = session.accessToken.split('.')[1];
          const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
          tokenPayload = JSON.parse(decodedPayload);
          console.log("📊 Token Payload:", tokenPayload);
        } catch (e) {
          console.log("Cannot parse token");
        }
      }

      // 1. Username - dari token atau session
      const username = tokenPayload.preferred_username || 
                      user.preferred_username || 
                      user.name || 
                      'User';
      
      // 2. Name
      const name = tokenPayload.name || user.name || username;
      
      // 3. Email
      const email = tokenPayload.email || user.email || '-';
      
      // 4. NIP - cari dari berbagai sumber
      let nip = '-';
      if (tokenPayload.preferred_username && /^\d+$/.test(tokenPayload.preferred_username)) {
        nip = tokenPayload.preferred_username;
      } else if (tokenPayload.nip) {
        nip = tokenPayload.nip;
      } else if (user.nip) {
        nip = user.nip;
      } else {
        // Fallback: ambil angka dari username
        const numericPart = username.match(/\d+/);
        nip = numericPart ? numericPart[0] : username;
      }
      
      // 5. Jabatan
      let jabatan = 'Pegawai';
      if (tokenPayload.jabatan) {
        jabatan = tokenPayload.jabatan;
      } else if (tokenPayload.position) {
        jabatan = tokenPayload.position;
      } else if (user.jabatan) {
        jabatan = user.jabatan;
      }
      
      // 6. Role - deteksi role
      let role = 'user';
      const roles = [];
      
      // Dari token realm_access
      if (tokenPayload.realm_access?.roles) {
        roles.push(...tokenPayload.realm_access.roles);
      }
      
      // Dari token resource_access
      if (tokenPayload.resource_access) {
        Object.values(tokenPayload.resource_access).forEach(client => {
          if (client?.roles) roles.push(...client.roles);
        });
      }
      
      // Dari session user
      if (user.roles) {
        if (Array.isArray(user.roles)) {
          roles.push(...user.roles);
        } else {
          roles.push(user.roles);
        }
      }
      
      // Deteksi role spesifik
      if (roles.includes('admin_tambun_raya')) {
        role = 'admin_tambun_raya';
      } else if (roles.includes('admin')) {
        role = 'admin';
      } else if (roles.includes('katim')) {
        role = 'katim';
      } else if (user.role) {
        role = user.role;
      }
      
      // 7. Login time
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
        roles: [...new Set(roles)], // Hapus duplikasi
        loginTime,
        department: 'Balai Besar Pengawasan Obat dan Makanan di Palangka Raya'
      });
      
      console.log("✅ User Info:", {
        username,
        name,
        nip,
        jabatan,
        role,
        roles
      });
      
    } catch (error) {
      console.error('Error extracting user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin_tambun_raya':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'katim':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin_tambun_raya':
        return 'Admin Tambun Raya';
      case 'admin':
        return 'Administrator';
      case 'katim':
        return 'Ketua Tim';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin_tambun_raya':
        return '👑';
      case 'admin':
        return '⚡';
      case 'katim':
        return '👥';
      default:
        return '👤';
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
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
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang di Sistem Nominatif Kegiatan dan Perjalanan Dinas
          </p>
        </div>

        {/* User Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header dengan role */}
            <div className={`px-6 py-4 ${
              userInfo.role === 'admin_tambun_raya' ? 'bg-purple-600' :
              userInfo.role === 'admin' ? 'bg-red-600' :
              userInfo.role === 'katim' ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm opacity-90">Informasi Pengguna</p>
                  <h2 className="text-white text-xl font-semibold mt-1">
                    {userInfo.name}
                  </h2>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-white font-medium">
                    {getRoleIcon(userInfo.role)} {getRoleDisplay(userInfo.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Avatar dan Info Ringkas */}
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  userInfo.role === 'admin_tambun_raya' ? 'bg-purple-500' :
                  userInfo.role === 'admin' ? 'bg-red-500' :
                  userInfo.role === 'katim' ? 'bg-blue-500' : 'bg-gray-500'
                }`}>
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900">{userInfo.name}</p>
                  <p className="text-sm text-gray-600">{userInfo.email}</p>
                </div>
              </div>

              {/* Detail Informasi */}
              <div className="space-y-4">
                {/* NIP */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">NIP</span>
                  <span className="font-mono font-medium text-gray-900">{userInfo.nip}</span>
                </div>

                {/* Jabatan */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">Jabatan</span>
                  <span className="font-medium text-gray-900">{userInfo.jabatan}</span>
                </div>

                {/* Unit Kerja */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">Unit Kerja</span>
                  <span className="text-gray-900">{userInfo.department}</span>
                </div>

                {/* Role Badge */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">Hak Akses</span>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userInfo.role)}`}>
                      {getRoleDisplay(userInfo.role)}
                    </span>
                    
                    {/* Tampilkan roles tambahan jika ada */}
                    {userInfo.roles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {userInfo.roles.map((r, idx) => (
                          <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Login Time */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">Login</span>
                  <span className="text-sm text-gray-600">{userInfo.loginTime}</span>
                </div>

                {/* Username */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 w-24">Username</span>
                  <span className="text-sm font-mono text-gray-600">{userInfo.username}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Lihat Profil
                </button>
                <button
                  onClick={() => router.push('/api/auth/signout')}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Sistem Nominatif Kegiatan v1.0 • {userInfo.name} • {userInfo.nip}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;