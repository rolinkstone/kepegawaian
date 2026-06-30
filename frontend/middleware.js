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
        
        console.log(`✅ Access granted for ${path} - User: ${token.name}, Role: ${token.role}`);
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)',
  ],
};