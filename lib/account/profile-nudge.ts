export const PROFILE_NUDGE_DISMISS_KEY_PREFIX =
  "goodcode.account.profile-nudge-dismissed.";

export function profileNudgeDismissKey(userId: string): string {
  return `${PROFILE_NUDGE_DISMISS_KEY_PREFIX}${userId}`;
}

export function readProfileNudgeDismissed(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(profileNudgeDismissKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeProfileNudgeDismissed(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(profileNudgeDismissKey(userId), "1");
  } catch {
    // Private mode or blocked storage should not break the page.
  }
}
