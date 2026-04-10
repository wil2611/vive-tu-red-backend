const revokedAfterByUserId = new Map<string, number>();

export function revokeAccessTokensForUser(
  userId: string,
  revokedAfterUnixSeconds = Math.floor(Date.now() / 1000),
): void {
  revokedAfterByUserId.set(userId, revokedAfterUnixSeconds);
}

export function clearAccessTokenRevocation(userId: string): void {
  revokedAfterByUserId.delete(userId);
}

export function isAccessTokenRevoked(
  userId: string,
  issuedAtUnixSeconds?: number,
): boolean {
  const revokedAfter = revokedAfterByUserId.get(userId);
  if (revokedAfter === undefined) {
    return false;
  }

  if (issuedAtUnixSeconds === undefined) {
    return true;
  }

  return issuedAtUnixSeconds <= revokedAfter;
}
