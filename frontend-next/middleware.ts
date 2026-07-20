import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const role = request.cookies.get('user_role');
  const { pathname } = request.nextUrl;

  // Protect /patient and /doctor routes
  if (pathname.startsWith('/patient') || pathname.startsWith('/doctor')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Role-based redirect if trying to access the wrong dashboard
    if (pathname.startsWith('/patient') && role?.value !== 'patient') {
      return NextResponse.redirect(new URL('/doctor', request.url));
    }
    if (pathname.startsWith('/doctor') && role?.value !== 'doctor' && role?.value !== 'admin') {
      return NextResponse.redirect(new URL('/patient', request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (token && role) {
      return NextResponse.redirect(new URL(`/${role.value}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/patient/:path*', '/doctor/:path*', '/login', '/register'],
};
