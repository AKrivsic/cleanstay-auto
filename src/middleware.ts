import { NextRequest, NextResponse } from 'next/server';
import { isCleanStayEnabled } from './lib/env';

// Middleware for CleanStay feature routing and authentication
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if CleanStay is enabled
  if (!isCleanStayEnabled()) {
    // Block access to CleanStay routes when feature is disabled
    if (pathname.startsWith('/api/') && 
        (pathname.includes('/webhook/whatsapp') || 
         pathname.includes('/ai/parse') || 
         pathname.includes('/admin/'))) {
      return NextResponse.json(
        { error: 'CleanStay feature is disabled' },
        { status: 503 }
      );
    }

    // Block access to CleanStay dashboard routes
    if (pathname.startsWith('/(admin)') || pathname.startsWith('/(client)')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Route protection for admin dashboard
  if (pathname.startsWith('/(admin)')) {
    // TODO: Implement admin authentication check
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  // Route protection for client portal
  if (pathname.startsWith('/(client)')) {
    // TODO: Implement client authentication check
    // const isClient = await checkClientAuth(request);
    // if (!isClient) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  // API route protection
  if (pathname.startsWith('/api/admin/')) {
    // TODO: Implement admin API authentication
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
  }

  // WhatsApp webhook protection
  if (pathname.startsWith('/api/webhook/whatsapp')) {
    // TODO: Implement webhook signature verification
    // const isValidSignature = await verifyWebhookSignature(request);
    // if (!isValidSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    // }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Admin routes
    '/(admin)/:path*',
    // Client routes  
    '/(client)/:path*',
    // API routes
    '/api/webhook/:path*',
    '/api/ai/:path*',
    '/api/admin/:path*',
  ],
};
