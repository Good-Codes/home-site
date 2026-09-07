export type AppRole = "CUSTOMER" | "ADMIN";

export function isStaffRole(
  role: AppRole | string | null | undefined,
): boolean {
  return role === "ADMIN";
}

export function defaultPostLoginPath(
  role: AppRole | string | null | undefined,
): string {
  return isStaffRole(role)
    ? "/admin/project-blueprint"
    : "/custom-software-estimator";
}
