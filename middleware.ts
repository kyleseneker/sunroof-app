import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // Auth is handled client-side for better mobile compatibility
  // Middleware can be extended for edge-level rate limiting, geo-blocking, etc.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match API routes if needed in the future
    '/api/:path*',
  ],
};
