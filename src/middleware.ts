import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old HTML files to Next.js routes
  const redirects: Record<string, string> = {
    '/index.html': '/',
    '/uklid-firem.html': '/uklid-firem',
    '/uklid-domacnosti.html': '/uklid-domacnosti',
    '/airbnb.html': '/airbnb',
    '/cenik.html': '/cenik',
  };

  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/index.html',
    '/uklid-firem.html',
    '/uklid-domacnosti.html',
    '/airbnb.html',
    '/cenik.html',
  ],
};
