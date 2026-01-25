import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal middleware - auth is handled at the layout level
// This avoids Edge runtime compatibility issues with Clerk modules
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
