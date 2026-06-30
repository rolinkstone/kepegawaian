// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Rate limiting sederhana berbasis IP
const rateLimitMap = new Map();

function rateLimit(req, limit = 20, windowMs = 15 * 60 * 1000) {
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= limit) {
    return false;
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    console.log("🛡️ Middleware - Path:", path);
    console.log("🛡️ Middleware - Token present:", !!token);
    
    // Rate limiting untuk endpoint login
    if (path.startsWith('/api/auth/callback') || path.startsWith('/api/auth/signin')) {
      if (!rateLimit(req, 10, 15 * 60 * 1000)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Proteksi /api/auth/providers - hanya boleh diakses saat login flow
    if (path === '/api/auth/providers' && token) {
      // Jika sudah login, tetap izinkan
      return NextResponse.next();
    }
    
    if (token) {
      // Role-based access control
      if (path.startsWith('/admin') && token.role !== 'admin') {
        const url = new URL('/unauthorized', req.url);
        return NextResponse.redirect(url);
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public paths - always accessible without auth
        const publicPaths = [
          '/login',
          '/_next',
          '/favicon.ico',
          '/images',
        ];
        
        // NextAuth endpoints yang WAJIB public untuk auth flow
        const nextAuthPublic = [
          '/api/auth/signin',
          '/api/auth/callback',
          '/api/auth/csrf',
          '/api/auth/session',
          '/api/auth/_log',
          '/api/auth/error',
          '/api/auth/verify-request',
        ];
        
        const isPublicPath = publicPaths.some(p => path.startsWith(p)) || path.includes('.');
        const isNextAuthPublic = nextAuthPublic.some(p => path.startsWith(p));
        
        if (isPublicPath || isNextAuthPublic) {
          return true;
        }
        
        // /api/auth/providers - sudah diproteksi di handler NextAuth
        if (path === '/api/auth/providers') {
          return true;
        }
        
        // /api/auth/csrf - sudah diproteksi di handler NextAuth
        if (path === '/api/auth/csrf') {
          return true;
        }
        
        // Home page - allow both authenticated and unauthenticated
        if (path === '/') {
          return true;
        }
        
        // Protected paths require authentication
        if (!token) {
          const url = new URL('/login', req.url);
          url.searchParams.set('callbackUrl', req.url);
          return NextResponse.redirect(url);
        }
        
        console.log(`✅ Access granted for ${path} - User: ${token.name}, Role: ${token.role}`);
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except public/static files.
     * Now also matches /api/auth/* for rate limiting & access control.
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};