import { NextResponse } from 'next/server';

// Minimal pass-through middleware
// Auth is handled at the layout level via Clerk's auth() function
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Only run on specific paths, skip static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
