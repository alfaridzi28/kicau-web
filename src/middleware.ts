import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware KICAU — Auth check dilakukan di client side (localStorage).
 * Middleware ini hanya memastikan route /login tidak di-block.
 * Guard per-page dilakukan oleh useAuth() hook di masing-masing page.
 */
export function middleware(request: NextRequest) {
  // Biarkan semua request lewat — auth guard ada di client via useAuth()
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
