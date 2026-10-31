export const DEVICE_COOKIE = 'device_id';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip');
}
