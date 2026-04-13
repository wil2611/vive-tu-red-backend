export const ACCESS_TOKEN_COOKIE_NAME = 'vtr_access';
export const REFRESH_TOKEN_COOKIE_NAME = 'vtr_refresh';

function splitCookieHeader(rawCookieHeader?: string): string[] {
  if (!rawCookieHeader) return [];
  return rawCookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function readCookieValue(
  rawCookieHeader: string | undefined,
  cookieName: string,
): string | null {
  for (const cookiePart of splitCookieHeader(rawCookieHeader)) {
    const separatorIndex = cookiePart.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = cookiePart.slice(0, separatorIndex).trim();
    if (key !== cookieName) continue;

    const value = cookiePart.slice(separatorIndex + 1).trim();
    if (!value) return null;

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}
