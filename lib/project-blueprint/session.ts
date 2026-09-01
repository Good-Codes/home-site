import { createHash, randomBytes, timingSafeEqual } from "crypto";

const COOKIE_NAME = "gc_pb_session";

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function createResumeToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  const secret = process.env.PROJECT_BLUEPRINT_SESSION_SECRET ?? "dev-insecure";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export function tokensMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function sessionExpiryDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
