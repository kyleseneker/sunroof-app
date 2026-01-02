/**
 * API security utilities for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function validateCsrf(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return false;
  }

  const hasCustomHeader = 
    request.headers.has('x-requested-with') ||
    request.headers.has('x-sunroof-client');

  if (request.method === 'GET') {
    return true;
  }

  return hasCustomHeader;
}

export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!validateCsrf(request)) {
      console.warn('[Security] CSRF validation failed for:', request.url);
      return forbiddenResponse('Invalid request origin');
    }
    return handler(request);
  };
}

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
