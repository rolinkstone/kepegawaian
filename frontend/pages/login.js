// pages/login.js
import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const canvasRef = useRef(null);
  const router = useRouter();
  const { error: queryError } = router.query;

  useEffect(() => {
    if (queryError) {
      switch (queryError) {
        case 'AccessDenied':
          setError('Akses ditolak. Periksa kredensial Anda atau hubungi administrator.');
          break;
        case 'Configuration':
          setError('Terdapat masalah dengan konfigurasi server.');
          break;
        case 'Verification':
          setError('Link verifikasi tidak valid atau telah kadaluarsa.');
          break;
        default:
          setError('Terjadi kesalahan saat autentikasi. Silakan coba lagi.');
      }
    }
  }, [queryError]);

  useEffect(() => {
    // Animated Background Particles
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let animationFrameId;

    class Particle {
      constructor(x, y, size, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.alpha = 0.3 + Math.random() * 0.7;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;

        this.alpha = 0.3 + 0.4 * Math.sin(Date.now() * 0.001 + this.x * 0.01);
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function createParticles() {
      particles = [];
      const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 20000));
      const colors = [
        'rgba(59, 130, 246, 0.6)', // blue
        'rgba(139, 92, 246, 0.6)', // violet
        'rgba(6, 182, 212, 0.6)', // cyan
        'rgba(245, 158, 11, 0.6)', // amber
      ];

      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 3 + 1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speedX = (Math.random() - 0.5) * 0.5;
        const speedY = (Math.random() - 0.5) * 0.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, size, speedX, speedY, color));
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#1e1b4b');
      gradient.addColorStop(1, '#312e81');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      drawConnections();
      animationFrameId = requestAnimationFrame(animate);
    }

    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    }

    createParticles();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleKeycloakLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signIn('keycloak', {
        callbackUrl: '/',
        redirect: true
      });
    } catch (err) {
      setError('Gagal memulai login SSO. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | TAMBUN RAYA</title>
        <meta name="description" content="Sistem Pengelolaan Talenta Aparatur BBPOM di Palangka Raya" />
      </Head>

      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
      />

      {/* Floating Geometric Elements */}
      <div className="fixed inset-0 z-1 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute border border-white/5 rounded-3xl"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 10}%`,
              animation: `float ${8 + i * 2}s ease-in-out infinite ${i * 0.5}s`,
              transform: `rotate(${i * 15}deg)`,
              background: `linear-gradient(135deg, rgba(59, 130, 246, ${0.02 + i * 0.01}), rgba(139, 92, 246, ${0.02 + i * 0.01}))`,
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 z-1 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[100px] animate-spin-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-[120px] animate-spin-slow-reverse" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        {/* Main Content Container */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Branding and Info */}
            <div className="flex flex-col justify-center p-8 lg:p-12 backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/5 to-transparent rounded-3xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-white/20">
              {/* Logo and Brand */}
              <div className="mb-12 transform hover:scale-[1.02] transition-transform duration-500">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">TAMBUN RAYA</h1>
                    <div className="text-blue-200 text-base font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full inline-block border border-white/20">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                        BBPOM di Palangka Raya
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <div className="mb-10">
                  <p className="text-3xl font-light text-white mb-3 leading-tight">
                    <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">T</span>alenta{" "}
                    <span className="font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">A</span>paratur{" "}
                    <span className="font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">M</span>umpuni
                  </p>
                  <p className="text-xl text-cyan-100/90 font-medium">
                    <span className="relative">
                      Berintegritas dan Unggul
                      <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-8 mb-14">
                {[
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    title: "Sistem Terintegrasi",
                    description: "Pengelolaan talenta aparatur secara menyeluruh dan terpadu",
                    color: "from-blue-500/20 to-blue-600/20",
                    iconColor: "text-blue-300"
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    title: "Pengembangan Karir",
                    description: "Monitoring dan pengembangan kompetensi berkelanjutan",
                    color: "from-emerald-500/20 to-teal-600/20",
                    iconColor: "text-emerald-300"
                  },
                  {
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: "Akuntabilitas",
                    description: "Transparansi dan pertanggungjawaban kinerja",
                    color: "from-amber-500/20 to-amber-600/20",
                    iconColor: "text-amber-300"
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-5 group transform hover:-translate-x-1 transition-all duration-300"
                  >
                    <div className={`relative flex-shrink-0`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-xl blur-sm group-hover:blur-md transition-all duration-300`} />
                      <div className="relative w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
                        <div className={feature.iconColor}>
                          {feature.icon}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-300 group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300/80 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 via-violet-600/30 to-cyan-500/30 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
              <div className="relative p-8 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white/90 italic text-xl leading-relaxed">
                  "Kompetensi dan integritas adalah pondasi utama dalam membangun pelayanan publik yang berkualitas dan berkelanjutan."
                </p>
                <div className="mt-6 flex items-center justify-end">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-grow"></div>
                  <span className="text-sm text-white/60 px-4">— Semangat Kepegawaian</span>
                </div>
              </div>
            </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex flex-col justify-center">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-glow"></div>
                
                {/* Main Form Card */}
                <div className="relative bg-gradient-to-br from-white via-white/95 to-white/90 rounded-3xl shadow-2xl overflow-hidden border border-white/30">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500"></div>
                  <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-6 left-6 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-xl"></div>

                  {/* Login Header */}
                  <div className="p-10 border-b border-gray-100/50">
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-3">
                        Selamat Datang
                      </h2>
                      <p className="text-gray-600 text-lg">Akses sistem dengan kredensial SSO Anda</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="mb-8 bg-gradient-to-r from-red-50/90 to-red-50/50 border border-red-200/50 rounded-2xl p-5 backdrop-blur-sm animate-fade-in">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Login Content */}
                  <div className="p-10">
                    {/* SSO Login Button */}
                    <div className="mb-12">
                      <button
                        onClick={handleKeycloakLogin}
                        disabled={isLoading}
                        className="relative w-full flex items-center justify-center px-10 py-6 border-0 rounded-2xl text-base font-semibold text-white overflow-hidden group"
                      >
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 group-hover:from-slate-900 group-hover:via-slate-800 group-hover:to-slate-900 transition-all duration-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 animate-shimmer"></div>
                        
                        {/* Button Content */}
                        <div className="relative flex items-center justify-center space-x-5">
                          {isLoading ? (
                            <>
                              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="text-xl font-semibold">Mengarahkan ke Portal SSO</span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <div className="text-2xl font-bold mb-1">Login dengan SSO</div>
                                <div className="text-sm font-normal opacity-90">Akun terverifikasi BBPOM Palangka Raya</div>
                              </div>
                              <svg className="w-6 h-6 opacity-80 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      {[
                        { text: 'SSL Encrypted', color: 'emerald', icon: '🔒' },
                        { text: 'SSO Authentication', color: 'blue', icon: '🔑' },
                      ].map((badge, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-br from-white to-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <span className="text-lg">{badge.icon}</span>
                          <span className={`font-medium text-sm text-slate-700 group-hover:text-slate-900`}>
                            {badge.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Login Footer */}
                  <div className="bg-gradient-to-r from-slate-50/80 to-gray-100/80 px-10 py-8 border-t border-gray-200/50">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
                      <div className="flex items-center space-x-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700">TAMBUN RAYA v1.0</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-8">
                        <button 
                          onClick={() => setShowModal(true)}
                          className="relative text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors group"
                        >
                          <span className="relative z-10">Tentang Sistem</span>
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                        </button>
                        <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                        <a 
                            href="/docs/panduan.pdf" 
                            download="Panduan-Aplikasi-SIPEG.pdf"
                            className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium hover:underline"
                          >
                            📥 Download Panduan
                          </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm px-6 py-3 rounded-full mb-5 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 group">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-300"></span>
                  </div>
                  <span className="text-white font-medium group-hover:text-cyan-100 transition-colors">Sistem Aktif • Terverifikasi • Real-time</span>
                </div>
                <p className="text-sm text-white/70 mb-2">
                  © {new Date().getFullYear()} TAMBUN RAYA. Hak cipta dilindungi undang-undang.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-white/50">
                  <span className="hover:text-white/80 transition-colors cursor-pointer hover:underline">Badan POM RI</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <span className="hover:text-white/80 transition-colors cursor-pointer hover:underline">BBPOM di Palangka Raya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tentang TAMBUN RAYA */}
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop with blur */}
    <div 
      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    />
    
    {/* Modal Container - Lebih Kompak */}
    <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
      {/* Modal Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/95 to-indigo-900/95" />
      
      {/* Animated Orbs in Modal */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-r from-violet-500/15 to-purple-500/15 rounded-full blur-2xl animate-pulse-slow delay-1000" />
      
      {/* Modal Content */}
      <div className="relative z-10 h-full overflow-y-auto">
        {/* Modal Header - Lebih Kompak */}
        <div className="sticky top-0 z-20 p-6 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-transparent backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-slate-900 flex items-center justify-center shadow-md animate-pulse">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tentang Sistem</h2>
                <p className="text-blue-200 text-xs font-medium">TAMBUN RAYA BBPOM di Palangka Raya</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body - Ukuran Teks Dikecilkan */}
        <div className="p-6 space-y-6">
          {/* Main Title Section */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                TAMBUN RAYA
              </span>
            </h1>
            
            {/* Quote Container */}
            <div className="relative max-w-2xl mx-auto">
              {/* Background Glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-cyan-500/20 rounded-xl blur-lg opacity-50" />
              
              {/* Main Quote */}
              <div className="relative p-6 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <p className="text-lg font-semibold text-white text-center leading-relaxed mb-2">
                  <span className="font-bold text-blue-300">T</span>
                  <span className="text-white">alenta </span>
                  
                  <span className="font-bold text-violet-300">A</span>
                  <span className="text-white">paratur </span>
                  
                  <span className="font-bold text-emerald-300">M</span>
                  <span className="text-white">umpuni, </span>
                  
                  <span className="font-bold text-amber-300">B</span>
                  <span className="text-white">erintegritas dan </span>
                  
                  <span className="font-bold text-cyan-300">UN</span>
                  <span className="text-white">ggul</span>
                </p>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-base text-center text-blue-200 font-medium">
                    BBPOM di Palangka RAYA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acronym Explanation - Lebih Kompak */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Makna TAMBUN RAYA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  letter: "T",
                  word: "Talenta",
                  description: "Pengelolaan potensi dan kompetensi aparatur",
                  color: "from-blue-500 to-blue-600",
                  icon: "💼"
                },
                {
                  letter: "A",
                  word: "Aparatur",
                  description: "Sumber daya manusia organisasi yang profesional",
                  color: "from-violet-500 to-violet-600",
                  icon: "👥"
                },
                {
                  letter: "M",
                  word: "Mumpuni",
                  description: "Memiliki kompetensi dan kapabilitas memadai",
                  color: "from-emerald-500 to-emerald-600",
                  icon: "⭐"
                },
                {
                  letter: "B",
                  word: "Berintegritas",
                  description: "Memiliki integritas dan moral yang tinggi",
                  color: "from-amber-500 to-amber-600",
                  icon: "🛡️"
                },
                {
                  letter: "UN",
                  word: "Unggul",
                  description: "Berkinerja unggul dan berdaya saing",
                  color: "from-cyan-500 to-cyan-600",
                  icon: "🚀"
                },
                {
                  letter: "RAYA",
                  word: "BBPOM Palangka Raya",
                  description: "Badan Pengawas Obat dan Makanan",
                  color: "from-purple-500 to-purple-600",
                  icon: "🏛️"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl hover:transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  <div className="relative p-4 backdrop-blur-sm border border-white/10">
                    <div className="flex items-start mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mr-3 shadow-md flex-shrink-0`}>
                        <span className="text-lg text-white font-bold">{item.letter}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.word}</h4>
                        <div className="text-lg mt-1">{item.icon}</div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Description - Lebih Singkat */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Deskripsi Sistem</h3>
            <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <p className="text-white/90 leading-relaxed text-sm mb-4">
                <strong className="text-blue-300">TAMBUN RAYA</strong> merupakan sistem pengelolaan talenta aparatur terpadu yang dirancang khusus untuk mendukung pengembangan kompetensi dan karir aparatur di BBPOM Palangka Raya.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <svg className="w-4 h-4 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Tujuan Sistem
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Meningkatkan kompetensi aparatur",
                      "Mengoptimalkan pengelolaan talenta",
                      "Mendukung pengembangan karir",
                      "Meningkatkan akuntabilitas",
                      "Mewujudkan aparatur unggul"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-3 h-3 text-emerald-400 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white/80 text-xs">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <svg className="w-4 h-4 text-cyan-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Manfaat
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Data aparatur terintegrasi",
                      "Pemantauan kompetensi real-time",
                      "Perencanaan karir sistematis",
                      "Analisis kebutuhan SDM",
                      "Pengambilan keputusan berbasis data"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-3 h-3 text-cyan-400 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white/80 text-xs">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid - Lebih Kompak */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Fitur Utama</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  title: "Manajemen Kompetensi",
                  description: "Pemetaan kompetensi aparatur",
                  icon: "📊",
                  color: "border-blue-500/30"
                },
                {
                  title: "Perencanaan Karir",
                  description: "Monitoring jalur karir",
                  icon: "📈",
                  color: "border-emerald-500/30"
                },
                {
                  title: "Penilaian Kinerja",
                  description: "Evaluasi kinerja objektif",
                  icon: "🎯",
                  color: "border-amber-500/30"
                },
                {
                  title: "Pelatihan & Pengembangan",
                  description: "Program pengembangan",
                  icon: "🎓",
                  color: "border-violet-500/30"
                },
                {
                  title: "Analisis Data",
                  description: "Analisis kebutuhan SDM",
                  icon: "🔍",
                  color: "border-cyan-500/30"
                },
                {
                  title: "Laporan & Dashboard",
                  description: "Monitoring real-time",
                  icon: "📋",
                  color: "border-purple-500/30"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${feature.color} bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group`}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
                    {feature.icon}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 truncate">{feature.title}</h4>
                  <p className="text-slate-300 text-xs truncate">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vision & Mission - Lebih Singkat */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white mb-4">Visi & Misi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                <h4 className="text-base font-bold text-white mb-2 flex items-center">
                  <svg className="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                  Visi
                </h4>
                <p className="text-white/90 text-sm leading-relaxed">
                  "Mewujudkan aparatur yang kompeten, berintegritas, dan berkinerja unggul."
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
                <h4 className="text-base font-bold text-white mb-2 flex items-center">
                  <svg className="w-4 h-4 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Misi
                </h4>
                <ul className="space-y-1">
                  {[
                    "Sistem pengelolaan talenta terintegrasi",
                    "Peningkatan kompetensi aparatur",
                    "Transparansi dan akuntabilitas",
                    "Pengembangan karir berkelanjutan"
                  ].map((item, index) => (
                    <li key={index} className="text-white/80 text-xs flex items-start">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 mt-1"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Info - Lebih Singkat */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-white/70 text-xs mb-3">
              Sistem TAMBUN RAYA mendukung transformasi digital BBPOM Palangka Raya.
            </p>
            <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm font-medium">Inovasi untuk Pelayanan</span>
            </div>
          </div>
        </div>

        {/* Modal Footer - Lebih Kompak */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-transparent backdrop-blur-sm border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-xs text-white/70">
              <span className="font-semibold text-white">Versi 1.0</span> • {new Date().toLocaleDateString('id-ID')}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
              >
                Tutup
              </button>
              <button
                onClick={handleKeycloakLogin}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center text-sm group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 group-hover:translate-y-[-1px] transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Masuk Sistem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate)); }
          50% { transform: translateY(-20px) rotate(var(--tw-rotate)); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default LoginPage;