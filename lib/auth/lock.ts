export function isAccountLocked(input: {
  adminLocked?: boolean | null;
  lockedUntil?: Date | string | null;
}): boolean {
  if (input.adminLocked) return true;
  if (!input.lockedUntil) return false;
  const until =
    input.lockedUntil instanceof Date
      ? input.lockedUntil
      : new Date(input.lockedUntil);
  return until.getTime() > Date.now();
}
