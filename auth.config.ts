import type { NextAuthConfig } from "next-auth";

import { useSecureAuthCookies } from "@/lib/auth/secure-cookies";
import { runtimeEnv } from "@/lib/env/runtime";

function authSecret(): string | undefined {
  const fromEnv = runtimeEnv("AUTH_SECRET");
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-not-used-at-runtime";
  }
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return "dev-only-insecure-auth-secret-min-32-chars";
}

export const authConfig = {
  secret: authSecret(),
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureAuthCookies(),
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const role = "role" in user ? user.role : undefined;
        if (role === "CUSTOMER" || role === "ADMIN") {
          token.role = role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (typeof token.id === "string" ? token.id : undefined) ?? token.sub ?? "";
        const role = token.role;
        session.user.role =
          role === "CUSTOMER" || role === "ADMIN" ? role : "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
