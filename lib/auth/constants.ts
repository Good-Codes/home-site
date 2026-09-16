export const PASSWORD_MIN_LENGTH = 12;

export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX_HITS = 10;
/** Generous per-client cap for office NAT (signup / OAuth). */
export const AUTH_RATE_LIMIT_NAT_MAX_HITS = 30;

export const LOGIN_LOCKOUT_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = AUTH_RATE_LIMIT_WINDOW_MS;

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for that email, we have sent a reset link.";
