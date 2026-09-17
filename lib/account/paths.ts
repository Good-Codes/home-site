export const ACCOUNT_DELETED_PATH = "/account-deleted";

export function isProtectedCustomerAccountPath(pathname: string): boolean {
  return pathname === "/account" || pathname.startsWith("/account/");
}

export function isProfileNudgeHiddenPath(pathname: string): boolean {
  if (isProtectedCustomerAccountPath(pathname)) return true;
  if (pathname === ACCOUNT_DELETED_PATH) return true;
  if (pathname.startsWith("/admin")) return true;
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}
