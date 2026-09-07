export type AppRole = "CUSTOMER" | "REVIEWER" | "ADMIN" | "APPROVER";

export function isStaffRole(
  role: AppRole | string | null | undefined,
): boolean {
  return role === "REVIEWER" || role === "ADMIN" || role === "APPROVER";
}

export function defaultPostLoginPath(
  role: AppRole | string | null | undefined,
): string {
  return isStaffRole(role)
    ? "/admin/project-blueprint"
    : "/custom-software-estimator";
}
