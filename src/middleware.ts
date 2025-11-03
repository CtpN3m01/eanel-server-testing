import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/', '/forgot-password', '/reset-password'];

  // Check if the route is public
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Admin-only routes: /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // User routes: /home
  // Users can access /home, admins can access everything
  if (pathname.startsWith('/home') && payload.role === 'admin') {
    // Admins can access user routes too
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
