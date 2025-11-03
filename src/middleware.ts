import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for route protection (admin and client)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // TODO: Implement proper authentication check
    // For now, we'll simulate admin role check
    
    // Check for admin role in headers or cookies
    const adminRole = request.headers.get('x-admin-role') || 
                     request.cookies.get('admin-role')?.value;

    if (adminRole !== 'admin') {
      // Redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Add security headers for admin routes
    const response = NextResponse.next();
    
    // Prevent indexing of admin pages
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  // Check if the request is for portal routes
  if (pathname.startsWith('/portal')) {
    // TODO: Implement proper authentication check
    // For now, we'll simulate client role check
    
    // Check for client role in headers or cookies
    const clientRole = request.headers.get('x-client-role') || 
                       request.cookies.get('client-role')?.value;

    if (clientRole !== 'client') {
      // Redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Add security headers for client routes
    const response = NextResponse.next();
    
    // Prevent indexing of client pages
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
  ],
};