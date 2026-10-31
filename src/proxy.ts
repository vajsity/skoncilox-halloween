import { NextResponse, type NextRequest } from 'next/server';
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE } from '@/lib/device';

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(DEVICE_COOKIE)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const deviceId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  const existingCookieHeader = requestHeaders.get('cookie');
  requestHeaders.set(
    'cookie',
    existingCookieHeader
      ? `${existingCookieHeader}; ${DEVICE_COOKIE}=${deviceId}`
      : `${DEVICE_COOKIE}=${deviceId}`
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
