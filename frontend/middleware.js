// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    console.log("🛡️ Middleware - Path:", path);
    console.log("🛡️ Middleware - Token present:", !!token);
    
    if (token) {
      // Role-based access control (multi-role: cek seluruh daftar role)
      const tokenRoles = Array.isArray(token.roles) && token.roles.length > 0
        ? token.roles
        : (token.role ? [token.role] : []);

      if (path.startsWith('/admin') && !tokenRoles.includes('admin')) {
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
        
        const isPublicPath = publicPaths.some(p => path.startsWith(p)) || path.includes('.');
        
        if (isPublicPath) {
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

        // Token ada tapi sudah tidak bisa diperbarui (refresh token kedaluwarsa):
        // minta login ulang supaya tidak terjebak "sudah login tapi semua API 401".
        if (token.error) {
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
    // /api/backend dikecualikan: proxy itu menangani auth sendiri dan harus
    // membalas JSON 401 (bukan redirect HTML ke /login) agar penanganan error
    // di klien tetap berjalan.
    '/((?!api/auth|api/backend|_next/static|_next/image|favicon.ico|images).*)',
  ],
};